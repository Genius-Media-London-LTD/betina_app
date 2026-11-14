// BETina on Telegram — Supabase Edge Function (Deno), Telegram's webhook.
//
// Anyone can chat with BETina in a private Telegram chat: same persona as the
// app chat (telegramPrompt in _shared/betina-persona.ts), same sports tools,
// but no app account behind it — no GeniusBet account data, no Tippspiel, no
// reminders. The conversation and what she remembers live in telegram_chats
// (migration 031); /forget deletes it.
//
//   /start   hello          /help    what she can do
//   /reset   new chat       /forget  delete everything she knows about you
//   /app     where to get the BETina app
//
// Limits: private chats only, text only, DAILY_LIMIT messages per person a day.
//
// Deploy: supabase functions deploy telegram-bot   (verify_jwt = false, config.toml)
// Env:    TELEGRAM_BOT_TOKEN (from @BotFather), ANTHROPIC_API_KEY,
//         SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Setup:  open <SUPABASE_URL>/functions/v1/telegram-bot?setup=1 once after the
//         token is set — it registers the webhook and the command menu. The
//         webhook secret is derived from the bot token, so only Telegram
//         (which got it from us) can call the webhook.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MatchEvent, NewsItem, telegramPrompt } from '../_shared/betina-persona.ts';
import { parseMarkers } from '../chat/cards.ts';

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;
type Turn = { role: 'user' | 'assistant'; content: string };
type Chat = {
  chat_id: number; first_name: string | null; lang: string; history: Turn[]; memories: string[];
  msg_day: string; msg_count: number; msg_total: number;
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const MODEL = 'claude-haiku-5-5';
const API = 'https://api.betina.geniusbet.com';
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MAX_TOOL_ROUNDS = 5;
const HISTORY_TURNS = 24;
const MAX_MEMORIES = 30;
const MAX_INPUT = 1500;          // characters of one message we pass on
const DAILY_LIMIT = 40;          // messages per person per day
const LANGS = ['en', 'de', 'es', 'pt', 'fr', 'it', 'ro', 'tr', 'hr'];

const TEXT: Record<string, Record<string, string>> = {
  limit: {
    en: "That's a lot of chatting for one day 😄 I'm back tomorrow — or keep going in the BETina app: betina.geniusbet.com",
    de: 'Das war heute ganz schön viel Gequatsche 😄 Morgen bin ich wieder da — oder mach in der BETina App weiter: betina.geniusbet.com',
    es: 'Hoy hemos hablado un montón 😄 Mañana vuelvo — o sigue en la app de BETina: betina.geniusbet.com',
    pt: 'Hoje já falámos imenso 😄 Amanhã estou de volta — ou continua na app da BETina: betina.geniusbet.com',
    fr: "On a beaucoup papoté aujourd'hui 😄 Je reviens demain — ou continue dans l'app BETina : betina.geniusbet.com",
    it: "Oggi abbiamo chiacchierato tantissimo 😄 Torno domani — oppure continua nell'app BETina: betina.geniusbet.com",
    ro: 'Azi am vorbit o grămadă 😄 Revin mâine — sau continuă în aplicația BETina: betina.geniusbet.com',
    tr: 'Bugün epey sohbet ettik 😄 Yarın yine buradayım — ya da BETina uygulamasında devam et: betina.geniusbet.com',
    hr: 'Danas smo se baš napričali 😄 Sutra sam opet tu — ili nastavi u BETina aplikaciji: betina.geniusbet.com',
  },
  textOnly: {
    en: 'Here on Telegram I can only read text for now 🙈 Write it to me!',
    de: 'Hier auf Telegram kann ich im Moment nur Text lesen 🙈 Schreib es mir!',
    es: 'Aquí en Telegram por ahora solo leo texto 🙈 ¡Escríbemelo!',
    pt: 'Aqui no Telegram, por agora, só leio texto 🙈 Escreve-me!',
    fr: 'Ici sur Telegram, je ne lis que le texte pour le moment 🙈 Écris-le-moi !',
    it: 'Qui su Telegram per ora leggo solo testo 🙈 Scrivimelo!',
    ro: 'Aici pe Telegram pot citi deocamdată doar text 🙈 Scrie-mi!',
    tr: 'Telegram’da şimdilik sadece yazı okuyabiliyorum 🙈 Bana yaz!',
    hr: 'Ovdje na Telegramu zasad čitam samo tekst 🙈 Napiši mi!',
  },
  forgot: {
    en: "Done — I've deleted our chat and everything I remembered about you. Write me anytime to start fresh.",
    de: 'Erledigt — ich habe unseren Chat und alles, was ich mir über dich gemerkt habe, gelöscht. Schreib mir jederzeit, dann fangen wir neu an.',
    es: 'Hecho — he borrado nuestro chat y todo lo que recordaba de ti. Escríbeme cuando quieras para empezar de cero.',
    pt: 'Feito — apaguei a nossa conversa e tudo o que me lembrava de ti. Escreve-me quando quiseres para recomeçar.',
    fr: "C'est fait — j'ai supprimé notre conversation et tout ce que je retenais sur toi. Écris-moi quand tu veux pour repartir de zéro.",
    it: 'Fatto — ho cancellato la nostra chat e tutto ciò che ricordavo di te. Scrivimi quando vuoi per ricominciare.',
    ro: 'Gata — am șters conversația noastră și tot ce țineam minte despre tine. Scrie-mi oricând ca să o luăm de la capăt.',
    tr: 'Tamam — sohbetimizi ve senin hakkında hatırladığım her şeyi sildim. Baştan başlamak için istediğin zaman yaz.',
    hr: 'Gotovo — izbrisala sam naš razgovor i sve što sam zapamtila o tebi. Piši mi kad god želiš pa krećemo ispočetka.',
  },
  reset: {
    en: 'Fresh start ✨ What’s on your mind?',
    de: 'Neuer Anfang ✨ Was gibt’s?',
    es: 'Empezamos de nuevo ✨ ¿Qué me cuentas?',
    pt: 'Começamos de novo ✨ O que me contas?',
    fr: 'On repart de zéro ✨ Quoi de neuf ?',
    it: 'Si riparte ✨ Che mi racconti?',
    ro: 'O luăm de la capăt ✨ Ce mai e nou?',
    tr: 'Yeni bir başlangıç ✨ Aklında ne var?',
    hr: 'Krećemo ispočetka ✨ Što ima?',
  },
  app: {
    en: 'The BETina app is free — voice calls with me, live match alerts, news and a prediction game where you can beat me:\nbetina.geniusbet.com',
    de: 'Die BETina App ist gratis — mit mir telefonieren, Live-Alarme zu Spielen, News und ein Tippspiel, in dem du mich schlagen kannst:\nbetina.geniusbet.com',
    es: 'La app de BETina es gratis — llamadas de voz conmigo, alertas de partidos en vivo, noticias y un juego de pronósticos donde puedes ganarme:\nbetina.geniusbet.com',
    pt: 'A app da BETina é grátis — chamadas de voz comigo, alertas de jogos ao vivo, notícias e um jogo de palpites onde me podes vencer:\nbetina.geniusbet.com',
    fr: "L'app BETina est gratuite — appels vocaux avec moi, alertes de matchs en direct, actus et un jeu de pronostics où tu peux me battre :\nbetina.geniusbet.com",
    it: "L'app BETina è gratis — chiamate vocali con me, avvisi live sulle partite, news e un gioco di pronostici in cui puoi battermi:\nbetina.geniusbet.com",
    ro: 'Aplicația BETina e gratuită — apeluri vocale cu mine, alerte live de la meciuri, știri și un joc de pronosticuri în care mă poți bate:\nbetina.geniusbet.com',
    tr: 'BETina uygulaması ücretsiz — benimle sesli sohbet, canlı maç bildirimleri, haberler ve beni yenebileceğin bir tahmin oyunu:\nbetina.geniusbet.com',
    hr: 'BETina aplikacija je besplatna — glasovni pozivi sa mnom, live obavijesti s utakmica, vijesti i igra prognoza u kojoj me možeš pobijediti:\nbetina.geniusbet.com',
  },
  declined: {
    en: "Ha, that one's not for me 🙈 Ask me something else!",
    de: 'Haha, da bin ich raus 🙈 Frag mich was anderes!',
    es: 'Jaja, eso no es lo mío 🙈 ¡Pregúntame otra cosa!',
    pt: 'Haha, nisso não entro 🙈 Pergunta-me outra coisa!',
    fr: 'Haha, là je passe 🙈 Demande-moi autre chose !',
    it: 'Ahah, su questo passo 🙈 Chiedimi altro!',
    ro: 'Haha, aici nu mă bag 🙈 Întreabă-mă altceva!',
    tr: 'Haha, o konu bana göre değil 🙈 Bana başka bir şey sor!',
    hr: 'Haha, tu se ne miješam 🙈 Pitaj me nešto drugo!',
  },
  error: {
    en: 'Oops, I lost the thread for a second 🙈 Send that again?',
    de: 'Ups, da habe ich kurz den Faden verloren 🙈 Schickst du das nochmal?',
    es: 'Ups, perdí el hilo un segundo 🙈 ¿Me lo mandas otra vez?',
    pt: 'Ups, perdi o fio por um segundo 🙈 Mandas outra vez?',
    fr: "Oups, j'ai perdu le fil une seconde 🙈 Tu me le renvoies ?",
    it: 'Ops, ho perso il filo un attimo 🙈 Me lo rimandi?',
    ro: 'Ups, am pierdut firul o secundă 🙈 Îmi mai trimiți o dată?',
    tr: 'Ups, bir an ipin ucunu kaçırdım 🙈 Tekrar gönderir misin?',
    hr: 'Ups, na trenutak sam izgubila nit 🙈 Pošalješ opet?',
  },
};
const t = (key: string, lang: string) => TEXT[key][lang] ?? TEXT[key].en;

// What BotFather's command menu shows.
const COMMANDS = [
  { command: 'start', description: 'Say hi to BETina' },
  { command: 'help', description: 'What BETina can do' },
  { command: 'app', description: 'Get the free BETina app' },
  { command: 'reset', description: 'Start a new chat' },
  { command: 'forget', description: 'Delete everything BETina knows about you' },
];

// ── Telegram ─────────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function tg(method: string, body: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${TG}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return await r.json().catch(() => ({ ok: false }));
}

