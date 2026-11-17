// Feature page: the AI sports chat and voice calls.
export default {
  id: 'chat',
  order: 3,
  shot: 'screen-chat',
  pages: {
    en: {
      path: '/ai-sports-chat',
      nav: 'AI sports chat',
      teaser: 'Chat or call an AI companion who knows your teams and remembers your talks.',
      more: 'About the AI sports chat',
      crumb: 'AI sports chat',
      title: 'AI Sports Chat & Voice Calls – Talk Sport with BETina',
      desc: 'AI sports chat with BETina: chat or call a companion who knows your teams, remembers your talks and speaks 9 languages. Free, no money involved.',
      sticker: 'Chat · Voice · 9 languages',
      h1: 'AI sports chat:',
      h1b: 'talk sport with BETina, by text or voice.',
      lead: 'BETina is an AI companion you can talk to about sport the way you talk to a friend who watches everything. Write to her or call her. She knows your teams, remembers what you said last week and answers in your language.',
      badge: '● Online now',
      shotAlt: 'BETina app: AI sports chat with BETina',
      facts: [
        ['24/7', 'She is there whenever you want to talk sport'],
        ['9', 'Languages, switching whenever you do'],
        ['11+', 'Sports, from football to cricket'],
        ['0 €', 'Free to chat, no money involved'],
      ],
      sections: [
        {
          type: 'prose', kicker: 'The short version', h2: 'What is BETina\'s', h2b: 'AI sports chat?',
          paras: [
            '<strong>BETina\'s AI sports chat is a conversation with an AI companion who lives for sport.</strong> It is the heart of the BETina app. You ask a question or simply say what is on your mind after a match, and BETina answers like a person with opinions: short, direct and in the tone of someone who actually watched.',
            'Most AI sports chatbots are question-and-answer tools tied to one league or one broadcaster. BETina is one personality across every sport. She knows which teams you support, she brings up things you told her before, and you can phone her when typing is too slow. You can talk to an AI about football, tennis or the NFL in the same chat.',
          ],
        },
        {
          type: 'cards', kicker: 'Topics', h2: 'What you can', h2b: 'talk about.',
          items: [
            { t: 'Your teams and your matchday', p: 'Line-ups, form, that substitution nobody understood. BETina knows your favourite teams and has the live football scores at hand, so she is on the same page as you.' },
            { t: 'Rules, history and debates', p: 'Why was that offside? Who was the better number ten? Ask for a quick explanation or pick a fight about the greatest team of all time.' },
            { t: 'Every sport, not just one league', p: 'Football, tennis, NFL, MMA, cricket and more. Learn a new sport from scratch or go deep on the one you have followed for twenty years.' },
          ],
        },
        {
          type: 'chat', kicker: 'Examples', h2: 'Three conversations', h2b: 'with BETina.',
          label: 'Example conversation: a rule explained',
          paras: [
            '<strong>The rule explainer.</strong> You saw a goal ruled out and want to know why, without reading a rulebook. BETina explains it in three sentences and offers to go deeper.',
            '<strong>The morning after.</strong> You are still annoyed about Saturday. BETina remembers that you were worried about the midfield last week and picks the conversation up right there.',
            '<strong>The new sport.</strong> A friend drags you to a tennis final or an NFL night. Ask BETina for the scoring in plain words, and you will follow the match by the first break.',
          ],
          msgs: [
            ['me', 'Why was that goal ruled out? He looked level to me.'],
            ['b', 'Level is fine, but his shoulder was past the last defender when the pass was played. Shoulders count, arms don\'t.'],
            ['me', 'That close?'],
            ['b', 'A few centimetres. Painful, I know. Want the 20-second version of how the line is drawn?'],
          ],
          note: 'Illustrative example. BETina is an AI and can make mistakes.',
        },
        {
          type: 'shot', flip: true, kicker: 'Voice', h2: 'Call BETina:', h2b: 'voice chat with an AI about sport.', img: 'screen-call',
          alt: 'BETina app: voice call with BETina',
          paras: [
            'Sometimes you do not want to type. In the app you can <strong>call BETina and talk about sport by voice</strong>, hands-free, on the way to the stadium or with the match on in the background. She listens, answers out loud and keeps up when you interrupt, the way a phone call works.',
            'On a call she knows the same things as in the chat: your teams, your earlier conversations and the live football scores. Voice calls are included for free with a daily call allowance.',
          ],
        },
        {
          type: 'prose', kicker: 'Memory', h2: 'She remembers your teams', h2b: 'and your last chat.',
          paras: [
            'A conversation gets better when you do not have to start from zero. BETina keeps in mind which teams and sports you follow and what you told her, so next week she can ask how the derby felt or whether your knee survived the five-a-side.',
            'You stay in control of that memory. You can ask for your chat history or the things BETina remembered about you to be deleted, and deleting your account removes them completely. The details are on the <a href="/delete-account">account and data page</a>.',
          ],
        },
        {
          type: 'ticks', kicker: 'Languages', h2: 'One companion,', h2b: 'nine languages.',
          intro: 'BETina answers in the language you write or speak in, and switches when you do. That makes her an AI sports chat for people who follow a league in one language and live in another.',
          items: [
            '<strong>English</strong>', '<strong>German</strong> (Deutsch)', '<strong>Spanish</strong> (Español)', '<strong>French</strong> (Français)', '<strong>Portuguese</strong> (Português)',
            '<strong>Italian</strong> (Italiano)', '<strong>Romanian</strong> (Română)', '<strong>Turkish</strong> (Türkçe)', '<strong>Croatian</strong> (Hrvatski)',
          ],
        },
        {
          type: 'prose', kicker: 'Straight talk', h2: 'What BETina', h2b: 'is not.',
          paras: [
            '<strong>BETina is an AI, not a real person.</strong> She has a personality and opinions, but they are generated by software, and like every AI she can get facts wrong. Treat what she says about sport as a view to argue with, not as a verified source.',
            'She is also not an adviser. BETina is an entertainment app for adults (18+), and no money is involved anywhere in the app. Her take on a match is conversation, nothing more.',
          ],
        },
        {
          type: 'steps', kicker: 'Get started', h2: 'How to start', h2b: 'chatting.',
          items: [
            { t: 'Get BETina', p: 'Download the free app from the App Store or Google Play, or open the web app in your browser.' },
            { t: 'Sign in and pick your teams', p: 'Sign in with Apple, Google, email or phone and choose the teams and sports you care about.' },
            { t: 'Say hello', p: 'Type your first message or tap the microphone to call her. If you do not know where to start, ask about tonight\'s match.' },
          ],
        },
      ],
      faqH2: 'Questions about', faqH2b: 'the AI sports chat.',
      faq: [
        ['Can I really talk to an AI about sports?', 'Yes. BETina is an AI companion built for sport. You can chat with her by text or call her and talk about matches, teams, rules and sporting history.'],
        ['Is the AI sports chat free?', 'Yes. Chatting with BETina is free on iPhone, Android and the web. Voice calls are included with a daily call allowance.'],
        ['Is real money involved?', 'No. BETina is an entertainment app. No money is staked or paid out anywhere in the app.'],
        ['Which sports can I talk to BETina about?', 'Football, tennis, NFL, MMA, cricket and many more. Live scores in the app are available for football.'],
        ['Can BETina remember my favourite team and earlier chats?', 'Yes. She keeps your favourite teams and things you told her in mind and refers back to them. You can have this data deleted at any time.'],
        ['How do voice calls with BETina work?', 'Tap the microphone in the chat to start a call. You speak, BETina answers out loud, and you can interrupt her like on a normal phone call.'],
        ['Which languages does BETina speak?', 'English, German, Spanish, French, Portuguese, Italian, Romanian, Turkish and Croatian. She answers in the language you use.'],
        ['Is BETina a real person? Are her answers always right?', 'No and no. BETina is an AI with her own personality. She can make mistakes, so check anything important against an official source.'],
      ],
      alsoH2: 'There is more', alsoH2b: 'in the app.',
      homeTeaser: 'Everything BETina can do, on one page.',
      ctaH2: 'Somebody to talk', ctaH2b: 'sport with. Always.',
      ctaText: 'Download BETina and start the conversation. She already has an opinion on your team.',
    },

    de: {
      path: '/de/ki-sport-chat',
      nav: 'KI-Sport-Chat',
      teaser: 'Schreib einer KI-Begleiterin oder ruf sie an. Sie kennt deine Vereine und merkt sich eure Gespräche.',
      more: 'Mehr zum KI-Sport-Chat',
      crumb: 'KI-Sport-Chat',
      title: 'KI-Sport-Chat: Mit KI über Fußball & Sport reden | BETina',
      desc: 'KI-Sport-Chat mit BETina: Schreib ihr oder ruf sie an. Sie kennt deine Teams, merkt sich eure Gespräche und spricht 9 Sprachen. Kostenlos, ohne Geld.',
      sticker: 'Chat · Anruf · 9 Sprachen',
      h1: 'KI-Sport-Chat:',
      h1b: 'mit BETina über Fußball und Sport reden.',
      lead: 'BETina ist eine KI-Begleiterin, mit der du über Sport redest wie mit einer Freundin, die jedes Spiel gesehen hat. Schreib ihr oder ruf sie an. Sie kennt deine Vereine, weiß noch, was du letzte Woche gesagt hast, und antwortet in deiner Sprache.',
      badge: '● Jetzt online',
      shotAlt: 'BETina-App: KI-Sport-Chat mit BETina',
      facts: [
        ['24/7', 'Sie ist da, wann immer du über Sport reden willst'],
        ['9', 'Sprachen, sie wechselt mit dir'],
        ['11+', 'Sportarten, von Fußball bis Cricket'],
        ['0 €', 'Kostenlos chatten, ganz ohne Geld'],
      ],
      sections: [
        {
          type: 'prose', kicker: 'Kurz erklärt', h2: 'Was ist der KI-Sport-Chat', h2b: 'von BETina?',
          paras: [
            '<strong>Der KI-Sport-Chat von BETina ist ein Gespräch mit einer KI-Begleiterin, die für Sport lebt.</strong> Er ist das Herz der BETina-App. Du stellst eine Frage oder sagst einfach, was dir nach dem Spiel durch den Kopf geht, und BETina antwortet wie jemand mit Meinung: kurz, direkt und im Ton von jemandem, der wirklich zugeschaut hat.',
            'Die meisten KI-Chatbots für Fußball sind Frage-Antwort-Werkzeuge, die an eine Liga oder einen Sender gebunden sind. BETina ist eine Persönlichkeit für alle Sportarten. Sie weiß, zu welchen Vereinen du hältst, greift auf, was du ihr früher erzählt hast, und du kannst sie anrufen, wenn Tippen zu langsam ist.',
          ],
        },
        {
          type: 'cards', kicker: 'Themen', h2: 'Mit KI über Fußball reden', h2b: 'und über jeden anderen Sport.',
          items: [
            { t: 'Dein Verein, dein Spieltag', p: 'Aufstellung, Form, die Auswechslung, die keiner verstanden hat. BETina kennt deine Lieblingsvereine und hat die Fußball-Live-Ergebnisse zur Hand, ihr seid also auf demselben Stand.' },
            { t: 'Regeln, Geschichte, Stammtisch-Debatten', p: 'Warum war das Abseits? Wer war der bessere Zehner? Lass dir etwas kurz erklären oder fang einen Streit über die beste Mannschaft aller Zeiten an.' },
            { t: 'Tennis, NFL, MMA, Cricket und mehr', p: 'Lern eine neue Sportart von Grund auf oder geh in die Tiefe bei der, die du seit zwanzig Jahren verfolgst. Der KI-Chat kann beides.' },
          ],
        },
        {
          type: 'chat', kicker: 'Beispiele', h2: 'Drei Gespräche', h2b: 'mit BETina.',
          label: 'Beispielgespräch: eine Regel erklärt',
          paras: [
            '<strong>Die Regelfrage.</strong> Ein Tor wird aberkannt, und du willst wissen, warum, ohne ein Regelheft zu lesen. BETina erklärt es in drei Sätzen und bietet an, tiefer einzusteigen.',
            '<strong>Der Morgen danach.</strong> Du ärgerst dich noch über Samstag. BETina weiß, dass du dir letzte Woche Sorgen ums Mittelfeld gemacht hast, und knüpft genau dort an.',
            '<strong>Die neue Sportart.</strong> Freunde schleppen dich zum Tennis-Finale oder zu einer NFL-Nacht. Lass dir von BETina die Zählweise in einfachen Worten erklären, und du kommst schon im ersten Satz mit.',
          ],
          msgs: [
            ['me', 'Warum zählt das Tor nicht? Der stand doch auf gleicher Höhe.'],
            ['b', 'Gleiche Höhe wäre okay, aber seine Schulter war beim Abspiel am letzten Verteidiger vorbei. Schultern zählen, Arme nicht.'],
            ['me', 'So knapp?'],
            ['b', 'Ein paar Zentimeter. Tut weh, ich weiß. Willst du die 20-Sekunden-Version, wie die Linie gezogen wird?'],
          ],
          note: 'Beispiel zur Veranschaulichung. BETina ist eine KI und kann sich irren.',
        },
        {
          type: 'shot', flip: true, kicker: 'Anruf', h2: 'Ruf BETina an:', h2b: 'Sprachchat mit der KI.', img: 'screen-call',
          alt: 'BETina-App: Sprachanruf mit BETina',
          paras: [
            'Manchmal will man nicht tippen. In der App kannst du <strong>BETina anrufen und per Stimme über Sport sprechen</strong>, freihändig, auf dem Weg ins Stadion oder während das Spiel im Hintergrund läuft. Sie hört zu, antwortet laut und kommt mit, wenn du ihr ins Wort fällst, wie bei einem Telefonat.',
            'Am Telefon weiß sie dasselbe wie im Chat: deine Vereine, eure früheren Gespräche und die Fußball-Live-Ergebnisse. Sprachanrufe sind kostenlos dabei, mit einem täglichen Gesprächskontingent.',
          ],
        },
        {
          type: 'prose', kicker: 'Gedächtnis', h2: 'Sie kennt deinen Verein', h2b: 'und merkt sich eure Gespräche.',
          paras: [
            'Ein Gespräch wird besser, wenn man nicht jedes Mal bei null anfängt. BETina merkt sich, welchen Vereinen und Sportarten du folgst und was du ihr erzählt hast. Nächste Woche kann sie also fragen, wie sich das Derby angefühlt hat oder ob dein Knie das Hallenturnier überlebt hat.',
            'Über dieses Gedächtnis bestimmst du. Du kannst deinen Chatverlauf oder das, was BETina sich über dich gemerkt hat, löschen lassen, und mit dem Löschen deines Kontos verschwindet alles vollständig. Die Einzelheiten stehen auf der <a href="/delete-account">Seite zu Konto und Daten</a>.',
          ],
        },
        {
          type: 'ticks', kicker: 'Sprachen', h2: 'Eine Begleiterin,', h2b: 'neun Sprachen.',
          intro: 'BETina antwortet in der Sprache, in der du schreibst oder sprichst, und wechselt mit dir. Das macht sie zum KI-Sport-Chat für alle, die eine Liga in der einen Sprache verfolgen und in einer anderen leben.',
          items: [
            '<strong>Deutsch</strong>', '<strong>Englisch</strong> (English)', '<strong>Spanisch</strong> (Español)', '<strong>Französisch</strong> (Français)', '<strong>Portugiesisch</strong> (Português)',
            '<strong>Italienisch</strong> (Italiano)', '<strong>Rumänisch</strong> (Română)', '<strong>Türkisch</strong> (Türkçe)', '<strong>Kroatisch</strong> (Hrvatski)',
          ],
        },
        {
          type: 'prose', kicker: 'Klartext', h2: 'Was BETina', h2b: 'nicht ist.',
          paras: [
            '<strong>BETina ist eine KI, kein echter Mensch.</strong> Sie hat eine Persönlichkeit und Meinungen, aber beides stammt aus Software, und wie jede KI kann sie bei Fakten danebenliegen. Nimm, was sie über Sport sagt, als Ansicht, über die man streiten kann, nicht als geprüfte Quelle.',
            'Eine Beraterin ist sie auch nicht. BETina ist eine Unterhaltungs-App für Erwachsene (ab 18), und in der App ist nirgends Geld im Spiel. Ihre Einschätzung zu einem Spiel ist Gespräch, mehr nicht.',
          ],
        },
        {
          type: 'steps', kicker: 'Loslegen', h2: 'So startest du', h2b: 'den Chat.',
          items: [
            { t: 'BETina laden', p: 'Lade die kostenlose App im App Store oder bei Google Play oder öffne die Web-App im Browser.' },
            { t: 'Anmelden und Vereine wählen', p: 'Melde dich mit Apple, Google, E-Mail oder Telefonnummer an und wähle die Vereine und Sportarten, die dir wichtig sind.' },
            { t: 'Hallo sagen', p: 'Schreib deine erste Nachricht oder tippe aufs Mikrofon, um sie anzurufen. Wenn dir kein Anfang einfällt, frag nach dem Spiel von heute Abend.' },
          ],
        },
      ],
      faqH2: 'Fragen zum', faqH2b: 'KI-Sport-Chat.',
      faq: [
        ['Kann man mit einer KI über Fußball reden?', 'Ja. BETina ist eine KI-Begleiterin für Sport. Du kannst ihr schreiben oder sie anrufen und über Spiele, Vereine, Regeln und Sportgeschichte reden.'],
        ['Ist der KI-Sport-Chat kostenlos?', 'Ja. Der Chat mit BETina ist auf iPhone, Android und im Browser kostenlos. Sprachanrufe sind mit einem täglichen Gesprächskontingent dabei.'],
        ['Geht es um echtes Geld?', 'Nein. BETina ist eine Unterhaltungs-App. In der App wird nirgends Geld eingesetzt oder ausgezahlt.'],
        ['Über welche Sportarten kann ich mit BETina sprechen?', 'Über Fußball, Tennis, NFL, MMA, Cricket und viele mehr. Live-Ergebnisse gibt es in der App für Fußball.'],
        ['Merkt sich BETina meinen Lieblingsverein und frühere Gespräche?', 'Ja. Sie merkt sich deine Lieblingsvereine und Dinge, die du ihr erzählt hast, und kommt darauf zurück. Du kannst diese Daten jederzeit löschen lassen.'],
        ['Wie funktioniert der Sprachanruf mit BETina?', 'Tippe im Chat auf das Mikrofon, um einen Anruf zu starten. Du sprichst, BETina antwortet laut, und du kannst ihr wie bei einem normalen Telefonat ins Wort fallen.'],
        ['In welchen Sprachen antwortet BETina?', 'Auf Deutsch, Englisch, Spanisch, Französisch, Portugiesisch, Italienisch, Rumänisch, Türkisch und Kroatisch. Sie antwortet in der Sprache, die du benutzt.'],
        ['Ist BETina ein echter Mensch? Stimmen ihre Antworten immer?', 'Nein und nein. BETina ist eine KI mit eigener Persönlichkeit. Sie kann sich irren, prüfe Wichtiges also bei einer offiziellen Quelle nach.'],
      ],
      alsoH2: 'In der App steckt', alsoH2b: 'noch mehr.',
      homeTeaser: 'Alles, was BETina kann, auf einer Seite.',
      ctaH2: 'Jemand zum Reden', ctaH2b: 'über Sport. Immer.',
      ctaText: 'Lade BETina und fang das Gespräch an. Eine Meinung zu deinem Verein hat sie schon.',
    },
  },
};
