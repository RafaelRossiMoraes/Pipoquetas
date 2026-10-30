// playlist.js (jQuery) — página de uma playlist personalizada (7ª imagem de referência).
// Carrega a playlist pelo ?id= da URL (nada de dados fixos), mostra os filmes
// e permite adicionar/remover filmes respeitando a propriedade da playlist.
// Depende de: jQuery, js/api.js, js/app.js e js/playlists-comum.js.
$(function () {
  var $lista = $("#plLista");
  var $ident = $("#plIdent");
  if (!$lista.length) return;

  var params = new URLSearchParams(window.location.search);
  var playlistId = params.get("id");
  var playlist = null;
  var catalogo = null;

  if (!playlistId) {
    window.location.replace("playlists.html");
    return;
  }

  // ---------- desenho ----------
  function desenharIdent() {
    var icone = pipoIcone(playlist.icone);
    $ident.html(
      '<h1 class="pl-ident-titulo">' + esc(playlist.nome) + "</h1>" +
      '<div class="pl-ident-icone">' + icone + "</div>" +
      '<p class="pl-ident-desc">' + esc(playlist.descricao) + "</p>" +
      '<p class="pl-ident-total">' + pipoTotal(playlist.total) + "</p>" +
      '<p class="pl-ident-privacidade"><i class="fa-solid fa-' +
        (playlist.privacidade === "publica" ? "globe" : "lock") + '"></i> ' +
        (playlist.privacidade === "publica" ? "Pública" : "Privada") + "</p>"
    );
  }

  function desenharLista(filmes) {
    playlist.total = filmes.length;
    $(".pl-ident-total").text(pipoTotal(filmes.length));
    pipoDesenharLista($lista, filmes, { botao: "lixeira", acao: "remover-item" });
  }

  function carregar() {
    api("GET", "/api/playlists/" + encodeURIComponent(playlistId)).done(function (r) {
      playlist = r.playlist;
      $(document).prop("title", playlist.nome + " - Pipoquetas");
      desenharIdent();
      desenharLista(r.filmes || []);
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      $lista.html('<p class="pl-vazio"><i class="fa-solid fa-triangle-exclamation"></i>' + esc(erroMsg(x)) + "</p>");
    });
  }

  // ---------- remover filme da playlist ----------
  $lista.on("click", "button[data-acao='remover-item']", function () {
    var $item = $(this).closest(".pl-item");
    var filmeId = $item.attr("data-id");
    api("DELETE", "/api/playlists/" + encodeURIComponent(playlistId) + "/itens/" + encodeURIComponent(filmeId))
      .done(function () {
        $item.remove();
        var n = Math.max(0, (playlist.total || 1) - 1);
        playlist.total = n;
        $(".pl-ident-total").text(pipoTotal(n));
        if (!$lista.find(".pl-item").length) {
          pipoDesenharLista($lista, [], { botao: "lixeira" });
        }
      })
      .fail(function (x) {
        if (pipoExigirLogin(x)) return;
        window.pipoAviso(erroMsg(x));
      });
  });

  // ---------- adicionar filmes (catálogo) ----------
  var $picker = $("#plPicker");

  function abrirPicker() {
    if (!catalogo) {
      $picker.addClass("active");
      $("#plPickerLista").html('<p class="pl-vazio"><i class="fa-solid fa-spinner fa-spin"></i>Carregando o catálogo...</p>');
      api("GET", "/api/filmes/catalogo").done(function (lista) {
        catalogo = lista || [];
        desenharPicker();
      }).fail(function (x) {
        $("#plPickerLista").html('<p class="pl-vazio">' + esc(erroMsg(x)) + "</p>");
      });
      return;
    }
    desenharPicker();
    $picker.addClass("active");
  }

  function desenharPicker() {
    var $box = $("#plPickerLista");
    var naPlaylist = {};
    $lista.find(".pl-item").each(function () { naPlaylist[$(this).attr("data-id")] = true; });
    var texto = $.trim($("#plPickerBusca").val()).toLowerCase();
    var disponiveis = $.grep(catalogo, function (f) {
      if (naPlaylist[f.id]) return false;
      if (!texto) return true;
      return (f.titulo + " " + (f.ano || "")).toLowerCase().indexOf(texto) !== -1;
    });
    if (!disponiveis.length) {
      $box.html('<p class="pl-vazio">Nenhum filme disponível para adicionar.</p>');
      return;
    }
    $box.html($.map(disponiveis, function (f) {
      return '<button class="pl-picker-item" data-id="' + esc(f.id) + '">' +
        '<img src="' + esc(f.imagem) + '" alt="">' +
        '<span class="pl-picker-titulo">' + esc(f.titulo) + "</span>" +
        '<span class="pl-picker-ano">' + esc(f.ano || "") + "</span>" +
        '<span class="pl-picker-mais"><i class="fa-solid fa-plus"></i></span>' +
        "</button>";
    }).join(""));
  }

  $("#btnAdicionarFilmes").on("click", abrirPicker);
  $("#plPickerFechar").on("click", function () { $picker.removeClass("active"); });
  $picker.on("click", function (e) { if (e.target === this) $picker.removeClass("active"); });
  $("#plPickerBusca").on("input", function () { if (catalogo) desenharPicker(); });

  $("#plPickerLista").on("click", ".pl-picker-item", function () {
    var $btn = $(this);
    var id = $btn.attr("data-id");
    api("POST", "/api/playlists/" + encodeURIComponent(playlistId) + "/itens", { filme_id: id })
      .done(function () {
        var filme = null;
        $.each(catalogo, function (_, f) { if (f.id === id) filme = f; });
        if (filme) {
          $lista.append(pipoLinhaFilme(filme, { botao: "lixeira", acao: "remover-item" }));
          var n = (playlist.total || 0) + 1;
          playlist.total = n;
          $(".pl-ident-total").text(pipoTotal(n));
        }
        desenharPicker();
      })
      .fail(function (x) {
        if (pipoExigirLogin(x)) return;
        window.pipoAviso(erroMsg(x));
      });
  });

  carregar();
});