/** The webhook secret Telegram sends back with every update — derived, so there is no second secret to set. */
async function webhookSecret(): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`betina-telegram-webhook:${BOT_TOKEN}`));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Reply buttons from BETina's chips: tapping one sends it as the person's next message. */
function keyboard(chips: string[]) {
  if (!chips.length) return { remove_keyboard: true };
  return { keyboard: chips.map((c) => [{ text: c }]), resize_keyboard: true, one_time_keyboard: true };
}

async function send(chatId: number, text: string, chips: string[] = []) {
  await tg('sendMessage', {
    chat_id: chatId, text: text.slice(0, 4000), reply_markup: keyboard(chips),
    link_preview_options: { is_disabled: true },
  });
}

// ── Tools (the app chat's sports tools, without anything tied to an account) ──

const TOOLS = [
  { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
  { name: 'search_team', description: 'Find a sports team by name across ANY sport to get its id, sport and league. Call this first for a team you do not already have an id for.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_fixtures', description: "A team's upcoming matches. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_results', description: "A team's recent finished matches with scores. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_live_scores', description: "Football live scores right now, plus today's and yesterday's results and kick-off times with goal scorers (real time). Use it first for any football score question. Optional query: team, league or country; empty for the biggest live games.", input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: [] } },
  { name: 'get_news', description: 'Latest sports headlines. Optional sport filter.', input_schema: { type: 'object', properties: { sport: { type: 'string' } }, required: [] } },
  { name: 'remember_fact', description: 'Save a lasting fact/preference the person shares so you recall it next time. Only worthwhile things, not small talk. Never save contact details, passwords or anything about money.', input_schema: { type: 'object', properties: { fact: { type: 'string' } }, required: ['fact'] } },
];

