import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowCounterClockwise, Check } from "@phosphor-icons/react";
import { activities, lessonStepComplete, lessonStateAt } from "./catalog.mjs";
import { ActivityScene } from "./Scenes.jsx";
import { guideProbes, probeState, investigationKey, readInvestigations, recordPrediction, recordEvidence, recordObservation, markInvestigationHelp } from "./guide-probes.mjs";
import "./investigation.css";

function readStore() { try { return readInvestigations(localStorage.getItem(investigationKey)); } catch { return readInvestigations(null); } }
function Choice({ title, options, value, onChange, locked = false }) {
  return <fieldset className="investigation-choice"><legend>{title}</legend>{options.map((option, i) => <button type="button" key={option} aria-pressed={value === i} disabled={locked} onClick={() => onChange(i)}>{option}</button>)}</fieldset>;
}
const predictionHelpText = record => record?.predictionHelped === true ? "Przewidywanie zapisano po skorzystaniu z pomocy."
  : record?.predictionHelped === false ? "Przewidywanie zapisano przed dodatkową pomocą." : "Brak zapisu pomocy przed przewidywaniem w tym rekordzie.";

export function GuidedInvestigation({ id, renderControl, onAssessment, resumeRef, externalHelp = false }) {
  const activity = activities[id];
  const resume = resumeRef?.current;
  const [index, setIndex] = useState(resume?.index ?? 0);
  const [stage, setStage] = useState(resume?.stage ?? "predict");
  const [state, setState] = useState(() => resume?.state ?? probeState(id, 0));
  const [prediction, setPrediction] = useState(resume?.prediction ?? null);
  const [evidence, setEvidence] = useState(resume?.evidence ?? null);
  const [token, setToken] = useState(resume?.token ?? null);
  const [setupUsed, setSetupUsed] = useState(resume?.setupUsed ?? false);
  const [helpSeen, setHelpSeen] = useState(resume?.helpSeen || externalHelp);
  const [describePhotos, setDescribePhotos] = useState(resume?.describePhotos ?? false);
  const [records, setRecords] = useState(readStore);
  const [storageNotice, setStorageNotice] = useState("");
  const apparatus = useRef(null);
  const probe = guideProbes[id][index], step = activity.steps[index];
  const read = probe.kind === "read", complete = read || lessonStepComplete(id, index, state);
  const record = records.attempts.find(a => a.token === token);
  const predictionText = record?.answerText ?? (record?.legacy ? "rekord starszej wersji bez zachowanej treści" : probe.options[prediction]);
  const expectedText = record?.options?.[record.correctIndex] ?? (record?.legacy ? "brak zachowanej wersji pytania" : probe.options[probe.correct]);
  const evidenceQuestion = record?.evidenceQuestion ?? probe.evidence;
  const evidenceOptions = record?.evidenceOptions ?? probe.evidenceOptions;
  const expectedEvidence = record?.evidenceOptions?.[record.evidenceCorrectIndex] ?? (record?.legacy ? "brak zachowanego uzasadnienia" : probe.evidenceOptions[probe.evidenceCorrect]);
  const control = activity.controls.find(c => c.key === step.key);
  const total = guideProbes[id].length;
  useEffect(() => { if(resumeRef) resumeRef.current = {index,stage,state,prediction,evidence,token,setupUsed,helpSeen,describePhotos}; }, [resumeRef,index,stage,state,prediction,evidence,token,setupUsed,helpSeen,describePhotos]);
  useEffect(() => {
    if (!externalHelp) return;
    setHelpSeen(true);
    if (token) write(store => markInvestigationHelp(store, token, "exploration"));
  }, [externalHelp, token]);
  function orient() { requestAnimationFrame(() => apparatus.current?.scrollIntoView({ block: "start", behavior: "instant" })); }
  function write(update) {
    const latest = readStore();
    const combined = { version: 1, attempts: [...latest.attempts, ...records.attempts.filter(a => !latest.attempts.some(b => b.token === a.token))] };
    const next = update(combined); setRecords(next);
    try { localStorage.setItem(investigationKey, JSON.stringify(next)); }
    catch { setStorageNotice("Przeglądarka nie pozwoliła zapisać próby. Wynik pozostaje w tej otwartej pracowni."); }
  }
  function commit() {
    const nextToken = crypto.randomUUID();
    write(store => {
      let next = recordPrediction(store, { id, index, answer: prediction, state: sceneSnapshot(), token: nextToken, helped: helpSeen || externalHelp || describePhotos });
      if (describePhotos) next = markInvestigationHelp(next, nextToken, "description");
      return read ? recordObservation(next, nextToken, sceneSnapshot()) : next;
    });
    setToken(nextToken);
    if (read) { setState(old => ({ ...probeState(id, index, true), ...(old.annotation === undefined ? {} : { annotation: old.annotation }) })); setStage("evidence"); }
    else setStage("act");
    orient();
  }
  function sceneSnapshot() {
    const snapshot = { ...state };
    // Optional annotations must not turn an otherwise valid JSON snapshot invalid.
    if (snapshot.annotation === undefined) delete snapshot.annotation;
    if (["obserwacja", "rodziny"].includes(id)) snapshot.describePhotos = describePhotos;
    return snapshot;
  }
  function advance(nextIndex) {
    setIndex(nextIndex); setState(probeState(id, nextIndex)); setPrediction(null); setEvidence(null); setToken(null); setSetupUsed(false); setDescribePhotos(false); setStage("predict"); orient();
  }
  const sameStep = records.attempts.filter(a => a.id === id && a.index === index);
  const firstRecord = sameStep[0];
  const repeated = Boolean(firstRecord && firstRecord.token !== token);
  const modality = { obserwacja: "opis fotografii", rodziny: "porównanie fotografii", metar: "odczyt depeszy", nazwy: "interpretacja opisu", wysokosc: "geometria wysokości" }[id] || "zmiana jednego warunku";
  const compareState = id === "rodziny" ? lessonStateAt(id, index) : undefined;
  return <section className="investigation" aria-label={`${activity.short}: obserwacja i dowód`}>
    <header className="investigation-heading"><p className="eyebrow">Doświadczenie {index + 1} z {total} · {modality}</p>
      <h2>{record?.question ?? probe.question}</h2><ol className="investigation-stages" aria-label="Przebieg doświadczenia">{[["predict", read ? "Zauważ" : "Przewidź"], ["act", "Sprawdź"], ["evidence", "Wyjaśnij"]].map(([key, label]) => <li key={key} aria-current={stage === key || stage === "review" && key === "evidence" ? "step" : undefined}>{label}</li>)}</ol>
    </header>
    <div className="investigation-grid" ref={apparatus}>
      <div className="investigation-scene"><ActivityScene id={id} state={state} compareState={compareState} conceal={read && stage !== "review"} hideInterpretation={stage !== "review"}
        onStateChange={stage === "act" ? patch => setState(old => ({ ...old, ...patch })) : undefined} controlKey={step.key}
        annotate={id === "obserwacja" && stage === "predict"} annotation={state.annotation} onAnnotation={value => setState(old => ({ ...old, annotation: value }))} describePhotos={describePhotos} />
        {id === "obserwacja" && <p className="investigation-note">Znacznik zachowuje miejsce Twojej obserwacji. Nie oceniamy automatycznie zaznaczonego fragmentu; sprawdzamy opis i uzasadnienie.</p>}
        {stage === "act" && <div className="investigation-direct-hint">{({ front: "Przeciągnij porcję na scenie albo użyj sterowania obok.", wiatr: "Wskaż kierunek na kompasie albo użyj sterowania obok.", metar: "Dotknij grupy chmur lub godziny na osi czasu, aby wybrać odczyt.", wysokosc: "Przesuń uchwyt terenu. Przerywana wysokość MSL zostaje na miejscu." })[id]}</div>}
      </div>
      <div className="investigation-action">
        {["obserwacja", "rodziny"].includes(id) && stage !== "review" && <>
          <button className="learning-reset" aria-expanded={describePhotos} onClick={() => { setDescribePhotos(true); setHelpSeen(true); if (token) write(store => markInvestigationHelp(store, token, "description")); }}>Opis cech zamiast oceny wzrokowej</button>
          {describePhotos && <p className="investigation-note">Czytasz opis cech pod fotografią. Zapis oznaczymy jako pracę z opisem, nie samodzielne rozpoznanie wzrokowe.</p>}
        </>}
        {stage === "predict" && <><Choice title={read ? "Twój opis przed objaśnieniem" : "Twoje przewidywanie przed zmianą"} options={probe.options} value={prediction} onChange={setPrediction} />
          <button className="learning-primary" disabled={prediction === null} onClick={commit}>{read ? "Zapisz obserwację" : "Zapisz przewidywanie"}<ArrowRight /></button><p className="investigation-note">Możesz się pomylić. Zachowamy pierwszą odpowiedź, aby porównać ją z dowodami.</p>
          {sameStep.length > 0 && <p className="investigation-note">To powtórka tego przykładu. Poprzednia pierwsza odpowiedź pozostaje zapisana.</p>}</>}
        {stage === "act" && <><p className="eyebrow">Teraz wykonaj zmianę</p><h3>{step.action}</h3>
          {renderControl(control, state[control.key], value => setState(old => ({ ...old, [control.key]: value })))}
          {!complete && <button className="learning-reset" onClick={() => { setSetupUsed(true); setState(old => ({ ...old, [step.key]: step.target })); }}>Ustaw warunki tej próby <ArrowRight /></button>}
          <button className="learning-primary" disabled={!complete} onClick={() => { write(store => recordObservation(store, token, sceneSnapshot(), { setupUsed })); setStage("evidence"); orient(); }}>Odczytaj wynik i wskaż dowód <ArrowRight /></button>
          <p className="investigation-note">Samo ustawienie wartości nie zalicza nauki. Następny krok wymaga odczytu wyniku.</p></>}
        {stage === "evidence" && <><p className="investigation-committed">Zapisana odpowiedź: <strong>{predictionText}</strong></p><Choice title={evidenceQuestion} options={evidenceOptions} value={evidence} onChange={setEvidence} />
          <button className="learning-primary" disabled={evidence === null} onClick={() => { write(store => recordEvidence(store, token, evidence, { helped: helpSeen || externalHelp, descriptionUsed: describePhotos })); setStage("review"); }} >Porównaj z wyjaśnieniem <Check /></button></>}
        {stage === "review" && <div className="investigation-result" role="status"><p className="eyebrow">{repeated ? "Powtórka znanego przypadku" : "Porównanie z Twoją odpowiedzią"}</p><h3>{record?.correct ? "Ta odpowiedź zgadza się z przypadkiem." : "Porównaj tę odpowiedź z wynikiem."}</h3>
          <p>Wybrano: <strong>{predictionText}</strong></p><p>W tym przykładzie: <strong>{expectedText}</strong></p>
          {repeated && <p>Pierwsza zapisana odpowiedź: <strong>{firstRecord.answerText || "rekord starszej wersji bez zachowanej treści"}</strong>. {predictionHelpText(firstRecord)} Ta powtórka jej nie zastępuje.</p>}
          <p>{predictionHelpText(record)}{record?.setupUsed ? " Użyto przycisku ustawiającego warunki; nie jest to wynik oceny." : ""}</p>
          <p>{record?.evidenceHelped === true ? "Uzasadnienie zapisano z dodatkową pomocą." : record?.evidenceHelped === false ? "Uzasadnienie zapisano bez dodatkowej pomocy." : "Brak zapisu pomocy przy uzasadnieniu w tym rekordzie."}{record?.descriptionUsed ? " Korzystano z opisu cech fotografii; to nie jest zapis samodzielnego rozpoznania wzrokowego." : ""}</p>
          <p>{record?.evidenceCorrect ? "Wskazany dowód pasuje." : `Spójrz ponownie na dowód: ${expectedEvidence}.`}</p>
          <p>{step.expect}</p><p>{step.explanation}</p>
          {index < total - 1 ? <button className="learning-primary" onClick={() => advance(index + 1)}>Kolejne doświadczenie <ArrowRight /></button> : <><p>To koniec przewodnika, nie sprawdzian samodzielności. Teraz dostaniesz inne dane i wybierzesz własne uzasadnienie.</p><button className="learning-primary" onClick={onAssessment}>Zastosuj regułę w nowym przypadku <ArrowRight /></button></>}
        </div>}
        {storageNotice && <p role="status">{storageNotice}</p>}
      </div>
    </div>
    <div className="investigation-navigation">{index > 0 && <button className="learning-reset" onClick={() => advance(index - 1)}>Poprzednie doświadczenie</button>}<button className="learning-reset" onClick={() => advance(index)}><ArrowCounterClockwise /> Powtórz ten przykład</button></div>
  </section>;
}
