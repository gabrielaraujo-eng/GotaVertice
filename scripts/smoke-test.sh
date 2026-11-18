#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-${SMOKE_URL:-https://gotavertice-gj.web.app}}"
BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass=0
fail=0

check_status() {
  local label="$1" path="$2" expected="$3" follow="${4:-false}"
  local curl_args=(-sS -o "$TMP_DIR/response" -w '%{http_code}')
  [[ "$follow" == "true" ]] && curl_args+=(-L)
  local status
  status="$(curl "${curl_args[@]}" "$BASE_URL$path")"
  if [[ "$status" == "$expected" ]]; then
    printf 'PASS %-34s HTTP %s\n' "$label" "$status"
    pass=$((pass + 1))
  else
    printf 'FAIL %-34s expected HTTP %s, got %s\n' "$label" "$expected" "$status" >&2
    fail=$((fail + 1))
  fi
}

check_body() {
  local label="$1" path="$2" text="$3"
  local body
  body="$(curl -sS "$BASE_URL$path")"
  if grep -Fq "$text" <<<"$body"; then
    printf 'PASS %-34s contains %s\n' "$label" "$text"
    pass=$((pass + 1))
  else
    printf 'FAIL %-34s missing %s\n' "$label" "$text" >&2
    fail=$((fail + 1))
  fi
}

printf 'Smoke test: %s\n\n' "$BASE_URL"
check_status 'apresentação disponível' '/apresentacao/' '200'
check_body 'landing explica consumo de água' '/apresentacao/' 'consumo de água'
check_body 'landing expõe URL canônica' '/apresentacao/' 'rel="canonical"'
check_body 'landing expõe Open Graph' '/apresentacao/' 'property="og:image"'
check_body 'landing expõe dados WebSite' '/apresentacao/' 'application/ld+json'
check_body 'verificação Search Console preservada' '/apresentacao/' 'google-site-verification'
check_status 'raiz redireciona permanentemente' '/' '301'
check_status 'favicon de marca disponível' '/assets/gotavertice-icon.svg' '200'
check_status 'imagem Open Graph disponível' '/assets/gotavertice-social.jpg' '200'
check_body 'sitemap lista landing canônica' '/sitemap.xml' 'https://gotavertice-gj.web.app/apresentacao/'
check_body 'robots informa sitemap' '/robots.txt' 'Sitemap: https://gotavertice-gj.web.app/sitemap.xml'
check_body 'login disponível' '/login/' 'GotaVértice'
check_body 'login não indexável' '/login/' 'noindex,follow'
check_status 'login.css disponível' '/login/login.css' '200'
check_status 'login.js disponível' '/login/login.js' '200'
check_status 'dashboard disponível' '/dashboard' '200'
check_body 'dashboard fora do índice' '/dashboard' 'noindex,follow'
check_status 'dashboard.css disponível' '/styles.css' '200'
check_status 'dashboard.js disponível' '/app.js' '200'
check_status 'cálculos disponíveis' '/consumption.js' '200'
check_status 'tema do dashboard disponível' '/dashboard-theme.js' '200'
check_status 'checagem de versão disponível' '/dashboard-version.js' '200'
check_body 'painel de notificações presente' '/dashboard' 'id="notificationPanel"'
check_body 'estimativa mensal explicada' '/dashboard' 'Ritmo mensal estimado'
check_status 'rota inválida retorna 404' '/rota-inexistente-smoke-test' '404'
check_body '404 personalizado' '/rota-inexistente-smoke-test' 'Essa página não foi encontrada'

printf '\nResultado: %d aprovados, %d falhas\n' "$pass" "$fail"
if (( fail > 0 )); then exit 1; fi
