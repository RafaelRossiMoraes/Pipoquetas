// api.js — cliente da API do Pipoquetas.
// Fala com api/index.php (PHP + banco de dados) usando os mesmos endereços /api/... do projeto:
//   api("GET", "/api/eu")            api("POST", "/api/login", {...})
// A sessão é um token guardado no navegador e conferido sempre no servidor.
(function () {
  var CHAVE_TOKEN = "pipo_sessao_token";
  var CHAVE_MIGRACAO = "pipo_migrado_bd";
  var BASE = "api/index.php";
  var SEM_SERVIDOR = "Não foi possível falar com o servidor do Pipoquetas. Rode o INICIAR.bat e abra http://localhost:8080/index.html.";

  window.pipoServidorOn = true; // vira false quando o servidor não responde

  function ler(chave) { try { return localStorage.getItem(chave) || ""; } catch (e) { return ""; } }
  function gravar(chave, valor) { try { if (valor) localStorage.setItem(chave, valor); else localStorage.removeItem(chave); } catch (e) { /* sem storage */ } }

  window.pipoToken = function () { return ler(CHAVE_TOKEN); };
  window.pipoSetToken = function (token) { gravar(CHAVE_TOKEN, token || ""); };

  function rotaDe(caminho) {
    return String(caminho == null ? "" : caminho).replace(/^\/?api\//, "");
  }

  function pedir(metodo, caminho, dados) {
    var opcoes = {
      url: BASE + "?r=" + encodeURIComponent(rotaDe(caminho)),
      method: metodo,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      cache: false,
      headers: { "X-Pipoquetas-Token": window.pipoToken() }
    };
    // POST/PUT/DELETE sempre vão com corpo (o servidor exige Content-Length)
    if (metodo === "GET") {
      opcoes.data = undefined;
    } else {
      opcoes.data = JSON.stringify(dados || {});
    }
    // Deferred próprio: a resposta é resolvida com UM valor só (o $.when do painel
    // do administrador precisa disso, senão recebe [dados, status, xhr]).
    var resposta = $.Deferred();
    $.ajax(opcoes).done(function (dados) {
      window.pipoServidorOn = true;
      resposta.resolve(dados);
    }).fail(function (xhr) {
      if (xhr && xhr.status === 0) { // servidor fora do ar
        window.pipoServidorOn = false;
        xhr.responseJSON = { erro: SEM_SERVIDOR };
      }
      var msg = (xhr && xhr.responseJSON && xhr.responseJSON.erro) || "Algo deu errado. Tente de novo.";
      resposta.reject(xhr, "error", msg);
    });
    return resposta.promise();
  }

  // Traz do navegador para o banco as contas que existiam no localStorage (uma única vez).
  var migracao = null;
  function garantirMigracao() {
    if (migracao) return migracao;
    migracao = $.Deferred().resolve().promise();
    if (ler(CHAVE_MIGRACAO)) return migracao; // já migrou em outra visita
    var bruto = "";
    try { bruto = localStorage.getItem("pipo_clientes") || ""; } catch (e) { bruto = ""; }
    var lista = null;
    try { lista = bruto ? JSON.parse(bruto) : null; } catch (e) { lista = null; }
    if (!lista || !lista.length) {
      gravar(CHAVE_MIGRACAO, "1");
      return migracao;
    }
    // a migração nunca bloqueia o site: se falhar, as requisições continuam normalmente
    var d = $.Deferred();
    migracao = d.promise();
    pedir("POST", "/api/clientes/importar", { clientes: lista })
      .done(function () { gravar(CHAVE_MIGRACAO, "1"); })
      .always(function () { d.resolve(); });
    return migracao;
  }

  window.api = function (metodo, caminho, dados) {
    return garantirMigracao().then(function () {
      return pedir(metodo, caminho, dados);
    });
  };

  // Botão da tela de login: baixa os cadastros como arquivo JSON
  window.baixarClientesJson = function () {
    window.api("GET", "/api/clientes/export").done(function (r) {
      var lista = (r && r.clientes) ? r.clientes : ($.isArray(r) ? r : []);
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(lista, null, 2)], { type: "application/json" }));
      a.download = "clientes.json";
      a.click();
    }).fail(function (x) {
      window.pipoAviso(window.erroMsg(x));
    });
  };

  // Aviso rápido (usado quando o servidor não responde)
  window.pipoAviso = function (texto) {
    if (!texto) return;
    var $aviso = $("#pipoAviso");
    if (!$aviso.length) {
      $aviso = $('<div id="pipoAviso" role="status"></div>').appendTo("body");
    }
    $aviso.text(texto).addClass("visible");
    clearTimeout($aviso.data("t"));
    $aviso.data("t", setTimeout(function () { $aviso.removeClass("visible"); }, 4200));
  };

  // Aviso com HTML (para mensagens com link)
  window.pipoAvisoHtml = function (html) {
    if (!html) return;
    var $aviso = $("#pipoAviso");
    if (!$aviso.length) {
      $aviso = $('<div id="pipoAviso" role="status"></div>').appendTo("body");
    }
    $aviso.html(html).addClass("visible");
    clearTimeout($aviso.data("t"));
    $aviso.data("t", setTimeout(function () { $aviso.removeClass("visible"); }, 5200));
  };
})();
