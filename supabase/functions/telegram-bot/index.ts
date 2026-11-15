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
//   level 3  7+ days      + special photos (tier 2), once they also did a
//                           comment task
//   level 4  14+ days
// Levels never depend on deposits, bets or being a customer.
//
// Two ways to a photo before the level allows it:
//   tasks   give_task hands out a codeword; they leave a comment with it under
//           one of her posts (Instagram, Facebook, X) and check_task looks for
//           it in social_posts. First verified comment: a selfie, every later
//           one: a special photo. One task a day.
//   games   start_game / game_guess / finish_game: number, quiz, emoji, lie,
//           charm. A win is one heart (HEARTS_PER_DAY); a selfie costs
//           PHOTO_COST hearts. Special photos are never for hearts.
//
// More than text:
//   voice    send_voice: a short voice note in her voice (VOICES_PER_DAY). The
//            audio comes from betina-server (/v1/tts), paid with a one-time
//            ticket from tts_tickets.
//   photos   she looks at photos people send her (SEEN_PER_DAY); the picture
//            goes to the model for that one answer and is stored nowhere.
//   goals    follow_team saves the club they love; live-alerts texts them its
//            goals and final scores.
//
// She texts first (cron, every 10 min → ?cron=1), at most once in 20 hours and
// only to people who chatted a bit (PROACTIVE_MIN_MESSAGES):
//   morning  07–10 local time, to people active in the last 3 days, with a photo
//   nudge    17–21 local time, once after 2 days of silence
//
// Limits: private chats only, text and photos, DAILY_LIMIT messages per person a day.
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
  hearts: number; heart_day: string | null; heart_count: number;
  game: Game | null; game_day: string | null; game_count: number;
  task_code: string | null; task_at: string | null; task_day: string | null; comments: number; ticket: number;
  team: string | null; team_id: number | null;
  voice_day: string | null; voice_count: number; seen_day: string | null; seen_count: number;
  /** Not stored: what she sent besides text while answering (voice notes), for the history. */
  media?: string[];
};
/** A photo they sent, for the one answer it belongs to. */
type Picture = { data: string; media_type: string };
/** A running game ({type, secret, tries, at}) or, once it is over, just {last}. */
type Game = { type?: string; secret?: string; tries?: number; at?: string; last?: string };
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
const VOICES_PER_DAY = 2;          // voice notes she sends per person per day
const SEEN_PER_DAY = 8;            // photos of theirs she looks at per day
const MAX_PICTURE_BYTES = 4_000_000;
const LEVEL_DAYS = [0, 3, 7, 14];  // active days for level 1, 2, 3, 4
const GAME_TYPES = ['number', 'quiz', 'emoji', 'lie', 'charm'];
const GAMES_PER_DAY = 6;           // games started per person per day
const HEARTS_PER_DAY = 3;          // hearts a person can win per day (one per won game)
const PHOTO_COST: Record<number, number> = { 1: 2 }; // hearts for a selfie they have not unlocked; special photos are never for hearts
const TASK_TTL_MS = 3 * 86_400_000; // a codeword stays valid this long
// Codewords for the comment task: words nobody writes under a post by chance.
const TASK_WORDS = ['flamingo', 'koala', 'papaya', 'mojito', 'pistachio', 'maracuja', 'ninja', 'zebra', 'panda', 'karaoke', 'safari', 'samba', 'tango', 'salsa', 'espresso', 'cappuccino', 'caramel', 'vanilla', 'mango', 'kiwi', 'chili', 'paprika', 'rocket', 'comet', 'galaxy', 'neon', 'turbo', 'yoyo', 'falcon', 'cobra', 'lagoon', 'pirate', 'tornado', 'disco', 'jazz', 'cookie', 'taxi', 'tiger', 'banana', 'coconut'];
const GAME_TTL_MS = 3 * 3_600_000; // an unfinished game lapses
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
    en: "voice messages, videos and stickers I can't open here yet 🙈 write it to me — or send a photo!",
    de: "sprachnachrichten, videos und sticker kann ich hier noch nicht öffnen 🙈 schreib es mir — oder schick ein foto!",
    es: "audios, vídeos y stickers aún no los puedo abrir aquí 🙈 escríbemelo — ¡o manda una foto!",
    pt: "áudios, vídeos e stickers ainda não consigo abrir aqui 🙈 escreve-me — ou manda uma foto!",
    fr: "les vocaux, vidéos et stickers, je ne peux pas encore les ouvrir ici 🙈 écris-le-moi — ou envoie une photo !",
    it: "vocali, video e sticker qui non riesco ancora ad aprirli 🙈 scrivimelo — o manda una foto!",
    ro: "mesajele vocale, clipurile și stickerele nu le pot deschide încă aici 🙈 scrie-mi — sau trimite o poză!",
    tr: "sesli mesajları, videoları ve çıkartmaları burada henüz açamıyorum 🙈 bana yaz — ya da bir fotoğraf gönder!",
    hr: "glasovne poruke, videe i naljepnice ovdje još ne mogu otvoriti 🙈 napiši mi — ili pošalji fotku!",
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
 * Sends BETina's text: a blank line splits it into two messages at most, like
 * someone typing one after the other. Returns false when Telegram refused
 * (the person blocked the bot).
 */
