// BETina on Telegram — Supabase Edge Function (Deno), Telegram's webhook.
//
// Any adult can chat with BETina in a private Telegram chat: her persona for
// Telegram (telegramPrompt in _shared/betina-persona.ts — texts like a girl on
// her phone, flirty, proud of GeniusBet), the app chat's sports tools, but no
// app account behind it — no GeniusBet account data, no Tippspiel, no
// reminders. The conversation and what she remembers live in telegram_chats
// (migrations 031 + 032); /forget deletes it.
//
//   /start   hello (asks for 18+ first)     /help    what she can do
//   /reset   new chat                        /forget  delete everything she knows about you
//   /app     the BETina app                  /stop    she no longer texts first   /wake  she does again
//
// Photos (telegram_photos, bucket telegram-photos): she sends them with the
// send_photo tool, each one only once per person, PHOTOS_PER_DAY a day. What
// she may send depends on the level — the days someone chatted with her:
//   level 1  day 1        the approved Instagram set (tier 0)
//   level 2  3+ days      + selfies (tier 1)
//   level 3  7+ days      + special photos (tier 2), once they also commented
//                           on one of her Instagram/Facebook posts (check_comment)
//   level 4  14+ days
// Levels never depend on deposits, bets or being a customer.
//
// She texts first (cron, every 10 min → ?cron=1), at most once in 20 hours and
// only to people who chatted a bit (PROACTIVE_MIN_MESSAGES):
//   morning  07–10 local time, to people active in the last 3 days, with a photo
//   nudge    17–21 local time, once after 2 days of silence
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
  msg_day: string; msg_count: number; msg_total: number; last_seen?: string;
  adult: boolean; active_days: number; last_active_day: string | null;
  sent_photos: string[]; photo_day: string | null; photo_count: number;
  deeds: string[]; ig_name: string | null;
  proactive: boolean; utc_offset: number; last_proactive: string | null; nudged: boolean;
};
type Photo = { key: string; category: string; tier: number; note: string; path: string; file_id: string | null };

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const MODEL = 'claude-sonnet-5-5';
const API = 'https://api.betina.geniusbet.com';
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MAX_TOOL_ROUNDS = 6;
const HISTORY_TURNS = 30;
const MAX_MEMORIES = 40;
const MAX_INPUT = 1500;            // characters of one message we pass on
const DAILY_LIMIT = 60;            // messages per person per day
const PHOTOS_PER_DAY = 3;
const LEVEL_DAYS = [0, 3, 7, 14];  // active days for level 1, 2, 3, 4
const PROACTIVE_MIN_MESSAGES = 5;
const PROACTIVE_GAP_MS = 20 * 3_600_000;
const PROACTIVE_PER_RUN = 5;
const LANGS = ['en', 'de', 'es', 'pt', 'fr', 'it', 'ro', 'tr', 'hr'];

