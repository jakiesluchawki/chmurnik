import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Question } from "@phosphor-icons/react";
import { transferCases } from "./transfer-cases.mjs";
import { loadTransfer, saveTransfer, nextTransfer, updateTransfer, evaluateTransfer, markTransferHelp } from "./transfer-state.mjs";
import "./transfer.css";

export function TransferTrial({ activityId }) {
  const [record, setRecord] = useState(() => {
    const stored = loadTransfer(activityId);
    const ready = stored.attempt ? stored : nextTransfer(stored);
    saveTransfer(ready);
    return ready;
  });
  const [durable, setDurable] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const heading = useRef(null);
  const a = record.attempt;
  const attemptKey = `${record.serial}:${a.caseId}`;
  const task = transferCases[activityId].find(item => item.id === a.caseId);
  const questions = [...task.fields, { ...task.reason, id: "reason" }];
  const current = questions[a.step];
  const decisionsLocked = current.id !== "reason" && Boolean(a.decisionResponse);
  const legacy = a.legacy || a.qualityRevision === undefined;
  const result = a.submitted && !a.revealed ? evaluateTransfer(task, a.response) : null;
  const images = task.images || (task.image ? [task.image] : []);
  useEffect(() => {
    setDurable(saveTransfer(record));
    const saved = loadTransfer(activityId);
    if (JSON.stringify(saved) !== JSON.stringify(record)) setRecord(saved);
  }, [record, activityId]);
  useEffect(() => {
    const helped = event => { if (event.detail === activityId) setRecord(loadTransfer(activityId)); };
    const navigate = () => markTransferHelp(activityId);
    const capture = { capture: true };
    const followLink = event => {
      if (event.defaultPrevented || (event.button !== undefined && event.button > 1)) return;
      if (event.target?.closest?.("a[href]") && !event.target.closest(".transfer-trial")) navigate();
    };
    window.addEventListener("chmurnik:transfer-help", helped);
    // Route/resource exposure is help; effect cleanup itself is not (e.g. Strict Mode).
    window.addEventListener("hashchange", navigate, capture);
    window.addEventListener("popstate", navigate, capture);
    window.addEventListener("click", followLink, capture);
    window.addEventListener("auxclick", followLink, capture);
    return () => {
      window.removeEventListener("chmurnik:transfer-help", helped);
      window.removeEventListener("hashchange", navigate, capture);
      window.removeEventListener("popstate", navigate, capture);
      window.removeEventListener("click", followLink, capture);
      window.removeEventListener("auxclick", followLink, capture);
    };
  }, [activityId]);
  function change(action, focus = false) {
    setRecord(old => {
      const current = loadTransfer(activityId);
      if (!current.attempt) {
        const recovered = nextTransfer({ ...current, serial: Math.max(current.serial, old.serial), seen: [...new Set([...current.seen, ...old.seen])] });
        saveTransfer(recovered);
        return loadTransfer(activityId);
      }
      if (current.serial !== old.serial || current.attempt.caseId !== old.attempt.caseId) return current;
      const next = updateTransfer(current, action);
      saveTransfer(next);
      return loadTransfer(activityId);
    });
    if (focus) requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  }
  function next() { setShowSource(false); setShowDescription(false); change({ type: "next" }, true); }
  const facts = !a.submitted && current.factIndices ? current.factIndices.map(index => task.facts[index]) : task.facts;
  const evidence = <div className="transfer-evidence">{(a.step === 0 || a.submitted || current.id === "reason") && <p>{task.context}</p>}
    <ul>{facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
    {images.map((photo, index) => <figure key={photo.src}>
      {photo.label && <strong>{photo.label}</strong>}
      <img src={photo.src} alt={photo.alt || `Fotografia do oceny ${index + 1}`} />
      <figcaption>{photo.credit} · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>. Pełny kadr.
        {(a.submitted || showSource === attemptKey) && <> <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Oryginał</a></>}
      </figcaption>
      {showDescription === attemptKey && photo.accessibleDescription && <p>{photo.accessibleDescription}</p>}
    </figure>)}
    {images.length > 0 && !a.submitted && <div className="transfer-aids">
      <button onClick={() => { change({ type: "help" }); setShowSource(attemptKey); }}>Pokaż źródło (może ujawnić odpowiedź)</button>
      {images.some(photo => photo.accessibleDescription) && <button onClick={() => { change({ type: "help" }); setShowDescription(attemptKey); }}>Opis zdjęcia zamiast oceny wzrokowej</button>}
    </div>}
  </div>;
  return <section className="transfer-trial" data-case={task.id} aria-label="Zadanie na nowych danych">
    <header className="transfer-heading" ref={heading} tabIndex={-1}>
      <p className="eyebrow">{a.submitted ? "Omówienie odpowiedzi" : `Pytanie ${a.step + 1} z ${questions.length}`} · {a.repeated ? "powtórka znanego przypadku" : "nowy przypadek"}</p>
      <h2>{task.title}</h2>
      <p className="transfer-status">{legacy ? "Próba z wcześniejszej wersji; samodzielność decyzji nie była sprawdzana" : a.assisted ? "Próba z pomocą" : a.repeated ? "Powtórka, nie nowy wynik" : a.submitted ? "Pierwsza odpowiedź zapisana" : "Najpierw zapisz decyzje, potem wybierz zasadę"}</p>
    </header>
    {!durable && <p className="transfer-storage" role="status">Przeglądarka nie zapisała próby na później. Wynik pozostaje tylko w tej karcie.</p>}
    {current.id !== "reason" && !a.submitted ? evidence : <details className="transfer-data"><summary>Wróć do danych zadania</summary>{evidence}</details>}
    {!a.submitted ? <div className="transfer-response">
      {a.decisionResponse && <p role="status">Decyzje zapisane. Możesz wrócić do ich podglądu, ale nie zmienić ich po odsłonięciu zasad.</p>}
      {!a.decisionResponse && a.step === task.fields.length - 1 && <p>Po przejściu dalej zapiszemy te decyzje i pokażemy zasady. Późniejsza zmiana wymaga osobnej powtórki z pomocą.</p>}
      <fieldset disabled={decisionsLocked}><legend>{current.label}</legend><div className="transfer-options">{current.options.map(option => <label key={option.id}>
        <input type="radio" disabled={decisionsLocked} name={`${task.id}-${current.id}`} value={option.id} checked={a.response[current.id] === option.id}
          onChange={() => change({ type: "answer", key: current.id, value: option.id })} />
        <span>{option.label}</span>
      </label>)}</div></fieldset>
      <div className="transfer-navigation">{a.step > 0 && <button onClick={() => change({ type: "step", step: a.step - 1 }, true)}><ArrowLeft /> Wstecz</button>}
        <button className="transfer-primary" disabled={!a.response[current.id]} onClick={() => change(a.step === questions.length - 1 ? { type: "submit" } : { type: "step", step: a.step + 1 }, true)}>
          {a.step === questions.length - 1 ? "Zatwierdź odpowiedzi" : "Dalej"}<ArrowRight />
        </button></div>
      <div className="transfer-aids"><button onClick={() => change({ type: "help", hint: true })}><Question /> Przypomnij zasadę</button>
        <button onClick={() => change({ type: "reveal" }, true)}>Nie wiem, pokaż wyjaśnienie</button>
        {a.decisionResponse && <button onClick={() => { setShowSource(false); setShowDescription(false); change({ type: "restart-help" }, true); }}>Zmień decyzje w powtórce z pomocą</button>}</div>
      {a.hint && <aside className="transfer-hint" role="status"><strong>Podpowiedź</strong><p>{task.hint}</p><small>Odpowiedź będzie oznaczona jako rozwiązana z pomocą.</small></aside>}
    </div> : <div className="transfer-feedback">
      <h3>{a.revealed ? "Wyjaśnienie bez oceny" : result.correct ? legacy ? "Poprawne odpowiedzi zapisane we wcześniejszej wersji" : a.assisted ? "Poprawnie, z pomocą" : a.repeated ? "Poprawna odpowiedź w powtórce" : "Poprawna decyzja i właściwa zasada" : "Sprawdź, który wniosek wymaga poprawy"}</h3>
      {legacy && <p>Zachowano zapisane wybory i wynik. Opcje poniżej mają aktualne brzmienie, które może różnić się od wcześniejszej wersji.</p>}
      {a.assisted && a.decisionAssisted === false && <p>Decyzje zapisano przed skorzystaniem z pomocy. Dalsza część próby była wspomagana.</p>}
      <p>{task.explanation}</p>
      <ol>{questions.map(field => {
        const chosen = field.options.find(option => option.id === a.response[field.id]);
        const correct = field.options.find(option => option.id === task.correct[field.id]);
        return <li key={field.id}><details open={!result?.fields[field.id]}><summary>{field.label}<span>{a.revealed ? "Wyjaśnienie" : result?.fields[field.id] ? "Poprawnie" : "Do poprawy"}</span></summary>
          {chosen && <p>{legacy ? "Zapisana opcja (aktualne brzmienie): " : "Twoja odpowiedź: "}{chosen.label} {result?.fields[field.id] && <Check aria-label="Poprawnie" />}</p>}
          {(!chosen || !result?.fields[field.id]) && <p>Właściwy wniosek: {correct.label}</p>}
          <p>{chosen?.feedback || correct.feedback}</p></details></li>;
      })}</ol>
      <p className="transfer-limit">To wynik tego przypadku, nie ocena przygotowania do lotu ani potwierdzenie opanowania całego tematu. Pierwsza zatwierdzona odpowiedź pozostaje zapisana.</p>
      <button className="transfer-primary" onClick={next}>{transferCases[activityId].some(item => !record.seen.includes(item.id)) ? "Rozwiąż inny przypadek" : "Powtórz wcześniejszy przypadek"}<ArrowRight /></button>
      <details className="transfer-data"><summary>Źródła i zakres wyjaśnienia</summary><ul>{task.sourceUrls.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">{new URL(url).hostname}</a></li>)}</ul></details>
    </div>}
  </section>;
}