async function send(chatId: number, text: string, chips: string[] = []): Promise<boolean> {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const bubbles = parts.length > 2 ? [parts[0], parts.slice(1).join('\n')] : parts;
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

/** Hearts a photo of this tier costs them: nothing once the tier is unlocked. */
const tierCost = (chat: Chat, tier: number) => (tier <= Math.max(maxTier(chat), chat.ticket) ? 0 : PHOTO_COST[tier] ?? Infinity);

/** Photos they have not had yet — only those they can get right now, unless `all`. */
async function photoPool(db: Db, chat: Chat, all = false): Promise<Photo[]> {
  const { data } = await db.from('telegram_photos').select('key, category, tier, note, path, file_id').eq('active', true);
  return ((data ?? []) as Photo[]).filter((p) => !chat.sent_photos.includes(p.key) && (all || tierCost(chat, p.tier) <= chat.hearts));
}

/** What BETina is told about her photos and what the person can still unlock. */
async function photoState(db: Db, chat: Chat) {
  const all = await photoPool(db, chat, true);
  const counts = new Map<string, { n: number; cost: number }>();
  for (const p of all) {
    const cost = tierCost(chat, p.tier);
    if (cost > chat.hearts) continue;
    counts.set(p.category, { n: (counts.get(p.category)?.n ?? 0) + 1, cost });
  }
  const tiers = new Set(all.filter((p) => tierCost(chat, p.tier) > 0).map((p) => p.tier));
  const level = levelOf(chat);
  const steps: string[] = [];
  if (tiers.has(1)) steps.push(`your selfies — free once they have chatted with you on ${LEVEL_DAYS[1]} different days (so far ${chat.active_days}), right away for ${PHOTO_COST[1]} hearts each, or one as the reward for their first codeword comment.`);
  if (tiers.has(2)) {
    const need = [
      level < 3 ? `chatting with you on ${LEVEL_DAYS[2]} different days (so far ${chat.active_days})` : null,
      chat.deeds.includes('comment') ? null : 'leaving a nice comment on one of your Instagram posts (@geniusbet.betina) or Facebook posts and telling you their name there',
    ].filter(Boolean);
    steps.push(`your special photos (beach, pool — the ones not everyone gets) — never for hearts: one as the reward for each codeword comment from their second on (verified so far: ${chat.comments})${need.length ? `, and all of them free after ${need.join(' and ')}` : ''}.`);
  }
  return {
    photos: [...counts].map(([c, v]) => `${c} (${v.n} left${v.cost ? `, costs ${v.cost} hearts each` : ''})`),
    nextUnlock: steps.join(' And '),
  };
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
  const cost = tierCost(chat, photo.tier);
  // A reward photo: the ticket is used up by a photo they could not get otherwise.
  if (photo.tier > maxTier(chat) && photo.tier <= chat.ticket) chat.ticket = 0;
  chat.hearts = Math.max(0, chat.hearts - cost);
  chat.sent_photos = [...chat.sent_photos, photo.key];
  chat.photo_count = (chat.photo_day === today() ? chat.photo_count : 0) + 1;
  chat.photo_day = today();
  await db.from('telegram_chats').update({ sent_photos: chat.sent_photos, photo_day: chat.photo_day, photo_count: chat.photo_count, hearts: chat.hearts, ticket: chat.ticket }).eq('chat_id', chat.chat_id);
  return `Sent. The photo shows: ${photo.note}.${cost ? ` It cost them ${cost} hearts (${chat.hearts} left).` : ''} Now write your short line about it.`;
}

// ── Voice notes ──────────────────────────────────────────────────────────────

const voicesLeft = (chat: Chat) => Math.max(0, VOICES_PER_DAY - (chat.voice_day === today() ? chat.voice_count : 0));

/** Sends what she says as a voice message; the audio is made on betina-server. */
async function sendVoice(db: Db, chat: Chat, text: string): Promise<string> {
  const say = text.replace(/\[\[[^\]]*\]\]/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!say) return 'Put what you want to say into "text".';
  if (voicesLeft(chat) <= 0) return 'No more voice notes today — write it instead, and tease them: maybe tomorrow they hear you again.';
  const { data: ticket } = await db.from('tts_tickets').insert({}).select('id').single();
  if (!ticket?.id) return 'The voice note would not record — write it instead.';
  await tg('sendChatAction', { chat_id: chat.chat_id, action: 'record_voice' });
  const res = await fetch(`${API}/v1/tts`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ticket: ticket.id, text: say }),
  }).catch(() => null);
  if (!res?.ok) return 'The voice note would not record — write it instead.';
  const form = new FormData();
  form.append('chat_id', String(chat.chat_id));
  form.append('voice', new Blob([await res.arrayBuffer()], { type: 'audio/ogg' }), 'betina.ogg');
  const sent = await (await fetch(`${TG}/sendVoice`, { method: 'POST', body: form })).json().catch(() => ({ ok: false }));
  if (!sent?.ok) return 'They cannot receive voice messages (their Telegram settings) — write it instead.';
  chat.voice_count = (chat.voice_day === today() ? chat.voice_count : 0) + 1;
  chat.voice_day = today();
  chat.media = [...(chat.media ?? []), `(you sent a voice note and said: "${say}")`];
  await db.from('telegram_chats').update({ voice_day: chat.voice_day, voice_count: chat.voice_count }).eq('chat_id', chat.chat_id);
  return 'Sent — they are listening to you now. Write at most one short line after it, or nothing at all.';
}

