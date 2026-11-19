const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const canonical = 'https://gotavertice-gj.web.app/apresentacao/';
const imageUrl = 'https://gotavertice-gj.web.app/assets/gotavertice-social.jpg';
const landing = fs.readFileSync(path.join(publicDir, 'apresentacao/index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');

function getAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}=["']([^"']*)["']`, 'i').exec(tag)?.[1] ?? null;
}

function getMeta(key, value) {
  const tags = [...landing.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  return tags.find((tag) => getAttribute(tag, key) === value) ?? null;
}

function metaContent(key, value) {
  const tag = getMeta(key, value);
  assert.ok(tag, `meta ${key}=${value} precisa existir no HTML inicial`);
  const content = getAttribute(tag, 'content');
  assert.ok(content, `meta ${key}=${value} precisa ter content`);
  return content;
}

test('landing tem title, description e termos de busca claros no HTML inicial', () => {
  const title = /<title>([^<]+)<\/title>/i.exec(landing)?.[1];
  assert.ok(title, 'title precisa existir');
  assert.ok(title.length >= 30 && title.length <= 60, `title tem ${title.length} caracteres`);
  assert.match(title, /GotaVértice/i);
  assert.match(title, /consumo de água/i);

  const description = metaContent('name', 'description');
  assert.ok(description.length >= 50 && description.length <= 160);
  assert.match(description, /hidrômetro/i);
  assert.match(description, /consumo de água/i);

  assert.equal(getMeta('name', 'keywords'), null, 'não incluir meta keywords obsoleta ou com grafias artificiais');
  assert.match(landing, /<h1\b[^>]*>Acompanhe o consumo\s*<span>de água\.<\/span><\/h1>/i);
  assert.ok(metaContent('name', 'google-site-verification').length > 20);
});

test('landing explica entrada manual, intervalos, estimativas, alertas e controles reais', () => {
  assert.match(landing, /Registre manualmente as leituras do hidrômetro/i);
  assert.match(landing, /Duas leituras em datas diferentes formam o primeiro intervalo/i);
  assert.match(landing, /Três leituras válidas permitem comparar dois intervalos/i);
  assert.match(landing, /aumenta mais de 20% em relação ao intervalo válido anterior/i);
  assert.match(landing, /limite interno configurado de 18 m³\/mês/i);
  assert.match(landing, /não diagnosticam vazamentos nem identificam a causa/i);
  assert.match(landing, /exportar residência e leituras em JSON, limpar os dados da residência ou excluir a conta/i);
  assert.match(landing, /não monitora em tempo real/i);
  assert.match(landing, /não se integra às concessionárias ou às faturas/i);
  assert.doesNotMatch(landing, /economia garantida|garante.{0,30}economia|reduz.{0,30}a conta/i);

  const questions = [...landing.matchAll(/<summary\b/gi)];
  assert.equal(questions.length, 7, 'a FAQ cobre as dúvidas principais em controles nativos acessíveis');
  assert.match(landing, /href=["']#como-funciona["']/i);
  assert.match(landing, /href=["']#faq["']/i);
  assert.match(landing, /id=["']como-funciona["']/i);
  assert.match(landing, /id=["']faq["']/i);
  assert.match(landing, /href=["']\/privacidade\/["']/i);
  assert.match(landing, /href=["']\/cookies\/["']/i);
});

test('canonical, Open Graph e Twitter usam a URL pública e imagem social reais', () => {
  const canonicalTag = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.exec(landing)?.[0];
  assert.ok(canonicalTag, 'canonical precisa existir no HTML inicial');
  assert.equal(getAttribute(canonicalTag, 'href'), canonical);
  assert.equal(metaContent('property', 'og:url'), canonical);
  assert.equal(metaContent('property', 'og:type'), 'website');
  assert.equal(metaContent('property', 'og:site_name'), 'GotaVértice');
  assert.equal(metaContent('property', 'og:title'), /<title>([^<]+)<\/title>/i.exec(landing)?.[1]);
  assert.equal(metaContent('property', 'og:description'), metaContent('name', 'description'));
  assert.equal(metaContent('property', 'og:image'), imageUrl);
  assert.equal(metaContent('property', 'og:image:type'), 'image/jpeg');
  assert.equal(metaContent('property', 'og:image:width'), '1200');
  assert.equal(metaContent('property', 'og:image:height'), '675');
  assert.equal(metaContent('name', 'twitter:card'), 'summary_large_image');
  assert.equal(metaContent('name', 'twitter:image'), imageUrl);

  const imagePath = path.join(publicDir, new URL(imageUrl).pathname.slice(1));
  assert.ok(fs.existsSync(imagePath), 'a imagem Open Graph precisa estar publicada');
  assert.ok(fs.statSync(imagePath).size < 500_000, 'a imagem social precisa permanecer leve');
});

test('dados estruturados identificam o site e grafias comuns da marca', () => {
  const match = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/i.exec(landing);
  assert.ok(match, 'JSON-LD precisa estar presente no HTML inicial');
  const website = JSON.parse(match[1]);
  assert.equal(website['@context'], 'https://schema.org');
  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.name, 'GotaVértice');
  assert.deepEqual(website.alternateName, ['Gota Vertice', 'GotaVertice']);
  assert.equal(website.url, canonical);
});

test('sitemap contém URLs públicas canônicas e não lista raiz redirecionada ou login', () => {
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations, [
    canonical,
    'https://gotavertice-gj.web.app/privacidade/',
    'https://gotavertice-gj.web.app/cookies/',
  ]);
  assert.ok(!locations.includes('https://gotavertice-gj.web.app/'));
  assert.ok(!locations.includes('https://gotavertice-gj.web.app/login/'));
});

test('robots aponta para o sitemap e deixa páginas noindex rastreáveis', () => {
  assert.match(robots, /Allow:\s*\/apresentacao\//);
  assert.match(robots, /Allow:\s*\/login\//);
  assert.match(robots, /Allow:\s*\/dashboard/);
  assert.doesNotMatch(robots, /Disallow:\s*\/dashboard/);
  assert.match(robots, /Disallow:\s*\/api\//);
  assert.match(robots, /Sitemap:\s*https:\/\/gotavertice-gj\.web\.app\/sitemap\.xml/);

  const dashboard = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  assert.match(dashboard, /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i);
});

test('login é noindex e as páginas usam favicon de marca em vez de foto pessoal', () => {
  const login = fs.readFileSync(path.join(publicDir, 'login/index.html'), 'utf8');
  assert.match(login, /<meta\s+name=["']robots["']\s+content=["']noindex,follow["']/i);

  const pages = [
    'apresentacao/index.html',
    'index.html',
    'login/index.html',
    'privacidade/index.html',
    'cookies/index.html',
  ];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(publicDir, page), 'utf8');
    assert.match(html, /href=["']\/assets\/gotavertice-icon\.svg["']/i, `${page} usa o favicon da marca`);
    assert.doesNotMatch(html, /github-avatar\.png/, `${page} não usa avatar pessoal como favicon`);
  }
  assert.ok(fs.existsSync(path.join(publicDir, 'assets/gotavertice-icon.svg')));
});

test('Firebase redireciona a raiz permanentemente para a landing canônica', () => {
  const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  const redirect = firebase.hosting.redirects.find((item) => item.source === '/');
  assert.ok(redirect);
  assert.equal(redirect.destination, '/apresentacao/');
  assert.equal(redirect.type, 301);
});

test('manifesto de rotas nomeia a raiz como landing do GotaVértice', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manus-routes.json'), 'utf8'));
  const home = manifest.routes.find((route) => route.path === '/');
  assert.ok(home);
  assert.match(home.title, /GotaVértice/);
  assert.match(home.title, /consumo de água/i);
});