const TEXT: Record<string, Record<string, string>> = {
  gate: {
    en: "Hey, I'm BETina from GeniusBet 💚 One thing first: I only chat with adults. Are you 18 or older?",
    de: 'Hey, ich bin BETina von GeniusBet 💚 Eine Sache vorab: Ich chatte nur mit Erwachsenen. Bist du 18 oder älter?',
    es: 'Hola, soy BETina de GeniusBet 💚 Una cosa antes: solo hablo con adultos. ¿Tienes 18 años o más?',
    pt: 'Olá, sou a BETina da GeniusBet 💚 Uma coisa primeiro: só falo com adultos. Tens 18 anos ou mais?',
    fr: "Salut, moi c'est BETina de GeniusBet 💚 Une chose d'abord : je ne discute qu'avec des adultes. Tu as 18 ans ou plus ?",
    it: 'Ciao, sono BETina di GeniusBet 💚 Prima una cosa: chatto solo con adulti. Hai 18 anni o più?',
    ro: 'Hei, sunt BETina de la GeniusBet 💚 Mai întâi un lucru: vorbesc doar cu adulți. Ai 18 ani sau mai mult?',
    tr: 'Selam, ben GeniusBet’ten BETina 💚 Önce bir şey: sadece yetişkinlerle sohbet ediyorum. 18 yaşında veya daha büyük müsün?',
    hr: 'Hej, ja sam BETina iz GeniusBeta 💚 Prvo jedna stvar: dopisujem se samo s odraslima. Imaš li 18 ili više godina?',
  },
  gateYes: {
    en: '✅ Yes, I’m 18+', de: '✅ Ja, ich bin 18+', es: '✅ Sí, tengo 18+', pt: '✅ Sim, tenho 18+', fr: "✅ Oui, j'ai 18+",
    it: '✅ Sì, ho 18+', ro: '✅ Da, am 18+', tr: '✅ Evet, 18+ yaşındayım', hr: '✅ Da, imam 18+',
  },
  limit: {
    en: "that's a lot of chatting for one day 😄 i'm back tomorrow — or keep going in the BETina app: betina.geniusbet.com",
    de: 'das war heute ganz schön viel gequatsche 😄 morgen bin ich wieder da — oder mach in der BETina App weiter: betina.geniusbet.com',
    es: 'hoy hemos hablado un montón 😄 mañana vuelvo — o sigue en la app de BETina: betina.geniusbet.com',
    pt: 'hoje já falámos imenso 😄 amanhã estou de volta — ou continua na app da BETina: betina.geniusbet.com',
    fr: "on a beaucoup papoté aujourd'hui 😄 je reviens demain — ou continue dans l'app BETina : betina.geniusbet.com",
    it: "oggi abbiamo chiacchierato tantissimo 😄 torno domani — oppure continua nell'app BETina: betina.geniusbet.com",
    ro: 'azi am vorbit o grămadă 😄 revin mâine — sau continuă în aplicația BETina: betina.geniusbet.com',
    tr: 'bugün epey sohbet ettik 😄 yarın yine buradayım — ya da BETina uygulamasında devam et: betina.geniusbet.com',
    hr: 'danas smo se baš napričali 😄 sutra sam opet tu — ili nastavi u BETina aplikaciji: betina.geniusbet.com',
  },
  textOnly: {
    en: 'here on Telegram I can only read text for now 🙈 write it to me!',
    de: 'hier auf Telegram kann ich im Moment nur Text lesen 🙈 schreib es mir!',
    es: 'aquí en Telegram por ahora solo leo texto 🙈 ¡escríbemelo!',
    pt: 'aqui no Telegram, por agora, só leio texto 🙈 escreve-me!',
    fr: 'ici sur Telegram, je ne lis que le texte pour le moment 🙈 écris-le-moi !',
    it: 'qui su Telegram per ora leggo solo testo 🙈 scrivimelo!',
    ro: 'aici pe Telegram pot citi deocamdată doar text 🙈 scrie-mi!',
    tr: 'Telegram’da şimdilik sadece yazı okuyabiliyorum 🙈 bana yaz!',
    hr: 'ovdje na Telegramu zasad čitam samo tekst 🙈 napiši mi!',
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
    en: 'fresh start ✨ what’s on your mind?', de: 'neuer anfang ✨ was gibt’s?', es: 'empezamos de nuevo ✨ ¿qué me cuentas?',
    pt: 'começamos de novo ✨ o que me contas?', fr: 'on repart de zéro ✨ quoi de neuf ?', it: 'si riparte ✨ che mi racconti?',
    ro: 'o luăm de la capăt ✨ ce mai e nou?', tr: 'yeni bir başlangıç ✨ aklında ne var?', hr: 'krećemo ispočetka ✨ što ima?',
  },
  stop: {
    en: "okay, I won't text first anymore 🤐 you know where to find me — /wake if you miss me",
    de: 'okay, ich schreib dir nicht mehr von mir aus 🤐 du weißt, wo du mich findest — /wake, falls du mich vermisst',
    es: 'vale, ya no te escribo yo primero 🤐 ya sabes dónde estoy — /wake si me echas de menos',
    pt: 'ok, já não te escrevo primeiro 🤐 sabes onde me encontrar — /wake se tiveres saudades',
    fr: "d'accord, je ne t'écris plus en premier 🤐 tu sais où me trouver — /wake si je te manque",
    it: 'okay, non ti scrivo più per prima 🤐 sai dove trovarmi — /wake se ti manco',
    ro: 'bine, nu-ți mai scriu eu prima 🤐 știi unde mă găsești — /wake dacă ți-e dor',
    tr: 'tamam, artık ilk ben yazmam 🤐 beni nerede bulacağını biliyorsun — özlersen /wake',
    hr: 'okej, neću ti više prva pisati 🤐 znaš gdje sam — /wake ako ti nedostajem',
  },
  wake: {
    en: 'yay, then you’ll hear from me again 😏', de: 'yay, dann hörst du wieder von mir 😏', es: 'bien, entonces volverás a saber de mí 😏',
    pt: 'boa, então voltas a ter notícias minhas 😏', fr: 'chouette, tu auras de nouveau de mes nouvelles 😏', it: 'evviva, allora mi risentirai 😏',
    ro: 'super, atunci o să mai auzi de mine 😏', tr: 'yaşasın, o zaman benden yine haber alırsın 😏', hr: 'super, onda ćeš me opet čuti 😏',
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
    en: "ha, that one's not for me 🙈 ask me something else!", de: 'haha, da bin ich raus 🙈 frag mich was anderes!',
    es: 'jaja, eso no es lo mío 🙈 ¡pregúntame otra cosa!', pt: 'haha, nisso não entro 🙈 pergunta-me outra coisa!',
    fr: 'haha, là je passe 🙈 demande-moi autre chose !', it: 'ahah, su questo passo 🙈 chiedimi altro!',
    ro: 'haha, aici nu mă bag 🙈 întreabă-mă altceva!', tr: 'haha, o konu bana göre değil 🙈 bana başka bir şey sor!',
    hr: 'haha, tu se ne miješam 🙈 pitaj me nešto drugo!',
  },
  error: {
    en: 'oops, I lost the thread for a second 🙈 send that again?', de: 'ups, da hab ich kurz den faden verloren 🙈 schickst du das nochmal?',
    es: 'ups, perdí el hilo un segundo 🙈 ¿me lo mandas otra vez?', pt: 'ups, perdi o fio por um segundo 🙈 mandas outra vez?',
    fr: "oups, j'ai perdu le fil une seconde 🙈 tu me le renvoies ?", it: 'ops, ho perso il filo un attimo 🙈 me lo rimandi?',
    ro: 'ups, am pierdut firul o secundă 🙈 îmi mai trimiți o dată?', tr: 'ups, bir an ipin ucunu kaçırdım 🙈 tekrar gönderir misin?',
    hr: 'ups, na trenutak sam izgubila nit 🙈 pošalješ opet?',
  },
};
const t = (key: string, lang: string) => TEXT[key][lang] ?? TEXT[key].en;