// ── Photos they send ─────────────────────────────────────────────────────────

/** Loads a photo they sent (a size that is big enough to see, small enough to pass on). */
// deno-lint-ignore no-explicit-any
async function loadPicture(sizes: any[]): Promise<Picture | null> {
  const fits = sizes.filter((p) => (p.file_size ?? 0) <= MAX_PICTURE_BYTES && Math.max(p.width ?? 0, p.height ?? 0) <= 1600);
  const pick = (fits.length ? fits : sizes.slice(0, 1)).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  if (!pick?.file_id) return null;
  const file = await tg('getFile', { file_id: pick.file_id });
  const path = file?.result?.file_path;
  if (!path) return null;
  const res = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`).catch(() => null);
  if (!res?.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_PICTURE_BYTES) return null;
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(bin), media_type: /\.png$/i.test(path) ? 'image/png' : /\.webp$/i.test(path) ? 'image/webp' : 'image/jpeg' };
}

// ── Goal alerts: the club they love ──────────────────────────────────────────

const plain = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Saves (or clears) the football team whose goals she texts them. */
async function followTeam(db: Db, chat: Chat, name: string, country: string): Promise<string> {
  if (!name) {
    if (!chat.team) return 'You are not sending them goal alerts at the moment.';
    const old = chat.team;
    chat.team = null; chat.team_id = null;
    await db.from('telegram_chats').update({ team: null, team_id: null }).eq('chat_id', chat.chat_id);
    return `Stopped: no more goal alerts for ${old}.`;
  }
  type Team = { id: number; name: string; country: string };
  const search = async (q: string): Promise<Team[]> =>
    (await (await fetch(`${API}/v1/live/teams?q=${encodeURIComponent(q)}`)).json().catch(() => ({}))).teams ?? [];
  let list = await search(name);
  // "Bayern Munich" finds nothing where "Bayern" does: try the longest word.
  if (!list.length) {
    const word = plain(name).split(' ').sort((a, b) => b.length - a.length)[0] ?? '';
    if (word.length >= 4 && word !== plain(name)) list = await search(word);
  }
  if (!list.length) return `No football team found for "${name}". Ask them for the club's full name (goal alerts are for football only).`;
  if (country) {
    const inCountry = list.filter((x) => plain(x.country) === plain(country));
    if (inCountry.length) list = inCountry;
  }
  const exact = list.filter((x) => plain(x.name) === plain(name));
  const pick = exact.length === 1 ? exact[0] : list.length === 1 ? list[0] : null;
  if (!pick) return `Several teams fit: ${list.slice(0, 8).map((x) => `${x.name} (${x.country})`).join(', ')}. Ask which one they mean, then call follow_team again with that exact name and country.`;
  chat.team = pick.name; chat.team_id = pick.id;
  await db.from('telegram_chats').update({ team: pick.name, team_id: pick.id }).eq('chat_id', chat.chat_id);
  return `Done: from now on you text them every goal and the final score of ${pick.name} (${pick.country}) while it happens. Tell them in one line.`;
}

