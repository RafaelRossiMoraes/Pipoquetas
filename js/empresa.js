// empresa.js (jQuery) — painel da empresa.
// "meusFilmesData" vem de um SELECT em Filme filtrado pela empresa logada (placeholder local).
// Depende de: jQuery e js/app.js.
$(function () {
  var meusFilmesData = [
    {
      titulo: "Estrada Sem Volta", ano: "2025", classificacao: "14",
      generos: ["Suspense"], plataforma: "StreamFlix", preco: "R$12,90",
      sinopse: "Um motorista de aplicativo se vê perseguido após presenciar um crime.",
      imagem: "assets/img-filmes/placeholder.png", status: "pendente",
      visualizacoes: 0, avaliacoes: 0, notaMedia: 0
    },
    {
      titulo: "Refúgio", ano: "2024", classificacao: "L",
      generos: ["Drama", "Família"], plataforma: "StreamFlix", preco: "R$9,90",
      sinopse: "Uma família reconstrói a vida após perder tudo em uma enchente.",
      imagem: "assets/img-filmes/placeholder.png", status: "aprovado",
      visualizacoes: 3420, avaliacoes: 87, notaMedia: 4.2
    }
  ];

  // ---------- Renderização ----------
  function renderMeusFilmes() {
    var $tbody = $("#tbodyMeusFilmes");
    if (!$tbody.length) return;
    $tbody.empty();
    $.each(meusFilmesData, function (index, f) {
      $tbody.append(
        '<tr><td class="cell-title"><img src="' + f.imagem + '" alt="' + f.titulo + '">' + f.titulo + "</td>" +
        "<td>" + f.ano + "</td><td>" + (f.plataforma || "—") + '</td><td><span class="badge badge-' + f.status + '">' + f.status + "</span></td>" +
        '<td><button class="action-btn editar" data-index="' + index + '" data-acao="editar-filme">Editar</button>' +
        ' <button class="action-btn remover" data-index="' + index + '" data-acao="remover-filme">Remover</button></td></tr>'
      );
    });

    $("#countMeusFilmes").text(meusFilmesData.length);
    $("#statTotalFilmes").text(meusFilmesData.length);
    $("#statPendentes").text($.grep(meusFilmesData, function (f) { return f.status === "pendente"; }).length);
    $("#emptyMeusFilmes").toggle(meusFilmesData.length === 0);

    var totalViews = 0;
    $.each(meusFilmesData, function (_, f) { totalViews += (f.visualizacoes || 0); });
    $("#statVisualizacoes").text(totalViews);

    var comNota = $.grep(meusFilmesData, function (f) { return f.avaliacoes > 0; });
    var media = 0;
    if (comNota.length) {
      var soma = 0;
      $.each(comNota, function (_, f) { soma += f.notaMedia; });
      media = soma / comNota.length;
    }
    $("#statAvaliacaoMedia").text(comNota.length ? media.toFixed(1) : "0.0");
  }

  function renderDesempenho() {
    var $tbody = $("#tbodyDesempenho");
    if (!$tbody.length) return;
    $tbody.empty();
    $.each($.grep(meusFilmesData, function (f) { return f.status === "aprovado"; }), function (_, f) {
      $tbody.append(
        "<tr><td>" + f.titulo + "</td><td>" + f.visualizacoes + "</td><td>" + f.avaliacoes + '</td><td><i class="fa-solid fa-star"></i> ' + Number(f.notaMedia).toFixed(1) + "</td></tr>"
      );
    });
    var aprovados = $.grep(meusFilmesData, function (f) { return f.status === "aprovado"; }).length;
    $("#emptyDesempenho").toggle(!aprovados);
  }

  // ---------- Ações (delegação única) ----------
  $(document).on("click", "button[data-acao]", function () {
    var $btn = $(this);
    var index = ($btn.data("index") !== undefined) ? Number($btn.data("index")) : null;
    if ($btn.data("acao") === "remover-filme") {
      meusFilmesData.splice(index, 1);
      renderMeusFilmes();
      renderDesempenho();
    }
    if ($btn.data("acao") === "editar-filme") abrirFormularioFilme(meusFilmesData[index], index);
  });

  // ---------- Modal ----------
  var $filmeFormOverlay = $("#filmeFormOverlay");
  var $filmeForm = $("#filmeForm");
  var indexEmEdicao = null;

  function abrirFormularioFilme(filme, index) {
    indexEmEdicao = (index === undefined) ? null : index;
    $("#filmeFormTitulo").text(filme ? "Editar filme" : "Cadastrar filme");
    $("#campoTitulo").val(filme ? filme.titulo : "");
    $("#campoAno").val(filme ? filme.ano : "");
    $("#campoClassificacao").val(filme ? filme.classificacao : "L");
    $("#campoGeneros").val(filme ? (filme.generos || []).join(", ") : "");
    $("#campoPlataforma").val(filme ? filme.plataforma : "");
    $("#campoPreco").val(filme ? filme.preco : "");
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
    var dados = {
      titulo: $("#campoTitulo").val(),
      ano: $("#campoAno").val(),
      classificacao: $("#campoClassificacao").val(),
      generos: $.map($("#campoGeneros").val().split(","), function (g) { return $.trim(g); }).filter(Boolean),
      plataforma: $("#campoPlataforma").val(),
      preco: $("#campoPreco").val(),
      sinopse: $("#campoSinopse").val(),
      imagem: $("#campoImagem").val() || "assets/img-filmes/placeholder.png"
    };
    if (indexEmEdicao !== null) meusFilmesData[indexEmEdicao] = $.extend({}, meusFilmesData[indexEmEdicao], dados);
    else meusFilmesData.push($.extend({}, dados, { status: "pendente", visualizacoes: 0, avaliacoes: 0, notaMedia: 0 }));
    $filmeFormOverlay.removeClass("active");
    renderMeusFilmes();
    renderDesempenho();
  });

  // ---------- Inicialização ----------
  renderMeusFilmes();
  renderDesempenho();
});
