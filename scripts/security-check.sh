#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LIVE_URL="${SECURITY_URL:-}"
failures=0
pass=0

pass_check() { printf 'PASS %s\n' "$1"; pass=$((pass + 1)); }
fail_check() { printf 'FAIL %s\n' "$1" >&2; failures=$((failures + 1)); }

if grep -RInEi --exclude-dir=.git --exclude='*.png' --exclude='package-lock.json' --exclude='.gitignore' --exclude='README.md' --exclude='security-check.sh' \
  '(BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY|private_key|client_secret|secret_key|firebase-adminsdk|serviceAccount)' . >/tmp/gota-secret-scan; then
  fail_check 'nenhum segredo privado no repositório'
  cat /tmp/gota-secret-scan >&2
else
  pass_check 'nenhum segredo privado no repositório'
fi

if grep -q 'request.auth != null' firestore.rules && grep -q 'request.auth.uid == userId' firestore.rules; then
  pass_check 'regras do Firestore exigem autenticação e UID correspondente'
else
  fail_check 'regras do Firestore não demonstram isolamento por UID'
fi

if grep -q 'X-Content-Type-Options' firebase.json && grep -q 'Content-Security-Policy' firebase.json && grep -q 'Strict-Transport-Security' firebase.json; then
  pass_check 'Firebase Hosting declara cabeçalhos de segurança'
else
  fail_check 'Firebase Hosting sem cabeçalhos de segurança esperados'
fi

if grep -q '"key": "Cache-Control"' firebase.json && grep -q 'no-cache, max-age=0, must-revalidate' firebase.json; then
  pass_check 'HTML, CSS e JavaScript exigem revalidação após deploy'
else
  fail_check 'Firebase Hosting pode manter assets antigos em cache'
fi

if npm audit --omit=dev --audit-level=high >/tmp/gota-npm-audit 2>&1; then
  pass_check 'npm audit sem vulnerabilidades altas ou críticas'
else
  fail_check 'npm audit encontrou vulnerabilidades'
  cat /tmp/gota-npm-audit >&2
fi

if [[ -n "$LIVE_URL" ]]; then
  headers="$(curl -fsSI "$LIVE_URL")" || { fail_check "site público acessível em $LIVE_URL"; headers=''; }
  for header in X-Content-Type-Options X-Frame-Options Referrer-Policy Permissions-Policy Strict-Transport-Security Content-Security-Policy; do
    if grep -qi "^$header:" <<<"$headers"; then pass_check "header público $header"; else fail_check "header público ausente: $header"; fi
  done
  for path in /dashboard /styles.css /dashboard-theme.js; do
    asset_headers="$(curl -fsSI "${LIVE_URL%/}$path")" || asset_headers=''
    if grep -qiE '^cache-control:.*(no-cache|max-age=0)' <<<"$asset_headers"; then
      pass_check "asset público revalida após deploy: $path"
    else
      fail_check "asset público pode servir versão desatualizada: $path"
    fi
  done
  for path in /.env /firebase-adminsdk.json /serviceAccount.json /package.json /server.js /firestore.rules; do
    status="$(curl -sS -o /dev/null -w '%{http_code}' "${LIVE_URL%/}$path")"
    if [[ "$status" == 404* ]]; then pass_check "arquivo sensível não publicado: $path"; else fail_check "arquivo sensível respondeu HTTP $status: $path"; fi
  done
else
  printf 'INFO site público não testado; use SECURITY_URL=https://seu-site.web.app npm run security:check\n'
fi

printf '\nResultado: %d aprovados, %d falhas\n' "$pass" "$failures"
(( failures == 0 ))
