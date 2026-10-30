// ---------- Utilitários globais (todas as páginas) ----------
window.esc = function (s) { // evita que texto digitado vire HTML
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};
window.erroMsg = function (x) {
  return (x && x.responseJSON && x.responseJSON.erro) || "Algo deu errado. Tente de novo.";
};
window.usuarioAtual = null;
window.pipoEhLogado = false;

// app.js (jQuery) — comportamentos compartilhados (header, sidebar, dropdown, settings, tema, busca).
// Incluído em todas as páginas. Cada bloco verifica a existência dos elementos.
// Depende de: jQuery (carregado antes deste arquivo em todos os HTML) e js/api.js.
$(function () {
  // ---------- Sidebar ----------
  var $sidebar = $("#sidebar");
  var $dropbtn = $("#dropbtn, #menuToggle");
  var $sidebarOverlay = $("#sidebarOverlay");

  function toggleSidebar() {
    if (!$sidebar.length) return;
    $sidebar.toggleClass("expanded");
    $sidebarOverlay.toggleClass("active");
  }

  $dropbtn.on("click", toggleSidebar);
  $sidebarOverlay.on("click", toggleSidebar);

  // ---------- Dropdown do avatar ----------
  var $avatarBtn = $("#avatarBtn");
  var $userDropdown = $("#userDropdown");

  if ($avatarBtn.length && $userDropdown.length) {
    $avatarBtn.on("click", function (e) {
      e.stopPropagation();
      $userDropdown.toggleClass("active");
    });
    $(document).on("click", function (e) {
      if (!$(e.target).closest("#userDropdown, #avatarBtn").length) {
        $userDropdown.removeClass("active");
      }
    });
  }

  // ---------- Modal de configurações ----------
  var $settingsModal = $("#settingsModal");
  var $closeSettingsBtn = $("#closeSettingsBtn");

  $(".sidebar a, .sidebar-nav a")
    .filter(function () {
      var txt = $(this).text();
      return txt.indexOf("Configurações") !== -1 || txt.indexOf("Ajustes") !== -1;
    })
    .on("click", function (e) {
      e.preventDefault();
      $settingsModal.addClass("active");
      $sidebar.removeClass("expanded");
      $sidebarOverlay.removeClass("active");
    });

  if ($closeSettingsBtn.length && $settingsModal.length) {
    $closeSettingsBtn.on("click", function () {
      $settingsModal.removeClass("active");
    });
    $settingsModal.on("click", function (e) {
      if (e.target === this) {
        $(this).removeClass("active");
      }
    });
  }

  // Abas do modal (troca o título; conteúdo detalhado por aba fica para o backend)
  var $settingsTabs = $(".settings-tab:not(.btn-sair)");
  var $settingsTitle = $(".settings-header h2");
  $settingsTabs.on("click", function () {
    var $tab = $(this);
    $settingsTabs.removeClass("active");
    $tab.addClass("active");
    if ($settingsTitle.length) {
      var nomes = {
        Conta: "Informações da Conta",
        Privacidade: "Privacidade",
        Informações: "Informações",
        Segurança: "Segurança",
        Ajuda: "Ajuda"
      };
      var nome = $.trim($tab.text());
      $settingsTitle.text(nomes[nome] || nome);
    }
  });

  // ---------- Tema Escuro/Claro (substitui o antigo index_dark.html) ----------
  var $themeToggle = $(".theme-toggle");
  function aplicarTema(tema) {
    $("body").attr("data-theme", tema);
    try { localStorage.setItem("pipoquetas-tema", tema); } catch (err) { /* sem storage */ }
    $themeToggle.find("span").each(function () {
      $(this).toggleClass("active", $.trim($(this).text()).toLowerCase() === tema);
    });
  }
  var temaSalvo = "claro";
  try { temaSalvo = localStorage.getItem("pipoquetas-tema") || "claro"; } catch (err) { /* sem storage */ }
  aplicarTema(temaSalvo);
  $themeToggle.find("span").on("click", function () {
    aplicarTema($.trim($(this).text()).toLowerCase());
  });

  // ---------- Busca do header -> explore.html?q= ----------
  $(".search-bar").each(function () {
    var $bar = $(this);
    var $input = $bar.find("input");
    var $btn = $bar.find(".search-btn");
    if (!$input.length) return;
    function buscar() {
      var q = $.trim($input.val());
      if (!q) return;
      window.location.href = "explore.html?q=" + encodeURIComponent(q);
    }
    $btn.on("click", buscar);
    $input.on("keydown", function (e) { if (e.key === "Enter") buscar(); });
  });

  // ---------- Sessão: convidado x logado ----------
  var ROTULOS = { usuario: "Comum", empresa: "Empresa", administrador: "Administrador" };
  var PAGINAS_RESTRITAS = { "admin.html": "administrador", "empresa.html": "empresa" };

  function sair(e) {
    if (e) e.preventDefault();
    api("POST", "/api/logout").always(function () {
      window.pipoSetToken("");
      window.location.href = "index.html";
    });
  }

  function dataBR(iso) { return (iso || "").slice(0, 10).split("-").reverse().join("/"); }

  function preencherConta(u) {
    $(".dropdown-header span").text("Seja bem-vindo, " + String(u.nome).split(" ")[0] + "!");
    var valores = { "Nome:": u.nome, "E-mail:": u.email, "Tipo de Usuário:": ROTULOS[u.tipo],
      "Data de Cadastro:": dataBR(u.criado_em), "Data de Nascimento:": dataBR(u.nascimento) };
    $(".info-group").each(function () { // mostra só o que existe no cadastro
      var rotulo = $.trim($(this).find("label").text());
      if (rotulo === "Tema:") return;
      if (valores[rotulo]) $(this).find("span").first().text(valores[rotulo]); else $(this).hide();
    });
  }

  // Convidado: o header mostra "Entrar" e "Cadastrar-se" (sem sino de notificações).
  function modoConvidado() {
    $(".header-right").html(
      '<a class="btn-guest btn-guest-entrar" href="login.html">Entrar</a>' +
      '<a class="btn-guest btn-guest-cadastrar" href="login.html?cadastro=1">Cadastrar-se</a>'
    );
    $(".footer-logout").text("Entrar");
    $(".info-group").each(function () { if ($.trim($(this).find("label").text()) !== "Tema:") $(this).hide(); });
  }

  // Aplica o estado de autenticação na sidebar, no header e nas páginas restritas.
  function aplicarEstado(logado, usuario) {
    window.pipoEhLogado = !!logado;
    $("body").toggleClass("logado", !!logado).toggleClass("convidado", !logado);

    var atual = (location.pathname.split("/").pop() || "index.html");
    $(".sidebar a[href]").each(function () {
      var href = String($(this).attr("href")).split("?")[0].split("#")[0];
      $(this).toggleClass("active", href === atual);
    });

    var exigido = PAGINAS_RESTRITAS[atual];
    if (exigido && (!logado || !usuario || usuario.tipo !== exigido)) {
      window.location.replace("login.html");
      return;
    }
    // avisa as páginas que precisam saber o estado da sessão (explore, filme, playlists...)
    $(document).trigger("pipo:auth", [!!logado, usuario || null]);
  }

  $(document).on("click", "a[href='login.html']", function (e) { if (window.pipoEhLogado) sair(e); });
  $(".btn-sair").on("click", sair);

  api("GET", "/api/eu").done(function (r) {
    if (r && r.logado) {
      window.usuarioAtual = r.usuario;
      preencherConta(r.usuario);
      aplicarEstado(true, r.usuario);
    } else {
      window.pipoSetToken("");
      modoConvidado();
      aplicarEstado(false, null);
    }
  }).fail(function (x) {
    modoConvidado();
    aplicarEstado(false, null);
    window.pipoAviso(window.erroMsg(x));
  }).always(function () {
    $("body").addClass("auth-pronto");
  });
});
