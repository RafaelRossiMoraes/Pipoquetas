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

// Gêneros padronizados — mantenha em sincronia com PIPO_GENEROS em api/rotas/filmes.php.
window.PIPO_GENEROS = [
  "Ação", "Animação", "Aventura", "Comédia", "Crime", "Documentário", "Drama",
  "Família", "Fantasia", "Faroeste", "Ficção científica", "Guerra", "História",
  "Mistério", "Música", "Romance", "Suspense", "Terror", "Thriller"
];

// Desenha as opções de gênero como chips (checkbox) dentro do elemento indicado.
window.pipoRenderGeneros = function ($alvo, selecionados) {
  if (!$alvo || !$alvo.length) return;
  var marcados = {};
  $.each(selecionados || [], function (_, g) { marcados[String(g)] = true; });
  $alvo.html($.map(window.PIPO_GENEROS, function (g) {
    return '<label class="genero-chip"><input type="checkbox" value="' + window.esc(g) + '"' +
      (marcados[g] ? " checked" : "") + '><span>' + window.esc(g) + "</span></label>";
  }).join(""));
};

// Lê os gêneros marcados no seletor de chips.
window.pipoGenerosSelecionados = function ($alvo) {
  if (!$alvo || !$alvo.length) return [];
  return $alvo.find("input[type=checkbox]:checked").map(function () { return this.value; }).get();
};

// Valida e envia uma imagem para /api/filmes/upload (JSON + base64).
// Resolve com { caminho, nome }; em caso de erro, rejeita no formato usado por erroMsg().
window.pipoEnviarImagem = function (arquivo) {
  var dfd = $.Deferred();
  var tipos = /^image\/(png|jpe?g|webp|gif)$/i;
  function falhar(msg) { dfd.reject({ responseJSON: { erro: msg } }); return dfd.promise(); }
  if (!arquivo) return falhar("Selecione uma imagem.");
  if (!tipos.test(arquivo.type || "")) return falhar("Envie uma imagem JPG, PNG, WEBP ou GIF.");
  if (arquivo.size > 4 * 1024 * 1024) return falhar("A imagem pode ter no máximo 4 MB.");
  var leitor = new FileReader();
  leitor.onload = function () {
    api("POST", "/api/filmes/upload", { nome: arquivo.name, dados: leitor.result })
      .done(function (r) { dfd.resolve(r); })
      .fail(function (x) { dfd.reject(x); });
  };
  leitor.onerror = function () { dfd.reject({ responseJSON: { erro: "Não foi possível ler o arquivo." } }); };
  leitor.readAsDataURL(arquivo);
  return dfd.promise();
};