function compactMatch(e: MatchEvent) {
  return { home: e.home, away: e.away, score: e.homeScore != null && e.awayScore != null ? `${e.homeScore}-${e.awayScore}` : null, date: e.date, time: e.time ? e.time.slice(0, 5) : null, league: e.league };
}

// deno-lint-ignore no-explicit-any
async function runTool(name: string, input: any, db: Db, chat: Chat): Promise<string> {
  try {
    if (name === 'search_team') {
      const d = await (await fetch(`${API}/v1/sports/teams?t=${encodeURIComponent(String(input.query ?? ''))}`)).json();
      // deno-lint-ignore no-explicit-any
      return JSON.stringify((d.teams ?? []).slice(0, 5).map((x: any) => ({ id: x.idTeam, name: x.strTeam, sport: x.strSport, league: x.strLeague })));
    }
    if (name === 'get_fixtures' || name === 'get_results') {
      const id = encodeURIComponent(String(input.team_id ?? ''));
      const d = await (await fetch(`${API}/v1/sports/team/${id}/${name === 'get_fixtures' ? 'next' : 'last'}`)).json();
      return JSON.stringify((d.events ?? []).slice(0, 5).map(compactMatch));
    }
    if (name === 'get_live_scores') {
      const r = await fetch(`${API}/v1/live/find?q=${encodeURIComponent(String(input.query ?? ''))}`);
      return (await r.json()).answer ?? 'No live data right now.';
    }
    if (name === 'get_news') {
      const sport = typeof input.sport === 'string' && input.sport && input.sport !== 'sport' ? input.sport : null;
      const { data } = await db.rpc('news_feed', { p_lang: chat.lang, p_sport: sport, p_team: null, p_before: null, p_before_id: null, p_limit: 8 });
      // deno-lint-ignore no-explicit-any
      if (data?.length) return JSON.stringify((data as any[]).map((n) => ({ headline: n.headline, teaser: n.teaser, published_at: n.published_at })));
      const d = await (await fetch(`${API}/v1/news?sport=${encodeURIComponent(sport ?? 'sport')}&count=8&lang=${encodeURIComponent(chat.lang)}`)).json();
      return JSON.stringify((d.items ?? []).slice(0, 8).map((n: NewsItem) => n.title));
    }
    if (name === 'remember_fact') {
      const fact = String(input.fact ?? '').trim().slice(0, 300);
      if (!fact) return 'Nothing to save.';
      chat.memories = [...chat.memories.filter((m) => m !== fact), fact].slice(-MAX_MEMORIES);
      const { error } = await db.from('telegram_chats').update({ memories: chat.memories }).eq('chat_id', chat.chat_id);
      return error ? 'Could not save.' : 'Saved.';
    }
    return 'Unknown tool.';
  } catch {
    return 'That lookup failed — no data right now.';
  }
}

