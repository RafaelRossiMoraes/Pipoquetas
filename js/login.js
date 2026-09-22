// login.js — toggle de senha + autenticação por perfil.
// Perfis de demonstração (ajustar ao cadastro real): usuario / administrador / empresa (senha 123456).
// Depende apenas do DOM de login.html.
document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const loginForm = document.getElementById("loginForm");
  const mensagem = document.getElementById("mensagem");

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      togglePassword.classList.toggle("fa-eye");
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuario = document.getElementById("email").value.trim().toLowerCase();
      const senha = passwordInput.value;

      if (usuario === "usuario" && senha === "123456") window.location.href = "index.html";
      else if (usuario === "administrador" && senha === "123456") window.location.href = "admin.html";
      else if (usuario === "empresa" && senha === "123456") window.location.href = "empresa.html";
      else if (mensagem) mensagem.textContent = "Usuário ou senha não conferem.";
    });
  }
});
