// favoritos.js (jQuery) — página de Favoritos (3ª imagem de referência).
// Carrega a playlist "favoritos" do usuário logado no banco e permite remover filmes.
// Depende de: jQuery, js/api.js, js/app.js e js/playlists-comum.js.
$(function () {
  var $lista = $("#plLista");
  var $total = $("#plTotal");
  if (!$lista.length) return;

  function atualizarTotal(n) {
    $total.text(pipoTotal(n));
  }

  function carregar() {
    api("GET", "/api/favoritos").done(function (r) {
      var filmes = (r && r.filmes) || [];
      atualizarTotal(filmes.length);
      pipoDesenharLista($lista, filmes, { botao: "coracao", acao: "remover-favorito" });
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      $lista.html('<p class="pl-vazio">' + esc(erroMsg(x)) + "</p>");
    });
  }

  // remover dos favoritos
  $lista.on("click", "button[data-acao='remover-favorito']", function () {
    var $item = $(this).closest(".pl-item");
    var id = $item.attr("data-id");
    api("POST", "/api/favoritos/" + encodeURIComponent(id)).done(function (r) {
      $item.remove();
      var n = Math.max(0, (parseInt($total.text(), 10) || 0) - 1);
      atualizarTotal(n);
      if (!$lista.find(".pl-item").length) {
        pipoDesenharLista($lista, [], { botao: "coracao" });
      }
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      window.pipoAviso(erroMsg(x));
    });
  });

  carregar();
});
