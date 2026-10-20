// notificacoes.js (jQuery) — painel de notificações do header.
// Só funciona para usuário autenticado: a API devolve 401 para quem não está logado.
// Depende de: jQuery, js/api.js e js/app.js.
$(function () {
  var $painel = $("#notifPanel");
  var $lista = $("#notifList");
  var $badge = $("#notifBadge");
  var $pagina = $("#notifPaginaLista");
  // a página "notificacoes.html" não tem painel: só a lista completa
  if (!$painel.length && !$pagina.length) return;
  if (!$painel.length) $lista = $pagina;

  // ---------- abrir / fechar ----------
  function abrir() {
    if (!$painel.length) return;
    $painel.addClass("active");
    $("#notifBell").attr("aria-expanded", "true");
    carregar();
  }
  function fechar() {
    if (!$painel.length) return;
    $painel.removeClass("active");
    $("#notifBell").attr("aria-expanded", "false");
  }

  $(document).on("click", "#notifBell", function (e) {
    e.stopPropagation();
    if ($painel.hasClass("active")) fechar(); else abrir();
  });
  // clicar fora do painel fecha
  $(document).on("click", function (e) {
    if (!$painel.hasClass("active")) return;
    if ($(e.target).closest("#notifPanel, #notifBell").length) return;
    fechar();
  });
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") fechar();
  });

  // ---------- "Há X atrás" ----------
  function tempoRelativo(iso) {
    if (!iso) return "";
    var data = new Date(String(iso).replace(" ", "T") + "Z");
    if (isNaN(data.getTime())) return "";
    var seg = Math.floor((Date.now() - data.getTime()) / 1000);
    if (seg < 60) return "Há instantes";
    if (seg < 3600) { var m = Math.floor(seg / 60); return "Há " + m + (m === 1 ? " minuto" : " minutos") + " atrás"; }
    if (seg < 86400) { var h = Math.floor(seg / 3600); return "Há " + h + (h === 1 ? " hora" : " horas") + " atrás"; }
    var d = Math.floor(seg / 86400);
    if (d === 1) return "Há 1 dia atrás";
    if (d < 30) return "Há " + d + " dias atrás";
    var me = Math.floor(d / 30);
    return "Há " + me + (me === 1 ? " mês" : " meses") + " atrás";
  }

  // ---------- desenho ----------
  function textoNotificacao(descricao) {
    // os títulos de filmes vêm entre aspas: ficam sublinhados como na referência
    return esc(descricao).replace(/&quot;([^&]+)&quot;/g, "<u>$1</u>");
  }

  function itemHtml(n) {
    var classe = "fa-solid " + String(n.icone || "fa-bell").replace(/^fa-solid\s+/, "");
    var marca = n.imagem
      ? '<img src="' + esc(n.imagem) + '" alt="">'
      : '<i class="' + esc(classe) + '"></i>';
    var selo = n.imagem && n.icone
      ? '<span class="notif-marca"><i class="' + esc(classe) + '"></i></span>'
      : "";
    return (
      '<article class="notif-item' + (n.lida ? " lida" : "") + '" data-id="' + n.id + '"' +
        (n.link ? ' data-link="' + esc(n.link) + '"' : "") + ">" +
        '<span class="notif-icone notif-tipo-' + esc(n.tipo) + '">' + marca + selo + "</span>" +
        '<div class="notif-corpo">' +
          '<p class="notif-texto">' + textoNotificacao(n.descricao) + "</p>" +
          '<span class="notif-quando">' + esc(tempoRelativo(n.criado_em)) + "</span>" +
        "</div>" +
        '<span class="notif-ponto" title="' + (n.lida ? "" : "Não lida") + '"></span>' +
      "</article>"
    );
  }

  function render(lista, naoLidas) {
    if ($badge.length) {
      if (naoLidas > 0) {
        $badge.removeAttr("hidden").show().text(naoLidas > 9 ? "9+" : naoLidas);
      } else {
        $badge.attr("hidden", "hidden").hide().text("");
      }
    }
    if (!lista.length) {
      $lista.html('<p class="notif-vazio">Você não tem notificações ainda.</p>');
      return;
    }
    $lista.html($.map(lista, itemHtml).join(""));
  }

  function carregar() {
    if (!window.pipoEhLogado && !$pagina.length) {
      render([], 0);
      return;
    }
    api("GET", "/api/notificacoes").done(function (r) {
      render((r && r.notificacoes) || [], (r && r.nao_lidas) || 0);
    }).fail(function (x) {
      $lista.html('<p class="notif-vazio">' + esc(erroMsg(x)) + "</p>");
    });
  }

  // ---------- ações ----------
  $(document).on("click", ".notif-item", function () {
    var $item = $(this);
    var id = $item.data("id");
    var link = $item.attr("data-link");
    api("POST", "/api/notificacoes/" + id + "/lida").done(function () {
      $item.addClass("lida").find(".notif-ponto").hide();
      if ($badge.length) {
        var atual = parseInt($badge.text(), 10);
        if (!isNaN(atual) && atual > 0) $badge.text(atual - 1);
      }
    });
    if (link) window.location.href = link;
  });

  $("#notifLerTodas").on("click", function (e) {
    e.stopPropagation();
    api("POST", "/api/notificacoes/ler-todas").done(function () { carregar(); });
  });

  // ---------- carga inicial ----------
  if ($pagina.length) {
    // página "todas as notificações": precisa estar logado
    api("GET", "/api/notificacoes").done(function (r) {
      render((r && r.notificacoes) || [], (r && r.nao_lidas) || 0);
    }).fail(function (x) {
      if (x && x.status === 401) { window.location.href = "login.html"; return; }
      $lista.html('<p class="notif-vazio">' + esc(erroMsg(x)) + "</p>");
    });
  } else if (window.pipoEhLogado) {
    carregar();
  }
  window.pipoRecarregarNotificacoes = carregar;
});
