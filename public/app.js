import {
  clearUserData,
  createResidence,
  deleteAccount,
  ensureUserProfile,
  loadUserData,
  logoutAccount,
  hasPasswordProvider,
  reauthenticateAccount,
  saveReading,
  saveResidence,
  switchResidence,
  updateUserProfile,
  watchAuth,
} from "./firebase.js";

const defaultState = {
  residenceId: "default",
  residences: [{ id: "default", name: "Minha residência", residents: 1 }],
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
  toLocalDateInput,
  MONTHLY_REFERENCE_M3,
  HIGH_CONSUMPTION_M3,
  ALERT_CHANGE_PERCENT,
} = window.Consumption;

function formatNumber(value) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}
function formatChartDate(dateString) {
  return new Date(`${dateString}T12:00:00`)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}
function renderDashboardDate() {
  $("#dashboardDate").textContent =
    `Resumo de ${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}`;
}
function renderResidence() {
  const selector = $("#residenceSelector");
  selector.replaceChildren(
    ...state.residences.map((residence) => {
      const option = document.createElement("option");
      option.value = residence.id;
      option.textContent = residence.name;
      return option;
    }),
  );
  selector.value = state.residenceId;
  $("#sidebarResidence").textContent = state.residence.name;
  $("#sidebarResidents").textContent =
    `${state.residence.residents} ${state.residence.residents === 1 ? "morador" : "moradores"}`;
  $("#residenceName").value = state.residence.name;
  $("#residentCount").value = state.residence.residents;
}
function renderMetrics(metrics) {
  const { current, average, change, savings, consumptions, comparisonAvailable, baselineWasZero } = metrics;
  const hasData = consumptions.length > 0;
  const exceedsThreshold = hasData && current > HIGH_CONSUMPTION_M3;
  const increasingRapidly = comparisonAvailable && change > ALERT_CHANGE_PERCENT;
  $("#currentConsumption").innerHTML =
    `${hasData ? formatNumber(current) : "—"} <small>m³/mês</small>`;
  $("#averageConsumption").innerHTML =
    `${hasData ? formatNumber(average) : "—"} <small>m³/mês</small>`;
  $("#savedConsumption").innerHTML =
    `${hasData ? formatNumber(savings) : "—"} <small>m³</small>`;
  const changeElement = $("#consumptionChange");
  const isAlert = baselineWasZero || exceedsThreshold || increasingRapidly;

  if (!hasData) {
    changeElement.className = "metric-change neutral";
    changeElement.textContent = "Aguardando leituras";
  } else if (!comparisonAvailable) {
    changeElement.className = "metric-change neutral";
    changeElement.textContent = "Registre outro intervalo para comparar";
  } else if (baselineWasZero) {
    changeElement.className = "metric-change neutral";
    changeElement.textContent = "Sem base anterior para percentual";
  } else {
    const trendArrow = change < 0 ? "↓" : change > 0 ? "↑" : "→";
    changeElement.className = `metric-change ${change < 0 ? "positive" : "neutral"}`;
    changeElement.innerHTML = `${trendArrow} ${formatNumber(Math.abs(change))}% <b>vs. intervalo anterior</b>`;
  }

  $("#statusText").textContent = !hasData
    ? "Aguardando dados"
    : isAlert
      ? "Atenção"
      : !comparisonAvailable
        ? "Aguardando comparação"
        : "Tudo certo";
  $("#statusDetail").textContent = !hasData
    ? "Registre duas leituras"
    : baselineWasZero
        ? "Consumo após um intervalo estimado zerado"
        : exceedsThreshold
          ? `Ritmo mensal estimado acima de ${formatNumber(HIGH_CONSUMPTION_M3)} m³/mês`
          : increasingRapidly
            ? `Aumento mensal estimado acima de ${ALERT_CHANGE_PERCENT}%`
            : !comparisonAvailable
              ? "Registre outro intervalo para comparar"
              : "Nenhum aumento expressivo";
  $("#alertMetric").classList.toggle("has-alert", isAlert);
  $("#insightPercent").textContent = comparisonAvailable && !baselineWasZero
    ? formatNumber(Math.abs(change))
    : "—";
  $("#insight-title").textContent = !hasData
    ? "Aguardando leituras"
    : baselineWasZero
        ? "Consumo retomado"
        : exceedsThreshold
          ? "Ritmo mensal elevado"
          : !comparisonAvailable
            ? "Estabelecendo referência"
            : increasingRapidly
              ? "Vale investigar"
              : change < 0
                ? "Uma boa evolução"
                : "Consumo estável";
  $(".insight-panel > p").textContent = !hasData
    ? "Registre pelo menos duas leituras para estimar o ritmo mensal de consumo."
    : baselineWasZero
        ? "Houve consumo após um intervalo estimado sem consumo. Confira as leituras; não há base válida para calcular um percentual."
        : exceedsThreshold
          ? `O ritmo mensal estimado está acima de ${formatNumber(HIGH_CONSUMPTION_M3)} m³/mês. Confira hábitos de consumo, torneiras e possíveis vazamentos.`
          : !comparisonAvailable
            ? "Uma nova leitura permitirá comparar o ritmo mensal estimado com o intervalo anterior."
            : increasingRapidly
              ? `O ritmo mensal estimado aumentou mais de ${ALERT_CHANGE_PERCENT}% em relação ao intervalo anterior. Confira torneiras, descargas e possíveis vazamentos.`
              : change < 0
                ? "O ritmo mensal estimado caiu em relação ao intervalo anterior. Continue registrando as leituras para acompanhar essa tendência."
                : "O ritmo mensal estimado teve uma pequena variação. Continue registrando as leituras para acompanhar essa tendência.";
}
function renderNotification(metrics) {
  const { consumptions, comparisonAvailable, baselineWasZero, change, current } = metrics;
  const button = $("#notificationButton");
  const dot = $("#notificationDot");
  const exceedsThreshold = consumptions.length > 0 && current > HIGH_CONSUMPTION_M3;
  const increasingRapidly = comparisonAvailable && change > ALERT_CHANGE_PERCENT;
  const alert = baselineWasZero || exceedsThreshold || increasingRapidly;
  let status = "Sem alertas";
  let message = `Sem aumento acima de ${ALERT_CHANGE_PERCENT}% no ritmo mensal estimado em relação ao intervalo anterior.`;

  if (!consumptions.length) {
    status = "Aguardando dados";
    message = "Registre duas leituras para calcular o ritmo mensal estimado.";
  } else if (baselineWasZero) {
    status = "Consumo retomado";
    message = `O ritmo atual é ${formatNumber(current)} m³/mês após um intervalo estimado sem consumo; não há base para calcular um percentual.`;
  } else if (exceedsThreshold) {
    status = "Ritmo mensal elevado";
    message = `O ritmo mensal estimado é ${formatNumber(current)} m³/mês, acima do limite de ${formatNumber(HIGH_CONSUMPTION_M3)} m³/mês. Confira possíveis vazamentos.`;
  } else if (!comparisonAvailable) {
    status = "Aguardando comparação";
    message = "Registre outra leitura para comparar o ritmo mensal com o intervalo anterior.";
  } else if (increasingRapidly) {
    status = "Aumento de consumo";
    message = `O ritmo mensal estimado aumentou mais de ${ALERT_CHANGE_PERCENT}% em relação ao intervalo anterior. Confira possíveis vazamentos.`;
  } else if (change < 0) {
    status = "Consumo reduzido";
    message = `O ritmo mensal estimado caiu ${formatNumber(Math.abs(change))}% em relação ao intervalo anterior.`;
  }

  $("#notificationStatus").textContent = status;
  $("#notificationMessage").textContent = message;
  dot.hidden = !alert;
  button.setAttribute("aria-label", alert ? "Notificações: há um alerta de consumo" : "Notificações do consumo");
}
function renderTable(consumptions) {
  const rows = consumptions.slice().reverse().slice(0, 5);
  $("#readingsTable").innerHTML = rows.length
    ? rows
        .map((item) => {
          const hasEstimate = item.monthlyEquivalent !== null;
          const needsAttention = hasEstimate && item.monthlyEquivalent > HIGH_CONSUMPTION_M3;
          const status = !hasEstimate
            ? "Sem estimativa"
            : needsAttention
              ? "Verificar"
              : "Dentro da meta";
          const title = hasEstimate
            ? `Ritmo mensal estimado: ${formatNumber(item.monthlyEquivalent)} m³/mês.`
            : "Não foi possível estimar o ritmo mensal para este intervalo.";
          return `<tr><td>${formatDate(item.date)}</td><td>${formatNumber(item.meter)} m³</td><td>${formatNumber(item.consumption)} m³</td><td><span class="status-badge ${needsAttention ? "warning" : "good"}" title="${title}">${status}</span></td></tr>`;
        })
        .join("")
    : '<tr><td colspan="4">Adicione uma segunda leitura para calcular o consumo.</td></tr>';
}
function renderChart(consumptions) {
  const chart = $("#consumptionChart");
  const labels = $("#chartLabels");
  const yLabels = $(".chart-y-labels");
  const width = 640;
  const height = 220;
  const points = consumptions
    .filter((point) => point.monthlyEquivalent !== null)
    .slice(-6);
  const highestValue = Math.max(...points.map((point) => point.monthlyEquivalent), 0);
  const max = Math.max(20, Math.ceil(highestValue / 5) * 5);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => ({
    x: points.length > 1 ? index * step : width / 2,
    y: height - (Math.min(point.monthlyEquivalent, max) / max) * height,
    value: point.monthlyEquivalent,
    label: formatChartDate(point.date),
    intervalDays: point.intervalDays,
    intervalConsumption: point.consumption,
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coords.length ? `0,${height} ${line} ${width},${height}` : "";
  const grid = [0, 1, 2, 3, 4]
    .map(
      (index) =>
        `<line class="chart-grid-line" x1="0" y1="${(index * height) / 4}" x2="${width}" y2="${(index * height) / 4}" />`,
    )
    .join("");
  const averageY = height - (Math.min(MONTHLY_REFERENCE_M3, max) / max) * height;
  const dots = coords
    .map(
      (point, index) =>
        `<circle class="chart-point ${index === coords.length - 1 ? "current" : ""}" cx="${point.x}" cy="${point.y}" r="${index === coords.length - 1 ? 5 : 4}"><title>${formatNumber(point.value)} m³/mês estimados em ${point.label}; ${formatNumber(point.intervalConsumption)} m³ em ${point.intervalDays} dias</title></circle>`,
    )
    .join("");
  chart.innerHTML = `${grid}<line class="chart-average-line" x1="0" y1="${averageY}" x2="${width}" y2="${averageY}" /><text class="chart-average-label" x="636" y="${Math.max(14, averageY - 7)}" text-anchor="end">${formatNumber(MONTHLY_REFERENCE_M3)} m³/mês</text>${points.length ? `<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${dots}` : '<text class="chart-empty" x="320" y="112" text-anchor="middle">Registre duas leituras para visualizar a evolução</text>'}`;
  $("#chartReferenceLabel").textContent = `Média recomendada: ${formatNumber(MONTHLY_REFERENCE_M3)} m³/mês`;
  labels.innerHTML = coords
    .map((point) => `<span>${point.label}</span>`)
    .join("");
  yLabels.innerHTML = [max, max * 0.75, max * 0.5, max * 0.25, 0]
    .map((value) => `<span>${formatNumber(value).replace(",0", "")}</span>`)
    .join("");
}
function render() {
  const metrics = getMetrics(state.readings);
  renderDashboardDate();
  renderResidence();
  renderMetrics(metrics);
  renderTable(metrics.consumptions);
  renderChart(metrics.consumptions);
  renderNotification(metrics);
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
function notifyFormSaved(detail) {
  document.dispatchEvent(new CustomEvent("gotavertice:form-saved", { detail }));
}
function setFormPending(form, pending) {
  if (pending) form.setAttribute("aria-busy", "true");
  else form.removeAttribute("aria-busy");
  form.querySelectorAll("input, select, textarea, button").forEach((field) => {
    field.disabled = pending;
  });
}
function refresh(data) {
  state = data;
  render();
}

$("#readingDate").value = toLocalDateInput();
$("#readingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const date = $("#readingDate").value;
  const meter = Number($("#meterReading").value);
  if (!date || !Number.isFinite(meter) || meter < 0)
    return setFormFeedback("Informe uma data e uma leitura válida.");
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
  setFormPending(form, true);
  try {
    refresh(await saveReading(currentUser, state.residenceId, { date, meter }));
    event.target.reset();
    $("#readingDate").value = toLocalDateInput();
    setFormFeedback("Leitura salva com sucesso.", "success");
    notifyFormSaved({ formId: "readingForm" });
    showToast("Nova leitura registrada.");
  } catch {
    setFormFeedback("Não foi possível salvar. Verifique sua conexão.");
  } finally {
    setFormPending(form, false);
  }
});

$("#residenceForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  setFormPending(form, true);
  try {
    refresh(
      await saveResidence(currentUser, state.residenceId, {
        name: $("#residenceName").value.trim() || "Minha residência",
        residents: Math.min(
          30,
          Math.max(1, Number($("#residentCount").value) || 1),
        ),
      }),
    );
    notifyFormSaved({ formId: "residenceForm" });
    showToast("Dados da residência atualizados.");
  } catch {
    showToast("Não foi possível atualizar a residência.");
  } finally {
    setFormPending(form, false);
  }
});

$("#residenceSelector")?.addEventListener("change", async (event) => {
  const selector = event.currentTarget;
  selector.disabled = true;
  try {
    refresh(await switchResidence(currentUser, selector.value));
    notifyFormSaved({ fieldId: "residenceSelector" });
    showToast("Residência alterada.");
  } catch {
    showToast("Não foi possível alterar a residência.");
  } finally {
    selector.disabled = false;
  }
});

const residenceDialog = $("#newResidenceDialog");
$("#newResidenceButton")?.addEventListener("click", () => {
  $("#newResidenceName").value = "";
  $("#newResidenceResidents").value = "1";
  residenceDialog.showModal();
  $("#newResidenceName").focus();
});
$("#closeResidenceDialog")?.addEventListener("click", () => residenceDialog.close());
$("#cancelResidenceDialog")?.addEventListener("click", () => residenceDialog.close());
$("#newResidenceForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = $("#newResidenceName").value.trim();
  const residents = Number($("#newResidenceResidents").value);
  if (!name) return;
  setFormPending(form, true);
  try {
    refresh(await createResidence(currentUser, {
      name,
      residents: Math.min(30, Math.max(1, residents || 1)),
    }));
    residenceDialog.close();
    notifyFormSaved({ formId: "newResidenceForm" });
    showToast("Nova residência criada.");
  } catch {
    showToast("Não foi possível criar a residência. Verifique sua conexão.");
  } finally {
    setFormPending(form, false);
  }
});

