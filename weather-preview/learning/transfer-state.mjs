import { transferCases } from "./transfer-cases.mjs";

export const TRANSFER_REVISION = 1;
export const ASSESSMENT_QUALITY_REVISION = 2;
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
function completeDecisions(task, response) {
  return validResponse(task, response) && task.fields.every(field => response[field.id]);
}
function lockDecisions(task, attempt) {
  if (attempt.decisionResponse) return attempt;
  return { ...attempt,
    decisionResponse: Object.fromEntries(task.fields.map(field => [field.id, attempt.response[field.id]])),
    decisionAssisted: attempt.assisted,
  };
}
function validAttempt(task, attempt) {
  return task && attempt && validResponse(task, attempt.response, attempt.submitted && !attempt.revealed)
    && ["assisted", "hint", "repeated", "submitted", "revealed"].every(key => typeof attempt[key] === "boolean")
    && (!attempt.hint || attempt.assisted) && (!attempt.revealed || (attempt.assisted && attempt.submitted))
    && Number.isInteger(attempt.step) && attempt.step >= 0 && attempt.step <= task.fields.length
    && (attempt.submitted || keysFor(task).slice(0, attempt.step).every(key => attempt.response[key]))
    && (attempt.qualityRevision === undefined || (attempt.qualityRevision === ASSESSMENT_QUALITY_REVISION
      && (attempt.decisionResponse === null
        ? attempt.decisionAssisted === null && (!attempt.response.reason || attempt.legacy) && (attempt.revealed || attempt.step < task.fields.length)
        : completeDecisions(task, attempt.decisionResponse) && !Object.hasOwn(attempt.decisionResponse, "reason")
          && typeof attempt.decisionAssisted === "boolean" && (!attempt.decisionAssisted || attempt.assisted)
          && task.fields.every(field => attempt.response[field.id] === attempt.decisionResponse[field.id]))));
}
export function initialTransfer(activityId) {
  return { revision: TRANSFER_REVISION, activityId, seen: [], serial: 0, history: [], firstAttempts: {}, attempt: null };
}
function copyAttempt(attempt) {
  return { ...attempt, response: { ...attempt.response },
    ...(attempt.decisionResponse ? { decisionResponse: { ...attempt.decisionResponse } } : {}),
  };
}
function startAttempt(record, task, assisted = false) {
  const history = record.attempt ? [...record.history, copyAttempt(record.attempt)].slice(-40) : record.history;
  const firstAttempts = { ...record.firstAttempts };
  if (record.attempt && !record.attempt.repeated && !firstAttempts[record.attempt.caseId]) firstAttempts[record.attempt.caseId] = copyAttempt(record.attempt);
  return { ...record, history, firstAttempts, serial: record.serial + 1, seen: [...new Set([...record.seen, task.id])],
    attempt: { caseId: task.id, response: {}, step: 0, assisted, hint: false,
      qualityRevision: ASSESSMENT_QUALITY_REVISION, decisionResponse: null, decisionAssisted: null,
      repeated: record.seen.includes(task.id), submitted: false, revealed: false } };
}
export function nextTransfer(record) {
  const bank = transferCases[record.activityId];
  const unseen = bank.find(task => !record.seen.includes(task.id));
  const currentIndex = bank.findIndex(task => task.id === record.attempt?.caseId);
  const task = unseen || bank[(currentIndex + 1) % bank.length];
  return startAttempt(record, task);
}
export function updateTransfer(record, action) {
  const a = record.attempt;
  if (!a) return record;
  const task = transferCases[record.activityId].find(item => item.id === a.caseId);
  if (action.type === "next") return nextTransfer(record);
  if (a.submitted) return record;
  if (action.type === "restart-help" && a.decisionResponse) return startAttempt(record, task, true);
  let attempt = a;
  if (action.type === "answer" && validResponse(task, { [action.key]: action.value })) {
    if (action.key === "reason" && completeDecisions(task, a.response)) {
      attempt = { ...lockDecisions(task, a), response: { ...a.response, reason: action.value } };
    } else if (action.key !== "reason" && !a.decisionResponse) {
      attempt = { ...a, response: { ...a.response, [action.key]: action.value } };
    }
  }
  if (action.type === "step" && Number.isInteger(action.step) && action.step >= 0 && action.step <= task.fields.length) {
    const preceding = keysFor(task).slice(0, action.step);
    if (preceding.every(key => a.response[key])) {
      attempt = { ...(action.step === task.fields.length ? lockDecisions(task, a) : a), step: action.step };
    }
  }
  if (action.type === "help") attempt = { ...a, assisted: true, hint: a.hint || action.hint === true };
  if (action.type === "reveal") attempt = { ...a, assisted: true, revealed: true, submitted: true };
  if (action.type === "submit" && a.decisionResponse && evaluateTransfer(task, a.response)) attempt = { ...a, submitted: true };
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
  // Keep first attempts independently of the rolling history, including unfinished ones.
  const firstAttempts = {};
  const originals = value.firstAttempts && typeof value.firstAttempts === "object" && !Array.isArray(value.firstAttempts)
    ? Object.values(value.firstAttempts) : [...history, value.attempt].filter(attempt => attempt && !attempt.repeated);
  for (const original of originals) {
    const task = bank.find(task => task.id === original?.caseId);
    if (value.seen.includes(original?.caseId) && validAttempt(task, original) && !firstAttempts[task.id]) {
      firstAttempts[task.id] = copyAttempt(original);
    }
  }
  const a = value.attempt;
  if (a === null) return { ...fallback(), seen: [...new Set(value.seen)], serial: value.serial, history, firstAttempts };
  const task = bank.find(task => task.id === a?.caseId);
  if (!task || !value.seen.includes(task.id) || !validAttempt(task, a)) {
    return { ...fallback(), seen: [...new Set(value.seen)], serial: value.serial, history, firstAttempts };
  }
  let attempt = copyAttempt(a);
  // Old drafts may already have exposed the rule, even after navigating back.
  // Preserve their answers/status, but never claim verified independent decisions.
  if (!a.submitted && a.qualityRevision === undefined) {
    attempt = { ...attempt, qualityRevision: ASSESSMENT_QUALITY_REVISION, legacy: true, assisted: true,
      decisionResponse: null, decisionAssisted: null };
    if (completeDecisions(task, a.response) && (a.step === task.fields.length || a.response.reason)) attempt = lockDecisions(task, attempt);
  }
  return { revision: TRANSFER_REVISION, activityId, seen: [...new Set(value.seen)], serial: value.serial, history, firstAttempts, attempt };
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
  else if (current.attempt && record.attempt && current.serial === record.serial && current.attempt.caseId === record.attempt.caseId) {
    const old = current.attempt;
    let attempt = { ...record.attempt, assisted: record.attempt.assisted || old.assisted, hint: record.attempt.hint || old.hint };
    if (old.decisionResponse) {
      attempt = { ...attempt, decisionResponse: { ...old.decisionResponse }, decisionAssisted: old.decisionAssisted,
        response: { ...old.response, ...attempt.response, ...old.decisionResponse } };
    }
    record = { ...record, attempt };
  }
  record = { ...record, firstAttempts: { ...record.firstAttempts, ...current.firstAttempts } };
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
