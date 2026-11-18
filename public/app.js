import {
  clearUserData,
  deleteAccount,
  ensureUserProfile,
  loadUserData,
  logoutAccount,
  hasPasswordProvider,
  reauthenticateAccount,
  saveReading,
  saveResidence,
  watchAuth,
} from "./firebase.js";

const defaultState = {
  residence: { name: "Minha residência", residents: 1 },
  readings: [],
};
let state = structuredClone(defaultState);
let currentUser = null;
const $ = (selector) => document.querySelector(selector);
const {
  sortReadings: getSortedReadings,
  getConsumptions,
  getMetrics,
} = window.Consumption;

function formatNumber(value) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`)
    .toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    .replace(".", "");
}
function renderDashboardDate() {
  $("#dashboardDate").textContent =
    `Resumo de ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}`;
}
function renderResidence() {
  $("#sidebarResidence").textContent = state.residence.name;
  $("#sidebarResidents").textContent =
    `${state.residence.residents} ${state.residence.residents === 1 ? "morador" : "moradores"}`;
  $("#residenceName").value = state.residence.name;
  $("#residentCount").value = state.residence.residents;
}
function renderMetrics() {
  const { current, average, change, savings, consumptions } = getMetrics(
    state.readings,
  );
  $("#currentConsumption").innerHTML =
    `${formatNumber(current)} <small>m³</small>`;
  $("#averageConsumption").innerHTML =
    `${formatNumber(average)} <small>m³</small>`;
  $("#savedConsumption").innerHTML =
    `${formatNumber(savings)} <small>m³</small>`;
  const changeElement = $("#consumptionChange");
  changeElement.className = `metric-change ${change <= 0 ? "positive" : "neutral"}`;
  changeElement.innerHTML = `${change <= 0 ? "↓" : "↑"} ${formatNumber(Math.abs(change))}% <b>vs. mês anterior</b>`;
  const isAlert = change > 20;
  const hasEnoughData = consumptions.length > 0;
  $("#statusText").textContent = isAlert
    ? "Atenção"
    : hasEnoughData
      ? "Tudo certo"
      : "Aguardando dados";
  $("#statusDetail").textContent = isAlert
    ? "Aumento acima de 20%"
    : hasEnoughData
      ? "Nenhum aumento expressivo"
      : "Registre outra leitura";
  $("#alertMetric").classList.toggle("has-alert", isAlert);
  $("#insightPercent").textContent = formatNumber(Math.abs(change));
  $("#insight-title").textContent = isAlert
    ? "Vale investigar"
    : change <= 0
      ? "Uma boa evolução"
      : "Consumo estável";
  $(".insight-panel > p").textContent = isAlert
    ? "O consumo aumentou bastante em relação ao último mês. Confira torneiras, descargas e possíveis vazamentos."
    : change <= 0
      ? "Você consumiu menos água que no mês passado. Se mantiver esse ritmo, pode economizar ainda mais até o fim do ano."
      : "Seu consumo teve uma pequena variação. Continue registrando as leituras para acompanhar essa tendência.";
}
function renderTable() {
  const rows = getConsumptions(state.readings).slice().reverse().slice(0, 5);
  $("#readingsTable").innerHTML = rows.length
    ? rows
        .map(
          (item) =>
            `<tr><td>${formatDate(item.date)}</td><td>${formatNumber(item.meter)} m³</td><td>${formatNumber(item.consumption)} m³</td><td><span class="status-badge ${item.consumption > 18 ? "warning" : "good"}">${item.consumption > 18 ? "Verificar" : "Dentro da meta"}</span></td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4">Adicione uma segunda leitura para calcular o consumo.</td></tr>';
}
function renderChart() {
  const { consumptions } = getMetrics(state.readings);
  const chart = $("#consumptionChart");
  const labels = $("#chartLabels");
  const yLabels = $(".chart-y-labels");
  const width = 640;
  const height = 220;
  const points = consumptions.slice(-6);
  const highestValue = Math.max(...points.map((point) => point.consumption), 0);
  const max = Math.max(20, Math.ceil(highestValue / 5) * 5);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => ({
    x: points.length > 1 ? index * step : width / 2,
    y: height - (Math.min(point.consumption, max) / max) * height,
    value: point.consumption,
    label: formatDate(point.date),
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coords.length ? `0,${height} ${line} ${width},${height}` : "";
  const grid = [0, 1, 2, 3, 4]
    .map(
      (index) =>
        `<line class="chart-grid-line" x1="0" y1="${(index * height) / 4}" x2="${width}" y2="${(index * height) / 4}" />`,
    )
    .join("");
  const averageY = height - (Math.min(15, max) / max) * height;
  const dots = coords
    .map(
      (point, index) =>
        `<circle class="chart-point ${index === coords.length - 1 ? "current" : ""}" cx="${point.x}" cy="${point.y}" r="${index === coords.length - 1 ? 5 : 4}"><title>${formatNumber(point.value)} m³ em ${point.label}</title></circle>`,
    )
    .join("");
  chart.innerHTML = points.length
    ? `${grid}<line class="chart-average-line" x1="0" y1="${averageY}" x2="${width}" y2="${averageY}" /><polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${dots}`
    : '<text class="chart-empty" x="320" y="112" text-anchor="middle">Registre duas leituras para visualizar a evolução</text>';
  labels.innerHTML = coords
    .map((point) => `<span>${point.label}</span>`)
    .join("");
  yLabels.innerHTML = [max, max * 0.75, max * 0.5, max * 0.25, 0]
    .map((value) => `<span>${formatNumber(value).replace(",0", "")}</span>`)
    .join("");
}
function render() {
  renderDashboardDate();
  renderResidence();
  renderMetrics();
  renderTable();
  renderChart();
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}
function setFormFeedback(message, type = "error") {
  const feedback = $("#formFeedback");
  feedback.textContent = message;
  feedback.dataset.type = type;
}
function refresh(data) {
  state = data;
  render();
}

$("#readingDate").value = new Date().toISOString().slice(0, 10);
$("#readingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const date = $("#readingDate").value;
  const meter = Number($("#meterReading").value);
  if (!date || !Number.isFinite(meter) || meter < 0)
    return setFormFeedback("Informe uma data e uma leitura válida.");
  try {
    const sorted = getSortedReadings(state.readings);
    const previous = sorted.filter((item) => item.date < date).at(-1);
    const next = sorted.find((item) => item.date > date);
    if (previous && meter < previous.meter)
      return setFormFeedback(
        `A leitura precisa ser igual ou maior que ${previous.meter} m³.`,
      );
    if (next && meter > next.meter)
      return setFormFeedback(
        `A leitura precisa ser igual ou menor que ${next.meter} m³.`,
      );
    refresh(await saveReading(currentUser, { date, meter }));
    event.target.reset();
    $("#readingDate").value = new Date().toISOString().slice(0, 10);
    setFormFeedback("Leitura salva com sucesso.", "success");
    showToast("Nova leitura registrada.");
  } catch {
    setFormFeedback("Não foi possível salvar. Verifique sua conexão.");
  }
});

$("#residenceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    refresh(
      await saveResidence(currentUser, {
        name: $("#residenceName").value.trim() || "Minha residência",
        residents: Math.min(
          30,
          Math.max(1, Number($("#residentCount").value) || 1),
        ),
      }),
    );
    showToast("Dados da residência atualizados.");
  } catch {
    showToast("Não foi possível atualizar a residência.");
  }
});

