const STORAGE_KEY = 'agua-consciente-state';

const defaultState = {
  residence: { name: 'Minha residência', residents: 2 },
  readings: [
    { date: '2026-06-15', meter: 181.2 },
    { date: '2026-07-15', meter: 194.8 },
    { date: '2026-08-15', meter: 208.9 },
    { date: '2026-09-15', meter: 223.4 },
    { date: '2026-10-15', meter: 237.6 },
    { date: '2026-11-15', meter: 250.0 }
  ]
};

let state = loadState();
const $ = (selector) => document.querySelector(selector);

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultState);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
}

function getSortedReadings() {
  return [...state.readings].sort((a, b) => a.date.localeCompare(b.date));
}

function getConsumptions() {
  const readings = getSortedReadings();
  return readings.slice(1).map((reading, index) => ({
    ...reading,
    previousMeter: readings[index].meter,
    consumption: Math.max(0, reading.meter - readings[index].meter)
  }));
}

function getMetrics() {
  const consumptions = getConsumptions();
  const current = consumptions.at(-1)?.consumption || 0;
  const previous = consumptions.at(-2)?.consumption || current;
  const average = consumptions.length ? consumptions.reduce((sum, item) => sum + item.consumption, 0) / consumptions.length : 0;
  const change = previous ? ((current - previous) / previous) * 100 : 0;
  const savings = Math.max(0, consumptions.reduce((sum, item) => sum + Math.max(0, 15 - item.consumption), 0));
  return { consumptions, current, previous, average, change, savings };
}

function renderResidence() {
  $('#sidebarResidence').textContent = state.residence.name;
  $('#sidebarResidents').textContent = `${state.residence.residents} ${state.residence.residents === 1 ? 'morador' : 'moradores'}`;
  $('#residenceName').value = state.residence.name;
  $('#residentCount').value = state.residence.residents;
}

function renderMetrics() {
  const { current, average, change, savings } = getMetrics();
  $('#currentConsumption').innerHTML = `${formatNumber(current)} <small>m³</small>`;
  $('#averageConsumption').innerHTML = `${formatNumber(average)} <small>m³</small>`;
  $('#savedConsumption').innerHTML = `${formatNumber(savings)} <small>m³</small>`;

  const changeElement = $('#consumptionChange');
  changeElement.className = `metric-change ${change <= 0 ? 'positive' : 'neutral'}`;
  changeElement.innerHTML = `${change <= 0 ? '↓' : '↑'} ${formatNumber(Math.abs(change))}% <b>vs. mês anterior</b>`;

  const isAlert = change > 20;
  $('#statusText').textContent = isAlert ? 'Atenção' : 'Tudo certo';
  $('#statusDetail').textContent = isAlert ? 'Aumento acima de 20%' : 'Nenhum aumento expressivo';
  $('#alertMetric').classList.toggle('has-alert', isAlert);
  $('#insightPercent').textContent = formatNumber(Math.abs(change));
  $('#insight-title').textContent = isAlert ? 'Vale investigar' : change <= 0 ? 'Uma boa evolução' : 'Consumo estável';
  $('.insight-panel > p').textContent = isAlert
    ? 'O consumo aumentou bastante em relação ao último mês. Confira torneiras, descargas e possíveis vazamentos.'
    : change <= 0
      ? 'Você consumiu menos água que no mês passado. Se mantiver esse ritmo, pode economizar ainda mais até o fim do ano.'
      : 'Seu consumo teve uma pequena variação. Continue registrando as leituras para acompanhar essa tendência.';
}

function renderTable() {
  const rows = getConsumptions().slice().reverse().slice(0, 5);
  const table = $('#readingsTable');
  table.innerHTML = rows.length ? rows.map((item) => {
    const isAlert = item.consumption > 18;
    return `<tr><td>${formatDate(item.date)}</td><td>${formatNumber(item.meter)} m³</td><td>${formatNumber(item.consumption)} m³</td><td><span class="status-badge ${isAlert ? 'warning' : 'good'}">${isAlert ? 'Verificar' : 'Dentro da meta'}</span></td></tr>`;
  }).join('') : '<tr><td colspan="4">Adicione uma segunda leitura para calcular o consumo.</td></tr>';
}

function renderChart() {
  const { consumptions } = getMetrics();
  const chart = $('#consumptionChart');
  const labels = $('#chartLabels');
  const width = 640;
  const height = 220;
  const max = 20;
  const points = consumptions.length ? consumptions.slice(-6) : [];
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => ({
    x: points.length > 1 ? index * step : width / 2,
    y: height - Math.min(point.consumption, max) / max * height,
    value: point.consumption,
    label: formatDate(point.date)
  }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = coords.length ? `0,${height} ${line} ${width},${height}` : '';
  const grid = [0, 1, 2, 3, 4].map((index) => `<line class="chart-grid-line" x1="0" y1="${index * height / 4}" x2="${width}" y2="${index * height / 4}" />`).join('');
  const averageY = height - 15 / max * height;
  const dots = coords.map((point, index) => `<circle class="chart-point ${index === coords.length - 1 ? 'current' : ''}" cx="${point.x}" cy="${point.y}" r="${index === coords.length - 1 ? 5 : 4}"><title>${formatNumber(point.value)} m³</title></circle>`).join('');
  chart.innerHTML = `<defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#65c1c3" stop-opacity=".38"/><stop offset="100%" stop-color="#65c1c3" stop-opacity="0"/></linearGradient></defs>${grid}<line class="chart-average-line" x1="0" y1="${averageY}" x2="${width}" y2="${averageY}" />${coords.length ? `<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${dots}` : ''}`;
  labels.innerHTML = coords.map((point) => `<span>${point.label}</span>`).join('');
}

function render() {
  renderResidence();
  renderMetrics();
  renderTable();
  renderChart();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3000);
}

$('#readingDate').value = new Date().toISOString().slice(0, 10);
$('#readingForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const date = $('#readingDate').value;
  const meter = Number($('#meterReading').value);
  const previous = getSortedReadings().at(-1);
  if (!date || !Number.isFinite(meter) || meter < 0) return;
  if (previous && meter < previous.meter) {
    $('#formFeedback').textContent = 'A leitura precisa ser maior que a anterior.';
    return;
  }
  const existing = state.readings.find((reading) => reading.date === date);
  if (existing) existing.meter = meter;
  else state.readings.push({ date, meter });
  saveState();
  render();
  event.target.reset();
  $('#readingDate').value = new Date().toISOString().slice(0, 10);
  $('#formFeedback').textContent = 'Leitura salva com sucesso.';
  showToast('Nova leitura registrada.');
});

$('#residenceForm').addEventListener('submit', (event) => {
  event.preventDefault();
  state.residence.name = $('#residenceName').value.trim() || 'Minha residência';
  state.residence.residents = Number($('#residentCount').value) || 1;
  saveState();
  render();
  showToast('Dados da residência atualizados.');
});

document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
}));

render();