// deno-lint-ignore no-explicit-any
async function callClaude(system: string, messages: any[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, output_config: { effort: 'low' }, system, tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  return await res.json();
}

/** BETina's answer to the conversation so far: text + follow-up chips. */
async function answer(db: Db, chat: Chat, turns: Turn[]): Promise<{ text: string; chips: string[] }> {
  const system = telegramPrompt({
    name: chat.first_name || 'friend', lang: chat.lang, memories: chat.memories,
    now: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });
  // deno-lint-ignore no-explicit-any
  const messages: any[] = turns.map((m) => ({ role: m.role, content: m.content }));
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await callClaude(system, messages);
    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }
    if (response.stop_reason === 'tool_use') {
      // deno-lint-ignore no-explicit-any
      const uses = (response.content ?? []).filter((b: any) => b.type === 'tool_use');
      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        // deno-lint-ignore no-explicit-any
        content: await Promise.all(uses.map(async (u: any) => ({ type: 'tool_result', tool_use_id: u.id, content: await runTool(u.name, u.input ?? {}, db, chat) }))),
      });
      continue;
    }
    // deno-lint-ignore no-explicit-any
    const raw = (response.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
    const parsed = parseMarkers(raw);
    if (response.stop_reason === 'refusal' || !parsed.text) return { text: t('declined', chat.lang), chips: [] };
    return { text: parsed.text, chips: parsed.chips };
  }
  return { text: t('error', chat.lang), chips: [] };
}

