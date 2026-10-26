// BETina's brain — talks to the `chat` Supabase Edge Function, which holds the
// Anthropic key server-side and runs the full tool loop (team/news lookups,
// memory, reminders). The API key is NO LONGER in the app bundle.
//
// When there's no signed-in session (e.g. the web preview), we fall back to
// personality-true canned replies so the chat still demos.

import type { LangCode } from './i18n';
import type { LiveContext } from './sports';
import { supabase } from './supabase';

export type Turn = { role: 'user' | 'assistant'; content: string };

/** Everything the server needs to ground BETina for this player. */
export type BetinaContext = {
  name: string;
  lang: LangCode;
  team?: string | null;
  teamSport?: string | null;
  teamLeague?: string | null;
  sports?: string[];
  tier?: string | null;
  xp?: number | null;
  streakDays?: number | null;
  live?: LiveContext | null;
  memories?: string[];
};

// ── Demo mode (no session) ────────────────────────────────────────────────────

const FALLBACK_REPLIES: Record<LangCode, Array<(n: string) => string>> = {
  en: [
    (n) => `On it, ${n}! ⚡ I'll keep an eye on your matches and ping you the moment something happens.`,
    (n) => `Love the energy, ${n}! 🔥 Keep your streak alive — every chat brings you closer to the next tier.`,
    (n) => `Good question, ${n}! I'll dig into the stats and have more for you soon. 🎯`,
  ],
  de: [
    (n) => `Bin dran, ${n}! ⚡ Ich behalte deine Spiele im Blick und melde mich, sobald was passiert.`,
    (n) => `Ich liebe die Energie, ${n}! 🔥 Halt deine Serie am Leben — jeder Chat bringt dich näher zur nächsten Stufe.`,
    (n) => `Gute Frage, ${n}! Ich wühle mich durch die Stats und melde mich gleich. 🎯`,
  ],
  es: [
    (n) => `¡Voy, ${n}! ⚡ Vigilo tus partidos y te aviso en cuanto pase algo.`,
    (n) => `¡Me encanta esa energía, ${n}! 🔥 Mantén tu racha — cada chat te acerca al siguiente nivel.`,
    (n) => `¡Buena pregunta, ${n}! Reviso las estadísticas y te cuento en un momento. 🎯`,
  ],
  pt: [
    (n) => `Deixa comigo, ${n}! ⚡ Fico de olho nos seus jogos e te aviso na hora.`,
    (n) => `Adoro essa energia, ${n}! 🔥 Mantenha sua sequência — cada conversa te aproxima do próximo nível.`,
    (n) => `Boa pergunta, ${n}! Vou fuçar as estatísticas e já te conto. 🎯`,
  ],
  fr: [
    (n) => `Je m'en occupe, ${n} ! ⚡ Je surveille vos matchs et je vous préviens dès que ça bouge.`,
    (n) => `J'adore cette énergie, ${n} ! 🔥 Gardez votre série — chaque discussion vous rapproche du niveau suivant.`,
    (n) => `Bonne question, ${n} ! Je fouille les stats et je reviens vite. 🎯`,
  ],
  it: [
    (n) => `Ci penso io, ${n}! ⚡ Tengo d'occhio le tue partite e ti avviso appena succede qualcosa.`,
    (n) => `Adoro questa energia, ${n}! 🔥 Mantieni la serie — ogni chat ti avvicina al livello successivo.`,
    (n) => `Bella domanda, ${n}! Scavo nelle statistiche e ti aggiorno subito. 🎯`,
  ],
  ro: [
    (n) => `Mă ocup, ${n}! ⚡ Îți urmăresc meciurile și te anunț imediat ce se întâmplă ceva.`,
    (n) => `Îmi place energia, ${n}! 🔥 Ține-ți seria — fiecare conversație te apropie de nivelul următor.`,
    (n) => `Bună întrebare, ${n}! Sap în statistici și revin imediat. 🎯`,
  ],
  tr: [
    (n) => `Hallediyorum, ${n}! ⚡ Maçlarını takip ediyorum, bir şey olunca hemen haber veririm.`,
    (n) => `Bu enerjiye bayıldım, ${n}! 🔥 Serini koru, her sohbet seni bir sonraki seviyeye yaklaştırıyor.`,
    (n) => `Güzel soru, ${n}! İstatistiklere bakıp hemen dönüyorum. 🎯`,
  ],
  hr: [
    (n) => `Na tome sam, ${n}! ⚡ Pratim tvoje utakmice i javim ti čim se nešto dogodi.`,
    (n) => `Obožavam tu energiju, ${n}! 🔥 Čuvaj svoj niz, svaki chat te približava sljedećoj razini.`,
    (n) => `Dobro pitanje, ${n}! Kopam po statistici i javim se odmah. 🎯`,
  ],
};

const NETWORK_ERROR: Record<LangCode, (n: string) => string> = {
  en: (n) => `Hmm, my connection hiccuped, ${n} — ask me again in a sec? 📡`,
  de: (n) => `Hmm, meine Verbindung hat kurz gehakt, ${n} — frag mich gleich nochmal? 📡`,
  es: (n) => `Hmm, mi conexión falló un momento, ${n} — ¿me preguntas de nuevo en un segundo? 📡`,
  pt: (n) => `Hmm, minha conexão falhou, ${n} — pergunta de novo em um segundo? 📡`,
  fr: (n) => `Hmm, ma connexion a eu un raté, ${n} — redemandez-moi dans une seconde ? 📡`,
  it: (n) => `Hmm, la mia connessione ha avuto un intoppo, ${n} — richiedimelo tra un attimo? 📡`,
  ro: (n) => `Hmm, conexiunea mea a avut o problemă, ${n} — mă întrebi din nou imediat? 📡`,
  tr: (n) => `Hmm, bağlantım bir an gitti, ${n}. Bir saniye sonra tekrar sorar mısın? 📡`,
  hr: (n) => `Hmm, veza mi je zakazala, ${n}. Pitaš me ponovno za sekundu? 📡`,
};

let fallbackIndex = 0;
function demoReply(ctx: BetinaContext): string {
  const replies = FALLBACK_REPLIES[ctx.lang] ?? FALLBACK_REPLIES.en;
  const reply = replies[fallbackIndex % replies.length](ctx.name);
  fallbackIndex += 1;
  return reply;
}

// ── Main entry ────────────────────────────────────────────────────────────────

export async function askBetina(history: Turn[], ctx: BetinaContext): Promise<string> {
  // No session (web preview / logged out) → canned demo replies.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await new Promise((r) => setTimeout(r, 1200));
    return demoReply(ctx);
  }

  try {
    // supabase-js attaches the caller's JWT automatically.
    const { data, error } = await supabase.functions.invoke('chat', {
      // This app version has the Tippspiel (older store builds don't send this).
      body: { history, ctx: { ...ctx, features: ['tippspiel'] } },
    });
    if (error) throw error;
    const reply = (data?.reply ?? '').trim();
    return reply || (NETWORK_ERROR[ctx.lang] ?? NETWORK_ERROR.en)(ctx.name);
  } catch (e) {
    console.warn('chat function failed:', e);
    return (NETWORK_ERROR[ctx.lang] ?? NETWORK_ERROR.en)(ctx.name);
  }
}
