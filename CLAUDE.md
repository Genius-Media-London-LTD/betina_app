# BETina App — Claude Code Briefing

## Was ist BETina?
BETina ist eine persönliche KI-Begleiterin für GeniusBet-Spieler.
**KEINE Gambling-App** — AI Companion / Entertainment App (wichtig für App Store).
Kein echtes Geld wird in der App bewegt. Bets laufen auf der GeniusBet Website.

## Tech Stack
- **Framework:** Expo (React Native) — SDK 52+
- **Navigation:** Expo Router (file-based)
- **Auth:** Supabase (Phone/OTP)
- **Database:** Supabase
- **AI/Chat:** Claude API (claude-haiku-5-5) in der Edge Function `supabase/functions/chat`; BETinas Persönlichkeit + Regeln zentral in `supabase/functions/_shared/betina-persona.ts` (gilt für Text- und Sprach-Chat)
- **Animations:** React Native Reanimated 3 + Lottie
- **Icons:** Expo Vector Icons / Lucide React Native
- **Language:** TypeScript (strict)

## Design Prinzipien
- **Vibe:** Casino-Game-Feeling — alles fühlt sich lebendig an
- **Tiefe:** Glassmorphism-Cards, Parallax, leichte 3D-Effekte
- **Hintergrund:** Tiefschwarz/Deep Navy mit animierten Goldpartikeln (dauerhaft)
- BETinas Avatar ist IMMER präsent — sie lebt in der App
- Jede Interaktion hat Feedback (Partikel, Glow, Haptics)
- Zahlen und Stats zählen animiert hoch (nie statisch)

## Design System → siehe src/theme/index.ts
Alle Farben, Spacing, Typo, Shadows aus theme.ts importieren.
**NIEMALS** hardcoded Farbwerte im Code.

## Farbpalette (an Landing-Page angeglichen 2026-07-16)
- Lime (Primary): #B8E926
- Violett (Accent): #8B5CF6
- Gold (VIP/Win): #FFD700
- Near-Black (Background): #0D0B11
- Dark Surface: #14111A
- Card Surface: #16121D
- Text Primary: #F2F0F5
- Text Secondary: #A29AAF
- Danger/Loss: #FF7A7A
- Success/Win: #00FF88
- **Font:** Archivo (Google), Signature = Black italic uppercase für Wordmark/Headlines

## BETinas Persönlichkeit (für Chat-Implementierung)
- Friendly, energetic, ein bisschen frech, immer positiv
- "Best friend for game night" — nie belehrend, nie pushy
- Kurze lockere Sätze, Emojis sparsam
- Spricht den Spieler IMMER beim Namen an
- Sprache = Marktsprache des Spielers (EN/ES/FR/PT)
- NIEMALS: "gewinne deine Verluste zurück", Win-Versprechen, Druck

## Screens (in dieser Reihenfolge bauen)
1. **Splash** — BETinas Gesicht erwacht, cinematic animation, GeniusBet Logo
2. **Login** — Handynummer Input, OTP Verify, GeniusBet Branding
3. **Register** — Land-Picker, Name, Geburtsdatum, Email (minimal)
4. **Home** — BETina Avatar prominent, persönliche Begrüßung, Balance, Quick Actions
5. **Chat** — Konversation mit BETina, Glow-Effekte, Avatar oben
6. **Notifications** — Push-Notifications als Timeline
7. **Stats** — Spieler Journey, Wins, aktive Tage, VIP-Fortschritt
8. **Settings** — Sprache, Notifications, Responsible Gaming, Logout

## Spezial-Momente (must-have Animationen)
- **Login Success:** BETinas Avatar nickt, persönliche Begrüßung fliegt ein
- **VIP Tier Up:** Cinematic Premium-Moment
- **Birthday:** Konfetti + Geschenk-Moment
- **Button Press:** kurzer Partikel-Burst in Neon Grün

**Entschieden (2026-07-06):** KEIN "Big Win"/Win-Celebration-Screen — Win/Loss-Messaging
bleibt komplett aus der App (App-Store-Sicherheit: AI Companion, keine Gambling-App).

## Projektstruktur
```
betina-app/
├── app/                    # Expo Router pages
│   ├── (auth)/
│   │   ├── index.tsx       # Splash
│   │   ├── login.tsx       # Phone login
│   │   └── register.tsx    # Registration
│   ├── (tabs)/
│   │   ├── index.tsx       # Home
│   │   ├── chat.tsx        # Chat with BETina
│   │   ├── notifications.tsx
│   │   ├── stats.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
├── src/
│   ├── theme/
│   │   └── index.ts        # Design System (EINZIGE Quelle für Farben/Spacing)
│   ├── components/
│   │   ├── BETinaAvatar.tsx
│   │   ├── GlowCard.tsx
│   │   ├── ParticlesBg.tsx
│   │   ├── AnimatedNumber.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── claude.ts
│   └── hooks/
├── assets/
│   ├── betina-avatar.png
│   └── animations/         # Lottie JSON files
└── CLAUDE.md
```

## Coding Rules
- TypeScript strict — keine `any` ohne Kommentar
- Alle Farben aus `theme` importieren
- Animationen mit Reanimated 3 (`useSharedValue`, `useAnimatedStyle`)
- Lottie für komplexe Animationen (Splash, Celebrations)
- Haptics bei wichtigen Aktionen (`expo-haptics`)
- Loading States immer zeigen
- Error States elegant designen (BETina-Stil, kein Standard-Error)
- Responsive: safe areas immer beachten (`useSafeAreaInsets`)

## Supabase Schema (wird noch angelegt)
- `profiles` — user_id, phone, name, country, language, vip_tier, created_at
- `chat_messages` — user_id, role (user/assistant), content, created_at
- `notifications` — user_id, type, title, body, read, created_at

## Was NICHT in der App passiert
- Kein "Bet Now" Button
- Kein echtes Geld bewegen
- Keine Quoten-Anzeige mit direktem Bet-Link
- Nur: Chat, Empfehlungen, Stats, Push Notifications, Info

---
*Blueprint: BETina App v1.0 | GeniusBet | 2026*
