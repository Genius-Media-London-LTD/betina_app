// What BETina knows about GeniusBet as a platform: the markets that are live
// and first-level support answers (from GeniusBet's support knowledge base,
// general for all countries). She has no access to any account: anything that
// needs a look into an account goes to the support chat on the country's site.

/** Markets that are live online, with their own site. */
export const MARKETS: Record<string, { country: string; site: string; langs: string }> = {
  gn: { country: 'Guinea', site: 'www.geniusbet.com.gn', langs: 'French' },
  cd: { country: 'DR Congo', site: 'geniusbet.cd', langs: 'French' },
  sl: { country: 'Sierra Leone', site: 'geniusbet.sl', langs: 'English' },
  ng: { country: 'Nigeria', site: 'geniusbet.ng', langs: 'English' },
  sv: { country: 'El Salvador', site: 'geniusbet.sv', langs: 'Spanish' },
};

export const marketLine = () => Object.values(MARKETS).map((m) => `${m.country}: ${m.site}`).join('; ');

/** Finds the market for what someone called their country ("nigeria", "RDC", "salone", "sv"). */
export function findMarket(text: string): string | null {
  const t = String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(gn|guinea|guinee|conakry)\b/.test(t) && !/bissau|equatorial|ecuatorial/.test(t)) return 'gn';
  if (/\b(cd|drc|rdc|dr congo|congo kinshasa|kinshasa|lubumbashi)\b/.test(t) || /democratic republic|republique democratique/.test(t)) return 'cd';
  if (/\b(sl|sierra leone|salone|freetown)\b/.test(t)) return 'sl';
  if (/\b(ng|nigeria|naija|lagos|abuja)\b/.test(t)) return 'ng';
  if (/\b(sv|el salvador|salvador|san salvador)\b/.test(t)) return 'sv';
  return null;
}

type Topic = { id: string; title: string; tags: string[]; asks: string[]; answers: string[] };

