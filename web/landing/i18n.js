(function () {
  'use strict';

  const SUPPORTED = ['en', 'de', 'es', 'fr', 'pt'];
  const countryLanguage = {
    AT:'de', DE:'de', LI:'de',
    ES:'es', MX:'es', AR:'es', CL:'es', CO:'es', PE:'es', VE:'es', EC:'es', BO:'es', PY:'es', UY:'es', SV:'es', GT:'es', HN:'es', NI:'es', CR:'es', PA:'es', DO:'es', CU:'es', GQ:'es',
    PT:'pt', BR:'pt', AO:'pt', MZ:'pt', CV:'pt', GW:'pt', ST:'pt', TL:'pt',
    FR:'fr', BE:'fr', LU:'fr', MC:'fr', CH:'fr', CA:'fr', SN:'fr', CI:'fr', CM:'fr', CD:'fr', CG:'fr', ML:'fr', BF:'fr', NE:'fr', TG:'fr', BJ:'fr', GA:'fr', GN:'fr', DJ:'fr', HT:'fr', MG:'fr', RW:'fr', BI:'fr'
  };

  const translations = {
    de: {
      'Features':'Funktionen','How it works':'So funktioniert’s','Privacy':'Datenschutz','Support':'Support','Terms':'AGB','Contact':'Kontakt','Try Web App →':'Web-App testen →','Try on Web →':'Im Web testen →',
      'Powered by GeniusBet AI':'Unterstützt von GeniusBet AI','Sports,':'Sport,','reimagined':'neu gedacht','with AI.':'mit KI.',
      'Meet BETina — your personal AI sports companion. Live scores, smart predictions, instant answers and real conversation. One app, every match.':'Lerne BETina kennen — deine persönliche KI-Sportbegleiterin. Live-Ergebnisse, smarte Prognosen, sofortige Antworten und echte Gespräche. Eine App für jedes Spiel.',
      'Download BETina':'BETina herunterladen','online · ready to talk sports':'online · bereit für Sportgespräche','Show lineups':'Aufstellungen zeigen','Head-to-head':'Direkter Vergleich','Remind me':'Erinnere mich','Ask BETina anything…':'Frag BETina alles …','+1 XP for chatting':'Eine XP fürs Chatten',
      'Sports & Leagues':'Sportarten & Ligen','Live AI Chat':'Live-KI-Chat','Languages':'Sprachen','XP & Rewards':'XP & Belohnungen','What’s inside':'Das steckt drin',"What's inside":'Das steckt drin','Everything a sports fan':'Alles, was Sportfans','needs.':'brauchen.',
      'Live Scores & Fixtures':'Live-Ergebnisse & Spiele','Real-time match updates, upcoming games and league tables for your teams — always one glance away.':'Live-Updates, kommende Spiele und Tabellen deiner Teams — immer sofort im Blick.',
      'AI-Powered Chat':'KI-gestützter Chat','Talk to BETina about anything sports. She remembers your team, your style, and gets sharper with every chat.':'Sprich mit BETina über alles rund um Sport. Sie kennt dein Team, deinen Stil und wird mit jedem Chat besser.',
      'Match Predictions':'Spielprognosen','AI-powered insights on upcoming matches. Call the result, earn XP, climb the leaderboard.':'KI-gestützte Einblicke in kommende Spiele. Tippe das Ergebnis, sammle XP und steige in der Rangliste auf.',
      'Smart Reminders':'Smarte Erinnerungen','Just say "remind me before the game" — BETina handles the rest. Never miss a kickoff again.':'Sag einfach „Erinnere mich vor dem Spiel“ — BETina erledigt den Rest. Verpasse keinen Anpfiff mehr.',
      'Earn XP for chatting, daily streaks and correct predictions. Climb the tiers: Initiate → Thinker → Analyst → Mastermind → Genius.':'Sammle XP durch Chats, tägliche Serien und richtige Prognosen. Steige auf: Initiate → Thinker → Analyst → Mastermind → Genius.',
      '7 Languages':'7 Sprachen','English, German, Spanish, Portuguese, French, Italian and Romanian — BETina speaks yours.':'Englisch, Deutsch, Spanisch, Portugiesisch, Französisch, Italienisch und Rumänisch — BETina spricht deine Sprache.',
      'Getting started':'Erste Schritte','Up & running in':'Startklar in','60 seconds.':'60 Sekunden.','Download the app':'App herunterladen','Available now on Google Play and the Apple App Store.':'Jetzt bei Google Play und im Apple App Store verfügbar.',
      'Pick your teams':'Wähle deine Teams','Sign in with your phone number and choose your favorites — BETina personalizes everything from day one.':'Melde dich mit deiner Telefonnummer an und wähle deine Favoriten — BETina personalisiert alles vom ersten Tag an.',
      'Chat & earn XP':'Chatten & XP sammeln','Ask anything, set reminders, predict matches. Every interaction earns XP — from Initiate all the way to Genius.':'Frag alles, setze Erinnerungen und tippe Spiele. Jede Interaktion bringt XP — von Initiate bis Genius.',
      'Your team deserves better than a':'Dein Team verdient mehr als eine','search bar.':'Suchleiste.','Join thousands of fans who talk sports with BETina every day.':'Schließe dich Tausenden Fans an, die täglich mit BETina über Sport sprechen.',
      'Available on':'Verfügbar für','Available now':'Jetzt verfügbar','Get it on':'Jetzt bei','We use cookies.':'Wir verwenden Cookies.','Privacy Policy':'Datenschutzrichtlinie','Essential only':'Nur notwendige','Accept all':'Alle akzeptieren'
    },
    es: {
      'Features':'Funciones','How it works':'Cómo funciona','Privacy':'Privacidad','Support':'Soporte','Terms':'Términos','Contact':'Contacto','Try Web App →':'Probar versión web →','Try on Web →':'Probar en la web →','Powered by GeniusBet AI':'Con tecnología de GeniusBet AI','Sports,':'Deportes,','reimagined':'reinventados','with AI.':'con IA.',
      'Meet BETina — your personal AI sports companion. Live scores, smart predictions, instant answers and real conversation. One app, every match.':'Conoce a BETina, tu compañera deportiva con IA. Resultados en vivo, predicciones inteligentes, respuestas instantáneas y conversaciones reales. Una app para cada partido.','Download BETina':'Descargar BETina','online · ready to talk sports':'en línea · lista para hablar de deportes','Show lineups':'Ver alineaciones','Head-to-head':'Cara a cara','Remind me':'Recuérdame','Ask BETina anything…':'Pregúntale a BETina…','+1 XP for chatting':'+1 XP por chatear','Sports & Leagues':'Deportes y ligas','Live AI Chat':'Chat con IA en vivo','Languages':'Idiomas','XP & Rewards':'XP y recompensas',"What's inside":'Qué incluye','Everything a sports fan':'Todo lo que un fan','needs.':'necesita.',
      'Live Scores & Fixtures':'Resultados y partidos en vivo','Real-time match updates, upcoming games and league tables for your teams — always one glance away.':'Actualizaciones en tiempo real, próximos partidos y clasificaciones de tus equipos, siempre a un vistazo.','AI-Powered Chat':'Chat con IA','Talk to BETina about anything sports. She remembers your team, your style, and gets sharper with every chat.':'Habla con BETina de cualquier tema deportivo. Recuerda tu equipo y tu estilo, y mejora con cada conversación.','Match Predictions':'Predicciones','AI-powered insights on upcoming matches. Call the result, earn XP, climb the leaderboard.':'Análisis con IA de próximos partidos. Predice el resultado, gana XP y sube en la clasificación.','Smart Reminders':'Recordatorios inteligentes','Just say "remind me before the game" — BETina handles the rest. Never miss a kickoff again.':'Di “recuérdame antes del partido” y BETina hará el resto. No vuelvas a perderte un inicio.','Earn XP for chatting, daily streaks and correct predictions. Climb the tiers: Initiate → Thinker → Analyst → Mastermind → Genius.':'Gana XP por chatear, mantener rachas y acertar predicciones. Sube de Initiate a Genius.','7 Languages':'7 idiomas','English, German, Spanish, Portuguese, French, Italian and Romanian — BETina speaks yours.':'Inglés, alemán, español, portugués, francés, italiano y rumano: BETina habla tu idioma.','Getting started':'Primeros pasos','Up & running in':'Empieza en','60 seconds.':'60 segundos.','Download the app':'Descarga la app','Available now on Google Play and the Apple App Store.':'Ya disponible en Google Play y Apple App Store.','Pick your teams':'Elige tus equipos','Sign in with your phone number and choose your favorites — BETina personalizes everything from day one.':'Inicia sesión con tu número y elige tus favoritos. BETina personaliza todo desde el primer día.','Chat & earn XP':'Chatea y gana XP','Ask anything, set reminders, predict matches. Every interaction earns XP — from Initiate all the way to Genius.':'Pregunta, crea recordatorios y predice partidos. Cada interacción suma XP, de Initiate a Genius.','Your team deserves better than a':'Tu equipo merece más que una','search bar.':'barra de búsqueda.','Join thousands of fans who talk sports with BETina every day.':'Únete a miles de fans que hablan de deportes con BETina cada día.','Available on':'Disponible en','Available now':'Ya disponible','Get it on':'Consíguela en','We use cookies.':'Usamos cookies.','Privacy Policy':'Política de privacidad','Essential only':'Solo esenciales','Accept all':'Aceptar todo'
    },
    fr: {
      'Features':'Fonctionnalités','How it works':'Comment ça marche','Privacy':'Confidentialité','Support':'Assistance','Terms':'Conditions','Contact':'Contact','Try Web App →':'Essayer sur le Web →','Try on Web →':'Essayer sur le Web →','Powered by GeniusBet AI':'Propulsé par GeniusBet AI','Sports,':'Le sport,','reimagined':'réinventé','with AI.':'avec l’IA.','Meet BETina — your personal AI sports companion. Live scores, smart predictions, instant answers and real conversation. One app, every match.':'Découvrez BETina, votre compagne sportive IA. Scores en direct, prédictions intelligentes, réponses instantanées et vraies conversations. Une seule app pour chaque match.','Download BETina':'Télécharger BETina','online · ready to talk sports':'en ligne · prête à parler sport','Show lineups':'Voir les compositions','Head-to-head':'Face-à-face','Remind me':'Me rappeler','Ask BETina anything…':'Demandez à BETina…','+1 XP for chatting':'+1 XP pour le chat','Sports & Leagues':'Sports et ligues','Live AI Chat':'Chat IA en direct','Languages':'Langues','XP & Rewards':'XP et récompenses',"What's inside":'Au programme','Everything a sports fan':'Tout ce dont un fan','needs.':'a besoin.','Live Scores & Fixtures':'Scores et matchs en direct','Real-time match updates, upcoming games and league tables for your teams — always one glance away.':'Suivi en temps réel, prochains matchs et classements de vos équipes, toujours à portée de regard.','AI-Powered Chat':'Chat propulsé par l’IA','Talk to BETina about anything sports. She remembers your team, your style, and gets sharper with every chat.':'Parlez sport avec BETina. Elle retient votre équipe et votre style, et s’améliore à chaque conversation.','Match Predictions':'Prédictions de matchs','AI-powered insights on upcoming matches. Call the result, earn XP, climb the leaderboard.':'Analyses IA des prochains matchs. Prédisez le résultat, gagnez des XP et grimpez au classement.','Smart Reminders':'Rappels intelligents','Just say "remind me before the game" — BETina handles the rest. Never miss a kickoff again.':'Dites « rappelle-moi avant le match » et BETina s’occupe du reste. Ne manquez plus aucun coup d’envoi.','Earn XP for chatting, daily streaks and correct predictions. Climb the tiers: Initiate → Thinker → Analyst → Mastermind → Genius.':'Gagnez des XP grâce aux chats, aux séries et aux bonnes prédictions. Progressez de Initiate à Genius.','7 Languages':'7 langues','English, German, Spanish, Portuguese, French, Italian and Romanian — BETina speaks yours.':'Anglais, allemand, espagnol, portugais, français, italien et roumain : BETina parle votre langue.','Getting started':'Bien démarrer','Up & running in':'Prêt en','60 seconds.':'60 secondes.','Download the app':'Téléchargez l’app','Available now on Google Play and the Apple App Store.':'Disponible maintenant sur Google Play et l’Apple App Store.','Pick your teams':'Choisissez vos équipes','Sign in with your phone number and choose your favorites — BETina personalizes everything from day one.':'Connectez-vous avec votre numéro et choisissez vos favoris. BETina personnalise tout dès le premier jour.','Chat & earn XP':'Discutez et gagnez des XP','Ask anything, set reminders, predict matches. Every interaction earns XP — from Initiate all the way to Genius.':'Posez vos questions, créez des rappels et prédisez les matchs. Chaque interaction rapporte des XP.','Your team deserves better than a':'Votre équipe mérite mieux qu’une','search bar.':'barre de recherche.','Join thousands of fans who talk sports with BETina every day.':'Rejoignez les milliers de fans qui parlent sport avec BETina chaque jour.','Available on':'Disponible sur','Available now':'Disponible','Get it on':'Disponible sur','We use cookies.':'Nous utilisons des cookies.','Privacy Policy':'Politique de confidentialité','Essential only':'Essentiels uniquement','Accept all':'Tout accepter'
    },
    pt: {
      'Features':'Funcionalidades','How it works':'Como funciona','Privacy':'Privacidade','Support':'Suporte','Terms':'Termos','Contact':'Contato','Try Web App →':'Testar na Web →','Try on Web →':'Testar na Web →','Powered by GeniusBet AI':'Com tecnologia GeniusBet AI','Sports,':'Esportes,','reimagined':'reinventados','with AI.':'com IA.','Meet BETina — your personal AI sports companion. Live scores, smart predictions, instant answers and real conversation. One app, every match.':'Conheça a BETina, sua companheira esportiva com IA. Placar ao vivo, previsões inteligentes, respostas instantâneas e conversas reais. Um app para cada jogo.','Download BETina':'Baixar BETina','online · ready to talk sports':'online · pronta para falar de esportes','Show lineups':'Ver escalações','Head-to-head':'Confronto direto','Remind me':'Lembrar-me','Ask BETina anything…':'Pergunte à BETina…','+1 XP for chatting':'+1 XP por conversar','Sports & Leagues':'Esportes e ligas','Live AI Chat':'Chat de IA ao vivo','Languages':'Idiomas','XP & Rewards':'XP e recompensas',"What's inside":'O que tem dentro','Everything a sports fan':'Tudo que um fã','needs.':'precisa.','Live Scores & Fixtures':'Placares e jogos ao vivo','Real-time match updates, upcoming games and league tables for your teams — always one glance away.':'Atualizações em tempo real, próximos jogos e tabelas dos seus times sempre à vista.','AI-Powered Chat':'Chat com IA','Talk to BETina about anything sports. She remembers your team, your style, and gets sharper with every chat.':'Fale com a BETina sobre esportes. Ela lembra seu time e seu estilo e melhora a cada conversa.','Match Predictions':'Previsões de jogos','AI-powered insights on upcoming matches. Call the result, earn XP, climb the leaderboard.':'Análises por IA dos próximos jogos. Acerte o resultado, ganhe XP e suba no ranking.','Smart Reminders':'Lembretes inteligentes','Just say "remind me before the game" — BETina handles the rest. Never miss a kickoff again.':'Diga “lembre-me antes do jogo” e a BETina cuida do resto. Nunca mais perca o início.','Earn XP for chatting, daily streaks and correct predictions. Climb the tiers: Initiate → Thinker → Analyst → Mastermind → Genius.':'Ganhe XP conversando, mantendo sequências e acertando previsões. Suba de Initiate até Genius.','7 Languages':'7 idiomas','English, German, Spanish, Portuguese, French, Italian and Romanian — BETina speaks yours.':'Inglês, alemão, espanhol, português, francês, italiano e romeno — a BETina fala o seu idioma.','Getting started':'Primeiros passos','Up & running in':'Comece em','60 seconds.':'60 segundos.','Download the app':'Baixe o app','Available now on Google Play and the Apple App Store.':'Disponível agora no Google Play e na Apple App Store.','Pick your teams':'Escolha seus times','Sign in with your phone number and choose your favorites — BETina personalizes everything from day one.':'Entre com seu telefone e escolha seus favoritos. A BETina personaliza tudo desde o primeiro dia.','Chat & earn XP':'Converse e ganhe XP','Ask anything, set reminders, predict matches. Every interaction earns XP — from Initiate all the way to Genius.':'Pergunte, crie lembretes e faça previsões. Cada interação rende XP, de Initiate até Genius.','Your team deserves better than a':'Seu time merece mais que uma','search bar.':'barra de pesquisa.','Join thousands of fans who talk sports with BETina every day.':'Junte-se a milhares de fãs que falam de esportes com a BETina todos os dias.','Available on':'Disponível no','Available now':'Disponível agora','Get it on':'Baixe no','We use cookies.':'Usamos cookies.','Privacy Policy':'Política de privacidade','Essential only':'Somente essenciais','Accept all':'Aceitar tudo'
    }
  };

  const reverse = new Map();
  Object.keys(translations).forEach(lang => Object.entries(translations[lang]).forEach(([en, value]) => reverse.set(value, en)));

  function translateText(root, lang) {
    const dict = translations[lang] || {};
    function translateNode(node) {
      const raw = node.nodeValue;
      const text = raw.trim();
      if (!text || text.includes('{{')) return;
      const source = reverse.get(text) || text;
      const value = lang === 'en' ? source : dict[source];
      if (value && value !== text) node.nodeValue = raw.replace(text, value);
    }
    if (root.nodeType === Node.TEXT_NODE) {
      translateNode(root);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateNode);
  }

  function applyLanguage(lang, persist) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    document.documentElement.lang = lang;
    const select = document.getElementById('language-select');
    if (select) select.value = lang;
    translateText(document.body, lang);
    document.title = lang === 'en' ? 'BETina — Your AI Sports Companion' : ({de:'BETina — Deine KI-Sportbegleiterin',es:'BETina — Tu compañera deportiva con IA',fr:'BETina — Votre compagne sportive IA',pt:'BETina — Sua companheira esportiva com IA'}[lang]);
    if (persist) localStorage.setItem('betina_lang', lang);
    window.__betinaLanguage = lang;
  }

  function browserLanguage() {
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (const value of langs) {
      const lang = String(value).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(lang) && lang !== 'en') return lang;
    }
    return 'en';
  }

  function start() {
    const select = document.getElementById('language-select');
    if (select) select.addEventListener('change', event => applyLanguage(event.target.value, true));
    const query = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem('betina_lang');
    const initial = SUPPORTED.includes(query) ? query : (SUPPORTED.includes(saved) ? saved : browserLanguage());
    applyLanguage(initial, false);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') translateText(mutation.target, window.__betinaLanguage || 'en');
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) translateText(node, window.__betinaLanguage || 'en');
        });
      });
      const currentSelect = document.getElementById('language-select');
      if (currentSelect && currentSelect.value !== window.__betinaLanguage) currentSelect.value = window.__betinaLanguage;
    });
    observer.observe(document.body, {childList:true, characterData:true, subtree:true});

    if (!query && !saved && initial === 'en') {
      fetch('/api/locale', {credentials:'same-origin'}).then(response => response.ok ? response.json() : null).then(data => {
        const geoLang = data && countryLanguage[String(data.country || '').toUpperCase()];
        if (geoLang) applyLanguage(geoLang, false);
      }).catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 0));
  else setTimeout(start, 0);
})();
