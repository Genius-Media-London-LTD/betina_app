// BETina News desk — Supabase Edge Function (Deno), every 2 min via pg_cron
// (job "news-desk", scheduled with the statement at the end of 018_news_desk_claim.sql).
//
// BETina writes her own sports news. Each run:
// 1. Ingest: every outlet's current items in every language from betina-server
//    (/v1/pool) land in news_stories as 'new'.
// 2. Dedupe: Claude matches new items against stories we already have — also
//    across languages (Sportschau and BBC on the same transfer = one story).
// 3. Write: for the newest unique stories, betina-server extracts the source
//    article and Claude writes an original BETina News article from its facts
//    in every app language (kicker, headline, teaser, body, BETina's take).
// 4. Old stories (> KEEP_DAYS) are deleted.
// The app reads the feed via news_feed() (017_news_desk.sql).
//
// Deploy: supabase functions deploy news-desk --no-verify-jwt
// Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
// Public endpoint: news_desk_claim() lets through one run per MIN_GAP_S.

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;

const GATEWAY = 'https://api.betina.geniusbet.com/v1';
const MODEL = 'claude-haiku-5-5';
const MIN_GAP_S = 110;
const MAX_AGE_MS = 48 * 3_600_000;  // only ingest items from the last 2 days
const KEEP_DAYS = 21;
const STORIES_PER_RUN = 12;
const PARALLEL = 24;                // concurrent Claude calls
const DEDUPE_CHUNK = 120;
const RUN_BUDGET_MS = 110_000;      // stop starting new work after this

// App languages (TR/HR are written ahead of the app supporting them).
const LANGS: Record<string, string> = {
  en: 'English', de: 'German', es: 'Spanish (Spain)', fr: 'French', pt: 'Portuguese (Portugal)',
  it: 'Italian', ro: 'Romanian', tr: 'Turkish', hr: 'Croatian',
};
const SPORTS = [
  'football', 'tennis', 'basketball', 'cricket', 'rugby', 'athletics', 'golf', 'nfl', 'mma', 'boxing',
  'motorsport', 'cycling', 'hockey', 'handball', 'wintersport', 'esports', 'other',
];

type PoolItem = { title: string; description: string; link: string; pubDate: string | null; image: string | null; source: string; lang: string };
type Story = { id: number; source_url: string; source_name: string; source_lang: string; source_title: string; source_teaser: string | null; image: string | null };
type Written = {
  skip: boolean; kicker: string; headline: string; teaser: string; body: string[]; take: string;
  sport: string; competition: string; teams: string[]; region: string; importance: number;
};

const client = new Anthropic();

// ── tiny concurrency limiter ─────────────────────────────────────────────────
let active = 0;
const queue: (() => void)[] = [];
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= PARALLEL) await new Promise<void>((r) => queue.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

async function claudeJson<T>(system: string, user: string, schema: object, maxTokens: number): Promise<T | null> {
  return limited(async () => {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        // @ts-ignore: output_config is newer than some SDK type definitions
        output_config: { effort: 'low', format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content: user }],
      });
      if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') return null;
      const text = res.content.find((b) => b.type === 'text');
      return text && text.type === 'text' ? (JSON.parse(text.text) as T) : null;
    } catch (err) {
      console.error('claude:', (err as Error).message);
      return null;
    }
  });
}

// ── 1. Ingest ────────────────────────────────────────────────────────────────
async function ingest(db: Db) {
  const r = await fetch(`${GATEWAY}/pool`, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`pool ${r.status}`);
  const { items } = (await r.json()) as { items: PoolItem[] };
  const cutoff = Date.now() - MAX_AGE_MS;
  const rows = items
    .filter((it) => it.title && it.link && it.pubDate && Date.parse(it.pubDate) >= cutoff)
    .map((it) => ({
      source_url: it.link,
      source_name: it.source,
      source_lang: it.lang,
      source_title: it.title,
      source_teaser: it.description || null,
      image: it.image,
      published_at: it.pubDate,
    }));
  const { error, count } = await db.from('news_stories')
    .upsert(rows, { onConflict: 'source_url', ignoreDuplicates: true, count: 'exact' });
  if (error) throw new Error(`ingest: ${error.message}`);
  return count ?? 0;
}

// ── 2. Dedupe ────────────────────────────────────────────────────────────────
const DEDUPE_SYSTEM = `You sort incoming sports news for a newsroom. Headlines come from outlets in different languages.
For every NEW item decide whether it reports the same specific news event as one of the KNOWN stories or as an earlier NEW item in the list (same match report, same transfer, same injury, same press-conference statement, same death, ...). Same team or same competition alone is NOT the same event; two different matches of the same club are different stories.
Return duplicate_of = the id it duplicates, or 0 if it is a separate story. Be conservative: only mark clear duplicates.`;