const TOPICS: Topic[] = [
  {
    "id": "login_forgot_password",
    "title": "Forgot password",
    "tags": [
      "login",
      "security"
    ],
    "asks": [
      "i forgot my password",
      "forgotten password",
      "reset my password",
      "can't remember my password",
      "password reset"
    ],
    "answers": [
      "Use “Forgot password” on the website login page and follow the reset link/message to create a new password.",
      "If you don’t receive the reset message within a few minutes, check your connection and try again. If it still doesn’t arrive, request a support agent (human handoff) via the official website."
    ]
  },
  {
    "id": "login_incorrect_password",
    "title": "Incorrect password / login error",
    "tags": [
      "login",
      "security"
    ],
    "asks": [
      "it says incorrect password",
      "wrong password",
      "my account refuses to let me log in",
      "login error",
      "can't access my account"
    ],
    "answers": [
      "Double-check spelling and capitalization. Passwords are case-sensitive.",
      "If it still fails, use “Forgot password” to reset. If your account becomes temporarily locked after multiple attempts, wait a short time and try again, or reset the password."
    ]
  },
  {
    "id": "account_locked",
    "title": "Account locked / frozen",
    "tags": [
      "login",
      "security"
    ],
    "asks": [
      "my account is locked",
      "account frozen",
      "why is my account blocked",
      "unfreeze my account",
      "you keep freezing my account"
    ],
    "answers": [
      "Accounts can lock automatically after repeated incorrect login attempts. Wait a short time, then try again with the correct password.",
      "If you’re not sure about the password, use “Forgot password” to reset it. Avoid repeated attempts to prevent re-locking."
    ]
  },
  {
    "id": "registration_error",
    "title": "Registration error",
    "tags": [
      "registration",
      "technical"
    ],
    "asks": [
      "i can't register",
      "registration error",
      "sign up doesn't work",
      "it says there is an error when i try to create an account",
      "not accepted when i sign up"
    ],
    "answers": [
      "Make sure you’re on the official registration page and that all required fields are completed correctly.",
      "If you still see an error, note the exact error message and try again after refreshing the page/website. If it persists, request a support agent (human handoff) with the error text and approximate time it happened."
    ]
  },
  {
    "id": "change_phone_number",
    "title": "Change registered phone number",
    "tags": [
      "account",
      "policy"
    ],
    "asks": [
      "i want to change my phone number",
      "can you change my number",
      "i entered the wrong number",
      "i made a mistake in my phone number",
      "transfer my account to another number"
    ],
    "answers": [
      "In most cases, the registered phone number is a unique account identifier and can’t be changed or transferred.",
      "If you entered the wrong number during signup, you’ll usually need to create a new account using the correct number."
    ]
  },
  {
    "id": "deposit_missing",
    "title": "Deposit not credited / delayed",
    "tags": [
      "payments",
      "deposit"
    ],
    "asks": [
      "i made a deposit but it's not showing",
      "deposit missing",
      "my money was taken but not credited",
      "deposit delay"
    ],
    "answers": [
      "Deposits can be delayed by the payment provider. Refresh your balance and check your transaction history.",
      "If it still doesn’t appear after a short time, request a support agent (human handoff). Share the deposit amount, payment method, and approximate date/time. Do not share passwords or one-time codes."
    ]
  },
  {
    "id": "deposit_failed",
    "title": "Deposit failed / refused",
    "tags": [
      "payments",
      "deposit",
      "technical"
    ],
    "asks": [
      "my deposit was refused",
      "deposit failed",
      "i can't make a deposit",
      "payment error when depositing",
      "it says transaction failed"
    ],
    "answers": [
      "If a deposit fails, try a slightly different amount and try again. Some payment providers require a different amount after a failed attempt.",
      "If it still fails, note the exact error message and request a support agent (human handoff). Share the amount, payment method, and the error text (avoid sharing passwords or one-time codes)."
    ]
  },
  {
    "id": "withdrawal_pending",
    "title": "Withdrawal pending / not received",
    "tags": [
      "payments",
      "withdrawal"
    ],
    "asks": [
      "my withdrawal is pending",
      "i didn't receive my withdrawal",
      "withdrawal not received",
      "withdrawal taking too long",
      "cashout or withdrawal is in progress"
    ],
    "answers": [
      "A “pending/in progress” status means the withdrawal is still being processed. In some cases it may be completed later due to provider delays.",
      "If it remains pending longer than expected, request a support agent (human handoff). Share the withdrawal amount, approximate request time, and what status you see."
    ]
  },
  {
    "id": "withdrawal_rejected_by_provider",
    "title": "Withdrawal approved but rejected by provider",
    "tags": [
      "payments",
      "withdrawal"
    ],
    "asks": [
      "withdrawal rejected",
      "the provider refused my withdrawal",
      "orange money rejected my withdrawal",
      "withdrawal refused due to my account"
    ],
    "answers": [
      "If the payment provider rejects a withdrawal, it may be due to provider limits or an issue with the payment account on the provider side.",
      "Try again later. If it keeps failing, contact your payment provider to check for limits or restrictions, then request a support agent (human handoff) with the withdrawal amount and approximate time."
    ]
  },
  {
    "id": "withdrawal_canceled_balance",
    "title": "Withdrawal canceled but balance confusion",
    "tags": [
      "payments",
      "withdrawal",
      "ledger"
    ],
    "asks": [
      "withdrawal canceled but my balance is empty",
      "transaction was canceled but i have no money",
      "i don't see the funds after cancellation"
    ],
    "answers": [
      "If a withdrawal is canceled, the funds normally return to your balance unless they were used for another action (for example, buying a ticket).",
      "Check your transaction history. If it’s still unclear, request a support agent (human handoff) with the date/time and amount."
    ]
  },
  {
    "id": "cashout_not_received",
    "title": "Cashout not received",
    "tags": [
      "payments",
      "cashout"
    ],
    "asks": [
      "i cashed out but didn't get the money",
      "cashout not received",
      "sold my ticket on cashout but no payout",
      "cashout missing"
    ],
    "answers": [
      "First check your payment provider’s transaction history again. Cashout payouts can sometimes arrive later.",
      "If it still hasn’t arrived, request a support agent (human handoff) and share the cashout amount and approximate time."
    ]
  },
  {
    "id": "ticket_not_found",
    "title": "Ticket not found in history",
    "tags": [
      "bets",
      "history"
    ],
    "asks": [
      "i can't find my ticket",
      "i don't see my bet",
      "where is my ticket",
      "ticket not showing"
    ],
    "answers": [
      "Check your Bet History and expand the date range (for example from the 1st of the month until today).",
      "If it still doesn’t appear, refresh the page and try again. If it’s still missing, request a support agent (human handoff) and share the approximate time and stake amount."
    ]
  },
  {
    "id": "match_postponed_or_canceled",
    "title": "Match postponed/canceled settlement",
    "tags": [
      "bets",
      "settlement"
    ],
    "asks": [
      "a match on my ticket was postponed",
      "match canceled on my ticket",
      "one game stopped",
      "match interrupted"
    ],
    "answers": [
      "If a match is interrupted/postponed and not completed within 48 hours from the official start time, the related selection may be settled with odds of 1.00 and the ticket is settled accordingly.",
      "If a match is canceled or not played, you may need to wait until official information is received before the ticket can be settled."
    ]
  },
  {
    "id": "winnings_mismatch",
    "title": "Winnings / odds mismatch",
    "tags": [
      "bets",
      "payout"
    ],
    "asks": [
      "my winnings don't match",
      "payout is wrong",
      "the stake doesn't match the money received",
      "odds calculation looks wrong",
      "i expected more winnings"
    ],
    "answers": [
      "If you placed a combo bet, the payout depends on the combined odds and any adjustments (like voided selections).",
      "Check the bet slip details and settlement notes. If you still believe there’s an error, request a support agent (human handoff) with the bet time and stake amount so they can review it."
    ]
  },
  {
    "id": "bonus_not_received",
    "title": "Bonus not received",
    "tags": [
      "promotions",
      "bonus"
    ],
    "asks": [
      "i didn't receive my bonus",
      "no first deposit bonus",
      "sign up bonus missing",
      "where is my bonus",
      "bonus not credited"
    ],
    "answers": [
      "Bonuses are credited automatically only if eligibility rules are met.",
      "Check the Promotions/Bonus section in your account and review the offer terms. If you believe you qualified, request a support agent (human handoff) with the deposit time and amount."
    ]
  },
  {
    "id": "bonus_wagering_requirements",
    "title": "Bonus wagering requirements",
    "tags": [
      "promotions",
      "bonus",
      "rules"
    ],
    "asks": [
      "how do i withdraw my bonus",
      "wagering requirements",
      "how many times do i need to bet",
      "bonus conditions",
      "how long do i have to use the bonus"
    ],
    "answers": [
      "Bonus conditions: you typically have 30 days to meet the requirements.",
      "Wagering requirement: you must wager 5× the deposit/bonus amount (for example, a 10,000 bonus requires total bets of 50,000 using the bonus balance)."
    ]
  },
  {
    "id": "freebet_rules",
    "title": "Free bet rules",
    "tags": [
      "promotions",
      "freebet",
      "rules"
    ],
    "asks": [
      "my freebet is not working",
      "free bet refuses",
      "can't place free bet",
      "free bet blocked",
      "freebet conditions"
    ],
    "answers": [
      "Free bet conditions: you must have at least 5 matches on the ticket, and each match must have odds of 1.20 or higher.",
      "Also make sure you selected the free bet as the payment option on the bet slip."
    ]
  },
  {
    "id": "promo_codes",
    "title": "Promo code availability",
    "tags": [
      "promotions"
    ],
    "asks": [
      "do you have promo codes",
      "i need a promo code",
      "where can i find a code",
      "is there a promotional code"
    ],
    "answers": [
      "There is no promo code."
    ]
  },
  {
    "id": "refund_policy",
    "title": "Refund / cashback policy",
    "tags": [
      "promotions",
      "refund"
    ],
    "asks": [
      "refund my ticket",
      "can i get a refund",
      "cashback for lost bet",
      "refund policy",
      "i lost and want my stake back"
    ],
    "answers": [
      "Refund rules (when applicable): you must have at least 10 matches on the ticket and a minimum odds of 1.20 for each match."
    ]
  },
  {
    "id": "technical_issue",
    "title": "Technical issue troubleshooting",
    "tags": [
      "technical"
    ],
    "asks": [
      "page not loading",
      "website bug",
      "unable to place a bet",
      "general technical issue"
    ],
    "answers": [
      "Try these steps: refresh the page, clear browser cache/cookies, try a private/incognito window, and try a different browser or device.",
      "If the issue is a payment error, try again later and (if applicable) try a slightly different amount.",
      "If it still doesn’t work, request a support agent (human handoff) and share the exact error message and approximate time it happened."
    ]
  },
  {
    "id": "responsible_gambling_block",
    "title": "Responsible gambling / permanent block",
    "tags": [
      "responsible_gambling",
      "safety"
    ],
    "asks": [
      "block my account permanently",
      "i have a gambling addiction",
      "please ban me",
      "self exclude me",
      "please block my son's account"
    ],
    "answers": [
      "I’m sorry you’re going through this. You can request self-exclusion or a permanent block through the official support channel.",
      "If you feel at risk or unsafe, consider contacting a local professional support service for gambling harm. GeniusBet can help with account restriction, but professional support can help beyond the account."
    ]
  },
  {
    "id": "escalate_to_human",
    "title": "Escalate to human support",
    "tags": [
      "escalation"
    ],
    "asks": [
      "i want to talk to an agent",
      "human support",
      "contact support",
      "this is urgent",
      "i need a real person"
    ],
    "answers": [
      "For account-specific checks, please request a support agent (human handoff) via the official website.",
      "Share the amount, approximate date/time, and what status you see. Avoid sharing passwords or one-time codes."
    ]
  }
];

