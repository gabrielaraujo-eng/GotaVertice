const test = require('node:test');
const assert = require('node:assert/strict');
const DashboardVersion = require('../public/dashboard-version.js');

function makeHarness(lastModifiedHeader) {
  const handlers = new Map();
  const buttonHandlers = new Map();
  const requests = [];
  const notice = { hidden: true };
  let reloadCount = 0;
  let confirmationText = '';
  let confirmationCount = 0;
  let confirmationAnswer = false;
  let clearedInterval = null;
  const document = {
    lastModified: '11/18/2026 1:07:05 PM',
    visibilityState: 'visible',
    getElementById(id) {
      return id === 'updateNotice' ? notice : id === 'reloadForUpdate' ? button : null;
    },
    addEventListener(type, callback) { handlers.set(type, callback); },
    removeEventListener(type) { handlers.delete(type); },
  };
  const button = {
    addEventListener(type, callback) { buttonHandlers.set(type, callback); },
  };
  const window = {
    location: {
      origin: 'https://gotavertice.example',
      reload() { reloadCount += 1; },
    },
    navigator: { language: 'en-US' },
    async fetch(url, options) {
      requests.push({ url, options });
      return { ok: true, headers: { get: (name) => name.toLowerCase() === 'last-modified' ? lastModifiedHeader : null } };
    },
    setInterval(callback, delay) {
      window.intervalCallback = callback;
      window.intervalDelay = delay;
      return 42;
    },
    clearInterval(id) { clearedInterval = id; },
    addEventListener(type, callback) { handlers.set(`window:${type}`, callback); },
    confirm(text) {
      confirmationCount += 1;
      confirmationText = text;
      return confirmationAnswer;
    },
  };
  return {
    document,
    window,
    notice,
    handlers,
    buttonHandlers,
    requests,
    setConfirmationAnswer(value) { confirmationAnswer = value; },
    getReloadCount() { return reloadCount; },
    getConfirmationText() { return confirmationText; },
    getConfirmationCount() { return confirmationCount; },
    getClearedInterval() { return clearedInterval; },
  };
}

function makeField(id, formId) {
  return {
    id,
    isConnected: true,
    matches: (selector) => selector === 'input, select, textarea',
    closest: (selector) => selector === 'form' ? { id: formId } : null,
  };
}

test('document.lastModified é interpretado em ISO, RFC e nos formatos locais pt-BR/en-US', () => {
  const expected = new Date(2026, 10, 18, 13, 7, 5).getTime();
  assert.equal(DashboardVersion.parseDocumentLastModified('2026-11-18T13:07:05Z'), Date.parse('2026-11-18T13:07:05Z'));
  assert.equal(DashboardVersion.parseDocumentLastModified('18/11/2026 13:07:05', 'pt-BR'), expected);
  assert.equal(DashboardVersion.parseDocumentLastModified('11/18/2026 1:07:05 PM', 'en-US'), expected);
  assert.ok(Number.isNaN(DashboardVersion.parseDocumentLastModified('31/31/2026 99:99:99', 'pt-BR')));
  assert.ok(Number.isNaN(DashboardVersion.parseDocumentLastModified('18/11/2026 99:99:99', 'pt-BR')));
});

test('somente cabeçalho mais novo que a versão da página aciona atualização', () => {
  const pageTime = DashboardVersion.parseDocumentLastModified('11/18/2026 1:07:05 PM', 'en-US');
  assert.equal(DashboardVersion.hasNewerVersion(pageTime, [new Date(pageTime).toUTCString()]), false);
  assert.equal(DashboardVersion.hasNewerVersion(pageTime, [new Date(pageTime + 1000).toUTCString()]), false);
  assert.equal(DashboardVersion.hasNewerVersion(pageTime, [new Date(pageTime + 2000).toUTCString()]), true);
  assert.equal(DashboardVersion.hasNewerVersion('data inválida', ['Thu, 01 Jan 2099 00:00:00 GMT']), false);
});

test('verificação consulta os assets com HEAD sem cache e só revela a faixa se houver versão mais nova', async () => {
  const pageTime = DashboardVersion.parseDocumentLastModified('11/18/2026 1:07:05 PM', 'en-US');
  const harness = makeHarness(new Date(pageTime + 2000).toUTCString());
  const controller = DashboardVersion.init(harness.window, harness.document);
  await controller.initialCheck;

  assert.equal(harness.notice.hidden, false);
  assert.equal(harness.requests.length, DashboardVersion.VERSIONED_PATHS.length);
  for (const [index, request] of harness.requests.entries()) {
    assert.equal(request.url, `https://gotavertice.example${DashboardVersion.VERSIONED_PATHS[index]}`);
    assert.deepEqual(request.options, { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' });
  }
  assert.equal(harness.window.intervalDelay, DashboardVersion.CHECK_INTERVAL_MS);

  harness.handlers.get('input')({ target: makeField('meterReading', 'readingForm') });
  harness.buttonHandlers.get('click')();
  assert.match(harness.getConfirmationText(), /Recarregar pode descartar alterações recentes ainda não salvas/);
  assert.equal(harness.getConfirmationCount(), 1);
  assert.equal(harness.getReloadCount(), 0, 'recusar não deve recarregar');

  harness.handlers.get('gotavertice:form-saved')({ detail: { formId: 'readingForm' } });
  harness.buttonHandlers.get('click')();
  assert.equal(harness.getConfirmationCount(), 1, 'salvamento bem-sucedido não deve gerar aviso falso');
  assert.equal(harness.getReloadCount(), 1, 'campos salvos podem recarregar sem confirmação');

  harness.handlers.get('input')({ target: makeField('meterReading', 'readingForm') });
  harness.handlers.get('input')({ target: makeField('profileName', 'profileForm') });
  harness.handlers.get('gotavertice:form-saved')({ detail: { formId: 'profileForm' } });
  harness.buttonHandlers.get('click')();
  assert.equal(harness.getConfirmationCount(), 2, 'salvar outro formulário não deve apagar alterações pendentes');
  assert.equal(harness.getReloadCount(), 1, 'campos ainda não salvos continuam protegidos');

  harness.setConfirmationAnswer(true);
  harness.buttonHandlers.get('click')();
  assert.equal(harness.getConfirmationCount(), 3);
  assert.equal(harness.getReloadCount(), 2, 'recarregar exige a ação explícita do usuário');

  controller.dispose();
  assert.equal(harness.getClearedInterval(), 42);
});

test('respostas sem Last-Modified ou com erro não interrompem o dashboard', async () => {
  const harness = makeHarness(null);
  const controller = DashboardVersion.init(harness.window, harness.document);
  await controller.initialCheck;
  assert.equal(harness.notice.hidden, true);
  controller.dispose();

  const offlineHarness = makeHarness(null);
  offlineHarness.window.fetch = async () => { throw new Error('offline'); };
  const offlineController = DashboardVersion.init(offlineHarness.window, offlineHarness.document);
  await assert.doesNotReject(offlineController.initialCheck);
  assert.equal(offlineHarness.notice.hidden, true);
  offlineController.dispose();
});
