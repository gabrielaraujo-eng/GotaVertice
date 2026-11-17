const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const port = 4417;
const base = `http://127.0.0.1:${port}`;
let server;
let cookie;
const testDatabase = path.join(os.tmpdir(), `gotavertice-test-${process.pid}.sqlite`);
const userEmail = `usuario-${process.pid}@example.com`;

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return response;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Servidor não iniciou a tempo.');
}

test.before(async () => {
  server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), GOTAVERTICE_DB: testDatabase }, stdio: 'ignore' });
  await waitForServer();
});

test.after(() => {
  server?.kill();
  for (const suffix of ['', '-shm', '-wal']) {
    try { require('node:fs').unlinkSync(`${testDatabase}${suffix}`); } catch {}
  }
});

test('recusa dashboard sem sessão', async () => {
  const response = await request('/api/dashboard');
  assert.equal(response.status, 401);
});

test('cria uma conta e carrega a residência criada no servidor', async () => {
  const register = await request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: 'senha-segura' }) });
  assert.equal(register.status, 201);
  const dashboard = await request('/api/dashboard');
  const payload = await dashboard.json();
  assert.equal(dashboard.status, 200);
  assert.equal(payload.residence.name, 'Minha residência');
  assert.equal(payload.residence.residents, 1);
  assert.deepEqual(payload.readings, []);
});

test('recusa cadastro com e-mail repetido', async () => {
  const response = await request('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: 'outra-senha' }) });
  assert.equal(response.status, 409);
});

test('mantém a sessão após uma alteração de residência', async () => {
  const response = await request('/api/residence', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Casa da família', residents: 3 }) });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.residence.name, 'Casa da família');
  assert.equal(payload.residence.residents, 3);
  await request('/api/data', { method: 'DELETE' });
});
