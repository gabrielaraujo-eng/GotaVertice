const form = document.querySelector('#loginForm');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const feedback = document.querySelector('#loginFeedback');

function setFeedback(message, type = 'error') {
  feedback.textContent = message;
  feedback.className = `form-feedback ${type}`;
}

async function checkSession() {
  const response = await fetch('/api/auth/session');
  if (response.ok) window.location.replace('/dashboard');
}

async function enterDashboard() {
  window.location.replace('/dashboard');
}

checkSession().catch(() => {});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const userEmail = email.value.trim().toLowerCase();
  const userPassword = password.value;
  if (!userEmail || !userPassword) {
    setFeedback('Preencha seu e-mail e sua senha para continuar.');
    return;
  }
  setFeedback('Validando acesso...', 'success');
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    const result = await response.json();
    if (!response.ok) return setFeedback(result.error || 'Não foi possível entrar.');
    await enterDashboard();
  } catch {
    setFeedback('Servidor indisponível. Verifique se o app está em execução.');
  }
});

document.querySelector('#demoLogin').addEventListener('click', () => {
  email.value = 'demo@gotavertice.com';
  password.value = 'agua123';
  form.requestSubmit();
});
document.querySelector('#togglePassword').addEventListener('click', (event) => {
  const showing = password.type === 'text';
  password.type = showing ? 'password' : 'text';
  event.currentTarget.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
});
document.querySelector('#forgotPassword').addEventListener('click', (event) => {
  event.preventDefault();
  setFeedback('A recuperação de senha será conectada ao serviço de e-mail.');
});
document.querySelector('#createAccount').addEventListener('click', (event) => {
  event.preventDefault();
  setFeedback('O cadastro de novos usuários será a próxima etapa.');
});
