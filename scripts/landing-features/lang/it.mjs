// Italian (it) localization of the three feature pages. Informal "tu".
const GAME = '/it/gioco-pronostici-calcio';
const LIVE = '/it/risultati-calcio-in-diretta';
const CHAT = '/it/chat-sportiva-ia';

export default {
  local: { home: 'Home', more: 'Altro da BETina', faq: 'Domande e risposte', now: 'ora' },
  home: {
    moreChat: 'Scopri la chat sportiva IA →',
    moreLive: 'Scopri i risultati in diretta →',
    moreGame: 'Scopri il gioco di pronostici →',
  },

  game: {
    path: GAME,
    nav: 'Gioco di pronostici',
    teaser: 'Pronostica i risultati di calcio, fai punti e batti i tuoi amici. Senza soldi.',
    more: 'Scopri il gioco di pronostici',
    crumb: 'Gioco di pronostici',
    title: 'Gioco di pronostici calcio: gratis, con gli amici | BETina',
    desc: 'Gioco di pronostici sul calcio, gratis e senza soldi: indovina i risultati, fai punti e sfida gli amici in classifica. Con un’IA che gioca insieme a te.',
    sticker: 'Solo per divertimento · Niente soldi',
    h1: 'Gioco di pronostici sul calcio:',
    h1b: 'gratis, con gli amici, senza soldi.',
    lead: 'Indovina il risultato prima del calcio d’inizio, fai punti quando ci prendi e supera i tuoi amici in classifica. Il gioco di pronostici di BETina è gratis, non prevede puntate né pagamenti e ha una compagna sportiva IA che pronostica ogni partita insieme a te.',
    badge: '3 · 2 · 1',
    shotAlt: 'App BETina: gioco di pronostici sul calcio con classifica',
    facts: [
      ['3·2·1', 'Punti per risultato esatto, differenza reti, vincitore giusto'],
      ['5', 'Competizioni, dalla Bundesliga alla Champions League'],
      ['0 €', 'Niente puntate, niente premi, niente pagamenti'],
      ['9', 'Lingue in cui puoi giocare'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'In breve', h2: 'Che cos’è il gioco di pronostici', h2b: 'di BETina?',
        paras: [
          '<strong>Il gioco di pronostici di BETina è un gioco gratuito sui risultati di calcio, dentro l’app BETina.</strong> Prima che una partita cominci inserisci il risultato che ti aspetti. Dopo il fischio finale l’app confronta il tuo pronostico con il risultato vero e assegna i punti. Sono quei punti a decidere il tuo posto in classifica, in quella generale e nelle leghe private che crei con gli amici.',
          'È il gioco che da decenni si fa in ufficio e nelle chat di gruppo, solo senza il foglio di calcolo e senza soldi. La novità è con chi giochi: BETina, la compagna sportiva IA dell’app, pronostica anche lei ogni partita, fa da padrona di casa e discute volentieri del tuo 3–1.',
        ],
      },
      {
        type: 'steps', kicker: 'Come funziona', h2: 'Il gioco di pronostici', h2b: 'in tre mosse.',
        items: [
          { t: 'Pronostica il risultato', p: 'Apri l’elenco delle partite, scegline una e inserisci il risultato che ti aspetti, per esempio 2–1. Fino al calcio d’inizio puoi cambiare il pronostico tutte le volte che vuoi.' },
          { t: 'Segui la partita', p: 'Al calcio d’inizio i pronostici vengono bloccati e resi visibili a tutti, così nessuno può copiare. Se segui la partita in BETina Live, il tuo pronostico è lì accanto al risultato in diretta.' },
          { t: 'Incassa i punti', p: 'Dopo il fischio finale i punti vengono aggiunti in automatico e la classifica si aggiorna. Una notifica ti dice com’è andata la tua giornata.' },
        ],
      },
      {
        type: 'cards', kicker: 'Punteggio', h2: 'Come si assegnano', h2b: 'i punti.',
        intro: 'Un pronostico, tre modi di fare punti. Conta il risultato dopo i 90 minuti più recupero.',
        items: [
          { big: '3', unit: 'punti', t: 'Risultato esatto', p: 'Hai indovinato il risultato al gol. La soddisfazione più grande del gioco.', eg: 'Pronostico 2–1 · Risultato 2–1' },
          { big: '2', unit: 'punti', t: 'Differenza reti giusta', p: 'Hai preso il vincitore e lo scarto, ma non il risultato esatto. Vale anche per un pareggio finito con un altro punteggio.', eg: 'Pronostico 2–1 · Risultato 3–2' },
          { big: '1', unit: 'punto', t: 'Vincitore giusto', p: 'Hai indovinato chi vince, ma lo scarto era diverso.', eg: 'Pronostico 2–1 · Risultato 3–0' },
        ],
        after: [
          'Un pronostico sbagliato non dà niente e non costa niente. Oltre ai pronostici sulle partite ci sono le <strong>domande extra</strong>, che valgono punti in più. Ogni punto che fai ti porta anche XP per il tuo livello nell’app.',
        ],
      },
      {
        type: 'shot', kicker: 'Con gli amici', h2: 'Gioca con gli amici', h2b: 'e scala la classifica.', img: 'screen-predictor',
        alt: 'App BETina: lega di pronostici con gli amici e classifica',
        paras: [
          'Un gioco di pronostici sul calcio dà il meglio con le persone che conosci. In BETina crei una <strong>lega privata</strong>, inviti amici, parenti o colleghi e avete una classifica tutta vostra, separata da quella generale. Chi il lunedì mattina è in testa ha diritto di parola.',
          'La classifica mostra chi ha guadagnato e chi ha perso posizioni nell’ultima giornata, e le tue statistiche personali ti dicono quante volte centri il risultato esatto. C’è anche la sfida di squadra: dopo ogni turno la media del vostro gruppo viene confrontata con i punti di BETina. Battetela insieme.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'La differenza', h2: 'Una compagna IA che gioca con te', h2b: 'e parla di calcio con te.',
        label: 'Esempio di conversazione su un pronostico',
        paras: [
          'Tutti gli altri giochi di pronostici sono un modulo e una tabella. In BETina il gioco ha una padrona di casa. <strong>BETina pronostica di persona ogni partita.</strong> I suoi pronostici restano nascosti fino al calcio d’inizio, esattamente come quelli di tutti gli altri, e lei compare in ogni classifica: hai sempre qualcuno da battere.',
          'E ne puoi parlare con lei. Spiegale perché vedi una vittoria in trasferta, chiedile cosa pensa della forma di una squadra o lasciati prendere in giro per lo scorso weekend. Ti risponde nella tua lingua, in chat o con una chiamata vocale. La sua è un’opinione, non un consiglio, e sbaglia abbastanza spesso da tenere vivo il gioco.',
        ],
        msgs: [
          ['me', 'Per sabato dico 3–1. Troppo coraggioso?'],
          ['b', 'Coraggioso sì. Tre gol in casa non li fanno dall’autunno. Però la convinzione mi piace.'],
          ['me', 'E tu cosa hai pronosticato?'],
          ['b', 'Bel tentativo. Il mio lo vedi al calcio d’inizio, come tutti. 😌'],
        ],
        note: 'Esempio illustrativo. BETina è un’IA e può sbagliare.',
      },
      {
        type: 'prose', kicker: 'Il principio', h2: 'Niente soldi, niente puntate:', h2b: 'solo punti e gloria.',
        paras: [
          'Al gioco di pronostici di BETina si gioca per divertimento. <strong>Non punti niente, non compri niente e non viene pagato niente.</strong> Non ci sono premi in denaro né costi d’iscrizione, e l’app non ti chiederà mai la carta. Quello che vinci sono punti, XP, un posto in classifica e il diritto di ricordarlo ai tuoi amici.',
          'È una scelta precisa. BETina è un’app di intrattenimento per adulti, e il gioco serve a rendere più divertente una giornata di campionato, che giochi la tua squadra oppure no.',
        ],
      },
      {
        type: 'table', kicker: 'Competizioni', h2: 'Le competizioni', h2b: 'che puoi pronosticare.',
        intro: 'Il gioco di pronostici copre cinque delle più grandi competizioni del calcio europeo per club, giornata dopo giornata.',
        cols: ['Competizione', 'Paese', 'Cosa pronostichi'], hl: 0,
        rows: [
          ['Bundesliga', 'Germania', 'Tutte le partite di ogni giornata'],
          ['Premier League', 'Inghilterra', 'Tutte le partite di ogni giornata'],
          ['LaLiga', 'Spagna', 'Tutte le partite di ogni giornata'],
          ['Serie A', 'Italia', 'Tutte le partite di ogni giornata'],
          ['Champions League', 'Europa', 'Fase campionato e turni a eliminazione diretta'],
        ],
        after: ['Scegli tu a quali competizioni giocare. I punti di tutte contano per la classifica generale.'],
      },
    ],
    faqH2: 'Gioco di pronostici:', faqH2b: 'domande frequenti.',
    faq: [
      ['Il gioco di pronostici di BETina è gratis?', 'Sì. Il gioco fa parte dell’app gratuita BETina per iPhone, Android e web. Non c’è nessun costo d’iscrizione e nessun abbonamento.'],
      ['Ci sono di mezzo soldi veri? Si vincono premi?', 'No. Non punti niente e non viene pagato niente. Non ci sono premi in denaro né premi materiali. Si gioca per i punti, gli XP e il posto in classifica.'],
      ['Come si assegnano i punti?', 'Tre punti per il risultato esatto, due per il vincitore giusto con la differenza reti giusta, uno per il vincitore giusto. Conta il risultato dopo i 90 minuti più recupero.'],
      ['Quali campionati e competizioni posso pronosticare?', 'Bundesliga, Premier League, LaLiga, Serie A e Champions League.'],
      ['Posso giocare al gioco di pronostici con i miei amici?', 'Sì. Crea una lega privata nell’app e invita i tuoi amici. Avete una classifica vostra, in aggiunta a quella generale.'],
      ['Fino a quando posso inserire un pronostico? Posso cambiarlo?', 'Puoi inserire e cambiare un pronostico fino al calcio d’inizio della partita. In quel momento viene bloccato, e solo allora gli altri possono vederlo.'],
      ['In cosa BETina è diversa dalle altre app di pronostici sul calcio?', 'Giochi con una compagna sportiva IA. BETina pronostica di persona ogni partita, compare in ogni classifica e parla con te dei tuoi pronostici, in nove lingue.'],
      ['Il gioco di pronostici c’è su iPhone, Android e web?', 'Sì. Puoi giocare nell’app per iPhone, nell’app per Android e nella web app dal browser, sempre con lo stesso account.'],
    ],
    alsoH2: 'Nell’app', alsoH2b: 'c’è dell’altro.',
    homeTeaser: 'Tutto quello che BETina sa fare, in una pagina.',
    ctaH2: 'Pensi di capirne', ctaH2b: 'di calcio? Dimostralo.',
    ctaText: 'Scarica BETina, pronostica la tua prima giornata e guarda dove finisci in classifica.',
  },

  live: {
    path: LIVE,
    nav: 'Risultati in diretta',
    teaser: 'I risultati di calcio in diretta delle tue squadre e una notifica appena entra un gol.',
    more: 'Scopri BETina Live',
    crumb: 'Risultati in diretta',
    title: 'Risultati calcio in diretta e notifiche gol con IA | BETina',
    desc: 'Risultati di calcio in diretta delle tue squadre e una notifica a ogni gol. Chiedi all’IA com’è la partita. Gratis su iPhone, Android e web.',
    sticker: 'BETina Live · Calcio',
    h1: 'Risultati di calcio in diretta',
    h1b: 'e notifiche gol per le tue squadre.',
    lead: 'BETina Live ti mostra i risultati di calcio che ti interessano e ti manda una notifica sul telefono nell’istante in cui la tua squadra segna. E quando vuoi sapere cosa sta succedendo in campo, lo chiedi semplicemente a BETina.',
    badge: '● Live',
    push: 'GOL! 1–0 al 34° minuto.',
    shotAlt: 'App BETina: risultati di calcio in diretta con avvisi gol per le squadre che segui',
    facts: [
      ['0 €', 'Gratis nell’app, senza abbonamento'],
      ['5', 'Momenti della partita per cui ricevi una notifica'],
      ['9', 'Lingue in cui BETina parla di calcio'],
      ['18+', 'Per adulti, senza soldi di mezzo'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'In breve', h2: 'Che cos’è', h2b: 'BETina Live?',
        paras: [
          '<strong>BETina Live è la sezione dell’app BETina dedicata ai risultati di calcio in diretta.</strong> Elenca le partite che si stanno giocando in questo momento, tiene aggiornato il punteggio mentre la palla rotola e mette in cima le squadre che segui. Non devi tenere l’app aperta: quando succede qualcosa in una partita che ti sta a cuore, te lo dice una notifica.',
          'La maggior parte delle app di risultati si ferma qui. BETina Live vive dentro una compagna sportiva IA, quindi il punteggio è solo l’inizio di una conversazione. Puoi chiedere a BETina chi ha segnato, com’è adesso la classifica o cosa pensa del primo tempo, in chat o con una chiamata vocale. I risultati in diretta sono disponibili per il calcio; degli altri sport parli nella <a href="/it/chat-sportiva-ia">chat sportiva IA</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Avvisi gol', h2: 'Una notifica nell’istante', h2b: 'in cui la tua squadra segna.',
        label: 'Esempi di notifiche di BETina Live',
        paras: [
          'Gli avvisi gol sono il motivo per cui quasi tutti installano un’app di risultati di calcio, e sono il cuore di BETina Live. Segui una squadra e ricevi una notifica push quando nella sua partita viene segnato un gol, con il nuovo punteggio e il minuto.',
          'Gli avvisi arrivano solo per <strong>le squadre e le partite che hai scelto tu</strong>. A nessuno servono cinquanta notifiche da campionati che non guarda. Oltre ai gol, BETina Live segnala gli altri momenti che cambiano una partita: calcio d’inizio, cartellini rossi, intervallo e fischio finale.',
          'Le notifiche gol ti arrivano su iPhone e su Android. Puoi disattivarle quando vuoi dalle impostazioni.',
        ],
        items: [
          ['19:30', 'Calcio d’inizio! La tua squadra è in campo.'],
          ['34′', 'GOL! 1–0 al 34° minuto.'],
          ['45′', 'Intervallo: 1–0. Buon primo tempo.'],
          ['67′', 'Cartellino rosso per gli ospiti.'],
          ['90′', 'Fischio finale: 2–0. Tre punti!'],
        ],
      },
      {
        type: 'steps', kicker: 'Configurazione', h2: 'Come attivare le notifiche gol', h2b: 'per la tua squadra.',
        intro: 'Ci vuole più o meno un minuto, e lo fai una volta sola.',
        items: [
          { t: 'Scarica BETina', p: 'Scarica gratis l’app da App Store o Google Play e accedi con Apple, Google, email o numero di telefono.' },
          { t: 'Scegli le tue squadre', p: 'All’avvio scegli la tua squadra del cuore. Altre squadre, o una singola partita, le segui dalla scheda Live.' },
          { t: 'Consenti le notifiche', p: 'Rispondi di sì quando il telefono ti chiede se BETina può inviarti notifiche. Senza questo permesso nessun avviso gol può arrivarti.' },
          { t: 'Guarda la partita, oppure no', p: 'Metti via il telefono. La prossima volta che la tua squadra segna lo saprai nello stesso minuto di gioco, ovunque tu sia.' },
        ],
      },
      {
        type: 'chat', kicker: 'La differenza', h2: 'Chiedi della partita:', h2b: 'risultati in diretta con una compagna IA.',
        label: 'Esempio di conversazione su una partita in corso',
        paras: [
          'Un punteggio ti dice cosa è successo. Non ti dice perché, e non gliene importa niente. BETina fa entrambe le cose. Ha davanti i dati in diretta della partita, quindi puoi chiederle quello che chiederesti a un’amica che la sta guardando: chi ha segnato, se il vantaggio è meritato, cosa significa il risultato per la classifica.',
          'In ogni pagina partita trovi anche <strong>il parere di BETina</strong>, una breve lettura della gara con parole sue, accanto alla classifica e ai precedenti tra le due squadre. E siccome BETina parla nove lingue, un tifoso a Zagabria segue in croato la stessa partita che un tifoso a Roma segue in italiano.',
        ],
        msgs: [
          ['me', 'Quanto stiamo?'],
          ['b', '1–0 per voi dal 34°. Colpo di testa su calcio d’angolo, e sinceramente era nell’aria.'],
          ['me', 'E in classifica dove ci porta?'],
          ['b', 'Se finisce così salite al quarto posto. Altre due giornate del genere e comincio a crederci.'],
        ],
        note: 'Esempio illustrativo. BETina è un’IA e può sbagliare.',
      },
      {
        type: 'cards', kicker: 'In ogni pagina partita', h2: 'Più di', h2b: 'un numero.',
        items: [
          { t: 'Punteggio live e cronaca', p: 'Il punteggio attuale, il minuto e gli episodi chiave della partita, nell’ordine in cui sono avvenuti.' },
          { t: 'Classifica e precedenti', p: 'La classifica del campionato a colpo d’occhio e com’è andata tra le due squadre negli incontri passati.' },
          { t: 'Il tuo pronostico lì accanto', p: 'Se giochi al <a href="/it/gioco-pronostici-calcio" style="color:var(--lime);text-decoration:underline">gioco di pronostici</a> gratuito, il risultato che hai pronosticato compare accanto al punteggio in diretta.' },
        ],
      },
      {
        type: 'prose', kicker: 'Buono a sapersi', h2: 'Gratis su iPhone, Android', h2b: 'e web.',
        paras: [
          'BETina Live fa parte dell’app gratuita BETina. Non esiste un piano a pagamento per i risultati né un abbonamento per gli avvisi gol. Trovi l’app su App Store e Google Play, e puoi aprire la web app nel browser per controllare i risultati dal portatile.',
          'BETina è un’app di intrattenimento per adulti. <strong>Nell’app non c’è denaro in nessun punto</strong>: non c’è niente da puntare e niente da incassare. È creata da GeniusBet e gestita da Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'domande frequenti.',
    faq: [
      ['BETina Live è gratis?', 'Sì. I risultati in diretta e gli avvisi gol fanno parte dell’app gratuita BETina per iPhone, Android e web. Non c’è nessun abbonamento.'],
      ['Come faccio a ricevere una notifica quando la mia squadra segna?', 'Installa BETina, scegli la tua squadra e consenti le notifiche. Da quel momento ricevi una notifica push ogni volta che viene segnato un gol in una partita di una squadra che segui.'],
      ['Posso ricevere gli avvisi gol per una sola squadra?', 'Sì. Gli avvisi vengono inviati solo per le squadre e le singole partite che segui, quindi una squadra basta. Puoi aggiungerne o toglierne quando vuoi.'],
      ['Per quali sport ci sono i risultati in diretta?', 'I risultati in diretta e gli avvisi gol sono disponibili per il calcio. Con BETina puoi parlare di molti altri sport, come tennis, NFL, MMA o cricket.'],
      ['Per cos’altro ricevo una notifica, oltre ai gol?', 'Per il calcio d’inizio, i cartellini rossi, l’intervallo e il risultato finale delle partite che segui.'],
      ['Cosa posso chiedere all’IA su una partita?', 'Tutto quello che chiederesti a un’amica che la sta guardando: il punteggio, chi ha segnato, com’è la classifica o cosa pensa della gara. BETina è un’IA e può sbagliare, quindi prendi il suo parere come un’opinione.'],
      ['Ci sono di mezzo soldi veri?', 'No. BETina è un’app di intrattenimento. Nell’app non si punta e non si incassa denaro, in nessun punto.'],
    ],
    alsoH2: 'Nell’app', alsoH2b: 'c’è dell’altro.',
    homeTeaser: 'Tutto quello che BETina sa fare, in una pagina.',
    ctaH2: 'Non perderti', ctaH2b: 'più nessun gol.',
    ctaText: 'Scarica BETina, segui la tua squadra e lascia che siano i gol a venire da te.',
  },

  chat: {
    path: CHAT,
    nav: 'Chat sportiva IA',
    teaser: 'Scrivi o telefona a una compagna sportiva IA che conosce le tue squadre e ricorda le vostre chiacchierate.',
    more: 'Scopri la chat sportiva IA',
    crumb: 'Chat sportiva IA',
    title: 'Chat sportiva IA: parla di calcio e sport con BETina',
    desc: 'Chat sportiva IA con BETina: scrivile o chiamala. Conosce le tue squadre, ricorda le vostre chiacchierate e parla 9 lingue. Gratis, senza soldi.',
    sticker: 'Chat · Voce · 9 lingue',
    h1: 'Chat sportiva IA:',
    h1b: 'parla di calcio e di sport con BETina.',
    lead: 'BETina è una compagna sportiva IA con cui parli di sport come faresti con un’amica che non si perde una partita. Scrivile o chiamala. Conosce le tue squadre, ricorda cosa le hai detto la settimana scorsa e ti risponde nella tua lingua.',
    badge: '● Online ora',
    shotAlt: 'App BETina: chat sportiva IA con BETina',
    facts: [
      ['24/7', 'C’è ogni volta che ti va di parlare di sport'],
      ['9', 'Lingue: cambia lei quando cambi tu'],
      ['11+', 'Sport, dal calcio al cricket'],
      ['0 €', 'Chattare è gratis, senza soldi di mezzo'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'In breve', h2: 'Che cos’è la chat sportiva IA', h2b: 'di BETina?',
        paras: [
          '<strong>La chat sportiva IA di BETina è una conversazione con una compagna IA che vive di sport.</strong> È il cuore dell’app BETina. Fai una domanda o dici semplicemente quello che ti passa per la testa dopo una partita, e BETina risponde come una persona con le sue idee: breve, diretta e con il tono di chi la partita l’ha vista davvero.',
          'Quasi tutti i chatbot sportivi con IA sono strumenti a domanda e risposta legati a un solo campionato o a una sola emittente. BETina è una personalità unica per tutti gli sport. Sa per quali squadre tifi, tira fuori cose che le avevi raccontato e puoi telefonarle quando scrivere è troppo lento. Puoi parlare di calcio con l’IA, e poi di tennis o di NFL, nella stessa chat.',
        ],
      },
      {
        type: 'cards', kicker: 'Argomenti', h2: 'Parlare di calcio con l’IA', h2b: 'e di ogni altro sport.',
        items: [
          { t: 'Le tue squadre e la tua giornata', p: 'Formazioni, stato di forma, quel cambio che non ha capito nessuno. BETina conosce le tue squadre del cuore e ha sottomano i risultati di calcio in diretta, quindi siete sempre allineati.' },
          { t: 'Regole, storia e discussioni da bar', p: 'Perché era fuorigioco? Chi è stato il numero dieci più forte? Fatti spiegare una cosa al volo oppure attacca briga sulla squadra più grande di tutti i tempi.' },
          { t: 'Tutti gli sport, non un solo campionato', p: 'Calcio, tennis, NFL, MMA, cricket e altro ancora. Impara uno sport nuovo da zero o vai a fondo su quello che segui da vent’anni.' },
        ],
      },
      {
        type: 'chat', kicker: 'Esempi', h2: 'Tre conversazioni', h2b: 'con BETina.',
        label: 'Esempio di conversazione: una regola spiegata',
        paras: [
          '<strong>La regola spiegata.</strong> Hai visto annullare un gol e vuoi sapere perché, senza leggerti il regolamento. BETina te lo spiega in tre frasi e si offre di approfondire.',
          '<strong>Il giorno dopo.</strong> Sabato ti brucia ancora. BETina ricorda che la settimana scorsa eri preoccupato per il centrocampo e riprende il discorso proprio da lì.',
          '<strong>Lo sport nuovo.</strong> Un amico ti trascina a una finale di tennis o a una serata di NFL. Chiedi a BETina di spiegarti il punteggio con parole semplici e al primo break starai già seguendo la partita.',
        ],
        msgs: [
          ['me', 'Perché hanno annullato quel gol? A me sembrava in linea.'],
          ['b', 'In linea va bene, ma al momento del passaggio la sua spalla era oltre l’ultimo difensore. Le spalle contano, le braccia no.'],
          ['me', 'Così poco?'],
          ['b', 'Qualche centimetro. Fa male, lo so. Vuoi la versione da 20 secondi su come si traccia la linea?'],
        ],
        note: 'Esempio illustrativo. BETina è un’IA e può sbagliare.',
      },
      {
        type: 'shot', flip: true, kicker: 'Voce', h2: 'Chiama BETina:', h2b: 'parla di sport a voce con l’IA.', img: 'screen-call',
        alt: 'App BETina: chiamata vocale con BETina',
        paras: [
          'A volte non hai voglia di scrivere. Nell’app puoi <strong>chiamare BETina e parlare di sport a voce</strong>, a mani libere, mentre vai allo stadio o con la partita in sottofondo. Lei ascolta, risponde ad alta voce e ti segue anche quando la interrompi, proprio come in una telefonata.',
          'In chiamata sa le stesse cose che sa in chat: le tue squadre, le vostre conversazioni precedenti e i risultati di calcio in diretta. Le chiamate vocali sono incluse gratis, con una quota giornaliera di conversazione.',
        ],
      },
      {
        type: 'prose', kicker: 'Memoria', h2: 'Ricorda le tue squadre', h2b: 'e la vostra ultima chat.',
        paras: [
          'Una conversazione riesce meglio se non devi ripartire ogni volta da zero. BETina tiene a mente quali squadre e quali sport segui e quello che le hai raccontato, così la settimana dopo può chiederti com’è stato il derby o se il ginocchio è sopravvissuto al calcetto.',
          'Su questa memoria decidi tu. Puoi chiedere che vengano cancellati la cronologia della chat o le cose che BETina ha ricordato di te, ed eliminando l’account sparisce tutto del tutto. I dettagli sono nella <a href="/delete-account">pagina su account e dati</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Lingue', h2: 'Una compagna sportiva,', h2b: 'nove lingue.',
        intro: 'BETina risponde nella lingua in cui scrivi o parli, e cambia quando cambi tu. Per questo è una chat sportiva IA adatta a chi segue un campionato in una lingua e vive in un’altra.',
        items: [
          '<strong>Italiano</strong>', '<strong>Inglese</strong> (English)', '<strong>Tedesco</strong> (Deutsch)', '<strong>Spagnolo</strong> (Español)', '<strong>Francese</strong> (Français)',
          '<strong>Portoghese</strong> (Português)', '<strong>Rumeno</strong> (Română)', '<strong>Turco</strong> (Türkçe)', '<strong>Croato</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'Parliamoci chiaro', h2: 'Che cosa BETina', h2b: 'non è.',
        paras: [
          '<strong>BETina è un’IA, non una persona vera.</strong> Ha una personalità e delle opinioni, ma le genera un software, e come ogni IA può sbagliare i fatti. Prendi quello che dice sullo sport come un punto di vista su cui discutere, non come una fonte verificata.',
          'E non è nemmeno una consulente. BETina è un’app di intrattenimento per adulti (18+), e nell’app non c’è denaro in nessun punto. Il suo parere su una partita è una chiacchierata, niente di più.',
        ],
      },
      {
        type: 'steps', kicker: 'Per cominciare', h2: 'Come iniziare', h2b: 'a chattare.',
        items: [
          { t: 'Scarica BETina', p: 'Scarica l’app gratuita da App Store o Google Play, oppure apri la web app nel browser.' },
          { t: 'Accedi e scegli le tue squadre', p: 'Accedi con Apple, Google, email o telefono e scegli le squadre e gli sport che ti interessano.' },
          { t: 'Dille ciao', p: 'Scrivi il primo messaggio o tocca il microfono per chiamarla. Se non sai da dove cominciare, chiedile della partita di stasera.' },
        ],
      },
    ],
    faqH2: 'Domande sulla', faqH2b: 'chat sportiva IA.',
    faq: [
      ['Si può davvero parlare di calcio e di sport con un’IA?', 'Sì. BETina è una compagna IA pensata per lo sport. Puoi scriverle in chat oppure chiamarla e parlare di partite, squadre, regole e storia dello sport.'],
      ['La chat sportiva IA è gratis?', 'Sì. Chattare con BETina è gratis su iPhone, Android e web. Le chiamate vocali sono incluse, con una quota giornaliera di conversazione.'],
      ['Ci sono di mezzo soldi veri?', 'No. BETina è un’app di intrattenimento. Nell’app non si punta e non si incassa denaro, in nessun punto.'],
      ['Di quali sport posso parlare con BETina?', 'Di calcio, tennis, NFL, MMA, cricket e molti altri. I risultati in diretta nell’app sono disponibili per il calcio.'],
      ['BETina ricorda la mia squadra del cuore e le chat precedenti?', 'Sì. Tiene a mente le tue squadre del cuore e le cose che le hai raccontato, e ci torna sopra. Puoi far cancellare questi dati in qualsiasi momento.'],
      ['Come funzionano le chiamate vocali con BETina?', 'Tocca il microfono nella chat per avviare una chiamata. Tu parli, BETina risponde ad alta voce e puoi interromperla come in una normale telefonata.'],
      ['Quali lingue parla BETina?', 'Italiano, inglese, tedesco, spagnolo, francese, portoghese, rumeno, turco e croato. Risponde nella lingua che usi tu.'],
      ['BETina è una persona vera? Le sue risposte sono sempre giuste?', 'No e no. BETina è un’IA con una personalità tutta sua. Può sbagliare, quindi verifica le cose importanti su una fonte ufficiale.'],
    ],
    alsoH2: 'Nell’app', alsoH2b: 'c’è dell’altro.',
    homeTeaser: 'Tutto quello che BETina sa fare, in una pagina.',
    ctaH2: 'Qualcuno con cui parlare', ctaH2b: 'di sport. Sempre.',
    ctaText: 'Scarica BETina e comincia la conversazione. Un’opinione sulla tua squadra ce l’ha già.',
  },
};
