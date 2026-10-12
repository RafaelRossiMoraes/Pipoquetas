// explore.js (jQuery) — catálogo com filtros funcionais.
// Adaptação para jQuery da lógica de gerar_dados_filmes.py:
//   extrair_classificacao / extrair_plataforma / buscar_filme viram
//   extração de opções e filtragem sobre filmesData (leitura local, sem API).
// Depende de: jQuery, js/dados-filmes.js (filmesData) e js/app.js.
$(function () {
  var filmes = (typeof filmesData !== "undefined") ? filmesData : [];
  var $grid = $(".movies-grid");
  if (!$grid.length) return;

  var params = new URLSearchParams(window.location.search);
  var $selGenero = $("#filtro-genero");
  var $selClassificacao = $("#filtro-classificacao");
  var $selLancamento = $("#filtro-lancamento");
  var $selNota = $("#filtro-nota");
  var $selStreaming = $("#filtro-streaming");
  var $btnAplicar = $(".btn-filter-apply");
  var $btnApagar = $(".btn-filter-reset");

  // ---------- Extração das opções (equivale ao mapeamento do .py) ----------
  // Lista única ordenada (sem duplicadas, sem vazias).
  function unicosOrdenados(arr) {
    var vistos = {};
    var lista = $.grep(arr, function (item) {
      if (item === undefined || item === null || item === "") return false;
      var chave = String(item);
      if (vistos[chave]) return false;
      vistos[chave] = true;
      return true;
    });
    lista.sort();
    return lista;
  }
  var generos = unicosOrdenados($.map(filmes, function (f) { return f.generos || []; }));
  var classificacoes = unicosOrdenados($.map(filmes, function (f) { return f.classificacao; }));
  var anos = unicosOrdenados($.map(filmes, function (f) { return f.ano; })).reverse();
  var streamings = unicosOrdenados($.map(filmes, function (f) { return f.plataforma; }));

  function preencher($select, opcoes, rotulo) {
    if (!$select || !$select.length) return;
    var html = '<option value="">' + (rotulo || "Todos") + "</option>" +
      $.map(opcoes, function (o) { return '<option value="' + o + '">' + o + "</option>"; }).join("");
    $select.html(html);
  }

  preencher($selGenero, generos, "Todos os gêneros");
  preencher($selClassificacao, $.map(classificacoes, function (c) { return (c === "L" ? "Livre" : c + " anos"); }), "Todas");
  if ($selClassificacao.length) {
    $selClassificacao.find("option").each(function (i) {
      if (i > 0) $(this).val(classificacoes[i - 1]);
    });
  }
  preencher($selLancamento, anos, "Todos os anos");
  preencher($selStreaming, streamings, "Todos");
  preencher($selNota, ["4.5+", "4.0+", "3.5+", "3.0+"], "Qualquer nota");

  // ---------- Estado inicial via URL (?q= / ?genero=) ----------
  var qInicial = (params.get("q") || "").toLowerCase();
  var generoInicial = params.get("genero") || "";
  if ($selGenero.length && generoInicial) {
    $selGenero.find("option").each(function () {
      if ($(this).val().toLowerCase() === generoInicial.toLowerCase()) {
        $selGenero.val($(this).val());
      }
    });
  }

  // ---------- Favoritos (localStorage) ----------
  function getFavoritos() {
    try { return JSON.parse(localStorage.getItem("pipoquetas-favoritos") || "[]"); }
    catch (err) { return []; }
  }

  // ---------- Render ----------
  function ageClass(c) {
    return c === "L" ? "age-l" : "age-" + String(c).replace(/\D/g, "");
  }

  function cardFilme(f) {
    var favs = getFavoritos();
    var isFav = $.inArray(f.id, favs) !== -1;
    return (
      '<article class="explore-card" data-id="' + f.id + '">' +
        '<div class="card-media">' +
          '<img src="' + f.imagem + '" alt="' + f.titulo + '">' +
          (f.ano ? '<span class="card-year">' + f.ano + "</span>" : "") +
          (f.nota ? '<span class="card-rating"><i class="fa-regular fa-star"></i> ' + Number(f.nota).toFixed(1) + "</span>" : "") +
        "</div>" +
        '<div class="card-content">' +
          (f.classificacao ? '<span class="age-badge ' + ageClass(f.classificacao) + '">' + (f.classificacao === "L" ? "AL" : "A" + f.classificacao) + "</span>" : "") +
          '<h3 class="movie-title">' + f.titulo + "</h3>" +
          '<p class="movie-description">' + (f.sinopse || "") + "</p>" +
        "</div>" +
        '<div class="card-actions">' +
          '<button aria-label="Favoritar" data-acao="fav"><i class="' + (isFav ? "fa-solid" : "fa-regular") + ' fa-heart"></i></button>' +
          '<button aria-label="Adicionar à lista" data-acao="lista"><i class="fa-regular fa-bookmark"></i></button>' +
          '<button aria-label="Remover" data-acao="remover"><i class="fa-solid fa-xmark"></i></button>' +
        "</div>" +
      "</article>"
    );
  }

  function aplicarFiltros() {
    var g = $selGenero.length ? $selGenero.val() : "";
    var c = $selClassificacao.length ? $selClassificacao.val() : "";
    var a = $selLancamento.length ? $selLancamento.val() : "";
    var n = $selNota.length ? $selNota.val() : "";
    var s = $selStreaming.length ? $selStreaming.val() : "";
    var q = qInicial;

    var lista = $.grep(filmes, function (f) {
      if (g && $.inArray(g, f.generos || []) === -1) return false;
      if (c && String(f.classificacao) !== String(c)) return false;
      if (a && String(f.ano) !== String(a)) return false;
      if (n && Number(f.nota || 0) < parseFloat(n)) return false;
      if (s && f.plataforma !== s) return false;
      if (q && ((f.titulo + " " + (f.sinopse || "")).toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });

    $grid.html(lista.length
      ? $.map(lista, cardFilme).join("")
      : '<p class="empty-state">Nenhum filme encontrado com os filtros aplicados.</p>');

    $grid.find(".explore-card").each(function () {
      var $card = $(this);
      $card.find(".card-media").on("click", function () {
        window.location.href = "filme.html?id=" + encodeURIComponent($card.data("id"));
      });
      $card.find("button[data-acao]").on("click", function (e) {
        e.stopPropagation();
        var $btn = $(this);
        var id = String($card.data("id"));
        if ($btn.data("acao") === "remover") { $card.remove(); return; }
        if ($btn.data("acao") === "fav") {
          var favs = getFavoritos();
          if ($.inArray(id, favs) !== -1) {
            favs = $.grep(favs, function (x) { return x !== id; });
          } else {
            favs.push(id);
          }
          try { localStorage.setItem("pipoquetas-favoritos", JSON.stringify(favs)); } catch (err) { /* sem storage */ }
          $btn.find("i").attr("class", ($.inArray(id, favs) !== -1 ? "fa-solid" : "fa-regular") + " fa-heart");
        }
      });
    });
  }

  $btnAplicar.on("click", aplicarFiltros);
  if ($btnApagar.length) {
    $btnApagar.on("click", function () {
      $.each([$selGenero, $selClassificacao, $selLancamento, $selNota, $selStreaming], function (_, $s) {
        if ($s && $s.length) $s.val("");
      });
      window.history.replaceState({}, "", "explore.html");
      aplicarFiltros();
    });
  }

  aplicarFiltros();
});
