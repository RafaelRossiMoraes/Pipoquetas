// playlists-comum.js (jQuery) — partes compartilhadas pelas páginas de playlist
// (favoritos, lista de interesses e playlist individual): ícones, linha do filme e lista.
// Depende de: jQuery e js/api.js.

window.pipoIcones = {
  "heart": '<i class="fa-solid fa-heart"></i>',
  "list-star": '<span class="ic-lista"><i class="fa-solid fa-star"></i></span>',
  "star": '<i class="fa-solid fa-star"></i>',
  "smile": '<i class="fa-solid fa-smile"></i>',
  "bookmark": '<i class="fa-solid fa-bookmark"></i>',
  "film": '<i class="fa-solid fa-film"></i>',
  "bolt": '<i class="fa-solid fa-bolt"></i>',
  "rocket": '<i class="fa-solid fa-rocket"></i>',
  "trophy": '<i class="fa-solid fa-trophy"></i>',
  "users": '<i class="fa-solid fa-users"></i>',
  "video": '<i class="fa-solid fa-video"></i>',
  "moon": '<i class="fa-solid fa-moon"></i>'
};

/** HTML do ícone de uma playlist (chave -> desenho). */
window.pipoIcone = function (chave) {
  return window.pipoIcones[chave] || window.pipoIcones["heart"];
};

/** Logotipos das plataformas que existem na pasta assets/img-logos. */
var PIPO_LOGOS = {
  "netflix": "assets/img-logos/netflix.png",
  "hbo max": "assets/img-logos/hbo-max.png",
  "amazon prime video": "assets/img-logos/prime-video.png",
  "claro tv+": "assets/img-logos/clarotv.png",
  "clarotv": "assets/img-logos/clarotv.png",
  "apple tv": "assets/img-logos/appletv.png",
  "youtube": "assets/img-logos/youtube.png",
  "mercado play": "assets/img-logos/mercado-play.png"
};

/** Nome da streaming no rodapé da linha (estilo do logo, como na referência). */
window.pipoPlataforma = function (nome) {
  if (!nome) return "";
  return '<span class="pl-item-plataforma">' + esc(nome) + "</span>";
};

/** Classificação indicativa (usa as imagens da pasta assets/img_class). */
window.pipoClassificacao = function (c) {
  if (!c) return "";
  var arq = (c === "L") ? "L" : String(c).replace(/\D/g, "");
  if (!arq) return "";
  return '<img class="pl-item-class" src="assets/img_class/' + arq + '.png" alt="' + esc(c) + ' anos">';
};

/**
 * Linha de um filme na lista (modelo da 3ª imagem de referência).
 * opcoes: { botao: "coracao" | "bandeira" | "lixeira", acao: identificador usado no data-acao }
 */
window.pipoLinhaFilme = function (f, opcoes) {
  opcoes = opcoes || {};
  var botao = "";
  if (opcoes.botao === "coracao") {
    botao = '<button class="pl-item-heart" data-acao="' + esc(opcoes.acao || "remover-favorito") + '" ' +
      'title="Remover dos favoritos" aria-label="Remover dos favoritos"><i class="fa-solid fa-heart"></i></button>';
  } else if (opcoes.botao === "bandeira") {
    botao = '<button class="pl-item-heart flag" data-acao="' + esc(opcoes.acao || "remover-lista") + '" ' +
      'title="Remover da lista de interesses" aria-label="Remover da lista de interesses"><i class="fa-solid fa-flag"></i></button>';
  } else if (opcoes.botao === "lixeira") {
    botao = '<button class="pl-item-heart" data-acao="' + esc(opcoes.acao || "remover-item") + '" ' +
      'title="Remover da playlist" aria-label="Remover da playlist"><i class="fa-solid fa-trash"></i></button>';
  }

  var elenco = $.map((f.elenco || []).slice(0, 3), function (e) { return e.ator; });
  var tags = $.map((f.generos || []).slice(0, 3), function (g) { return "<span>" + esc(g) + "</span>"; });

  return (
    '<article class="pl-item" data-id="' + esc(f.id) + '">' +
      '<div class="pl-item-info">' +
        '<div class="pl-item-head">' +
          '<h3 class="pl-item-titulo"><a href="filme.html?id=' + encodeURIComponent(f.id) + '">' + esc(f.titulo) + "</a></h3>" +
          botao +
          '<div class="pl-item-meta">' +
            (f.ano ? '<span class="pl-item-ano">' + esc(f.ano) + "</span>" : "") +
            pipoClassificacao(f.classificacao) +
            (f.nota ? '<span class="pl-item-nota"><i class="fa-solid fa-star"></i> ' + Number(f.nota).toFixed(1) + "</span>" : "") +
          "</div>" +
        "</div>" +
        (f.diretores ? '<p class="pl-item-dado"><strong>Diretores:</strong> ' + esc(f.diretores) + "</p>" : "") +
        (elenco.length ? '<p class="pl-item-dado"><strong>Elenco Principal:</strong> ' + esc(elenco.join(", ")) + "</p>" : "") +
        (f.sinopse ? '<p class="pl-item-dado"><strong>Sinopse:</strong> ' + esc(f.sinopse) + "</p>" : "") +
        '<div class="pl-item-rodape">' +
          '<div class="pl-item-tags">' + tags.join("") + "</div>" +
          pipoPlataforma(f.plataforma) +
        "</div>" +
      "</div>" +
      '<a class="pl-item-img" href="filme.html?id=' + encodeURIComponent(f.id) + '">' +
        '<img src="' + esc(f.imagem) + '" alt="' + esc(f.titulo) + '">' +
      "</a>" +
    "</article>"
  );
};

/** Desenha a lista de filmes dentro de um elemento. */
window.pipoDesenharLista = function ($alvo, filmes, opcoes) {
  if (!$alvo || !$alvo.length) return;
  if (!filmes || !filmes.length) {
    $alvo.html(window.pipoVazio(opcoes));
    return;
  }
  $alvo.html($.map(filmes, function (f) { return window.pipoLinhaFilme(f, opcoes); }).join(""));
};

/** Mensagem de lista vazia (com link para o Explore). */
window.pipoVazio = function (opcoes) {
  opcoes = opcoes || {};
  var icone = opcoes.icone || '<i class="fa-solid fa-heart"></i>';
  var texto = opcoes.texto || "Você ainda não salvou nenhum filme aqui.";
  return '<p class="pl-vazio">' + icone + esc(texto) +
    ' <a href="explore.html">Explore o catálogo</a> para adicionar filmes.</p>';
};

/** Número de filmes no plural (1 Filme / 5 Filmes). */
window.pipoTotal = function (n) {
  return n === 1 ? "1 Filme" : n + " Filmes";
};

/** Se a resposta for 401 (sem login), manda o visitante para a tela de login. */
window.pipoExigirLogin = function (x) {
  if (x && x.status === 401) {
    window.location.href = "login.html";
    return true;
  }
  return false;
};