// ── Tasks: a comment with a codeword, checked for real ───────────────────────

const openTask = (chat: Chat) =>
  chat.task_code && chat.task_at && Date.now() - Date.parse(chat.task_at) < TASK_TTL_MS ? chat.task_code : null;

/** What BETina is told about the comment task and an open reward. */
function taskState(chat: Chat): string {
  const code = openTask(chat);
  const parts = [
    code
      ? `Open task: a comment with the codeword "${code}" in it. When they say it is done, call check_task.`
      : chat.task_day === today()
        ? 'They did their task for today — the next one tomorrow.'
        : 'No task open. give_task gives you a codeword for them.',
    `Verified comments so far: ${chat.comments}.`,
  ];
  if (chat.ticket > 0) parts.push(`They have a reward photo open: one ${chat.ticket >= 2 ? 'special photo' : 'selfie'} — send it with send_photo.`);
  return parts.join(' ');
}

// ── Games: the way to win hearts ─────────────────────────────────────────────

const activeGame = (chat: Chat): Game | null =>
  chat.game?.type && chat.game.at && Date.now() - Date.parse(chat.game.at) < GAME_TTL_MS ? chat.game : null;
const heartsToWin = (chat: Chat) => Math.max(0, HEARTS_PER_DAY - (chat.heart_day === today() ? chat.heart_count : 0));
const gamesLeft = (chat: Chat) => Math.max(0, GAMES_PER_DAY - (chat.game_day === today() ? chat.game_count : 0));

/** What BETina is told about the game that is running (or not). */
function gameState(chat: Chat): string {
  const g = activeGame(chat);
  if (!g) return `No game running. Games they can still start today: ${gamesLeft(chat)}.${chat.game?.last ? ` The last game was "${chat.game.last}" — pick a different one next.` : ''}`;
  if (g.type === 'number') return `Running: the number game (1–50), ${g.tries} guesses left. You do not know the number — pass every guess to game_guess and say what it answers.`;
  return `Running: "${g.type}". The solution (never reveal it before the game is decided): ${g.secret}. When it is decided, call finish_game.`;
}

