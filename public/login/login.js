const form = document.querySelector('#loginForm');
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const feedback = document.querySelector('#loginFeedback');
const formEyebrow = document.querySelector('#formEyebrow');
const title = document.querySelector('#login-title');
const subtitle = document.querySelector('#formSubtitle');
const submitButton = document.querySelector('#submitButton');
const accountNote = document.querySelector('#accountNote');
let mode = 'login';

function setFeedback(message, type = 'error') {
  feedback.textContent = message;
  feedback.className = `form-feedback ${type}`;
}
function renderMode() {
  const registering = mode === 'register';
  formEyebrow.textContent = registering ? 'Comece agora' : 'Acesse sua conta';
  title.textContent = registering ? 'Criar sua conta' : 'Entrar no GotaVértice';
  subtitle.textContent = registering ? 'Cadastre-se para acompanhar o consumo da sua residência.' : 'Entre para continuar acompanhando sua residência.';
  password.autocomplete = registering ? 'new-password' : 'current-password';
  password.placeholder = registering ? 'Crie uma senha com 8 caracteres' : 'Digite sua senha';
  submitButton.innerHTML = registering ? 'Criar conta <span>→</span>' : 'Entrar <span>→</span>';
  accountNote.innerHTML = registering ? 'Já possui uma conta? <a href="#" id="modeToggle">Entrar agora</a>' : 'Ainda não possui uma conta? <a href="#" id="modeToggle">Criar minha conta</a>';
  document.querySelector('#modeToggle').addEventListener('click', (event) => { event.preventDefault(); mode = registering ? 'login' : 'register'; setFeedback(''); renderMode(); });
}
async function checkSession() {
  const response = await fetch('/api/auth/session');
  if (response.ok) window.location.replace('/dashboard');
}
async function submitCredentials() {
  const userEmail = email.value.trim().toLowerCase();
  const userPassword = password.value;
  if (!userEmail || !userPassword) return setFeedback('Preencha seu e-mail e sua senha para continuar.');
  if (mode === 'register' && userPassword.length < 8) return setFeedback('A senha precisa ter pelo menos 8 caracteres.');
  setFeedback(mode === 'register' ? 'Criando sua conta...' : 'Validando acesso...', 'success');
  try {
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: userPassword }) });
    const result = await response.json();
    if (!response.ok) return setFeedback(result.error || 'Não foi possível concluir o acesso.');
    window.location.replace('/dashboard');
  } catch { setFeedback('Servidor indisponível. Verifique se o app está em execução.'); }
}
checkSession().catch(() => {});
form.addEventListener('submit', (event) => { event.preventDefault(); submitCredentials(); });
document.querySelector('#togglePassword').addEventListener('click', (event) => { const showing = password.type === 'text'; password.type = showing ? 'password' : 'text'; event.currentTarget.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha'); });
document.querySelector('#forgotPassword').addEventListener('click', (event) => { event.preventDefault(); setFeedback('A recuperação de senha será adicionada quando o serviço de e-mail estiver configurado.'); });
renderMode();
