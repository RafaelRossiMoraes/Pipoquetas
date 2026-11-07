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
      $tbody.append('<tr><td class="cell-title"><img src="' + esc(f.imagem) + '" alt="" loading="lazy" decoding="async">' + esc(f.titulo) + "</td><td>" + esc(f.ano) + "</td><td>" +
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
  var $arquivo = $("#campoImagem");
  var idEmEdicao = null;
  var arquivoSelecionado = null;

  function mostrarImagem(caminho, nome) {
    $("#campoImagemCaminho").val(caminho || "");
    if (caminho) {
      $("#campoImagemPreview").prop("hidden", false).find("img").attr("src", caminho);
      $("#campoImagemNome").text(nome || "Imagem atual");
    } else {
      $("#campoImagemPreview").prop("hidden", true).find("img").attr("src", "");
      $("#campoImagemNome").text("Nenhum arquivo selecionado");
    }
  }

  function abrirFormularioFilme(filme) {
    idEmEdicao = filme ? filme.id : null;
    $("#filmeFormTitulo").text(filme ? "Editar filme" : "Cadastrar filme");
    $("#campoTitulo").val(filme ? filme.titulo : "");
    $("#campoAno").val(filme ? filme.ano : "");
    $("#campoClassificacao").val(filme ? filme.classificacao : "L");
    window.pipoRenderGeneros($("#campoGeneros"), filme ? (filme.generos || []) : []);
    $("#campoPlataforma").val(filme ? filme.plataforma : "");
    $("#campoPreco").val(filme ? filme.preco : "");
    $("#campoSinopse").val(filme ? filme.sinopse : "");
    arquivoSelecionado = null;
    $arquivo.val("");
    mostrarImagem(filme ? filme.imagem : "", "");
    $overlay.addClass("active");
  }

  $("#btnAdicionarFilme").on("click", function () { abrirFormularioFilme(null); });
  $("#btnCancelarFilme").on("click", function () { $overlay.removeClass("active"); });
  $overlay.on("click", function (e) { if (e.target === this) $(this).removeClass("active"); });
  $("#btnEscolherImagem").on("click", function () { $arquivo.trigger("click"); });

  $arquivo.on("change", function () {
    var f = this.files && this.files[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(f.type || "")) {
      arquivoSelecionado = null;
      $arquivo.val("");
      $("#campoImagemNome").text("Formato inválido. Use JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      arquivoSelecionado = null;
      $arquivo.val("");
      $("#campoImagemNome").text("Imagem acima de 4 MB. Escolha um arquivo menor.");
      return;
    }
    arquivoSelecionado = f;
    $("#campoImagemNome").text(f.name);
    var leitor = new FileReader();
    leitor.onload = function () {
      $("#campoImagemPreview").prop("hidden", false).find("img").attr("src", leitor.result);
    };
    leitor.readAsDataURL(f);
  });

  $("#filmeForm").on("submit", function (e) {
    e.preventDefault();
    var $btn = $(this).find('button[type="submit"]');
    var dados = {
      titulo: $("#campoTitulo").val(), ano: $("#campoAno").val(), classificacao: $("#campoClassificacao").val(),
      generos: window.pipoGenerosSelecionados($("#campoGeneros")),
      plataforma: $("#campoPlataforma").val(), preco: $("#campoPreco").val(), sinopse: $("#campoSinopse").val(),
      imagem: $("#campoImagemCaminho").val()
    };

    function salvar() {
      var req = idEmEdicao ? api("PUT", "/api/filmes/" + encodeURIComponent(idEmEdicao), dados) : api("POST", "/api/filmes", dados);
      req.done(function () { $overlay.removeClass("active"); carregar(); })
        .fail(function (x) { alert(erroMsg(x)); })
        .always(function () { $btn.prop("disabled", false); });
    }

    $btn.prop("disabled", true);
    if (arquivoSelecionado) {
      window.pipoEnviarImagem(arquivoSelecionado).done(function (r) {
        dados.imagem = r.caminho;
        $("#campoImagemCaminho").val(r.caminho);
        arquivoSelecionado = null;
        salvar();
      }).fail(function (x) {
        $btn.prop("disabled", false);
        alert(erroMsg(x));
      });
    } else {
      salvar();
    }
  });

  // Atalho do menu de perfil: empresa.html?novo=1 já abre o formulário.
  if (new URLSearchParams(window.location.search).get("novo") === "1") {
    abrirFormularioFilme(null);
  }

  carregar();
});
