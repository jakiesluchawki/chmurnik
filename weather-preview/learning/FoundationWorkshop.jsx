import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowCounterClockwise, BookOpen, Sun, Moon } from "@phosphor-icons/react";
import { Slider } from "../Slider.jsx";
import { ParcelControl } from "../parcel-control.jsx";
import { LIMITS, cleanInputs, timeLabel, directionLabel } from "../model.mjs";
import { useSceneMotion } from "../motion.jsx";
import { returnLesson } from "../tutorial.mjs";
import { TransferTrial } from "./TransferTrial.jsx";
import { markTransferHelp } from "./transfer-state.mjs";
import {
  foundationWorkshops, foundationSources, foundationSnapshot, foundationReadout,
  foundationTemperature as temperature, foundationMetres as metres,
  foundationHeightY as heightY, foundationNumber as number,
  loadFoundationState, saveFoundationState, updateFoundation, foundationAttempt, foundationReady,
} from "./foundation-workshop.mjs";
import "./foundation-workshop.css";

function SourceLinks({ workshop }) {
  return <div className="foundation-sources">{[foundationSources[workshop.source], foundationSources.faa].map(source =>
    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>;
}

function InputsLabel({ id, input, complete = false }) {
  return <span>{id === "bryza" ? `${timeLabel(input.hour)} · kontrast ${number(input.heating, 0)}%` :
    `Początkowo ${temperature(input.temperature)} · wilgotność ${number(input.humidity, 0)}%`}
    {complete && id === "chmura" && ` · uniesienie ${metres(input.height)}`}
    {complete && id === "mgla" && ` · ochłodzenie o ${temperature(input.cooling)}`}</span>;
}

function Readout({ id, input }) {
  return <dl className="foundation-instruments" aria-label="Bieżące dane modelu">{foundationReadout(id, input).map(([label, value]) =>
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

// Scientific anchors share one coordinate function; text never positions a line.
function FoundationSceneFrame({ id, snapshot, concealed = false, flowOffset = 0, onHeightChange }) {
  const { input, result, appearance } = snapshot;
  const arrowId = useId().replace(/:/g, "");
  const instructionsId = useId();
  const fogScale = value => 82 - (value / 35) * 64;
  return <>
    {(concealed || id === "chmura") && <div className="foundation-plot-heading">
      {id === "chmura" && <span className="foundation-axis-title">Wysokość nad ziemią</span>}
      {concealed && <span className="foundation-before">Stan A · przed zmianą</span>}
    </div>}
    <div className={`foundation-scene foundation-scene-${id} ${concealed ? "foundation-concealed" : ""}`}>
      <img className="foundation-landscape" src={id === "bryza" ? "./coast.webp" : "./valley.webp"} alt="" />
      {id === "bryza" ? <>
        <div className="foundation-night" style={{ opacity: appearance.night * 0.68 }} />
        <span className="foundation-celestial" aria-hidden="true"><Sun weight="fill" style={{ opacity: 1 - appearance.night }} /><Moon weight="fill" style={{ opacity: appearance.night }} /></span>
        {!concealed && <svg className="foundation-flow" viewBox="0 0 600 300" preserveAspectRatio="none" role="img" aria-label={`${directionLabel(result.direction)} przy powierzchni. ${result.direction === "calm" ? "Bez gałęzi powrotnej." : "Wyżej powrót w przeciwnym kierunku."}`}>
          <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth="2" /></marker></defs>
          <g style={{ opacity: appearance.flow }}>
            <path className="foundation-flow-track" d="M150 174 H450 C520 174 520 88 450 88 H150 C80 88 80 174 150 174Z" />
            <path className="foundation-flow-dots" style={{ strokeDashoffset: flowOffset }} d="M150 174 H450 C520 174 520 88 450 88 H150 C80 88 80 174 150 174Z" />
            <path className="foundation-flow-direction" d={result.direction === "onshore" ? "M270 174 H338" : "M338 174 H270"} markerEnd={`url(#${arrowId})`} />
            <path className="foundation-flow-direction" d={result.direction === "onshore" ? "M338 88 H270" : "M270 88 H338"} markerEnd={`url(#${arrowId})`} />
          </g>
        </svg>}
        {!concealed && result.direction !== "calm" && <span className="foundation-return">wyżej: powrót</span>}
        <span className="foundation-thermometer foundation-water"><small>Woda</small><strong>{temperature(result.water)}</strong><meter min={5} max={35} value={result.water} aria-label="Temperatura wody" /></span>
        <span className="foundation-thermometer foundation-land"><small>Ląd</small><strong>{temperature(result.land)}</strong><meter min={5} max={35} value={result.land} aria-label="Temperatura lądu" /></span>
      </> : id === "chmura" ? <>
        {[0, 1000, 2000, 3000].map(height => <React.Fragment key={height}>
          <span className="foundation-altitude" style={{ top: `${heightY(height)}%` }}>{height} m</span>
          <span className="foundation-gridline" style={{ top: `${heightY(height)}%` }} aria-hidden="true" />
        </React.Fragment>)}
        {!concealed && !result.aboveScene && <span className="foundation-condensation-line" style={{ top: `${heightY(result.base)}%` }} aria-hidden="true" />}
        <div className="foundation-parcel" style={{ top: `${heightY(input.height)}%` }} aria-hidden="true">
          <span className="foundation-parcel-ring" /><img src="./cloud.webp" alt="" style={{ opacity: appearance.opacity, transform: `scale(${appearance.scale})` }} />
          <span className="foundation-parcel-reading">{metres(input.height)}<br />{temperature(result.parcel)}</span>
        </div>
        {!concealed && onHeightChange && <ParcelControl value={input.height} position={heightY(input.height)} onChange={onHeightChange}
          sceneSelector=".foundation-scene" span={0.66} className="foundation-parcel-control" describedBy={instructionsId} />}
      </> : <>
        <Moon className="foundation-fog-moon" weight="fill" aria-hidden="true" />
        <img className="foundation-fog-layer" src="./fog.webp" alt="" style={{ opacity: appearance.opacity }} />
        <div className="foundation-fog-plot" aria-hidden="true">
          <span className="foundation-fog-axis" />
          {[0, 10, 20, 30].map(value => <span className="foundation-fog-tick" key={value} style={{ top: `${fogScale(value)}%` }}>{value}°</span>)}
          {!concealed && <span className="foundation-dew-marker" style={{ top: `${fogScale(result.initialDew)}%` }} />}
          <span className="foundation-current-marker" style={{ top: `${fogScale(result.current)}%` }}><strong>{temperature(result.current)}</strong></span>
        </div>
        <span className="foundation-fog-caption">Powietrze tuż nad gruntem</span>
      </>}
    </div>
    {id === "chmura" && <p className="foundation-scene-caption" id={instructionsId}>{onHeightChange && !concealed ?
      "Przeciągnij porcję powietrza w górę lub w dół. Pod sceną masz też suwak i przyciski." :
      "Kółko wskazuje porcję powietrza. Obok odczytasz jej wysokość i temperaturę."}</p>}
    {!concealed && <>
      <Readout id={id} input={input} />
      {id !== "bryza" && <p className="foundation-scene-key">{id === "chmura" ?
        result.aboveScene ? `Początek kondensacji: ${metres(result.base)}, ponad skalą. Nie przesuwamy go na jej krawędź.` : "Przerywana linia: początek kondensacji, nie wierzchołek chmury." :
        "Oliwkowy znacznik: początkowy punkt rosy. Fioletowa kropka: bieżąca temperatura. Mgiełka nie jest pomiarem widzialności."}</p>}
    </>}
  </>;
}

function FoundationScene({ id, input, reduced, concealed = false, frozen = false, onHeightChange }) {
  const { input: frame, flowOffset } = useSceneMotion(foundationWorkshops[id].scene, input, false, reduced || frozen);
  return <FoundationSceneFrame id={id} snapshot={foundationSnapshot(id, frame)} concealed={concealed} flowOffset={flowOffset} onHeightChange={onHeightChange} />;
}

const controlConfig = {
  hour: { label: "Pora dnia", step: 0.5, nudge: 1, icon: "hour", format: timeLabel },
  heating: { label: "Kontrast nagrzewania", step: 1, nudge: 10, icon: "heating", format: v => `${number(v, 0)}%` },
  height: { label: "Uniesienie powietrza", step: 10, nudge: 100, icon: "height", format: metres },
  humidity: { label: "Wilgotność początkowa", step: 1, nudge: 5, icon: "humidity", format: v => `${number(v, 0)}%` },
  temperature: { label: "Temperatura początkowa", step: 1, nudge: 1, icon: "temperature", format: temperature },
  cooling: { label: "Nocne ochłodzenie", step: 0.1, nudge: 0.5, icon: "cooling", format: temperature },
};
function FoundationControl({ id, name, input, onChange }) {
  const config = controlConfig[name], [min, max] = LIMITS[foundationWorkshops[id].scene][name];
  const fieldId = useId();
  return <Slider id={`foundation-${id}-${name}-${fieldId}`} label={config.label} icon={config.icon}
    min={min} max={max} step={config.step} nudge={config.nudge} value={input[name]}
    display={config.format(input[name])} ends={[config.format(min), config.format(max)]} onChange={onChange} />;
}

function Choices({ question, options, value, onChange }) {
  const group = useId();
  return <fieldset className="foundation-choices"><legend>{question}</legend>{options.map(option =>
    <label key={option.id}><input type="radio" name={group} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} /><span>{option.label}</span></label>)}</fieldset>;
}

function Comparison({ id, before, after, ordered = true }) {
  const a = foundationReadout(id, before), b = foundationReadout(id, after);
  return <div className="foundation-comparison"><h2>Porównaj A i B</h2>
    <table><caption>Te same obliczenia dla dwóch zapisanych zestawów warunków</caption><thead><tr><th scope="col">Odczyt</th><th scope="col">{ordered ? "A · przed" : "A"}</th><th scope="col">{ordered ? "B · po" : "B"}</th></tr></thead><tbody>
      {a.map(([label, value], index) => <tr key={label}><th scope="row">{label}</th><td>{value}</td><td>{b[index][1]}</td></tr>)}
    </tbody></table>
    <div className="foundation-comparison-inputs"><p><b>A:</b> <InputsLabel id={id} input={before} complete /></p><p><b>B:</b> <InputsLabel id={id} input={after} complete /></p></div>
  </div>;
}

function GuidedTrial({ id, state, dispatch, reduced, onExplore, onTransfer }) {
  const workshop = foundationWorkshops[id], trial = workshop.trials[state.index], attempt = foundationAttempt(state);
  const [prediction, setPrediction] = useState(null), [evidence, setEvidence] = useState(null), [helpOpen, setHelpOpen] = useState(false);
  const apparatus = useRef(null), decision = useRef(null);
  const phase = attempt.phase;
  const focus = ref => requestAnimationFrame(() => { ref.current?.focus({ preventScroll: true }); ref.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  const repeated = state.trials[state.index].length > 1;
  const first = state.trials[state.index][0];
  const predictionLabel = value => trial.choices.find(o => o.id === value)?.label;
  return <section className="foundation-guide" aria-label="Doświadczenie z przewodnikiem">
    <div className="foundation-brief"><p className="foundation-kicker">Próba {state.index + 1} z 3 · {repeated ? "powtórka z pomocą" : "z przewodnikiem"} · {({ predict: "1. Przewidź", action: "2. Wykonaj zmianę", evidence: "3. Odczytaj dowód", complete: "4. Porównaj" })[phase]}</p>
      <h1>{trial.title}</h1><p>{phase === "predict" ? trial.context : phase === "action" ? trial.observe : workshop.intro}</p>
    </div>
    <div className="foundation-bench">
      <section className="foundation-apparatus" ref={apparatus} tabIndex={-1} aria-label="Scena i bieżące dane">
        <div className="foundation-apparatus-heading"><InputsLabel id={id} input={attempt.input} /><span>Dane syntetyczne · nie prognoza</span></div>
        <FoundationScene id={id} input={attempt.input} concealed={phase === "predict"} reduced={reduced} frozen={phase === "evidence" || phase === "complete"}
          onHeightChange={id === "chmura" && phase === "action" && trial.key === "height" ? value => dispatch({ type: "change", value }) : undefined} />
        {phase === "predict" && <p className="foundation-scene-key">Wynik zmiany odsłonisz po zapisaniu przewidywania.</p>}
        {phase === "action" && <div className="foundation-action">
          <FoundationControl id={id} name={trial.key} input={attempt.input} onChange={value => dispatch({ type: "change", value })} />
          <div className="foundation-action-buttons"><button onClick={() => dispatch({ type: "change", value: trial.target })}>{trial.action}</button>
            <button className="foundation-primary" disabled={!foundationReady(state)} onClick={() => { dispatch({ type: "observe" }); focus(decision); }}>Zapisz obserwację <ArrowRight /></button></div>
          <p>Przycisk i suwak robią to samo. Ustawienie warunków nie kończy próby: po nim odczytasz dowód.</p>
        </div>}
      </section>
      <section className="foundation-decision" ref={decision} tabIndex={-1} aria-label="Przewidywanie i dowód">
        {phase === "predict" ? <>
          <Choices question={trial.question} options={trial.choices} value={prediction} onChange={setPrediction} />
          <button className="foundation-primary" disabled={!prediction} onClick={() => { dispatch({ type: "predict", value: prediction }); focus(apparatus); }}>Zapisz przewidywanie <ArrowRight /></button>
          {(state.helpSeen || repeated) && <p className="foundation-note">Ta próba korzysta z wcześniej odsłoniętej pomocy. Wcześniejsze odpowiedzi pozostają zapisane.</p>}
        </> : <>
          <p className="foundation-prediction">Zapisane przewidywanie: <strong>{predictionLabel(attempt.prediction)}</strong>. {attempt.predictionHelped ? "Z dodatkową pomocą." : "Przed dodatkową pomocą."}</p>
          {phase === "action" && <p>Wykonaj zmianę pod sceną, a potem zapisz obserwację. Przewidywania nie można już zmienić.</p>}
          {attempt.observed && <div className="foundation-recorded-data"><p>Zapisana obserwacja B</p><Readout id={id} input={attempt.observed} /></div>}
          {phase === "evidence" && <>
            <Choices question={trial.evidenceQuestion} options={trial.evidence} value={evidence} onChange={setEvidence} />
            <button className="foundation-primary" disabled={!evidence} onClick={() => { dispatch({ type: "evidence", value: evidence }); focus(decision); }}>Zapisz odczyt i porównaj <ArrowRight /></button>
          </>}
          {phase === "complete" && <div className="foundation-feedback" role="status">
            <h2>{attempt.evidence === trial.correctEvidence ? "Dane pasują do tego odczytu." : "Wróć do porównania danych."}</h2>
            <p>Przewidywanie: {attempt.prediction === trial.correct ? "zgodne z wynikiem" : "inne niż wynik"}. Odczyt dowodu: {attempt.evidence === trial.correctEvidence ? "poprawny" : "wymaga poprawy"}{attempt.evidenceHelped ? ", z dodatkową pomocą" : ", przed dodatkową pomocą"}.</p>
            <p>Twój odczyt: <strong>{trial.evidence.find(o => o.id === attempt.evidence)?.label}</strong>.</p>
            {attempt.evidence !== trial.correctEvidence && <p>Z danych wynika: <strong>{trial.evidence.find(o => o.id === trial.correctEvidence).label}</strong>.</p>}
            <p>{trial.explanation}</p><SourceLinks workshop={workshop} />
          </div>}
          <button className="foundation-text-button" aria-expanded={helpOpen} onClick={() => { dispatch({ type: "help" }); setHelpOpen(value => !value); }}>Jak czytać scenę i jakie ma ograniczenia?</button>
          {helpOpen && <aside className="foundation-help"><p>{workshop.explore}</p><p>{workshop.limits}</p><p>Pomoc po zapisaniu przewidywania oznacza pomoc przy późniejszym odczycie, nie zmienia wcześniejszej odpowiedzi.</p><SourceLinks workshop={workshop} /></aside>}
        </>}
      </section>
    </div>
    {phase === "complete" && <><Comparison id={id} before={trial.from} after={attempt.observed} /><p className="foundation-compare-note">{trial.comparison}</p>
      <div className="foundation-followthrough">{state.index < 2 ? <button className="foundation-primary" onClick={() => dispatch({ type: "next" }, true)}>Następna próba <ArrowRight /></button> : <>
        <p>{workshop.recap}</p><p>To koniec przewodnika, nie potwierdzenie opanowania tematu. Sprawdź zasadę na nowych danych.</p>
        <details className="foundation-first-results"><summary>Pierwsze odpowiedzi z trzech prób</summary>
          {workshop.trials.map((item, index) => {
            const record = state.trials[index][0];
            return <div key={item.id}><strong>{item.title}</strong>
              <p>Przewidywanie: {item.choices.find(option => option.id === record.prediction)?.label || "nie zapisano"}{record.predictionHelped ? " (z dodatkową pomocą)" : ""}.</p>
              <p>Odczyt: {item.evidence.find(option => option.id === record.evidence)?.label || "nie zapisano"}{record.evidenceHelped ? " (z dodatkową pomocą)" : ""}.</p>
            </div>;
          })}
        </details>
        <button className="foundation-primary" onClick={onTransfer}>Sprawdź się na nowych danych <ArrowRight /></button>
        <button className="foundation-text-button" onClick={onExplore}>Przejdź do swobodnej eksploracji</button>
      </>}</div>
    </>}
    {attempt.prediction && <div className="foundation-retry">
      <button className="foundation-text-button" onClick={() => dispatch({ type: "retry" }, true)}><ArrowCounterClockwise /> Powtórz tę próbę</button>
      {phase !== "predict" && repeated && <p>Pierwsze przewidywanie: {predictionLabel(first.prediction)}. {first.evidence ? `Pierwszy odczyt: ${trial.evidence.find(o => o.id === first.evidence)?.label}.` : "Pierwszego odczytu nie zapisano."} Powtórka nie zastępuje tego wyniku.</p>}
    </div>}
  </section>;
}

function FreeExploration({ id, reduced }) {
  const workshop = foundationWorkshops[id];
  const [input, setInput] = useState(() => ({ ...workshop.trials[0].from }));
  const [saved, setSaved] = useState([null, null]);
  return <section className="foundation-explore" aria-label="Swobodna eksploracja">
    <div className="foundation-brief"><p className="foundation-kicker">Swobodnie · bez oceny</p><h1>{workshop.title}</h1><p>{workshop.explore}</p></div>
    <div className="foundation-bench"><section className="foundation-apparatus" aria-label="Scena i bieżące dane">
      <div className="foundation-apparatus-heading"><InputsLabel id={id} input={input} /><span>Dane syntetyczne · nie prognoza</span></div>
      <FoundationScene id={id} input={input} reduced={reduced}
        onHeightChange={id === "chmura" ? value => setInput(old => cleanInputs(workshop.scene, { ...old, height: value })) : undefined} />
    </section><section className="foundation-free-controls" aria-label="Warunki doświadczenia">
      {Object.keys(LIMITS[workshop.scene]).map(name => <FoundationControl key={name} id={id} name={name} input={input} onChange={value => setInput(old => cleanInputs(workshop.scene, { ...old, [name]: value }))} />)}
      <div className="foundation-snapshot-actions">{["A", "B"].map((label, index) => <div key={label}>
        <button onClick={() => setSaved(old => old.map((value, position) => position === index ? { ...input } : value))}>Zapisz {label}</button>
        <button disabled={!saved[index]} onClick={() => setInput({ ...saved[index] })}>Odtwórz {label}</button>
      </div>)}</div><p className="foundation-note">Zapis A/B dotyczy dokładnych warunków, nie pośredniej klatki animacji. Pozostaje tutaj do wyjścia z eksploracji.</p>
    </section></div>
    {saved.every(Boolean) && <Comparison id={id} before={saved[0]} after={saved[1]} ordered={false} />}
    <details className="foundation-limits"><summary>Założenia i źródła</summary><p>{workshop.limits}</p><SourceLinks workshop={workshop} /></details>
  </section>;
}

function FoundationSession({ id, mainSite }) {
  const workshop = foundationWorkshops[id];
  const [state, setState] = useState(() => loadFoundationState(id));
  const current = useRef(state);
  const [durable, setDurable] = useState(true), [motionOff, setMotionOff] = useState(false);
  const mode = state.mode;
  const [reduced, setReduced] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const top = useRef(null);
  const lesson = returnLesson(typeof location === "undefined" ? "" : location.search, workshop.lesson);
  const scrollTop = () => requestAnimationFrame(() => { top.current?.focus({ preventScroll: true }); top.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  function dispatch(action, scroll = false) {
    const next = updateFoundation(current.current, action);
    if (next !== current.current) {
      // Persist the prediction synchronously before the action/evidence is mounted.
      setDurable(saveFoundationState(next)); current.current = next; setState(next);
    }
    if (scroll) scrollTop();
  }
  function navigate(next) {
    if (next === mode) return;
    if (mode === "transfer") markTransferHelp(id);
    if (next !== "guide") dispatch({ type: "help" });
    dispatch({ type: "mode", value: next }); scrollTop();
  }
  useEffect(() => {
    // An unfinished older transfer case must not silently receive guide help.
    if (current.current.mode !== "transfer") markTransferHelp(id);
    document.title = `${workshop.title} · Pracownia CHMURNIKA`;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, [workshop]);
  useEffect(() => {
    const help = event => {
      if (event?.type === "click" || event?.type === "auxclick") {
        if (event.defaultPrevented || (event.button !== undefined && event.button > 1) || !event.target?.closest?.(".foundation-topbar a")) return;
      }
      dispatch({ type: "help" });
    };
    window.addEventListener("hashchange", help, true);
    window.addEventListener("popstate", help, true);
    window.addEventListener("click", help, true);
    window.addEventListener("auxclick", help, true);
    return () => {
      window.removeEventListener("hashchange", help, true); window.removeEventListener("popstate", help, true);
      window.removeEventListener("click", help, true); window.removeEventListener("auxclick", help, true);
    };
  }, [id]);
  return <div className="foundation-workshop">
    <header className="foundation-topbar"><a href="#pracownia"><ArrowLeft /> Pracownia</a><span>{workshop.title}</span><a href={`${mainSite}#/learn/${lesson}`}><BookOpen /> Lekcja</a></header>
    <main ref={top} tabIndex={-1}>
      <nav className="foundation-modes" aria-label="Tryb pracowni">{[["guide", "Z przewodnikiem"], ["explore", "Swobodnie"], ["transfer", "Sprawdź się"]].map(([value, label]) =>
        <button key={value} aria-pressed={mode === value} onClick={() => navigate(value)}>{label}</button>)}</nav>
      {mode === "guide" ? <GuidedTrial key={`${state.index}-${state.trials[state.index].length}`} id={id} state={state} dispatch={dispatch} reduced={reduced || motionOff} onExplore={() => navigate("explore")} onTransfer={() => navigate("transfer")} /> :
        mode === "explore" ? <FreeExploration id={id} reduced={reduced || motionOff} /> : <TransferTrial key={id} activityId={id} />}
      <footer className="foundation-footer">
        {!durable && <p role="status">Trwały zapis jest niedostępny. Odpowiedzi pozostają tylko w otwartej stronie.</p>}
        <button aria-pressed={reduced || motionOff} disabled={reduced} onClick={() => setMotionOff(value => !value)}>{reduced ? "Ruch ograniczony przez system" : motionOff ? "Włącz płynne przejścia" : "Wyłącz płynne przejścia"}</button>
        <p>Schemat edukacyjny na fikcyjnych danych. Nie prognoza ani ocena warunków lotu lub żeglugi. Pierwsze odpowiedzi przewodnika zapisujemy lokalnie, bez wysyłania danych.</p>
      </footer>
    </main>
  </div>;
}

export function FoundationWorkshop({ id, mainSite }) {
  if (!Object.hasOwn(foundationWorkshops, id)) return <p>Nieznana pracownia. <a href="#pracownia">Wróć do katalogu</a>.</p>;
  // The route owner need not remember a React key when switching foundations.
  return <FoundationSession key={id} id={id} mainSite={mainSite} />;
}
