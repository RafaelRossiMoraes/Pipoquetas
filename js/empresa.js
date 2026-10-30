// empresa.js (jQuery) — painel da empresa, ligado ao servidor.py.
// A API só devolve os filmes da empresa logada. Filme novo entra como "pendente" até o administrador aprovar.
// Depende de: jQuery e js/app.js (api, esc, erroMsg).
$(function () {
  var meusFilmes = [];

  function achar(id) {
    var achado = null;
    $.each(meusFilmes, function (_, f) { if (f.id === id) achado = f; });
    return achado;
  }

  // ---------- Renderização ----------
  function renderMeusFilmes() {
    var $tbody = $("#tbodyMeusFilmes").empty();
    $.each(meusFilmes, function (_, f) {
      $tbody.append('<tr><td class="cell-title"><img src="' + esc(f.imagem) + '" alt="">' + esc(f.titulo) + "</td><td>" + esc(f.ano) + "</td><td>" +
        esc(f.plataforma || "—") + '</td><td><span class="badge badge-' + esc(f.status) + '">' + esc(f.status) + "</span></td><td>" +
        '<button class="action-btn editar" data-acao="editar-filme" data-id="' + esc(f.id) + '">Editar</button> ' +
        '<button class="action-btn remover" data-acao="remover-filme" data-id="' + esc(f.id) + '">Remover</button></td></tr>');
    });
    $("#countMeusFilmes, #statTotalFilmes").text(meusFilmes.length);
    $("#statPendentes").text($.grep(meusFilmes, function (f) { return f.status === "pendente"; }).length);
    $("#emptyMeusFilmes").toggle(meusFilmes.length === 0);

    var views = 0, soma = 0, comNota = $.grep(meusFilmes, function (f) { return f.avaliacoes > 0; });
    $.each(meusFilmes, function (_, f) { views += (f.visualizacoes || 0); });
    $.each(comNota, function (_, f) { soma += f.notaMedia; });
    $("#statVisualizacoes").text(views);
    $("#statAvaliacaoMedia").text(comNota.length ? (soma / comNota.length).toFixed(1) : "0.0");
  }

  function renderDesempenho() {
    var ok = $.grep(meusFilmes, function (f) { return f.status === "aprovado"; });
    var $tbody = $("#tbodyDesempenho").empty();
    $.each(ok, function (_, f) {
      $tbody.append("<tr><td>" + esc(f.titulo) + "</td><td>" + (f.visualizacoes || 0) + "</td><td>" + (f.avaliacoes || 0) +
        '</td><td><i class="fa-solid fa-star"></i> ' + Number(f.notaMedia || 0).toFixed(1) + "</td></tr>");
    });
    $("#emptyDesempenho").toggle(!ok.length);
  }

  function carregar() {
    api("GET", "/api/filmes").done(function (lista) {
      meusFilmes = lista; renderMeusFilmes(); renderDesempenho();
    }).fail(function (x) { alert(erroMsg(x)); });
  }

  // ---------- Ações (delegação única) ----------
  $(document).on("click", "button[data-acao]", function () {
    var acao = $(this).data("acao"), id = String($(this).attr("data-id"));
    if (acao === "remover-filme" && confirm("Remover este filme?"))
      api("DELETE", "/api/filmes/" + encodeURIComponent(id)).done(carregar).fail(function (x) { alert(erroMsg(x)); });
    if (acao === "editar-filme") abrirFormularioFilme(achar(id));
  });

  // ---------- Modal ----------
  var $overlay = $("#filmeFormOverlay");
  var idEmEdicao = null;

  function abrirFormularioFilme(filme) {
    idEmEdicao = filme ? filme.id : null;
    $("#filmeFormTitulo").text(filme ? "Editar filme" : "Cadastrar filme");
    $("#campoTitulo").val(filme ? filme.titulo : "");
    $("#campoAno").val(filme ? filme.ano : "");
    $("#campoClassificacao").val(filme ? filme.classificacao : "L");
    $("#campoGeneros").val(filme ? (filme.generos || []).join(", ") : "");
    $("#campoPlataforma").val(filme ? filme.plataforma : "");
    $("#campoPreco").val(filme ? filme.preco : "");
    $("#campoSinopse").val(filme ? filme.sinopse : "");
    $("#campoImagem").val(filme ? filme.imagem : "");
    $overlay.addClass("active");
  }

  $("#btnAdicionarFilme").on("click", function () { abrirFormularioFilme(null); });
  $("#btnCancelarFilme").on("click", function () { $overlay.removeClass("active"); });
  $overlay.on("click", function (e) { if (e.target === this) $(this).removeClass("active"); });

  $("#filmeForm").on("submit", function (e) {
    e.preventDefault();
    var dados = {
      titulo: $("#campoTitulo").val(), ano: $("#campoAno").val(), classificacao: $("#campoClassificacao").val(),
      generos: $.grep($.map($("#campoGeneros").val().split(","), $.trim), Boolean),
      plataforma: $("#campoPlataforma").val(), preco: $("#campoPreco").val(), sinopse: $("#campoSinopse").val(), imagem: $("#campoImagem").val()
    };
    var req = idEmEdicao ? api("PUT", "/api/filmes/" + encodeURIComponent(idEmEdicao), dados) : api("POST", "/api/filmes", dados);
    req.done(function () { $overlay.removeClass("active"); carregar(); }).fail(function (x) { alert(erroMsg(x)); });
  });

  carregar();
});
