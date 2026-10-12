// app.js (jQuery) — comportamentos compartilhados (header, sidebar, dropdown, settings, tema, busca).
// Incluído em todas as páginas. Cada bloco verifica a existência dos elementos.
// Depende de: jQuery 3.7.1 (carregado antes deste arquivo em todos os HTML).
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
});
