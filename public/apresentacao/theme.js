const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");
const themeIcon = document.querySelector("#themeIcon");

function readSavedTheme() {
  try {
    return window.localStorage.getItem("gotavertice-theme");
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem("gotavertice-theme", theme);
  } catch {
    // A página continua funcionando mesmo se o navegador bloquear storage.
  }
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute(
    "aria-label",
    dark ? "Ativar modo claro" : "Ativar modo escuro",
  );
  themeLabel.textContent = dark ? "Claro" : "Escuro";
  themeIcon.innerHTML = dark
    ? '<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />'
    : '<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />';
}

applyTheme(readSavedTheme() === "light" ? "light" : "dark");
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  saveTheme(nextTheme);
  applyTheme(nextTheme);
});
