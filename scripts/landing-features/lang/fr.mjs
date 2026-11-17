// French (fr) localization of the three feature pages. Informal "tu", as on the French landing page.
export default {
  local: { home: 'Accueil', more: 'BETina, c’est aussi', faq: 'Questions et réponses', now: 'maintenant' },
  home: {
    moreChat: 'En savoir plus sur le chat sport IA →',
    moreLive: 'En savoir plus sur les scores en direct →',
    moreGame: 'En savoir plus sur le jeu de pronostics →',
  },

  game: {
    path: '/fr/jeu-de-pronostics-foot',
    nav: 'Jeu de pronostics',
    teaser: 'Pronostique les scores de foot, marque des points et bats tes amis. Sans argent.',
    more: 'En savoir plus sur le jeu de pronostics',
    crumb: 'Jeu de pronostics',
    title: 'Jeu de pronostics foot gratuit entre amis – BETina',
    desc: 'Jeu de pronostics foot gratuit : trouve les scores, marque des points et bats tes amis au classement. Sans argent, avec une IA qui joue avec toi.',
    sticker: 'Juste pour le fun · Sans argent',
    h1: 'Jeu de pronostics foot gratuit :',
    h1b: 'trouve les scores, bats tes amis.',
    lead: 'Annonce le résultat avant le coup d’envoi, marque des points quand tu as vu juste et double tes amis au classement. Le jeu de pronostics BETina est gratuit, sans mise et sans le moindre versement, et il arrive avec une compagne IA qui pronostique elle-même chaque match.',
    badge: '3 · 2 · 1',
    shotAlt: 'Appli BETina : jeu de pronostics foot avec classement',
    facts: [
      ['3·2·1', 'Points pour le score exact, la différence de buts, le bon vainqueur'],
      ['5', 'Compétitions, de la Bundesliga à la Ligue des champions'],
      ['0 €', 'Pas de mise, pas de lots, aucun versement'],
      ['9', 'Langues dans lesquelles tu peux jouer'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En bref', h2: 'C’est quoi, le jeu de pronostics', h2b: 'de BETina ?',
        paras: [
          '<strong>Le jeu de pronostics BETina est un jeu de pronostics foot gratuit, intégré à l’appli BETina.</strong> Avant le coup d’envoi, tu saisis le score que tu attends. Au coup de sifflet final, l’appli compare ton pronostic au score réel et attribue les points. Ces points décident de ta place au classement, au général comme dans les ligues privées que tu crées avec tes amis.',
          'C’est le jeu qu’on pratique depuis des décennies au bureau et dans les groupes de discussion, sans le tableau à remplir à la main et sans argent. La nouveauté, c’est avec qui tu joues : BETina, la compagne sportive IA de l’appli, pronostique chaque match elle aussi, anime la partie et se fait un plaisir de discuter ton 3–1.',
        ],
      },
      {
        type: 'steps', kicker: 'Comment ça marche', h2: 'Le jeu de pronostics foot', h2b: 'en trois étapes.',
        items: [
          { t: 'Pronostique le score', p: 'Ouvre la liste des matchs, choisis une affiche et saisis le résultat que tu attends, par exemple 2–1. Tu peux modifier ton pronostic autant de fois que tu veux jusqu’au coup d’envoi.' },
          { t: 'Suis le match', p: 'Au coup d’envoi, les pronostics sont verrouillés et dévoilés : impossible de copier. Si tu suis le match dans BETina Live, ton pronostic s’affiche à côté du score en direct.' },
          { t: 'Empoche tes points', p: 'Au coup de sifflet final, tes points sont ajoutés automatiquement et le classement se met à jour. Une notification te dit comment s’est passée ta journée.' },
        ],
      },
      {
        type: 'cards', kicker: 'Barème', h2: 'Comment les points', h2b: 'sont attribués.',
        intro: 'Un pronostic, trois façons de marquer. C’est le résultat après 90 minutes plus le temps additionnel qui compte.',
        items: [
          { big: '3', unit: 'points', t: 'Score exact', p: 'Tu as trouvé le résultat au but près. La plus belle sensation du jeu.', eg: 'Prono 2–1 · Résultat 2–1' },
          { big: '2', unit: 'points', t: 'Bonne différence de buts', p: 'Tu avais le vainqueur et l’écart, mais pas le score exact. Un match nul sur un autre score compte ici aussi.', eg: 'Prono 2–1 · Résultat 3–2' },
          { big: '1', unit: 'point', t: 'Bon vainqueur', p: 'Tu avais vu qui gagnait, mais pas avec le bon écart.', eg: 'Prono 2–1 · Résultat 3–0' },
        ],
        after: [
          'Un pronostic raté ne rapporte rien et ne coûte rien. En plus des pronostics sur les matchs, il y a des <strong>questions bonus</strong> pour gratter des points supplémentaires. Chaque point marqué te rapporte aussi de l’XP pour ton niveau dans l’appli.',
        ],
      },
      {
        type: 'shot', kicker: 'Entre amis', h2: 'Un jeu de pronostics entre amis :', h2b: 'grimpe au classement.', img: 'screen-predictor',
        alt: 'Appli BETina : ligue de pronostics entre amis et classement',
        paras: [
          'Un jeu de pronostics foot, c’est avec des gens qu’on connaît que c’est le meilleur. Dans BETina, tu crées une <strong>ligue privée</strong>, tu invites tes amis, ta famille ou tes collègues et vous avez votre propre classement, distinct du classement général. Celui qui est en tête le lundi matin a le droit de chambrer.',
          'Le classement montre qui a gagné et qui a perdu des places lors de la dernière journée, et tes statistiques personnelles indiquent à quelle fréquence tu trouves le score exact. Il y a aussi un défi collectif : après chaque journée, la moyenne de votre groupe est comparée au score de BETina. Battez-la ensemble.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'La différence', h2: 'Une compagne IA qui joue avec toi', h2b: 'et qui parle foot.',
        label: 'Exemple de conversation autour d’un pronostic',
        paras: [
          'Tous les autres jeux de pronostics se résument à un formulaire et un tableau. Dans BETina, le jeu a une animatrice. <strong>BETina pronostique elle-même chaque match.</strong> Ses pronostics restent cachés jusqu’au coup d’envoi, exactement comme ceux des autres, et elle figure dans tous les classements : tu as donc toujours quelqu’un à battre.',
          'Et tu peux en parler avec elle. Explique-lui pourquoi tu sens une victoire à l’extérieur, demande-lui ce qu’elle pense de la forme d’une équipe ou laisse-la te chambrer sur ton dernier week-end. Elle répond dans ta langue, par écrit ou lors d’un appel vocal. Son avis reste une opinion, pas un conseil, et elle se trompe assez souvent pour que ça reste intéressant.',
        ],
        msgs: [
          ['me', 'Je mets 3–1 pour samedi. Trop osé ?'],
          ['b', 'Osé, oui. Ils n’ont plus marqué trois buts à domicile depuis l’automne. Mais j’aime bien ton assurance.'],
          ['me', 'Et toi, tu as mis quoi ?'],
          ['b', 'Bien tenté. Tu verras mon prono au coup d’envoi, comme tout le monde. 😌'],
        ],
        note: 'Exemple donné à titre d’illustration. BETina est une IA et peut se tromper.',
      },
      {
        type: 'prose', kicker: 'Le principe', h2: 'Pas d’argent, pas de mise :', h2b: 'des points et la gloire.',
        paras: [
          'Le jeu de pronostics BETina se joue pour le plaisir. <strong>Tu ne mises rien, tu n’achètes rien et rien n’est versé.</strong> Il n’y a ni lots en argent ni frais d’inscription, et l’appli ne te demandera jamais ta carte bancaire. Ce que tu gagnes, ce sont des points, de l’XP, une place au classement et le droit de le rappeler à tes amis.',
          'C’est voulu. BETina est une application de divertissement pour adultes, et ce jeu de pronostics sans argent est là pour rendre une journée de championnat plus amusante, que ton équipe joue ou non.',
        ],
      },
      {
        type: 'table', kicker: 'Compétitions', h2: 'Les compétitions', h2b: 'à pronostiquer.',
        intro: 'Le jeu de pronostics couvre cinq des plus grandes compétitions du football de clubs européen, journée après journée.',
        cols: ['Compétition', 'Pays', 'Ce que tu pronostiques'], hl: 0,
        rows: [
          ['Bundesliga', 'Allemagne', 'Tous les matchs de chaque journée'],
          ['Premier League', 'Angleterre', 'Tous les matchs de chaque journée'],
          ['LaLiga', 'Espagne', 'Tous les matchs de chaque journée'],
          ['Serie A', 'Italie', 'Tous les matchs de chaque journée'],
          ['Ligue des champions', 'Europe', 'Phase de ligue et phase à élimination directe'],
        ],
        after: ['C’est toi qui choisis les compétitions auxquelles tu participes. Tes points dans chacune comptent pour le classement général.'],
      },
    ],
    faqH2: 'Jeu de pronostics :', faqH2b: 'questions fréquentes.',
    faq: [
      ['Le jeu de pronostics BETina est-il gratuit ?', 'Oui. Le jeu fait partie de l’appli BETina, gratuite sur iPhone, sur Android et sur le web. Il n’y a ni frais d’inscription ni abonnement.'],
      ['Y a-t-il de l’argent réel en jeu, et peut-on gagner des lots ?', 'Non. Tu ne mises rien et rien n’est versé. Il n’y a aucun lot, ni en argent ni en nature. Tu joues pour des points, de l’XP et ta place au classement.'],
      ['Comment les points sont-ils calculés ?', 'Trois points pour le score exact, deux pour le bon vainqueur avec la bonne différence de buts, un pour le bon vainqueur. C’est le résultat après 90 minutes plus le temps additionnel qui compte.'],
      ['Quels championnats et compétitions puis-je pronostiquer ?', 'La Bundesliga, la Premier League, LaLiga, la Serie A et la Ligue des champions.'],
      ['Puis-je jouer au jeu de pronostics avec mes amis ?', 'Oui. Crée une ligue privée dans l’appli et invite tes amis. Vous avez votre propre classement, en plus du classement général.'],
      ['Jusqu’à quand puis-je saisir ou modifier un pronostic ?', 'Tu peux saisir et modifier un pronostic jusqu’au coup d’envoi du match. À ce moment-là, il est verrouillé, et c’est seulement alors que les autres peuvent le voir.'],
      ['En quoi BETina est-elle différente des autres applis de pronostics foot ?', 'Tu joues avec une compagne IA. BETina pronostique elle-même chaque match, figure dans tous les classements et discute de tes pronostics avec toi, en neuf langues.'],
      ['Le jeu de pronostics est-il disponible sur iPhone, sur Android et sur le web ?', 'Oui. Tu peux jouer dans l’appli iPhone, dans l’appli Android et dans l’appli web depuis ton navigateur, avec le même compte.'],
    ],
    alsoH2: 'Il y a encore plus', alsoH2b: 'dans l’appli.',
    homeTeaser: 'Tout ce que BETina sait faire, sur une seule page.',
    ctaH2: 'Tu crois t’y connaître', ctaH2b: 'en foot ? Prouve-le.',
    ctaText: 'Télécharge BETina, pronostique ta première journée et regarde où tu atterris au classement.',
  },

  live: {
    path: '/fr/scores-foot-en-direct',
    nav: 'Scores en direct',
    teaser: 'Les scores foot en direct de tes équipes et une notification dès qu’un but est marqué.',
    more: 'En savoir plus sur BETina Live',
    crumb: 'Scores en direct',
    title: 'Scores foot en direct et notifications de but | BETina',
    desc: 'Les scores foot en direct de tes équipes et une notification à chaque but. Pose tes questions sur le match à l’IA. Gratuit sur iPhone, Android et web.',
    sticker: 'BETina Live · Football',
    h1: 'Scores foot en direct',
    h1b: 'et notifications de but pour tes équipes.',
    lead: 'BETina Live affiche les scores de foot qui comptent pour toi et envoie une notification sur ton téléphone à l’instant où ton équipe marque. Et quand tu veux savoir ce qui se passe dans le match, tu le demandes tout simplement à BETina.',
    badge: '● En direct',
    push: 'BUT ! 1–0 à la 34e minute.',
    shotAlt: 'Appli BETina : scores foot en direct et notifications de but pour les équipes suivies',
    facts: [
      ['0 €', 'Gratuit dans l’appli, sans abonnement'],
      ['5', 'Moments du match signalés par une notification'],
      ['9', 'Langues dans lesquelles BETina parle foot'],
      ['18+', 'Pour adultes, sans argent'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En bref', h2: 'C’est quoi,', h2b: 'BETina Live ?',
        paras: [
          '<strong>BETina Live, c’est la partie scores foot en direct de l’appli BETina.</strong> Elle liste les matchs en cours, tient le score à jour tant que le ballon roule et place tout en haut les équipes que tu suis. Pas besoin de garder l’appli ouverte : dès qu’il se passe quelque chose dans un match qui t’intéresse, une notification te prévient.',
          'La plupart des applis de scores en direct s’arrêtent là. BETina Live fait partie d’une compagne sportive IA : le score n’est donc que le début de la conversation. Tu peux demander à BETina qui a marqué, où en est le classement ou ce qu’elle a pensé de la première mi-temps, dans le chat ou lors d’un appel vocal. Les scores en direct sont disponibles pour le football ; pour parler des autres sports, direction le <a href="/fr/chat-sport-ia">chat sport IA</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Notifications de but', h2: 'Une notification à l’instant', h2b: 'où ton équipe marque.',
        label: 'Exemples de notifications de BETina Live',
        paras: [
          'La notification de but, c’est la raison pour laquelle la plupart des gens installent une appli de scores de foot, et c’est le cœur de BETina Live. Suis une équipe et tu reçois une notification push dès qu’un but est marqué dans son match, avec le nouveau score et la minute.',
          'Les notifications n’arrivent que pour <strong>les équipes et les matchs que tu as choisis</strong>. Personne n’a besoin de cinquante notifications venues de championnats qu’il ne regarde pas. En plus des buts, BETina Live signale les autres moments qui changent un match : le coup d’envoi, les cartons rouges, la mi-temps et le coup de sifflet final.',
          'Les notifications de but arrivent sur iPhone et sur Android. Tu peux les désactiver à tout moment dans les réglages.',
        ],
        items: [
          ['19:30', 'Coup d’envoi ! Ton équipe est sur la pelouse.'],
          ['34′', 'BUT ! 1–0 à la 34e minute.'],
          ['45′', 'Mi-temps : 1–0. Première période solide.'],
          ['67′', 'Carton rouge pour les visiteurs.'],
          ['90′', 'Terminé : 2–0. Trois points !'],
        ],
      },
      {
        type: 'steps', kicker: 'Mise en place', h2: 'Comment activer les notifications de but', h2b: 'pour ton équipe.',
        intro: 'Ça prend une minute environ, et tu ne le fais qu’une fois.',
        items: [
          { t: 'Télécharge BETina', p: 'Télécharge gratuitement l’appli sur l’App Store ou Google Play et connecte-toi avec Apple, Google, ton e-mail ou ton numéro de téléphone.' },
          { t: 'Choisis tes équipes', p: 'Choisis ton équipe préférée au démarrage. Tu peux suivre d’autres équipes, ou un seul match, dans l’onglet Live.' },
          { t: 'Autorise les notifications', p: 'Réponds oui quand ton téléphone te demande si BETina peut t’envoyer des notifications. Sans cette autorisation, aucune notification de but ne peut t’arriver.' },
          { t: 'Regarde le match, ou pas', p: 'Range ton téléphone. La prochaine fois que ton équipe marque, tu le sauras dans la minute, où que tu sois.' },
        ],
      },
      {
        type: 'chat', kicker: 'La différence', h2: 'Pose tes questions sur le match :', h2b: 'les scores foot en direct avec une IA.',
        label: 'Exemple de conversation sur un match en cours',
        paras: [
          'Un score te dit ce qui s’est passé. Il ne te dit pas pourquoi, et ça ne lui fait ni chaud ni froid. BETina, elle, fait les deux. Elle a les données en direct du match sous les yeux : tu peux donc lui demander ce que tu demanderais à une amie qui regarde le match, à savoir qui a marqué, si l’avantage est mérité ou ce que le résultat change au classement.',
          'Chaque page de match affiche aussi <strong>l’avis de BETina</strong>, une courte lecture de la rencontre avec ses mots à elle, à côté du classement et de l’historique des confrontations entre les deux équipes. Et comme BETina parle neuf langues, un supporter à Zagreb suit en croate le même match qu’un supporter à Lyon suit en français.',
        ],
        msgs: [
          ['me', 'Ça donne quoi, notre match ?'],
          ['b', '1–0 pour vous depuis la 34e minute. Une tête sur corner, et franchement, ça se sentait venir.'],
          ['me', 'Et ça nous met où au classement ?'],
          ['b', 'Si ça en reste là, vous montez à la quatrième place. Encore deux journées comme ça et je commence à y croire.'],
        ],
        note: 'Exemple donné à titre d’illustration. BETina est une IA et peut se tromper.',
      },
      {
        type: 'cards', kicker: 'Sur chaque page de match', h2: 'Bien plus', h2b: 'qu’un chiffre.',
        items: [
          { t: 'Score en direct et fil du match', p: 'Le score actuel, la minute de jeu et les temps forts du match, dans l’ordre où ils se sont produits.' },
          { t: 'Classement et confrontations', p: 'Le classement du championnat en un coup d’œil et le bilan des deux équipes lors de leurs précédentes confrontations.' },
          { t: 'Ton pronostic juste à côté', p: 'Si tu joues au <a href="/fr/jeu-de-pronostics-foot" style="color:var(--lime);text-decoration:underline">jeu de pronostics</a> gratuit, le résultat que tu as pronostiqué s’affiche à côté du score en direct.' },
        ],
      },
      {
        type: 'prose', kicker: 'Bon à savoir', h2: 'Gratuit sur iPhone, sur Android', h2b: 'et sur le web.',
        paras: [
          'BETina Live fait partie de l’appli gratuite BETina. Il n’y a pas de formule payante pour les scores, ni d’abonnement pour les notifications de but. Tu trouves l’appli sur l’App Store et sur Google Play, et tu peux ouvrir l’appli web dans ton navigateur pour consulter les scores sur un ordinateur portable.',
          'BETina est une application de divertissement pour adultes. <strong>Il n’y a d’argent nulle part dans l’appli</strong> : rien à miser, rien à encaisser. Elle est signée GeniusBet et exploitée par Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live :', faqH2b: 'questions fréquentes.',
    faq: [
      ['BETina Live est-il gratuit ?', 'Oui. Les scores en direct et les notifications de but font partie de l’appli BETina, gratuite sur iPhone, sur Android et sur le web. Il n’y a pas d’abonnement.'],
      ['Comment recevoir une notification quand mon équipe marque ?', 'Installe BETina, choisis ton équipe et autorise les notifications. À partir de là, tu reçois une notification dès qu’un but est marqué dans un match d’une équipe que tu suis.'],
      ['Puis-je recevoir les notifications de but pour une seule équipe ?', 'Oui. Les notifications ne sont envoyées que pour les équipes et les matchs que tu suis : une seule équipe suffit. Tu peux en ajouter ou en retirer à tout moment.'],
      ['Pour quels sports y a-t-il des scores en direct ?', 'Les scores en direct et les notifications de but sont disponibles pour le football. Tu peux parler avec BETina de bien d’autres sports, comme le tennis, la NFL, le MMA ou le cricket.'],
      ['En dehors des buts, pour quoi est-ce que je reçois une notification ?', 'Pour le coup d’envoi, les cartons rouges, la mi-temps et le score final des matchs que tu suis.'],
      ['Que puis-je demander à l’IA sur un match ?', 'Tout ce que tu demanderais à une amie qui regarde le match : le score, qui a marqué, où en est le classement ou ce qu’elle pense de la rencontre. BETina est une IA et peut se tromper : prends son avis comme une opinion.'],
      ['Y a-t-il de l’argent réel en jeu ?', 'Non. BETina est une application de divertissement. Aucun argent n’est misé ni versé, nulle part dans l’appli.'],
    ],
    alsoH2: 'Il y a encore plus', alsoH2b: 'dans l’appli.',
    homeTeaser: 'Tout ce que BETina sait faire, sur une seule page.',
    ctaH2: 'Ne rate plus', ctaH2b: 'jamais un but.',
    ctaText: 'Télécharge BETina, suis ton équipe et laisse les buts venir à toi.',
  },

  chat: {
    path: '/fr/chat-sport-ia',
    nav: 'Chat sport IA',
    teaser: 'Écris à une compagne IA ou appelle-la : elle connaît tes équipes et se souvient de vos échanges.',
    more: 'En savoir plus sur le chat sport IA',
    crumb: 'Chat sport IA',
    title: 'Chat sport IA : parler de foot avec une IA | BETina',
    desc: 'Chat sport IA avec BETina : écris-lui ou appelle-la. Elle connaît tes équipes, se souvient de vos échanges et parle 9 langues. Gratuit, sans argent.',
    sticker: 'Chat · Appels vocaux · 9 langues',
    h1: 'Chat sport IA :',
    h1b: 'parle de foot et de sport avec BETina.',
    lead: 'BETina est une compagne IA avec qui tu parles de sport comme avec une amie qui ne rate aucun match. Écris-lui ou appelle-la. Elle connaît tes équipes, se souvient de ce que tu as dit la semaine dernière et répond dans ta langue.',
    badge: '● En ligne',
    shotAlt: 'Appli BETina : chat sport IA avec BETina',
    facts: [
      ['24/7', 'Elle est là dès que tu veux parler sport'],
      ['9', 'Langues, elle change quand tu changes'],
      ['11+', 'Sports, du football au cricket'],
      ['0 €', 'Discuter est gratuit, sans argent'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En bref', h2: 'C’est quoi, le chat sport IA', h2b: 'de BETina ?',
        paras: [
          '<strong>Le chat sport IA de BETina, c’est une conversation avec une compagne IA qui ne vit que pour le sport.</strong> C’est le cœur de l’appli BETina. Tu poses une question ou tu lâches simplement ce que tu as sur le cœur après un match, et BETina répond comme quelqu’un qui a un avis : court, direct, sur le ton de celle qui a vraiment regardé.',
          'La plupart des chatbots sportifs sont des outils de questions-réponses rattachés à un seul championnat ou à un seul diffuseur. BETina, c’est une seule personnalité pour tous les sports. Elle sait quelles équipes tu supportes, elle revient sur ce que tu lui as déjà raconté, et tu peux l’appeler quand écrire prend trop de temps. Tu peux parler de foot avec une IA, puis de tennis ou de NFL, dans la même conversation.',
        ],
      },
      {
        type: 'cards', kicker: 'Sujets', h2: 'Parler de foot avec une IA,', h2b: 'et de tous les autres sports.',
        items: [
          { t: 'Tes équipes et ta journée de championnat', p: 'Les compos, la forme du moment, ce changement que personne n’a compris. BETina connaît tes équipes préférées et a les scores foot en direct sous la main : vous parlez donc de la même chose.' },
          { t: 'Règles, histoire et débats', p: 'Pourquoi y avait-il hors-jeu ? Qui était le meilleur numéro 10 ? Demande une explication rapide ou lance le débat sur la plus grande équipe de tous les temps.' },
          { t: 'Tous les sports, pas un seul championnat', p: 'Football, tennis, NFL, MMA, cricket et plus encore. Découvre un sport en partant de zéro ou creuse celui que tu suis depuis vingt ans.' },
        ],
      },
      {
        type: 'chat', kicker: 'Exemples', h2: 'Trois conversations', h2b: 'avec BETina.',
        label: 'Exemple de conversation : une règle expliquée',
        paras: [
          '<strong>La règle expliquée.</strong> Tu as vu un but refusé et tu veux savoir pourquoi, sans lire tout le règlement. BETina te l’explique en trois phrases et te propose d’aller plus loin.',
          '<strong>Le lendemain de match.</strong> Tu n’as toujours pas digéré samedi. BETina se souvient que le milieu de terrain t’inquiétait la semaine dernière et reprend la conversation exactement là.',
          '<strong>Le nouveau sport.</strong> Un ami te traîne devant une finale de tennis ou une soirée NFL. Demande à BETina de t’expliquer simplement comment on compte les points, et tu suivras la rencontre dès les premiers échanges.',
        ],
        msgs: [
          ['me', 'Pourquoi le but a été refusé ? Pour moi, il était sur la même ligne.'],
          ['b', 'Sur la même ligne, ça passe, mais son épaule dépassait le dernier défenseur au départ du ballon. Les épaules comptent, pas les bras.'],
          ['me', 'À ce point-là ?'],
          ['b', 'Quelques centimètres. Ça fait mal, je sais. Tu veux la version en 20 secondes de la façon dont la ligne est tracée ?'],
        ],
        note: 'Exemple donné à titre d’illustration. BETina est une IA et peut se tromper.',
      },
      {
        type: 'shot', flip: true, kicker: 'Appels vocaux', h2: 'Appelle BETina :', h2b: 'parle sport de vive voix avec une IA.', img: 'screen-call',
        alt: 'Appli BETina : appel vocal avec BETina',
        paras: [
          'Parfois, on n’a pas envie d’écrire. Dans l’appli, tu peux <strong>appeler BETina et parler sport de vive voix</strong>, les mains libres, sur le chemin du stade ou avec le match en fond. Elle écoute, répond à voix haute et suit quand tu lui coupes la parole, comme dans un vrai coup de fil.',
          'En appel, elle sait les mêmes choses que dans le chat : tes équipes, vos conversations précédentes et les scores de foot en direct. Les appels vocaux sont inclus gratuitement, avec un quota d’appels quotidien.',
        ],
      },
      {
        type: 'prose', kicker: 'Mémoire', h2: 'Elle se souvient de tes équipes', h2b: 'et de votre dernière discussion.',
        paras: [
          'Une conversation est meilleure quand on ne repart pas de zéro. BETina garde en tête les équipes et les sports que tu suis et ce que tu lui as raconté : la semaine suivante, elle peut donc te demander comment tu as vécu le derby ou si ton genou a survécu au foot à cinq.',
          'Cette mémoire, c’est toi qui la contrôles. Tu peux demander la suppression de ton historique de discussion ou de ce que BETina a retenu à ton sujet, et la suppression de ton compte efface tout, définitivement. Les détails se trouvent sur la <a href="/delete-account">page consacrée au compte et aux données</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Langues', h2: 'Une seule compagne,', h2b: 'neuf langues.',
        intro: 'BETina répond dans la langue dans laquelle tu écris ou tu parles, et elle change quand tu changes. Ça en fait un chat sport IA pour celles et ceux qui suivent un championnat dans une langue et vivent dans une autre.',
        items: [
          '<strong>Français</strong>', '<strong>Anglais</strong> (English)', '<strong>Allemand</strong> (Deutsch)', '<strong>Espagnol</strong> (Español)', '<strong>Portugais</strong> (Português)',
          '<strong>Italien</strong> (Italiano)', '<strong>Roumain</strong> (Română)', '<strong>Turc</strong> (Türkçe)', '<strong>Croate</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'En toute franchise', h2: 'Ce que BETina', h2b: 'n’est pas.',
        paras: [
          '<strong>BETina est une IA, pas une vraie personne.</strong> Elle a une personnalité et des opinions, mais elles sont générées par un logiciel et, comme toute IA, elle peut se tromper sur les faits. Prends ce qu’elle dit sur le sport comme un point de vue à discuter, pas comme une source vérifiée.',
          'Ce n’est pas non plus une conseillère. BETina est une application de divertissement pour adultes (18+), et il n’y a d’argent nulle part dans l’appli. Son avis sur un match, c’est de la conversation, rien de plus.',
        ],
      },
      {
        type: 'steps', kicker: 'Pour commencer', h2: 'Comment lancer', h2b: 'la discussion.',
        items: [
          { t: 'Télécharge BETina', p: 'Télécharge l’appli gratuite sur l’App Store ou Google Play, ou ouvre l’appli web dans ton navigateur.' },
          { t: 'Connecte-toi et choisis tes équipes', p: 'Connecte-toi avec Apple, Google, ton e-mail ou ton téléphone et choisis les équipes et les sports qui comptent pour toi.' },
          { t: 'Dis bonjour', p: 'Écris ton premier message ou touche le micro pour l’appeler. Si tu ne sais pas par où commencer, parle-lui du match de ce soir.' },
        ],
      },
    ],
    faqH2: 'Questions sur', faqH2b: 'le chat sport IA.',
    faq: [
      ['Peut-on vraiment parler de foot et de sport avec une IA ?', 'Oui. BETina est une compagne IA conçue pour le sport. Tu peux lui écrire ou l’appeler et parler de matchs, d’équipes, de règles et d’histoire du sport.'],
      ['Le chat sport IA est-il gratuit ?', 'Oui. Discuter avec BETina est gratuit sur iPhone, sur Android et sur le web. Les appels vocaux sont inclus, avec un quota d’appels quotidien.'],
      ['Y a-t-il de l’argent réel en jeu ?', 'Non. BETina est une application de divertissement. Aucun argent n’est misé ni versé, nulle part dans l’appli.'],
      ['De quels sports puis-je parler avec BETina ?', 'De football, de tennis, de NFL, de MMA, de cricket et de bien d’autres. Les scores en direct de l’appli sont disponibles pour le football.'],
      ['BETina se souvient-elle de mon équipe préférée et de nos discussions ?', 'Oui. Elle garde en tête tes équipes préférées et ce que tu lui as raconté, et elle y revient. Tu peux faire supprimer ces données à tout moment.'],
      ['Comment fonctionnent les appels vocaux avec BETina ?', 'Touche le micro dans le chat pour lancer un appel. Tu parles, BETina répond à voix haute, et tu peux lui couper la parole comme dans un appel téléphonique normal.'],
      ['Quelles langues BETina parle-t-elle ?', 'Le français, l’anglais, l’allemand, l’espagnol, le portugais, l’italien, le roumain, le turc et le croate. Elle répond dans la langue que tu utilises.'],
      ['BETina est-elle une vraie personne ? Ses réponses sont-elles toujours justes ?', 'Non, et non. BETina est une IA dotée de sa propre personnalité. Elle peut se tromper : vérifie donc tout ce qui est important auprès d’une source officielle.'],
    ],
    alsoH2: 'Il y a encore plus', alsoH2b: 'dans l’appli.',
    homeTeaser: 'Tout ce que BETina sait faire, sur une seule page.',
    ctaH2: 'Quelqu’un avec qui', ctaH2b: 'parler sport. Toujours.',
    ctaText: 'Télécharge BETina et lance la conversation. Elle a déjà un avis sur ton équipe.',
  },
};
