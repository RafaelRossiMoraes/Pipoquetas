// lista-interesses.js (jQuery) — página da Lista de Interesses (4ª imagem de referência).
// Carrega a playlist "lista-interesses" do usuário logado no banco (filmes para assistir depois).
// Depende de: jQuery, js/api.js, js/app.js e js/playlists-comum.js.
$(function () {
  var $lista = $("#plLista");
  var $total = $("#plTotal");
  if (!$lista.length) return;

  function carregar() {
    api("GET", "/api/lista-interesses").done(function (r) {
      var filmes = (r && r.filmes) || [];
      $total.text(pipoTotal(filmes.length));
      pipoDesenharLista($lista, filmes, { botao: "bandeira", acao: "remover-lista" });
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      $lista.html('<p class="pl-vazio">' + esc(erroMsg(x)) + "</p>");
    });
  }

  // remover da lista de interesses
  $lista.on("click", "button[data-acao='remover-lista']", function () {
    var $item = $(this).closest(".pl-item");
    var id = $item.attr("data-id");
    api("POST", "/api/lista-interesses/" + encodeURIComponent(id)).done(function () {
      $item.remove();
      var n = Math.max(0, (parseInt($total.text(), 10) || 0) - 1);
      $total.text(n);
      if (!$lista.find(".pl-item").length) {
        pipoDesenharLista($lista, [], { botao: "bandeira" });
      }
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      window.pipoAviso(erroMsg(x));
    });
  });

  carregar();
});