// app.js (jQuery) — comportamentos compartilhados (header, sidebar, dropdown, settings, tema, busca).
// Incluído em todas as páginas. Cada bloco verifica a existência dos elementos.
// Depende de: jQuery (carregado antes deste arquivo em todos os HTML) e js/api.js.
$(function () {
  var CHAVE_USUARIO = "pipo_usuario_cache_v1";
  var CACHE_MS = 5 * 60 * 1000;

  function lerCache() {
    try {
      var bruto = sessionStorage.getItem(CHAVE_USUARIO);
      if (!bruto) return null;
      var dados = JSON.parse(bruto);
      if (!dados || !dados.exp || dados.exp < Date.now() || !dados.usuario) return null;
      return dados;
    } catch (e) { return null; }
  }
  function gravarCache(usuario, naoLidas) {
    try {
      sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify({
        exp: Date.now() + CACHE_MS, usuario: usuario, nao_lidas: naoLidas || 0
      }));
    } catch (e) { /* sem storage */ }
  }
  function limparCache() {
    try { sessionStorage.removeItem(CHAVE_USUARIO); } catch (e) { /* sem storage */ }
  }

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
  var $settingsTitle = $(".settings-header h2");
  var historicoCarregado = false;

  var TITULOS = {
    conta: "Informações da Conta",
    privacidade: "Privacidade",
    informacoes: "Informações",
    seguranca: "Segurança",
    ajuda: "Ajuda",
    avaliacoes: "Histórico de Avaliações"
  };

  function painelDoTexto(texto) {
    var t = $.trim(String(texto)).toLowerCase();
    if (t.indexOf("conta") !== -1) return "conta";
    if (t.indexOf("privacidade") !== -1) return "privacidade";
    if (t.indexOf("informa") !== -1) return "informacoes";
    if (t.indexOf("seguran") !== -1) return "seguranca";
    if (t.indexOf("ajuda") !== -1) return "ajuda";
    if (t.indexOf("avalia") !== -1) return "avaliacoes";
    return "";
  }

  function htmlPainel(chave, corpo) {
    return '<div class="settings-panel" data-panel="' + chave + '">' +
      '<div class="settings-col settings-col-unica">' + corpo + '</div></div>';
  }

  function montarPainelConfiguracoes() {
    var $body = $(".settings-body");
    if (!$body.length || $body.data("pipoMontado")) return;
    var contaHtml = $body.html();
    $body.data("pipoMontado", true);

    var painelSeguranca =
      '<h3 class="settings-subtitulo">Alterar senha</h3>' +
      '<form id="formSenha" class="settings-form" autocomplete="off">' +
        '<label>Senha atual<input type="password" id="senhaAtual" required autocomplete="current-password"></label>' +
        '<label>Nova senha (mínimo 6 caracteres)<input type="password" id="senhaNova" required minlength="6" autocomplete="new-password"></label>' +
        '<label>Repita a nova senha<input type="password" id="senhaNova2" required minlength="6" autocomplete="new-password"></label>' +
        '<div class="settings-form-acoes"><button type="submit" class="btn-primary">Salvar nova senha</button></div>' +
        '<p id="senhaMsg" class="settings-msg" role="status"></p>' +
      '</form>';

    var painelPrivacidade =
      '<h3 class="settings-subtitulo">Privacidade das suas listas</h3>' +
      '<p class="settings-texto">As playlists marcadas como <strong>privadas</strong> só podem ser abertas por você. ' +
      'As públicas podem ser compartilhadas. Favoritos e Lista de Interesses são sempre privados.</p>' +
      '<p class="settings-texto">Você pode alterar a privacidade de cada playlist personalizada na biblioteca.</p>' +
      '<p><a class="settings-link" href="playlists.html">Gerenciar minhas playlists</a></p>';

    var painelInformacoes =
      '<h3 class="settings-subtitulo">Sobre o Pipoquetas</h3>' +
      '<p class="settings-texto">Catálogo, favoritos, lista de interesses, playlists e avaliações em um só lugar.</p>' +
      '<p class="settings-texto">Versão do painel: 1.1 — melhorias de desempenho, upload de imagens e gêneros padronizados.</p>' +
      '<p><a class="settings-link" href="assinatura.html">Conhecer os planos PipoPlus+</a></p>';

    var painelAjuda =
      '<h3 class="settings-subtitulo">Ajuda e sugestões</h3>' +
      '<p class="settings-texto">Encontrou um problema ou tem uma sugestão? Fale com a equipe do projeto.</p>' +
      '<p><a class="settings-link" href="mailto:contato@pipoquetas.demo?subject=Feedback%20Pipoquetas">Enviar e-mail para a equipe</a></p>' +
      '<p><a class="settings-link" href="readme.txt" target="_blank" rel="noopener">Abrir o guia do projeto</a></p>';

    var painelAvaliacoes =
      '<h3 class="settings-subtitulo">Suas avaliações</h3>' +
      '<div id="historicoAvaliacoes" class="settings-historico">' +
        '<p class="settings-texto">Carregando suas avaliações...</p>' +
      '</div>';

    $body.html(
      '<div class="settings-panel active" data-panel="conta">' + contaHtml + '</div>' +
      htmlPainel("privacidade", painelPrivacidade) +
      htmlPainel("informacoes", painelInformacoes) +
      htmlPainel("seguranca", painelSeguranca) +
      htmlPainel("ajuda", painelAjuda) +
      htmlPainel("avaliacoes", painelAvaliacoes)
    );

    // A aba de histórico é acrescentada ao menu existente.
    var $sidebarTabs = $(".settings-sidebar .settings-tab").not(".btn-sair");
    $sidebarTabs.each(function () {
      var chave = painelDoTexto($(this).text());
      if (chave) $(this).attr("data-painel", chave);
    });
    if (!$('.settings-tab[data-painel="avaliacoes"]').length) {
      var $avaliacoes = $('<button class="settings-tab" type="button" data-painel="avaliacoes">Avaliações</button>');
      $sidebarTabs.filter('[data-painel="ajuda"]').before($avaliacoes);
    }
  }

  function estrelas(nota) {
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html += '<i class="' + (i <= nota ? "fa-solid" : "fa-regular") + ' fa-star"></i>';
    }
    return html;
  }

  function carregarHistorico() {
    if (historicoCarregado) return;
    var $alvo = $("#historicoAvaliacoes");
    if (!$alvo.length) return;
    historicoCarregado = true;
    api("GET", "/api/minhas-avaliacoes").done(function (r) {
      var lista = (r && r.avaliacoes) || [];
      if (!lista.length) {
        $alvo.html('<p class="settings-texto">Você ainda não avaliou nenhum filme. ' +
          '<a class="settings-link" href="explore.html">Explore o catálogo</a> e deixe sua opinião.</p>');
        return;
      }
      $alvo.html($.map(lista, function (a) {
        return '<article class="settings-avaliacao">' +
          '<a href="filme.html?id=' + encodeURIComponent(a.filmeId) + '" class="settings-avaliacao-capa">' +
            '<img src="' + esc(a.imagem) + '" alt="" loading="lazy" decoding="async">' +
          '</a>' +
          '<div class="settings-avaliacao-corpo">' +
            '<a class="settings-avaliacao-titulo" href="filme.html?id=' + encodeURIComponent(a.filmeId) + '">' +
              esc(a.titulo) + (a.ano ? ' (' + esc(a.ano) + ')' : '') + '</a>' +
            '<div class="settings-avaliacao-estrelas" aria-label="' + a.nota + ' de 5 estrelas">' + estrelas(a.nota) + '</div>' +
            '<p class="settings-texto">' + esc(a.texto) + '</p>' +
            '<span class="settings-avaliacao-data">' + esc(String(a.criado_em || "").slice(0, 10).split("-").reverse().join("/")) + '</span>' +
          '</div>' +
        '</article>';
      }).join(""));
    }).fail(function (x) {
      historicoCarregado = false;
      $alvo.html('<p class="settings-msg">' + esc(erroMsg(x)) + '</p>');
    });
  }

  function selecionarPainel(chave) {
    montarPainelConfiguracoes();
    var $tabs = $(".settings-tab").not(".btn-sair");
    $tabs.removeClass("active");
    $tabs.filter('[data-painel="' + chave + '"]').addClass("active");
    $(".settings-panel").removeClass("active").filter('[data-panel="' + chave + '"]').addClass("active");
    if ($settingsTitle.length) $settingsTitle.text(TITULOS[chave] || "Configurações");
    if (chave === "avaliacoes") carregarHistorico();
    if (chave === "seguranca") $("#senhaAtual").trigger("focus");
  }

  function abrirConfig(chave) {
    if (!$settingsModal.length) return;
    montarPainelConfiguracoes();
    $settingsModal.addClass("active");
    selecionarPainel(chave || "conta");
    $sidebar.removeClass("expanded");
    $sidebarOverlay.removeClass("active");
    $userDropdown.removeClass("active");
  }
  window.pipoAbrirConfig = abrirConfig;

  montarPainelConfiguracoes();

  $(".settings-tab").not(".btn-sair").on("click", function () {
    var chave = $(this).attr("data-painel") || painelDoTexto($(this).text());
    if (chave) selecionarPainel(chave);
  });

  if ($closeSettingsBtn.length && $settingsModal.length) {
    $closeSettingsBtn.on("click", function () {
      $settingsModal.removeClass("active");
    });
    $settingsModal.on("click", function (e) {
      if (e.target === this) $(this).removeClass("active");
    });
  }

  // Atalho da sidebar: abre direto na aba Conta.
  $(".sidebar a, .sidebar-nav a").filter(function () {
    var txt = $(this).text();
    return txt.indexOf("Configurações") !== -1 || txt.indexOf("Ajustes") !== -1;
  }).on("click", function (e) {
    e.preventDefault();
    abrirConfig("conta");
  });

  // Alteração de senha (aba Segurança).
  $(document).on("submit", "#formSenha", function (e) {
    e.preventDefault();
    var atual = $("#senhaAtual").val();
    var nova = $("#senhaNova").val();
    var nova2 = $("#senhaNova2").val();
    var $msg = $("#senhaMsg");
    if (nova !== nova2) {
      $msg.text("As senhas novas não são iguais.").removeClass("ok");
      return;
    }
    $msg.text("Salvando...").removeClass("ok");
    api("POST", "/api/perfil/senha", { senha_atual: atual, nova_senha: nova }).done(function (r) {
      $msg.text((r && r.mensagem) || "Senha alterada com sucesso.").addClass("ok");
      $("#formSenha").trigger("reset");
    }).fail(function (x) {
      $msg.text(erroMsg(x)).removeClass("ok");
    });
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
    limparCache();
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

  // Menu da foto de perfil: todas as opções levam a algo real, para todos os perfis.
  function montarMenuPerfil(u) {
    var $corpo = $("#userDropdown .dropdown-body");
    if (!$corpo.length) return;
    var tipo = (u && u.tipo) || "usuario";
    var col1 = "", col2 = "";

    if (tipo === "empresa") {
      col1 =
        '<a href="#" data-pipo="perfil">Dados da empresa</a>' +
        '<a href="empresa.html#meus-filmes">Meus Filmes</a>' +
        '<a href="empresa.html?novo=1">Cadastrar filme</a>';
      col2 =
        '<a href="#" data-pipo="historico">Histórico de Avaliações</a>' +
        '<a href="#" data-pipo="ajuda">Feedback/ Sugestões</a>' +
        '<a href="#" class="logout-link" data-pipo="sair">Sair/Logout</a>';
    } else if (tipo === "administrador") {
      col1 =
        '<a href="admin.html">Painel Administrativo</a>' +
        '<a href="admin.html#empresas-pendentes">Empresas</a>' +
        '<a href="admin.html#filmes-pendentes">Filmes pendentes</a>';
      col2 =
        '<a href="admin.html#catalogo">Catálogo</a>' +
        '<a href="#" data-pipo="historico">Histórico de Avaliações</a>' +
        '<a href="#" data-pipo="ajuda">Feedback/ Sugestões</a>' +
        '<a href="#" class="logout-link" data-pipo="sair">Sair/Logout</a>';
    } else {
      col1 =
        '<a href="#" data-pipo="perfil">Ver/Editar perfil</a>' +
        '<a href="#" data-pipo="historico">Histórico de Avaliações</a>' +
        '<a href="lista-interesses.html">Minha Lista</a>';
      col2 =
        '<a href="#" data-pipo="ajuda">Feedback/ Sugestões</a>' +
        '<a href="#" class="logout-link" data-pipo="sair">Sair/Logout</a>';
    }

    $corpo.html(
      '<div class="dropdown-col">' + col1 + '</div>' +
      '<div class="dropdown-divider"></div>' +
      '<div class="dropdown-col">' + col2 + '</div>'
    );
  }

  function atualizarSino(naoLidas) {
    var $badge = $("#notifBadge");
    if (!$badge.length) return;
    var n = parseInt(naoLidas, 10) || 0;
    if (n > 0) $badge.removeAttr("hidden").show().text(n > 9 ? "9+" : n);
    else $badge.attr("hidden", "hidden").hide().text("");
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
  function aplicarEstado(logado, usuario, notificar) {
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
    if (notificar !== false) {
      // avisa as páginas que precisam saber o estado da sessão (explore, filme, playlists...)
      $(document).trigger("pipo:auth", [!!logado, usuario || null]);
    }
  }

  function aplicarLogado(usuario, naoLidas, notificar) {
    window.usuarioAtual = usuario;
    preencherConta(usuario);
    montarMenuPerfil(usuario);
    atualizarSino(naoLidas);
    aplicarEstado(true, usuario, notificar);
  }

  $(document).on("click", "a[href='login.html']", function (e) { if (window.pipoEhLogado) sair(e); });
  $(".btn-sair").on("click", sair);
  $(document).on("click", "[data-pipo]", function (e) {
    var acao = $(this).attr("data-pipo");
    if (acao === "sair") { sair(e); return; }
    if (acao === "perfil") { e.preventDefault(); abrirConfig("conta"); }
    if (acao === "historico") { e.preventDefault(); abrirConfig("avaliacoes"); }
    if (acao === "ajuda") { e.preventDefault(); abrirConfig("ajuda"); }
  });

  // Usa a sessão em cache para pintar a interface na hora e revalida no servidor.
  var cache = lerCache();
  var cacheAplicado = false;
  if (cache) {
    cacheAplicado = true;
    aplicarLogado(cache.usuario, cache.nao_lidas, true);
  }

  api("GET", "/api/eu").done(function (r) {
    if (r && r.logado) {
      var mesmo = cacheAplicado && window.usuarioAtual && window.usuarioAtual.id === r.usuario.id
        && window.usuarioAtual.tipo === r.usuario.tipo;
      gravarCache(r.usuario, r.nao_lidas);
      aplicarLogado(r.usuario, r.nao_lidas, !mesmo);
    } else {
      limparCache();
      window.pipoSetToken("");
      modoConvidado();
      aplicarEstado(false, null, !cacheAplicado);
    }
  }).fail(function (x) {
    limparCache();
    modoConvidado();
    aplicarEstado(false, null, !cacheAplicado);
    window.pipoAviso(window.erroMsg(x));
  }).always(function () {
    $("body").addClass("auth-pronto");
  });
});
