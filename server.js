const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(process.env.GOTAVERTICE_DB || path.join(DATA_DIR, 'gotavertice.sqlite'));
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS residences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    residents INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    residence_id INTEGER NOT NULL REFERENCES residences(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    meter REAL NOT NULL,
    UNIQUE(residence_id, date)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
`);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, salt, expected) {
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), userId, Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
}

function cookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}
function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.PUBLIC_HTTPS === 'true' ? '; Secure; SameSite=None' : '; SameSite=Lax';
  return `gv_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}${secure}`;
}
function userFrom(request) {
  const token = cookies(request).gv_session;
  if (!token) return null;
  const row = db.prepare('SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?').get(hashToken(token), Date.now());
  return row || null;
}
function residenceFor(userId) {
  return db.prepare('SELECT id, name, residents FROM residences WHERE user_id = ?').get(userId);
}
function dashboardFor(userId) {
  const residence = residenceFor(userId);
  const readings = db.prepare('SELECT date, meter FROM readings WHERE residence_id = ? ORDER BY date').all(residence.id);
  return { residence: { name: residence.name, residents: residence.residents }, readings };
}
function body(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => { raw += chunk; if (raw.length > 1000000) request.destroy(); });
    request.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON inválido')); } });
    request.on('error', reject);
  });
}
function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(payload));
}
function redirect(response, location) { response.writeHead(302, { Location: location }); response.end(); }
function safePublicPath(urlPath) {
  const requested = urlPath === '/' ? 'login/index.html' : urlPath === '/dashboard' ? 'index.html' : urlPath.replace(/^\//, '');
  const file = path.resolve(PUBLIC, requested);
  return file.startsWith(PUBLIC + path.sep) ? file : null;
}
function mime(file) {
  return { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
}

async function api(request, response, url) {
  if (url.pathname === '/api/auth/session' && request.method === 'GET') {
    const user = userFrom(request);
    return user ? sendJson(response, 200, { user }) : sendJson(response, 401, { error: 'Não autenticado.' });
  }
  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    const { email, password } = await body(request);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return sendJson(response, 422, { error: 'Informe um e-mail válido.' });
    if (String(password || '').length < 8) return sendJson(response, 422, { error: 'A senha precisa ter pelo menos 8 caracteres.' });
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) return sendJson(response, 409, { error: 'Este e-mail já possui uma conta. Entre com sua senha.' });
    const credentials = hashPassword(String(password));
    const user = db.prepare('INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)').run(normalizedEmail, credentials.hash, credentials.salt);
    db.prepare('INSERT INTO residences (user_id, name, residents) VALUES (?, ?, ?)').run(Number(user.lastInsertRowid), 'Minha residência', 1);
    const token = createSession(Number(user.lastInsertRowid));
    return sendJson(response, 201, { user: { id: Number(user.lastInsertRowid), email: normalizedEmail } }, { 'Set-Cookie': sessionCookie(token) });
  }
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const { email, password } = await body(request);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
    if (!user || !verifyPassword(String(password || ''), user.password_salt, user.password_hash)) return sendJson(response, 401, { error: 'E-mail ou senha inválidos.' });
    const token = createSession(user.id);
    return sendJson(response, 200, { user: { id: user.id, email: user.email } }, { 'Set-Cookie': sessionCookie(token) });
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const token = cookies(request).gv_session;
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    return sendJson(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (url.pathname === '/healthz' && request.method === 'GET') return sendJson(response, 200, { ok: true, service: 'gotavertice' });

  const user = userFrom(request);
  if (!user) return sendJson(response, 401, { error: 'Sessão necessária.' });
  const residence = residenceFor(user.id);
  if (url.pathname === '/api/dashboard' && request.method === 'GET') return sendJson(response, 200, dashboardFor(user.id));
  if (url.pathname === '/api/residence' && request.method === 'PUT') {
    const data = await body(request);
    const name = String(data.name || '').trim() || 'Minha residência';
    const residents = Math.min(30, Math.max(1, Number(data.residents) || 1));
    db.prepare('UPDATE residences SET name = ?, residents = ? WHERE user_id = ?').run(name, residents, user.id);
    return sendJson(response, 200, dashboardFor(user.id));
  }
  if (url.pathname === '/api/readings' && request.method === 'POST') {
    const data = await body(request);
    const date = String(data.date || '');
    const meter = Number(data.meter);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(meter) || meter < 0) return sendJson(response, 422, { error: 'Informe uma data e leitura válidas.' });
    const previous = db.prepare('SELECT meter FROM readings WHERE residence_id = ? AND date < ? ORDER BY date DESC LIMIT 1').get(residence.id, date);
    const next = db.prepare('SELECT meter FROM readings WHERE residence_id = ? AND date > ? ORDER BY date LIMIT 1').get(residence.id, date);
    if (previous && meter < previous.meter) return sendJson(response, 422, { error: `A leitura precisa ser igual ou maior que ${previous.meter} m³.` });
    if (next && meter > next.meter) return sendJson(response, 422, { error: `A leitura precisa ser igual ou menor que ${next.meter} m³.` });
    db.prepare('INSERT INTO readings (residence_id, date, meter) VALUES (?, ?, ?) ON CONFLICT(residence_id, date) DO UPDATE SET meter = excluded.meter').run(residence.id, date, meter);
    return sendJson(response, 200, dashboardFor(user.id));
  }
  if (url.pathname === '/api/data' && request.method === 'DELETE') {
    db.prepare('DELETE FROM readings WHERE residence_id = ?').run(residence.id);
    db.prepare('UPDATE residences SET name = ?, residents = ? WHERE id = ?').run('Minha residência', 2, residence.id);
    return sendJson(response, 200, dashboardFor(user.id));
  }
  return sendJson(response, 404, { error: 'Rota não encontrada.' });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') return await api(request, response, url);
    const file = safePublicPath(url.pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return sendJson(response, 404, { error: 'Página não encontrada.' });
    response.writeHead(200, { 'Content-Type': mime(file), 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'Erro interno do servidor.' });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`GotaVértice em http://localhost:${PORT}`));