$("#exportDataButton")?.addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    residence: state.residence,
    readings: getSortedReadings(state.readings),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `gota-vertice-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Dados exportados com sucesso.");
});

$("#clearDataButton")?.addEventListener("click", async () => {
  if (
    !window.confirm(
      "Isso removerá residência e leituras salvas na nuvem. Continuar?",
    )
  )
    return;
  try {
    refresh(await clearUserData(currentUser));
    showToast("Dados da residência limpos.");
  } catch {
    showToast("Não foi possível limpar os dados.");
  }
});

$("#deleteAccountButton")?.addEventListener("click", async () => {
  const confirmation = window.prompt(
    "Esta ação é permanente. Digite EXCLUIR para apagar sua conta, residência e leituras:",
  );
  if (confirmation !== "EXCLUIR") return;
  try {
    let password = "";
    if (hasPasswordProvider(currentUser)) {
      password = window.prompt(
        "Por segurança, digite sua senha atual para confirmar a exclusão:",
      );
      if (!password) return;
    }
    await reauthenticateAccount(currentUser, password);
    await deleteAccount(currentUser);
    window.location.replace("/login/?deleted=1");
  } catch (error) {
    if (error.code === "auth/invalid-credential")
      return showToast("A senha informada está incorreta.");
    if (error.code === "auth/popup-closed-by-user")
      return showToast("A confirmação pelo Google foi cancelada.");
    if (error.code === "auth/requires-recent-login")
      showToast(
        "Não foi possível confirmar sua identidade. Entre novamente e tente outra vez.",
      );
    else showToast("Não foi possível excluir a conta. Tente novamente.");
  }
});

document.querySelectorAll(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-link")
      .forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  }),
);

$("#logoutButton")?.addEventListener("click", async () => {
  await logoutAccount();
  window.location.replace("/login/");
});
$("#logoutAccountButton")?.addEventListener("click", async () => {
  await logoutAccount();
  window.location.replace("/login/");
});

watchAuth(async (user) => {
  if (!user) return window.location.replace("/login/");
  currentUser = user;
  $("#accountEmail").textContent = user.email || "Conta Google";
  try {
    await ensureUserProfile(user);
    refresh(await loadUserData(user));
  } catch {
    showToast("Não foi possível carregar seus dados. Verifique o Firestore.");
  }
});

console.info("GotaVértice · Gabriel Lucio · github.com/gabrielaraujo-eng");
