const SESSION_KEY = 'agua-consciente-session';
const DEMO_EMAIL = 'demo@gotavertice.com';
const DEMO_PASSWORD = 'agua123';
const form = document.querySelector('#loginForm');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const feedback = document.querySelector('#loginFeedback');

function setFeedback(message, type = 'error') {
  feedback.textContent = message;
  feedback.className = `form-feedback ${type}`;
}

function enterDashboard(userEmail) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: userEmail, loggedAt: new Date().toISOString() }));
  window.location.href = '../index.html';
}

if (localStorage.getItem(SESSION_KEY)) {
  window.location.replace('../index.html');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const userEmail = email.value.trim().toLowerCase();
  const userPassword = password.value;
  if (!userEmail || !userPassword) {
    setFeedback('Preencha seu e-mail e sua senha para continuar.');
    return;
  }
  if (userEmail !== DEMO_EMAIL || userPassword !== DEMO_PASSWORD) {
    setFeedback('Acesso não reconhecido. Use o acesso de demonstração abaixo.');
    return;
  }
  enterDashboard(userEmail);
});

document.querySelector('#demoLogin').addEventListener('click', () => enterDashboard(DEMO_EMAIL));
document.querySelector('#togglePassword').addEventListener('click', (event) => {
  const showing = password.type === 'text';
  password.type = showing ? 'password' : 'text';
  event.currentTarget.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
});

document.querySelector('#forgotPassword').addEventListener('click', (event) => {
  event.preventDefault();
  setFeedback('A recuperação de senha estará disponível com o backend.');
});

document.querySelector('#createAccount').addEventListener('click', (event) => {
  event.preventDefault();
  setFeedback('O cadastro será conectado na próxima etapa do projeto.');
});
