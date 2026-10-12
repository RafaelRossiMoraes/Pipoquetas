// admin.js (jQuery) — painel do administrador.
// Listas de exemplo até integrar com o backend (tabelas Empresa, Filme, Avaliacao_Usuario).
// Depende de: jQuery, js/dados-filmes.js (filmesData) e js/app.js.
$(function () {
  var empresasData = [
    { id: 1, nome: "StreamFlix Distribuidora", cnpj: "12.345.678/0001-90", email: "contato@streamflix.com", data: "18/09/2026", status: "pendente" },
    { id: 2, nome: "CineBrasil Produções", cnpj: "98.765.432/0001-11", email: "contato@cinebrasil.com", data: "19/09/2026", status: "pendente" }
  ];

  var filmesPendentesData = [
    { id: 1, titulo: "Estrada Sem Volta", empresa: "StreamFlix Distribuidora", genero: "Suspense", classificacao: "14", status: "pendente" }
  ];

  var comentariosData = [
    { id: 1, usuario: "riri", filme: "Interestelar", texto: "Melhor filme que já assisti!!!", nota: 5 },
    { id: 2, usuario: "jorel_oficial", filme: "Matrix Resurrections", texto: "Não gostei muito, achei confuso.", nota: 2 }
  ];

  // ---------- Renderização ----------
  function renderEmpresas() {
    var $tbody = $("#tbodyEmpresas");
    if (!$tbody.length) return;
    $tbody.empty();
    $.each(empresasData, function (_, emp) {
      var acoes = emp.status === "pendente"
        ? '<button class="action-btn aprovar" data-id="' + emp.id + '" data-acao="aprovar-empresa">Aprovar</button>' +
          ' <button class="action-btn recusar" data-id="' + emp.id + '" data-acao="recusar-empresa">Recusar</button>'
        : "—";
      $tbody.append(
        "<tr><td>" + emp.nome + "</td><td>" + emp.cnpj + "</td><td>" + emp.email + "</td>" +
        "<td>" + emp.data + '</td><td><span class="badge badge-' + emp.status + '">' + emp.status + "</span></td>" +
        "<td>" + acoes + "</td></tr>"
      );
    });
    var pendentes = $.grep(empresasData, function (e) { return e.status === "pendente"; }).length;
    $("#countEmpresas").text(pendentes);
    $("#statEmpresasPendentes").text(pendentes);
    $("#emptyEmpresas").toggle(empresasData.length === 0);
  }

  function renderFilmesPendentes() {
    var $tbody = $("#tbodyFilmesPendentes");
    if (!$tbody.length) return;
    $tbody.empty();
    $.each(filmesPendentesData, function (_, f) {
      $tbody.append(
        "<tr><td>" + f.titulo + "</td><td>" + f.empresa + "</td><td>" + f.genero + "</td>" +
        "<td>" + f.classificacao + '</td><td><span class="badge badge-' + f.status + '">' + f.status + "</span></td>" +
        '<td><button class="action-btn aprovar" data-id="' + f.id + '" data-acao="aprovar-filme">Aprovar</button>' +
        ' <button class="action-btn recusar" data-id="' + f.id + '" data-acao="recusar-filme">Recusar</button></td></tr>'
      );
    });
    $("#countFilmesPendentes").text(filmesPendentesData.length);
    $("#statFilmesPendentes").text(filmesPendentesData.length);
    $("#emptyFilmesPendentes").toggle(filmesPendentesData.length === 0);
  }

  function renderCatalogo() {
    var $tbody = $("#tbodyCatalogo");
    if (!$tbody.length) return;
    $tbody.empty();
    var catalogo = (typeof filmesData !== "undefined") ? filmesData : [];
    $.each(catalogo, function (index, f) {
      var nota = (f.nota !== undefined) ? Number(f.nota).toFixed(1) : f.avaliacao;
      $tbody.append(
        '<tr><td class="cell-title"><img src="' + f.imagem + '" alt="' + f.titulo + '">' + f.titulo + "</td>" +
        "<td>" + f.ano + "</td><td>" + (f.plataforma || "—") + '</td><td><i class="fa-solid fa-star"></i> ' + nota + "</td>" +
        '<td><button class="action-btn editar" data-index="' + index + '" data-acao="editar-filme">Editar</button>' +
        ' <button class="action-btn remover" data-index="' + index + '" data-acao="remover-filme">Remover</button></td></tr>'
      );
    });
    $("#countCatalogo").text(catalogo.length);
    $("#statCatalogo").text(catalogo.length);
  }

  function renderComentarios() {
    var $tbody = $("#tbodyComentarios");
    if (!$tbody.length) return;
    $tbody.empty();
    $.each(comentariosData, function (_, c) {
      $tbody.append(
        "<tr><td>" + c.usuario + "</td><td>" + c.filme + "</td><td>" + c.texto + '</td><td><i class="fa-solid fa-star"></i> ' + c.nota + "</td>" +
        '<td><button class="action-btn remover" data-id="' + c.id + '" data-acao="remover-comentario">Remover</button></td></tr>'
      );
    });
    $("#countComentarios").text(comentariosData.length);
    $("#statComentarios").text(comentariosData.length);
    $("#emptyComentarios").toggle(comentariosData.length === 0);
  }

  // ---------- Ações (delegação única — sem código duplicado por botão) ----------
  $(document).on("click", "button[data-acao]", function () {
    var $btn = $(this);
    var acao = $btn.data("acao");
    var id = ($btn.data("id") !== undefined) ? Number($btn.data("id")) : null;
    var rawIndex = $btn.data("index");
    var index = (rawIndex !== undefined && rawIndex !== null && rawIndex !== "undefined") ? Number(rawIndex) : null;

    if (acao === "aprovar-empresa" || acao === "recusar-empresa") {
      empresasData = $.grep(empresasData, function (emp) { return emp.id !== id; });
      renderEmpresas();
    }
    if (acao === "aprovar-filme" || acao === "recusar-filme") {
      filmesPendentesData = $.grep(filmesPendentesData, function (f) { return f.id !== id; });
      renderFilmesPendentes();
    }
    if (acao === "remover-filme" && typeof filmesData !== "undefined") {
      filmesData.splice(index, 1);
      renderCatalogo();
    }
    if (acao === "editar-filme" && typeof filmesData !== "undefined") {
      abrirFormularioFilme(filmesData[index], index);
    }
    if (acao === "remover-comentario") {
      comentariosData = $.grep(comentariosData, function (c) { return c.id !== id; });
      renderComentarios();
    }
  });

  // ---------- Modal de adicionar/editar filme ----------
  var $filmeFormOverlay = $("#filmeFormOverlay");
  var $filmeForm = $("#filmeForm");
  var indexEmEdicao = null;

  function abrirFormularioFilme(filme, index) {
    indexEmEdicao = (index === undefined) ? null : index;
    $("#filmeFormTitulo").text(filme ? "Editar filme" : "Adicionar filme");
    $("#campoTitulo").val(filme ? filme.titulo : "");
    $("#campoAno").val(filme ? filme.ano : "");
    $("#campoClassificacao").val(filme ? filme.classificacao : "L");
    $("#campoGeneros").val(filme ? (filme.generos || []).join(", ") : "");
    $("#campoPlataforma").val(filme ? filme.plataforma : "");
    $("#campoSinopse").val(filme ? filme.sinopse : "");
    $("#campoImagem").val(filme ? filme.imagem : "");
    $filmeFormOverlay.addClass("active");
  }

  $("#btnAdicionarFilme").on("click", function () { abrirFormularioFilme(null, null); });
  $("#btnCancelarFilme").on("click", function () { $filmeFormOverlay.removeClass("active"); });
  $filmeFormOverlay.on("click", function (e) {
    if (e.target === this) $(this).removeClass("active");
  });

  $filmeForm.on("submit", function (e) {
    e.preventDefault();
    var novoFilme = {
      titulo: $("#campoTitulo").val(),
      ano: $("#campoAno").val(),
      classificacao: $("#campoClassificacao").val(),
      generos: $.map($("#campoGeneros").val().split(","), function (g) { return $.trim(g); }).filter(Boolean),
      plataforma: $("#campoPlataforma").val(),
      sinopse: $("#campoSinopse").val(),
      imagem: $("#campoImagem").val() || "assets/img-filmes/placeholder.png",
      avaliacao: 0,
      nota: 0,
      secao: "recomendados"
    };
    if (typeof filmesData === "undefined") window.filmesData = [];
    if (indexEmEdicao !== null) filmesData[indexEmEdicao] = $.extend({}, filmesData[indexEmEdicao], novoFilme);
    else filmesData.push(novoFilme);
    $filmeFormOverlay.removeClass("active");
    renderCatalogo();
  });

  // ---------- Inicialização ----------
  renderEmpresas();
  renderFilmesPendentes();
  renderCatalogo();
  renderComentarios();
});
