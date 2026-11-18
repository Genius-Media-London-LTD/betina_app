// Romanian feature pages: prediction game, live scores, AI sports chat.
export default {
  local: { home: 'Pagina principală', more: 'Mai multe de la BETina', faq: 'Întrebări și răspunsuri', now: 'acum' },
  home: {
    moreChat: 'Mai multe despre chatul sportiv AI →',
    moreLive: 'Mai multe despre scorurile live →',
    moreGame: 'Mai multe despre jocul de pronosticuri →',
  },

  game: {
    path: '/ro/joc-pronosticuri-fotbal',
    nav: 'Joc de pronosticuri',
    teaser: 'Ghicește scorurile la fotbal, adună puncte și bate-ți prietenii. Fără niciun ban.',
    more: 'Despre jocul de pronosticuri',
    crumb: 'Joc de pronosticuri',
    title: 'Joc de pronosticuri fotbal: gratuit, cu prietenii | BETina',
    desc: 'Joc de pronosticuri la fotbal, gratuit: ghicești scoruri, aduni puncte și urci în clasament cu prietenii. Fără bani, cu o parteneră AI care joacă și ea.',
    sticker: 'Doar pentru distracție · Fără bani',
    h1: 'Joc de pronosticuri la fotbal:',
    h1b: 'gratuit, cu prietenii, fără bani.',
    lead: 'Spui scorul înainte de fluierul de start, aduni puncte când ai dreptate și urci în clasament peste prietenii tăi. Jocul de pronosticuri BETina este gratuit, nu are nici mize, nici plăți și vine cu o parteneră AI care dă și ea pronostic la fiecare meci.',
    badge: '3 · 2 · 1',
    shotAlt: 'Aplicația BETina: joc de pronosticuri la fotbal cu clasament',
    facts: [
      ['3·2·1', 'Puncte pentru scor exact, diferență de goluri, câștigător'],
      ['5', 'Competiții, de la Bundesliga la Champions League'],
      ['0 €', 'Fără mize, fără premii, fără plăți'],
      ['9', 'Limbi în care poți juca'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Pe scurt', h2: 'Ce este jocul de pronosticuri', h2b: 'BETina?',
        paras: [
          '<strong>Jocul de pronosticuri BETina este un joc gratuit de pronosticuri la fotbal, pe scor, în aplicația BETina.</strong> Înainte să înceapă meciul treci rezultatul la care te aștepți. După fluierul final, aplicația compară pronosticul tău cu scorul real și îți dă puncte. Punctele hotărăsc locul tău în clasament, atât în cel general, cât și în ligile private pe care le faci cu prietenii.',
          'Este jocul care se joacă de zeci de ani prin birouri și pe grupurile de chat, doar că fără tabelul ținut de mână și fără bani. Noutatea este cu cine joci: BETina, partenera sportivă AI din aplicație, dă și ea pronostic la fiecare meci, ține jocul în mișcare și abia așteaptă să vă contraziceți pe tema acelui 3–1 al tău.',
        ],
      },
      {
        type: 'steps', kicker: 'Cum funcționează', h2: 'Jocul de pronosticuri', h2b: 'în trei pași.',
        items: [
          { t: 'Dai pronosticul', p: 'Deschizi lista de meciuri, alegi o partidă și treci scorul la care te aștepți, de exemplu 2–1. Până la fluierul de start îl poți schimba de câte ori vrei.' },
          { t: 'Urmărești meciul', p: 'La fluierul de start pronosticurile se blochează și devin vizibile, deci nimeni nu poate copia. Dacă urmărești meciul în BETina Live, pronosticul tău stă chiar lângă scorul live.' },
          { t: 'Îți iei punctele', p: 'După fluierul final punctele se adaugă automat, iar clasamentul se actualizează. O notificare îți spune cum ți-a mers etapa.' },
        ],
      },
      {
        type: 'cards', kicker: 'Punctaj', h2: 'Cum se acordă', h2b: 'punctele.',
        intro: 'Un pronostic, trei feluri de a puncta. Contează rezultatul după 90 de minute plus minutele adiționale.',
        items: [
          { big: '3', unit: 'puncte', t: 'Scor exact', p: 'Ai nimerit rezultatul la gol. Cea mai bună senzație din tot jocul.', eg: 'Pronostic 2–1 · Rezultat 2–1' },
          { big: '2', unit: 'puncte', t: 'Diferență de goluri corectă', p: 'Ai nimerit câștigătorul și diferența, dar nu scorul exact. Tot aici intră și un egal cu alt scor.', eg: 'Pronostic 2–1 · Rezultat 3–2' },
          { big: '1', unit: 'punct', t: 'Câștigător corect', p: 'Ai spus bine cine câștigă, dar diferența a fost alta.', eg: 'Pronostic 2–1 · Rezultat 3–0' },
        ],
        after: [
          'Un pronostic greșit nu aduce nimic și nu costă nimic. Pe lângă pronosticurile pe meciuri există și <strong>întrebări bonus</strong> pentru puncte în plus. Fiecare punct îți aduce și XP pentru nivelul tău din aplicație.',
        ],
      },
      {
        type: 'shot', kicker: 'Cu prietenii', h2: 'Pronosticuri cu prietenii:', h2b: 'urcă în clasament.', img: 'screen-predictor',
        alt: 'Aplicația BETina: ligă de pronosticuri cu prietenii și clasament',
        paras: [
          'Un joc de pronosticuri la fotbal are cel mai mult farmec cu oameni pe care îi cunoști. În BETina creezi o <strong>ligă privată</strong>, îți inviți prietenii, familia sau colegii și aveți clasamentul vostru, separat de cel general. Cine e pe primul loc luni dimineață are cuvântul.',
          'Clasamentul arată cine a urcat și cine a coborât după ultima etapă, iar statisticile tale îți spun cât de des nimerești scorul exact. Mai este și duelul pe echipe: după fiecare rundă, media grupului vostru se compară cu punctajul BETinei. Bateți-o împreună.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'Diferența', h2: 'O parteneră AI care joacă și ea', h2b: 'și vorbește fotbal cu tine.',
        label: 'Exemplu de conversație despre un pronostic',
        paras: [
          'Orice alt joc de pronosticuri înseamnă un formular și un tabel. În BETina jocul are o gazdă. <strong>BETina dă ea însăși pronostic la fiecare meci.</strong> Pronosticurile ei rămân ascunse până la fluierul de start, exact ca ale tuturor, și apare în fiecare clasament. Ai deci mereu pe cineva de bătut.',
          'Și poți vorbi cu ea despre asta. Spune-i de ce vezi o victorie în deplasare, întreab-o ce crede despre forma unei echipe sau las-o să te tachineze pentru weekendul trecut. Îți răspunde în limba ta, în scris sau la un apel vocal. Ce spune ea este o părere, nu un sfat, și greșește destul de des cât să rămână interesant.',
        ],
        msgs: [
          ['me', 'Merg pe 3–1 sâmbătă. Prea curajos?'],
          ['b', 'Curajos, da. N-au mai dat trei goluri acasă din toamnă. Dar îmi place încrederea.'],
          ['me', 'Și tu ce pronostic ai dat?'],
          ['b', 'Bună încercare. Pe al meu îl vezi la fluierul de start, ca toată lumea. 😌'],
        ],
        note: 'Exemplu ilustrativ. BETina este un AI și poate greși.',
      },
      {
        type: 'prose', kicker: 'Principiul', h2: 'Fără bani, fără mize:', h2b: 'doar puncte și glorie.',
        paras: [
          'Jocul de pronosticuri BETina se joacă de plăcere. <strong>Nu pui nimic în joc, nu cumperi nimic și nu ți se plătește nimic.</strong> Nu există premii în bani și nici taxă de participare, iar aplicația nu îți cere niciodată cardul. Ce câștigi sunt puncte, XP, un loc în clasament și dreptul de a le aduce aminte prietenilor de el.',
          'Așa am vrut să fie. BETina este o aplicație de divertisment pentru adulți, iar jocul de pronosticuri fără bani este făcut ca o etapă să fie mai palpitantă, fie că joacă echipa ta, fie că nu.',
        ],
      },
      {
        type: 'table', kicker: 'Competiții', h2: 'Competițiile la care', h2b: 'poți da pronosticuri.',
        intro: 'Jocul de pronosticuri acoperă cinci dintre cele mai mari competiții din fotbalul european de club, etapă cu etapă.',
        cols: ['Competiție', 'Țară', 'La ce dai pronostic'], hl: 0,
        rows: [
          ['Bundesliga', 'Germania', 'Fiecare meci din fiecare etapă'],
          ['Premier League', 'Anglia', 'Fiecare meci din fiecare etapă'],
          ['LaLiga', 'Spania', 'Fiecare meci din fiecare etapă'],
          ['Serie A', 'Italia', 'Fiecare meci din fiecare etapă'],
          ['Champions League', 'Europa', 'Faza ligii și fazele eliminatorii'],
        ],
        after: ['Tu alegi la ce competiții joci. Punctele din toate se adună în clasamentul general.'],
      },
    ],
    faqH2: 'Întrebări frecvente', faqH2b: 'despre jocul de pronosticuri.',
    faq: [
      ['Jocul de pronosticuri BETina este gratuit?', 'Da. Jocul face parte din aplicația gratuită BETina pentru iPhone, Android și web. Nu există taxă de participare și nici abonament.'],
      ['Sunt implicați bani reali și pot câștiga premii?', 'Nu. Nu pui nimic în joc și nu ți se plătește nimic. Nu există premii în bani sau în obiecte. Joci pentru puncte, XP și locul tău în clasament.'],
      ['Cum se acordă punctele?', 'Trei puncte pentru scorul exact, două pentru câștigătorul corect cu diferența de goluri corectă, unul pentru câștigătorul corect. Contează rezultatul după 90 de minute plus minutele adiționale.'],
      ['La ce ligi și competiții pot da pronosticuri?', 'Bundesliga, Premier League, LaLiga, Serie A și Champions League.'],
      ['Pot juca jocul de pronosticuri cu prietenii?', 'Da. Creezi o ligă privată în aplicație și îți inviți prietenii. Aveți clasamentul vostru, pe lângă cel general.'],
      ['Până când pot da un pronostic și îl pot schimba?', 'Poți da și schimba un pronostic până la fluierul de start al meciului. Atunci se blochează și abia din acel moment îl pot vedea ceilalți.'],
      ['Prin ce se deosebește BETina de alte aplicații de pronosticuri la fotbal?', 'Joci alături de o parteneră AI. BETina dă ea însăși pronostic la fiecare meci, apare în fiecare clasament și vorbește cu tine despre pronosticurile tale, în nouă limbi.'],
      ['Jocul de pronosticuri este disponibil pe iPhone, Android și web?', 'Da. Poți juca în aplicația pentru iPhone, în cea pentru Android și în aplicația web din browser, cu același cont.'],
    ],
    alsoH2: 'În aplicație', alsoH2b: 'mai sunt și altele.',
    homeTeaser: 'Tot ce știe BETina să facă, pe o singură pagină.',
    ctaH2: 'Zici că te pricepi', ctaH2b: 'la fotbal? Dovedește.',
    ctaText: 'Descarcă BETina, dă pronosticurile pentru prima ta etapă și vezi pe ce loc ajungi în clasament.',
  },

  live: {
    path: '/ro/scoruri-live-fotbal',
    nav: 'Scoruri live',
    teaser: 'Scoruri live la fotbal pentru echipele tale și o notificare imediat ce se înscrie.',
    more: 'Despre BETina Live',
    crumb: 'Scoruri live',
    title: 'Scoruri live fotbal: aplicație cu notificări la gol | BETina',
    desc: 'Scoruri live la fotbal pentru echipele tale și o notificare la fiecare gol. Întreabă AI-ul despre meci. Gratuit pe iPhone, Android și web.',
    sticker: 'BETina Live · Fotbal',
    h1: 'Scoruri live la fotbal',
    h1b: 'cu notificare la fiecare gol.',
    lead: 'BETina Live îți arată scorurile de fotbal care te interesează și îți trimite o notificare pe telefon în clipa în care echipa ta marchează. Iar când vrei să știi ce se întâmplă în meci, pur și simplu o întrebi pe BETina.',
    badge: '● Live',
    push: 'GOL! 1–0 în minutul 34.',
    shotAlt: 'Aplicația BETina: scoruri live la fotbal cu notificări la gol pentru echipele urmărite',
    facts: [
      ['0 €', 'Gratuit în aplicație, fără abonament'],
      ['5', 'Momente din meci pentru care primești notificare'],
      ['9', 'Limbi în care BETina vorbește despre fotbal'],
      ['18+', 'Pentru adulți, fără niciun ban'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Pe scurt', h2: 'Ce este', h2b: 'BETina Live?',
        paras: [
          '<strong>BETina Live este partea de scoruri live la fotbal din aplicația BETina.</strong> Îți arată meciurile care se joacă acum, ține scorul la zi cât timp mingea e în joc și pune sus de tot echipele pe care le urmărești. Nu trebuie să ții aplicația deschisă: când se întâmplă ceva într-un meci care contează pentru tine, te anunță o notificare.',
          'Cele mai multe aplicații de rezultate live se opresc aici. BETina Live face parte dintr-o parteneră sportivă AI, așa că scorul e doar începutul discuției. O poți întreba pe BETina cine a marcat, cum arată acum clasamentul sau ce părere are despre prima repriză, în chat sau la un apel vocal. Scorurile live sunt disponibile pentru fotbal; despre celelalte sporturi vorbești în <a href="/ro/chat-sportiv-ai">chatul sportiv AI</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Notificări la gol', h2: 'O notificare în clipa', h2b: 'în care echipa ta marchează.',
        label: 'Exemple de notificări de la BETina Live',
        paras: [
          'Notificarea la gol este motivul pentru care cei mai mulți își pun pe telefon o aplicație de scoruri, și este inima BETina Live. Urmărești o echipă și primești o notificare push când se marchează în meciul ei, cu noul scor și minutul.',
          'Notificările vin doar pentru <strong>echipele și meciurile pe care le-ai ales tu</strong>. Nimeni nu are nevoie de cincizeci de mesaje din ligi la care nu se uită. Pe lângă goluri, BETina Live anunță și celelalte momente care schimbă un meci: fluierul de start, cartonașele roșii, pauza și fluierul final.',
          'Notificările la gol ajung pe iPhone și pe Android. Le poți opri oricând din setări.',
        ],
        items: [
          ['19:30', 'A început! Echipa ta e pe teren.'],
          ['34′', 'GOL! 1–0 în minutul 34.'],
          ['45′', 'Pauză: 1–0. Primă repriză solidă.'],
          ['67′', 'Cartonaș roșu pentru oaspeți.'],
          ['90′', 'Final: 2–0. Trei puncte!'],
        ],
      },
      {
        type: 'steps', kicker: 'Configurare', h2: 'Cum activezi notificările la gol', h2b: 'pentru echipa ta.',
        intro: 'Durează cam un minut și o faci o singură dată.',
        items: [
          { t: 'Ia-ți BETina', p: 'Descarcă aplicația gratuit din App Store sau Google Play și conectează-te cu Apple, Google, email sau numărul de telefon.' },
          { t: 'Alege-ți echipele', p: 'La început îți alegi echipa preferată. Alte echipe, sau un singur meci, le poți urmări din fila Live.' },
          { t: 'Permite notificările', p: 'Spune da când telefonul te întreabă dacă BETina îți poate trimite notificări. Fără asta, nicio notificare la gol nu ajunge la tine.' },
          { t: 'Te uiți sau nu', p: 'Lasă telefonul deoparte. Data viitoare când echipa ta marchează, afli în același minut de joc, oriunde ai fi.' },
        ],
      },
      {
        type: 'chat', kicker: 'Diferența', h2: 'Întreabă despre meci:', h2b: 'scoruri live cu o parteneră AI.',
        label: 'Exemplu de conversație despre un meci în desfășurare',
        paras: [
          'Un scor îți spune ce s-a întâmplat. Nu îți spune de ce și nici nu ține cu nimeni. BETina le face pe amândouă. Are în față datele live ale meciului, așa că o poți întreba ce ai întreba un prieten care se uită la meci: cine a marcat, dacă avantajul e meritat, ce înseamnă rezultatul pentru clasament.',
          'Pe pagina fiecărui meci găsești și <strong>părerea BETinei</strong>, o scurtă citire a jocului cu vorbele ei, lângă clasament și meciurile directe dintre cele două echipe. Și pentru că BETina vorbește nouă limbi, un fan din Zagreb primește în croată același meci pe care un fan din București îl primește în română.',
        ],
        msgs: [
          ['me', 'Cât e scorul la noi?'],
          ['b', '1–0 pentru voi din minutul 34. Lovitură de cap după un corner și, sincer, se anunța.'],
          ['me', 'Pe ce loc suntem acum în clasament?'],
          ['b', 'Dacă rămâne așa, urcați pe patru. Încă două etape ca asta și încep să cred și eu.'],
        ],
        note: 'Exemplu ilustrativ. BETina este un AI și poate greși.',
      },
      {
        type: 'cards', kicker: 'Pe pagina fiecărui meci', h2: 'Mai mult decât', h2b: 'o cifră.',
        items: [
          { t: 'Scor live și desfășurarea meciului', p: 'Scorul la zi, minutul și momentele-cheie ale meciului, în ordinea în care s-au petrecut.' },
          { t: 'Clasament și meciuri directe', p: 'Clasamentul ligii dintr-o privire și cum s-au descurcat cele două echipe una contra celeilalte în întâlnirile de până acum.' },
          { t: 'Pronosticul tău, chiar alături', p: 'Dacă joci <a href="/ro/joc-pronosticuri-fotbal" style="color:var(--lime);text-decoration:underline">jocul de pronosticuri</a> gratuit, scorul pe care l-ai dat stă chiar lângă scorul live.' },
        ],
      },
      {
        type: 'prose', kicker: 'Bine de știut', h2: 'Gratuit pe iPhone, Android', h2b: 'și web.',
        paras: [
          'BETina Live face parte din aplicația gratuită BETina. Nu există variantă plătită pentru scoruri și nici abonament pentru notificările la gol. Aplicația o găsești în App Store și în Google Play, iar aplicația web o deschizi în browser când vrei să verifici scorurile de pe laptop.',
          'BETina este o aplicație de divertisment pentru adulți. <strong>Nicăieri în aplicație nu sunt implicați bani</strong>: nu ai ce pune în joc și nu ți se plătește nimic. Este creată de GeniusBet și operată de Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'întrebări frecvente.',
    faq: [
      ['BETina Live este gratuit?', 'Da. Scorurile live și notificările la gol fac parte din aplicația gratuită BETina pentru iPhone, Android și web. Nu există abonament.'],
      ['Cum primesc o notificare când marchează echipa mea?', 'Instalezi BETina, îți alegi echipa și permiți notificările. De atunci primești o notificare push ori de câte ori se marchează într-un meci al unei echipe pe care o urmărești.'],
      ['Pot primi notificări la gol doar pentru o singură echipă?', 'Da. Notificările vin doar pentru echipele și meciurile pe care le urmărești, deci o singură echipă e de ajuns. Poți adăuga sau scoate echipe oricând.'],
      ['Pentru ce sporturi există scoruri live?', 'Scorurile live și notificările la gol sunt disponibile pentru fotbal. Cu BETina poți vorbi însă despre multe alte sporturi, cum ar fi tenis, NFL, MMA sau cricket.'],
      ['Pentru ce mai primesc notificări în afară de goluri?', 'Pentru fluierul de start, cartonașe roșii, pauză și rezultatul final al meciurilor pe care le urmărești.'],
      ['Ce pot întreba AI-ul despre un meci?', 'Orice ai întreba un prieten care se uită la meci: scorul, cine a marcat, cum arată clasamentul sau ce crede ea despre joc. BETina este un AI și poate greși, deci ia-i părerea ca pe o opinie.'],
      ['Sunt implicați bani reali?', 'Nu. BETina este o aplicație de divertisment. Nicăieri în aplicație nu se pun bani în joc și nu se fac plăți.'],
    ],
    alsoH2: 'În aplicație', alsoH2b: 'mai sunt și altele.',
    homeTeaser: 'Tot ce știe BETina să facă, pe o singură pagină.',
    ctaH2: 'Nu mai rata', ctaH2b: 'niciun gol.',
    ctaText: 'Descarcă BETina, urmărește-ți echipa și lasă golurile să vină la tine.',
  },

  chat: {
    path: '/ro/chat-sportiv-ai',
    nav: 'Chat sportiv AI',
    teaser: 'Scrie-i sau sun-o pe o parteneră AI care îți știe echipele și ține minte ce ați vorbit.',
    more: 'Despre chatul sportiv AI',
    crumb: 'Chat sportiv AI',
    title: 'Chat sportiv AI: vorbește cu AI despre fotbal | BETina',
    desc: 'Chat sportiv AI cu BETina: scrie-i sau sun-o. Îți știe echipele, ține minte ce ați vorbit și vorbește 9 limbi. Gratuit, fără niciun ban.',
    sticker: 'Chat · Voce · 9 limbi',
    h1: 'Chat sportiv AI:',
    h1b: 'vorbește cu BETina despre fotbal și sport.',
    lead: 'BETina este o parteneră AI cu care vorbești despre sport așa cum vorbești cu un prieten care se uită la toate meciurile. Scrie-i sau sun-o. Îți știe echipele, ține minte ce ai spus săptămâna trecută și îți răspunde în limba ta.',
    badge: '● Online acum',
    shotAlt: 'Aplicația BETina: chat sportiv AI cu BETina',
    facts: [
      ['24/7', 'E acolo ori de câte ori vrei să vorbești despre sport'],
      ['9', 'Limbi, schimbă odată cu tine'],
      ['11+', 'Sporturi, de la fotbal la cricket'],
      ['0 €', 'Chat gratuit, fără niciun ban'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Pe scurt', h2: 'Ce este chatul sportiv AI', h2b: 'al BETinei?',
        paras: [
          '<strong>Chatul sportiv AI al BETinei este o conversație cu o parteneră AI care trăiește pentru sport.</strong> Este inima aplicației BETina. Pui o întrebare sau spui pur și simplu ce ai pe suflet după un meci, iar BETina îți răspunde ca un om cu păreri: scurt, direct și pe tonul cuiva care chiar s-a uitat.',
          'Cele mai multe chatboturi AI de sport sunt unelte de întrebări și răspunsuri legate de o singură ligă sau de o singură televiziune. BETina este o singură personalitate pentru toate sporturile. Știe cu ce echipe ții, aduce vorba despre lucruri pe care i le-ai mai spus și o poți suna când scrisul merge prea încet. Poți vorbi cu un AI despre fotbal, tenis sau NFL în același chat.',
        ],
      },
      {
        type: 'cards', kicker: 'Subiecte', h2: 'Vorbește cu AI despre fotbal', h2b: 'și despre orice alt sport.',
        items: [
          { t: 'Echipele tale și etapa ta', p: 'Primul unsprezece, forma, schimbarea aceea pe care n-a înțeles-o nimeni. BETina îți știe echipele preferate și are la îndemână scorurile live la fotbal, deci sunteți pe aceeași lungime de undă.' },
          { t: 'Reguli, istorie și dezbateri', p: 'De ce a fost ofsaid? Cine a fost decarul mai bun? Cere o explicație rapidă sau pornește o ceartă despre cea mai mare echipă din toate timpurile.' },
          { t: 'Orice sport, nu doar o ligă', p: 'Fotbal, tenis, NFL, MMA, cricket și altele. Învață un sport nou de la zero sau intră în detalii la cel pe care îl urmărești de douăzeci de ani.' },
        ],
      },
      {
        type: 'chat', kicker: 'Exemple', h2: 'Trei conversații', h2b: 'cu BETina.',
        label: 'Exemplu de conversație: o regulă explicată',
        paras: [
          '<strong>Întrebarea de regulament.</strong> Ai văzut un gol anulat și vrei să știi de ce, fără să citești un regulament. BETina îți explică în trei propoziții și se oferă să intre în detalii.',
          '<strong>Dimineața de după.</strong> Încă ești supărat pentru sâmbătă. BETina ține minte că săptămâna trecută îți făceai griji pentru linia de mijloc și reia discuția exact de acolo.',
          '<strong>Sportul nou.</strong> Un prieten te târăște la o finală de tenis sau la o noapte de NFL. Cere-i BETinei să-ți explice punctajul pe înțelesul tuturor și ții pasul cu meciul încă de la primul break.',
        ],
        msgs: [
          ['me', 'De ce au anulat golul? Mie mi s-a părut pe aceeași linie.'],
          ['b', 'Pe aceeași linie ar fi fost în regulă, dar la momentul pasei umărul lui trecuse de ultimul apărător. Umerii contează, brațele nu.'],
          ['me', 'Chiar atât de la limită?'],
          ['b', 'Câțiva centimetri. Doare, știu. Vrei varianta de 20 de secunde despre cum se trage linia?'],
        ],
        note: 'Exemplu ilustrativ. BETina este un AI și poate greși.',
      },
      {
        type: 'shot', flip: true, kicker: 'Voce', h2: 'Sun-o pe BETina:', h2b: 'chat vocal cu un AI despre sport.', img: 'screen-call',
        alt: 'Aplicația BETina: apel vocal cu BETina',
        paras: [
          'Uneori n-ai chef să scrii. În aplicație poți <strong>să o suni pe BETina și să vorbiți despre sport prin voce</strong>, fără mâini, în drum spre stadion sau cu meciul mergând pe fundal. Te ascultă, îți răspunde cu voce tare și ține pasul când o întrerupi, ca la un telefon obișnuit.',
          'La telefon știe aceleași lucruri ca în chat: echipele tale, discuțiile voastre de până acum și scorurile live la fotbal. Apelurile vocale sunt incluse gratuit, cu un timp de convorbire zilnic.',
        ],
      },
      {
        type: 'prose', kicker: 'Memorie', h2: 'Îți ține minte echipele', h2b: 'și ultima discuție.',
        paras: [
          'O conversație iese mai bine când nu trebuie să o iei de fiecare dată de la zero. BETina reține ce echipe și ce sporturi urmărești și ce i-ai povestit, așa că săptămâna viitoare te poate întreba cum a fost derbiul sau dacă genunchiul tău a rezistat la minifotbal.',
          'Controlul asupra acestei memorii rămâne la tine. Poți cere ștergerea istoricului de chat sau a lucrurilor pe care BETina le-a reținut despre tine, iar ștergerea contului le elimină complet. Detaliile sunt pe <a href="/delete-account">pagina despre cont și date</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Limbi', h2: 'O singură parteneră,', h2b: 'nouă limbi.',
        intro: 'BETina îți răspunde în limba în care îi scrii sau îi vorbești și schimbă limba odată cu tine. Asta o face un chat sportiv AI pentru cei care urmăresc o ligă într-o limbă și trăiesc în alta.',
        items: [
          '<strong>Română</strong>', '<strong>Engleză</strong> (English)', '<strong>Germană</strong> (Deutsch)', '<strong>Spaniolă</strong> (Español)', '<strong>Franceză</strong> (Français)',
          '<strong>Portugheză</strong> (Português)', '<strong>Italiană</strong> (Italiano)', '<strong>Turcă</strong> (Türkçe)', '<strong>Croată</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'Pe șleau', h2: 'Ce nu este', h2b: 'BETina.',
        paras: [
          '<strong>BETina este un AI, nu o persoană reală.</strong> Are personalitate și păreri, dar ele sunt generate de un program și, ca orice AI, poate greși informații. Ia ce spune despre sport ca pe un punct de vedere cu care te poți contrazice, nu ca pe o sursă verificată.',
          'Nu este nici consilier. BETina este o aplicație de divertisment pentru adulți (18+), iar nicăieri în aplicație nu sunt implicați bani. Părerea ei despre un meci este conversație și nimic mai mult.',
        ],
      },
      {
        type: 'steps', kicker: 'Primii pași', h2: 'Cum începi', h2b: 'să vorbești cu ea.',
        items: [
          { t: 'Ia-ți BETina', p: 'Descarcă aplicația gratuită din App Store sau Google Play ori deschide aplicația web în browser.' },
          { t: 'Conectează-te și alege-ți echipele', p: 'Conectează-te cu Apple, Google, email sau telefon și alege echipele și sporturile care contează pentru tine.' },
          { t: 'Spune-i salut', p: 'Scrie primul mesaj sau atinge microfonul ca să o suni. Dacă nu știi de unde să începi, întreab-o de meciul din seara asta.' },
        ],
      },
    ],
    faqH2: 'Întrebări despre', faqH2b: 'chatul sportiv AI.',
    faq: [
      ['Chiar pot vorbi cu un AI despre fotbal și sport?', 'Da. BETina este o parteneră AI făcută pentru sport. Îi poți scrie sau o poți suna și puteți vorbi despre meciuri, echipe, reguli și istoria sportului.'],
      ['Chatul sportiv AI este gratuit?', 'Da. Chatul cu BETina este gratuit pe iPhone, Android și web. Apelurile vocale sunt incluse, cu un timp de convorbire zilnic.'],
      ['Sunt implicați bani reali?', 'Nu. BETina este o aplicație de divertisment. Nicăieri în aplicație nu se pun bani în joc și nu se fac plăți.'],
      ['Despre ce sporturi pot vorbi cu BETina?', 'Despre fotbal, tenis, NFL, MMA, cricket și multe altele. Scorurile live din aplicație sunt disponibile pentru fotbal.'],
      ['Poate BETina să țină minte echipa mea preferată și discuțiile de dinainte?', 'Da. Reține echipele tale preferate și lucrurile pe care i le-ai spus și revine la ele. Poți cere oricând ștergerea acestor date.'],
      ['Cum funcționează apelurile vocale cu BETina?', 'Atingi microfonul din chat ca să pornești un apel. Tu vorbești, BETina îți răspunde cu voce tare și o poți întrerupe ca la un telefon obișnuit.'],
      ['Ce limbi vorbește BETina?', 'Română, engleză, germană, spaniolă, franceză, portugheză, italiană, turcă și croată. Îți răspunde în limba pe care o folosești.'],
      ['BETina este o persoană reală? Răspunsurile ei sunt mereu corecte?', 'Nu și nu. BETina este un AI cu personalitate proprie. Poate greși, așa că verifică lucrurile importante la o sursă oficială.'],
    ],
    alsoH2: 'În aplicație', alsoH2b: 'mai sunt și altele.',
    homeTeaser: 'Tot ce știe BETina să facă, pe o singură pagină.',
    ctaH2: 'Cineva cu care să vorbești', ctaH2b: 'despre sport. Oricând.',
    ctaText: 'Descarcă BETina și începe discuția. Are deja o părere despre echipa ta.',
  },
};
