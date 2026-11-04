// Landing page translations. English lives in the HTML; every element with
// data-i="key" gets swapped for the chosen language. Language pick order:
// ?lang= → saved choice → browser language → country from /api/locale → English.
(function () {
  'use strict';

  var SUPPORTED = ['en', 'de', 'es', 'fr', 'pt', 'it', 'ro', 'tr', 'hr'];
  var COUNTRY = {
    AT:'de', DE:'de', LI:'de',
    ES:'es', MX:'es', AR:'es', CL:'es', CO:'es', PE:'es', VE:'es', EC:'es', BO:'es', PY:'es', UY:'es', SV:'es', GT:'es', HN:'es', NI:'es', CR:'es', PA:'es', DO:'es', CU:'es', GQ:'es',
    PT:'pt', BR:'pt', AO:'pt', MZ:'pt', CV:'pt', GW:'pt', ST:'pt', TL:'pt',
    FR:'fr', BE:'fr', LU:'fr', MC:'fr', CH:'fr', SN:'fr', CI:'fr', CM:'fr', CD:'fr', CG:'fr', ML:'fr', BF:'fr', NE:'fr', TG:'fr', BJ:'fr', GA:'fr', GN:'fr', DJ:'fr', HT:'fr', MG:'fr', RW:'fr', BI:'fr',
    IT:'it', SM:'it', VA:'it',
    RO:'ro', MD:'ro',
    TR:'tr',
    HR:'hr', BA:'hr'
  };

  var T = {
    de: {
      title:'BETina — Deine KI-Sportbegleiterin',
      navFeatures:'Funktionen', navHow:'So geht’s', navSupport:'Support', navWeb:'Web-App →',
      heroSticker:'KI-Sportbegleiterin · 18+', heroA:'Dein Spiel.', heroB:'Dein Vibe.',
      heroLead:'Lerne BETina kennen — deine KI-Sportbegleiterin. Sie folgt deinen Teams, kennt jede Sportart, geht ran, wenn du anrufst, und redet jederzeit mit dir über Sport — in deiner Sprache.',
      storeApple:'Laden im', storeGoogle:'Jetzt bei', tryWeb:'oder im Browser testen →', heroFree:'Kostenlos · iPhone, Android & Web',
      heroOnline:'● Jetzt online', bubble1:'Dein Team spielt in 2 Stunden. Willst du die Aufstellungen? ⚽', bubble2Who:'⚡ Tor-Alarm', bubble2:'TOR! 1:0 in der 34. Minute.',
      mq1:'Chat', mq2:'Sprachanrufe', mq3:'Live-Ergebnisse', mq4:'Tor-Alarm', mq5:'Tippspiel', mq6:'BETina News', mq7:'9 Sprachen',
      featKicker:'Das steckt drin', featA:'Alles, was Fans brauchen.', featB:'Eine Begleiterin.',
      f1Title:'Chatte mit BETina', f1Text:'Frag sie alles rund um Sport. Sie kennt deine Teams, merkt sich, worüber ihr gesprochen habt, und wird mit jedem Chat besser.',
      f2Title:'Ruf sie an', newTag:'Neu', f2Text:'Echte Sprachanrufe mit BETina. Rede freihändig über das Spiel — wie mit einer Freundin, die kein Match verpasst.',
      f3Title:'BETina Live', f3Text:'Live-Ergebnisse deiner Teams und eine Push-Nachricht, sobald der Ball im Netz zappelt. Nie wieder einen Anpfiff verpassen.',
      f4Sticker:'Nur zum Spaß', f4Title:'Tippspiel', f4Text:'Tippe die Ergebnisse, tritt gegen deine Freunde an und klettere in der Rangliste nach oben. Kein Geld, kein Einsatz — nur Ruhm und Ehre.',
      f5Title:'BETina News', f5Text:'Ihre eigene Sportredaktion: die Geschichten, die für deine Teams zählen — für dich geschrieben, in deiner Sprache.',
      mChatU:"Wer spielt heute von Anfang an?", mChatB:"Saka ist zurück! Gleiche Elf wie am Samstag. Willst du die ganze Aufstellung? ⚽", mChatInput:"Frag BETina alles …", mCall:"Im Gespräch · 01:24", mNow:"jetzt", mGoal:"TOR! Arsenal führt 2:1 (78.)", mLock:"Tipp abgeben", mBoard:"Rangliste", mYou:"Du", mNewsAgo:"vor 5 Min.", mNews1:"Derby-Tag: alles, was du wissen musst", mNews2:"Verletzungs-Update vor dem Wochenende",
      s1Title:'Smarte Erinnerungen', s1Text:'Sag „Erinnere mich vor dem Spiel“ — den Rest erledigt sie.',
      s2Title:'XP & Level', s2Text:'Sammle XP für Chats, tägliche Serien und richtige Tipps — und steig auf.',
      s3Title:'Jede Sportart', s3Text:'Fußball, Tennis, Basketball, NFL, MMA, Cricket, Rugby, Eishockey, Golf, E-Sport und mehr.',
      s4Title:'9 Sprachen', s4Text:'BETina spricht deine Sprache — und wechselt, wann immer du willst.',
      howKicker:'Erste Schritte', howA:'Startklar', howB:'in 60 Sekunden.',
      st1Title:'BETina laden', st1Text:'Kostenlos im App Store und bei Google Play — oder direkt im Browser testen.',
      st2Title:'Anmelden, wie du willst', st2Text:'Wähle, was für dich am einfachsten ist — dauert nur Sekunden.', siEmail:'E-Mail', siPhone:'Telefon',
      st3Title:'Teams wählen', st3Text:'Wähle deine Lieblingsteams und Sportarten. BETina passt alles vom ersten Tag an dich an.',
      lgKicker:'Spricht deine Sprache', lgA:'Neun Sprachen.', lgB:'Eine BETina.',
      ctaA:'Dein Team verdient mehr', ctaB:'als eine Suchleiste.', ctaText:'Lade BETina und rede über Sport mit jemandem, der immer Lust darauf hat.',
      fPrivacy:'Datenschutz', fTerms:'AGB', fDelete:'Konto löschen', fContact:'Kontakt',
      fFine:'Nur ab 18. BETina ist eine KI-Begleiterin für Sportfans und Unterhaltung — in der App wird kein echtes Geld gesetzt oder bewegt.',
      ckText:'Wir würden gern Cookies für anonyme Nutzungsstatistiken verwenden.', ckNo:'Nur notwendige', ckYes:'Alle akzeptieren'
    },
    es: {
      title:'BETina — Tu compañera deportiva con IA',
      navFeatures:'Funciones', navHow:'Cómo funciona', navSupport:'Soporte', navWeb:'App web →',
      heroSticker:'Compañera deportiva IA · 18+', heroA:'Tu juego.', heroB:'Tu vibe.',
      heroLead:'Conoce a BETina, tu compañera deportiva con IA. Sigue a tus equipos, conoce todos los deportes, contesta cuando la llamas y habla de deporte contigo cuando quieras, en tu idioma.',
      storeApple:'Descárgalo en el', storeGoogle:'Disponible en', tryWeb:'o pruébala en la web →', heroFree:'Gratis · iPhone, Android y web',
      heroOnline:'● En línea', bubble1:'Tu equipo juega en 2 horas. ¿Quieres las alineaciones? ⚽', bubble2Who:'⚡ Alerta de gol', bubble2:'¡GOL! 1–0 en el minuto 34.',
      mq1:'Chat', mq2:'Llamadas de voz', mq3:'Resultados en vivo', mq4:'Alertas de gol', mq5:'Juego de pronósticos', mq6:'BETina News', mq7:'9 idiomas',
      featKicker:'Lo que incluye', featA:'Todo lo que un fan necesita.', featB:'Una compañera.',
      f1Title:'Chatea con BETina', f1Text:'Pregúntale lo que quieras sobre deporte. Conoce a tus equipos, recuerda de qué hablasteis y mejora con cada chat.',
      f2Title:'Llámala', newTag:'Nuevo', f2Text:'Llamadas de voz reales con BETina. Habla del partido sin manos, como llamar a una amiga que no se pierde ni un juego.',
      f3Title:'BETina Live', f3Text:'Resultados en vivo de tus equipos y un aviso en cuanto el balón entra. No te pierdas ni un saque inicial.',
      f4Sticker:'Solo por diversión', f4Title:'Juego de pronósticos', f4Text:'Pronostica los marcadores, reta a tus amigos y sube en la clasificación. Sin dinero, sin apuestas: solo por presumir.',
      f5Title:'BETina News', f5Text:'Su propia redacción deportiva: las historias que importan para tus equipos, escritas para ti en tu idioma.',
      mChatU:"¿Quién sale de inicio hoy?", mChatB:"¡Vuelve Saka! El mismo once que el sábado. ¿Quieres la alineación completa? ⚽", mChatInput:"Pregúntale lo que quieras a BETina…", mCall:"En llamada · 01:24", mNow:"ahora", mGoal:"¡GOL! El Arsenal gana 2–1 (78')", mLock:"Enviar pronóstico", mBoard:"Clasificación", mYou:"Tú", mNewsAgo:"hace 5 min", mNews1:"Día de derbi: todo lo que necesitas saber", mNews2:"Novedades de lesiones antes del fin de semana",
      s1Title:'Recordatorios inteligentes', s1Text:'Di «recuérdamelo antes del partido» y ella se encarga del resto.',
      s2Title:'XP y niveles', s2Text:'Gana XP por chatear, por rachas diarias y por pronósticos acertados, y sube de nivel.',
      s3Title:'Todos los deportes', s3Text:'Fútbol, tenis, baloncesto, NFL, MMA, críquet, rugby, hockey, golf, esports y más.',
      s4Title:'9 idiomas', s4Text:'BETina habla tu idioma y cambia cuando tú quieras.',
      howKicker:'Empieza ya', howA:'Lista para usar', howB:'en 60 segundos.',
      st1Title:'Descarga BETina', st1Text:'Gratis en App Store y Google Play, o pruébala directamente en tu navegador.',
      st2Title:'Entra como prefieras', st2Text:'Elige lo que te resulte más fácil: tarda unos segundos.', siEmail:'Email', siPhone:'Teléfono',
      st3Title:'Elige tus equipos', st3Text:'Elige tus equipos y deportes favoritos. BETina lo personaliza todo desde el primer día.',
      lgKicker:'Habla tu idioma', lgA:'Nueve idiomas.', lgB:'Una BETina.',
      ctaA:'Tu equipo merece más', ctaB:'que una barra de búsqueda.', ctaText:'Descarga BETina y habla de deporte con alguien que siempre tiene ganas.',
      fPrivacy:'Privacidad', fTerms:'Términos', fDelete:'Eliminar cuenta', fContact:'Contacto',
      fFine:'Solo mayores de 18. BETina es una compañera IA para fans del deporte y entretenimiento: en la app no se apuesta ni se mueve dinero real.',
      ckText:'Nos gustaría usar cookies para estadísticas de uso anónimas.', ckNo:'Solo esenciales', ckYes:'Aceptar todo'
    },
    fr: {
      title:'BETina — Ta compagne sportive IA',
      navFeatures:'Fonctionnalités', navHow:'Comment ça marche', navSupport:'Support', navWeb:'App web →',
      heroSticker:'Compagne sportive IA · 18+', heroA:'Ton match.', heroB:'Ton vibe.',
      heroLead:'Découvre BETina, ta compagne sportive IA. Elle suit tes équipes, connaît tous les sports, décroche quand tu l’appelles et parle sport avec toi à tout moment, dans ta langue.',
      storeApple:'Télécharger dans l’', storeGoogle:'Disponible sur', tryWeb:'ou essaie-la sur le web →', heroFree:'Gratuit · iPhone, Android et web',
      heroOnline:'● En ligne', bubble1:'Ton équipe joue dans 2 heures. Tu veux les compos ? ⚽', bubble2Who:'⚡ Alerte but', bubble2:'BUT ! 1–0 à la 34e minute.',
      mq1:'Chat', mq2:'Appels vocaux', mq3:'Scores en direct', mq4:'Alertes but', mq5:'Jeu de pronostics', mq6:'BETina News', mq7:'9 langues',
      featKicker:'Au programme', featA:'Tout ce qu’il faut à un fan.', featB:'Une seule compagne.',
      f1Title:'Discute avec BETina', f1Text:'Pose-lui toutes tes questions de sport. Elle connaît tes équipes, se souvient de vos échanges et s’améliore à chaque conversation.',
      f2Title:'Appelle-la', newTag:'Nouveau', f2Text:'De vrais appels vocaux avec BETina. Parle du match les mains libres, comme avec une amie qui ne rate aucun match.',
      f3Title:'BETina Live', f3Text:'Les scores en direct de tes équipes et une notification dès que le ballon fait trembler les filets. Ne rate plus aucun coup d’envoi.',
      f4Sticker:'Juste pour le fun', f4Title:'Jeu de pronostics', f4Text:'Pronostique les scores, défie tes amis et grimpe au classement. Pas d’argent, pas de mise : juste pour la gloire.',
      f5Title:'BETina News', f5Text:'Sa propre rédaction sportive : les infos qui comptent pour tes équipes, écrites pour toi dans ta langue.',
      mChatU:"Qui est titulaire ce soir ?", mChatB:"Saka est de retour ! Même onze que samedi. Tu veux la compo complète ? ⚽", mChatInput:"Demande ce que tu veux à BETina…", mCall:"En appel · 01:24", mNow:"maintenant", mGoal:"BUT ! Arsenal mène 2–1 (78e)", mLock:"Valider le prono", mBoard:"Classement", mYou:"Toi", mNewsAgo:"il y a 5 min", mNews1:"Jour de derby : tout ce qu’il faut savoir", mNews2:"Point blessures avant le week-end",
      s1Title:'Rappels malins', s1Text:'Dis « rappelle-moi avant le match » et elle s’occupe du reste.',
      s2Title:'XP et niveaux', s2Text:'Gagne de l’XP en discutant, avec tes séries quotidiennes et tes bons pronostics, et monte de niveau.',
      s3Title:'Tous les sports', s3Text:'Football, tennis, basket, NFL, MMA, cricket, rugby, hockey, golf, esport et plus encore.',
      s4Title:'9 langues', s4Text:'BETina parle ta langue et change quand tu veux.',
      howKicker:'C’est parti', howA:'Prête', howB:'en 60 secondes.',
      st1Title:'Télécharge BETina', st1Text:'Gratuite sur l’App Store et Google Play, ou à essayer directement dans ton navigateur.',
      st2Title:'Connecte-toi comme tu veux', st2Text:'Choisis ce qui est le plus simple pour toi : quelques secondes suffisent.', siEmail:'E-mail', siPhone:'Téléphone',
      st3Title:'Choisis tes équipes', st3Text:'Choisis tes équipes et sports préférés. BETina personnalise tout dès le premier jour.',
      lgKicker:'Parle ta langue', lgA:'Neuf langues.', lgB:'Une seule BETina.',
      ctaA:'Ton équipe mérite mieux', ctaB:'qu’une barre de recherche.', ctaText:'Télécharge BETina et parle sport avec quelqu’un qui est toujours partant.',
      fPrivacy:'Confidentialité', fTerms:'Conditions', fDelete:'Supprimer le compte', fContact:'Contact',
      fFine:'Réservé aux 18 ans et plus. BETina est une compagne IA pour les fans de sport et le divertissement : aucun argent réel n’est misé ni déplacé dans l’app.',
      ckText:'Nous aimerions utiliser des cookies pour des statistiques d’utilisation anonymes.', ckNo:'Essentiels uniquement', ckYes:'Tout accepter'
    },
    pt: {
      title:'BETina — A tua companheira desportiva com IA',
      navFeatures:'Funcionalidades', navHow:'Como funciona', navSupport:'Suporte', navWeb:'App web →',
      heroSticker:'Companheira desportiva IA · 18+', heroA:'O teu jogo.', heroB:'A tua vibe.',
      heroLead:'Conhece a BETina, a tua companheira desportiva com IA. Segue as tuas equipas, conhece todos os desportos, atende quando ligas e fala de desporto contigo a qualquer hora, na tua língua.',
      storeApple:'Descarregar na', storeGoogle:'Disponível no', tryWeb:'ou experimenta na web →', heroFree:'Grátis · iPhone, Android e web',
      heroOnline:'● Online', bubble1:'A tua equipa joga daqui a 2 horas. Queres os onzes? ⚽', bubble2Who:'⚡ Alerta de golo', bubble2:'GOLO! 1–0 aos 34 minutos.',
      mq1:'Chat', mq2:'Chamadas de voz', mq3:'Resultados ao vivo', mq4:'Alertas de golo', mq5:'Jogo de previsões', mq6:'BETina News', mq7:'9 línguas',
      featKicker:'O que tem', featA:'Tudo o que um fã precisa.', featB:'Uma companheira.',
      f1Title:'Conversa com a BETina', f1Text:'Pergunta-lhe tudo sobre desporto. Conhece as tuas equipas, lembra-se do que falaram e fica melhor a cada conversa.',
      f2Title:'Liga-lhe', newTag:'Novo', f2Text:'Chamadas de voz reais com a BETina. Fala do jogo sem usar as mãos, como ligar a uma amiga que não perde um jogo.',
      f3Title:'BETina Live', f3Text:'Resultados ao vivo das tuas equipas e uma notificação assim que a bola entra. Nunca mais percas um pontapé de saída.',
      f4Sticker:'Só por diversão', f4Title:'Jogo de previsões', f4Text:'Prevê os resultados, desafia os teus amigos e sobe na classificação. Sem dinheiro, sem apostas: só pela glória.',
      f5Title:'BETina News', f5Text:'A sua própria redação desportiva: as histórias que importam para as tuas equipas, escritas para ti na tua língua.',
      mChatU:"Quem é titular hoje?", mChatB:"O Saka está de volta! O mesmo onze de sábado. Queres o onze completo? ⚽", mChatInput:"Pergunta o que quiseres à BETina…", mCall:"Em chamada · 01:24", mNow:"agora", mGoal:"GOLO! O Arsenal vence por 2–1 (78')", mLock:"Confirmar previsão", mBoard:"Classificação", mYou:"Tu", mNewsAgo:"há 5 min", mNews1:"Dia de dérbi: tudo o que precisas de saber", mNews2:"Ponto de situação das lesões antes do fim de semana",
      s1Title:'Lembretes inteligentes', s1Text:'Diz “lembra-me antes do jogo” e ela trata do resto.',
      s2Title:'XP e níveis', s2Text:'Ganha XP com conversas, sequências diárias e previsões certas, e sobe de nível.',
      s3Title:'Todos os desportos', s3Text:'Futebol, ténis, basquetebol, NFL, MMA, críquete, râguebi, hóquei, golfe, esports e mais.',
      s4Title:'9 línguas', s4Text:'A BETina fala a tua língua e muda quando quiseres.',
      howKicker:'Começa já', howA:'Pronta a usar', howB:'em 60 segundos.',
      st1Title:'Descarrega a BETina', st1Text:'Grátis na App Store e no Google Play, ou experimenta diretamente no browser.',
      st2Title:'Entra como preferires', st2Text:'Escolhe o que for mais fácil para ti: demora poucos segundos.', siEmail:'Email', siPhone:'Telemóvel',
      st3Title:'Escolhe as tuas equipas', st3Text:'Escolhe as tuas equipas e desportos favoritos. A BETina personaliza tudo desde o primeiro dia.',
      lgKicker:'Fala a tua língua', lgA:'Nove línguas.', lgB:'Uma BETina.',
      ctaA:'A tua equipa merece mais', ctaB:'do que uma barra de pesquisa.', ctaText:'Descarrega a BETina e fala de desporto com alguém que está sempre disponível.',
      fPrivacy:'Privacidade', fTerms:'Termos', fDelete:'Eliminar conta', fContact:'Contacto',
      fFine:'Apenas maiores de 18. A BETina é uma companheira IA para fãs de desporto e entretenimento: na app não se aposta nem se movimenta dinheiro real.',
      ckText:'Gostaríamos de usar cookies para estatísticas de utilização anónimas.', ckNo:'Só essenciais', ckYes:'Aceitar tudo'
    },
    it: {
      title:'BETina — La tua compagna sportiva IA',
      navFeatures:'Funzioni', navHow:'Come funziona', navSupport:'Supporto', navWeb:'Web app →',
      heroSticker:'Compagna sportiva IA · 18+', heroA:'Il tuo gioco.', heroB:'Il tuo vibe.',
      heroLead:'Ecco BETina, la tua compagna sportiva con IA. Segue le tue squadre, conosce ogni sport, risponde quando la chiami e parla di sport con te in qualsiasi momento, nella tua lingua.',
      storeApple:'Scarica su', storeGoogle:'Disponibile su', tryWeb:'oppure provala sul web →', heroFree:'Gratis · iPhone, Android e web',
      heroOnline:'● Online', bubble1:'La tua squadra gioca tra 2 ore. Vuoi le formazioni? ⚽', bubble2Who:'⚡ Allerta gol', bubble2:'GOL! 1–0 al 34° minuto.',
      mq1:'Chat', mq2:'Chiamate vocali', mq3:'Risultati live', mq4:'Allerte gol', mq5:'Gioco dei pronostici', mq6:'BETina News', mq7:'9 lingue',
      featKicker:'Cosa c’è dentro', featA:'Tutto ciò che serve a un tifoso.', featB:'Una compagna.',
      f1Title:'Chatta con BETina', f1Text:'Chiedile tutto sullo sport. Conosce le tue squadre, ricorda di cosa avete parlato e migliora a ogni chat.',
      f2Title:'Chiamala', newTag:'Novità', f2Text:'Vere chiamate vocali con BETina. Parla della partita a mani libere, come chiamare un’amica che non perde una gara.',
      f3Title:'BETina Live', f3Text:'Risultati live delle tue squadre e una notifica appena la palla entra in rete. Non perderai più un calcio d’inizio.',
      f4Sticker:'Solo per divertimento', f4Title:'Gioco dei pronostici', f4Text:'Pronostica i risultati, sfida i tuoi amici e scala la classifica. Niente soldi, niente puntate: solo gloria.',
      f5Title:'BETina News', f5Text:'La sua redazione sportiva: le notizie che contano per le tue squadre, scritte per te nella tua lingua.',
      mChatU:"Chi gioca titolare stasera?", mChatB:"Torna Saka! Stesso undici di sabato. Vuoi la formazione completa? ⚽", mChatInput:"Chiedi qualsiasi cosa a BETina…", mCall:"In chiamata · 01:24", mNow:"ora", mGoal:"GOL! Arsenal avanti 2–1 (78')", mLock:"Conferma pronostico", mBoard:"Classifica", mYou:"Tu", mNewsAgo:"5 min fa", mNews1:"Giorno del derby: tutto quello che devi sapere", mNews2:"Aggiornamento infortuni prima del weekend",
      s1Title:'Promemoria smart', s1Text:'Dì «ricordamelo prima della partita» e pensa a tutto lei.',
      s2Title:'XP e livelli', s2Text:'Guadagna XP con le chat, le serie giornaliere e i pronostici azzeccati, e sali di livello.',
      s3Title:'Ogni sport', s3Text:'Calcio, tennis, basket, NFL, MMA, cricket, rugby, hockey, golf, esport e altro ancora.',
      s4Title:'9 lingue', s4Text:'BETina parla la tua lingua e cambia quando vuoi tu.',
      howKicker:'Inizia ora', howA:'Pronta', howB:'in 60 secondi.',
      st1Title:'Scarica BETina', st1Text:'Gratis su App Store e Google Play, oppure provala direttamente nel browser.',
      st2Title:'Accedi come preferisci', st2Text:'Scegli quello che per te è più comodo: bastano pochi secondi.', siEmail:'Email', siPhone:'Telefono',
      st3Title:'Scegli le tue squadre', st3Text:'Scegli le tue squadre e i tuoi sport preferiti. BETina personalizza tutto dal primo giorno.',
      lgKicker:'Parla la tua lingua', lgA:'Nove lingue.', lgB:'Una BETina.',
      ctaA:'La tua squadra merita di più', ctaB:'di una barra di ricerca.', ctaText:'Scarica BETina e parla di sport con qualcuno che ne ha sempre voglia.',
      fPrivacy:'Privacy', fTerms:'Termini', fDelete:'Elimina account', fContact:'Contatti',
      fFine:'Solo maggiorenni. BETina è una compagna IA per tifosi e intrattenimento: nell’app non si scommette né si muove denaro reale.',
      ckText:'Vorremmo usare i cookie per statistiche di utilizzo anonime.', ckNo:'Solo essenziali', ckYes:'Accetta tutti'
    },
    ro: {
      title:'BETina — Partenera ta sportivă AI',
      navFeatures:'Funcții', navHow:'Cum funcționează', navSupport:'Asistență', navWeb:'Aplicația web →',
      heroSticker:'Parteneră sportivă AI · 18+', heroA:'Jocul tău.', heroB:'Vibe-ul tău.',
      heroLead:'Fă cunoștință cu BETina, partenera ta sportivă AI. Îți urmărește echipele, știe orice sport, răspunde când o suni și vorbește cu tine despre sport oricând, în limba ta.',
      storeApple:'Descarcă din', storeGoogle:'Disponibil pe', tryWeb:'sau încearc-o pe web →', heroFree:'Gratuit · iPhone, Android și web',
      heroOnline:'● Online acum', bubble1:'Echipa ta joacă în 2 ore. Vrei formațiile? ⚽', bubble2Who:'⚡ Alertă de gol', bubble2:'GOL! 1–0 în minutul 34.',
      mq1:'Chat', mq2:'Apeluri vocale', mq3:'Scoruri live', mq4:'Alerte de gol', mq5:'Joc de pronosticuri', mq6:'BETina News', mq7:'9 limbi',
      featKicker:'Ce găsești', featA:'Tot ce îi trebuie unui fan.', featB:'O singură parteneră.',
      f1Title:'Vorbește cu BETina', f1Text:'Întreab-o orice despre sport. Îți cunoaște echipele, ține minte ce ați vorbit și devine mai bună cu fiecare chat.',
      f2Title:'Sun-o', newTag:'Nou', f2Text:'Apeluri vocale reale cu BETina. Vorbește despre meci fără mâini, ca și cum ai suna o prietenă care nu ratează niciun meci.',
      f3Title:'BETina Live', f3Text:'Scoruri live pentru echipele tale și o notificare imediat ce mingea intră în poartă. Nu mai ratezi niciun start de meci.',
      f4Sticker:'Doar pentru distracție', f4Title:'Joc de pronosticuri', f4Text:'Ghicește scorurile, provoacă-ți prietenii și urcă în clasament. Fără bani, fără mize: doar pentru glorie.',
      f5Title:'BETina News', f5Text:'Propria ei redacție sportivă: știrile care contează pentru echipele tale, scrise pentru tine în limba ta.',
      mChatU:"Cine e titular diseară?", mChatB:"Saka s-a întors! Același prim 11 ca sâmbătă. Vrei formația completă? ⚽", mChatInput:"Întreab-o orice pe BETina…", mCall:"În apel · 01:24", mNow:"acum", mGoal:"GOL! Arsenal conduce cu 2–1 (78')", mLock:"Trimite pronosticul", mBoard:"Clasament", mYou:"Tu", mNewsAgo:"acum 5 min", mNews1:"Zi de derby: tot ce trebuie să știi", mNews2:"Noutăți despre accidentări înainte de weekend",
      s1Title:'Mementouri inteligente', s1Text:'Spune „amintește-mi înainte de meci” și se ocupă ea de rest.',
      s2Title:'XP și niveluri', s2Text:'Câștigă XP pentru chat-uri, serii zilnice și pronosticuri corecte și avansează în nivel.',
      s3Title:'Orice sport', s3Text:'Fotbal, tenis, baschet, NFL, MMA, cricket, rugby, hochei, golf, esports și multe altele.',
      s4Title:'9 limbi', s4Text:'BETina vorbește limba ta și o schimbă oricând vrei tu.',
      howKicker:'Începe acum', howA:'Gata de start', howB:'în 60 de secunde.',
      st1Title:'Descarcă BETina', st1Text:'Gratuit în App Store și Google Play sau încearc-o direct în browser.',
      st2Title:'Conectează-te cum vrei', st2Text:'Alege varianta cea mai simplă pentru tine: durează câteva secunde.', siEmail:'Email', siPhone:'Telefon',
      st3Title:'Alege-ți echipele', st3Text:'Alege echipele și sporturile preferate. BETina personalizează totul din prima zi.',
      lgKicker:'Vorbește limba ta', lgA:'Nouă limbi.', lgB:'O singură BETina.',
      ctaA:'Echipa ta merită mai mult', ctaB:'decât o bară de căutare.', ctaText:'Descarcă BETina și vorbește despre sport cu cineva care are mereu chef.',
      fPrivacy:'Confidențialitate', fTerms:'Termeni', fDelete:'Șterge contul', fContact:'Contact',
      fFine:'Doar 18+. BETina este o parteneră AI pentru fanii sportului și divertisment: în aplicație nu se pariază și nu se transferă bani reali.',
      ckText:'Am dori să folosim cookie-uri pentru statistici de utilizare anonime.', ckNo:'Doar esențiale', ckYes:'Accept toate'
    },
    tr: {
      title:'BETina — Yapay zekâ spor arkadaşın',
      navFeatures:'Özellikler', navHow:'Nasıl çalışır', navSupport:'Destek', navWeb:'Web uygulaması →',
      heroSticker:'Yapay zekâ spor arkadaşı · 18+', heroA:'Senin oyunun.', heroB:'Senin havan.',
      heroLead:'BETina ile tanış: yapay zekâ spor arkadaşın. Takımlarını takip eder, her sporu bilir, aradığında açar ve istediğin zaman seninle kendi dilinde spor konuşur.',
      storeApple:'İndir:', storeGoogle:'Şimdi edinin:', tryWeb:'ya da web’de dene →', heroFree:'Ücretsiz · iPhone, Android ve web',
      heroOnline:'● Şu an çevrimiçi', bubble1:'Takımının maçı 2 saat sonra. Kadroları ister misin? ⚽', bubble2Who:'⚡ Gol bildirimi', bubble2:'GOL! 34. dakikada 1–0.',
      mq1:'Sohbet', mq2:'Sesli aramalar', mq3:'Canlı skorlar', mq4:'Gol bildirimleri', mq5:'Tahmin oyunu', mq6:'BETina News', mq7:'9 dil',
      featKicker:'İçinde neler var', featA:'Bir taraftarın ihtiyacı olan her şey.', featB:'Tek bir arkadaş.',
      f1Title:'BETina ile sohbet et', f1Text:'Spor hakkında ona her şeyi sor. Takımlarını tanır, ne konuştuğunuzu hatırlar ve her sohbette daha iyi olur.',
      f2Title:'Onu ara', newTag:'Yeni', f2Text:'BETina ile gerçek sesli aramalar. Maçı eller serbest konuş; hiçbir maçı kaçırmayan bir arkadaşı aramak gibi.',
      f3Title:'BETina Live', f3Text:'Takımların için canlı skorlar ve top ağlarla buluştuğu an bir bildirim. Bir daha hiçbir başlama düdüğünü kaçırma.',
      f4Sticker:'Sadece eğlence', f4Title:'Tahmin oyunu', f4Text:'Skorları tahmin et, arkadaşlarınla yarış ve sıralamada yüksel. Para yok, bahis yok; sadece övünme hakkı.',
      f5Title:'BETina News', f5Text:'Kendi spor haber masası: takımların için önemli haberler, senin için senin dilinde yazılıyor.',
      mChatU:"Bu akşam ilk 11’de kim var?", mChatB:"Saka geri döndü! Cumartesiyle aynı 11. Tam kadroyu ister misin? ⚽", mChatInput:"BETina’ya istediğini sor…", mCall:"Görüşmede · 01:24", mNow:"şimdi", mGoal:"GOL! Arsenal 2–1 önde (78')", mLock:"Tahmini kaydet", mBoard:"Sıralama", mYou:"Sen", mNewsAgo:"5 dk önce", mNews1:"Derbi günü: bilmen gereken her şey", mNews2:"Hafta sonu öncesi sakatlık durumu",
      s1Title:'Akıllı hatırlatıcılar', s1Text:'“Maçtan önce bana hatırlat” de, gerisini o halleder.',
      s2Title:'XP ve seviyeler', s2Text:'Sohbetler, günlük seriler ve doğru tahminlerle XP kazan ve seviye atla.',
      s3Title:'Her spor', s3Text:'Futbol, tenis, basketbol, NFL, MMA, kriket, ragbi, hokey, golf, e-spor ve daha fazlası.',
      s4Title:'9 dil', s4Text:'BETina senin dilini konuşur ve istediğin an dil değiştirir.',
      howKicker:'Hemen başla', howA:'60 saniyede', howB:'hazırsın.',
      st1Title:'BETina’yı indir', st1Text:'App Store ve Google Play’de ücretsiz; ya da doğrudan tarayıcında dene.',
      st2Title:'İstediğin gibi giriş yap', st2Text:'Senin için en kolayını seç; sadece birkaç saniye sürer.', siEmail:'E-posta', siPhone:'Telefon',
      st3Title:'Takımlarını seç', st3Text:'Favori takımlarını ve sporlarını seç. BETina her şeyi ilk günden sana göre ayarlar.',
      lgKicker:'Senin dilini konuşur', lgA:'Dokuz dil.', lgB:'Tek BETina.',
      ctaA:'Takımın bir arama çubuğundan', ctaB:'fazlasını hak ediyor.', ctaText:'BETina’yı indir ve sporu her zaman konuşmaya hazır biriyle konuş.',
      fPrivacy:'Gizlilik', fTerms:'Koşullar', fDelete:'Hesabı sil', fContact:'İletişim',
      fFine:'Yalnızca 18 yaş ve üzeri. BETina spor severler için bir yapay zekâ arkadaşı ve eğlence uygulamasıdır; uygulamada gerçek parayla bahis yapılmaz ve para transferi olmaz.',
      ckText:'Anonim kullanım istatistikleri için çerez kullanmak istiyoruz.', ckNo:'Yalnızca gerekli', ckYes:'Tümünü kabul et'
    },
    hr: {
      title:'BETina — Tvoja AI sportska družica',
      navFeatures:'Značajke', navHow:'Kako radi', navSupport:'Podrška', navWeb:'Web aplikacija →',
      heroSticker:'AI sportska družica · 18+', heroA:'Tvoja igra.', heroB:'Tvoj vibe.',
      heroLead:'Upoznaj BETinu, svoju AI sportsku družicu. Prati tvoje timove, zna svaki sport, javi se kad je nazoveš i priča s tobom o sportu kad god želiš, na tvom jeziku.',
      storeApple:'Preuzmi u', storeGoogle:'Nabavi na', tryWeb:'ili je isprobaj na webu →', heroFree:'Besplatno · iPhone, Android i web',
      heroOnline:'● Sada online', bubble1:'Tvoj tim igra za 2 sata. Želiš sastave? ⚽', bubble2Who:'⚡ Obavijest o golu', bubble2:'GOL! 1:0 u 34. minuti.',
      mq1:'Chat', mq2:'Glasovni pozivi', mq3:'Rezultati uživo', mq4:'Obavijesti o golovima', mq5:'Igra prognoza', mq6:'BETina News', mq7:'9 jezika',
      featKicker:'Što te čeka', featA:'Sve što navijaču treba.', featB:'Jedna družica.',
      f1Title:'Chataj s BETinom', f1Text:'Pitaj je sve o sportu. Poznaje tvoje timove, pamti o čemu ste razgovarali i sa svakim chatom postaje bolja.',
      f2Title:'Nazovi je', newTag:'Novo', f2Text:'Pravi glasovni pozivi s BETinom. Pričaj o utakmici bez ruku, kao da zoveš prijateljicu koja ne propušta nijednu utakmicu.',
      f3Title:'BETina Live', f3Text:'Rezultati uživo za tvoje timove i obavijest čim lopta završi u mreži. Više nikad ne propusti početak utakmice.',
      f4Sticker:'Samo iz zabave', f4Title:'Igra prognoza', f4Text:'Pogađaj rezultate, izazovi prijatelje i penji se na ljestvici. Bez novca, bez uloga: samo za slavu.',
      f5Title:'BETina News', f5Text:'Njezina vlastita sportska redakcija: priče koje su važne za tvoje timove, napisane za tebe na tvom jeziku.',
      mChatU:"Tko večeras počinje?", mChatB:"Saka se vratio! Ista postava kao u subotu. Želiš cijeli sastav? ⚽", mChatInput:"Pitaj BETinu bilo što…", mCall:"U pozivu · 01:24", mNow:"sada", mGoal:"GOL! Arsenal vodi 2:1 (78')", mLock:"Potvrdi prognozu", mBoard:"Ljestvica", mYou:"Ti", mNewsAgo:"prije 5 min", mNews1:"Dan derbija: sve što trebaš znati", mNews2:"Novosti o ozljedama uoči vikenda",
      s1Title:'Pametni podsjetnici', s1Text:'Reci „podsjeti me prije utakmice” i ona se pobrine za ostalo.',
      s2Title:'XP i razine', s2Text:'Skupljaj XP za chatove, dnevne nizove i točne prognoze i napreduj.',
      s3Title:'Svaki sport', s3Text:'Nogomet, tenis, košarka, NFL, MMA, kriket, ragbi, hokej, golf, esport i još mnogo toga.',
      s4Title:'9 jezika', s4Text:'BETina govori tvoj jezik i mijenja ga kad god ti želiš.',
      howKicker:'Kreni odmah', howA:'Spremno', howB:'za 60 sekundi.',
      st1Title:'Preuzmi BETinu', st1Text:'Besplatno u App Storeu i na Google Playu ili je isprobaj izravno u pregledniku.',
      st2Title:'Prijavi se kako želiš', st2Text:'Odaberi što ti je najjednostavnije: traje svega nekoliko sekundi.', siEmail:'E-mail', siPhone:'Mobitel',
      st3Title:'Odaberi svoje timove', st3Text:'Odaberi omiljene timove i sportove. BETina sve prilagođava tebi od prvog dana.',
      lgKicker:'Govori tvoj jezik', lgA:'Devet jezika.', lgB:'Jedna BETina.',
      ctaA:'Tvoj tim zaslužuje više', ctaB:'od tražilice.', ctaText:'Preuzmi BETinu i pričaj o sportu s nekim tko je uvijek raspoložen za to.',
      fPrivacy:'Privatnost', fTerms:'Uvjeti', fDelete:'Izbriši račun', fContact:'Kontakt',
      fFine:'Samo 18+. BETina je AI družica za ljubitelje sporta i zabavu: u aplikaciji se ne kladi niti se prenosi pravi novac.',
      ckText:'Željeli bismo koristiti kolačiće za anonimnu statistiku korištenja.', ckNo:'Samo nužni', ckYes:'Prihvati sve'
    }
  };

  var EN_TITLE = document.title;
  var originals = null;

  function remember() {
    originals = new Map();
    document.querySelectorAll('[data-i]').forEach(function (el) { originals.set(el, el.textContent); });
  }

  function apply(lang, persist) {
    if (SUPPORTED.indexOf(lang) < 0) lang = 'en';
    if (!originals) remember();
    var dict = T[lang] || {};
    document.querySelectorAll('[data-i]').forEach(function (el) {
      var key = el.getAttribute('data-i');
      el.textContent = (lang !== 'en' && dict[key]) || originals.get(el);
    });
    document.documentElement.lang = lang;
    document.title = (lang !== 'en' && dict.title) || EN_TITLE;
    var select = document.getElementById('language-select');
    if (select) select.value = lang;
    if (persist) { try { localStorage.setItem('betina_lang', lang); } catch (e) {} }
  }

  function browserLang() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(l) >= 0 && l !== 'en') return l;
    }
    return 'en';
  }

  function start() {
    var select = document.getElementById('language-select');
    if (select) select.addEventListener('change', function (e) { apply(e.target.value, true); });
    var query = new URLSearchParams(location.search).get('lang');
    var saved = null;
    try { saved = localStorage.getItem('betina_lang'); } catch (e) {}
    var initial = SUPPORTED.indexOf(query) >= 0 ? query : (SUPPORTED.indexOf(saved) >= 0 ? saved : browserLang());
    apply(initial, false);
    if (!query && !saved && initial === 'en') {
      fetch('/api/locale', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { var g = d && COUNTRY[String(d.country || '').toUpperCase()]; if (g) apply(g, false); })
        .catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
