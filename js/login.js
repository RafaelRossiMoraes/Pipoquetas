// login.js (jQuery) — entrar, cadastrar (cliente/empresa/administrador) e "esqueci a senha".
// Conversa com o servidor.py pelas funções api() e erroMsg() do js/app.js.
$(function () {
  var perfil = "usuario";
  var identificadorReset = "";
  var $msg = $("#mensagem");

  function aviso(texto, ok) { $msg.text(texto || "").toggleClass("ok", !!ok); }

  function mostrar(qual) { // login | cadastro | esqueci | redefinir
    $("#loginForm, #cadastroForm, #esqueciForm, #redefinirForm").prop("hidden", true);
    $("#" + qual + "Form").prop("hidden", false);
    $("#rodapeLogin").prop("hidden", qual !== "login");
    $("#rodapeVoltar").prop("hidden", qual === "login");
    $("#perfilTabs").prop("hidden", qual === "esqueci" || qual === "redefinir");
    aviso("");
  }

  function aplicarPerfil(p) {
    perfil = p;
    $(".perfil-tab").removeClass("active").filter('[data-perfil="' + p + '"]').addClass("active");
    $(".campo-perfil").each(function () {
      var visivel = $(this).hasClass("so-" + p);
      $(this).prop("hidden", !visivel).find("input").prop("required", visivel && p !== "usuario");
    });
    aviso("");
  }

  $(".perfil-tab").on("click", function () { aplicarPerfil($(this).data("perfil")); });
  $("#linkCadastro").on("click", function (e) { e.preventDefault(); mostrar("cadastro"); });
  $("#linkVoltar").on("click", function (e) { e.preventDefault(); mostrar("login"); });
  $("#linkEsqueci").on("click", function (e) { e.preventDefault(); mostrar("esqueci"); });

  $("#togglePassword").on("click", function () {
    var $s = $("#password");
    $s.attr("type", $s.attr("type") === "password" ? "text" : "password");
    $(this).toggleClass("fa-eye fa-eye-slash");
  });

  $("#loginForm").on("submit", function (e) {
    e.preventDefault();
    api("POST", "/api/login", { identificador: $("#email").val(), senha: $("#password").val(), tipo: perfil })
      .done(function (r) {
        if (r.token) window.pipoSetToken(r.token);
        window.location.href = r.destino;
      })
      .fail(function (x) { aviso(erroMsg(x)); });
  });

  $("#cadastroForm").on("submit", function (e) {
    e.preventDefault();
    if ($("#cadSenha").val() !== $("#cadSenha2").val()) return aviso("As senhas não são iguais.");
    api("POST", "/api/cadastro", {
      tipo: perfil, nome: $("#cadNome").val(), usuario: $("#cadUsuario").val(), email: $("#cadEmail").val(),
      senha: $("#cadSenha").val(), nascimento: $("#cadNascimento").val(), cnpj: $("#cadCnpj").val(), codigo: $("#cadCodigo").val()
    }).done(function (r) {
      if (r.token) window.pipoSetToken(r.token);
      if (r.destino) { window.location.href = r.destino; return; }
      mostrar("login");
      aviso(r.mensagem, true);
    }).fail(function (x) { aviso(erroMsg(x)); });
  });

  $("#esqueciForm").on("submit", function (e) {
    e.preventDefault();
    identificadorReset = $("#esqId").val();
    api("POST", "/api/esqueci-senha", { identificador: identificadorReset }).done(function (r) {
      mostrar("redefinir");
      $("#codigoDemo").prop("hidden", !r.codigo).text(r.codigo ? "Modo demonstração: seu código é " + r.codigo : "");
      aviso(r.mensagem, true);
    }).fail(function (x) { aviso(erroMsg(x)); });
  });

  $("#redefinirForm").on("submit", function (e) {
    e.preventDefault();
    api("POST", "/api/redefinir-senha", { identificador: identificadorReset, codigo: $("#redCodigo").val(), senha: $("#redSenha").val() })
      .done(function (r) { mostrar("login"); aviso(r.mensagem, true); })
      .fail(function (x) { aviso(erroMsg(x)); });
  });

  $("#baixarClientes").on("click", function (e) { e.preventDefault(); baixarClientesJson(); });

  // Atalhos pela URL: login.html?cadastro=1&perfil=empresa
  var params = new URLSearchParams(window.location.search);
  aplicarPerfil(["usuario", "empresa", "administrador"].indexOf(params.get("perfil")) !== -1 ? params.get("perfil") : "usuario");
  if (params.get("cadastro")) mostrar("cadastro");
});
