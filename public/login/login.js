import {
  loginAccount,
  loginWithGoogle,
  recoverPassword,
  registerAccount,
  watchAuth,
} from "../firebase.js";

const form = document.querySelector("#loginForm");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const feedback = document.querySelector("#loginFeedback");
const formEyebrow = document.querySelector("#formEyebrow");
const title = document.querySelector("#login-title");
const subtitle = document.querySelector("#formSubtitle");
const submitButton = document.querySelector("#submitButton");
const accountNote = document.querySelector("#accountNote");
const initialMode = new URLSearchParams(window.location.search).get("mode");
let mode = initialMode === "register" ? "register" : "login";

function setFeedback(message, type = "error") {
  feedback.textContent = message;
  feedback.className = `form-feedback ${type}`;
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use":
      "Este e-mail já possui uma conta. Entre com sua senha.",
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/weak-password": "A senha precisa ter pelo menos oito caracteres.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "auth/invalid-action-code": "Este link de recuperação não é mais válido.",
  };
  return (
    messages[error.code] ||
    "Não foi possível concluir o acesso. Tente novamente."
  );
}

function renderMode() {
  const registering = mode === "register";
  formEyebrow.textContent = registering ? "Comece agora" : "Acesse sua conta";
  title.textContent = registering ? "Criar sua conta" : "Entrar no GotaVértice";
  subtitle.textContent = registering
    ? "Cadastre-se para acompanhar o consumo da sua residência."
    : "Entre para continuar acompanhando sua residência.";
  password.autocomplete = registering ? "new-password" : "current-password";
  password.placeholder = registering
    ? "Crie uma senha com 8 caracteres"
    : "Digite sua senha";
  submitButton.innerHTML = registering
    ? "Criar conta <span>→</span>"
    : "Entrar <span>→</span>";
  accountNote.innerHTML = registering
    ? 'Já possui uma conta? <a href="#" id="modeToggle">Entrar agora</a>'
    : 'Ainda não possui uma conta? <a href="#" id="modeToggle">Criar minha conta</a>';
  document.querySelector("#modeToggle").addEventListener("click", (event) => {
    event.preventDefault();
    mode = registering ? "login" : "register";
    setFeedback("");
    renderMode();
  });
}

watchAuth((user) => {
  if (user) window.location.replace("/dashboard");
});

async function submitCredentials() {
  const userEmail = email.value.trim().toLowerCase();
  const userPassword = password.value;
  if (!userEmail || !userPassword)
    return setFeedback("Preencha seu e-mail e sua senha para continuar.");
  if (mode === "register" && userPassword.length < 8)
    return setFeedback("A senha precisa ter pelo menos oito caracteres.");
  setFeedback(
    mode === "register" ? "Criando sua conta..." : "Validando acesso...",
    "success",
  );
  try {
    if (mode === "register") await registerAccount(userEmail, userPassword);
    else await loginAccount(userEmail, userPassword);
    window.location.replace("/dashboard");
  } catch (error) {
    setFeedback(friendlyError(error));
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCredentials();
});

document.querySelector("#togglePassword").addEventListener("click", (event) => {
  const showing = password.type === "text";
  password.type = showing ? "password" : "text";
  event.currentTarget.setAttribute(
    "aria-label",
    showing ? "Mostrar senha" : "Ocultar senha",
  );
});

document.querySelector("#forgotPassword").addEventListener("click", async (event) => {
  event.preventDefault();
  const userEmail = email.value.trim().toLowerCase();
  if (!userEmail)
    return setFeedback("Informe seu e-mail para receber o link de recuperação.");
  if (!email.checkValidity())
    return setFeedback("Informe um e-mail válido para continuar.");

  setFeedback("Enviando o link de recuperação...", "success");
  try {
    await recoverPassword(userEmail);
    setFeedback(
      "Se existir uma conta com este e-mail, você receberá um link para criar uma nova senha.",
      "success",
    );
  } catch (error) {
    if (error.code === "auth/invalid-email")
      return setFeedback("Informe um e-mail válido para continuar.");
    setFeedback("Não foi possível enviar o link agora. Tente novamente em instantes.");
  }
});

document.querySelector("#googleButton").addEventListener("click", async () => {
  setFeedback("Abrindo o login do Google...", "success");
  try {
    await loginWithGoogle();
    window.location.replace("/dashboard");
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user")
      return setFeedback("O login do Google foi cancelado.");
    setFeedback("Não foi possível entrar com o Google. Tente novamente.");
  }
});

renderMode();
