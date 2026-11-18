(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DashboardVersion = api;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    api.init(window, document);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const VERSIONED_PATHS = [
    "/index.html",
    "/styles.css",
    "/dashboard-theme.js",
    "/dashboard-version.js",
    "/app.js",
    "/consumption.js",
  ];
  const CLOCK_SKEW_TOLERANCE_MS = 1000;

  function parseDocumentLastModified(value, locale = "en-US") {
    if (typeof value !== "string" || !value.trim()) return Number.NaN;
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}(?:T|\s)/.test(trimmed) || /\b(?:GMT|UTC)\b|^[A-Z][a-z]{2},/.test(trimmed)) {
      return Date.parse(trimmed);
    }

    const numbers = trimmed.match(/\d+/g)?.map(Number) ?? [];
    if (numbers.length < 3) return Number.NaN;
    const dateParts = numbers.slice(0, 3);
    const timeParts = numbers.slice(3, 6);
    const meridiem = /\b(PM|AM)\b/i.exec(trimmed)?.[1]?.toUpperCase();
    let order;
    try {
      order = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
        .formatToParts(new Date(2006, 10, 22))
        .filter((part) => ["year", "month", "day"].includes(part.type))
        .map((part) => part.type);
    } catch {
      order = ["month", "day", "year"];
    }
    if (order.length !== 3) return Number.NaN;

    const values = Object.fromEntries(order.map((part, index) => [part, dateParts[index]]));
    let hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const seconds = timeParts[2] ?? 0;
    if (meridiem && (hours < 1 || hours > 12)) return Number.NaN;
    if (hours > 23 || minutes > 59 || seconds > 59) return Number.NaN;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const date = new Date(
      values.year,
      values.month - 1,
      values.day,
      hours,
      minutes,
      seconds,
    );
    if (
      date.getFullYear() !== values.year ||
      date.getMonth() !== values.month - 1 ||
      date.getDate() !== values.day
    ) return Number.NaN;
    return date.getTime();
  }

  function hasNewerVersion(pageLastModified, responseLastModifiedValues, locale = "en-US") {
    const pageTime = typeof pageLastModified === "number"
      ? pageLastModified
      : parseDocumentLastModified(pageLastModified, locale);
    if (!Number.isFinite(pageTime)) return false;
    return responseLastModifiedValues.some((value) => {
      const assetTime = Date.parse(value ?? "");
      return Number.isFinite(assetTime) && assetTime > pageTime + CLOCK_SKEW_TOLERANCE_MS;
    });
  }

  function init(win, doc) {
    const notice = doc.getElementById("updateNotice");
    const reloadButton = doc.getElementById("reloadForUpdate");
    if (!notice || !reloadButton) return null;

    const pageLastModified = doc.lastModified;
    let checkInProgress = false;
    const dirtyFields = new Set();

    const markEdited = (event) => {
      if (event.target?.matches?.("input, select, textarea")) dirtyFields.add(event.target);
    };
    const markFormSaved = (event) => {
      const { formId, fieldId } = event.detail ?? {};
      for (const field of dirtyFields) {
        if (
          field.isConnected === false ||
          (formId && field.closest?.("form")?.id === formId) ||
          (fieldId && field.id === fieldId)
        ) dirtyFields.delete(field);
      }
    };
    const hasUnsavedChanges = () => [...dirtyFields].some((field) => field.isConnected !== false);
    doc.addEventListener("input", markEdited, true);
    doc.addEventListener("change", markEdited, true);
    doc.addEventListener("gotavertice:form-saved", markFormSaved);

    reloadButton.addEventListener("click", () => {
      if (
        hasUnsavedChanges() &&
        !win.confirm("Você editou campos nesta página. Recarregar pode descartar alterações recentes ainda não salvas. Deseja continuar?")
      ) return;
      win.location.reload();
    });

    async function checkNow() {
      if (checkInProgress || !notice.hidden || doc.visibilityState === "hidden") return false;
      checkInProgress = true;
      try {
        const modifiedDates = await Promise.all(
          VERSIONED_PATHS.map(async (path) => {
            try {
              const response = await win.fetch(`${win.location.origin}${path}`, {
                method: "HEAD",
                cache: "no-store",
                credentials: "same-origin",
              });
              return response.ok ? response.headers.get("last-modified") : null;
            } catch {
              return null;
            }
          }),
        );
        if (hasNewerVersion(pageLastModified, modifiedDates, win.navigator.language)) {
          notice.hidden = false;
          return true;
        }
      } finally {
        checkInProgress = false;
      }
      return false;
    }

    const intervalId = win.setInterval(() => void checkNow(), CHECK_INTERVAL_MS);
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "visible") void checkNow();
    });
    win.addEventListener("focus", () => void checkNow());
    const initialCheck = checkNow();

    return {
      checkNow,
      initialCheck,
      dispose() {
        win.clearInterval(intervalId);
        doc.removeEventListener("input", markEdited, true);
        doc.removeEventListener("change", markEdited, true);
        doc.removeEventListener("gotavertice:form-saved", markFormSaved);
      },
    };
  }

  return {
    CHECK_INTERVAL_MS,
    VERSIONED_PATHS,
    parseDocumentLastModified,
    hasNewerVersion,
    init,
  };
});