const DEDUPE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'integer' }, duplicate_of: { type: 'integer' } },
        required: ['id', 'duplicate_of'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

async function dedupe(db: Db, deadline: number) {
  const { data: fresh } = await db.from('news_stories').select('id, source_title')
    .eq('status', 'new').order('published_at', { ascending: true }).limit(1000);
  if (!fresh?.length) return { pending: 0, duplicates: 0 };

  // Known stories of the last days, by their English headline once written.
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const { data: known } = await db.from('news_stories')
    .select('id, source_title, news_articles(headline, lang)')
    .in('status', ['pending', 'ready']).gte('published_at', since)
    .order('published_at', { ascending: false }).limit(800);
  const knownList = (known ?? []).map((k) => ({
    id: k.id as number,
    title: ((k.news_articles as { headline: string; lang: string }[] | null) ?? []).find((a) => a.lang === 'en')?.headline ?? (k.source_title as string),
  }));

  let pending = 0;
  let duplicates = 0;
  for (let i = 0; i < fresh.length && Date.now() < deadline; i += DEDUPE_CHUNK) {
    const chunk = fresh.slice(i, i + DEDUPE_CHUNK) as { id: number; source_title: string }[];
    const ids = new Set(chunk.map((c) => c.id));
    const knownIds = new Set(knownList.map((k) => k.id));
    const out = await claudeJson<{ items: { id: number; duplicate_of: number }[] }>(
      DEDUPE_SYSTEM,
      `KNOWN:\n${knownList.map((k) => `${k.id}: ${k.title}`).join('\n') || '(none)'}\n\nNEW:\n${chunk.map((c) => `${c.id}: ${c.source_title}`).join('\n')}`,
      DEDUPE_SCHEMA,
      16_000,
    );
    if (!out) break; // leave them 'new', next run retries

    const dupOf = new Map<number, number>();
    for (const it of out.items) {
      if (ids.has(it.id) && it.duplicate_of && it.duplicate_of !== it.id && (knownIds.has(it.duplicate_of) || ids.has(it.duplicate_of))) {
        dupOf.set(it.id, it.duplicate_of);
      }
    }
    // Resolve chains (A dup of B dup of C → A dup of C); a loop means "unique".
    const root = (id: number) => {
      const seen = new Set<number>();
      let cur = id;
      while (dupOf.has(cur) && !seen.has(cur)) { seen.add(cur); cur = dupOf.get(cur)!; }
      return dupOf.has(cur) ? id : cur;
    };
    const dupRows: { id: number; root: number }[] = [];
    const uniqueIds: number[] = [];
    for (const c of chunk) {
      const r = root(c.id);
      if (r === c.id) uniqueIds.push(c.id);
      else dupRows.push({ id: c.id, root: r });
    }
    if (uniqueIds.length) await db.from('news_stories').update({ status: 'pending' }).in('id', uniqueIds);
    await Promise.all(dupRows.map((d) =>
      db.from('news_stories').update({ status: 'duplicate', duplicate_of: d.root }).eq('id', d.id)));
    for (const c of chunk) if (uniqueIds.includes(c.id)) knownList.push({ id: c.id, title: c.source_title });
    pending += uniqueIds.length;
    duplicates += dupRows.length;
  }
  return { pending, duplicates };
}

// ── 3. Write ─────────────────────────────────────────────────────────────────
const writeSystem = (language: string) => `You are the writer of BETina News, the sports news section of BETina, a sports companion app. You write in ${language}.
From the SOURCE material, write an original news article in your own words, in the style of a top sports news site (ESPN, BILD Sport, Marca): punchy, vivid, energetic, but accurate.

Facts:
- Use only facts that are in the SOURCE. Never invent quotes, numbers, scores, dates, injuries, fees or reactions. Well-established general background (what a competition is, a club's home city, a player's position) is fine when you are certain.
- Quotes from the SOURCE may be used, attributed to the person who said them. Never name or mention the outlet the source comes from (no "according to BBC"/"told Sky Sports"); write as BETina News.
- Rephrase everything; do not copy sentences from the SOURCE.

Article:
- kicker: 1-3 words above the headline, usually the competition or topic (e.g. "BUNDESLIGA", "TRANSFER", "CHAMPIONS LEAGUE", "TENNIS"), in ${language}.
- headline: max 75 characters, strong and concrete like a sports site front page, no clickbait that the text doesn't deliver, no question headlines unless the story is open.
- teaser: 1-2 sentences, max 220 characters, the core of the story.
- body: a full article of 7 to 10 paragraphs and 450-650 words. Start with the news, then the details, quotes and background from the SOURCE, the context (form, table situation, history, what is at stake) and finally what it means / what comes next. Use all the facts the SOURCE offers. Only when the SOURCE is short: at least 5 paragraphs and about 280 words, never filler or invention.
- take: "BETina's take": 1-2 short sentences in first person, BETina's own fan opinion — cheeky, warm, witty. On deaths, serious injuries, illness or tragedy: respectful and kind, no jokes.
- Plain text only, no markdown, no emojis in headline/teaser/body (one emoji allowed in take).

Never: betting, odds, bookmakers, tips, wagers or predictions-for-money; no gambling language at all.

Set skip = true (and the text fields to empty strings / empty list) when the SOURCE is: about betting/gambling/odds, a quiz, a podcast or video page, a live blog or ticker without a real story, an advert, not about sport, or too thin to write a real article (just a headline with no facts).

Classify: sport (one of the given values), competition (short English name, e.g. "Premier League", "Bundesliga", "ATP Tour", "" if none), teams (clubs/national teams involved, common English names, e.g. "Bayern Munich", "Real Madrid"; for individual sports the athletes' names), region (ISO 3166 alpha-2 country the story mainly concerns, e.g. "DE", "GB", "ES"; "INT" for international competitions or global stars), importance (1 = local/minor, 2 = normal league news, 3 = notable in its country, 4 = big international story, 5 = world news everyone talks about).`;

const WRITE_SCHEMA = {
  type: 'object',
  properties: {
    skip: { type: 'boolean' },
    kicker: { type: 'string' },
    headline: { type: 'string' },
    teaser: { type: 'string' },
    body: { type: 'array', items: { type: 'string' } },
    take: { type: 'string' },
    sport: { type: 'string', enum: SPORTS },
    competition: { type: 'string' },
    teams: { type: 'array', items: { type: 'string' } },
    region: { type: 'string' },
    importance: { type: 'integer' },
  },
  required: ['skip', 'kicker', 'headline', 'teaser', 'body', 'take', 'sport', 'competition', 'teams', 'region', 'importance'],
  additionalProperties: false,
};

async function sourceMaterial(s: Story): Promise<{ text: string; image: string | null }> {
  let paragraphs: string[] = [];
  let image: string | null = null;
  try {
    const r = await fetch(`${GATEWAY}/article?url=${encodeURIComponent(s.source_url)}`, { signal: AbortSignal.timeout(20_000) });
    if (r.ok) {
      const a = await r.json();
      paragraphs = Array.isArray(a.paragraphs) ? a.paragraphs.filter((p: unknown) => typeof p === 'string') : [];
      image = typeof a.image === 'string' && a.image.startsWith('https://') ? a.image : null;
    }
  } catch (err) {
    console.error('article:', s.source_url, (err as Error).message);
  }
  const text = [`HEADLINE: ${s.source_title}`, s.source_teaser ? `TEASER: ${s.source_teaser}` : '', paragraphs.join('\n\n')]
    .filter(Boolean).join('\n\n').slice(0, 14_000);
  return { text, image };
}

/**
 * True when the article is still in the SOURCE's language: its short function
 * words ("der", "und", "the", "că", …) mostly occur in the source as well.
 * Across languages that share is low, even for close pairs like es/pt.
 */
function copiesSource(w: Written, source: string) {
  const srcWords = new Set(source.toLowerCase().match(/\p{L}+/gu) ?? []);
  const small = (w.body.join(' ').toLowerCase().match(/\p{L}+/gu) ?? []).filter((x) => x.length >= 2 && x.length <= 4);
  if (small.length < 30) return false;
  return small.filter((x) => srcWords.has(x)).length / small.length > 0.65;
}

const clean = (s: string) => s.replace(/\*\*|__|^#+\s*/gm, '').trim();

function valid(w: Written | null): w is Written {
  return Boolean(w && !w.skip && w.headline?.trim() && w.teaser?.trim() && Array.isArray(w.body) && w.body.filter((p) => p.trim()).length >= 3);
}

async function writeStory(db: Db, s: Story) {
  const { data: have } = await db.from('news_articles').select('lang').eq('story_id', s.id);
  const missing = Object.keys(LANGS).filter((l) => !(have ?? []).some((h) => h.lang === l));
  const { text, image } = await sourceMaterial(s);
  const write = async (lang: string) => {
    const w = await claudeJson<Written>(
      writeSystem(LANGS[lang]),
      `SOURCE (language: ${s.source_lang}):\n${text}\n\nWrite the article in ${LANGS[lang]}. Every text field (kicker, headline, teaser, body, take) must be in ${LANGS[lang]}, even though the SOURCE may be in another language.`,
      WRITE_SCHEMA,
      10_000,
    );
    // The model sometimes keeps the source language; such a text counts as failed.
    return w && !w.skip && lang !== s.source_lang && copiesSource(w, text) ? null : w;
  };

  // English first: it decides skip and carries the classification.
  let meta: Written | null = null;
  if (missing.includes('en')) {
    const en = await write('en');
    if (en?.skip) {
      await db.from('news_stories').update({ status: 'skipped' }).eq('id', s.id);
      return 'skipped';
    }
    if (!valid(en)) {
      await failOrRetry(db, s.id);
      return 'retry';
    }
    meta = en;
    await save(db, s.id, 'en', en);
  }

  const others = missing.filter((l) => l !== 'en');
  const results = await Promise.all(others.map(async (l) => {
    const w = await write(l);
    if (!valid(w)) return false;
    await save(db, s.id, l, w);
    return true;
  }));

  // The story goes live once English exists. Languages that failed are
  // retried by later runs (news_partial_stories) up to 3 attempts.
  const complete = results.every(Boolean);
  const update: Record<string, unknown> = { status: 'ready' };
  if (!complete) {
    const { data: row } = await db.from('news_stories').select('attempts').eq('id', s.id).single();
    update.attempts = (row?.attempts ?? 0) + 1;
  }
  if (meta) {
    const region = meta.region?.trim().toUpperCase() ?? '';
    update.sport = SPORTS.includes(meta.sport) ? meta.sport : 'other';
    update.competition = meta.competition?.trim() || null;
    update.teams = (meta.teams ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8);
    update.region = /^([A-Z]{2}|INT)$/.test(region) ? region : null;
    update.importance = Math.min(5, Math.max(1, Math.round(Number(meta.importance) || 2)));
    if (image) update.image = image;
  }
  await db.from('news_stories').update(update).eq('id', s.id);
  return complete ? 'written' : 'partial';
}

async function save(db: Db, id: number, lang: string, w: Written) {
  const { error } = await db.from('news_articles').upsert({
    story_id: id,
    lang,
    kicker: clean(w.kicker).toUpperCase().slice(0, 40),
    headline: clean(w.headline).slice(0, 140),
    teaser: clean(w.teaser).slice(0, 320),
    body: w.body.map(clean).filter(Boolean),
    take: clean(w.take) || null,
  }, { onConflict: 'story_id,lang' });
  if (error) console.error('save article:', error.message);
}

async function failOrRetry(db: Db, id: number) {
  const { data: row } = await db.from('news_stories').select('attempts').eq('id', id).single();
  const attempts = (row?.attempts ?? 0) + 1;
  await db.from('news_stories').update({ attempts, status: attempts >= 3 ? 'failed' : 'pending' }).eq('id', id);
}

async function writeBatch(db: Db, deadline: number) {
  if (Date.now() > deadline) return {};
  // Newest first. Also stories that are visible but still miss languages.
  const { data: pending } = await db.from('news_stories')
    .select('id, source_url, source_name, source_lang, source_title, source_teaser, image')
    .eq('status', 'pending').lt('attempts', 3)
    .order('published_at', { ascending: false }).limit(STORIES_PER_RUN);
  let todo = (pending ?? []) as Story[];
  if (todo.length < STORIES_PER_RUN) {
    const { data: partial } = await db.rpc('news_partial_stories', { p_langs: Object.keys(LANGS), p_limit: STORIES_PER_RUN - todo.length });
    todo = todo.concat((partial ?? []) as Story[]);
  }
  const outcomes = await Promise.all(todo.map((s) => writeStory(db, s).catch((err) => {
    console.error('write story', s.id, (err as Error).message);
    return 'error';
  })));
  return outcomes.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o]: (acc[o] ?? 0) + 1 }), {});
}

// ── entry ────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const started = Date.now();
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: claimed, error } = await db.rpc('news_desk_claim', { p_min_seconds: MIN_GAP_S });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!claimed) return Response.json({ skipped: 'too_soon' });

  const deadline = started + RUN_BUDGET_MS;
  const report: Record<string, unknown> = {};
  try {
    report.ingested = await ingest(db);
  } catch (err) {
    report.ingest_error = (err as Error).message;
  }
  report.dedupe = await dedupe(db, started + 50_000);
  report.written = await writeBatch(db, deadline);
  const { count } = await db.from('news_stories')
    .delete({ count: 'exact' }).lt('published_at', new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString());
  report.deleted = count ?? 0;
  report.ms = Date.now() - started;
  console.log(JSON.stringify(report));
  return Response.json(report);
});
