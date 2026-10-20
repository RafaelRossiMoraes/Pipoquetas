// admin.js (jQuery) — painel do administrador, ligado ao servidor.py.
// Empresas, filmes pendentes e catálogo vêm da API (dados/*.json). Comentários seguem de exemplo.
// Depende de: jQuery e js/app.js (api, esc, erroMsg).
$(function () {
  var empresas = [], filmes = [];
  var comentariosData = [
    { id: 1, usuario: "riri", filme: "Interestelar", texto: "Melhor filme que já assisti!!!", nota: 5 },
    { id: 2, usuario: "jorel_oficial", filme: "Matrix Resurrections", texto: "Não gostei muito, achei confuso.", nota: 2 }
  ];

  function aprovados() { return $.grep(filmes, function (f) { return !f.status || f.status === "aprovado"; }); }
  function pendentes() { return $.grep(filmes, function (f) { return f.status === "pendente"; }); }
  function botao(acao, id, rotulo, classe) {
    return '<button class="action-btn ' + classe + '" data-acao="' + acao + '" data-id="' + esc(id) + '">' + rotulo + "</button>";
  }

  // ---------- Renderização ----------
  function renderEmpresas() {
    var $tbody = $("#tbodyEmpresas").empty();
    $.each(empresas, function (_, e) {
      $tbody.append("<tr><td>" + esc(e.nome) + "</td><td>" + esc(e.cnpj) + "</td><td>" + esc(e.email) + "</td><td>" + esc(e.data) +
        '</td><td><span class="badge badge-pendente">pendente</span></td><td>' +
        botao("aprovar-empresa", e.id, "Aprovar", "aprovar") + " " + botao("recusar-empresa", e.id, "Recusar", "recusar") + "</td></tr>");
    });
    $("#countEmpresas, #statEmpresasPendentes").text(empresas.length);
    $("#emptyEmpresas").toggle(empresas.length === 0);
  }

  function renderFilmesPendentes() {
    var lista = pendentes(), $tbody = $("#tbodyFilmesPendentes").empty();
    $.each(lista, function (_, f) {
      $tbody.append("<tr><td>" + esc(f.titulo) + "</td><td>" + esc(f.empresaNome || "—") + "</td><td>" + esc((f.generos || []).join(", ")) +
        "</td><td>" + esc(f.classificacao) + '</td><td><span class="badge badge-pendente">pendente</span></td><td>' +
        botao("aprovar-filme", f.id, "Aprovar", "aprovar") + " " + botao("recusar-filme", f.id, "Recusar", "recusar") + "</td></tr>");
    });
    $("#countFilmesPendentes, #statFilmesPendentes").text(lista.length);
    $("#emptyFilmesPendentes").toggle(lista.length === 0);
  }

  function renderCatalogo() {
    var lista = aprovados(), $tbody = $("#tbodyCatalogo").empty();
    $.each(lista, function (_, f) {
      var nota = (f.nota !== undefined) ? Number(f.nota).toFixed(1) : f.avaliacao;
      $tbody.append('<tr><td class="cell-title"><img src="' + esc(f.imagem) + '" alt="">' + esc(f.titulo) + "</td><td>" + esc(f.ano) + "</td><td>" +
        esc(f.plataforma || "—") + '</td><td><i class="fa-solid fa-star"></i> ' + esc(nota) + "</td><td>" +
        botao("editar-filme", f.id, "Editar", "editar") + " " + botao("remover-filme", f.id, "Remover", "remover") + "</td></tr>");
    });
    $("#countCatalogo, #statCatalogo").text(lista.length);
  }

  function renderComentarios() {
    var $tbody = $("#tbodyComentarios").empty();
    $.each(comentariosData, function (_, c) {
      $tbody.append("<tr><td>" + esc(c.usuario) + "</td><td>" + esc(c.filme) + "</td><td>" + esc(c.texto) +
        '</td><td><i class="fa-solid fa-star"></i> ' + c.nota + "</td><td>" + botao("remover-comentario", c.id, "Remover", "remover") + "</td></tr>");
    });
    $("#countComentarios, #statComentarios").text(comentariosData.length);
    $("#emptyComentarios").toggle(comentariosData.length === 0);
  }

  function render() { renderEmpresas(); renderFilmesPendentes(); renderCatalogo(); renderComentarios(); }

  function carregar() {
    // $.when entrega uma resposta por promessa: empresas no primeiro argumento, filmes no segundo
    $.when(api("GET", "/api/admin/empresas"), api("GET", "/api/filmes")).done(function (e, f) {
      empresas = e || []; filmes = f || []; render();
    }).fail(function (x) { alert(erroMsg(x)); });
  }

  function achar(id) {
    var achado = null;
    $.each(filmes, function (_, f) { if (f.id === id) achado = f; });
    return achado;
  }

  // ---------- Ações (delegação única) ----------
  $(document).on("click", "button[data-acao]", function () {
    var acao = $(this).data("acao"), id = String($(this).attr("data-id"));
    var recarregar = function () { carregar(); };
    var falhou = function (x) { alert(erroMsg(x)); };

    if (acao === "aprovar-empresa" || acao === "recusar-empresa")
      api("POST", "/api/admin/empresas/" + id + "/" + acao.split("-")[0]).done(recarregar).fail(falhou);
    if (acao === "aprovar-filme" || acao === "recusar-filme")
      api("POST", "/api/admin/filmes/" + encodeURIComponent(id) + "/" + acao.split("-")[0]).done(recarregar).fail(falhou);
    if (acao === "remover-filme" && confirm("Remover este filme do catálogo?"))
      api("DELETE", "/api/filmes/" + encodeURIComponent(id)).done(recarregar).fail(falhou);
    if (acao === "editar-filme") abrirFormularioFilme(achar(id));
    if (acao === "remover-comentario") {
      comentariosData = $.grep(comentariosData, function (c) { return String(c.id) !== id; });
      renderComentarios();
    }
  });

  // ---------- Modal de adicionar/editar filme ----------
  var $overlay = $("#filmeFormOverlay");
  var idEmEdicao = null;

  function abrirFormularioFilme(filme) {
    idEmEdicao = filme ? filme.id : null;
    $("#filmeFormTitulo").text(filme ? "Editar filme" : "Adicionar filme");
    $("#campoTitulo").val(filme ? filme.titulo : "");
    $("#campoAno").val(filme ? filme.ano : "");
    $("#campoClassificacao").val(filme ? filme.classificacao : "L");
    $("#campoGeneros").val(filme ? (filme.generos || []).join(", ") : "");
    $("#campoPlataforma").val(filme ? filme.plataforma : "");
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
      plataforma: $("#campoPlataforma").val(), sinopse: $("#campoSinopse").val(), imagem: $("#campoImagem").val()
    };
    var req = idEmEdicao ? api("PUT", "/api/filmes/" + encodeURIComponent(idEmEdicao), dados) : api("POST", "/api/filmes", dados);
    req.done(function () { $overlay.removeClass("active"); carregar(); }).fail(function (x) { alert(erroMsg(x)); });
  });

  carregar();
});
