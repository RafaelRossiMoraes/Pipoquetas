// login.js (jQuery) — toggle de senha + autenticação por perfil.
// Perfis de demonstração (ajustar ao cadastro real): usuario / administrador / empresa (senha 123456).
// Depende de: jQuery e do DOM de login.html.
$(function () {
  var $togglePassword = $("#togglePassword");
  var $passwordInput = $("#password");
  var $loginForm = $("#loginForm");
  var $mensagem = $("#mensagem");

  if ($togglePassword.length && $passwordInput.length) {
    $togglePassword.on("click", function () {
      var isHidden = $passwordInput.attr("type") === "password";
      $passwordInput.attr("type", isHidden ? "text" : "password");
      $(this).toggleClass("fa-eye fa-eye-slash");
    });
  }

  if ($loginForm.length) {
    $loginForm.on("submit", function (e) {
      e.preventDefault();
      var usuario = $.trim($("#email").val()).toLowerCase();
      var senha = $passwordInput.val();

      if (usuario === "usuario" && senha === "123456") window.location.href = "index.html";
      else if (usuario === "administrador" && senha === "123456") window.location.href = "admin.html";
      else if (usuario === "empresa" && senha === "123456") window.location.href = "empresa.html";
      else if ($mensagem.length) $mensagem.text("Usuário ou senha não conferem.");
    });
  }
});
