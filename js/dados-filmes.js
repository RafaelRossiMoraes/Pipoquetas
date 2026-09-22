// Gerado originalmente por gerar_dados_filmes.py (TMDB) + curadoria local.
// Não chama a API em tempo de execução — apenas leitura local.
// Campos:
//   id, titulo, ano, duracao, generos[], classificacao ("L","10","12","14","16","18"),
//   avaliacao (nota TMDB 0-10), nota (nota do site 0-5), numAvaliacoes,
//   plataforma, imagem, secao ("recomendados" | "mais-assistidos"),
//   sinopse, trailerYoutubeId, elenco[{personagem, ator, foto}],
//   ondeAssistir[{nome, logo, url, preco}], relacionados[id...]
const filmesData = [
  {
    id: "duna-parte-2",
    titulo: "Duna: Parte 2",
    ano: "2024",
    duracao: "2h46min",
    generos: ["Ficção científica", "Aventura"],
    classificacao: "14",
    avaliacao: 8.2,
    nota: 4.1,
    numAvaliacoes: 3174,
    plataforma: "HBO Max",
    imagem: "assets/img-filmes/dune.png",
    secao: "recomendados",
    sinopse: "Paul Atreides se une a Chani e aos Fremen para travar a guerra contra os Harkonnen e impedir o futuro sombrio que apenas ele consegue prever.",
    trailerYoutubeId: "QqmbrvluQRA",
    elenco: [
      { personagem: "Paul Atreides", ator: "Timothée Chalamet", foto: "assets/img-elenco/timothee_chalamet.jpg" },
      { personagem: "Feyd-Rautha", ator: "Austin Butler", foto: "assets/img-elenco/austin_butler.jpg" },
      { personagem: "Irulan Corrino", ator: "Florence Pugh", foto: "assets/img-elenco/florence_pugh.jpg" }
    ],
    ondeAssistir: [
      { nome: "Youtube", logo: "assets/img-logos/youtube.png", url: "https://www.youtube.com/watch?v=md6Pfk_9nqw", preco: "R$ 19,90" },
      { nome: "Claro TV+", logo: "assets/img-logos/clarotv.png", url: "https://www.clarotvmais.com.br/filme/~/3030069", preco: "R$ 9,90" },
      { nome: "Prime Video", logo: "assets/img-logos/prime-video.png", url: "https://www.primevideo.com/dp/amzn1.dv.gti.9392c069-96f9-421b-ac7a-275308e1327a?autoplay=0&ref_=atv_cf_strg_wb", preco: "R$ 11,90" },
      { nome: "Mercado Play", logo: "assets/img-logos/mercado-play.png", url: "https://play.mercadolivre.com.br/assistir/duna-parte-dois/019c093aa4ce47bf9c8fda0f5ebaf9d5?origin=google_media_actions_feed&matt_tool=39220561", preco: "R$ 8,90" },
      { nome: "HBO MAX", logo: "assets/img-logos/hbo-max.png", url: "https://www.hbomax.com/br/pt/movie/f0a4f239-0b57-47e2-a39a-54fb96925e61?utm_source=universal_search", preco: "Assine" }
    ],
    relacionados: ["interestelar", "matrix-resurrections", "blade-runner-2049"]
  },
  {
    id: "interestelar",
    titulo: "Interestelar",
    ano: "2014",
    duracao: "2h49min",
    generos: ["Aventura", "Drama", "Ficção científica"],
    classificacao: "10",
    avaliacao: 8.5,
    nota: 3.9,
    numAvaliacoes: 4573,
    plataforma: "HBO Max",
    imagem: "assets/img-filmes/interestellar.png",
    secao: "recomendados",
    sinopse: "As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial, possibilitando a continuação da espécie. Cooper é chamado para liderar o grupo e aceita a missão sabendo que pode nunca mais ver os filhos. Ao lado de Brand, Jenkins e Doyle, ele seguirá em busca de um novo lar.",
    trailerYoutubeId: "zSWdZVtXT7E",
    elenco: [
      { personagem: "Joseph Cooper", ator: "Matthew McConaughey", foto: "assets/img-elenco/matthew_mcconaughey.jpg" },
      { personagem: "Amelia Brand", ator: "Anne Hathaway", foto: "assets/img-elenco/anne_hathaway.jpg" },
      { personagem: "John Brand", ator: "Michael Caine", foto: "assets/img-elenco/michael_caine.jpg" }
    ],
    ondeAssistir: [
      { nome: "Youtube", logo: "assets/img-logos/youtube.png", url: "https://www.youtube.com/watch?v=O5rXlNRjyUE", preco: "R$ 19,90" },
      { nome: "Apple TV", logo: "assets/img-logos/appletv.png", url: "https://tv.apple.com/br/movie/interstellar/umc.cmc.1xfut1sq2hvb9faupyabxog7q", preco: "R$ 19,90" },
      { nome: "Prime Video", logo: "assets/img-logos/prime-video.png", url: "https://www.primevideo.com/dp/amzn1.dv.gti.bd6bd6ed-93ce-41f7-a06d-3a1277b94fcb?autoplay=0&ref_=atv_cf_strg_wb", preco: "R$ 11,90" },
      { nome: "Mercado Play", logo: "assets/img-logos/mercado-play.png", url: "https://play.mercadolivre.com.br/assistir/the-matrix-resurrections/d31890fb71ed47a6bc15a12909c5229a?origin=google_media_actions_feed&matt_tool=39220561", preco: "R$ 8,90" },
      { nome: "HBO MAX", logo: "assets/img-logos/hbo-max.png", url: "https://www.hbomax.com/br/pt/movie/59f8d3bb-5c45-431d-80cd-331eafac0b81?utm_source=universal_search", preco: "Assine" }
    ],
    relacionados: ["duna-parte-2", "matrix-resurrections", "blade-runner-2049"]
  },
  {
    id: "blade-runner-2049",
    titulo: "Blade Runner 2049",
    ano: "2017",
    duracao: "2h43min",
    generos: ["Ficção científica", "Drama"],
    classificacao: "14",
    avaliacao: 7.6,
    nota: 2.7,
    numAvaliacoes: 2346,
    plataforma: "HBO Max",
    imagem: "assets/img-filmes/bladerunner.png",
    secao: "recomendados",
    sinopse: "Trinta anos após os acontecimentos do primeiro filme, um novo blade runner, o oficial K da polícia de Los Angeles, desenterra um segredo há muito enterrado que tem o potencial de mergulhar o que resta da sociedade no caos. A descoberta de K o leva a uma busca para encontrar Rick Deckard, um ex-blade runner do LAPD que está desaparecido há 30 anos.",
    trailerYoutubeId: "gCcx85zbxz4",
    elenco: [
      { personagem: "K", ator: "Ryan Gosling", foto: "assets/img-elenco/ryan_gosling.jpg" },
      { personagem: "Rick Deckard", ator: "Harrison Ford", foto: "assets/img-elenco/harrison_ford.jpg" },
      { personagem: "Joi", ator: "Ana de Armas", foto: "assets/img-elenco/ana_de_armas.jpg" }
    ],
    ondeAssistir: [
      { nome: "Youtube", logo: "assets/img-logos/youtube.png", url: "https://www.youtube.com/watch?v=qbRN3ZD8gI4", preco: "R$ 3,90" },
      { nome: "Claro TV+", logo: "assets/img-logos/clarotv.png", url: "https://www.clarotvmais.com.br/filme/~/1709922", preco: "R$ 9,90" },
      { nome: "Prime Video", logo: "assets/img-logos/prime-video.png", url: "https://www.primevideo.com/dp/amzn1.dv.gti.c5d0912f-4e6c-46f0-9f52-bdf1f17e2841?autoplay=0&ref_=atv_cf_strg_wb", preco: "R$ 11,90" },
      { nome: "HBO MAX", logo: "assets/img-logos/hbo-max.png", url: "https://www.hbomax.com/br/pt/movie/3e2754f6-8ee9-48ef-806d-bdf3f64b6243?utm_source=universal_search", preco: "Assine" }
    ],
    relacionados: ["duna-parte-2", "interestelar", "matrix-resurrections"]
  },
  {
    id: "matrix-resurrections",
    titulo: "Matrix Resurrections",
    ano: "2021",
    duracao: "2h28min",
    generos: ["Ficção científica", "Ação", "Aventura"],
    classificacao: "14",
    avaliacao: 6.3,
    nota: 3.3,
    numAvaliacoes: 1923,
    plataforma: "HBO Max",
    imagem: "assets/img-filmes/matrixresurrections.png",
    secao: "recomendados",
    sinopse: "Em um mundo de duas realidades — a vida cotidiana e o que está por trás dela —, Thomas Anderson terá que escolher seguir o coelho branco mais uma vez. A escolha, embora seja uma ilusão, ainda é a única maneira de entrar ou sair da Matrix, que é mais forte, mais segura e mais perigosa do que nunca.",
    trailerYoutubeId: "aHmDi6CUQ3M",
    elenco: [
      { personagem: "Neo", ator: "Keanu Reeves", foto: "assets/img-elenco/keanu_reeves.jpg" },
      { personagem: "Trinity", ator: "Carrie-Anne Moss", foto: "assets/img-elenco/carrie-anne_moss.jpg" },
      { personagem: "Morpheus", ator: "Yahya Abdul-Mateen II", foto: "assets/img-elenco/yahya_abdul-mateen_ii.jpg" }
    ],
    ondeAssistir: [
      { nome: "Youtube", logo: "assets/img-logos/youtube.png", url: "https://www.youtube.com/watch?v=O5rXlNRjyUE", preco: "R$ 19,90" },
      { nome: "Claro TV+", logo: "assets/img-logos/clarotv.png", url: "https://www.clarotvmais.com.br/filme/~/2908971", preco: "R$ 9,90" },
      { nome: "Apple TV", logo: "assets/img-logos/appletv.png", url: "https://tv.apple.com/br/movie/the-matrix-resurrections/umc.cmc.1xfut1sq2hvb9faupyabxog7q", preco: "R$ 19,90" },
      { nome: "Prime Video", logo: "assets/img-logos/prime-video.png", url: "https://www.primevideo.com/dp/amzn1.dv.gti.bd6bd6ed-93ce-41f7-a06d-3a1277b94fcb?autoplay=0&ref_=atv_cf_strg_wb", preco: "Assine" },
      { nome: "Mercado Play", logo: "assets/img-logos/mercado-play.png", url: "https://play.mercadolivre.com.br/assistir/the-matrix-resurrections/d31890fb71ed47a6bc15a12909c5229a?origin=google_media_actions_feed&matt_tool=39220561", preco: "R$ 8,90" },
      { nome: "HBO MAX", logo: "assets/img-logos/hbo-max.png", url: "https://www.hbomax.com/br/pt/movie/59f8d3bb-5c45-431d-80cd-331eafac0b81?utm_source=universal_search", preco: "Assine" }
    ],
    relacionados: ["duna-parte-2", "interestelar", "blade-runner-2049"]
  },
  {
    id: "star-wars-ep2",
    titulo: "Star Wars: Episódio II - Ataque dos Clones",
    ano: "2002",
    generos: ["Aventura", "Ação", "Ficção científica"],
    classificacao: "L",
    avaliacao: 6.6,
    nota: 3.3,
    plataforma: "Disney Plus",
    imagem: "assets/img-filmes/starwarsepisodeii.png",
    secao: "recomendados",
    sinopse: "Com a missão de proteger a Senadora Amidala, Anakin Skywalker descobre o seu amor por ela, do mesmo modo que vai conhecendo seu lado sombrio. Obi-Wan Kenobi descobre um exército de clones à medida que a Galáxia caminha para uma grande guerra."
  },
  {
    id: "homem-aranha-aranhaverso",
    titulo: "Homem-Aranha: Através do Aranhaverso",
    ano: "2023",
    generos: ["Animação", "Ação", "Aventura", "Ficção científica"],
    classificacao: "10",
    avaliacao: 8.3,
    nota: 4.2,
    plataforma: "Netflix",
    imagem: "assets/img-filmes/homemaranhaspiderverso.png",
    secao: "mais-assistidos",
    sinopse: "Miles Morales retorna para o próximo capítulo da saga do Aranhaverso, uma aventura épica que transportará o Homem-Aranha em tempo integral e amigável do bairro do Brooklyn através do Multiverso para unir forças com Gwen Stacy e uma nova equipe de Homens-Aranha para enfrentar com um vilão mais poderoso do que qualquer coisa que eles já encontraram."
  },
  {
    id: "filme-1917",
    titulo: "1917",
    ano: "2019",
    generos: ["Guerra", "Drama", "História"],
    classificacao: "14",
    avaliacao: 8.0,
    nota: 4.0,
    plataforma: "Amazon Prime Video",
    imagem: "assets/img-filmes/1917.png",
    secao: "mais-assistidos",
    sinopse: "Os cabos Schofield e Blake são jovens soldados britânicos durante a Primeira Guerra Mundial. Quando eles são encarregados de uma missão aparentemente impossível, os dois precisam atravessar território inimigo, lutando contra o tempo, para entregar uma mensagem que pode salvar cerca de 1600 colegas de batalhão."
  },
  {
    id: "titanic",
    titulo: "Titanic",
    ano: "1997",
    generos: ["Drama", "Romance"],
    classificacao: "12",
    avaliacao: 7.9,
    nota: 4.0,
    plataforma: "Disney Plus",
    imagem: "assets/img-filmes/titanic.png",
    secao: "mais-assistidos",
    sinopse: "Um artista pobre e uma jovem rica se conhecem e se apaixonam na fatídica jornada do Titanic, em 1912. Embora esteja noiva do arrogante herdeiro de uma siderúrgica, a jovem desafia sua família e amigos em busca do verdadeiro amor."
  },
  {
    id: "capitao-america-guerra-civil",
    titulo: "Capitão América: Guerra Civil",
    ano: "2016",
    generos: ["Aventura", "Ação", "Ficção científica"],
    classificacao: "12",
    avaliacao: 7.5,
    nota: 3.8,
    plataforma: "Disney Plus",
    imagem: "assets/img-filmes/capitaoamericaguerracivil.png",
    secao: "mais-assistidos",
    sinopse: "Depois do ataque de Ultron, os políticos decidem controlar os Vingadores, já que suas ações afetam toda a humanidade. A decisão coloca o Capitão América em rota de colisão com o Homem de Ferro."
  },
  {
    id: "estrelas-alem-do-tempo",
    titulo: "Estrelas Além do Tempo",
    ano: "2016",
    generos: ["Drama", "História"],
    classificacao: "L",
    avaliacao: 8.0,
    nota: 4.0,
    plataforma: "Disney Plus",
    imagem: "assets/img-filmes/estrelasalemdotempo.png",
    secao: "mais-assistidos",
    sinopse: "Ano 1961, em plena Guerra Fria, Estados Unidos e União Soviética disputam a supremacia na corrida espacial ao mesmo tempo em que a sociedade norte-americana lida com uma profunda cisão racial, entre brancos e negros. Tal situação é refletida também na NASA, onde um grupo de funcionárias negras é obrigada a trabalhar a parte. É lá que estão Katherine Johnson, Dorothy Vaughn e Mary Jackson, grandes amigas que, além de provar sua competência dia após dia, precisam lidar com o preconceito arraigado para que consigam ascender na hierarquia da NASA."
  }
];
