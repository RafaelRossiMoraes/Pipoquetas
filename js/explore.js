// explore.js (jQuery) — catálogo com filtros funcionais.
// Adaptação para jQuery da lógica de gerar_dados_filmes.py:
//   extrair_classificacao / extrair_plataforma / buscar_filme viram
//   extração de opções e filtragem sobre filmesData (leitura local, sem API).
// A lista é renderizada em páginas para não criar centenas de cards de uma vez.
// Depende de: jQuery, js/dados-filmes.js (filmesData) e js/app.js.
$(function () {
  var filmes = (typeof filmesData !== "undefined") ? filmesData : [];
  var $grid = $(".movies-grid");
  if (!$grid.length) return;

  var TAMANHO_PAGINA = 24;
  var listaAtual = [];
  var exibidos = 0;
  var $more = $("#exploreMore");
  var $btnMais = $("#btnCarregarMais");

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
      $.map(opcoes, function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("");
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

  // ---------- Favoritos e lista de interesses (gravados no banco de dados) ----------
  // salvos.favoritos / salvos.lista guardam os ids dos filmes já salvos pelo usuário.
  var salvos = { favoritos: {}, lista: {} };

  function alternar(tipo, id, $btn, acao) {
    if (!window.pipoEhLogado) {
      window.pipoAvisoHtml('Entre na sua conta para salvar filmes. <a href="login.html">Entrar agora</a>');
      return;
    }
    $btn.prop("disabled", true);
    api("POST", "/api/" + tipo + "/" + encodeURIComponent(id)).done(function (r) {
      if (acao === "fav") {
        if (r.ativo) { salvos.favoritos[id] = true; } else { delete salvos.favoritos[id]; }
        $btn.find("i").attr("class", (r.ativo ? "fa-solid" : "fa-regular") + " fa-heart");
      } else {
        if (r.ativo) { salvos.lista[id] = true; } else { delete salvos.lista[id]; }
        $btn.find("i").attr("class", (r.ativo ? "fa-solid" : "fa-regular") + " fa-flag");
      }
      window.pipoAviso(r.ativo ? "Filme salvo!" : "Filme removido.");
    }).fail(function (x) {
      if (x && x.status === 401) {
        window.pipoAvisoHtml('Entre na sua conta para salvar filmes. <a href="login.html">Entrar agora</a>');
        return;
      }
      window.pipoAviso(erroMsg(x));
    }).always(function () {
      $btn.prop("disabled", false);
    });
  }

  function atualizarBotoes() {
    $grid.find(".explore-card").each(function () {
      var $card = $(this);
      var id = String($card.data("id"));
      $card.find("button[data-acao='fav'] i").attr("class", (salvos.favoritos[id] ? "fa-solid" : "fa-regular") + " fa-heart");
      $card.find("button[data-acao='lista'] i").attr("class", (salvos.lista[id] ? "fa-solid" : "fa-regular") + " fa-flag");
    });
  }

  // Carrega o que o usuário já salvou para deixar os botões no estado certo.
  function carregarSalvos() {
    if (!window.pipoEhLogado) return;
    api("GET", "/api/favoritos").done(function (r) {
      $.each((r && r.filmes) || [], function (_, f) { salvos.favoritos[f.id] = true; });
      atualizarBotoes();
    });
    api("GET", "/api/lista-interesses").done(function (r) {
      $.each((r && r.filmes) || [], function (_, f) { salvos.lista[f.id] = true; });
      atualizarBotoes();
    });
  }

  $(document).on("pipo:auth", function (e, logado) {
    if (logado) { aplicarFiltros(); carregarSalvos(); }
  });

  // ---------- Render ----------
  function ageClass(c) {
    return c === "L" ? "age-l" : "age-" + String(c).replace(/\D/g, "");
  }

  function cardFilme(f) {
    var isFav = !!salvos.favoritos[f.id];
    var isLista = !!salvos.lista[f.id];
    return (
      '<article class="explore-card" data-id="' + esc(f.id) + '">' +
        '<div class="card-media">' +
          '<img src="' + esc(f.imagem) + '" alt="' + esc(f.titulo) + '" loading="lazy" decoding="async">' +
          (f.ano ? '<span class="card-year">' + esc(f.ano) + "</span>" : "") +
          (f.nota ? '<span class="card-rating"><i class="fa-regular fa-star"></i> ' + Number(f.nota).toFixed(1) + "</span>" : "") +
        "</div>" +
        '<div class="card-content">' +
          (f.classificacao ? '<span class="age-badge ' + ageClass(f.classificacao) + '">' + (f.classificacao === "L" ? "AL" : "A" + esc(f.classificacao)) + "</span>" : "") +
          '<h3 class="movie-title">' + esc(f.titulo) + "</h3>" +
          '<p class="movie-description">' + esc(f.sinopse || "") + "</p>" +
        "</div>" +
        '<div class="card-actions">' +
          '<button aria-label="Favoritar" title="Salvar nos favoritos" data-acao="fav"><i class="' + (isFav ? "fa-solid" : "fa-regular") + ' fa-heart"></i></button>' +
          '<button aria-label="Adicionar à lista de interesses" title="Salvar na lista de interesses" data-acao="lista"><i class="' + (isLista ? "fa-solid" : "fa-regular") + ' fa-flag"></i></button>' +
          '<button aria-label="Remover" title="Remover da tela" data-acao="remover"><i class="fa-solid fa-xmark"></i></button>' +
        "</div>" +
      "</article>"
    );
  }

  // Acrescenta o próximo lote de cards e controla o botão "Carregar mais".
  function renderPagina() {
    if (exibidos >= listaAtual.length) { $more.prop("hidden", true); return; }
    var lote = listaAtual.slice(exibidos, exibidos + TAMANHO_PAGINA);
    exibidos += lote.length;
    $grid.append($.map(lote, cardFilme).join(""));
    $more.prop("hidden", exibidos >= listaAtual.length);
    atualizarBotoes();
  }

  function aplicarFiltros() {
    var g = $selGenero.length ? $selGenero.val() : "";
    var c = $selClassificacao.length ? $selClassificacao.val() : "";
    var a = $selLancamento.length ? $selLancamento.val() : "";
    var n = $selNota.length ? $selNota.val() : "";
    var s = $selStreaming.length ? $selStreaming.val() : "";
    var q = qInicial;

    listaAtual = $.grep(filmes, function (f) {
      if (g && $.inArray(g, f.generos || []) === -1) return false;
      if (c && String(f.classificacao) !== String(c)) return false;
      if (a && String(f.ano) !== String(a)) return false;
      if (n && Number(f.nota || 0) < parseFloat(n)) return false;
      if (s && f.plataforma !== s) return false;
      if (q && ((f.titulo + " " + (f.sinopse || "")).toLowerCase().indexOf(q) === -1)) return false;
      return true;
    });

    exibidos = 0;
    $grid.empty();

    if (!listaAtual.length) {
      $grid.html('<p class="empty-state">Nenhum filme encontrado com os filtros aplicados.</p>');
      $more.prop("hidden", true);
      return;
    }
    renderPagina();
  }

  // Delegação única: os cards são recriados a cada filtro/página.
  $grid.on("click", ".card-media", function () {
    var id = $(this).closest(".explore-card").data("id");
    window.location.href = "filme.html?id=" + encodeURIComponent(id);
  });

  $grid.on("click", "button[data-acao]", function (e) {
    e.stopPropagation();
    var $btn = $(this);
    var $card = $btn.closest(".explore-card");
    var id = String($card.data("id"));
    var acao = $btn.data("acao");
    if (acao === "remover") { $card.remove(); return; }
    if (acao === "fav") { alternar("favoritos", id, $btn, "fav"); return; }
    if (acao === "lista") { alternar("lista-interesses", id, $btn, "lista"); }
  });

  $btnMais.on("click", renderPagina);

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
