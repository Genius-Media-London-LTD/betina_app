// Spanish (neutral, informal "tú") versions of the three feature pages.
export default {
  local: { home: 'Inicio', more: 'Más de BETina', faq: 'Preguntas y respuestas', now: 'ahora' },
  home: {
    moreChat: 'Más sobre el chat deportivo con IA →',
    moreLive: 'Más sobre los resultados en vivo →',
    moreGame: 'Más sobre el juego de pronósticos →',
  },

  game: {
    path: '/es/juego-de-pronosticos',
    nav: 'Juego de pronósticos',
    teaser: 'Pronostica marcadores de fútbol, suma puntos y gana a tus amigos. Sin dinero de por medio.',
    more: 'Más sobre el juego de pronósticos',
    crumb: 'Juego de pronósticos',
    title: 'Juego de pronósticos de fútbol gratis con amigos | BETina',
    desc: 'Juego de pronósticos de fútbol gratis: acierta marcadores, suma puntos y sube en la clasificación con tus amigos. Sin dinero, con una IA que también juega.',
    sticker: 'Solo por diversión · Sin dinero',
    h1: 'Juego de pronósticos de fútbol:',
    h1b: 'gratis, con amigos y sin dinero.',
    lead: 'Di el resultado antes del pitido inicial, suma puntos cuando aciertas y adelanta a tus amigos en la clasificación. El juego de pronósticos de BETina es gratis, no hay dinero en juego ni pagos de ningún tipo, y trae una compañera con IA que pronostica todos los partidos.',
    badge: '3 · 2 · 1',
    shotAlt: 'App BETina: juego de pronósticos de fútbol con clasificación',
    facts: [
      ['3·2·1', 'Puntos por marcador exacto, diferencia de goles y ganador'],
      ['5', 'Competiciones, de la Bundesliga a la Champions League'],
      ['0 €', 'Sin dinero en juego, sin premios, sin pagos'],
      ['9', 'Idiomas en los que puedes jugar'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En pocas palabras', h2: '¿Qué es el juego de pronósticos', h2b: 'de BETina?',
        paras: [
          '<strong>El juego de pronósticos de BETina es un juego gratuito para pronosticar marcadores de fútbol dentro de la app BETina.</strong> Antes de que empiece un partido escribes el resultado que esperas. Tras el pitido final, la app compara tu pronóstico con el marcador real y reparte puntos. Esos puntos deciden tu puesto en la clasificación, la general y la de los grupos privados que montas con tus amigos.',
          'Es el juego de toda la vida en oficinas y grupos de chat, pero sin hoja de cálculo y sin dinero. Lo nuevo es con quién juegas: BETina, la compañera deportiva con IA de la app, también pronostica cada partido, hace de anfitriona y discute encantada contigo ese 3–1 que has puesto.',
        ],
      },
      {
        type: 'steps', kicker: 'Cómo funciona', h2: 'El juego de pronósticos', h2b: 'en tres pasos.',
        items: [
          { t: 'Pronostica el marcador', p: 'Abre la lista de partidos, elige uno y escribe el resultado que esperas, por ejemplo 2–1. Puedes cambiar tu pronóstico todas las veces que quieras hasta el pitido inicial.' },
          { t: 'Sigue el partido', p: 'Cuando empieza el partido, los pronósticos se bloquean y quedan a la vista de todos, así que nadie puede copiar. Si lo sigues en BETina Live, tu pronóstico aparece junto al marcador en vivo.' },
          { t: 'Suma tus puntos', p: 'Tras el pitido final, tus puntos se suman solos y la clasificación se actualiza. Una notificación te cuenta cómo te fue en la jornada.' },
        ],
      },
      {
        type: 'cards', kicker: 'Puntuación', h2: 'Cómo se reparten', h2b: 'los puntos.',
        intro: 'Un pronóstico, tres formas de puntuar. Cuenta el resultado tras los 90 minutos más el tiempo añadido.',
        items: [
          { big: '3', unit: 'puntos', t: 'Marcador exacto', p: 'Clavaste el resultado, gol por gol. La mejor sensación del juego.', eg: 'Pronóstico 2–1 · Resultado 2–1' },
          { big: '2', unit: 'puntos', t: 'Diferencia de goles correcta', p: 'Acertaste el ganador y la diferencia, pero no el marcador exacto. Un empate con otro marcador también cuenta aquí.', eg: 'Pronóstico 2–1 · Resultado 3–2' },
          { big: '1', unit: 'punto', t: 'Ganador correcto', p: 'Acertaste quién gana, pero la diferencia fue otra.', eg: 'Pronóstico 2–1 · Resultado 3–0' },
        ],
        after: [
          'Un pronóstico fallado no suma nada y no cuesta nada. Además de los pronósticos de partido hay <strong>preguntas extra</strong> que dan puntos adicionales. Cada punto que consigues te da también XP para tu nivel en la app.',
        ],
      },
      {
        type: 'shot', kicker: 'Con amigos', h2: 'Juega con tus amigos y', h2b: 'sube en la clasificación.', img: 'screen-predictor',
        alt: 'App BETina: grupo de pronósticos con amigos y clasificación',
        paras: [
          'Un juego de pronósticos de fútbol se disfruta más con gente que conoces. En BETina creas un <strong>grupo privado</strong>, invitas a tus amigos, a tu familia o a los compañeros de trabajo y tienen su propia clasificación, aparte de la general. Quien esté arriba el lunes por la mañana tiene la palabra.',
          'La clasificación muestra quién ganó y quién perdió puestos en la última jornada, y tus estadísticas personales te dicen cuántas veces clavas el marcador exacto. También hay un reto de equipo: después de cada ronda, la media de tu grupo se compara con la puntuación de BETina. El objetivo es ganarle entre todos.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'La diferencia', h2: 'Una compañera con IA que juega contigo', h2b: 'y habla de fútbol.',
        label: 'Conversación de ejemplo sobre un pronóstico',
        paras: [
          'Cualquier otro juego de pronósticos es un formulario y una tabla. En BETina el juego tiene anfitriona. <strong>BETina pronostica todos los partidos.</strong> Sus pronósticos están ocultos hasta el pitido inicial, igual que los de los demás, y ella aparece en todas las clasificaciones, así que siempre tienes a alguien a quien ganar.',
          'Y puedes comentarlo con ella. Cuéntale por qué ves una victoria visitante, pregúntale qué le parece el momento de un equipo o deja que te recuerde con guasa el fin de semana pasado. Te responde en tu idioma, por escrito o en una llamada de voz. Lo suyo es una opinión, no un consejo, y se equivoca lo suficiente como para que la cosa tenga gracia.',
        ],
        msgs: [
          ['me', 'Para el sábado pongo 3–1. ¿Demasiado valiente?'],
          ['b', 'Valiente, sí. No marcan tres en casa desde el otoño. Pero me gusta la confianza.'],
          ['me', '¿Y tú qué has puesto?'],
          ['b', 'Buen intento. El mío lo verás cuando empiece el partido, como todo el mundo. 😌'],
        ],
        note: 'Ejemplo ilustrativo. BETina es una IA y puede equivocarse.',
      },
      {
        type: 'prose', kicker: 'El principio', h2: 'Sin dinero, sin nada en juego:', h2b: 'solo puntos y derecho a presumir.',
        paras: [
          'En el juego de pronósticos de BETina se juega por diversión. <strong>No pones dinero, no compras nada y no se paga nada.</strong> No hay premios en metálico ni pago de inscripción, y la app no te pide la tarjeta en ningún momento. Lo que ganas son puntos, XP, un puesto en la clasificación y el derecho a recordárselo a tus amigos.',
          'Es así a propósito. BETina es una app de entretenimiento para adultos, y el juego está pensado para que una jornada sea más divertida, juegue tu equipo o no.',
        ],
      },
      {
        type: 'table', kicker: 'Competiciones', h2: 'Competiciones que', h2b: 'puedes pronosticar.',
        intro: 'El juego de pronósticos cubre cinco de las mayores competiciones del fútbol europeo de clubes, jornada a jornada.',
        cols: ['Competición', 'País', 'Qué pronosticas'], hl: 0,
        rows: [
          ['Bundesliga', 'Alemania', 'Todos los partidos de cada jornada'],
          ['Premier League', 'Inglaterra', 'Todos los partidos de cada jornada'],
          ['LaLiga', 'España', 'Todos los partidos de cada jornada'],
          ['Serie A', 'Italia', 'Todos los partidos de cada jornada'],
          ['Champions League', 'Europa', 'Fase de liga y eliminatorias'],
        ],
        after: ['Tú eliges en qué competiciones quieres jugar. Los puntos de todas cuentan para la clasificación general.'],
      },
    ],
    faqH2: 'Preguntas frecuentes', faqH2b: 'sobre el juego de pronósticos.',
    faq: [
      ['¿El juego de pronósticos de BETina es gratis?', 'Sí. El juego forma parte de la app gratuita BETina para iPhone, Android y web. No hay pago de inscripción ni suscripción.'],
      ['¿Hay dinero real de por medio? ¿Puedo ganar premios?', 'No. No pones dinero y no se paga nada. No hay premios en metálico ni en especie. Juegas por puntos, XP y tu puesto en la clasificación.'],
      ['¿Cómo se consiguen los puntos?', 'Tres puntos por el marcador exacto, dos por el ganador correcto con la diferencia de goles correcta y uno por el ganador correcto. Cuenta el resultado tras los 90 minutos más el tiempo añadido.'],
      ['¿Qué ligas y competiciones puedo pronosticar?', 'Bundesliga, Premier League, LaLiga, Serie A y la Champions League.'],
      ['¿Puedo jugar al juego de pronósticos con mis amigos?', 'Sí. Crea un grupo privado en la app e invita a tus amigos. Tendrán su propia clasificación, además de la general.'],
      ['¿Hasta cuándo puedo hacer un pronóstico? ¿Puedo cambiarlo?', 'Puedes hacer y cambiar un pronóstico hasta que empieza el partido. Con el pitido inicial queda bloqueado, y solo entonces lo ven los demás.'],
      ['¿En qué se diferencia BETina de otras apps de pronósticos de fútbol?', 'Juegas con una compañera con IA. BETina pronostica todos los partidos, aparece en todas las clasificaciones y comenta tus pronósticos contigo, en nueve idiomas.'],
      ['¿El juego de pronósticos está disponible en iPhone, Android y web?', 'Sí. Puedes jugar en la app de iPhone, en la app de Android y en la app web desde el navegador, con la misma cuenta.'],
    ],
    alsoH2: 'Hay más', alsoH2b: 'en la app.',
    homeTeaser: 'Todo lo que BETina sabe hacer, en una página.',
    ctaH2: '¿Crees que sabes', ctaH2b: 'de fútbol? Demuéstralo.',
    ctaText: 'Descarga BETina, pronostica tu primera jornada y mira en qué puesto de la clasificación acabas.',
  },

  live: {
    path: '/es/resultados-en-vivo',
    nav: 'Resultados en vivo',
    teaser: 'Resultados de fútbol en vivo de tus equipos y un aviso en cuanto entra un gol.',
    more: 'Más sobre BETina Live',
    crumb: 'Resultados en vivo',
    title: 'Resultados de fútbol en vivo y alertas de gol | BETina',
    desc: 'Resultados de fútbol en vivo de tus equipos y una alerta en tu teléfono con cada gol. Pregúntale a la IA por el partido. Gratis en iPhone, Android y web.',
    sticker: 'BETina Live · Fútbol',
    h1: 'Resultados de fútbol en vivo',
    h1b: 'y alertas de gol de tus equipos.',
    lead: 'BETina Live te muestra los resultados de fútbol que te importan y te manda un aviso al teléfono en el momento en que tu equipo marca. Y cuando quieres saber qué está pasando en el partido, se lo preguntas a BETina.',
    badge: '● En vivo',
    push: '¡GOL! 1–0 en el minuto 34.',
    shotAlt: 'App BETina: resultados de fútbol en vivo con alertas de gol de los equipos que sigues',
    facts: [
      ['0 €', 'Gratis en la app, sin suscripción'],
      ['5', 'Momentos del partido de los que recibes aviso'],
      ['9', 'Idiomas en los que BETina habla de fútbol'],
      ['18+', 'Para adultos, sin dinero de por medio'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En pocas palabras', h2: '¿Qué es', h2b: 'BETina Live?',
        paras: [
          '<strong>BETina Live es la sección de resultados de fútbol en vivo de la app BETina.</strong> Muestra los partidos que se están jugando ahora mismo, mantiene el marcador al día mientras rueda el balón y pone arriba del todo a los equipos que sigues. No hace falta tener la app abierta: cuando pasa algo en un partido que te importa, te llega una notificación.',
          'La mayoría de las apps de resultados se quedan ahí. BETina Live vive dentro de una compañera deportiva con IA, así que el marcador es solo el principio de la conversación. Puedes preguntarle a BETina quién marcó, cómo queda la tabla o qué le pareció la primera parte, en el chat o en una llamada de voz. Los resultados en vivo están disponibles para fútbol; de los demás deportes se habla en el <a href="/es/chat-deportivo-ia">chat deportivo con IA</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Alertas de gol', h2: 'Un aviso en cuanto', h2b: 'marca tu equipo.',
        label: 'Notificaciones de ejemplo de BETina Live',
        paras: [
          'Las alertas de gol son el motivo por el que casi todo el mundo instala una app de resultados de fútbol, y son el centro de BETina Live. Sigue a un equipo y recibirás una notificación push cuando haya un gol en su partido, con el nuevo marcador y el minuto.',
          'Los avisos solo llegan de <strong>los equipos y partidos que tú has elegido</strong>. Nadie necesita cincuenta notificaciones de ligas que no ve. Además de los goles, BETina Live avisa de los otros momentos que cambian un partido: el pitido inicial, las tarjetas rojas, el descanso y el pitido final.',
          'Las notificaciones de gol te llegan en iPhone y en Android. Puedes desactivarlas en los ajustes cuando quieras.',
        ],
        items: [
          ['19:30', '¡Empieza el partido! Tu equipo ya está en el campo.'],
          ['34′', '¡GOL! 1–0 en el minuto 34.'],
          ['45′', 'Descanso: 1–0. Buena primera parte.'],
          ['67′', 'Tarjeta roja para el equipo visitante.'],
          ['90′', 'Final: 2–0. ¡Tres puntos!'],
        ],
      },
      {
        type: 'steps', kicker: 'Configuración', h2: 'Cómo activar las notificaciones de gol', h2b: 'de tu equipo.',
        intro: 'Se tarda más o menos un minuto y solo hay que hacerlo una vez.',
        items: [
          { t: 'Descarga BETina', p: 'Baja la app gratis en el App Store o en Google Play y entra con Apple, Google, correo electrónico o tu número de teléfono.' },
          { t: 'Elige tus equipos', p: 'Escoge tu equipo favorito al empezar. En la pestaña Live puedes seguir a más equipos o un partido suelto.' },
          { t: 'Permite las notificaciones', p: 'Di que sí cuando tu teléfono pregunte si BETina puede enviarte notificaciones. Sin ese permiso no te puede llegar ninguna alerta de gol.' },
          { t: 'Mira el partido, o no', p: 'Guarda el teléfono. La próxima vez que marque tu equipo lo sabrás en ese mismo minuto de partido, estés donde estés.' },
        ],
      },
      {
        type: 'chat', kicker: 'La diferencia', h2: 'Pregunta por el partido:', h2b: 'resultados en vivo con una compañera con IA.',
        label: 'Conversación de ejemplo sobre un partido en vivo',
        paras: [
          'Un marcador te dice qué ha pasado. No te dice por qué, y además le da igual. BETina hace las dos cosas. Tiene delante los datos en vivo del partido, así que puedes preguntarle lo mismo que a una amiga que lo está viendo: quién marcó, si la ventaja es merecida, qué supone el resultado para la tabla.',
          'Cada página de partido incluye también <strong>la opinión de BETina</strong>, una lectura breve del encuentro con sus propias palabras, junto a la tabla y el historial de enfrentamientos entre los dos equipos. Y como BETina habla nueve idiomas, un aficionado en Zagreb recibe en croata el mismo partido que un aficionado en Madrid recibe en español.',
        ],
        msgs: [
          ['me', '¿Cómo va nuestro partido?'],
          ['b', 'Tu equipo gana 1–0 desde el minuto 34. Cabezazo tras un córner, y la verdad es que se veía venir.'],
          ['me', '¿Y cómo quedamos en la tabla?'],
          ['b', 'Si sigue así, tu equipo sube al cuarto puesto. Dos jornadas más como esta y empiezo a creérmelo.'],
        ],
        note: 'Ejemplo ilustrativo. BETina es una IA y puede equivocarse.',
      },
      {
        type: 'cards', kicker: 'En cada página de partido', h2: 'Más que', h2b: 'un número.',
        items: [
          { t: 'Marcador en vivo y cronología', p: 'El marcador actual, el minuto y las jugadas clave del partido en el orden en que ocurrieron.' },
          { t: 'Tabla e historial', p: 'La tabla de la liga de un vistazo y cómo les fue a los dos equipos en sus enfrentamientos anteriores.' },
          { t: 'Tu pronóstico al lado', p: 'Si juegas al <a href="/es/juego-de-pronosticos" style="color:var(--lime);text-decoration:underline">juego de pronósticos</a> gratuito, el resultado que pronosticaste aparece junto al marcador en vivo.' },
        ],
      },
      {
        type: 'prose', kicker: 'Bueno saberlo', h2: 'Gratis en iPhone, Android', h2b: 'y en la web.',
        paras: [
          'BETina Live forma parte de la app gratuita BETina. No hay una versión de pago para los resultados ni una suscripción para las alertas de gol. La app está en el App Store y en Google Play, y puedes abrir la app web en el navegador para consultar los resultados desde un portátil.',
          'BETina es una app de entretenimiento para adultos. <strong>En la app no hay dinero de por medio en ningún sitio</strong>: no se pone nada en juego y no se paga nada. Es una creación de GeniusBet y la opera Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'preguntas frecuentes.',
    faq: [
      ['¿BETina Live es gratis?', 'Sí. Los resultados en vivo y las alertas de gol forman parte de la app gratuita BETina para iPhone, Android y web. No hay suscripción.'],
      ['¿Cómo recibo una notificación cuando marca mi equipo?', 'Instala BETina, elige tu equipo y permite las notificaciones. A partir de ahí recibirás un aviso cada vez que haya un gol en un partido de un equipo que sigues.'],
      ['¿Puedo recibir alertas de gol de un solo equipo?', 'Sí. Los avisos solo se envían de los equipos y partidos sueltos que sigues, así que con un equipo basta. Puedes añadir o quitar equipos cuando quieras.'],
      ['¿De qué deportes hay resultados en vivo?', 'Los resultados en vivo y las alertas de gol están disponibles para fútbol. Con BETina puedes hablar de muchos otros deportes, como tenis, NFL, MMA o críquet.'],
      ['¿De qué más recibo avisos, aparte de los goles?', 'Del pitido inicial, las tarjetas rojas, el descanso y el resultado final de los partidos que sigues.'],
      ['¿Qué le puedo preguntar a la IA sobre un partido?', 'Lo mismo que a una amiga que lo está viendo: el marcador, quién marcó, cómo queda la tabla o qué le parece el partido. BETina es una IA y puede equivocarse, así que toma lo que dice como una opinión.'],
      ['¿Hay dinero real de por medio?', 'No. BETina es una app de entretenimiento. En la app no se pone dinero en juego ni se paga nada.'],
    ],
    alsoH2: 'Hay más', alsoH2b: 'en la app.',
    homeTeaser: 'Todo lo que BETina sabe hacer, en una página.',
    ctaH2: 'No te pierdas', ctaH2b: 'ni un gol más.',
    ctaText: 'Descarga BETina, sigue a tu equipo y deja que los goles lleguen a ti.',
  },

  chat: {
    path: '/es/chat-deportivo-ia',
    nav: 'Chat deportivo con IA',
    teaser: 'Escribe o llama a una compañera con IA que conoce a tus equipos y recuerda lo que hablaron.',
    more: 'Más sobre el chat deportivo con IA',
    crumb: 'Chat deportivo con IA',
    title: 'Chat deportivo con IA: habla de fútbol y deporte | BETina',
    desc: 'Chat deportivo con IA: escribe o llama a BETina, que conoce a tus equipos, recuerda tus charlas y habla 9 idiomas. Gratis y sin dinero de por medio.',
    sticker: 'Chat · Voz · 9 idiomas',
    h1: 'Chat deportivo con IA:',
    h1b: 'habla de fútbol y deporte con BETina.',
    lead: 'BETina es una compañera con IA con la que hablas de deporte como con una amiga que lo ve todo. Escríbele o llámala. Conoce a tus equipos, se acuerda de lo que dijiste la semana pasada y te responde en tu idioma.',
    badge: '● En línea',
    shotAlt: 'App BETina: chat deportivo con IA con BETina',
    facts: [
      ['24/7', 'Está ahí siempre que quieras hablar de deporte'],
      ['9', 'Idiomas, y cambia cuando tú cambias'],
      ['11+', 'Deportes, del fútbol al críquet'],
      ['0 €', 'Chatear es gratis, sin dinero de por medio'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'En pocas palabras', h2: '¿Qué es el chat deportivo con IA', h2b: 'de BETina?',
        paras: [
          '<strong>El chat deportivo con IA de BETina es una conversación con una compañera con IA que vive para el deporte.</strong> Es el corazón de la app BETina. Haces una pregunta o simplemente sueltas lo que te ronda la cabeza después de un partido, y BETina responde como alguien con opinión: breve, directa y con el tono de quien de verdad lo vio.',
          'La mayoría de los chatbots deportivos con IA son herramientas de pregunta y respuesta atadas a una liga o a una cadena de televisión. BETina es una sola personalidad para todos los deportes. Sabe de qué equipos eres, saca temas que le contaste antes y puedes llamarla cuando escribir se queda corto. Puedes hablar con una IA de fútbol, de tenis o de la NFL en el mismo chat.',
        ],
      },
      {
        type: 'cards', kicker: 'Temas', h2: 'De qué puedes', h2b: 'hablar.',
        items: [
          { t: 'Tus equipos y tu jornada', p: 'Alineaciones, estado de forma, ese cambio que nadie entendió. BETina conoce a tus equipos favoritos y tiene a mano los resultados de fútbol en vivo, así que va al mismo ritmo que tú.' },
          { t: 'Reglas, historia y debates', p: '¿Por qué era fuera de juego? ¿Quién fue el mejor diez? Pide una explicación rápida o arma una discusión sobre el mejor equipo de todos los tiempos.' },
          { t: 'Todos los deportes, no una sola liga', p: 'Fútbol, tenis, NFL, MMA, críquet y más. Aprende un deporte nuevo desde cero o profundiza en el que sigues desde hace veinte años.' },
        ],
      },
      {
        type: 'chat', kicker: 'Ejemplos', h2: 'Tres conversaciones', h2b: 'con BETina.',
        label: 'Conversación de ejemplo: una regla explicada',
        paras: [
          '<strong>La duda de reglamento.</strong> Viste cómo anulaban un gol y quieres saber por qué, sin leerte el reglamento. BETina te lo explica en tres frases y se ofrece a entrar en detalle.',
          '<strong>La mañana siguiente.</strong> Sigues molesto por lo del sábado. BETina recuerda que la semana pasada te preocupaba el centro del campo y retoma la conversación justo ahí.',
          '<strong>El deporte nuevo.</strong> Una amiga te arrastra a una final de tenis o a una noche de NFL. Pídele a BETina que te explique el sistema de puntuación con palabras sencillas y seguirás el partido antes del primer descanso.',
        ],
        msgs: [
          ['me', '¿Por qué anularon ese gol? Yo lo vi en línea.'],
          ['b', 'En línea vale, pero su hombro estaba por delante del último defensa cuando salió el pase. Los hombros cuentan, los brazos no.'],
          ['me', '¿Tan justo?'],
          ['b', 'Unos centímetros. Duele, lo sé. ¿Quieres la versión de 20 segundos de cómo se traza la línea?'],
        ],
        note: 'Ejemplo ilustrativo. BETina es una IA y puede equivocarse.',
      },
      {
        type: 'shot', flip: true, kicker: 'Voz', h2: 'Llama a BETina:', h2b: 'habla de deporte con una IA por voz.', img: 'screen-call',
        alt: 'App BETina: llamada de voz con BETina',
        paras: [
          'A veces no apetece escribir. En la app puedes <strong>llamar a BETina y hablar de deporte por voz</strong>, sin manos, camino del estadio o con el partido puesto de fondo. Te escucha, te responde en voz alta y te sigue cuando la interrumpes, como en una llamada de teléfono.',
          'En una llamada sabe lo mismo que en el chat: tus equipos, tus conversaciones anteriores y los resultados de fútbol en vivo. Las llamadas de voz están incluidas gratis, con un cupo diario de llamadas.',
        ],
      },
      {
        type: 'prose', kicker: 'Memoria', h2: 'Recuerda a tus equipos', h2b: 'y tu última charla.',
        paras: [
          'Una conversación mejora cuando no hay que empezar de cero. BETina tiene presente qué equipos y deportes sigues y lo que le has contado, así que la semana que viene puede preguntarte cómo viviste el derbi o si tu rodilla sobrevivió al partidito con los amigos.',
          'Esa memoria la controlas tú. Puedes pedir que se borre tu historial de chat o lo que BETina ha recordado sobre ti, y al eliminar tu cuenta desaparece todo por completo. Los detalles están en la <a href="/delete-account">página de cuenta y datos</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Idiomas', h2: 'Una compañera,', h2b: 'nueve idiomas.',
        intro: 'BETina responde en el idioma en el que escribes o hablas, y cambia cuando tú cambias. Eso la convierte en un chat deportivo con IA para quienes siguen una liga en un idioma y viven en otro.',
        items: [
          '<strong>Español</strong>', '<strong>Inglés</strong> (English)', '<strong>Alemán</strong> (Deutsch)', '<strong>Francés</strong> (Français)', '<strong>Portugués</strong> (Português)',
          '<strong>Italiano</strong> (Italiano)', '<strong>Rumano</strong> (Română)', '<strong>Turco</strong> (Türkçe)', '<strong>Croata</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'Las cosas claras', h2: 'Lo que BETina', h2b: 'no es.',
        paras: [
          '<strong>BETina es una IA, no una persona real.</strong> Tiene personalidad y opiniones, pero las genera un software y, como cualquier IA, puede equivocarse con los datos. Toma lo que dice sobre deporte como un punto de vista para discutir, no como una fuente verificada.',
          'Tampoco es una asesora. BETina es una app de entretenimiento para adultos (18+), y en la app no hay dinero de por medio en ningún sitio. Su opinión sobre un partido es conversación y nada más.',
        ],
      },
      {
        type: 'steps', kicker: 'Empieza ya', h2: 'Cómo empezar', h2b: 'a chatear.',
        items: [
          { t: 'Descarga BETina', p: 'Baja la app gratis en el App Store o en Google Play, o abre la app web en tu navegador.' },
          { t: 'Entra y elige tus equipos', p: 'Entra con Apple, Google, correo electrónico o teléfono y elige los equipos y deportes que te importan.' },
          { t: 'Saluda', p: 'Escribe tu primer mensaje o toca el micrófono para llamarla. Si no sabes por dónde empezar, pregúntale por el partido de esta noche.' },
        ],
      },
    ],
    faqH2: 'Preguntas sobre', faqH2b: 'el chat deportivo con IA.',
    faq: [
      ['¿De verdad puedo hablar de deporte con una IA?', 'Sí. BETina es una compañera con IA hecha para el deporte. Puedes escribirle o llamarla y hablar de partidos, equipos, reglas e historia del deporte.'],
      ['¿El chat deportivo con IA es gratis?', 'Sí. Chatear con BETina es gratis en iPhone, Android y web. Las llamadas de voz están incluidas con un cupo diario de llamadas.'],
      ['¿Hay dinero real de por medio?', 'No. BETina es una app de entretenimiento. En la app no se pone dinero en juego ni se paga nada.'],
      ['¿De qué deportes puedo hablar con BETina?', 'De fútbol, tenis, NFL, MMA, críquet y muchos más. Los resultados en vivo de la app están disponibles para fútbol.'],
      ['¿BETina recuerda mi equipo favorito y mis chats anteriores?', 'Sí. Tiene presentes tus equipos favoritos y lo que le has contado, y vuelve sobre ello. Puedes pedir que se borren esos datos cuando quieras.'],
      ['¿Cómo funcionan las llamadas de voz con BETina?', 'Toca el micrófono en el chat para empezar una llamada. Tú hablas, BETina responde en voz alta y puedes interrumpirla como en una llamada normal.'],
      ['¿Qué idiomas habla BETina?', 'Español, inglés, alemán, francés, portugués, italiano, rumano, turco y croata. Responde en el idioma que uses.'],
      ['¿BETina es una persona real? ¿Sus respuestas son siempre correctas?', 'No y no. BETina es una IA con personalidad propia. Puede equivocarse, así que comprueba lo importante en una fuente oficial.'],
    ],
    alsoH2: 'Hay más', alsoH2b: 'en la app.',
    homeTeaser: 'Todo lo que BETina sabe hacer, en una página.',
    ctaH2: 'Alguien con quien hablar', ctaH2b: 'de deporte. Siempre.',
    ctaText: 'Descarga BETina y empieza la conversación. Ella ya tiene una opinión sobre tu equipo.',
  },
};
