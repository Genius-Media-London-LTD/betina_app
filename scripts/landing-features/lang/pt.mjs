// Portuguese (pt-PT) feature pages: prediction game, live scores, AI sports chat.
export default {
  local: { home: 'Início', more: 'Mais da BETina', faq: 'Perguntas e respostas', now: 'agora' },
  home: {
    moreChat: 'Mais sobre o chat de desporto com IA →',
    moreLive: 'Mais sobre os resultados ao vivo →',
    moreGame: 'Mais sobre o jogo de palpites →',
  },

  game: {
    path: '/pt/jogo-de-palpites',
    nav: 'Jogo de palpites',
    teaser: 'Dá o teu palpite para os jogos de futebol, soma pontos e passa à frente dos teus amigos. Sem dinheiro.',
    more: 'Mais sobre o jogo de palpites',
    crumb: 'Jogo de palpites',
    title: 'Jogo de palpites de futebol grátis, com amigos | BETina',
    desc: 'Jogo de palpites de futebol grátis: acerta nos resultados, soma pontos e sobe na classificação com os amigos. Sem dinheiro, com uma IA que joga contigo.',
    sticker: 'Só por diversão · Sem dinheiro',
    h1: 'Jogo de palpites de futebol grátis:',
    h1b: 'acerta nos resultados, ganha aos amigos.',
    lead: 'Dá o teu palpite antes do apito inicial, soma pontos quando acertas e sobe na classificação até passares os teus amigos. O jogo de palpites da BETina é grátis, não tem dinheiro em jogo nem pagamentos, e traz uma companheira IA que dá o seu próprio palpite para todos os jogos.',
    badge: '3 · 2 · 1',
    shotAlt: 'App BETina: jogo de palpites de futebol com classificação',
    facts: [
      ['3·2·1', 'Pontos por resultado exato, diferença de golos, vencedor certo'],
      ['5', 'Competições, da Bundesliga à Champions League'],
      ['0 €', 'Sem dinheiro em jogo, sem prémios, sem pagamentos'],
      ['9', 'Línguas em que podes jogar'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Em poucas palavras', h2: 'O que é o jogo de palpites', h2b: 'da BETina?',
        paras: [
          '<strong>O jogo de palpites da BETina é um jogo de palpites de futebol grátis dentro da app BETina.</strong> Antes de um jogo começar, escreves o resultado que esperas. Depois do apito final, a app compara o teu palpite com o resultado real e atribui pontos. São esses pontos que decidem o teu lugar na classificação, tanto na geral como nas ligas privadas que crias com os teus amigos.',
          'É o jogo que se faz há décadas nos escritórios e nos grupos de mensagens, mas sem folha de cálculo e sem dinheiro. A novidade é com quem jogas: a BETina, a companheira desportiva com IA da app, também dá palpite para todos os jogos, anima a ronda e discute de bom grado contigo o teu 3–1.',
        ],
      },
      {
        type: 'steps', kicker: 'Como funciona', h2: 'O jogo de palpites', h2b: 'em três passos.',
        items: [
          { t: 'Dá o teu palpite', p: 'Abre a lista de jogos, escolhe um encontro e escreve o resultado que esperas, por exemplo 2–1. Podes mudar o palpite as vezes que quiseres até ao apito inicial.' },
          { t: 'Acompanha o jogo', p: 'No apito inicial os palpites ficam fechados e passam a ser visíveis, por isso ninguém consegue copiar. Se seguires o jogo no BETina Live, o teu palpite aparece ao lado do resultado ao vivo.' },
          { t: 'Recebe os teus pontos', p: 'Depois do apito final, os pontos são somados automaticamente e a classificação é atualizada. Uma notificação diz-te como correu a tua jornada.' },
        ],
      },
      {
        type: 'cards', kicker: 'Pontuação', h2: 'Como se', h2b: 'pontua.',
        intro: 'Um palpite, três maneiras de pontuar. Conta o resultado ao fim dos 90 minutos mais o tempo de compensação.',
        items: [
          { big: '3', unit: 'pontos', t: 'Resultado exato', p: 'Acertaste no resultado ao golo. A melhor sensação do jogo.', eg: 'Palpite 2–1 · Resultado 2–1' },
          { big: '2', unit: 'pontos', t: 'Diferença de golos certa', p: 'Acertaste no vencedor e na margem, mas não no resultado exato. Um empate com outro resultado também conta aqui.', eg: 'Palpite 2–1 · Resultado 3–2' },
          { big: '1', unit: 'ponto', t: 'Vencedor certo', p: 'Acertaste em quem ganha, mas a margem foi outra.', eg: 'Palpite 2–1 · Resultado 3–0' },
        ],
        after: [
          'Um palpite errado não dá nada e não custa nada. Além dos palpites dos jogos, há <strong>perguntas extra</strong> que valem pontos adicionais. Cada ponto que fazes dá-te também XP para o teu nível na app.',
        ],
      },
      {
        type: 'shot', kicker: 'Com amigos', h2: 'Jogo de palpites com amigos:', h2b: 'sobe na classificação.', img: 'screen-predictor',
        alt: 'App BETina: liga de palpites com amigos e classificação',
        paras: [
          'Um jogo de palpites de futebol tem mais piada com gente que conheces. Na BETina crias uma <strong>liga privada</strong>, convidas amigos, família ou colegas e ficam com uma classificação só vossa, separada da geral. Quem estiver em primeiro na segunda-feira de manhã é quem fala.',
          'A classificação mostra quem subiu e quem desceu na última jornada, e as tuas estatísticas pessoais mostram quantas vezes acertas no resultado exato. Há ainda um desafio de equipa: no fim de cada ronda, a média do vosso grupo é comparada com a pontuação da BETina. Ganhem-lhe juntos.',
        ],
      },
      {
        type: 'chat', flip: true, kicker: 'A diferença', h2: 'Uma companheira IA que joga contigo', h2b: 'e fala de futebol contigo.',
        label: 'Exemplo de conversa sobre um palpite',
        paras: [
          'Qualquer outro jogo de palpites é um formulário e uma tabela. Na BETina o jogo tem anfitriã. <strong>A BETina dá o seu próprio palpite para todos os jogos.</strong> Os palpites dela ficam escondidos até ao apito inicial, tal como os de toda a gente, e ela aparece em todas as classificações. Tens sempre alguém a quem ganhar.',
          'E podes falar com ela sobre isso. Explica-lhe porque vês uma vitória fora, pergunta-lhe o que acha do momento de forma de uma equipa ou deixa que te pique por causa do último fim de semana. Responde na tua língua, por escrito ou numa chamada de voz. O que ela diz é uma opinião e não um conselho, e engana-se vezes suficientes para a coisa ter graça.',
        ],
        msgs: [
          ['me', 'Para sábado vou no 3–1. Demasiado ousado?'],
          ['b', 'Ousado, sim. Não marcam três em casa desde o outono. Mas gosto da confiança.'],
          ['me', 'E tu, qual foi o teu palpite?'],
          ['b', 'Boa tentativa. Vês o meu no apito inicial, como toda a gente. 😌'],
        ],
        note: 'Exemplo ilustrativo. A BETina é uma IA e pode enganar-se.',
      },
      {
        type: 'prose', kicker: 'O princípio', h2: 'Sem dinheiro, sem nada em jogo:', h2b: 'só pontos e o direito de gozar.',
        paras: [
          'O jogo de palpites da BETina joga-se por diversão. <strong>Não pões dinheiro nenhum, não compras nada e nada é pago.</strong> Não há prémios em dinheiro nem inscrições pagas, e a app nunca te vai pedir o cartão. O que ganhas são pontos, XP, um lugar na classificação e o direito de o lembrar aos teus amigos.',
          'É de propósito. A BETina é uma app de entretenimento para adultos, e o jogo serve para dar mais piada a uma jornada, jogue a tua equipa ou não.',
        ],
      },
      {
        type: 'table', kicker: 'Competições', h2: 'Competições em que', h2b: 'podes dar palpites.',
        intro: 'O jogo de palpites cobre cinco das maiores competições do futebol europeu de clubes, jornada a jornada.',
        cols: ['Competição', 'País', 'O que prevês'], hl: 0,
        rows: [
          ['Bundesliga', 'Alemanha', 'Todos os jogos de todas as jornadas'],
          ['Premier League', 'Inglaterra', 'Todos os jogos de todas as jornadas'],
          ['LaLiga', 'Espanha', 'Todos os jogos de todas as jornadas'],
          ['Serie A', 'Itália', 'Todos os jogos de todas as jornadas'],
          ['Champions League', 'Europa', 'Fase de liga e eliminatórias'],
        ],
        after: ['És tu que escolhes as competições em que queres jogar. Os pontos de todas elas contam para a classificação geral.'],
      },
    ],
    faqH2: 'Perguntas frequentes', faqH2b: 'sobre o jogo de palpites.',
    faq: [
      ['O jogo de palpites da BETina é grátis?', 'Sim. O jogo faz parte da app gratuita BETina para iPhone, Android e web. Não há inscrição paga nem subscrição.'],
      ['Há dinheiro real envolvido? Posso ganhar prémios?', 'Não. Não pões dinheiro nenhum e nada é pago. Não há prémios em dinheiro nem em espécie. Jogas por pontos, XP e pelo teu lugar na classificação.'],
      ['Como se ganham os pontos?', 'Três pontos pelo resultado exato, dois pelo vencedor certo com a diferença de golos certa, um pelo vencedor certo. Conta o resultado ao fim dos 90 minutos mais o tempo de compensação.'],
      ['Em que ligas e competições posso dar palpites?', 'Bundesliga, Premier League, LaLiga, Serie A e Champions League.'],
      ['Posso jogar o jogo de palpites com os meus amigos?', 'Sim. Cria uma liga privada na app e convida os teus amigos. Ficam com uma classificação própria, além da classificação geral.'],
      ['Até quando posso dar ou mudar um palpite?', 'Podes dar e mudar o palpite até ao apito inicial do jogo. Nesse momento fica fechado, e só então os outros o podem ver.'],
      ['O que distingue a BETina de outras apps de palpites de futebol?', 'Jogas com uma companheira IA. A BETina dá palpite para todos os jogos, aparece em todas as classificações e fala contigo sobre os teus palpites, em nove línguas.'],
      ['O jogo de palpites existe para iPhone, Android e web?', 'Sim. Podes jogar na app para iPhone, na app para Android e na app web no browser, sempre com a mesma conta.'],
    ],
    alsoH2: 'Há mais', alsoH2b: 'na app.',
    homeTeaser: 'Tudo o que a BETina sabe fazer, numa só página.',
    ctaH2: 'Achas que percebes', ctaH2b: 'de futebol? Prova-o.',
    ctaText: 'Descarrega a BETina, dá os palpites da tua primeira jornada e vê em que lugar ficas na classificação.',
  },

  live: {
    path: '/pt/resultados-ao-vivo',
    nav: 'Resultados ao vivo',
    teaser: 'Resultados de futebol ao vivo das tuas equipas e uma notificação assim que a bola entra.',
    more: 'Mais sobre o BETina Live',
    crumb: 'Resultados ao vivo',
    title: 'Resultados ao vivo de futebol com alertas de golo | BETina',
    desc: 'Resultados ao vivo de futebol das tuas equipas e uma notificação a cada golo. Pergunta à IA sobre o jogo. Grátis no iPhone, no Android e na web.',
    sticker: 'BETina Live · Futebol',
    h1: 'Resultados ao vivo de futebol',
    h1b: 'e alertas de golo das tuas equipas.',
    lead: 'O BETina Live mostra-te os resultados de futebol que te interessam e envia uma notificação para o telemóvel no momento em que a tua equipa marca. E quando quiseres saber o que se passa no jogo, basta perguntares à BETina.',
    badge: '● Em direto',
    push: 'GOLO! 1–0 aos 34 minutos.',
    shotAlt: 'App BETina: resultados ao vivo de futebol com alertas de golo das equipas que segues',
    facts: [
      ['0 €', 'Grátis na app, sem subscrição'],
      ['5', 'Momentos do jogo em que recebes uma notificação'],
      ['9', 'Línguas em que a BETina fala de futebol'],
      ['18+', 'Para adultos, sem dinheiro envolvido'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Em poucas palavras', h2: 'O que é o', h2b: 'BETina Live?',
        paras: [
          '<strong>O BETina Live é a área de resultados ao vivo de futebol da app BETina.</strong> Mostra os jogos que estão a decorrer, mantém o resultado em direto enquanto a bola rola e põe no topo as equipas que segues. Não precisas de ter a app aberta: quando acontece alguma coisa num jogo que te interessa, uma notificação avisa-te.',
          'A maior parte das apps de resultados fica por aqui. O BETina Live vive dentro de uma companheira desportiva com IA, por isso o resultado é só o início da conversa. Podes perguntar à BETina quem marcou, como ficou a tabela ou o que achou da primeira parte, no chat ou numa chamada de voz. Os resultados ao vivo existem para futebol; sobre os outros desportos falas no <a href="/pt/chat-de-desporto-com-ia">chat de desporto com IA</a>.',
        ],
      },
      {
        type: 'feed', kicker: 'Alertas de golo', h2: 'Uma notificação assim que', h2b: 'a tua equipa marca.',
        label: 'Exemplos de notificações do BETina Live',
        paras: [
          'Os alertas de golo são a razão pela qual quase toda a gente instala uma app de resultados de futebol, e são o centro do BETina Live. Segue uma equipa e recebes uma notificação push sempre que há golo no jogo dela, com o novo resultado e o minuto.',
          'As notificações só chegam para <strong>as equipas e os jogos que escolheste</strong>. Ninguém precisa de cinquenta avisos de ligas que não acompanha. Além dos golos, o BETina Live avisa-te dos outros momentos que mudam um jogo: apito inicial, cartões vermelhos, intervalo e apito final.',
          'As notificações de golo chegam ao iPhone e ao Android. Podes voltar a desligá-las nas definições quando quiseres.',
        ],
        items: [
          ['19:30', 'Apito inicial! A tua equipa está em campo.'],
          ['34′', 'GOLO! 1–0 aos 34 minutos.'],
          ['45′', 'Intervalo: 1–0. Boa primeira parte.'],
          ['67′', 'Cartão vermelho para os visitantes.'],
          ['90′', 'Fim do jogo: 2–0. Três pontos!'],
        ],
      },
      {
        type: 'steps', kicker: 'Configuração', h2: 'Como ativar as notificações de golo', h2b: 'da tua equipa.',
        intro: 'Demora mais ou menos um minuto e só o fazes uma vez.',
        items: [
          { t: 'Descarrega a BETina', p: 'Descarrega a app gratuitamente na App Store ou no Google Play e entra com Apple, Google, email ou número de telemóvel.' },
          { t: 'Escolhe as tuas equipas', p: 'Escolhe a tua equipa favorita logo no início. No separador Live podes seguir mais equipas ou apenas um jogo.' },
          { t: 'Permite as notificações', p: 'Diz que sim quando o telemóvel perguntar se a BETina pode enviar notificações. Sem isso, nenhum alerta de golo chega até ti.' },
          { t: 'Vê o jogo, ou não', p: 'Guarda o telemóvel. Da próxima vez que a tua equipa marcar, ficas a saber ainda no mesmo minuto de jogo, estejas onde estiveres.' },
        ],
      },
      {
        type: 'chat', kicker: 'A diferença', h2: 'Pergunta sobre o jogo:', h2b: 'resultados ao vivo com uma companheira IA.',
        label: 'Exemplo de conversa sobre um jogo a decorrer',
        paras: [
          'Um resultado diz-te o que aconteceu. Não te diz porquê, e também não vibra contigo. A BETina faz as duas coisas. Tem à frente os dados em direto do jogo, por isso podes perguntar-lhe o que perguntarias a uma amiga que está a ver: quem marcou, se a vantagem é merecida, o que o resultado significa para a tabela.',
          'Cada página de jogo tem ainda <strong>a leitura da BETina</strong>, um olhar curto sobre o jogo nas palavras dela, ao lado da tabela e do confronto direto entre as duas equipas. E como a BETina fala nove línguas, um adepto em Zagreb recebe em croata o mesmo jogo que um adepto em Lisboa recebe em português.',
        ],
        msgs: [
          ['me', 'Como está o nosso jogo?'],
          ['b', '1–0 para vocês desde os 34 minutos. Cabeceamento na sequência de um canto, e sinceramente já se adivinhava.'],
          ['me', 'E com isso ficamos em que lugar da tabela?'],
          ['b', 'Se ficar assim, sobem ao quarto lugar. Mais duas jornadas destas e eu começo a acreditar.'],
        ],
        note: 'Exemplo ilustrativo. A BETina é uma IA e pode enganar-se.',
      },
      {
        type: 'cards', kicker: 'Em cada página de jogo', h2: 'Mais do que', h2b: 'um número.',
        items: [
          { t: 'Resultado ao vivo e cronologia', p: 'O resultado atual, o minuto e os principais acontecimentos do jogo, pela ordem em que se deram.' },
          { t: 'Tabela e confronto direto', p: 'A tabela da liga num relance e o historial das duas equipas nos encontros anteriores.' },
          { t: 'O teu palpite mesmo ao lado', p: 'Se jogares o <a href="/pt/jogo-de-palpites" style="color:var(--lime);text-decoration:underline">jogo de palpites</a> gratuito, o resultado que previste aparece ao lado do resultado ao vivo.' },
        ],
      },
      {
        type: 'prose', kicker: 'Bom saber', h2: 'Grátis no iPhone, no Android', h2b: 'e na web.',
        paras: [
          'O BETina Live faz parte da app gratuita BETina. Não há versão paga para os resultados nem subscrição para os alertas de golo. Encontras a app na App Store e no Google Play, e podes abrir a app web no browser para ver resultados no portátil.',
          'A BETina é uma app de entretenimento para adultos. <strong>Não há dinheiro envolvido em nenhuma parte da app</strong>: não há nada para pôr em jogo e nada para receber. É criada pela GeniusBet e operada pela Genius Media London Ltd.',
        ],
      },
    ],
    faqH2: 'BETina Live:', faqH2b: 'perguntas frequentes.',
    faq: [
      ['O BETina Live é grátis?', 'Sim. Os resultados ao vivo e os alertas de golo fazem parte da app gratuita BETina para iPhone, Android e web. Não há subscrição.'],
      ['Como recebo uma notificação quando a minha equipa marca?', 'Instala a BETina, escolhe a tua equipa e permite as notificações. A partir daí recebes uma notificação sempre que houver golo num jogo de uma equipa que segues.'],
      ['Posso receber alertas de golo só de uma equipa?', 'Sim. As notificações só são enviadas para as equipas e os jogos que segues, por isso basta uma equipa. Podes acrescentar ou retirar equipas quando quiseres.'],
      ['Para que desportos há resultados ao vivo?', 'Os resultados ao vivo e os alertas de golo existem para futebol. Com a BETina podes falar de muitos outros desportos, como ténis, NFL, MMA ou críquete.'],
      ['Além dos golos, recebo notificações de quê?', 'Do apito inicial, dos cartões vermelhos, do intervalo e do resultado final dos jogos que segues.'],
      ['O que posso perguntar à IA sobre um jogo?', 'Tudo o que perguntarias a uma amiga que está a ver: o resultado, quem marcou, como está a tabela ou o que ela acha do jogo. A BETina é uma IA e pode enganar-se, por isso encara o que ela diz como uma opinião.'],
      ['Há dinheiro real envolvido?', 'Não. A BETina é uma app de entretenimento. Em nenhuma parte da app se põe dinheiro em jogo nem se recebe dinheiro.'],
    ],
    alsoH2: 'Há mais', alsoH2b: 'na app.',
    homeTeaser: 'Tudo o que a BETina sabe fazer, numa só página.',
    ctaH2: 'Nunca mais percas', ctaH2b: 'um golo.',
    ctaText: 'Descarrega a BETina, segue a tua equipa e deixa que os golos venham ter contigo.',
  },

  chat: {
    path: '/pt/chat-de-desporto-com-ia',
    nav: 'Chat de desporto com IA',
    teaser: 'Escreve ou liga a uma companheira IA que conhece as tuas equipas e se lembra das vossas conversas.',
    more: 'Mais sobre o chat de desporto com IA',
    crumb: 'Chat de desporto com IA',
    title: 'Chat de desporto com IA: fala de futebol com a BETina',
    desc: 'Chat de desporto com IA: escreve ou liga à BETina. Conhece as tuas equipas, lembra-se das vossas conversas e fala 9 línguas. Grátis, sem dinheiro.',
    sticker: 'Chat · Voz · 9 línguas',
    h1: 'Chat de desporto com IA:',
    h1b: 'fala de futebol e desporto com a BETina.',
    lead: 'A BETina é uma companheira IA com quem falas de desporto como falas com uma amiga que vê tudo. Escreve-lhe ou liga-lhe. Conhece as tuas equipas, lembra-se do que disseste na semana passada e responde na tua língua.',
    badge: '● Online agora',
    shotAlt: 'App BETina: chat de desporto com IA com a BETina',
    facts: [
      ['24/7', 'Está lá sempre que quiseres falar de desporto'],
      ['9', 'Línguas, e muda quando tu mudas'],
      ['11+', 'Desportos, do futebol ao críquete'],
      ['0 €', 'Conversar é grátis, sem dinheiro envolvido'],
    ],
    sections: [
      {
        type: 'prose', kicker: 'Em poucas palavras', h2: 'O que é o chat de desporto com IA', h2b: 'da BETina?',
        paras: [
          '<strong>O chat de desporto com IA da BETina é uma conversa com uma companheira IA que vive para o desporto.</strong> É o coração da app BETina. Fazes uma pergunta ou dizes simplesmente o que te vai na cabeça depois de um jogo, e a BETina responde como alguém com opinião: curto, direto e no tom de quem viu mesmo o jogo.',
          'A maior parte dos chatbots de desporto com IA são ferramentas de pergunta e resposta presas a uma liga ou a um canal. A BETina é uma só personalidade para todos os desportos. Sabe de que equipas és, volta a coisas que já lhe contaste e podes ligar-lhe quando escrever é lento demais. Podes falar com uma IA sobre futebol, ténis ou NFL no mesmo chat.',
        ],
      },
      {
        type: 'cards', kicker: 'Temas', h2: 'Do que podes', h2b: 'falar.',
        items: [
          { t: 'As tuas equipas e a tua jornada', p: 'Onzes, momento de forma, aquela substituição que ninguém percebeu. A BETina conhece as tuas equipas favoritas e tem à mão os resultados de futebol ao vivo, por isso está a par do mesmo que tu.' },
          { t: 'Regras, história e discussões', p: 'Porque é que aquilo foi fora de jogo? Quem foi o melhor número dez? Pede uma explicação rápida ou arranja uma discussão sobre a melhor equipa de todos os tempos.' },
          { t: 'Todos os desportos, não só uma liga', p: 'Futebol, ténis, NFL, MMA, críquete e mais. Aprende um desporto novo do zero ou vai ao pormenor naquele que acompanhas há vinte anos.' },
        ],
      },
      {
        type: 'chat', kicker: 'Exemplos', h2: 'Três conversas', h2b: 'com a BETina.',
        label: 'Exemplo de conversa: uma regra explicada',
        paras: [
          '<strong>A dúvida de regras.</strong> Viste um golo anulado e queres saber porquê, sem ler o livro das leis do jogo. A BETina explica em três frases e oferece-se para ir mais fundo.',
          '<strong>A manhã seguinte.</strong> Ainda estás irritado com o jogo de sábado. A BETina lembra-se de que na semana passada estavas preocupado com o meio-campo e retoma a conversa exatamente aí.',
          '<strong>O desporto novo.</strong> Um amigo arrasta-te para uma final de ténis ou para uma noite de NFL. Pede à BETina que te explique a pontuação por palavras simples e ao primeiro break já estás a acompanhar.',
        ],
        msgs: [
          ['me', 'Porque é que anularam o golo? A mim pareceu-me em linha.'],
          ['b', 'Em linha não há problema, mas o ombro dele já tinha passado o último defesa no momento do passe. Os ombros contam, os braços não.'],
          ['me', 'Assim tão à justa?'],
          ['b', 'Uns centímetros. Dói, eu sei. Queres a versão de 20 segundos sobre como se traça a linha?'],
        ],
        note: 'Exemplo ilustrativo. A BETina é uma IA e pode enganar-se.',
      },
      {
        type: 'shot', flip: true, kicker: 'Voz', h2: 'Liga à BETina:', h2b: 'fala de desporto com uma IA por voz.', img: 'screen-call',
        alt: 'App BETina: chamada de voz com a BETina',
        paras: [
          'Às vezes não apetece escrever. Na app podes <strong>ligar à BETina e falar de desporto por voz</strong>, sem usar as mãos, a caminho do estádio ou com o jogo a dar ao fundo. Ela ouve, responde em voz alta e acompanha-te quando a interrompes, como numa chamada normal.',
          'Numa chamada ela sabe o mesmo que no chat: as tuas equipas, as vossas conversas anteriores e os resultados de futebol ao vivo. As chamadas de voz estão incluídas gratuitamente, com um plafond diário de chamadas.',
        ],
      },
      {
        type: 'prose', kicker: 'Memória', h2: 'Lembra-se das tuas equipas', h2b: 'e da vossa última conversa.',
        paras: [
          'Uma conversa fica melhor quando não tens de começar do zero. A BETina guarda as equipas e os desportos que segues e o que lhe contaste, por isso na semana seguinte pode perguntar como te soube o dérbi ou se o teu joelho sobreviveu à futebolada com os amigos.',
          'Quem manda nessa memória és tu. Podes pedir que o teu histórico de conversas ou aquilo que a BETina guardou sobre ti seja apagado, e ao eliminares a conta desaparece tudo por completo. Os pormenores estão na <a href="/delete-account">página sobre conta e dados</a>.',
        ],
      },
      {
        type: 'ticks', kicker: 'Línguas', h2: 'Uma companheira,', h2b: 'nove línguas.',
        intro: 'A BETina responde na língua em que escreves ou falas e muda quando tu mudas. É isso que faz dela um chat de desporto com IA para quem acompanha uma liga numa língua e vive noutra.',
        items: [
          '<strong>Português</strong>', '<strong>Inglês</strong> (English)', '<strong>Alemão</strong> (Deutsch)', '<strong>Espanhol</strong> (Español)', '<strong>Francês</strong> (Français)',
          '<strong>Italiano</strong> (Italiano)', '<strong>Romeno</strong> (Română)', '<strong>Turco</strong> (Türkçe)', '<strong>Croata</strong> (Hrvatski)',
        ],
      },
      {
        type: 'prose', kicker: 'Sem rodeios', h2: 'O que a BETina', h2b: 'não é.',
        paras: [
          '<strong>A BETina é uma IA, não uma pessoa real.</strong> Tem personalidade e opiniões, mas são geradas por software e, como qualquer IA, pode errar nos factos. Encara o que ela diz sobre desporto como um ponto de vista para discutir, não como uma fonte verificada.',
          'Também não é uma conselheira. A BETina é uma app de entretenimento para adultos (18+), e não há dinheiro envolvido em nenhuma parte da app. A leitura que ela faz de um jogo é conversa, nada mais.',
        ],
      },
      {
        type: 'steps', kicker: 'Começa já', h2: 'Como começar', h2b: 'a conversar.',
        items: [
          { t: 'Descarrega a BETina', p: 'Descarrega a app gratuita na App Store ou no Google Play, ou abre a app web no browser.' },
          { t: 'Entra e escolhe as tuas equipas', p: 'Entra com Apple, Google, email ou telemóvel e escolhe as equipas e os desportos que te interessam.' },
          { t: 'Diz olá', p: 'Escreve a tua primeira mensagem ou toca no microfone para lhe ligares. Se não souberes por onde começar, pergunta pelo jogo desta noite.' },
        ],
      },
    ],
    faqH2: 'Perguntas sobre', faqH2b: 'o chat de desporto com IA.',
    faq: [
      ['Dá mesmo para falar de desporto com uma IA?', 'Sim. A BETina é uma companheira IA feita para o desporto. Podes escrever-lhe ou ligar-lhe e falar de jogos, equipas, regras e história do desporto.'],
      ['O chat de desporto com IA é grátis?', 'Sim. Conversar com a BETina é grátis no iPhone, no Android e na web. As chamadas de voz estão incluídas, com um plafond diário de chamadas.'],
      ['Há dinheiro real envolvido?', 'Não. A BETina é uma app de entretenimento. Em nenhuma parte da app se põe dinheiro em jogo nem se recebe dinheiro.'],
      ['De que desportos posso falar com a BETina?', 'De futebol, ténis, NFL, MMA, críquete e muitos mais. Os resultados ao vivo na app existem para futebol.'],
      ['A BETina lembra-se da minha equipa favorita e das conversas anteriores?', 'Sim. Guarda as tuas equipas favoritas e coisas que lhe contaste e volta a elas. Podes pedir que esses dados sejam apagados a qualquer momento.'],
      ['Como funcionam as chamadas de voz com a BETina?', 'Toca no microfone no chat para iniciar uma chamada. Tu falas, a BETina responde em voz alta e podes interrompê-la como numa chamada normal.'],
      ['Que línguas fala a BETina?', 'Português, inglês, alemão, espanhol, francês, italiano, romeno, turco e croata. Responde na língua que usares.'],
      ['A BETina é uma pessoa real? As respostas dela estão sempre certas?', 'Não e não. A BETina é uma IA com personalidade própria. Pode enganar-se, por isso confirma o que for importante numa fonte oficial.'],
    ],
    alsoH2: 'Há mais', alsoH2b: 'na app.',
    homeTeaser: 'Tudo o que a BETina sabe fazer, numa só página.',
    ctaH2: 'Alguém com quem falar', ctaH2b: 'de desporto. Sempre.',
    ctaText: 'Descarrega a BETina e começa a conversa. Ela já tem opinião sobre a tua equipa.',
  },
};