$("#exportDataButton")?.addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    residenceId: state.residenceId,
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
    refresh(await clearUserData(currentUser, state.residenceId));
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

const notificationButton = $("#notificationButton");
const notificationPanel = $("#notificationPanel");
notificationButton?.addEventListener("click", () => {
  const open = notificationButton.getAttribute("aria-expanded") === "true";
  notificationButton.setAttribute("aria-expanded", String(!open));
  notificationPanel.hidden = open;
  if (!open) notificationPanel.focus();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || notificationPanel.hidden) return;
  notificationPanel.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
  notificationButton.focus();
});
document.addEventListener("click", (event) => {
  if (event.target.closest?.(".notification-wrap")) return;
  notificationPanel.hidden = true;
  notificationButton.setAttribute("aria-expanded", "false");
});

$("#logoutButton")?.addEventListener("click", async () => {
  await logoutAccount();
  window.location.replace("/login/");
});
$("#logoutAccountButton")?.addEventListener("click", async () => {
  await logoutAccount();
  window.location.replace("/login/");
});

$("#profileForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const displayName = $("#profileName").value.trim();
  if (displayName.length < 2)
    return showToast("Informe um nome com pelo menos dois caracteres.");
  setFormPending(form, true);
  try {
    await updateUserProfile(currentUser, displayName);
    $("#accountName").textContent = displayName;
    notifyFormSaved({ formId: "profileForm" });
    showToast("Perfil atualizado com sucesso.");
  } catch {
    showToast("Não foi possível atualizar o perfil.");
  } finally {
    setFormPending(form, false);
  }
});

watchAuth(async (user) => {
  if (!user) return window.location.replace("/login/");
  currentUser = user;
  $("#profileName").value = user.displayName || "";
  $("#accountName").textContent = user.displayName || "Sua conta GotaVértice";
  $("#accountEmail").textContent = user.email || "Conta Google";
  try {
    await ensureUserProfile(user);
    refresh(await loadUserData(user));
  } catch {
    showToast("Não foi possível carregar seus dados. Verifique o Firestore.");
  }
});

console.info("GotaVértice · Gabriel Lucio · github.com/gabrielaraujo-eng");