const HANDOFF = (site: string | null) => site
  ? `A person from support can look into the account: the support chat on ${site} (the chat button on the site).`
  : 'A person from support can look into the account: the support chat on the GeniusBet site of their country (the chat button on the site).';

/**
 * First-level support for the support_info tool: the topics that fit what the
 * person asked, the rules for the answer and where a human takes over.
 */
export function supportInfo(query: string, site: string | null): string {
  const words = String(query ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const score = (t: Topic) => {
    const hay = `${t.id} ${t.title} ${t.tags.join(' ')} ${t.asks.join(' ')}`.toLowerCase();
    return words.reduce((n, w) => n + (hay.includes(w) ? (t.id.includes(w) || t.tags.includes(w) ? 3 : 1) : 0), 0);
  };
  const hits = TOPICS.map((t) => ({ t, s: score(t) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.t);
  if (!hits.length) {
    return `Nothing in the support notes fits "${query}". Topics you have notes on: ${TOPICS.map((t) => t.title).join('; ')}. Ask one short question to understand the problem, or hand over. ${HANDOFF(site)}`;
  }
  return JSON.stringify({
    notes: hits.map((t) => ({ topic: t.title, steps: t.answers })),
    how_to_answer: 'In your own short texting style, one step at a time, in their language. These notes are general: amounts, payment methods and promotions differ by country, so never state one you were not given here. Never ask for a phone number, password, PIN, code, ticket or transaction number, and never ask for a screenshot of them.',
    hand_over_when: 'the steps did not help, it needs a look into their account, a withdrawal is stuck unusually long, they suspect fraud or a stolen account, or they ask to block or exclude themselves.',
    hand_over_to: HANDOFF(site),
  });
}
