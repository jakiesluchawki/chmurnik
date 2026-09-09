import { transferCases } from "./transfer-cases.mjs";

export const TRANSFER_REVISION = 1;
export const TRANSFER_KEY = "chmurnik:weather-transfer:v1";
const memory = new Map();
const pendingWrites = new Set();
const keysFor = task => [...task.fields.map(field => field.id), "reason"];
const optionsFor = (task, key) => key === "reason" ? task.reason.options : task.fields.find(field => field.id === key)?.options || [];
export function validResponse(task, response, complete = false) {
  if (!response || typeof response !== "object" || Array.isArray(response)) return false;
  const keys = keysFor(task);
  return Object.entries(response).every(([key, value]) => keys.includes(key) && optionsFor(task, key).some(option => option.id === value))
    && (!complete || keys.every(key => response[key]));
}
export function evaluateTransfer(task, response) {
  if (!validResponse(task, response, true)) return null;
  const fields = Object.fromEntries(keysFor(task).map(key => [key, response[key] === task.correct[key]]));
  return { fields, correct: Object.values(fields).every(Boolean) };
}
function validAttempt(task, attempt) {
  return task && attempt && validResponse(task, attempt.response, attempt.submitted && !attempt.revealed)
    && ["assisted", "hint", "repeated", "submitted", "revealed"].every(key => typeof attempt[key] === "boolean")
    && (!attempt.hint || attempt.assisted) && (!attempt.revealed || (attempt.assisted && attempt.submitted))
    && Number.isInteger(attempt.step) && attempt.step >= 0 && attempt.step <= task.fields.length
    && (attempt.submitted || keysFor(task).slice(0, attempt.step).every(key => attempt.response[key]));
}
export function initialTransfer(activityId) {
  return { revision: TRANSFER_REVISION, activityId, seen: [], serial: 0, history: [], attempt: null };
}
export function nextTransfer(record) {
  const bank = transferCases[record.activityId];
  const unseen = bank.find(task => !record.seen.includes(task.id));
  const currentIndex = bank.findIndex(task => task.id === record.attempt?.caseId);
  const task = unseen || bank[(currentIndex + 1) % bank.length];
  const history = record.attempt ? [...record.history, { ...record.attempt, response: { ...record.attempt.response } }].slice(-40) : record.history;
  return { ...record, history, serial: record.serial + 1, seen: [...new Set([...record.seen, task.id])],
    attempt: { caseId: task.id, response: {}, step: 0, assisted: false, hint: false,
      repeated: record.seen.includes(task.id), submitted: false, revealed: false } };
}
export function updateTransfer(record, action) {
  const a = record.attempt;
  if (!a) return record;
  const task = transferCases[record.activityId].find(item => item.id === a.caseId);
  if (action.type === "next") return nextTransfer(record);
  if (a.submitted) return record;
  let attempt = a;
  if (action.type === "answer" && validResponse(task, { [action.key]: action.value })) attempt = { ...a, response: { ...a.response, [action.key]: action.value } };
  if (action.type === "step" && Number.isInteger(action.step) && action.step >= 0 && action.step <= task.fields.length) {
    const preceding = keysFor(task).slice(0, action.step);
    if (preceding.every(key => a.response[key])) attempt = { ...a, step: action.step };
  }
  if (action.type === "help") attempt = { ...a, assisted: true, hint: a.hint || action.hint === true };
  if (action.type === "reveal") attempt = { ...a, assisted: true, revealed: true, submitted: true };
  if (action.type === "submit" && evaluateTransfer(task, a.response)) attempt = { ...a, submitted: true };
  return { ...record, attempt };
}
export function restoreTransfer(activityId, value) {
  const fallback = () => initialTransfer(activityId);
  const bank = transferCases[activityId];
  if (!value || value.revision !== TRANSFER_REVISION || value.activityId !== activityId || !Array.isArray(value.seen)
    || !value.seen.every(id => bank.some(task => task.id === id)) || !Number.isSafeInteger(value.serial) || value.serial < 0) return fallback();
  const history = Array.isArray(value.history) ? value.history.slice(-40).filter(attempt => {
    const task = bank.find(task => task.id === attempt?.caseId);
    return value.seen.includes(attempt?.caseId) && validAttempt(task, attempt);
  }) : [];
  const a = value.attempt;
  if (a === null) return { ...fallback(), seen: [...new Set(value.seen)], serial: value.serial, history };
  const task = bank.find(task => task.id === a?.caseId);
  if (!task || !value.seen.includes(task.id) || !validAttempt(task, a)) {
    return { ...fallback(), seen: [...new Set(value.seen)], serial: value.serial, history };
  }
  return { revision: TRANSFER_REVISION, activityId, seen: [...new Set(value.seen)], serial: value.serial, history,
    attempt: { ...a, response: { ...a.response } } };
}
function storage() { try { return globalThis.localStorage; } catch { return null; } }
export function loadTransfer(activityId) {
  const key = `${TRANSFER_KEY}:${activityId}`;
  if (pendingWrites.has(key)) return restoreTransfer(activityId, memory.get(key));
  try {
    const target = storage();
    if (target) {
      const raw = target.getItem(key);
      return raw ? restoreTransfer(activityId, JSON.parse(raw)) : initialTransfer(activityId);
    }
  } catch { /* A blocked or full browser store falls back to this tab's memory. */ }
  return restoreTransfer(activityId, memory.get(key));
}
export function saveTransfer(record) {
  const key = `${TRANSFER_KEY}:${record.activityId}`;
  const current = loadTransfer(record.activityId);
  // Another mounted view may have submitted while this view still had a draft.
  if (current.serial > record.serial || (current.serial === record.serial && current.attempt?.submitted)) record = current;
  else if (current.serial === record.serial && current.attempt?.caseId === record.attempt?.caseId && current.attempt?.assisted) {
    record = { ...record, attempt: { ...record.attempt, assisted: true, hint: record.attempt.hint || current.attempt.hint } };
  }
  memory.set(key, record);
  try {
    const target = storage();
    if (!target) { pendingWrites.add(key); return false; }
    target.setItem(key, JSON.stringify(record)); pendingWrites.delete(key); return true;
  } catch { pendingWrites.add(key); return false; }
}
export function markTransferHelp(activityId) {
  const record = loadTransfer(activityId);
  if (record.attempt && !record.attempt.submitted) {
    saveTransfer(updateTransfer(record, { type: "help" }));
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("chmurnik:transfer-help", { detail: activityId }));
  }
}
