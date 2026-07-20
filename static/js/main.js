// Shared helpers used across pages — case history lives entirely in
// localStorage, matching the "stored locally, never leaves your browser" promise.

const CG_STORAGE_KEY = "crimeguard_history";

function cgGetHistory() {
  try {
    return JSON.parse(localStorage.getItem(CG_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function cgSaveCase(caseResult) {
  const history = cgGetHistory();
  history.unshift(caseResult);
  localStorage.setItem(CG_STORAGE_KEY, JSON.stringify(history));
}

function cgDeleteCase(id) {
  const history = cgGetHistory().filter((c) => c.id !== id);
  localStorage.setItem(CG_STORAGE_KEY, JSON.stringify(history));
  return history;
}

function cgFindCase(id) {
  return cgGetHistory().find((c) => c.id === id);
}

function cgRiskEmoji(riskKey) {
  return { low: "🟢", mod: "🟡", high: "🟠", crit: "🔴" }[riskKey] || "⚪";
}