// ── One update ───────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function handle(db: Db, update: any) {
  const msg = update.message;
  if (!msg?.chat || msg.chat.type !== 'private' || msg.from?.is_bot) return; // private chats only
  const chatId = Number(msg.chat.id);

  // Telegram repeats an update when we were slow — answer each one once.
  const { error: dup } = await db.from('telegram_updates').insert({ update_id: update.update_id });
  if (dup) return;
  if (Math.random() < 0.02) {
    await db.from('telegram_updates').delete().lt('created_at', new Date(Date.now() - 2 * 86_400_000).toISOString());
  }

  const code = String(msg.from?.language_code ?? 'en').slice(0, 2).toLowerCase();
  const { data: row } = await db.from('telegram_chats').select('*').eq('chat_id', chatId).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const chat: Chat = row ?? {
    chat_id: chatId, first_name: null, lang: LANGS.includes(code) ? code : 'en', history: [], memories: [],
    msg_day: today, msg_count: 0, msg_total: 0,
  };
  chat.first_name = String(msg.from?.first_name ?? '').replace(/[\r\n]+/g, ' ').slice(0, 40) || chat.first_name;
  if (chat.msg_day !== today) { chat.msg_day = today; chat.msg_count = 0; }

  const text = typeof msg.text === 'string' ? msg.text.trim() : '';
  const command = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : '';

  if (command === '/forget') {
    await db.from('telegram_chats').delete().eq('chat_id', chatId);
    return await send(chatId, t('forgot', chat.lang));
  }
  const save = (extra: Partial<Chat> = {}) => db.from('telegram_chats').upsert({
    chat_id: chatId, first_name: chat.first_name, lang: chat.lang, history: chat.history, memories: chat.memories,
    msg_day: chat.msg_day, msg_count: chat.msg_count, msg_total: chat.msg_total,
    last_seen: new Date().toISOString(), ...extra,
  });
  if (command === '/reset') {
    chat.history = [];
    await save();
    return await send(chatId, t('reset', chat.lang));
  }
  if (command === '/app') {
    await save();
    return await send(chatId, t('app', chat.lang));
  }
  if (!text) {
    await save();
    return await send(chatId, t('textOnly', chat.lang));
  }
  if (chat.msg_count >= DAILY_LIMIT) {
    await save();
    return await send(chatId, t('limit', chat.lang));
  }

  // /start and /help are answered by BETina herself, in the person's language.
  const said = command === '/start'
    ? '(They just opened the chat with you on Telegram. Say hello in one or two short lines and tell them in a few words what they can ask you: live scores, results, news, football stories, anything else.)'
    : command === '/help'
      ? '(They ask what you can do here. Tell them briefly: live scores and results, news, fixtures of any team, football stories, any other question; /reset starts a new chat, /forget deletes what you know about them, /app shows the BETina app.)'
      : text.slice(0, MAX_INPUT);
  if (command === '/start') chat.history = [];

  chat.msg_count += 1;
  chat.msg_total += 1;
  const turns: Turn[] = [...chat.history, { role: 'user' as const, content: said }].slice(-HISTORY_TURNS);
  while (turns.length && turns[0].role !== 'user') turns.shift();
  await save(); // count the message before the (slow) answer

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
  const typing = setInterval(() => { tg('sendChatAction', { chat_id: chatId, action: 'typing' }); }, 4500);
  try {
    const reply = await answer(db, chat, turns);
    chat.history = [...turns, { role: 'assistant' as const, content: reply.text }].slice(-HISTORY_TURNS);
    await save();
    await send(chatId, reply.text, reply.chips);
  } catch (e) {
    console.error('telegram-bot', String(e));
    await send(chatId, t('error', chat.lang));
  } finally {
    clearInterval(typing);
  }
}

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (!BOT_TOKEN) return json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, 503);
  const secret = await webhookSecret();

  // One-time setup: point Telegram at this function and fill the command menu.
  // Safe to call by anyone — it only ever sets our own URL.
  if (req.method === 'GET') {
    if (new URL(req.url).searchParams.get('setup') !== '1') return json({ ok: true });
    const hook = await tg('setWebhook', {
      url: `${SUPABASE_URL}/functions/v1/telegram-bot`, secret_token: secret,
      allowed_updates: ['message'], drop_pending_updates: true, max_connections: 20,
    });
    const commands = await tg('setMyCommands', { commands: COMMANDS });
    const me = await tg('getMe', {});
    return json({ webhook: hook.ok === true, commands: commands.ok === true, bot: me.result?.username ?? null, error: hook.ok ? undefined : hook.description });
  }

  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) return json({ error: 'forbidden' }, 403);
  const update = await req.json().catch(() => null);
  if (!update?.update_id) return json({ ok: true });

  const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Answer Telegram right away and keep working — her reply can take a while.
  const work = handle(db, update).catch((e) => console.error('telegram-bot', String(e)));
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(work); else await work;
  return json({ ok: true });
});
