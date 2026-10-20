// playlists.js (jQuery) — Biblioteca de Playlists (5ª e 6ª imagens de referência).
// Lista as playlists do usuário (as duas obrigatórias + as personalizadas),
// permite criar, editar e excluir as personalizadas e abre o modal de criação.
// Depende de: jQuery, js/api.js, js/app.js e js/playlists-comum.js.
$(function () {
  var $cards = $("#plCards");
  var $modal = $("#plModal");
  var $form = $("#plForm");
  if (!$cards.length) return;

  var idEmEdicao = null;
  var playlists = [];

  // ---------- desenho ----------
  function cardHtml(p) {
    var menu =
      '<button class="pl-card-menu" data-acao="menu" data-id="' + p.id + '" aria-label="Opções da playlist">' +
        '<i class="fa-solid fa-ellipsis-vertical"></i></button>';
    var itens =
      '<button data-acao="abrir" data-id="' + p.id + '">Abrir playlist</button>' +
      (p.obrigatoria ? "" :
        '<button data-acao="editar" data-id="' + p.id + '">Editar</button>' +
        '<button data-acao="excluir" data-id="' + p.id + '">Excluir</button>');
    return (
      '<article class="pl-card" data-id="' + p.id + '">' +
        '<div class="pl-card-topo">' + menu + '<span class="pl-card-icone">' + pipoIcone(p.icone) + "</span></div>" +
        '<div class="pl-card-corpo">' +
          '<h3 class="pl-card-nome">' + esc(p.nome) + "</h3>" +
          '<p class="pl-card-desc">' + esc(p.descricao) + "</p>" +
          '<p class="pl-card-total">' + pipoTotal(p.total) + "</p>" +
        "</div>" +
        '<div class="pl-card-menu-box" data-menu="' + p.id + '">' + itens + "</div>" +
      "</article>"
    );
  }

  function carregar() {
    api("GET", "/api/playlists").done(function (r) {
      playlists = (r && r.playlists) || [];
      if (!playlists.length) {
        $cards.html('<p class="pl-vazio"><i class="fa-solid fa-folder-open"></i>Você ainda não tem playlists. ' +
          'Crie a primeira com o botão "Criar Playlist".</p>');
        return;
      }
      $cards.html($.map(playlists, cardHtml).join(""));
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      $cards.html('<p class="pl-vazio">' + esc(erroMsg(x)) + "</p>");
    });
  }

  function achar(id) {
    var achado = null;
    $.each(playlists, function (_, p) { if (String(p.id) === String(id)) achado = p; });
    return achado;
  }

  // ---------- modal ----------
  function atualizarPreviewIcone() {
    $("#plIconePreview").html(pipoIcone($("#plIcone").val()));
  }

  function abrirModal(playlist) {
    idEmEdicao = playlist ? playlist.id : null;
    $("#plModalTitulo").text(playlist ? "Editar Playlist" : "Criar Playlist");
    $("#plNome").val(playlist ? playlist.nome : "");
    $("#plDescricao").val(playlist ? playlist.descricao : "");
    $("#plIcone").val(playlist ? playlist.icone : "heart");
    $("#plPrivacidade").val(playlist ? playlist.privacidade : "privada");
    $("#plErro").text("");
    atualizarPreviewIcone();
    $modal.addClass("active");
    $("#plNome").trigger("focus");
  }

  function fecharModal() {
    $modal.removeClass("active");
    idEmEdicao = null;
  }

  $("#btnCriarPlaylist").on("click", function () { abrirModal(null); });
  $("#plCancelar").on("click", fecharModal);
  $modal.on("click", function (e) { if (e.target === this) fecharModal(); });
  $(document).on("keydown", function (e) { if (e.key === "Escape" && $modal.hasClass("active")) fecharModal(); });
  $("#plIcone").on("change", atualizarPreviewIcone);

  $form.on("submit", function (e) {
    e.preventDefault();
    var nome = $.trim($("#plNome").val());
    var descricao = $.trim($("#plDescricao").val());
    var dados = {
      nome: nome,
      descricao: descricao,
      icone: $("#plIcone").val(),
      privacidade: $("#plPrivacidade").val()
    };
    if (nome.length < 2) {
      $("#plErro").text("Informe o nome da playlist (mínimo 2 letras).");
      return;
    }
    if (descricao.length > 300) {
      $("#plErro").text("A descrição pode ter no máximo 300 caracteres.");
      return;
    }
    $("#plErro").text("");
    var req = idEmEdicao
      ? api("PUT", "/api/playlists/" + idEmEdicao, dados)
      : api("POST", "/api/playlists", dados);
    req.done(function () {
      fecharModal();
      carregar();
    }).fail(function (x) {
      if (pipoExigirLogin(x)) return;
      $("#plErro").text(erroMsg(x));
    });
  });

  // ---------- ações dos cards ----------
  $cards.on("click", "[data-acao]", function (e) {
    e.stopPropagation();
    var $btn = $(this);
    var acao = $btn.attr("data-acao");
    var id = $btn.attr("data-id");

    if (acao === "menu") {
      $(".pl-card-menu-box").not($btn.closest(".pl-card").find(".pl-card-menu-box")).removeClass("active");
      $btn.closest(".pl-card").find(".pl-card-menu-box").toggleClass("active");
      return;
    }
    if (acao === "abrir") {
      abrirPlaylist(id);
      return;
    }
    if (acao === "editar") {
      $(".pl-card-menu-box").removeClass("active");
      abrirModal(achar(id));
      return;
    }
    if (acao === "excluir") {
      $(".pl-card-menu-box").removeClass("active");
      var p = achar(id);
      if (!p) return;
      if (!confirm('Excluir a playlist "' + p.nome + '"? Os filmes salvos nela serão perdidos.')) return;
      api("DELETE", "/api/playlists/" + id).done(carregar).fail(function (x) {
        if (pipoExigirLogin(x)) return;
        window.pipoAviso(erroMsg(x));
      });
    }
  });

  // clique fora do menu fecha
  $(document).on("click", function (e) {
    if ($(e.target).closest(".pl-card-menu-box, .pl-card-menu").length) return;
    $(".pl-card-menu-box").removeClass("active");
  });

  function abrirPlaylist(id) {
    var p = achar(id);
    if (p && p.obrigatoria) {
      window.location.href = (p.tipo === "favoritos") ? "favoritos.html" : "lista-interesses.html";
      return;
    }
    window.location.href = "playlist.html?id=" + encodeURIComponent(id);
  }

  // clique no cartão abre a playlist (o botão "⋮" só abre o menu)
  $cards.on("click", ".pl-card", function (e) {
    if ($(e.target).closest("[data-acao], .pl-card-menu-box").length) return;
    abrirPlaylist($(this).attr("data-id"));
  });

  carregar();
});
