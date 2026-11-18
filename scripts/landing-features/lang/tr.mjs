// Turkish (tr) localization of the three feature pages. Informal "sen" throughout.
export default {
  local: { home: 'Ana sayfa', more: 'BETina’da daha fazlası', faq: 'Sorular ve cevaplar', now: 'şimdi' },
  home: {
    moreChat: 'Yapay zekâ spor sohbeti hakkında daha fazlası →',
    moreLive: 'Canlı skorlar hakkında daha fazlası →',
    moreGame: 'Tahmin oyunu hakkında daha fazlası →',
  },

  game: {
    path: '/tr/skor-tahmin-oyunu',
    nav: 'Tahmin oyunu',
    teaser: 'Maç skorlarını tahmin et, puan topla ve arkadaşlarını geç. İşin içinde para yok.',
    more: 'Tahmin oyunu hakkında',
    crumb: 'Tahmin oyunu',
    title: 'Skor Tahmin Oyunu: Ücretsiz, Arkadaşlarınla | BETina',
    desc: 'Ücretsiz skor tahmin oyunu: maç skorlarını tahmin et, puan topla, sıralamada arkadaşlarını geç. Para yok; seninle birlikte oynayan bir yapay zekâ var.',
    sticker: 'Sadece eğlence · Para yok',
    h1: 'Ücretsiz skor tahmin oyunu:',
    h1b: 'skoru bil, arkadaşlarını geç.',
    lead: 'Maç başlamadan skoru söyle, bildiğinde puanı topla ve sıralamada arkadaşlarının önüne geç. BETina tahmin oyunu ücretsizdir, para yatırmak da para kazanmak da yoktur; üstelik her maçı kendisi de tahmin eden bir yapay zekâ arkadaşıyla gelir.',
    badge: '3 · 2 · 1',
    shotAlt: 'BETina uygulaması: sıralamalı futbol skor tahmin oyunu',
    facts: [
      ['3·2·1', 'Tam skor, gol farkı ve doğru galip için puan'],
      ['5', 'Organizasyon, Bundesliga’dan Şampiyonlar Ligi’ne'],
      ['0 €', 'Para yatırmak yok, ödül yok, ödeme yok'],
      ['9', 'Oynayabileceğin dil'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Kısaca', h2: 'BETina skor tahmin oyunu', h2b: 'nedir?',
        paras: [
          '<strong>BETina tahmin oyunu, BETina uygulamasının içindeki ücretsiz bir futbol skor tahmin oyunudur.</strong> Maç başlamadan önce beklediğin skoru girersin. Son düdükten sonra uygulama tahminini gerçek sonuçla karşılaştırır ve puanını verir. Bu puanlar sıralamadaki yerini belirler; hem genel sıralamada hem de arkadaşlarınla kurduğun özel gruplarda.',
          'Yıllardır iş yerlerinde ve arkadaş gruplarında oynanan oyunun aynısı; sadece elle tutulan çizelge yok, para da yok. Yeni olan, kiminle oynadığın: uygulamadaki yapay zekâ spor arkadaşı BETina da her maçı tahmin eder, oyuna ev sahipliği yapar ve senin 3–1’in üzerine seve seve tartışır.',
        ],
      },
      {
        type: 'steps', kicker: 'Nasıl oynanır', h2: 'Tahmin oyunu', h2b: 'üç adımda.',
        items: [
          { t: 'Skoru tahmin et', p: 'Maç listesini aç, bir karşılaşma seç ve beklediğin skoru gir; örneğin 2–1. Maç başlayana kadar tahminini istediğin kadar değiştirebilirsin.' },
          { t: 'Maçı izle', p: 'Başlama düdüğüyle birlikte tahminler kilitlenir ve herkese açılır; yani kopya çekmek yok. Maçı BETina Live’da takip ediyorsan tahminin canlı skorun hemen yanında durur.' },
          { t: 'Puanını topla', p: 'Son düdükten sonra puanların otomatik olarak eklenir ve sıralama güncellenir. Haftanın nasıl geçtiğini bir bildirimle öğrenirsin.' },
        ],
      },
      {
        type: 'cards', kicker: 'Puanlama', h2: 'Puanlar', h2b: 'nasıl veriliyor?',
        intro: 'Tek tahmin, puan almanın üç yolu. Geçerli olan, 90 dakika artı eklenen süre sonundaki skordur.',
        items: [
          { big: '3', unit: 'puan', t: 'Tam skor', p: 'Sonucu golü golüne bildin. Oyunun en güzel hissi.', eg: 'Tahmin 2–1 · Sonuç 2–1' },
          { big: '2', unit: 'puan', t: 'Doğru gol farkı', p: 'Galibi ve farkı bildin ama skor tam tutmadı. Farklı skorla biten bir beraberlik de buraya girer.', eg: 'Tahmin 2–1 · Sonuç 3–2' },
          { big: '1', unit: 'puan', t: 'Doğru galip', p: 'Kimin kazanacağını bildin ama fark başkaydı.', eg: 'Tahmin 2–1 · Sonuç 3–0' },
        ],
        after: [
          'Tutmayan tahmin puan getirmez, bir şey de götürmez. Maç tahminlerinin yanında fazladan puan kazandıran <strong>ek sorular</strong> da var. Aldığın her puan ayrıca uygulamadaki seviyen için XP kazandırır.',
        ],
      },
      {
        type: 'shot', kicker: 'Arkadaşlarınla', h2: 'Arkadaşlarınla tahmin oyunu:', h2b: 'sıralamada zirveye çık.', img: 'screen-predictor',
        alt: 'BETina uygulaması: arkadaşlarla tahmin grubu ve sıralama',
        paras: [
          'Futbol tahmin oyunu en çok tanıdığın insanlarla keyifli. BETina’da <strong>özel bir grup</strong> kurar, arkadaşlarını, aileni ya da iş arkadaşlarını davet eder ve genel sıralamadan ayrı, kendinize ait bir sıralama elde edersin. Pazartesi sabahı zirvede kim varsa söz onundur.',
          'Sıralama, son haftada kimin yükseldiğini, kimin düştüğünü gösterir; kişisel istatistiklerin de tam skoru ne sıklıkla tutturduğunu söyler. Bir de takım düellosu var: her turdan sonra grubunuzun ortalaması BETina’nın puanıyla karşılaştırılır. Onu hep birlikte geçin.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'Fark burada', h2: 'Seninle oynayan bir yapay zekâ arkadaşı,', h2b: 'üstüne bir de futbol sohbeti.',
        label: 'Bir tahmin üzerine örnek sohbet',
        paras: [
          'Diğer tahmin oyunları bir form ve bir tablodan ibaret. BETina’da ise oyunun bir ev sahibi var. <strong>BETina her maçı kendisi de tahmin eder.</strong> Tahminleri, herkesinki gibi başlama düdüğüne kadar gizli kalır ve adı her sıralamada yer alır; yani geçecek biri her zaman var.',
          'Üstelik onunla bunu konuşabilirsin. Neden deplasman galibiyeti gördüğünü anlat, bir takımın formu hakkında ne düşündüğünü sor ya da geçen hafta sonu yüzünden sana takılmasına izin ver. Sana kendi dilinde, yazarak ya da sesli aramada cevap verir. Söyledikleri bir görüştür, tavsiye değil; işi heyecanlı tutacak kadar sık da yanılır.',
        ],
        msgs: [
          ['me', 'Cumartesi için 3–1 diyorum. Fazla mı cesur?'],
          ['b', 'Cesur, evet. Sonbahardan beri evinde üç gol atamadılar. Ama bu özgüveni sevdim.'],
          ['me', 'Peki sen ne dedin?'],
          ['b', 'İyi denemeydi. Benimkini başlama düdüğünde görürsün, herkes gibi. 😌'],
        ],
        note: 'Temsilî örnektir. BETina bir yapay zekâdır ve hata yapabilir.',
      },
      {
        type: 'prose', kicker: 'İlke', h2: 'Para yok, ortaya konan bir şey yok:', h2b: 'sadece puan ve övünme hakkı.',
        paras: [
          'BETina tahmin oyunu eğlence için oynanır. <strong>Ortaya para koymazsın, bir şey satın almazsın ve sana bir ödeme yapılmaz.</strong> Para ödülü de katılım ücreti de yoktur; uygulama hiçbir aşamada senden kart bilgisi istemez. Kazandığın şey puan, XP, sıralamada bir yer ve bunu arkadaşlarına hatırlatma hakkıdır.',
          'Bu bilinçli bir tercih. BETina yetişkinlere yönelik bir eğlence uygulamasıdır ve oyunun amacı, senin takımın oynasın ya da oynamasın, maç haftasını daha keyifli hâle getirmektir.',
        ],
      },
      {
        type: 'table', kicker: 'Organizasyonlar', h2: 'Tahmin edebileceğin', h2b: 'ligler ve kupalar.',
        intro: 'Tahmin oyunu, Avrupa kulüp futbolunun en büyük beş organizasyonunu hafta hafta kapsar.',
        cols: ['Organizasyon', 'Ülke', 'Neyi tahmin edersin'], hl: 0,
        rows: [
          ['Bundesliga', 'Almanya', 'Her haftanın her maçı'],
          ['Premier League', 'İngiltere', 'Her haftanın her maçı'],
          ['LaLiga', 'İspanya', 'Her haftanın her maçı'],
          ['Serie A', 'İtalya', 'Her haftanın her maçı'],
          ['Şampiyonlar Ligi', 'Avrupa', 'Lig aşaması ve eleme turları'],
        ],
        after: ['Hangi organizasyonlarda oynayacağını sen seçersin. Hepsinden aldığın puanlar genel sıralamaya yazılır.'],
      },
    ],
    faqH2: 'Tahmin oyunu:', faqH2b: 'sık sorulan sorular.',
    faq: [
      ['BETina tahmin oyunu ücretsiz mi?', 'Evet. Oyun; iPhone, Android ve web’deki ücretsiz BETina uygulamasının bir parçasıdır. Katılım ücreti de abonelik de yoktur.'],
      ['Gerçek para söz konusu mu, ödül kazanabilir miyim?', 'Hayır. Ortaya para koymazsın ve sana bir ödeme yapılmaz. Para ödülü ya da eşya ödülü yoktur. Puan, XP ve sıralamadaki yerin için oynarsın.'],
      ['Puanlar nasıl hesaplanıyor?', 'Tam skor için üç puan, doğru galip ve doğru gol farkı için iki puan, doğru galip için bir puan. 90 dakika artı eklenen süre sonundaki skor geçerlidir.'],
      ['Hangi ligleri ve kupaları tahmin edebilirim?', 'Bundesliga, Premier League, LaLiga, Serie A ve Şampiyonlar Ligi.'],
      ['Tahmin oyununu arkadaşlarımla oynayabilir miyim?', 'Evet. Uygulamada özel bir grup kur ve arkadaşlarını davet et. Genel sıralamaya ek olarak kendinize ait bir sıralamanız olur.'],
      ['Tahmin için son an ne zaman, sonradan değiştirebilir miyim?', 'Maç başlayana kadar tahmin girebilir ve değiştirebilirsin. Başlama düdüğüyle tahmin kilitlenir; diğerleri de onu ancak o zaman görür.'],
      ['BETina’yı diğer skor tahmin uygulamalarından ayıran ne?', 'Bir yapay zekâ arkadaşıyla oynarsın. BETina her maçı kendisi de tahmin eder, her sıralamada yer alır ve tahminlerin hakkında seninle dokuz dilde konuşur.'],
      ['Tahmin oyunu iPhone, Android ve web’de var mı?', 'Evet. iPhone uygulamasında, Android uygulamasında ve tarayıcındaki web uygulamasında aynı hesapla oynayabilirsin.'],
    ],
    alsoH2: 'Uygulamada', alsoH2b: 'dahası var.',
    homeTeaser: 'BETina’nın yapabildiği her şey, tek sayfada.',
    ctaH2: 'Futboldan anladığını mı', ctaH2b: 'düşünüyorsun? Kanıtla.',
    ctaText: 'BETina’yı indir, ilk haftanı tahmin et ve sıralamada nereye oturduğunu gör.',
  },

  live: {
    path: '/tr/canli-skor',
    nav: 'Canlı skor',
    teaser: 'Takımlarının canlı futbol skorları ve gol olduğu an gelen bir bildirim.',
    more: 'BETina Live hakkında',
    crumb: 'Canlı skor',
    title: 'Canlı Skor Uygulaması: Gol Bildirimi ve Yapay Zekâ | BETina',
    desc: 'Takımların için canlı skor ve her golde bildirim. Maçı yapay zekâya sor. iPhone, Android ve web’de ücretsiz.',
    sticker: 'BETina Live · Futbol',
    h1: 'Canlı skor',
    h1b: 've takımların için gol bildirimi.',
    lead: 'BETina Live, seni ilgilendiren futbol skorlarını gösterir ve takımın gol attığı an telefonuna bildirim gönderir. Maçta neler olduğunu merak ettiğinde de BETina’ya sorman yeter.',
    badge: '● Canlı',
    push: 'GOL! 34. dakikada 1–0.',
    shotAlt: 'BETina uygulaması: takip edilen takımlar için gol bildirimli canlı futbol skorları',
    facts: [
      ['0 €', 'Uygulamada ücretsiz, abonelik yok'],
      ['5', 'Bildirim aldığın maç anı'],
      ['9', 'BETina’nın futbol konuştuğu dil'],
      ['18+', 'Yetişkinler için, işin içinde para yok'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Kısaca', h2: 'BETina Live', h2b: 'nedir?',
        paras: [
          '<strong>BETina Live, BETina uygulamasının canlı skor bölümüdür; futbol maçları içindir.</strong> O an oynanan maçları listeler, top oyundayken skoru güncel tutar ve takip ettiğin takımları en üste koyar. Uygulamayı açık tutman gerekmez: önem verdiğin bir maçta bir şey olduğunda bildirim gelir.',
          'Çoğu canlı skor uygulaması burada biter. BETina Live ise bir yapay zekâ spor arkadaşının içinde yer alır; yani skor, sohbetin başlangıcıdır. Golü kimin attığını, puan durumunun şimdi nasıl olduğunu ya da ilk yarı hakkında ne düşündüğünü BETina’ya sohbette ya da sesli aramada sorabilirsin. Canlı skorlar futbol için sunulur; diğer sporları <a href="/tr/yapay-zeka-spor-sohbeti">yapay zekâ spor sohbetinde</a> konuşursun.',
        ],
      },
      {
        type: 'feed', kicker: 'Gol bildirimleri', h2: 'Takımın gol attığı an', h2b: 'bildirim cebinde.',
        label: 'BETina Live’dan örnek bildirimler',
        paras: [
          'Çoğu insanın telefonuna bir futbol uygulaması indirmesinin sebebi gol bildirimidir; BETina Live’ın merkezinde de o var. Bir takımı takip et, maçında gol olduğunda yeni skoru ve dakikayı içeren bir bildirim al.',
          'Bildirimler yalnızca <strong>senin seçtiğin takımlar ve maçlar</strong> için gelir. İzlemediği liglerden elli bildirim almaya kimsenin ihtiyacı yok. BETina Live, gollerin yanında maçı değiştiren diğer anları da haber verir: başlama düdüğü, kırmızı kartlar, devre arası ve maç sonu.',
          'Gol bildirimleri iPhone ve Android’de sana ulaşır. İstediğin zaman ayarlardan kapatabilirsin.',
        ],
        items: [
          ['19:30', 'Maç başladı! Takımın sahada.'],
          ['34′', 'GOL! 34. dakikada 1–0.'],
          ['45′', 'Devre arası: 1–0. Sağlam bir ilk yarı.'],
          ['67′', 'Konuk takıma kırmızı kart.'],
          ['90′', 'Maç sonu: 2–0. Üç puan!'],
        ],
      },
      {
        type: 'steps', kicker: 'Kurulum', h2: 'Takımın için gol bildirimi', h2b: 'nasıl açılır?',
        intro: 'Yaklaşık bir dakika sürer ve bunu yalnızca bir kez yaparsın.',
        items: [
          { t: 'BETina’yı indir', p: 'Uygulamayı App Store ya da Google Play’den ücretsiz indir; Apple, Google, e-posta ya da telefon numaranla giriş yap.' },
          { t: 'Takımlarını seç', p: 'Başlarken favori takımını seç. Başka takımları ya da tek bir maçı Canlı sekmesinden takip edebilirsin.' },
          { t: 'Bildirimlere izin ver', p: 'Telefonun BETina’nın bildirim gönderip gönderemeyeceğini sorduğunda evet de. Bu izin olmadan gol bildirimi sana ulaşamaz.' },
          { t: 'İster izle ister izleme', p: 'Telefonu bir kenara bırak. Takımın bir dahaki golünde, nerede olursan ol, daha o dakika bitmeden haberin olur.' },
        ],
      },
      {
        type: 'chat', kicker: 'Fark burada', h2: 'Maçı BETina’ya sor:', h2b: 'yapay zekâ arkadaşlı canlı skor.',
        label: 'Canlı bir maç üzerine örnek sohbet',
        paras: [
          'Skor sana ne olduğunu söyler. Neden olduğunu söylemez, maçı seninle birlikte yaşamaz da. BETina ikisini de yapar. Maçın canlı verileri önündedir; bu yüzden ona, maçı izleyen bir arkadaşına soracağın şeyleri sorabilirsin: golü kim attı, üstünlük hak edilmiş mi, bu sonuç puan durumunda ne anlama geliyor.',
          'Her maç sayfasında ayrıca <strong>BETina’nın yorumu</strong> yer alır: maçın onun kendi sözleriyle kısa bir okuması; puan durumunun ve iki takımın aralarındaki maçların yanında. BETina dokuz dil konuştuğu için de Zagreb’deki taraftar aynı maçı Hırvatça, İstanbul’daki taraftar Türkçe takip eder.',
        ],
        msgs: [
          ['me', 'Bizim maç kaç kaç?'],
          ['b', '34. dakikadan beri 1–0 öndesiniz. Kornerden gelen bir kafa golü; açıkçası geliyorum diyordu.'],
          ['me', 'Bu skorla puan durumunda neredeyiz?'],
          ['b', 'Böyle biterse dördüncü sıraya çıkıyorsunuz. Böyle iki hafta daha geçsin, ben de inanmaya başlayacağım.'],
        ],
        note: 'Temsilî örnektir. BETina bir yapay zekâdır ve hata yapabilir.',
      },
      {
        type: 'cards', kicker: 'Her maç sayfasında', h2: 'Bir rakamdan', h2b: 'fazlası.',
        items: [
          { t: 'Canlı skor ve maç akışı', p: 'Güncel skor, dakika ve maçın önemli olayları; yaşandıkları sırayla.' },
          { t: 'Puan durumu ve aralarındaki maçlar', p: 'Ligin puan durumu tek bakışta ve iki takımın önceki karşılaşmalarında nasıl sonuçlar aldığı.' },
          { t: 'Tahminin hemen yanında', p: 'Ücretsiz <a href="/tr/skor-tahmin-oyunu" style="color:var(--lime);text-decoration:underline">tahmin oyununu</a> oynuyorsan, tahmin ettiğin skor canlı skorun yanında durur.' },
        ],
      },
      {
        type: 'prose', kicker: 'Bilmekte fayda var', h2: 'iPhone, Android', h2b: 've web’de ücretsiz.',
        paras: [
          'BETina Live, ücretsiz BETina uygulamasının bir parçasıdır. Skorlar için ücretli bir paket, gol bildirimleri için abonelik yoktur. Uygulamayı App Store’da ve Google Play’de bulursun; skorlara dizüstü bilgisayardan bakmak istersen web uygulamasını tarayıcında açabilirsin.',
          'BETina yetişkinlere yönelik bir eğlence uygulamasıdır. <strong>Uygulamanın hiçbir yerinde para yoktur</strong>: ortaya konacak bir para da, yapılacak bir ödeme de yok. BETina, GeniusBet’in ürünüdür ve Genius Media London Ltd tarafından işletilir.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'sık sorulan sorular.',
    faq: [
      ['BETina Live ücretsiz mi?', 'Evet. Canlı skorlar ve gol bildirimleri; iPhone, Android ve web’deki ücretsiz BETina uygulamasının bir parçasıdır. Abonelik yoktur.'],
      ['Takımım gol attığında nasıl bildirim alırım?', 'BETina’yı yükle, takımını seç ve bildirimlere izin ver. O andan sonra takip ettiğin bir takımın maçında gol olduğunda bildirim alırsın.'],
      ['Sadece tek bir takım için gol bildirimi alabilir miyim?', 'Evet. Bildirimler yalnızca takip ettiğin takımlar ve tek tek maçlar için gönderilir; yani tek takım yeter. İstediğin zaman takım ekleyip çıkarabilirsin.'],
      ['Hangi sporlarda canlı skor var?', 'Canlı skorlar ve gol bildirimleri futbol için sunulur. BETina ile tenis, NFL, MMA ya da kriket gibi pek çok başka spor hakkında da konuşabilirsin.'],
      ['Gol dışında başka neler için bildirim alırım?', 'Takip ettiğin maçların başlama düdüğü, kırmızı kartları, devre arası ve maç sonucu için.'],
      ['Yapay zekâya bir maç hakkında ne sorabilirim?', 'Maçı izleyen bir arkadaşına soracağın her şeyi: skoru, golü kimin attığını, puan durumunu ya da maç hakkında ne düşündüğünü. BETina bir yapay zekâdır ve yanılabilir; söylediklerini bir görüş olarak al.'],
      ['Gerçek para söz konusu mu?', 'Hayır. BETina bir eğlence uygulamasıdır. Uygulamanın hiçbir yerinde para yatırılmaz ve ödeme yapılmaz.'],
    ],
    alsoH2: 'Uygulamada', alsoH2b: 'dahası var.',
    homeTeaser: 'BETina’nın yapabildiği her şey, tek sayfada.',
    ctaH2: 'Bir daha hiçbir', ctaH2b: 'golü kaçırma.',
    ctaText: 'BETina’yı indir, takımını takip et ve goller sana gelsin.',
  },

  chat: {
    path: '/tr/yapay-zeka-spor-sohbeti',
    nav: 'Yapay zekâ spor sohbeti',
    teaser: 'Takımlarını tanıyan ve konuştuklarınızı hatırlayan bir yapay zekâ arkadaşına yaz ya da onu ara.',
    more: 'Yapay zekâ spor sohbeti hakkında',
    crumb: 'Yapay zekâ spor sohbeti',
    title: 'Yapay Zekâ Spor Sohbeti: Futbol ve Spor Konuş | BETina',
    desc: 'BETina ile yapay zekâ spor sohbeti: yaz ya da ara. Takımlarını tanır, konuştuklarınızı hatırlar, 9 dil konuşur. Ücretsiz, işin içinde para yok.',
    sticker: 'Sohbet · Sesli arama · 9 dil',
    h1: 'Yapay zekâ spor sohbeti:',
    h1b: 'BETina ile yazarak ya da sesli spor konuş.',
    lead: 'BETina, her maçı izleyen bir arkadaşınla konuşur gibi spor konuşabildiğin bir yapay zekâ arkadaşıdır. Ona yaz ya da onu ara. Takımlarını tanır, geçen hafta ne dediğini hatırlar ve sana kendi dilinde cevap verir.',
    badge: '● Şu an çevrimiçi',
    shotAlt: 'BETina uygulaması: BETina ile yapay zekâ spor sohbeti',
    facts: [
      ['24/7', 'Spor konuşmak istediğin her an orada'],
      ['9', 'Dil; sen değiştirdiğinde o da değiştirir'],
      ['11+', 'Spor, futboldan krikete'],
      ['0 €', 'Sohbet ücretsiz, işin içinde para yok'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Kısaca', h2: 'BETina’nın yapay zekâ spor sohbeti', h2b: 'nedir?',
        paras: [
          '<strong>BETina’nın yapay zekâ spor sohbeti, spor için yaşayan bir yapay zekâ arkadaşıyla yaptığın sohbettir.</strong> BETina uygulamasının kalbi burasıdır. Bir soru sorarsın ya da maçtan sonra aklından geçeni söylersin; BETina da fikri olan biri gibi cevap verir: kısa, net ve maçı gerçekten izlemiş birinin tonuyla.',
          'Çoğu yapay zekâ spor sohbet botu, tek bir lige ya da tek bir yayıncıya bağlı soru-cevap aracıdır. BETina ise bütün sporlarda aynı kişiliktir. Hangi takımları tuttuğunu bilir, daha önce anlattıklarını gündeme getirir ve yazmak yavaş geldiğinde onu arayabilirsin. Aynı sohbette yapay zekâ ile futbol, tenis ya da NFL konuşabilirsin.',
        ],
      },
      {
        type: 'cards', kicker: 'Konular', h2: 'Yapay zekâ ile futbol konuş,', h2b: 'başka her sporu da.',
        items: [
          { t: 'Takımların ve maç haftan', p: 'İlk on birler, form durumu, kimsenin anlamadığı o oyuncu değişikliği. BETina favori takımlarını tanır ve canlı futbol skorları elinin altındadır; yani seninle aynı sayfadadır.' },
          { t: 'Kurallar, tarih ve tartışmalar', p: 'O pozisyon neden ofsayttı? Hangisi daha iyi 10 numaraydı? Kısa bir açıklama iste ya da tüm zamanların en iyi takımı üzerine tartışma başlat.' },
          { t: 'Tek bir lig değil, bütün sporlar', p: 'Futbol, tenis, NFL, MMA, kriket ve daha fazlası. Yeni bir sporu sıfırdan öğren ya da yirmi yıldır takip ettiğin sporda derine in.' },
        ],
      },
      {
        type: 'chat', kicker: 'Örnekler', h2: 'BETina ile', h2b: 'üç sohbet.',
        label: 'Örnek sohbet: bir kuralın açıklaması',
        paras: [
          '<strong>Kural sorusu.</strong> Bir golün iptal edildiğini gördün ve kural kitabı okumadan nedenini öğrenmek istiyorsun. BETina üç cümleyle açıklar ve istersen ayrıntıya girmeyi teklif eder.',
          '<strong>Ertesi sabah.</strong> Cumartesi günkü maça hâlâ sinirlisin. BETina geçen hafta orta saha için endişelendiğini hatırlar ve sohbete tam oradan devam eder.',
          '<strong>Yeni spor.</strong> Bir arkadaşın seni tenis finaline ya da NFL gecesine sürüklüyor. BETina’dan puanlamayı sade bir dille anlatmasını iste; daha ilk sette maçı takip edersin.',
        ],
        msgs: [
          ['me', 'O gol neden iptal edildi? Bana aynı hizada gibi geldi.'],
          ['b', 'Aynı hiza sorun değil ama pas çıktığı anda omzu son savunmacıyı geçmişti. Omuz sayılır, kol sayılmaz.'],
          ['me', 'O kadar az mı?'],
          ['b', 'Birkaç santim. Acıtıyor, biliyorum. Çizginin nasıl çekildiğini 20 saniyede anlatayım mı?'],
        ],
        note: 'Temsilî örnektir. BETina bir yapay zekâdır ve hata yapabilir.',
      },
      {
        type: 'shot', flip: true, kicker: 'Sesli arama', h2: 'BETina’yı ara:', h2b: 'yapay zekâ ile sesli spor sohbeti.', img: 'screen-call',
        alt: 'BETina uygulaması: BETina ile sesli arama',
        paras: [
          'Bazen insanın yazası gelmez. Uygulamada <strong>BETina’yı arayıp sporu sesli konuşabilirsin</strong>; eller serbest, stada giderken ya da maç arka planda açıkken. Dinler, sesli cevap verir ve sözünü kestiğinde ayak uydurur; tıpkı bir telefon görüşmesi gibi.',
          'Aramada da sohbette bildiği her şeyi bilir: takımlarını, önceki konuşmalarınızı ve canlı futbol skorlarını. Sesli aramalar ücretsizdir ve günlük bir arama süresiyle gelir.',
        ],
      },
      {
        type: 'prose', kicker: 'Hafıza', h2: 'Takımlarını ve son sohbetinizi', h2b: 'hatırlar.',
        paras: [
          'Her seferinde sıfırdan başlamak zorunda kalmayınca sohbet güzelleşir. BETina hangi takımları ve sporları takip ettiğini, ona neler anlattığını aklında tutar; böylece ertesi hafta derbinin nasıl geçtiğini ya da dizinin halı saha maçından sağ çıkıp çıkmadığını sorabilir.',
          'Bu hafızanın kontrolü sende. Sohbet geçmişinin ya da BETina’nın senin hakkında hatırladıklarının silinmesini isteyebilirsin; hesabını sildiğinde hepsi tamamen kaldırılır. Ayrıntılar <a href="/delete-account">hesap ve veri sayfasında</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Diller', h2: 'Tek arkadaş,', h2b: 'dokuz dil.',
        intro: 'BETina, hangi dilde yazar ya da konuşursan o dilde cevap verir; sen değiştirdiğinde o da değiştirir. Bu da onu, bir ligi bir dilde takip edip başka bir dilde yaşayanlar için biçilmiş bir yapay zekâ spor sohbeti yapar.',
        items: [
          '<strong>Türkçe</strong>', '<strong>İngilizce</strong> (English)', '<strong>Almanca</strong> (Deutsch)', '<strong>İspanyolca</strong> (Español)', '<strong>Fransızca</strong> (Français)',
          '<strong>Portekizce</strong> (Português)', '<strong>İtalyanca</strong> (Italiano)', '<strong>Rumence</strong> (Română)', '<strong>Hırvatça</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'Açık konuşalım', h2: 'BETina', h2b: 'ne değildir?',
        paras: [
          '<strong>BETina bir yapay zekâdır, gerçek bir insan değildir.</strong> Bir kişiliği ve fikirleri vardır ama bunları yazılım üretir; her yapay zekâ gibi o da bilgilerde yanılabilir. Spor hakkında söylediklerini doğrulanmış bir kaynak olarak değil, üzerine tartışılacak bir görüş olarak al.',
          'Danışman da değildir. BETina yetişkinlere (18+) yönelik bir eğlence uygulamasıdır ve uygulamanın hiçbir yerinde para yoktur. Bir maç hakkındaki yorumu sohbettir, o kadar.',
        ],
      },
      {
        type: 'steps', kicker: 'Hemen başla', h2: 'Sohbete', h2b: 'nasıl başlarsın?',
        items: [
          { t: 'BETina’yı indir', p: 'Ücretsiz uygulamayı App Store ya da Google Play’den indir ya da web uygulamasını tarayıcında aç.' },
          { t: 'Giriş yap ve takımlarını seç', p: 'Apple, Google, e-posta ya da telefonla giriş yap; önem verdiğin takımları ve sporları seç.' },
          { t: 'Merhaba de', p: 'İlk mesajını yaz ya da onu aramak için mikrofona dokun. Nereden başlayacağını bilmiyorsan bu akşamki maçı sor.' },
        ],
      },
    ],
    faqH2: 'Yapay zekâ spor sohbeti', faqH2b: 'hakkında sorular.',
    faq: [
      ['Gerçekten bir yapay zekâ ile spor konuşabilir miyim?', 'Evet. BETina, spor için geliştirilmiş bir yapay zekâ arkadaşıdır. Ona yazabilir ya da onu arayabilir; maçlar, takımlar, kurallar ve spor tarihi hakkında konuşabilirsin.'],
      ['Yapay zekâ spor sohbeti ücretsiz mi?', 'Evet. BETina ile sohbet iPhone, Android ve web’de ücretsizdir. Sesli aramalar da günlük bir arama süresiyle dahildir.'],
      ['Gerçek para söz konusu mu?', 'Hayır. BETina bir eğlence uygulamasıdır. Uygulamanın hiçbir yerinde para yatırılmaz ve ödeme yapılmaz.'],
      ['BETina ile hangi sporları konuşabilirim?', 'Futbol, tenis, NFL, MMA, kriket ve daha pek çoğunu. Uygulamadaki canlı skorlar futbol için sunulur.'],
      ['BETina favori takımımı ve önceki sohbetlerimizi hatırlıyor mu?', 'Evet. Favori takımlarını ve ona anlattıklarını aklında tutar, sonradan bunlara döner. Bu verilerin silinmesini istediğin zaman isteyebilirsin.'],
      ['BETina ile sesli arama nasıl çalışıyor?', 'Aramayı başlatmak için sohbette mikrofona dokun. Sen konuşursun, BETina sesli cevap verir ve normal bir telefon görüşmesindeki gibi sözünü kesebilirsin.'],
      ['BETina hangi dilleri konuşuyor?', 'Türkçe, İngilizce, Almanca, İspanyolca, Fransızca, Portekizce, İtalyanca, Rumence ve Hırvatça. Hangi dili kullanırsan o dilde cevap verir.'],
      ['BETina gerçek bir insan mı? Cevapları her zaman doğru mu?', 'Hayır ve hayır. BETina kendi kişiliği olan bir yapay zekâdır. Hata yapabilir; bu yüzden önemli bilgileri resmî bir kaynaktan kontrol et.'],
    ],
    alsoH2: 'Uygulamada', alsoH2b: 'dahası var.',
    homeTeaser: 'BETina’nın yapabildiği her şey, tek sayfada.',
    ctaH2: 'Spor konuşacak', ctaH2b: 'biri. Her zaman.',
    ctaText: 'BETina’yı indir ve sohbeti başlat. Takımın hakkında şimdiden bir fikri var.',
  },
};
