const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../public/styles.css'), 'utf8');

function getRootBlock(pattern, predicate = () => true) {
  return [...css.matchAll(pattern)].map((match) => match[1]).find(predicate);
}

function getVariable(block, name) {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block ?? '');
  assert.ok(match, `variável --${name} precisa existir`);
  return match[1];
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('ícones das métricas têm contraste de pelo menos 3:1 nos dois temas', () => {
  const darkRoot = getRootBlock(/:root\s*\{([^}]*)\}/g, (block) => block.includes('--metric-blue-bg'));
  const lightRoot = getRootBlock(/:root\[data-theme="light"\]\s*\{([^}]*)\}/g);
  assert.ok(darkRoot, 'tokens do tema escuro precisam existir');
  assert.ok(lightRoot, 'tokens do tema claro precisam existir');

  for (const [theme, block] of [['escuro', darkRoot], ['claro', lightRoot]]) {
    for (const icon of ['blue', 'green', 'amber', 'coral']) {
      const background = getVariable(block, `metric-${icon}-bg`);
      const foreground = getVariable(block, `metric-${icon}-ink`);
      const ratio = contrastRatio(background, foreground);
      assert.ok(ratio >= 3, `${theme}/${icon}: contraste ${ratio.toFixed(2)}:1 abaixo de 3:1`);
    }
  }
});

test('SVGs da navegação definem cor, preenchimento e traço explicitamente', () => {
  assert.match(css, /\.nav-icon svg\s*\{[^}]*color:\s*var\(--accent\)[^}]*fill:\s*none[^}]*stroke:\s*currentColor/s);
});

test('tema claro redefine texto do hero e fundo de campos', () => {
  assert.match(css, /:root\[data-theme="light"\] \.hero-card h2,[\s\S]*?:root\[data-theme="light"\] \.hero-card h2 em\s*\{\s*color:\s*var\(--ink\);\s*\}/);
  assert.match(css, /:root\[data-theme="light"\] input,[\s\S]*?:root\[data-theme="light"\] select\s*\{\s*background:\s*#ffffff;[^}]*color:\s*var\(--ink\);\s*\}/);
});

test('placeholders têm contraste WCAG AA em tema claro e escuro', () => {
  const darkPlaceholder = /input::placeholder\s*\{\s*color:\s*(#[\da-f]{6})/i.exec(css)?.[1];
  const lightPlaceholder = /:root\[data-theme="light"\] input::placeholder\s*\{\s*color:\s*(#[\da-f]{6})/i.exec(css)?.[1];
  assert.ok(darkPlaceholder, 'placeholder escuro precisa ter cor explícita');
  assert.ok(lightPlaceholder, 'placeholder claro precisa ter cor explícita');
  assert.ok(contrastRatio('#11191b', darkPlaceholder) >= 4.5, 'placeholder escuro deve passar 4,5:1');
  assert.ok(contrastRatio('#ffffff', lightPlaceholder) >= 4.5, 'placeholder claro deve passar 4,5:1');
});

test('campos mantêm autofill, foco de teclado e aviso de atualização legíveis', () => {
  assert.match(css, /input:-webkit-autofill,[\s\S]*?-webkit-text-fill-color:\s*var\(--ink\);[\s\S]*?caret-color:\s*var\(--ink\);/);
  assert.match(css, /input:focus,\s*select:focus\s*\{\s*border-color:\s*var\(--accent-strong\);\s*transition:\s*none;/);
  assert.match(css, /input:focus-visible,\s*select:focus-visible\s*\{\s*outline:\s*3px solid var\(--accent-strong\);\s*outline-offset:\s*3px;\s*transition:\s*none;/);
  assert.match(css, /update-notice\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
  assert.match(css, /\.update-notice\s*\{[^}]*background:\s*var\(--surface\);[^}]*color:\s*var\(--ink\);/s);
});

test('paleta clara mantém contraste em navegação e controles de período', () => {
  const lightRoot = getRootBlock(/:root\[data-theme="light"\]\s*\{([^}]*)\}/g);
  const navigationRatio = contrastRatio(
    getVariable(lightRoot, 'blue-soft'),
    getVariable(lightRoot, 'blue-deep'),
  );
  const smallTextRatio = contrastRatio(
    getVariable(lightRoot, 'surface'),
    getVariable(lightRoot, 'muted'),
  );
  assert.ok(navigationRatio >= 4.5, `navegação/unidades: contraste ${navigationRatio.toFixed(2)}:1 abaixo de 4,5:1`);
  assert.ok(smallTextRatio >= 4.5, `texto auxiliar: contraste ${smallTextRatio.toFixed(2)}:1 abaixo de 4,5:1`);
  assert.match(css, /:root\[data-theme="light"\] \.period-label\s*\{[^}]*background:\s*#ffffff;[^}]*color:\s*var\(--ink-soft\);\s*\}/);
  assert.match(css, /:root\[data-theme="light"\] \.eyebrow,[\s\S]*?:root\[data-theme="light"\] th\s*\{\s*color:\s*#566b64;\s*\}/);
  assert.match(css, /:root\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*light;/s);
  assert.match(css, /:root\s*\{[^}]*color-scheme:\s*dark;/s);
});
