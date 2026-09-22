// Mostrar/ocultar senha
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

// Autenticação e redirecionamento por perfil
const loginForm = document.getElementById('loginForm');
const mensagem = document.getElementById('mensagem');

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const usuario = document.getElementById('email').value.trim().toLowerCase();
    const senha = passwordInput.value;

    // Ajuste as credenciais de cada perfil conforme o cadastro real do sistema
    if (usuario === 'usuario' && senha === '123456')
        window.location.href = 'index.html';
    else if (usuario === 'administrador' && senha === '123456')
        window.location.href = 'admin.html';
    else if (usuario === 'empresa' && senha === '123456')
        window.location.href = 'empresa.html';
    else
        mensagem.textContent = 'Usuário ou senha não conferem.';
});