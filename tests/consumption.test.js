const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sortReadings,
  getConsumptions,
  getMetrics,
  toLocalDateInput,
  MONTHLY_REFERENCE_M3,
} = require('../public/consumption.js');

const readings = [
  { date: '2026-03-15', meter: 130 },
  { date: '2026-01-15', meter: 100 },
  { date: '2026-02-15', meter: 112 },
];
const daysPerAverageMonth = 365.2425 / 12;

test('ordena leituras cronologicamente sem alterar a lista original', () => {
  assert.deepEqual(
    sortReadings(readings).map((item) => item.date),
    ['2026-01-15', '2026-02-15', '2026-03-15'],
  );
  assert.equal(readings[0].date, '2026-03-15');
});

test('calcula consumo bruto e duração de cada intervalo', () => {
  const result = getConsumptions(readings);
  assert.deepEqual(result.map((item) => item.consumption), [12, 18]);
  assert.deepEqual(result.map((item) => item.intervalDays), [31, 28]);
});

test('não produz consumo negativo quando uma leitura é corrigida', () => {
  const result = getConsumptions([
    { date: '2026-01-01', meter: 200 },
    { date: '2026-02-01', meter: 190 },
  ]);
  assert.equal(result[0].consumption, 0);
});

test('ignora intervalos sem duração válida nas médias e economia estimada', () => {
  const metrics = getMetrics([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-01', meter: 110 },
    { date: '2026-01-31', meter: 120 },
  ]);
  assert.equal(metrics.consumptions[0].monthlyEquivalent, null);
  assert.ok(Math.abs(metrics.average - 10 * daysPerAverageMonth / 30) < 1e-10);
  const expectedSavings = Math.max(0, MONTHLY_REFERENCE_M3 * 30 / daysPerAverageMonth - 10);
  assert.ok(Math.abs(metrics.savings - expectedSavings) < 1e-10);
});

test('normaliza intervalos de durações diferentes para a mesma taxa mensal', () => {
  const intervals = getConsumptions([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-11', meter: 110 },
    { date: '2026-02-10', meter: 140 },
  ]);
  assert.deepEqual(intervals.map((item) => item.intervalDays), [10, 30]);
  assert.ok(Math.abs(intervals[0].monthlyEquivalent - intervals[1].monthlyEquivalent) < 1e-10);
  const metrics = getMetrics([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-11', meter: 110 },
    { date: '2026-02-10', meter: 140 },
  ]);
  assert.ok(Math.abs(metrics.change) < 1e-10);
  assert.ok(Math.abs(metrics.average - daysPerAverageMonth) < 1e-10);
});

test('não apresenta 0% quando o intervalo anterior teve consumo zero', () => {
  const metrics = getMetrics([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-31', meter: 100 },
    { date: '2026-03-02', meter: 130 },
  ]);
  assert.equal(metrics.comparisonAvailable, true);
  assert.equal(metrics.baselineWasZero, true);
  assert.equal(metrics.change, null);
  assert.ok(metrics.current > 0);
});

test('indica ausência de comparação antes de existir um segundo intervalo', () => {
  const metrics = getMetrics([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-31', meter: 120 },
  ]);
  assert.equal(metrics.comparisonAvailable, false);
  assert.equal(metrics.change, null);
  assert.ok(metrics.current > 0);
});

test('calcula economia estimada proporcional aos dias do intervalo', () => {
  const metrics = getMetrics([
    { date: '2026-01-01', meter: 100 },
    { date: '2026-01-11', meter: 101 },
  ]);
  const expected = MONTHLY_REFERENCE_M3 * 10 / daysPerAverageMonth - 1;
  assert.ok(Math.abs(metrics.savings - expected) < 1e-10);
});

test('formata a data padrão com o calendário local, não em UTC', () => {
  const lateLocalDate = new Date(2026, 10, 18, 23, 30);
  assert.equal(toLocalDateInput(lateLocalDate), '2026-11-18');
});
