#!/usr/bin/env python3
"""Browser regression for dashboard form contrast and safe update notices."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import re
import threading
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / "public"
OLD_VERSION = "Thu, 01 Jan 2000 00:00:00 GMT"
NEW_VERSION = "Thu, 01 Jan 2099 00:00:00 GMT"

FAKE_FIREBASE = r'''
let data = {
  residenceId: "r1",
  residences: [{ id: "r1", name: "Casa de teste", residents: 2 }],
  residence: { name: "Casa de teste", residents: 2 },
  readings: [
    { date: "2026-11-01", meter: 100 },
    { date: "2026-11-18", meter: 115 }
  ]
};
const copy = () => JSON.parse(JSON.stringify(data));
async function waitForSave(name) {
  if (window.__delayNextSave === name) {
    window.__delayNextSave = "";
    await new Promise((resolve) => { window.__finishPendingSave = resolve; });
  }
  if (window.__failNextSave === name) {
    window.__failNextSave = "";
    throw new Error("falha simulada de salvamento");
  }
}
export async function clearUserData() { data.readings = []; return copy(); }
export async function createResidence(_user, residence) {
  await waitForSave("create");
  const id = `r${data.residences.length + 1}`;
  data.residences.push({ id, ...residence });
  data.residenceId = id;
  data.residence = { ...residence };
  return copy();
}
export async function deleteAccount() {}
export async function ensureUserProfile() {}
export async function loadUserData() { return copy(); }
export async function logoutAccount() {}
export function hasPasswordProvider() { return false; }
export async function reauthenticateAccount() {}
export async function saveReading(_user, _residenceId, reading) {
  await waitForSave("reading");
  const index = data.readings.findIndex((item) => item.date === reading.date);
  if (index >= 0) data.readings[index] = reading;
  else data.readings.push(reading);
  return copy();
}
export async function saveResidence(_user, _residenceId, residence) {
  await waitForSave("residence");
  data.residence = { ...residence };
  data.residences = data.residences.map((item) => item.id === data.residenceId ? { ...item, ...residence } : item);
  return copy();
}
export async function switchResidence(_user, id) {
  await waitForSave("switch");
  data.residenceId = id;
  data.residence = { ...data.residences.find((item) => item.id === id) };
  return copy();
}
export async function updateUserProfile() { await waitForSave("profile"); }
export function watchAuth(callback) {
  queueMicrotask(() => callback({ uid: "browser-test", displayName: "Conta de teste", email: "browser@example.invalid" }));
  return () => {};
}
'''


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        parsed = urlsplit(path)
        if parsed.path in ("/dashboard", "/dashboard/"):
            path = "/index.html"
        return super().translate_path(path)

    def log_message(self, *_args):
        pass


def parse_rgb(value):
    numbers = [float(part) for part in re.findall(r"[\d.]+", value)]
    if len(numbers) < 3:
        raise AssertionError(f"Não foi possível interpretar a cor CSS: {value}")
    return tuple(numbers[:3])


def luminance(rgb):
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in (channel / 255 for channel in rgb)]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(first, second):
    lighter, darker = sorted((luminance(first), luminance(second)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def layout_overflow(page):
    return page.evaluate("""() => {
      const width = window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .map(element => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            id: element.id,
            className: typeof element.className === 'string' ? element.className : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          };
        })
        .filter(item => item.right > width + 1 || item.left < -1)
        .slice(0, 12);
      return { width, scrollWidth: document.documentElement.scrollWidth, offenders };
    }""")


def configure_page(context, version_state):
    def handle_request(route):
        request = route.request
        if request.url.startswith("https://fonts.googleapis.com/") or request.url.startswith("https://fonts.gstatic.com/"):
            route.abort()
            return
        if request.method == "HEAD" and request.url.startswith(version_state["origin"]):
            version_state["head_requests"].append(urlsplit(request.url).path)
            route.fulfill(status=200, headers={"Last-Modified": version_state["last_modified"]}, body="")
            return
        route.continue_()

    context.route("**/*", handle_request)
    context.route(
        "**/firebase.js",
        lambda route: route.fulfill(status=200, content_type="text/javascript", body=FAKE_FIREBASE),
    )


def assert_form_field(page, selector, expected_type=None):
    field = page.locator(selector)
    assert field.count() == 1, f"campo ausente ou duplicado: {selector}"
    assert field.is_visible(), f"campo não visível: {selector}"
    field_type = field.get_attribute("type")
    if expected_type:
        assert field_type == expected_type, (selector, field_type)

    if field.evaluate("element => element.tagName === 'SELECT'"):
        options = field.locator("option")
        assert options.count() >= 1, f"select sem opções: {selector}"
        field.select_option(index=0)
    elif field_type == "date":
        field.fill("2026-11-18")
    elif field_type == "number":
        field.fill("125")
    else:
        field.fill("Valor de teste")

    field.focus()
    page.keyboard.press("Shift+Tab")
    page.keyboard.press("Tab")
    styles = field.evaluate("""element => {
      const style = getComputedStyle(element);
      const placeholder = getComputedStyle(element, '::placeholder');
      return {
        background: style.backgroundColor,
        color: style.color,
        border: style.borderColor,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        focusVisible: element.matches(':focus-visible'),
        placeholderColor: placeholder.color,
        placeholder: element.getAttribute('placeholder') || ''
      };
    }""")
    text_ratio = contrast(parse_rgb(styles["color"]), parse_rgb(styles["background"]))
    assert text_ratio >= 4.5, f"texto do campo {selector}: {text_ratio:.2f}:1; {styles}"
    assert styles["focusVisible"], f"navegação por teclado não aplicou :focus-visible em {selector}: {styles}"
    assert float(styles["outlineWidth"].removesuffix("px")) >= 2, f"contorno de foco ausente em {selector}: {styles}"
    outline_ratio = contrast(parse_rgb(styles["outlineColor"]), parse_rgb(styles["background"]))
    assert outline_ratio >= 3, f"contorno de foco em {selector}: {outline_ratio:.2f}:1; {styles}"
    if styles["placeholder"]:
        placeholder_ratio = contrast(parse_rgb(styles["placeholderColor"]), parse_rgb(styles["background"]))
        assert placeholder_ratio >= 4.5, f"placeholder de {selector}: {placeholder_ratio:.2f}:1; {styles}"
    return styles


def check_theme(page, theme):
    if page.locator("html").get_attribute("data-theme") != theme:
        page.locator("#themeToggle").click()
        page.wait_for_function("theme => document.documentElement.dataset.theme === theme", arg=theme)
    assert page.locator("html").get_attribute("data-theme") == theme

    fields = [
        ("#readingDate", "date"),
        ("#meterReading", "number"),
        ("#residenceSelector", None),
        ("#residenceName", "text"),
        ("#residentCount", "number"),
        ("#profileName", "text"),
    ]
    results = {selector: assert_form_field(page, selector, field_type) for selector, field_type in fields}

    page.locator("#newResidenceButton").click()
    dialog = page.locator("dialog").first
    page.wait_for_function("document.querySelector('dialog')?.open === true")
    for selector, field_type in (("#newResidenceName", "text"), ("#newResidenceResidents", "number")):
        results[selector] = assert_form_field(page, selector, field_type)
    dialog.evaluate("element => element.close()")
    return results


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), DashboardHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    executable = os.environ.get("CHROMIUM_PATH")
    if not executable and Path("/usr/bin/chromium").exists():
        executable = "/usr/bin/chromium"

    try:
        with sync_playwright() as playwright:
            launch = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
            if executable:
                launch["executable_path"] = executable
            browser = playwright.chromium.launch(**launch)

            clean_state = {"origin": origin, "last_modified": OLD_VERSION, "head_requests": []}
            clean_context = browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
            configure_page(clean_context, clean_state)
            clean_page = clean_context.new_page()
            page_errors = []
            clean_page.on("pageerror", lambda error: page_errors.append(str(error)))
            response = clean_page.goto(f"{origin}/dashboard", wait_until="domcontentloaded", timeout=30000)
            assert response and response.status == 200, "dashboard local não carregou"
            clean_page.wait_for_function("document.querySelector('#sidebarResidence')?.textContent === 'Casa de teste'", timeout=10000)
            clean_page.wait_for_function("window.DashboardVersion && document.querySelector('#updateNotice')", timeout=10000)
            assert clean_page.locator("#updateNotice").is_hidden(), "uma sessão atual não deve ver falso aviso"

            dark_styles = check_theme(clean_page, "dark")
            light_styles = check_theme(clean_page, "light")
            expected_fields = 8
            assert len(dark_styles) == expected_fields
            assert len(light_styles) == expected_fields
            clean_page.set_viewport_size({"width": 390, "height": 844})
            clean_overflow = layout_overflow(clean_page)
            assert clean_overflow["scrollWidth"] <= clean_overflow["width"], f"tema claro gerou overflow em 390 px: {clean_overflow}"
            assert not page_errors, page_errors
            assert len(clean_state["head_requests"]) >= 6, clean_state["head_requests"]

            stale_state = {"origin": origin, "last_modified": NEW_VERSION, "head_requests": []}
            stale_context = browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
            configure_page(stale_context, stale_state)
            stale_page = stale_context.new_page()
            stale_errors = []
            stale_page.on("pageerror", lambda error: stale_errors.append(str(error)))
            stale_response = stale_page.goto(f"{origin}/dashboard", wait_until="domcontentloaded", timeout=30000)
            assert stale_response and stale_response.status == 200
            stale_page.wait_for_function("document.querySelector('#sidebarResidence')?.textContent === 'Casa de teste'", timeout=10000)
            stale_page.wait_for_function("document.querySelector('#updateNotice')?.hidden === false", timeout=10000)
            stale_page.set_viewport_size({"width": 390, "height": 844})
            stale_overflow = layout_overflow(stale_page)
            assert stale_overflow["scrollWidth"] <= stale_overflow["width"], f"aviso de atualização gerou overflow em 390 px: {stale_overflow}"
            original_url = stale_page.url
            assert stale_page.url == original_url, "detectar atualização não pode navegar/recarregar automaticamente"

            stale_page.locator("#meterReading").fill("123")
            dismissed_dialogs = []
            stale_page.once("dialog", lambda dialog: (dismissed_dialogs.append(dialog.message), dialog.dismiss()))
            stale_page.locator("#reloadForUpdate").click()
            assert dismissed_dialogs and "descartar alterações" in dismissed_dialogs[0]
            assert stale_page.locator("#meterReading").input_value() == "123", "recusar confirmação deve preservar o campo"

            stale_page.locator("#readingDate").fill("2026-11-18")
            stale_page.evaluate("window.__delayNextSave = 'reading'")
            stale_page.locator("#readingForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#readingForm')?.getAttribute('aria-busy') === 'true' && document.querySelector('#meterReading')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#formFeedback')?.textContent === 'Leitura salva com sucesso.'", timeout=10000)

            stale_page.locator("#residenceName").fill("Casa atualizada")
            stale_page.locator("#residentCount").fill("3")
            stale_page.evaluate("window.__delayNextSave = 'residence'")
            stale_page.locator("#residenceForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#residenceForm')?.getAttribute('aria-busy') === 'true' && document.querySelector('#residenceName')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#toast')?.textContent === 'Dados da residência atualizados.'", timeout=10000)
            assert not stale_page.locator("#residenceName").is_disabled()

            stale_page.locator("#profileName").fill("Perfil de teste")
            stale_page.evaluate("window.__delayNextSave = 'profile'")
            stale_page.locator("#profileForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#profileForm')?.getAttribute('aria-busy') === 'true' && document.querySelector('#profileName')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#toast')?.textContent === 'Perfil atualizado com sucesso.'", timeout=10000)
            assert not stale_page.locator("#profileName").is_disabled()

            stale_page.locator("#newResidenceButton").click()
            stale_page.locator("#newResidenceName").fill("Casa de demonstração")
            stale_page.locator("#newResidenceResidents").fill("2")
            stale_page.evaluate("window.__delayNextSave = 'create'")
            stale_page.locator("#newResidenceForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#newResidenceForm')?.getAttribute('aria-busy') === 'true' && document.querySelector('#newResidenceName')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#toast')?.textContent === 'Nova residência criada.'", timeout=10000)
            assert not stale_page.locator("#newResidenceName").is_disabled()

            stale_page.evaluate("window.__delayNextSave = 'switch'")
            stale_page.locator("#residenceSelector").select_option("r1")
            stale_page.wait_for_function("document.querySelector('#residenceSelector')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#residenceSelector')?.disabled === false && document.querySelector('#sidebarResidence')?.textContent === 'Casa atualizada'", timeout=10000)

            stale_page.locator("#profileName").fill("Perfil ainda não salvo")
            stale_page.evaluate("window.__delayNextSave = 'profile'; window.__failNextSave = 'profile'")
            stale_page.locator("#profileForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#profileForm')?.getAttribute('aria-busy') === 'true' && document.querySelector('#profileName')?.disabled === true", timeout=10000)
            stale_page.evaluate("window.__finishPendingSave()")
            stale_page.wait_for_function("document.querySelector('#toast')?.textContent === 'Não foi possível atualizar o perfil.'", timeout=10000)
            assert not stale_page.locator("#profileName").is_disabled(), "falha deve reabilitar os campos"
            failed_save_dialogs = []
            stale_page.once("dialog", lambda dialog: (failed_save_dialogs.append(dialog.message), dialog.dismiss()))
            stale_page.locator("#reloadForUpdate").click()
            assert failed_save_dialogs and "descartar alterações" in failed_save_dialogs[0], "falha não deve limpar campos pendentes"

            stale_page.locator("#profileName").fill("Perfil salvo")
            stale_page.locator("#profileForm button[type='submit']").click()
            stale_page.wait_for_function("document.querySelector('#toast')?.textContent === 'Perfil atualizado com sucesso.'", timeout=10000)
            stale_state["last_modified"] = OLD_VERSION
            unexpected_dialogs = []
            stale_page.once("dialog", lambda dialog: (unexpected_dialogs.append(dialog.message), dialog.dismiss()))
            with stale_page.expect_navigation(wait_until="domcontentloaded", timeout=15000):
                stale_page.locator("#reloadForUpdate").click()
            stale_page.wait_for_function("document.querySelector('#sidebarResidence')?.textContent === 'Casa de teste'", timeout=10000)
            assert not unexpected_dialogs, "formulário salvo não deve gerar confirmação de descarte"
            assert stale_page.locator("#updateNotice").is_hidden(), "após recarregar para a versão atual, a faixa deve sumir"
            assert not stale_errors, stale_errors

            print("PASS campos de leitura, residência, perfil, seleção e nova residência em tema escuro e claro")
            print("PASS valores/preenchimento, placeholders (contraste >= 4,5:1) e bordas/foco (>= 3:1)")
            print("PASS sessão atual sem aviso falso; sessão antiga recebe aviso após detectar Last-Modified novo")
            print("PASS leitura, residência, nova residência, perfil e seleção bloqueiam edição até a resposta")
            print("PASS sucesso libera campos e limpa avisos; falha libera campos e mantém alterações protegidas")
            print(f"PASS assets consultados no teste: {', '.join(clean_state['head_requests'][:6])}")
            clean_context.close()
            stale_context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
