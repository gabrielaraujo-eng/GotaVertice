const test = require('node:test');
const assert = require('node:assert/strict');
const { sortReadings, getConsumptions, getMetrics } = require('../public/consumption.js');

const readings = [
  { date: '2026-03-15', meter: 130 },
  { date: '2026-01-15', meter: 100 },
  { date: '2026-02-15', meter: 112 }
];

test('ordena leituras cronologicamente sem alterar a lista original', () => {
  assert.deepEqual(sortReadings(readings).map((item) => item.date), ['2026-01-15', '2026-02-15', '2026-03-15']);
  assert.equal(readings[0].date, '2026-03-15');
});

test('calcula consumo entre leituras consecutivas', () => {
  assert.deepEqual(getConsumptions(readings).map((item) => item.consumption), [12, 18]);
});

test('não produz consumo negativo quando uma leitura é corrigida', () => {
  const result = getConsumptions([{ date: '2026-01-01', meter: 200 }, { date: '2026-02-01', meter: 190 }]);
  assert.equal(result[0].consumption, 0);
});

test('calcula aumento percentual e média do período', () => {
  const metrics = getMetrics(readings);
  assert.equal(metrics.current, 18);
  assert.equal(metrics.previous, 12);
  assert.equal(metrics.average, 15);
  assert.equal(metrics.change, 50);
});
