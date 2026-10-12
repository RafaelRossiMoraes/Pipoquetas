// filme.js (jQuery) — página de detalhe: render dinâmico via ?id= a partir de filmesData.
// Funde os 4 filme.html (dune2, interstellar, blade_runner2049, matrix_ressurection).
// Depende de: jQuery, js/dados-filmes.js (filmesData) e js/app.js.
$(function () {
  var filmes = (typeof filmesData !== "undefined") ? filmesData : [];
  var params = new URLSearchParams(window.location.search);
  var filme = null;
  $.each(filmes, function (_, f) {
    if (f.id === params.get("id")) filme = f;
  });
  if (!filme) filme = filmes[0];
  if (!filme) return;

  $(document).prop("title", filme.titulo);

  // ---------- Avaliações seed (mesmas das 4 versões) + locais ----------
  var seedReviews = [
    {
      user: "Jorel", avatar: "assets/avatar.png", nota: 1,
      texto: "NÃO GOSTEI NEM UM POUCO, ESPERAVA MUITO MAIS JÁ QUE A FRANQUIA NUNCA NOS DECEPCIONOU. COMO UM GRANDE FÃ, ESTOU ENTRISTECIDO COM A QUALIDADE DO FILME."
    },
    {
      user: "pessoa feliz", avatar: "assets/avatar2.png", nota: 4,
      texto: "Muito interessante de fato, mas não é o melhor da franquia."
    }
  ];
  function userReviews() {
    try { return JSON.parse(localStorage.getItem("pipoquetas-reviews-" + filme.id) || "[]"); }
    catch (err) { return []; }
  }

  function stars(nota) {
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html += '<i class="' + (i <= nota ? "fa-solid" : "fa-regular") + ' fa-star"></i>';
    }
    return html;
  }

  function reviewCard(r) {
    return (
      '<article class="review-card">' +
        '<header class="review-head">' +
          '<img src="' + r.avatar + '" alt="' + r.user + '" class="review-avatar">' +
          "<div>" +
            '<strong class="review-user">' + r.user + "</strong>" +
            '<div class="review-stars" aria-label="' + r.nota + ' de 5 estrelas">' + stars(r.nota) + "</div>" +
          "</div>" +
        "</header>" +
        '<p class="review-text">' + r.texto + "</p>" +
      "</article>"
    );
  }

  // ---------- Render principal ----------
  var $page = $("#moviePage");
  if ($page.length) {
    var relacionados = $.grep($.map(filme.relacionados || [], function (id) {
      var achado = null;
      $.each(filmes, function (_, f) { if (f.id === id) achado = f; });
      return achado;
    }), Boolean);

    var classImg = filme.classificacao
      ? '<img class="class-indicativa" src="assets/img_class/' + (filme.classificacao === "L" ? "L" : filme.classificacao) + '.png" alt="' + filme.classificacao + ' anos">'
      : "";
    var generosHtml = $.map(filme.generos || [], function (g) {
      return '<a href="explore.html?genero=' + encodeURIComponent(g) + '">' + g + "</a>";
    }).join("");
    var watchHtml = "";
    if ((filme.ondeAssistir || []).length) {
      watchHtml =
        '<div class="watch-card"><h3>Onde Assistir</h3><div class="watch-grid">' +
        $.map(filme.ondeAssistir, function (w) {
          return (
            '<div class="watch-item">' +
              '<img class="watch-logo" src="' + w.logo + '" alt="' + w.nome + '">' +
              '<span class="watch-name">' + w.nome + "</span>" +
              '<a href="' + w.url + '" target="_blank" rel="noopener" class="watch-price">' + w.preco + "</a>" +
            "</div>"
          );
        }).join("") +
        "</div></div>";
    }
    var relacionadosHtml = "";
    if (relacionados.length) {
      relacionadosHtml =
        '<div class="related-card"><h3>Relacionados</h3>' +
        $.map(relacionados, function (r) {
          return (
            '<a href="filme.html?id=' + encodeURIComponent(r.id) + '" class="related-item">' +
              '<img src="' + r.imagem + '" alt="' + r.titulo + '">' +
              "<div><h4>" + r.titulo + "</h4>" +
              "<p><i class=\"fa-solid fa-star\"></i> " + Number(r.nota || 0).toFixed(1) + " | " + (r.ano || "") + "</p></div>" +
            "</a>"
          );
        }).join("") +
        "</div>";
    }
    var elencoHtml = "";
    if ((filme.elenco || []).length) {
      elencoHtml =
        '<div class="cast-card"><h3><a href="#">Elenco ></a></h3><div class="cast-row">' +
        $.map(filme.elenco, function (c) {
          return (
            '<a href="#" class="cast-member">' +
              '<img src="' + c.foto + '" alt="' + c.personagem + '">' +
              "<span>" + c.personagem + "</span>" +
              "<span>" + c.ator + "</span>" +
            "</a>"
          );
        }).join("") +
        "</div></div>";
    }

    $page.html(
      '<section class="movie-info">' +
        '<div class="trailer" id="trailer" data-video-id="' + (filme.trailerYoutubeId || "") + '">' +
          '<button class="trailer-play" aria-label="Reproduzir trailer"><i class="fa-solid fa-play"></i></button>' +
          '<span class="trailer-yt"><i class="fa-solid fa-play"></i></span>' +
        "</div>" +
        '<h2 class="movie-title">' + filme.titulo + (filme.ano ? " (" + filme.ano + ")" : "") + "</h2>" +
        '<div class="movie-meta">' + classImg +
          (filme.duracao ? '<span class="meta-sep"></span><span>' + filme.duracao + "</span>" : "") +
          (filme.ano ? '<span class="meta-sep"></span><span>' + filme.ano + "</span>" : "") +
        "</div>" +
        '<div class="movie-genres">' + generosHtml + "</div>" +
        watchHtml +
      "</section>" +
      '<aside class="movie-aside">' +
        '<div class="score-card"><i class="fa-solid fa-star"></i>' +
          '<div class="score-value">' + Number(filme.nota || 0).toFixed(1) +
            (filme.numAvaliacoes ? '<span class="score-count">' + filme.numAvaliacoes + " Avaliações</span>" : "") +
          "</div>" +
        "</div>" +
        relacionadosHtml +
        elencoHtml +
      "</aside>"
    );

    // Trailer: troca a capa pelo player do YouTube
    $("#trailer").on("click", function () {
      var $trailer = $(this);
      if ($trailer.hasClass("playing") || !filme.trailerYoutubeId) return;
      var $iframe = $("<iframe>", {
        src: "https://www.youtube.com/embed/" + filme.trailerYoutubeId + "?autoplay=1&rel=0",
        title: "Trailer de " + filme.titulo,
        allow: "autoplay; encrypted-media; picture-in-picture; fullscreen"
      });
      $iframe.prop("allowFullscreen", true);
      $iframe.attr("referrerpolicy", "strict-origin-when-cross-origin");
      $trailer.addClass("playing").empty().append($iframe);
    });
  }

  // ---------- Avaliações ----------
  var $reviewsSection = $("#reviewsList");
  function renderReviews() {
    if (!$reviewsSection.length) return;
    $reviewsSection.html($.map(userReviews().concat(seedReviews), reviewCard).join(""));
  }
  renderReviews();

  var $reviewForm = $("#reviewForm");
  if ($reviewForm.length) {
    $reviewForm.on("submit", function (e) {
      e.preventDefault();
      var texto = $.trim($("#reviewTexto").val());
      var nota = Number($("#reviewNota").val()) || 5;
      if (!texto) return;
      var lista = userReviews();
      lista.unshift({ user: "Você", avatar: "assets/avatar.png", nota: nota, texto: texto });
      try { localStorage.setItem("pipoquetas-reviews-" + filme.id, JSON.stringify(lista)); } catch (err) { /* sem storage */ }
      $reviewForm.trigger("reset");
      renderReviews();
    });
  }
});
