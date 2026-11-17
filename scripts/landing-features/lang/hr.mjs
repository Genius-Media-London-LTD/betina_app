// Croatian (hr) localization of the three feature pages. Informal "ti".
export default {
  local: { home: 'Početna', more: 'Više od BETine', faq: 'Pitanja i odgovori', now: 'sada' },
  home: {
    moreChat: 'Više o AI sportskom chatu →',
    moreLive: 'Više o rezultatima uživo →',
    moreGame: 'Više o igri prognoza →',
  },

  game: {
    path: '/hr/igra-prognoza',
    nav: 'Igra prognoza',
    teaser: 'Pogađaj nogometne rezultate, skupljaj bodove i pobijedi prijatelje. Bez novca.',
    more: 'Više o igri prognoza',
    crumb: 'Igra prognoza',
    title: 'Igra prognoza: nogometni rezultati, besplatno | BETina',
    desc: 'Besplatna igra prognoza: pogađaj nogometne rezultate, skupljaj bodove i prestigni prijatelje na ljestvici. Bez novca, uz AI družicu koja igra s tobom.',
    sticker: 'Samo iz zabave · Bez novca',
    h1: 'Igra prognoza:',
    h1b: 'pogađaj nogometne rezultate, besplatno i bez novca.',
    lead: 'Upiši rezultat prije početka utakmice, skupljaj bodove kad pogodiš i prestigni prijatelje na ljestvici. BETinina igra prognoza je besplatna, nema uloga ni isplata, a uz nju dolazi i AI družica koja i sama prognozira svaku utakmicu.',
    badge: '3 · 2 · 1',
    shotAlt: 'Aplikacija BETina: igra prognoza nogometnih rezultata s ljestvicom',
    facts: [
      ['3·2·1', 'Bodovi za točan rezultat, gol-razliku i pobjednika'],
      ['5', 'Natjecanja, od Bundeslige do Lige prvaka'],
      ['0 €', 'Bez uloga, bez nagrada, bez isplata'],
      ['9', 'Jezika na kojima možeš igrati'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Ukratko', h2: 'Što je BETinina', h2b: 'igra prognoza?',
        paras: [
          '<strong>BETinina igra prognoza je besplatna igra pogađanja nogometnih rezultata u aplikaciji BETina.</strong> Prije početka utakmice upišeš rezultat koji očekuješ. Nakon posljednjeg zvižduka aplikacija usporedi tvoju prognozu sa stvarnim rezultatom i dodijeli bodove. Ti bodovi određuju tvoje mjesto na ljestvici, ukupnoj i u privatnim grupama koje složiš s prijateljima.',
          'To je igra koja se desetljećima igra po uredima i grupnim chatovima, samo bez tablice u Excelu i bez novca. Novo je to s kim igraš: BETina, AI sportska družica iz aplikacije, također prognozira svaku utakmicu, vodi igru i rado će se s tobom prepirati oko tvojih 3:1.',
        ],
      },
      {
        type: 'steps', kicker: 'Kako radi', h2: 'Igra prognoza', h2b: 'u tri koraka.',
        items: [
          { t: 'Prognoziraj rezultat', p: 'Otvori popis utakmica, odaberi susret i upiši rezultat koji očekuješ, na primjer 2:1. Prognozu možeš mijenjati koliko god puta želiš, sve do početka utakmice.' },
          { t: 'Prati utakmicu', p: 'S prvim zviždukom prognoze se zaključavaju i postaju vidljive, pa nitko ne može prepisivati. Ako utakmicu pratiš u BETina Liveu, tvoja prognoza stoji odmah uz rezultat uživo.' },
          { t: 'Pokupi bodove', p: 'Nakon posljednjeg zvižduka bodovi ti se automatski zbrajaju, a ljestvica se osvježava. Push obavijest javi ti kako je prošlo tvoje kolo.' },
        ],
      },
      {
        type: 'cards', kicker: 'Bodovanje', h2: 'Kako se', h2b: 'dijele bodovi.',
        intro: 'Jedna prognoza, tri načina da osvojiš bodove. Računa se rezultat nakon 90 minuta i sudačke nadoknade.',
        items: [
          { big: '3', unit: 'boda', t: 'Točan rezultat', p: 'Rezultat pogođen u gol. Najbolji osjećaj u cijeloj igri.', eg: 'Prognoza 2:1 · Rezultat 2:1' },
          { big: '2', unit: 'boda', t: 'Točna gol-razlika', p: 'Pobjednik i razlika su pogođeni, ali točan rezultat nije. Ovamo spada i neriješeno s drugačijim rezultatom.', eg: 'Prognoza 2:1 · Rezultat 3:2' },
          { big: '1', unit: 'bod', t: 'Točan pobjednik', p: 'Pobjednik je pogođen, ali razlika je bila drugačija.', eg: 'Prognoza 2:1 · Rezultat 3:0' },
        ],
        after: [
          'Promašena prognoza ne donosi ništa i ne košta ništa. Uz prognoze utakmica postoje i <strong>dodatna pitanja</strong> za dodatne bodove. Svaki osvojeni bod donosi ti i XP za tvoj level u aplikaciji.',
        ],
      },
      {
        type: 'shot', kicker: 'S prijateljima', h2: 'Igraj s prijateljima i', h2b: 'penji se na ljestvici.', img: 'screen-predictor',
        alt: 'Aplikacija BETina: grupa prognoza s prijateljima i poretkom',
        paras: [
          'Pogađanje nogometnih rezultata najbolje je s ljudima koje poznaješ. U BETini napraviš <strong>privatnu grupu</strong>, pozoveš prijatelje, obitelj ili kolege i dobijete vlastiti poredak, odvojen od ukupne ljestvice. Tko je u ponedjeljak ujutro na vrhu, taj ima glavnu riječ.',
          'Poredak pokazuje tko se u zadnjem kolu popeo, a tko je pao, dok tvoja osobna statistika otkriva koliko često pogađaš točan rezultat. Tu je i timski izazov: nakon svakog kola prosjek vaše grupe uspoređuje se s BETininim bodovima. Pobijedite je zajedno.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'U čemu je razlika', h2: 'AI družica koja igra s tobom', h2b: 'i priča s tobom o nogometu.',
        label: 'Primjer razgovora o prognozi',
        paras: [
          'Svaka druga igra prognoza je obrazac i tablica. U BETini igra ima domaćicu. <strong>BETina sama prognozira svaku utakmicu.</strong> Njezine prognoze skrivene su do početka utakmice, baš kao i svačije druge, a ona se pojavljuje na svakoj ljestvici, pa uvijek imaš koga pobijediti.',
          'A o svemu tome možeš s njom i razgovarati. Reci joj zašto vidiš gostujuću pobjedu, pitaj je što misli o formi neke momčadi ili je pusti da te malo bocka zbog prošlog vikenda. Odgovara na tvom jeziku, porukom ili u glasovnom pozivu. Njezin pogled je mišljenje, a ne savjet, i promaši dovoljno često da ostane zanimljivo.',
        ],
        msgs: [
          ['me', 'Idem na 3:1 za subotu. Prehrabro?'],
          ['b', 'Hrabro, da. Tri gola kod kuće nisu zabili još od jeseni. Ali sviđa mi se to samopouzdanje.'],
          ['me', 'A što si ti prognozirala?'],
          ['b', 'Dobar pokušaj. Moju prognozu vidiš kad utakmica počne, kao i svi ostali. 😌'],
        ],
        note: 'Primjer služi kao ilustracija. BETina je AI i može pogriješiti.',
      },
      {
        type: 'prose', kicker: 'Načelo', h2: 'Bez novca, bez uloga:', h2b: 'samo bodovi i slava.',
        paras: [
          'BETinina igra prognoza igra se iz zabave. <strong>Ništa ne ulažeš, ništa ne kupuješ i ništa se ne isplaćuje.</strong> Nema novčanih nagrada ni kotizacije, i aplikacija te ni u jednom trenutku neće tražiti karticu. Osvajaš bodove, XP, mjesto na ljestvici i pravo da na to podsjećaš prijatelje.',
          'To je namjerno tako. BETina je aplikacija za zabavu namijenjena odraslima, a igra postoji zato da kolo bude zanimljivije, igrao tvoj klub ili ne.',
        ],
      },
      {
        type: 'table', kicker: 'Natjecanja', h2: 'Natjecanja koja', h2b: 'možeš prognozirati.',
        intro: 'Igra prognoza pokriva pet najvećih natjecanja europskog klupskog nogometa, kolo po kolo.',
        cols: ['Natjecanje', 'Zemlja', 'Što prognoziraš'], hl: 0,
        rows: [
          ['Bundesliga', 'Njemačka', 'Svaku utakmicu svakog kola'],
          ['Premier League', 'Engleska', 'Svaku utakmicu svakog kola'],
          ['LaLiga', 'Španjolska', 'Svaku utakmicu svakog kola'],
          ['Serie A', 'Italija', 'Svaku utakmicu svakog kola'],
          ['Liga prvaka', 'Europa', 'Ligašku fazu i nokaut-fazu'],
        ],
        after: ['Sam biraš koja natjecanja želiš igrati. Bodovi iz svih natjecanja računaju se za ukupnu ljestvicu.'],
      },
    ],
    faqH2: 'Česta pitanja', faqH2b: 'o igri prognoza.',
    faq: [
      ['Je li BETinina igra prognoza besplatna?', 'Da. Igra je dio besplatne aplikacije BETina za iPhone, Android i web. Nema kotizacije ni pretplate.'],
      ['Igra li se za pravi novac i mogu li osvojiti nagrade?', 'Ne. Ništa ne ulažeš i ništa se ne isplaćuje. Nema novčanih ni materijalnih nagrada. Igraš za bodove, XP i mjesto na ljestvici.'],
      ['Kako se boduje?', 'Tri boda za točan rezultat, dva za točnog pobjednika s točnom gol-razlikom, jedan za točnog pobjednika. Računa se rezultat nakon 90 minuta i sudačke nadoknade.'],
      ['Koje lige i natjecanja mogu prognozirati?', 'Bundesligu, Premier League, LaLigu, Serie A i Ligu prvaka.'],
      ['Mogu li igru prognoza igrati s prijateljima?', 'Da. U aplikaciji napravi privatnu grupu i pozovi prijatelje. Uz ukupnu ljestvicu dobivate i vlastiti poredak.'],
      ['Do kada mogu upisati prognozu i mogu li je promijeniti?', 'Prognozu možeš upisati i mijenjati sve do početka utakmice. S prvim zviždukom se zaključava i tek tada je vide ostali.'],
      ['Po čemu se BETina razlikuje od drugih aplikacija za prognoziranje nogometa?', 'Igraš uz AI družicu. BETina sama prognozira svaku utakmicu, pojavljuje se na svakoj ljestvici i razgovara s tobom o tvojim prognozama, na devet jezika.'],
      ['Postoji li igra prognoza za iPhone, Android i web?', 'Da. Igraš u aplikaciji za iPhone, u aplikaciji za Android i u web aplikaciji u pregledniku, svugdje s istim računom.'],
    ],
    alsoH2: 'U aplikaciji ima', alsoH2b: 'još toga.',
    homeTeaser: 'Sve što BETina zna i može, na jednoj stranici.',
    ctaH2: 'Misliš da znaš', ctaH2b: 'nogomet? Dokaži.',
    ctaText: 'Preuzmi BETinu, prognoziraj svoje prvo kolo i pogledaj gdje ćeš završiti na ljestvici.',
  },

  live: {
    path: '/hr/rezultati-uzivo',
    nav: 'Rezultati uživo',
    teaser: 'Nogometni rezultati uživo za tvoje klubove i obavijest čim padne gol.',
    more: 'Više o BETina Liveu',
    crumb: 'Rezultati uživo',
    title: 'Rezultati uživo: nogomet i obavijesti o golovima | BETina',
    desc: 'Nogometni rezultati uživo za tvoje klubove i push obavijest za svaki gol. Pitaj AI o utakmici. Besplatno na iPhoneu, Androidu i webu.',
    sticker: 'BETina Live · Nogomet',
    h1: 'Nogometni rezultati uživo',
    h1b: 'i obavijesti o golovima tvojih klubova.',
    lead: 'BETina Live prikazuje nogometne rezultate koji su ti važni i šalje ti push na mobitel čim tvoj klub zabije. A kad želiš znati što se događa na utakmici, jednostavno pitaš BETinu.',
    badge: '● Uživo',
    push: 'GOL! 1:0 u 34. minuti.',
    shotAlt: 'Aplikacija BETina: nogometni rezultati uživo s obavijestima o golovima klubova koje pratiš',
    facts: [
      ['0 €', 'Besplatno u aplikaciji, bez pretplate'],
      ['5', 'Trenutaka utakmice za koje dobivaš push'],
      ['9', 'Jezika na kojima BETina priča o nogometu'],
      ['18+', 'Za odrasle, bez ikakvog novca'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Ukratko', h2: 'Što je', h2b: 'BETina Live?',
        paras: [
          '<strong>BETina Live je dio aplikacije BETina za nogometne rezultate uživo.</strong> Prikazuje utakmice koje se upravo igraju, osvježava rezultat dok se lopta kotrlja i na vrh stavlja klubove koje pratiš. Aplikacija ne mora biti otvorena: kad se nešto dogodi na utakmici do koje ti je stalo, javi ti obavijest.',
          'Većina aplikacija za rezultate tu staje. BETina Live dio je AI sportske družice, pa je rezultat tek početak razgovora. BETinu možeš pitati tko je zabio, kako sad izgleda tablica ili što misli o prvom poluvremenu, u chatu ili u glasovnom pozivu. Rezultati uživo dostupni su za nogomet, a o drugim sportovima razgovaraš u <a href="/hr/ai-sportski-chat">AI sportskom chatu</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Obavijesti o golovima', h2: 'Push čim', h2b: 'tvoj klub zabije.',
        label: 'Primjeri obavijesti iz BETina Livea',
        paras: [
          'Obavijesti o golovima razlog su zbog kojeg većina ljudi uopće instalira aplikaciju za nogometne rezultate, i one su srce BETina Livea. Zaprati klub i dobit ćeš push obavijest kad na njegovoj utakmici padne gol, s novim rezultatom i minutom.',
          'Obavijesti stižu samo za <strong>klubove i utakmice koje sam odabereš</strong>. Nikome ne treba pedeset obavijesti iz liga koje ne gleda. Osim golova, BETina Live javlja i ostale trenutke koji mijenjaju utakmicu: početak, crvene kartone, poluvrijeme i kraj.',
          'Obavijesti o golovima stižu na iPhone i Android. U postavkama ih u svakom trenutku možeš ponovno isključiti.',
        ],
        items: [
          ['19:30', 'Počelo je! Tvoj klub je na terenu.'],
          ['34′', 'GOL! 1:0 u 34. minuti.'],
          ['45′', 'Poluvrijeme: 1:0. Solidno prvo poluvrijeme.'],
          ['67′', 'Crveni karton za goste.'],
          ['90′', 'Kraj: 2:0. Tri boda!'],
        ],
      },
      {
        type: 'steps', kicker: 'Postavljanje', h2: 'Kako uključiti obavijesti o golovima', h2b: 'za svoj klub.',
        intro: 'Traje otprilike minutu, a radiš to samo jednom.',
        items: [
          { t: 'Preuzmi BETinu', p: 'Besplatno preuzmi aplikaciju iz App Storea ili s Google Playa i prijavi se Appleom, Googleom, e-mailom ili brojem mobitela.' },
          { t: 'Odaberi klubove', p: 'Na početku odaberi omiljeni klub. Još klubova, ili samo jednu utakmicu, možeš zapratiti u kartici Live.' },
          { t: 'Dopusti obavijesti', p: 'Kad te mobitel pita smije li ti BETina slati obavijesti, reci da. Bez toga do tebe ne može stići nijedna obavijest o golu.' },
          { t: 'Gledaj ili ne gledaj', p: 'Odloži mobitel. Kad tvoj klub sljedeći put zabije, znat ćeš to još u istoj minuti utakmice, gdje god bio.' },
        ],
      },
      {
        type: 'chat', kicker: 'U čemu je razlika', h2: 'Pitaj o utakmici:', h2b: 'rezultati uživo uz AI družicu.',
        label: 'Primjer razgovora o utakmici koja traje',
        paras: [
          'Rezultat ti kaže što se dogodilo. Ne kaže ti zašto, i svejedno mu je. BETina može oboje. Pred sobom ima podatke uživo s utakmice, pa je možeš pitati ono što bi pitao prijateljicu koja upravo gleda: tko je zabio, je li vodstvo zasluženo, što rezultat znači za tablicu.',
          'Na stranici svake utakmice stoji i <strong>BETinin pogled</strong>, kratko čitanje utakmice njezinim riječima, uz tablicu i međusobne susrete dviju momčadi. A budući da BETina govori devet jezika, navijač u Zagrebu dobiva na hrvatskom istu utakmicu koju navijač u Madridu dobiva na španjolskom.',
        ],
        msgs: [
          ['me', 'Koliko je kod nas?'],
          ['b', '1:0 za vas od 34. minute. Glavom nakon kornera, i iskreno, visjelo je u zraku.'],
          ['me', 'Gdje smo s tim na tablici?'],
          ['b', 'Ostane li ovako, skačete na četvrto mjesto. Još dva takva kola i počet ću vjerovati.'],
        ],
        note: 'Primjer služi kao ilustracija. BETina je AI i može pogriješiti.',
      },
      {
        type: 'cards', kicker: 'Na stranici svake utakmice', h2: 'Više od', h2b: 'pukog broja.',
        items: [
          { t: 'Rezultat uživo i tijek utakmice', p: 'Trenutačni rezultat, minuta i ključni događaji utakmice, redom kojim su se dogodili.' },
          { t: 'Tablica i međusobni susreti', p: 'Tablica lige na prvi pogled i kako su dvije momčadi prošle u ranijim međusobnim susretima.' },
          { t: 'Tvoja prognoza odmah uz to', p: 'Ako igraš besplatnu <a href="/hr/igra-prognoza" style="color:var(--lime);text-decoration:underline">igru prognoza</a>, rezultat koji očekuješ stoji odmah uz rezultat uživo.' },
        ],
      },
      {
        type: 'prose', kicker: 'Dobro je znati', h2: 'Besplatno na iPhoneu, Androidu', h2b: 'i webu.',
        paras: [
          'BETina Live dio je besplatne aplikacije BETina. Nema plaćene razine za rezultate ni pretplate za obavijesti o golovima. Aplikaciju ćeš naći u App Storeu i na Google Playu, a web aplikaciju možeš otvoriti u pregledniku kad rezultate želiš provjeriti na laptopu.',
          'BETina je aplikacija za zabavu namijenjena odraslima. <strong>Nigdje u aplikaciji nema novca</strong>: nema se što uložiti i nema se što isplatiti. Izradio ju je GeniusBet, a njome upravlja Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'česta pitanja.',
    faq: [
      ['Je li BETina Live besplatan?', 'Da. Rezultati uživo i obavijesti o golovima dio su besplatne aplikacije BETina za iPhone, Android i web. Pretplate nema.'],
      ['Kako dobiti obavijest kad moj klub zabije gol?', 'Instaliraj BETinu, odaberi svoj klub i dopusti obavijesti. Od tada dobivaš push svaki put kad padne gol na utakmici kluba koji pratiš.'],
      ['Mogu li dobivati obavijesti o golovima samo za jedan klub?', 'Da. Obavijesti stižu samo za klubove i pojedine utakmice koje pratiš, pa je dovoljan i jedan klub. Klubove možeš dodavati i uklanjati kad god želiš.'],
      ['Za koje sportove postoje rezultati uživo?', 'Rezultati uživo i obavijesti o golovima dostupni su za nogomet. S BETinom možeš razgovarati i o mnogim drugim sportovima, poput tenisa, NFL-a, MMA-a ili kriketa.'],
      ['Za što još dobivam push osim za golove?', 'Za početak utakmice, crvene kartone, poluvrijeme i konačni rezultat utakmica koje pratiš.'],
      ['Što mogu pitati AI o utakmici?', 'Sve što bi pitao prijateljicu koja upravo gleda: rezultat, tko je zabio, kako izgleda tablica ili što misli o utakmici. BETina je AI i može pogriješiti, pa njezin pogled uzmi kao mišljenje.'],
      ['Radi li se o pravom novcu?', 'Ne. BETina je aplikacija za zabavu. Nigdje u aplikaciji novac se ne ulaže niti isplaćuje.'],
    ],
    alsoH2: 'U aplikaciji ima', alsoH2b: 'još toga.',
    homeTeaser: 'Sve što BETina zna i može, na jednoj stranici.',
    ctaH2: 'Više nikad ne propusti', ctaH2b: 'nijedan gol.',
    ctaText: 'Preuzmi BETinu, zaprati svoj klub i pusti da golovi sami dođu do tebe.',
  },

  chat: {
    path: '/hr/ai-sportski-chat',
    nav: 'AI sportski chat',
    teaser: 'Piši AI družici ili je nazovi. Zna tvoje timove i pamti vaše razgovore.',
    more: 'Više o AI sportskom chatu',
    crumb: 'AI sportski chat',
    title: 'AI sportski chat: pričaj o nogometu i sportu | BETina',
    desc: 'AI sportski chat s BETinom: piši joj ili je nazovi. Zna tvoje timove, pamti vaše razgovore i govori 9 jezika. Besplatno, bez novca.',
    sticker: 'Chat · Poziv · 9 jezika',
    h1: 'AI sportski chat:',
    h1b: 'pričaj s BETinom o nogometu i sportu, porukom ili glasom.',
    lead: 'BETina je AI družica s kojom o sportu pričaš kao s prijateljicom koja gleda baš sve. Piši joj ili je nazovi. Zna tvoje timove, sjeća se što si rekao prošli tjedan i odgovara na tvom jeziku.',
    badge: '● Sada online',
    shotAlt: 'Aplikacija BETina: AI sportski chat s BETinom',
    facts: [
      ['24/7', 'Tu je kad god ti se priča o sportu'],
      ['9', 'Jezika, a mijenja ga kad i ti'],
      ['11+', 'Sportova, od nogometa do kriketa'],
      ['0 €', 'Chat je besplatan, bez ikakvog novca'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Ukratko', h2: 'Što je BETinin', h2b: 'AI sportski chat?',
        paras: [
          '<strong>BETinin AI sportski chat je razgovor s AI družicom koja živi za sport.</strong> To je srce aplikacije BETina. Postaviš pitanje ili jednostavno kažeš što ti je na duši nakon utakmice, a BETina odgovori kao netko tko ima svoje mišljenje: kratko, izravno i tonom nekoga tko je stvarno gledao.',
          'Većina sportskih AI chatbotova su alati za pitanja i odgovore, vezani uz jednu ligu ili jednu televiziju. BETina je jedna osobnost za sve sportove. Zna za koje timove navijaš, spomene ono što si joj ranije ispričao, a možeš je i nazvati kad ti je tipkanje presporo. U istom chatu s umjetnom inteligencijom možeš razgovarati o nogometu, tenisu ili NFL-u.',
        ],
      },
      {
        type: 'cards', kicker: 'Teme', h2: 'Pričaj s AI-jem o nogometu', h2b: 'i o svakom drugom sportu.',
        items: [
          { t: 'Tvoji timovi i tvoje kolo', p: 'Sastavi, forma, ona zamjena koju nitko nije shvatio. BETina zna tvoje omiljene timove i pri ruci ima nogometne rezultate uživo, pa ste na istoj valnoj duljini.' },
          { t: 'Pravila, povijest i rasprave', p: 'Zašto je to bio zaleđe? Tko je bio bolja desetka? Zatraži kratko objašnjenje ili zapodjeni raspravu o najboljoj momčadi svih vremena.' },
          { t: 'Svaki sport, a ne samo jedna liga', p: 'Nogomet, tenis, NFL, MMA, kriket i još mnogo toga. Nauči novi sport od nule ili zaroni duboko u onaj koji pratiš već dvadeset godina.' },
        ],
      },
      {
        type: 'chat', kicker: 'Primjeri', h2: 'Tri razgovora', h2b: 's BETinom.',
        label: 'Primjer razgovora: objašnjenje pravila',
        paras: [
          '<strong>Objašnjenje pravila.</strong> Gol je poništen i zanima te zašto, ali bez čitanja pravilnika. BETina to objasni u tri rečenice i ponudi da ode dublje.',
          '<strong>Jutro poslije.</strong> Još te ljuti subota. BETina se sjeća da te prošli tjedan brinuo vezni red i razgovor nastavi točno od tamo.',
          '<strong>Novi sport.</strong> Prijatelji te odvuku na finale teniskog turnira ili na NFL večer. Zamoli BETinu da ti jednostavnim riječima objasni bodovanje i već ćeš u prvom setu znati što se događa.',
        ],
        msgs: [
          ['me', 'Zašto je taj gol poništen? Meni je bio u liniji.'],
          ['b', 'U liniji bi bilo u redu, ali rame mu je u trenutku dodavanja bilo ispred zadnjeg braniča. Ramena se računaju, ruke ne.'],
          ['me', 'Baš toliko tijesno?'],
          ['b', 'Par centimetara. Boli, znam. Hoćeš verziju od 20 sekundi o tome kako se povlači linija?'],
        ],
        note: 'Primjer služi kao ilustracija. BETina je AI i može pogriješiti.',
      },
      {
        type: 'shot', flip: true, kicker: 'Glas', h2: 'Nazovi BETinu:', h2b: 'glasovni razgovor s AI-jem o sportu.', img: 'screen-call',
        alt: 'Aplikacija BETina: glasovni poziv s BETinom',
        paras: [
          'Nekad ti se jednostavno ne tipka. U aplikaciji možeš <strong>nazvati BETinu i o sportu pričati glasom</strong>, bez ruku, na putu prema stadionu ili dok utakmica ide u pozadini. Sluša te, odgovara naglas i snalazi se kad joj upadneš u riječ, baš kao u telefonskom razgovoru.',
          'U pozivu zna isto što i u chatu: tvoje timove, vaše ranije razgovore i nogometne rezultate uživo. Glasovni pozivi uključeni su besplatno, uz dnevnu kvotu za pozive.',
        ],
      },
      {
        type: 'prose', kicker: 'Pamćenje', h2: 'Pamti tvoje timove', h2b: 'i vaš zadnji razgovor.',
        paras: [
          'Razgovor je bolji kad ne moraš svaki put kretati od nule. BETina ima na umu koje timove i sportove pratiš i što si joj ispričao, pa te sljedeći tjedan može pitati kakav je bio osjećaj nakon derbija ili je li ti koljeno preživjelo mali nogomet.',
          'To pamćenje ostaje pod tvojom kontrolom. Možeš zatražiti brisanje povijesti chata ili onoga što je BETina zapamtila o tebi, a brisanjem računa sve se uklanja u potpunosti. Pojedinosti su na <a href="/delete-account">stranici o računu i podacima</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Jezici', h2: 'Jedna družica,', h2b: 'devet jezika.',
        intro: 'BETina odgovara na jeziku na kojem joj pišeš ili govoriš i mijenja ga kad i ti. Zato je to AI sportski chat za sve koji ligu prate na jednom jeziku, a žive na drugom.',
        items: [
          '<strong>Hrvatski</strong>', '<strong>Engleski</strong> (English)', '<strong>Njemački</strong> (Deutsch)', '<strong>Španjolski</strong> (Español)', '<strong>Francuski</strong> (Français)',
          '<strong>Portugalski</strong> (Português)', '<strong>Talijanski</strong> (Italiano)', '<strong>Rumunjski</strong> (Română)', '<strong>Turski</strong> (Türkçe)',
        ],
      },
      {
        type: 'prose', kicker: 'Otvoreno rečeno', h2: 'Što BETina', h2b: 'nije.',
        paras: [
          '<strong>BETina je AI, a ne stvarna osoba.</strong> Ima osobnost i mišljenja, ali njih stvara softver, i kao svaka umjetna inteligencija može pogriješiti u činjenicama. Ono što kaže o sportu uzmi kao stav s kojim se možeš prepirati, a ne kao provjeren izvor.',
          'Nije ni savjetnica. BETina je aplikacija za zabavu namijenjena odraslima (18+) i nigdje u aplikaciji nema novca. Njezin pogled na utakmicu je razgovor i ništa više.',
        ],
      },
      {
        type: 'steps', kicker: 'Kreni', h2: 'Kako započeti', h2b: 'chat.',
        items: [
          { t: 'Preuzmi BETinu', p: 'Preuzmi besplatnu aplikaciju iz App Storea ili s Google Playa ili otvori web aplikaciju u pregledniku.' },
          { t: 'Prijavi se i odaberi timove', p: 'Prijavi se Appleom, Googleom, e-mailom ili mobitelom i odaberi timove i sportove do kojih ti je stalo.' },
          { t: 'Reci bok', p: 'Napiši prvu poruku ili dodirni mikrofon da je nazoveš. Ako ne znaš odakle krenuti, pitaj je za večerašnju utakmicu.' },
        ],
      },
    ],
    faqH2: 'Pitanja o', faqH2b: 'AI sportskom chatu.',
    faq: [
      ['Mogu li stvarno razgovarati s AI-jem o sportu?', 'Da. BETina je AI družica stvorena za sport. Možeš joj pisati ili je nazvati i razgovarati o utakmicama, timovima, pravilima i povijesti sporta.'],
      ['Je li AI sportski chat besplatan?', 'Da. Chat s BETinom besplatan je na iPhoneu, Androidu i webu. Glasovni pozivi uključeni su uz dnevnu kvotu za pozive.'],
      ['Radi li se o pravom novcu?', 'Ne. BETina je aplikacija za zabavu. Nigdje u aplikaciji novac se ne ulaže niti isplaćuje.'],
      ['O kojim sportovima mogu razgovarati s BETinom?', 'O nogometu, tenisu, NFL-u, MMA-u, kriketu i mnogim drugima. Rezultati uživo u aplikaciji dostupni su za nogomet.'],
      ['Može li BETina zapamtiti moj omiljeni tim i ranije razgovore?', 'Da. Pamti tvoje omiljene timove i ono što si joj ispričao te se na to vraća. Brisanje tih podataka možeš zatražiti u svakom trenutku.'],
      ['Kako funkcioniraju glasovni pozivi s BETinom?', 'Dodirni mikrofon u chatu da pokreneš poziv. Ti govoriš, BETina odgovara naglas, a možeš joj i upasti u riječ kao u običnom telefonskom razgovoru.'],
      ['Koje jezike BETina govori?', 'Hrvatski, engleski, njemački, španjolski, francuski, portugalski, talijanski, rumunjski i turski. Odgovara na jeziku kojim se služiš.'],
      ['Je li BETina stvarna osoba? Jesu li njezini odgovori uvijek točni?', 'Ne i ne. BETina je AI s vlastitom osobnošću. Može pogriješiti, pa sve važno provjeri u službenom izvoru.'],
    ],
    alsoH2: 'U aplikaciji ima', alsoH2b: 'još toga.',
    homeTeaser: 'Sve što BETina zna i može, na jednoj stranici.',
    ctaH2: 'Netko s kim možeš pričati', ctaH2b: 'o sportu. Uvijek.',
    ctaText: 'Preuzmi BETinu i započni razgovor. Mišljenje o tvom timu već ima.',
  },
};