/** Ends the running game; a win is one heart, up to the daily cap. */
async function endGame(db: Db, chat: Chat, won: boolean): Promise<string> {
  const type = chat.game?.type ?? '';
  chat.game = { last: type };
  let got = 0;
  if (won && heartsToWin(chat) > 0) {
    chat.heart_count = (chat.heart_day === today() ? chat.heart_count : 0) + 1;
    chat.heart_day = today();
    chat.hearts += 1;
    got = 1;
  }
  await db.from('telegram_chats').update({ game: chat.game, hearts: chat.hearts, heart_day: chat.heart_day, heart_count: chat.heart_count }).eq('chat_id', chat.chat_id);
  if (!won) return `They lost. No heart. They have ${chat.hearts}. Tease them and offer a rematch or another game.`;
  return got
    ? `They won: +1 heart, now ${chat.hearts}. Still winnable today: ${heartsToWin(chat)}. Tell them, and what their hearts can get them.`
    : `They won — but today's ${HEARTS_PER_DAY} hearts are already taken, so this one was for the honour. They have ${chat.hearts}. Hearts again tomorrow.`;
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
  { name: 'send_voice', description: 'Send a voice message in your own voice into the chat. text is exactly what you say: one or two spoken sentences (at most 30 words) in the language you chat in — no emojis, no links, no stage directions.', input_schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'follow_team', description: 'Goal alerts: save the football club (or national team) they love, so you text them its goals and final scores live. name is the full club name ("Manchester United", "Bayern München"), country optional (the club\'s country in English). An empty name stops the alerts.', input_schema: { type: 'object', properties: { name: { type: 'string' }, country: { type: 'string' } }, required: ['name'] } },
  { name: 'give_task', description: 'Get a codeword just for this person. Their task: leave a nice comment with that word in it under one of your posts (Instagram, Facebook or X). One task per day.', input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'check_task', description: 'Look whether their comment with the codeword has arrived. Call it when they say they commented. It finds the real comment or says it is not there yet.', input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'start_game', description: 'Start one of your games before you pose it. type: number (they guess your number between 1 and 50 — the referee picks it, you leave secret empty), quiz (three questions, two right wins), emoji (something in emojis, three guesses), lie (three statements about you, one is a lie), charm (one message to charm you). For every type except number, put the solution in secret (the answers, the lie, what you are looking for) — it is kept for you and never shown to them.', input_schema: { type: 'object', properties: { type: { type: 'string', enum: GAME_TYPES }, secret: { type: 'string' } }, required: ['type'] } },
  { name: 'game_guess', description: 'The number game only: pass the number they guessed. The answer says higher, lower or won, and how many guesses are left.', input_schema: { type: 'object', properties: { number: { type: 'number' } }, required: ['number'] } },
  { name: 'finish_game', description: 'End the running quiz, emoji, lie or charm game once it is decided. won is true only if they really won by the rules.', input_schema: { type: 'object', properties: { won: { type: 'boolean' } }, required: ['won'] } },
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
    if (name === 'send_voice') return await sendVoice(db, chat, String(input.text ?? ''));
    if (name === 'follow_team') return await followTeam(db, chat, String(input.name ?? '').trim().slice(0, 60), String(input.country ?? '').trim().slice(0, 40));
    if (name === 'give_task') {
      const open = openTask(chat);
      if (open) return `Their task is still open: the codeword is "${open}". They leave a nice comment with it under one of your posts.`;
      if (chat.task_day === today()) return 'They already did a task today — the next one tomorrow. Tease them with it.';
      let word = '';
      for (let i = 0; i < 8; i++) {
        word = TASK_WORDS[Math.floor(Math.random() * TASK_WORDS.length)];
        const { count } = await db.from('telegram_chats').select('chat_id', { count: 'exact', head: true }).eq('task_code', word);
        if (!count) break;
      }
      chat.task_code = word;
      chat.task_at = new Date().toISOString();
      await db.from('telegram_chats').update({ task_code: word, task_at: chat.task_at }).eq('chat_id', chat.chat_id);
      const prize = chat.comments >= 1 ? 'a special photo' : 'a selfie (special photos come from their second comment on)';
      return `Their codeword is "${word}". They leave a nice comment under one of your posts (Instagram @geniusbet.betina, Facebook or X) with that word in it, then tell you. The reward: ${prize}.`;
    }
    if (name === 'check_task') {
      const code = openTask(chat);
      if (!code || !chat.task_at) return 'No task is open. Give them one with give_task.';
      const { data } = await db.from('social_posts').select('reply_author, reply_text, platform')
        .in('platform', ['instagram', 'facebook', 'x']).not('reply_author', 'is', null)
        .ilike('reply_text', `%${code}%`).gt('created_at', chat.task_at).order('created_at').limit(1);
      if (!data?.length) return `No comment with "${code}" has arrived yet. New comments can take up to ten minutes — say you will look again in a moment, and check again when they ask. No reward before it is found.`;
      chat.comments += 1;
      chat.ticket = chat.comments >= 2 ? 2 : 1;
      chat.task_code = null;
      chat.task_day = today();
      if (!chat.deeds.includes('comment')) chat.deeds = [...chat.deeds, 'comment'];
      await db.from('telegram_chats').update({ comments: chat.comments, ticket: chat.ticket, task_code: null, task_day: chat.task_day, deeds: chat.deeds }).eq('chat_id', chat.chat_id);
      return `Found it: "${data[0].reply_author}" wrote on ${data[0].platform}: "${String(data[0].reply_text ?? '').slice(0, 200)}". That is their verified comment number ${chat.comments}. Tell them you looked, thank them for what they wrote, and send the reward now with send_photo — category ${chat.ticket >= 2 ? 'special' : 'selfie'}.`;
    }
    if (name === 'start_game') {
      const type = String(input.type ?? '');
      if (!GAME_TYPES.includes(type)) return `Unknown game. Your games: ${GAME_TYPES.join(', ')}.`;
      const running = activeGame(chat);
      if (running) return `"${running.type}" is still running — finish that first.`;
      if (gamesLeft(chat) <= 0) return 'That was enough playing for today — tell them you play again tomorrow.';
      const secret = type === 'number' ? String(1 + Math.floor(Math.random() * 50)) : String(input.secret ?? '').trim().slice(0, 600);
      if (!secret) return 'Put the solution into "secret" first, then start again.';
      chat.game = { type, secret, tries: type === 'number' ? 5 : type === 'emoji' ? 3 : 1, at: new Date().toISOString() };
      chat.game_count = (chat.game_day === today() ? chat.game_count : 0) + 1;
      chat.game_day = today();
      await db.from('telegram_chats').update({ game: chat.game, game_day: chat.game_day, game_count: chat.game_count }).eq('chat_id', chat.chat_id);
      const prize = heartsToWin(chat) > 0 ? 'A win is one heart.' : "They already won today's hearts — this one is just for fun, say so.";
      return type === 'number'
        ? `Started. The number is between 1 and 50 and only the referee knows it. They have 5 guesses; pass each one to game_guess. ${prize}`
        : `Started. Pose it now, one step per message. When it is decided, call finish_game. ${prize}`;
    }
    if (name === 'game_guess') {
      const g = activeGame(chat);
      if (!g || g.type !== 'number') return 'No number game is running. Start one with start_game.';
      const n = Math.round(Number(input.number));
      if (!Number.isFinite(n) || n < 1 || n > 50) return 'That is not a number between 1 and 50 — ask again, it does not cost a guess.';
      const secret = Number(g.secret);
      if (n === secret) return await endGame(db, chat, true);
      const tries = (g.tries ?? 1) - 1;
      if (tries <= 0) {
        const lost = await endGame(db, chat, false);
        return `Wrong, and that was the last guess. The number was ${secret}. ${lost}`;
      }
      chat.game = { ...g, tries };
      await db.from('telegram_chats').update({ game: chat.game }).eq('chat_id', chat.chat_id);
      return `Wrong: your number is ${secret > n ? 'higher' : 'lower'} than ${n}. Guesses left: ${tries}.`;
    }
    if (name === 'finish_game') {
      const g = activeGame(chat);
      if (!g) return 'No game is running.';
      if (g.type === 'number') return 'The number game is decided by game_guess only.';
      return await endGame(db, chat, input.won === true);
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
async function answer(db: Db, chat: Chat, turns: Turn[], picture: Picture | null = null): Promise<{ text: string; chips: string[] }> {
  chat.media = [];
  const state = await photoState(db, chat);
  const now = new Date();
  const system = telegramPrompt({
    name: chat.first_name || 'you', lang: chat.lang, memories: chat.memories,
    now: now.toISOString().slice(0, 16).replace('T', ' '),
    localTime: `${String(localHour(chat)).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
    level: levelOf(chat), activeDays: chat.active_days,
    photos: state.photos, photosLeftToday: photosLeft(chat), nextUnlock: state.nextUnlock,
    task: taskState(chat),
    hearts: chat.hearts, heartsToWinToday: heartsToWin(chat), game: gameState(chat),
    voicesLeftToday: voicesLeft(chat), team: chat.team,
  });
  // deno-lint-ignore no-explicit-any
  const messages: any[] = turns.map((m) => ({ role: m.role, content: m.content }));
  if (picture && messages.length) {
    const last = messages[messages.length - 1];
    last.content = [{ type: 'image', source: { type: 'base64', media_type: picture.media_type, data: picture.data } }, { type: 'text', text: last.content }];
  }
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
    if (response.stop_reason === 'refusal') return { text: t('declined', chat.lang), chips: [] };
    // Notes in brackets are for her history only — never something she sends.
    const text = parsed.text.replace(/\(you sent a voice note[^)]*\)/gi, '').trim();
    if (!text) return chat.media.length ? { text: '', chips: [] } : { text: t('declined', chat.lang), chips: [] };
    return { text, chips: parsed.chips };
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
async function reply(db: Db, chat: Chat, turns: Turn[], picture: Picture | null = null): Promise<boolean> {
  while (turns.length && turns[0].role !== 'user') turns.shift();
  await tg('sendChatAction', { chat_id: chat.chat_id, action: 'typing' });
  const typing = setInterval(() => { tg('sendChatAction', { chat_id: chat.chat_id, action: 'typing' }); }, 4500);
  try {
    const out = await answer(db, chat, turns, picture);
    clearInterval(typing);
    const said = [...(chat.media ?? []), out.text].filter(Boolean).join(' ');
    chat.history = [...turns, { role: 'assistant' as const, content: said }].slice(-HISTORY_TURNS);
    await saveChat(db, chat);
    return out.text ? await send(chat.chat_id, out.text, out.chips) : true;
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
    hearts: 0, heart_day: null, heart_count: 0, game: null, game_day: null, game_count: 0,
    task_code: null, task_at: null, task_day: null, comments: 0, ticket: 0,
    team: null, team_id: null, voice_day: null, voice_count: 0, seen_day: null, seen_count: 0,
  };
  chat.first_name = String(msg.from?.first_name ?? '').replace(/[\r\n]+/g, ' ').slice(0, 40) || chat.first_name;
  chat.last_seen = new Date().toISOString();
  chat.nudged = false;
  if (chat.msg_day !== day) { chat.msg_day = day; chat.msg_count = 0; }

  // deno-lint-ignore no-explicit-any
  const sizes: any[] = Array.isArray(msg.photo) ? msg.photo : [];
  const text = typeof msg.text === 'string' ? msg.text.trim() : sizes.length && typeof msg.caption === 'string' ? msg.caption.trim() : '';
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
    if (activeGame(chat)) await db.from('telegram_chats').update({ game: null }).eq('chat_id', chatId);
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
  if (!text && !sizes.length) {
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
      : sizes.length ? '' : text.slice(0, MAX_INPUT);
  if (command === '/start') chat.history = [];

  // A photo from them: she looks at it for this one answer; it is not kept.
  let picture: Picture | null = null;
  let note = said;
  if (sizes.length && !command) {
    const wrote = text ? ` and wrote: "${text.slice(0, MAX_INPUT)}"` : '';
    const seen = chat.seen_day === day ? chat.seen_count : 0;
    picture = seen < SEEN_PER_DAY ? await loadPicture(sizes) : null;
    if (picture) {
      await db.from('telegram_chats').update({ seen_day: day, seen_count: seen + 1 }).eq('chat_id', chatId);
      chat.seen_day = day; chat.seen_count = seen + 1;
      note = `(They sent you a photo${wrote}. You can see it.)`;
    } else {
      note = seen >= SEEN_PER_DAY
        ? `(They sent you another photo${wrote}. You have looked at enough photos for today — you did not open this one; say so playfully.)`
        : `(They sent you a photo${wrote}, but it would not load. Ask them to send it again.)`;
    }
  }

  chat.msg_count += 1;
  chat.msg_total += 1;
  if (chat.last_active_day !== day) { chat.last_active_day = day; chat.active_days += 1; }
  const turns: Turn[] = [...chat.history, { role: 'user' as const, content: note }].slice(-HISTORY_TURNS);
  await saveChat(db, chat); // count the message before the (slow) answer
  await reply(db, chat, turns, picture);
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
      note = '(No message from them — it is morning for them and you decided to text first. Send a short good-morning in your style, personal to what you know about them or what is on in sport today. You may send one photo with send_photo first if you have one that fits — or, now and then instead of a photo, say your good-morning as a voice note with send_voice. Never both. End with a little question.)';
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
