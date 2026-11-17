// Feature page: the prediction game (Tippspiel).
export default {
  id: 'game',
  order: 1,
  shot: 'screen-predictor',
  pages: {
    en: {
      path: '/prediction-game',
      nav: 'Prediction game',
      teaser: 'Predict football scores, collect points and beat your friends. No money involved.',
      more: 'About the prediction game',
      crumb: 'Prediction game',
      title: 'Football Prediction Game: Free, With Friends – BETina',
      desc: 'Free football prediction game: predict scores, earn points and climb the leaderboard with friends. No money involved, plus an AI companion who plays along.',
      sticker: 'Just for fun · No money',
      h1: 'Free football prediction game:',
      h1b: 'predict scores, beat your friends.',
      lead: 'Call the result before kick-off, collect points when you are right and climb the leaderboard past your friends. The BETina prediction game is free, has no stakes and no payouts, and comes with an AI companion who predicts every match herself.',
      badge: '3 · 2 · 1',
      shotAlt: 'BETina app: football prediction game with leaderboard',
      facts: [
        ['3·2·1', 'Points for exact score, goal difference, right winner'],
        ['5', 'Competitions, from Bundesliga to Champions League'],
        ['0 €', 'No stakes, no prizes, no payouts'],
        ['9', 'Languages you can play in'],
      ],
      sections: [
        {
          type: 'prose', kicker: 'The short version', h2: 'What is the BETina', h2b: 'prediction game?',
          paras: [
            '<strong>The BETina prediction game is a free football score prediction game inside the BETina app.</strong> Before a match kicks off you enter the result you expect. After the final whistle the app compares your prediction with the real score and awards points. Those points decide your place on the leaderboard, overall and in the private rounds you set up with friends.',
            'It is the game people have played in offices and group chats for decades, minus the spreadsheet and minus the money. What is new is who you play with: BETina, the AI sports companion in the app, predicts every match too, hosts the game and is happy to argue about your 3–1.',
          ],
        },
        {
          type: 'steps', kicker: 'How it works', h2: 'The prediction game', h2b: 'in three steps.',
          items: [
            { t: 'Predict the score', p: 'Open the match list, pick a fixture and enter the result you expect, for example 2–1. You can change your prediction as often as you like until kick-off.' },
            { t: 'Watch the match', p: 'At kick-off predictions are locked and revealed, so nobody can copy. If you follow the match in BETina Live, your prediction sits next to the live score.' },
            { t: 'Collect your points', p: 'After the final whistle your points are added automatically and the leaderboard updates. A push tells you how your matchday went.' },
          ],
        },
        {
          type: 'cards', kicker: 'Scoring', h2: 'How points', h2b: 'are awarded.',
          intro: 'One prediction, three ways to score. What counts is the result after 90 minutes plus stoppage time.',
          items: [
            { big: '3', unit: 'points', t: 'Exact score', p: 'You predicted the result to the goal. The best feeling in the game.', eg: 'Predicted 2–1 · Result 2–1' },
            { big: '2', unit: 'points', t: 'Right goal difference', p: 'You had the winner and the margin, but not the exact score. A draw with a different score counts here too.', eg: 'Predicted 2–1 · Result 3–2' },
            { big: '1', unit: 'point', t: 'Right winner', p: 'You called who wins, but the margin was different.', eg: 'Predicted 2–1 · Result 3–0' },
          ],
          after: [
            'A wrong call scores nothing and costs nothing. On top of the match predictions there are <strong>bonus questions</strong> for extra points. Every point you score also earns you XP for your level in the app.',
          ],
        },
        {
          type: 'shot', kicker: 'With friends', h2: 'Play with friends and', h2b: 'climb the leaderboard.', img: 'screen-predictor',
          alt: 'BETina app: prediction round with friends and ranking',
          paras: [
            'A football prediction game is best with people you know. In BETina you create a <strong>private round</strong>, invite your friends, family or colleagues and get your own ranking, separate from the overall leaderboard. Whoever is top on Monday morning gets to talk.',
            'The ranking shows who gained and who dropped places on the last matchday, and your personal statistics show how often you hit the exact score. There is also a team challenge: after every round the average of your group is compared with BETina\'s score. Beat her together.',
          ],
        },
        {
          type: 'chat', flip: true, kicker: 'The difference', h2: 'An AI companion who plays along', h2b: 'and talks football with you.',
          label: 'Example conversation about a prediction',
          paras: [
            'Every other prediction game is a form and a table. In BETina the game has a host. <strong>BETina predicts every match herself.</strong> Her predictions are hidden until kick-off, exactly like everyone else\'s, and she appears in every ranking, so you always have someone to beat.',
            'And you can talk to her about it. Tell her why you see an away win, ask what she makes of a team\'s form, or let her tease you about last weekend. She answers in your language, by text or on a voice call. Her view is an opinion and not advice, and she gets it wrong often enough to keep things interesting.',
          ],
          msgs: [
            ['me', 'I\'m going 3–1 for Saturday. Too brave?'],
            ['b', 'Brave, yes. They haven\'t scored three at home since autumn. But I like the confidence.'],
            ['me', 'And what did you predict?'],
            ['b', 'Nice try. You\'ll see mine at kick-off, like everybody else. 😌'],
          ],
          note: 'Illustrative example. BETina is an AI and can make mistakes.',
        },
        {
          type: 'prose', kicker: 'The principle', h2: 'No money, no stakes:', h2b: 'just points and bragging rights.',
          paras: [
            'The BETina prediction game is played for fun. <strong>You stake nothing, you buy nothing and nothing is paid out.</strong> There are no cash prizes and no entry fees, and there never will be a moment where the app asks for your card. What you win is points, XP, a place on the leaderboard and the right to remind your friends of it.',
            'That is deliberate. BETina is an entertainment app for adults, and the game is meant to make a matchday more fun, whether your team plays or not.',
          ],
        },
        {
          type: 'table', kicker: 'Competitions', h2: 'Competitions you', h2b: 'can predict.',
          intro: 'The prediction game covers five of the biggest competitions in European club football, matchday by matchday.',
          cols: ['Competition', 'Country', 'What you predict'], hl: 0,
          rows: [
            ['Bundesliga', 'Germany', 'Every match of every matchday'],
            ['Premier League', 'England', 'Every match of every matchday'],
            ['LaLiga', 'Spain', 'Every match of every matchday'],
            ['Serie A', 'Italy', 'Every match of every matchday'],
            ['Champions League', 'Europe', 'League phase and knockout rounds'],
          ],
          after: ['You choose which competitions you want to play. Your points from all of them count towards the overall leaderboard.'],
        },
      ],
      faqH2: 'Prediction game', faqH2b: 'FAQ.',
      faq: [
        ['Is the BETina prediction game free?', 'Yes. The game is part of the free BETina app on iPhone, Android and the web. There is no entry fee and no subscription.'],
        ['Is real money involved, and can I win prizes?', 'No. You stake nothing and nothing is paid out. There are no cash or material prizes. You play for points, XP and your place on the leaderboard.'],
        ['How are points scored?', 'Three points for the exact score, two for the right winner with the right goal difference, one for the right winner. The result after 90 minutes plus stoppage time counts.'],
        ['Which leagues and competitions can I predict?', 'Bundesliga, Premier League, LaLiga, Serie A and the Champions League.'],
        ['Can I play the prediction game with my friends?', 'Yes. Create a private round in the app and invite your friends. You get your own ranking in addition to the overall leaderboard.'],
        ['When is the deadline for a prediction, and can I change it?', 'You can enter and change a prediction until the match kicks off. At kick-off it is locked, and only then can the others see it.'],
        ['How is BETina different from other football predictor apps?', 'You play with an AI companion. BETina predicts every match herself, appears in every ranking and talks with you about your predictions, in nine languages.'],
        ['Is the prediction game available on iPhone, Android and the web?', 'Yes. You can play in the iPhone app, the Android app and the web app in your browser, with the same account.'],
      ],
      alsoH2: 'There is more', alsoH2b: 'in the app.',
      homeTeaser: 'Everything BETina can do, on one page.',
      ctaH2: 'Think you know', ctaH2b: 'football? Prove it.',
      ctaText: 'Download BETina, predict your first matchday and see where you land on the leaderboard.',
    },

    de: {
      path: '/de/tippspiel',
      nav: 'Tippspiel',
      teaser: 'Fußball-Ergebnisse tippen, Punkte sammeln und Freunde schlagen. Ganz ohne Geld.',
      more: 'Mehr zum Tippspiel',
      crumb: 'Tippspiel',
      title: 'Tippspiel-App: kostenlos Fußball tippen, ohne Geld – BETina',
      desc: 'Kostenlose Tippspiel-App ohne Geld: Fußball tippen, Punkte sammeln, Freunde in der Rangliste schlagen und mit BETina über deine Tipps reden.',
      sticker: 'Nur zum Spaß · Ohne Geld',
      h1: 'Tippspiel-App:',
      h1b: 'Fußball kostenlos tippen, ohne Geld.',
      lead: 'Tippe das Ergebnis vor dem Anpfiff, sammle Punkte, wenn du richtig liegst, und zieh in der Rangliste an deinen Freunden vorbei. Das BETina Tippspiel ist kostenlos, kommt ohne Einsatz und ohne Auszahlung aus und bringt eine KI-Begleiterin mit, die jedes Spiel selbst tippt.',
      badge: '3 · 2 · 1',
      shotAlt: 'BETina-App: Fußball-Tippspiel mit Rangliste',
      facts: [
        ['3·2·1', 'Punkte für Ergebnis, Tordifferenz, Tendenz'],
        ['5', 'Wettbewerbe von Bundesliga bis Champions League'],
        ['0 €', 'Kein Einsatz, keine Preise, keine Auszahlung'],
        ['9', 'Sprachen, in denen du tippen kannst'],
      ],
      sections: [
        {
          type: 'prose', kicker: 'Kurz erklärt', h2: 'Was ist das', h2b: 'BETina Tippspiel?',
          paras: [
            '<strong>Das BETina Tippspiel ist ein kostenloses Fußball-Tippspiel in der BETina-App.</strong> Vor dem Anpfiff trägst du das Ergebnis ein, das du erwartest. Nach dem Abpfiff vergleicht die App deinen Tipp mit dem echten Ergebnis und vergibt Punkte. Diese Punkte entscheiden über deinen Platz in der Rangliste, insgesamt und in den privaten Tipprunden, die du mit Freunden anlegst.',
            'Es ist das Spiel, das in Büros und Gruppenchats seit Jahrzehnten gespielt wird, nur ohne Tabelle zum Selberrechnen und ohne Geld. Neu ist, mit wem du spielst: BETina, die KI-Sportbegleiterin der App, tippt jedes Spiel mit, moderiert die Runde und diskutiert gern mit dir über dein 3:1.',
          ],
        },
        {
          type: 'steps', kicker: 'So geht’s', h2: 'So funktioniert das Tippspiel', h2b: 'in drei Schritten.',
          items: [
            { t: 'Ergebnis tippen', p: 'Öffne die Spielliste, wähle eine Partie und trag das Ergebnis ein, das du erwartest, zum Beispiel 2:1. Bis zum Anpfiff kannst du deinen Tipp beliebig oft ändern.' },
            { t: 'Spiel verfolgen', p: 'Mit dem Anpfiff werden alle Tipps gesperrt und sichtbar, abschreiben geht also nicht. Verfolgst du das Spiel in BETina Live, steht dein Tipp neben dem Live-Spielstand.' },
            { t: 'Punkte kassieren', p: 'Nach dem Abpfiff werden deine Punkte automatisch gutgeschrieben und die Rangliste aktualisiert. Ein Push sagt dir, wie dein Spieltag gelaufen ist.' },
          ],
        },
        {
          type: 'cards', kicker: 'Punkte und Regeln', h2: 'So wird', h2b: 'gewertet.',
          intro: 'Ein Tipp, drei Möglichkeiten zu punkten. Es zählt das Ergebnis nach 90 Minuten plus Nachspielzeit.',
          items: [
            { big: '3', unit: 'Punkte', t: 'Exaktes Ergebnis', p: 'Du hast das Ergebnis aufs Tor genau getippt. Das beste Gefühl im Spiel.', eg: 'Tipp 2:1 · Ergebnis 2:1' },
            { big: '2', unit: 'Punkte', t: 'Richtige Tordifferenz', p: 'Sieger und Abstand stimmen, das genaue Ergebnis nicht. Auch ein Unentschieden mit anderem Ergebnis zählt hier.', eg: 'Tipp 2:1 · Ergebnis 3:2' },
            { big: '1', unit: 'Punkt', t: 'Richtige Tendenz', p: 'Du hast den Sieger richtig, aber der Abstand war ein anderer.', eg: 'Tipp 2:1 · Ergebnis 3:0' },
          ],
          after: [
            'Ein falscher Tipp bringt nichts und kostet nichts. Zusätzlich zu den Spieltipps gibt es <strong>Bonusfragen</strong> für Extrapunkte. Jeder Punkt bringt dir außerdem XP für dein Level in der App.',
          ],
        },
        {
          type: 'shot', kicker: 'Mit Freunden', h2: 'Tippspiel mit Freunden:', h2b: 'Rangliste statt Gruppenchat-Streit.', img: 'screen-predictor',
          alt: 'BETina-App: Tipprunde mit Freunden und Rangliste',
          paras: [
            'Ein Fußball-Tippspiel macht mit Leuten, die man kennt, am meisten Spaß. In BETina kannst du eine <strong>private Tipprunde erstellen</strong>, Freunde, Familie oder Kollegen einladen und bekommst eine eigene Rangliste, getrennt von der Gesamtwertung. Wer am Montagmorgen oben steht, hat das Wort.',
            'Die Rangliste zeigt, wer am letzten Spieltag Plätze gutgemacht oder verloren hat, und deine persönliche Statistik verrät, wie oft du das exakte Ergebnis triffst. Dazu kommt das Team-Duell: Nach jeder Runde wird der Schnitt eurer Gruppe mit BETinas Punkten verglichen. Schlagt sie gemeinsam.',
          ],
        },
        {
          type: 'chat', flip: true, kicker: 'Der Unterschied', h2: 'BETina tippt mit', h2b: 'und redet mit dir über deine Tipps.',
          label: 'Beispielgespräch über einen Tipp',
          paras: [
            'Jedes andere Tippspiel ist ein Formular und eine Tabelle. Bei BETina hat das Spiel eine Gastgeberin. <strong>BETina tippt jedes Spiel selbst.</strong> Ihre Tipps bleiben bis zum Anpfiff verdeckt, genau wie die aller anderen, und sie steht in jeder Rangliste. Du hast also immer jemanden, den du schlagen kannst: ein Tippspiel gegen die KI.',
            'Und du kannst mit ihr darüber reden. Erzähl ihr, warum du einen Auswärtssieg siehst, frag sie, was sie von der Form einer Mannschaft hält, oder lass dich mit dem letzten Wochenende aufziehen. Sie antwortet in deiner Sprache, im Chat oder am Telefon. Ihre Sicht ist eine Meinung und kein Rat, und sie liegt oft genug daneben, damit es spannend bleibt.',
          ],
          msgs: [
            ['me', 'Ich tippe Samstag 3:1. Zu mutig?'],
            ['b', 'Mutig schon. Drei Tore zu Hause haben sie seit dem Herbst nicht mehr geschafft. Aber die Überzeugung gefällt mir.'],
            ['me', 'Und was hast du getippt?'],
            ['b', 'Netter Versuch. Meinen Tipp siehst du beim Anpfiff, wie alle anderen. 😌'],
          ],
          note: 'Beispiel zur Veranschaulichung. BETina ist eine KI und kann sich irren.',
        },
        {
          type: 'prose', kicker: 'Das Prinzip', h2: 'Ohne Geld, ohne Einsatz:', h2b: 'nur Punkte und Ehre.',
          paras: [
            'Das BETina Tippspiel wird zum Spaß gespielt. <strong>Du setzt nichts ein, du kaufst nichts, und es wird nichts ausgezahlt.</strong> Es gibt keine Geldpreise und keine Startgebühr, und die App fragt an keiner Stelle nach deiner Karte. Zu gewinnen gibt es Punkte, XP, einen Platz in der Rangliste und das Recht, deine Freunde daran zu erinnern.',
            'Das ist Absicht. BETina ist eine Unterhaltungs-App für Erwachsene, und das Tippspiel ohne Geld soll einen Spieltag spannender machen, egal ob dein Verein spielt oder nicht.',
          ],
        },
        {
          type: 'table', kicker: 'Wettbewerbe', h2: 'Diese Wettbewerbe', h2b: 'kannst du tippen.',
          intro: 'Das Tippspiel umfasst fünf der größten Wettbewerbe im europäischen Vereinsfußball, Spieltag für Spieltag.',
          cols: ['Wettbewerb', 'Land', 'Was du tippst'], hl: 0,
          rows: [
            ['Bundesliga', 'Deutschland', 'Jede Partie an jedem Spieltag'],
            ['Premier League', 'England', 'Jede Partie an jedem Spieltag'],
            ['LaLiga', 'Spanien', 'Jede Partie an jedem Spieltag'],
            ['Serie A', 'Italien', 'Jede Partie an jedem Spieltag'],
            ['Champions League', 'Europa', 'Ligaphase und K.-o.-Runden'],
          ],
          after: ['Welche Wettbewerbe du mitspielst, entscheidest du selbst. Deine Punkte aus allen zählen für die Gesamtwertung.'],
        },
      ],
      faqH2: 'Häufige Fragen', faqH2b: 'zum Tippspiel.',
      faq: [
        ['Ist das BETina Tippspiel wirklich kostenlos?', 'Ja. Das Tippspiel gehört zur kostenlosen BETina-App für iPhone, Android und Browser. Es gibt keine Startgebühr und kein Abo.'],
        ['Geht es beim Tippspiel um Geld oder gibt es Preise?', 'Nein. Du setzt nichts ein, und es wird nichts ausgezahlt. Es gibt keine Geld- oder Sachpreise. Gespielt wird um Punkte, XP und den Platz in der Rangliste.'],
        ['Wie werden die Punkte vergeben?', 'Drei Punkte für das exakte Ergebnis, zwei für den richtigen Sieger mit richtiger Tordifferenz, einen für die richtige Tendenz. Es zählt das Ergebnis nach 90 Minuten plus Nachspielzeit.'],
        ['Welche Ligen und Wettbewerbe kann ich tippen?', 'Bundesliga, Premier League, LaLiga, Serie A und die Champions League.'],
        ['Wie spiele ich das Tippspiel mit Freunden?', 'Erstelle in der App eine private Tipprunde und lade deine Freunde ein. Ihr bekommt eine eigene Rangliste, zusätzlich zur Gesamtwertung.'],
        ['Bis wann kann ich einen Tipp abgeben oder ändern?', 'Bis zum Anpfiff der Partie. Mit dem Anpfiff wird der Tipp gesperrt, und erst dann können ihn die anderen sehen.'],
        ['Was unterscheidet BETina von anderen Tippspiel-Apps?', 'Du spielst mit einer KI-Begleiterin. BETina tippt jedes Spiel selbst, steht in jeder Rangliste und redet mit dir über deine Tipps, in neun Sprachen.'],
        ['Gibt es das Tippspiel für iPhone, Android und im Browser?', 'Ja. Du spielst in der iPhone-App, in der Android-App und in der Web-App im Browser, überall mit demselben Konto.'],
      ],
      alsoH2: 'In der App steckt', alsoH2b: 'noch mehr.',
      homeTeaser: 'Alles, was BETina kann, auf einer Seite.',
      ctaH2: 'Du kennst dich aus?', ctaH2b: 'Beweis es.',
      ctaText: 'Lade BETina, tippe deinen ersten Spieltag und schau, wo du in der Rangliste landest.',
    },
  },
};
