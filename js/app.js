// app.js — comportamentos compartilhados (header, sidebar, dropdown, settings, tema, busca).
// Incluído em todas as páginas. Cada bloco verifica a existência dos elementos.
(function () {
  // ---------- Sidebar ----------
  const sidebar = document.getElementById("sidebar");
  const dropbtn = document.getElementById("dropbtn") || document.getElementById("menuToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function toggleSidebar() {
    if (!sidebar) return;
    sidebar.classList.toggle("expanded");
    if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
  }

  if (dropbtn) dropbtn.addEventListener("click", toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);

  // ---------- Dropdown do avatar ----------
  const avatarBtn = document.getElementById("avatarBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (avatarBtn && userDropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
      if (!userDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });
  }

  // ---------- Modal de configurações ----------
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");

  document.querySelectorAll(".sidebar a, .sidebar-nav a").forEach((link) => {
    if (link.textContent.includes("Configurações") || link.textContent.includes("Ajustes")) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (settingsModal) settingsModal.classList.add("active");
        if (sidebar) sidebar.classList.remove("expanded");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
      });
    }
  });

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("active"));
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) settingsModal.classList.remove("active");
    });
  }

  // Abas do modal (troca o título; conteúdo detalhado por aba fica para o backend)
  const settingsTabs = document.querySelectorAll(".settings-tab:not(.btn-sair)");
  const settingsTitle = document.querySelector(".settings-header h2");
  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      settingsTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      if (settingsTitle) {
        const nomes = {
          Conta: "Informações da Conta",
          Privacidade: "Privacidade",
          Informações: "Informações",
          Segurança: "Segurança",
          Ajuda: "Ajuda"
        };
        settingsTitle.textContent = nomes[tab.textContent.trim()] || tab.textContent.trim();
      }
    });
  });

  // ---------- Tema Escuro/Claro (substitui o antigo index_dark.html) ----------
  const themeToggle = document.querySelector(".theme-toggle");
  function aplicarTema(tema) {
    document.body.dataset.theme = tema;
    try { localStorage.setItem("pipoquetas-tema", tema); } catch (e) { /* sem storage */ }
    if (themeToggle) {
      themeToggle.querySelectorAll("span").forEach((s) => {
        s.classList.toggle("active", s.textContent.trim().toLowerCase() === tema);
      });
    }
  }
  let temaSalvo = "claro";
  try { temaSalvo = localStorage.getItem("pipoquetas-tema") || "claro"; } catch (e) { /* sem storage */ }
  aplicarTema(temaSalvo);
  if (themeToggle) {
    themeToggle.querySelectorAll("span").forEach((s) => {
      s.addEventListener("click", () => aplicarTema(s.textContent.trim().toLowerCase()));
    });
  }

  // ---------- Busca do header -> explore.html?q= ----------
  document.querySelectorAll(".search-bar").forEach((bar) => {
    const input = bar.querySelector("input");
    const btn = bar.querySelector(".search-btn");
    if (!input) return;
    function buscar() {
      const q = input.value.trim();
      if (!q) return;
      window.location.href = "explore.html?q=" + encodeURIComponent(q);
    }
    if (btn) btn.addEventListener("click", buscar);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") buscar(); });
  });
})();
