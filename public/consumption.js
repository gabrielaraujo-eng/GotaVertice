(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Consumption = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  function sortReadings(readings) {
    return [...readings].sort((a, b) => a.date.localeCompare(b.date));
  }

  function getConsumptions(readings) {
    const ordered = sortReadings(readings);
    return ordered.slice(1).map((reading, index) => ({
      ...reading,
      previousMeter: ordered[index].meter,
      consumption: Math.max(0, reading.meter - ordered[index].meter)
    }));
  }

  function getMetrics(readings) {
    const consumptions = getConsumptions(readings);
    const current = consumptions.at(-1)?.consumption || 0;
    const previous = consumptions.at(-2)?.consumption || current;
    const average = consumptions.length ? consumptions.reduce((sum, item) => sum + item.consumption, 0) / consumptions.length : 0;
    const change = previous ? ((current - previous) / previous) * 100 : 0;
    const savings = Math.max(0, consumptions.reduce((sum, item) => sum + Math.max(0, 15 - item.consumption), 0));
    return { consumptions, current, previous, average, change, savings };
  }

  return { sortReadings, getConsumptions, getMetrics };
});
