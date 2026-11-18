const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '../public/dashboard-theme.js'),
  'utf8',
);

function createThemeHarness({ savedTheme = null, storageUnavailable = false } = {}) {
  const elements = new Map();
  for (const selector of ['#themeToggle', '#themeLabel', '#themeIcon']) {
    elements.set(selector, {
      attributes: {},
      listeners: {},
      textContent: '',
      innerHTML: '',
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      click() { this.listeners.click?.(); },
    });
  }

  const localStorage = {
    getItem() {
      if (storageUnavailable) throw new Error('storage blocked');
      return savedTheme;
    },
    setItem(_key, value) {
      if (storageUnavailable) throw new Error('storage blocked');
      savedTheme = value;
    },
  };
  const document = {
    readyState: 'complete',
    documentElement: { dataset: {} },
    querySelector(selector) { return elements.get(selector) ?? null; },
    addEventListener() {},
  };
  const window = { localStorage };
  vm.runInNewContext(source, { document, window });
  return { document, elements, getSavedTheme: () => savedTheme };
}

test('tema inicia no modo escuro e alterna para claro com estado acessível', () => {
  const { document, elements, getSavedTheme } = createThemeHarness();
  const toggle = elements.get('#themeToggle');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  assert.equal(elements.get('#themeLabel').textContent, 'Claro');

  toggle.click();
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(toggle.attributes['aria-pressed'], 'false');
  assert.equal(toggle.attributes['aria-label'], 'Ativar modo escuro');
  assert.equal(elements.get('#themeLabel').textContent, 'Escuro');
  assert.equal(getSavedTheme(), 'light');
});

test('restaura tema claro salvo e permite alternar de volta ao escuro', () => {
  const { document, elements, getSavedTheme } = createThemeHarness({ savedTheme: 'light' });
  const toggle = elements.get('#themeToggle');
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(elements.get('#themeLabel').textContent, 'Escuro');

  toggle.click();
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  assert.equal(getSavedTheme(), 'dark');
});

test('o tema continua alternável se o navegador bloquear localStorage', () => {
  const { document, elements } = createThemeHarness({ storageUnavailable: true });
  const toggle = elements.get('#themeToggle');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.doesNotThrow(() => toggle.click());
  assert.equal(document.documentElement.dataset.theme, 'light');
});