// What the command menu shows.
const COMMANDS = [
  { command: 'start', description: 'Say hi to BETina' },
  { command: 'help', description: 'What BETina can do' },
  { command: 'app', description: 'Get the free BETina app' },
  { command: 'stop', description: 'BETina no longer texts you first' },
  { command: 'wake', description: 'BETina may text you first again' },
  { command: 'reset', description: 'Start a new chat' },
  { command: 'forget', description: 'Delete everything BETina knows about you' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

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

/** Reply buttons: tapping one sends it as the person's next message. */
function keyboard(chips: string[]) {
  if (!chips.length) return { remove_keyboard: true };
  return { keyboard: chips.map((c) => [{ text: c }]), resize_keyboard: true, one_time_keyboard: true };
}

/**
 * Sends BETina's text: blank lines split it into up to three messages, like
 * someone typing one after the other. Returns false when Telegram refused
 * (the person blocked the bot).
 */
async function send(chatId: number, text: string, chips: string[] = []): Promise<boolean> {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const bubbles = parts.length > 3 ? [parts[0], parts[1], parts.slice(2).join('\n\n')] : parts;
  let ok = true;
  for (let i = 0; i < bubbles.length; i++) {
    const last = i === bubbles.length - 1;
    if (i > 0) {
      await tg('sendChatAction', { chat_id: chatId, action: 'typing' });
      await sleep(Math.min(2500, 600 + bubbles[i].length * 25));
    }
    const r = await tg('sendMessage', {
      chat_id: chatId, text: bubbles[i].slice(0, 4000), link_preview_options: { is_disabled: true },
      ...(last ? { reply_markup: keyboard(chips) } : {}),
    });
    ok = ok && r.ok === true;
  }
  return ok;
}

// ── Levels + photos ──────────────────────────────────────────────────────────

const levelOf = (chat: Chat) => LEVEL_DAYS.filter((d) => chat.active_days >= d).length;
/** The highest photo tier this person may get. */
function maxTier(chat: Chat): number {
  const level = levelOf(chat);
  if (level >= 3 && chat.deeds.includes('comment')) return 2;
  return level >= 2 ? 1 : 0;
}
const photosLeft = (chat: Chat) => Math.max(0, PHOTOS_PER_DAY - (chat.photo_day === today() ? chat.photo_count : 0));

async function photoPool(db: Db, chat: Chat): Promise<Photo[]> {
  const { data } = await db.from('telegram_photos').select('key, category, tier, note, path, file_id').eq('active', true).lte('tier', maxTier(chat));
  return ((data ?? []) as Photo[]).filter((p) => !chat.sent_photos.includes(p.key));
}

/** What BETina is told about her photos and what the person can still unlock. */
async function photoState(db: Db, chat: Chat) {
  const pool = await photoPool(db, chat);
  const counts = new Map<string, number>();
  for (const p of pool) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const { data: locked } = await db.from('telegram_photos').select('tier').eq('active', true).gt('tier', maxTier(chat));
  const tiers = new Set(((locked ?? []) as { tier: number }[]).map((p) => p.tier));
  const level = levelOf(chat);
  const steps: string[] = [];
  if (tiers.has(1) && level < 2) steps.push(`your selfies — once they have chatted with you on ${LEVEL_DAYS[1]} different days (so far ${chat.active_days}).`);
  if (tiers.has(2)) {
    const need = [
      level < 3 ? `chatting with you on ${LEVEL_DAYS[2]} different days (so far ${chat.active_days})` : null,
      chat.deeds.includes('comment') ? null : 'leaving a nice comment on one of your Instagram posts (@geniusbet.betina) or Facebook posts and telling you their name there',
    ].filter(Boolean);
    if (need.length) steps.push(`your special photos (beach, pool — the ones not everyone gets) — after ${need.join(' and ')}.`);
  }
  return { photos: [...counts].map(([c, n]) => `${c} (${n} left)`), nextUnlock: steps.join(' And ') };
}

/** Sends one photo of the category; the answer tells BETina what it shows. */
async function sendPhoto(db: Db, chat: Chat, category: string): Promise<string> {
  if (photosLeft(chat) <= 0) return 'No more photos today — they had their share. Tease them: maybe tomorrow.';
  const pool = await photoPool(db, chat);
  const wanted = pool.filter((p) => p.category === category);
  if (!wanted.length) {
    const others = [...new Set(pool.map((p) => p.category))];
    return others.length
      ? `Nothing (new) in "${category}" for them right now. You could send: ${others.join(', ')}.`
      : 'You have no new photo for them right now.';
  }
  const photo = wanted[Math.floor(Math.random() * wanted.length)];
  // deno-lint-ignore no-explicit-any
  let sent: any;
  if (photo.file_id) {
    sent = await tg('sendPhoto', { chat_id: chat.chat_id, photo: photo.file_id });
  } else {
    const { data: file, error } = await db.storage.from('telegram-photos').download(photo.path);
    if (error || !file) return 'The photo would not load — say you will send one later.';
    const form = new FormData();
    form.append('chat_id', String(chat.chat_id));
    form.append('photo', file, `${photo.key}.jpg`);
    sent = await (await fetch(`${TG}/sendPhoto`, { method: 'POST', body: form })).json().catch(() => ({ ok: false }));
    const sizes = sent?.result?.photo;
    if (sent?.ok && sizes?.length) await db.from('telegram_photos').update({ file_id: sizes[sizes.length - 1].file_id }).eq('key', photo.key);
  }
  if (!sent?.ok) return 'The photo would not send — say you will send one later.';
  chat.sent_photos = [...chat.sent_photos, photo.key];
  chat.photo_count = (chat.photo_day === today() ? chat.photo_count : 0) + 1;
  chat.photo_day = today();
  await db.from('telegram_chats').update({ sent_photos: chat.sent_photos, photo_day: chat.photo_day, photo_count: chat.photo_count }).eq('chat_id', chat.chat_id);
  return `Sent. The photo shows: ${photo.note}. Now write your short line about it.`;
}

// ── Tools (the app chat's sports tools, without anything tied to an account) ──

const TOOLS = [
  { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
  { name: 'search_team', description: 'Find a sports team by name across ANY sport to get its id, sport and league. Call this first for a team you do not already have an id for.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_fixtures', description: "A team's upcoming matches. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_results', description: "A team's recent finished matches with scores. Needs a team id from search_team.", input_schema: { type: 'object', properties: { team_id: { type: 'string' } }, required: ['team_id'] } },
  { name: 'get_live_scores', description: "Football live scores right now, plus today's and yesterday's results and kick-off times with goal scorers (real time). Use it first for any football score question. Optional query: team, league or country; empty for the biggest live games.", input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: [] } },
  { name: 'get_news', description: 'Latest sports headlines. Optional sport filter.', input_schema: { type: 'object', properties: { sport: { type: 'string' } }, required: [] } },
  { name: 'remember_fact', description: 'Save a lasting fact/preference the person shares so you recall it next time (also the pet name you gave them and running jokes). Never save contact details, passwords or anything about money.', input_schema: { type: 'object', properties: { fact: { type: 'string' } }, required: ['fact'] } },
  { name: 'send_photo', description: 'Send one photo of yourself into the chat. category must be one of the categories listed under "What you can send right now". The result tells you what the photo shows.', input_schema: { type: 'object', properties: { category: { type: 'string' } }, required: ['category'] } },
  { name: 'check_comment', description: 'Check whether a comment from this Instagram or Facebook name arrived on one of your posts in the last 30 days. Use it when they say they commented.', input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'set_utc_offset', description: "Save the person's time zone as hours from UTC (e.g. 1 for Vienna or Lagos in winter, 0 for Conakry, -6 for San Salvador) once you know where they live.", input_schema: { type: 'object', properties: { hours: { type: 'number' } }, required: ['hours'] } },
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
    if (name === 'send_photo') return await sendPhoto(db, chat, String(input.category ?? '').trim().toLowerCase());
    if (name === 'check_comment') {
      const who = String(input.name ?? '').trim().replace(/^@/, '').replace(/[%_\\]/g, '').slice(0, 60);
      if (who.length < 3) return 'Ask for their exact name on Instagram or Facebook.';
      const { data } = await db.from('social_posts').select('id, reply_text, platform')
        .in('platform', ['instagram', 'facebook']).ilike('reply_author', who)
        .gt('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString()).limit(1);
      if (!data?.length) return `No comment from "${who}" found yet. New comments can take up to ten minutes to show up, and the name must match exactly.`;
      if (!chat.deeds.includes('comment')) chat.deeds = [...chat.deeds, 'comment'];
      chat.ig_name = who;
      await db.from('telegram_chats').update({ deeds: chat.deeds, ig_name: who }).eq('chat_id', chat.chat_id);
      return `Yes — "${who}" commented on ${data[0].platform}: "${String(data[0].reply_text ?? '').slice(0, 200)}". That counts; thank them your way.`;
    }
    if (name === 'set_utc_offset') {
      const h = Math.round(Number(input.hours));
      if (!Number.isFinite(h) || h < -12 || h > 14) return 'That offset is not valid.';
      chat.utc_offset = h;
      await db.from('telegram_chats').update({ utc_offset: h }).eq('chat_id', chat.chat_id);
      return 'Saved.';
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

const localHour = (chat: Chat) => (((new Date().getUTCHours() + chat.utc_offset) % 24) + 24) % 24;

/** BETina's answer to the conversation so far: text + follow-up chips. */
async function answer(db: Db, chat: Chat, turns: Turn[]): Promise<{ text: string; chips: string[] }> {
  const state = await photoState(db, chat);
  const now = new Date();
  const system = telegramPrompt({
    name: chat.first_name || 'you', lang: chat.lang, memories: chat.memories,
    now: now.toISOString().slice(0, 16).replace('T', ' '),
    localTime: `${String(localHour(chat)).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
    level: levelOf(chat), activeDays: chat.active_days,
    photos: state.photos, photosLeftToday: photosLeft(chat), nextUnlock: state.nextUnlock,
    commented: chat.deeds.includes('comment'),
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
      // One after the other: a photo must be out before the next thing happens.
      const results = [];
      for (const u of uses) results.push({ type: 'tool_result', tool_use_id: u.id, content: await runTool(u.name, u.input ?? {}, db, chat) });
      messages.push({ role: 'user', content: results });
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

function saveChat(db: Db, chat: Chat) {
  return db.from('telegram_chats').upsert({
    chat_id: chat.chat_id, first_name: chat.first_name, lang: chat.lang, history: chat.history, memories: chat.memories,
    msg_day: chat.msg_day, msg_count: chat.msg_count, msg_total: chat.msg_total,
    adult: chat.adult, active_days: chat.active_days, last_active_day: chat.last_active_day,
    proactive: chat.proactive, nudged: chat.nudged, last_proactive: chat.last_proactive,
    last_seen: chat.last_seen ?? new Date().toISOString(),
  });
}

/** Asks BETina for her next message and sends it. `turns` ends with what she answers to. */
async function reply(db: Db, chat: Chat, turns: Turn[]): Promise<boolean> {
  while (turns.length && turns[0].role !== 'user') turns.shift();
  await tg('sendChatAction', { chat_id: chat.chat_id, action: 'typing' });
  const typing = setInterval(() => { tg('sendChatAction', { chat_id: chat.chat_id, action: 'typing' }); }, 4500);
  try {
    const out = await answer(db, chat, turns);
    clearInterval(typing);
    chat.history = [...turns, { role: 'assistant' as const, content: out.text }].slice(-HISTORY_TURNS);
    await saveChat(db, chat);
    return await send(chat.chat_id, out.text, out.chips);
  } catch (e) {
    console.error('telegram-bot', String(e));
    return await send(chat.chat_id, t('error', chat.lang));
  } finally {
    clearInterval(typing);
  }
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
  const day = today();
  const chat: Chat = row ?? {
    chat_id: chatId, first_name: null, lang: LANGS.includes(code) ? code : 'en', history: [], memories: [],
    msg_day: day, msg_count: 0, msg_total: 0,
    adult: false, active_days: 0, last_active_day: null, sent_photos: [], photo_day: null, photo_count: 0,
    deeds: [], ig_name: null, proactive: true, utc_offset: 1, last_proactive: null, nudged: false,
  };
  chat.first_name = String(msg.from?.first_name ?? '').replace(/[\r\n]+/g, ' ').slice(0, 40) || chat.first_name;
  chat.last_seen = new Date().toISOString();
  chat.nudged = false;
  if (chat.msg_day !== day) { chat.msg_day = day; chat.msg_count = 0; }

  const text = typeof msg.text === 'string' ? msg.text.trim() : '';
  let command = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : '';

  if (command === '/forget') {
    await db.from('telegram_chats').delete().eq('chat_id', chatId);
    await send(chatId, t('forgot', chat.lang));
    return;
  }

  // Adults only: nothing else happens before the person confirmed it.
  if (!chat.adult) {
    if (/18/.test(text) && !command) {
      chat.adult = true;
      command = '/start';
    } else {
      await saveChat(db, chat);
      await tg('sendMessage', { chat_id: chatId, text: t('gate', chat.lang), reply_markup: keyboard([t('gateYes', chat.lang)]) });
      return;
    }
  }

  if (command === '/reset') {
    chat.history = [];
    await saveChat(db, chat);
    await send(chatId, t('reset', chat.lang));
    return;
  }
  if (command === '/stop' || command === '/wake') {
    chat.proactive = command === '/wake';
    await saveChat(db, chat);
    await send(chatId, t(command.slice(1), chat.lang));
    return;
  }
  if (command === '/app') {
    await saveChat(db, chat);
    await send(chatId, t('app', chat.lang));
    return;
  }
  if (!text) {
    await saveChat(db, chat);
    await send(chatId, t('textOnly', chat.lang));
    return;
  }
  if (chat.msg_count >= DAILY_LIMIT) {
    await saveChat(db, chat);
    await send(chatId, t('limit', chat.lang));
    return;
  }

  // /start and /help are answered by BETina herself, in the person's language.
  const said = command === '/start'
    ? '(They just opened the chat with you on Telegram and confirmed they are an adult. Say hello like you would text someone new you are curious about — one or two short messages, and ask them something. No list of features.)'
    : command === '/help'
      ? '(They ask what you can do here. Tell them briefly, in your own style: chatting about anything, live scores and results, news, fixtures of any team, football stories, photos of you now and then; /stop if you should not text first, /reset starts a new chat, /forget deletes what you know about them, /app shows the BETina app.)'
      : text.slice(0, MAX_INPUT);
  if (command === '/start') chat.history = [];

  chat.msg_count += 1;
  chat.msg_total += 1;
  if (chat.last_active_day !== day) { chat.last_active_day = day; chat.active_days += 1; }
  const turns: Turn[] = [...chat.history, { role: 'user' as const, content: said }].slice(-HISTORY_TURNS);
  await saveChat(db, chat); // count the message before the (slow) answer
  await reply(db, chat, turns);
}

// ── She texts first ──────────────────────────────────────────────────────────

async function proactive(db: Db): Promise<{ sent: number }> {
  const now = Date.now();
  const { data } = await db.from('telegram_chats').select('*')
    .eq('proactive', true).eq('adult', true).gte('msg_total', PROACTIVE_MIN_MESSAGES)
    .gt('last_seen', new Date(now - 14 * 86_400_000).toISOString())
    .lt('last_seen', new Date(now - 6 * 3_600_000).toISOString())
    .or(`last_proactive.is.null,last_proactive.lt.${new Date(now - PROACTIVE_GAP_MS).toISOString()}`)
    .order('last_proactive', { ascending: true, nullsFirst: true }).limit(60);
  let sent = 0;
  for (const chat of (data ?? []) as Chat[]) {
    if (sent >= PROACTIVE_PER_RUN) break;
    const hour = localHour(chat);
    const silent = now - Date.parse(chat.last_seen ?? '');
    let note = '';
    if (hour >= 7 && hour < 10 && silent < 3 * 86_400_000) {
      note = '(No message from them — it is morning for them and you decided to text first. Send a short good-morning in your style, personal to what you know about them or what is on in sport today. You may send one photo with send_photo first if you have one that fits. End with a little question.)';
    } else if (hour >= 17 && hour < 21 && silent > 2 * 86_400_000 && !chat.nudged) {
      note = '(No message from them — they have been quiet for a couple of days and you decided to text first. One short, playful message: you noticed they went missing. Pick up something you talked about or a match coming up. No photo, no guilt trip.)';
      chat.nudged = true;
    }
    if (!note) continue;
    // Claim the slot first so a slow run can't text someone twice.
    chat.last_proactive = new Date().toISOString();
    const { data: claimed } = await db.from('telegram_chats')
      .update({ last_proactive: chat.last_proactive, nudged: chat.nudged })
      .eq('chat_id', chat.chat_id).eq('last_seen', chat.last_seen).select('chat_id');
    if (!claimed?.length) continue;
    const ok = await reply(db, chat, [...chat.history, { role: 'user' as const, content: note }].slice(-HISTORY_TURNS));
    if (ok) sent += 1;
    else await db.from('telegram_chats').update({ proactive: false }).eq('chat_id', chat.chat_id); // blocked the bot
  }
  return { sent };
}

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (!BOT_TOKEN) return json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, 503);
  const secret = await webhookSecret();
  const params = new URL(req.url).searchParams;
  const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Cron: who is due a message from her. Harmless when called by anyone —
  // the per-person limits decide, not the caller.
  if (params.get('cron') === '1') return json(await proactive(db));

  // One-time setup: point Telegram at this function and fill the command menu.
  // Safe to call by anyone — it only ever sets our own URL.
  if (req.method === 'GET') {
    if (params.get('setup') !== '1') return json({ ok: true });
    const hook = await tg('setWebhook', {
      url: `${SUPABASE_URL}/functions/v1/telegram-bot`, secret_token: secret,
      allowed_updates: ['message'], max_connections: 20,
    });
    const commands = await tg('setMyCommands', { commands: COMMANDS });
    const me = await tg('getMe', {});
    return json({ webhook: hook.ok === true, commands: commands.ok === true, bot: me.result?.username ?? null, error: hook.ok ? undefined : hook.description });
  }

  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) return json({ error: 'forbidden' }, 403);
  const update = await req.json().catch(() => null);
  if (!update?.update_id) return json({ ok: true });

  // Answer Telegram right away and keep working — her reply can take a while.
  const work = handle(db, update).catch((e) => console.error('telegram-bot', String(e)));
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(work); else await work;
  return json({ ok: true });
});
