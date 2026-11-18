(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Consumption = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const DAYS_PER_AVERAGE_MONTH = 365.2425 / 12;
  const MONTHLY_REFERENCE_M3 = 15;
  const HIGH_CONSUMPTION_M3 = 18;
  const ALERT_CHANGE_PERCENT = 20;

  function sortReadings(readings) {
    return [...readings].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function dateOrdinal(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date ?? ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) return null;
    return Math.floor(timestamp / 86400000);
  }

  function toLocalDateInput(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getConsumptions(readings) {
    const ordered = sortReadings(readings);
    return ordered.slice(1).map((reading, index) => {
      const previous = ordered[index];
      const meterDelta = Number(reading.meter) - Number(previous.meter);
      const consumption = Number.isFinite(meterDelta) ? Math.max(0, meterDelta) : 0;
      const startDay = dateOrdinal(previous.date);
      const endDay = dateOrdinal(reading.date);
      const elapsedDays = startDay === null || endDay === null ? 0 : endDay - startDay;
      const intervalDays = Number.isFinite(elapsedDays) ? Math.max(0, elapsedDays) : 0;
      const monthlyEquivalent = intervalDays > 0
        ? consumption * DAYS_PER_AVERAGE_MONTH / intervalDays
        : null;
      return {
        ...reading,
        previousMeter: previous.meter,
        consumption,
        intervalDays,
        monthlyEquivalent,
      };
    });
  }

  function getMetrics(readings) {
    const consumptions = getConsumptions(readings);
    const currentInterval = consumptions.at(-1);
    const previousInterval = consumptions.at(-2);
    const current = currentInterval?.monthlyEquivalent ?? 0;
    const previous = previousInterval?.monthlyEquivalent ?? null;
    const comparisonAvailable = Boolean(
      previousInterval &&
      previousInterval.monthlyEquivalent !== null &&
      currentInterval?.monthlyEquivalent !== null,
    );
    const baselineWasZero = comparisonAvailable && previous === 0 && current > 0;
    const change = !comparisonAvailable
      ? null
      : previous > 0
        ? ((current - previous) / previous) * 100
        : current > 0
          ? null
          : 0;
    const validIntervals = consumptions.filter(
      (item) => item.intervalDays > 0 && item.monthlyEquivalent !== null,
    );
    const totalDays = validIntervals.reduce((sum, item) => sum + item.intervalDays, 0);
    const totalConsumption = validIntervals.reduce((sum, item) => sum + item.consumption, 0);
    const average = totalDays > 0
      ? totalConsumption * DAYS_PER_AVERAGE_MONTH / totalDays
      : 0;
    const savings = validIntervals.reduce((sum, item) => {
      const monthlyTargetForInterval = MONTHLY_REFERENCE_M3 * item.intervalDays / DAYS_PER_AVERAGE_MONTH;
      return sum + Math.max(0, monthlyTargetForInterval - item.consumption);
    }, 0);

    return {
      consumptions,
      current,
      previous,
      average,
      change,
      savings,
      comparisonAvailable,
      baselineWasZero,
      currentIntervalConsumption: currentInterval?.consumption ?? 0,
      currentIntervalDays: currentInterval?.intervalDays ?? 0,
    };
  }

  return {
    sortReadings,
    getConsumptions,
    getMetrics,
    toLocalDateInput,
    MONTHLY_REFERENCE_M3,
    HIGH_CONSUMPTION_M3,
    ALERT_CHANGE_PERCENT,
  };
});
