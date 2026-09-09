import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowsVertical, ArrowCounterClockwise, BookOpen, Sun } from "@phosphor-icons/react";
import { TransferTrial } from "./TransferTrial.jsx";
import { Slider } from "../Slider.jsx";
import { markTransferHelp } from "./transfer-state.mjs";
import { returnLesson } from "../tutorial.mjs";
import {
  turbulenceTrials, turbulenceSources, turbulenceTrial, initialTurbulenceInputs, readyToPredict,
  mechanicalTrace, thermalDrawing, windVector, layerDifference, windFromPointer,
  createTurbulenceStore, activeTurbulenceAttempt,
} from "./turbulence-workshop.mjs";
import "./turbulence-workshop.css";

const heatNames = ["bez dodatkowego ogrzewania", "niewielkie ogrzewanie", "większe ogrzewanie", "największe w tym porównaniu"];
const number = value => value.toFixed(1).replace(".", ",");
const pathFor = points => points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
const labelFor = (options, value) => options.find(([id]) => id === value)?.[1];
function focusOn(ref) {
  requestAnimationFrame(() => { ref.current?.focus({ preventScroll: true }); ref.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); });
}

function FlowPath({ path, marker, paused, sample }) {
  return <>
    <path d={path} className="turb-flow" markerEnd={`url(#${marker})`} />
    <circle r="1.4" className="turb-tracer" cx={paused ? sample.x : 0} cy={paused ? sample.y : 0}>
      {!paused && <animateMotion dur="8s" repeatCount="indefinite" path={path} />}
    </circle>
  </>;
}

export function TurbulenceScene({ trialId, inputs, onInputs, locked = false, revealed = false, explore = false, paused = true }) {
  const scene = useRef(null), dial = useRef(null), drag = useRef(null);
  const marker = `turb-arrow-${useId().replace(/:/g, "")}`;
  const heat = thermalDrawing(inputs.heat, inputs.side);
  const vector = windVector(inputs.upperSpeed, inputs.upperFrom);
  function begin(event, kind) {
    if (locked || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, y: event.clientY, inputs: { ...inputs }, kind };
  }
  function move(event) {
    const start = drag.current;
    if (locked || !start || start.id !== event.pointerId) return;
    if (start.kind === "terrain") {
      const height = scene.current.getBoundingClientRect().height;
      if (height > 0) onInputs({ roughness: Math.round(Math.max(0, Math.min(100, start.inputs.roughness + (start.y - event.clientY) / (height * .24) * 100))) });
    } else {
      const next = windFromPointer(event.clientX, event.clientY, dial.current.getBoundingClientRect(), !explore);
      if (next) onInputs(next);
    }
  }
  function end(event, cancel = false) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    if (cancel && !locked) onInputs(drag.current.inputs);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function terrainKey(event) {
    if (locked) return;
    const amount = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10, PageUp: 25, PageDown: -25 }[event.key];
    if (amount === undefined && !["Home", "End"].includes(event.key)) return;
    event.preventDefault(); onInputs({ roughness: event.key === "Home" ? 0 : event.key === "End" ? 100 : Math.max(0, Math.min(100, inputs.roughness + amount)) });
  }
  function windKey(event) {
    if (locked) return;
    const amount = { ArrowUp: 15, ArrowRight: 15, ArrowDown: -15, ArrowLeft: -15 }[event.key];
    if (amount === undefined && !["Home", "End"].includes(event.key)) return;
    event.preventDefault(); onInputs({ upperFrom: event.key === "Home" ? 0 : event.key === "End" ? 345 : (inputs.upperFrom + amount + 360) % 360 });
  }
  const bindings = kind => ({ onPointerDown: event => begin(event, kind), onPointerMove: move, onPointerUp: event => end(event), onPointerCancel: event => end(event, true), onLostPointerCapture: () => { drag.current = null; } });
  const defs = <defs><marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7442d9" /></marker></defs>;
  return <div className="turb-apparatus">
    <div className="turb-apparatus-label"><span>{revealed ? "Porównanie A / B" : "Warunki przed próbą"}</span><span>Schemat, nie prognoza</span></div>
    {trialId === "shear" ? <div className="turb-vectors">
      {[false, true].map(upper => {
        const wind = upper ? vector : windVector(10, 270), speed = upper ? inputs.upperSpeed : 10, from = upper ? inputs.upperFrom : 270;
        return <div className="turb-layer" key={String(upper)}>
          <strong>{upper ? "Góra: 600 m" : "Dół: 200 m"}</strong>
          <div className="turb-dial" ref={upper ? dial : undefined}>
            <svg viewBox="0 0 100 100" aria-hidden="true">{upper && defs}
              <circle cx="50" cy="50" r="38" className="turb-ring" /><path d="M 50 10 V 90 M 10 50 H 90" className="turb-grid" />
              <text x="50" y="8" textAnchor="middle">N</text><text x="93" y="53">E</text>
              <line x1="50" y1="50" x2={50 + wind.east * 1.2} y2={50 - wind.north * 1.2} className="turb-flow" markerEnd={`url(#${marker})`} />
              <circle cx="50" cy="50" r="2" className="turb-origin" />
            </svg>
            {upper && <button type="button" className="turb-vector-handle" role="slider" aria-label="Kierunek górnego wiatru, skąd wieje" aria-valuemin={0} aria-valuemax={345} aria-valuenow={inputs.upperFrom % 360} aria-valuetext={`${inputs.upperFrom % 360} stopni, ${inputs.upperSpeed} węzłów`} disabled={locked}
              style={{ left: `${50 + vector.east * 1.2}%`, top: `${50 - vector.north * 1.2}%` }} onKeyDown={windKey} {...bindings("wind")}><ArrowCounterClockwise aria-hidden="true" /></button>}
          </div>
          <span>{speed} kt {speed ? `z ${from % 360}°` : "(cisza)"}</span>
        </div>;
      })}
    </div> : <div className="turb-landscape" ref={scene}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{defs}
        <path d="M 0 80 H 100 V 100 H 0 Z" className="turb-ground" />
        {trialId === "terrain" ? <>
          <path d={`M 17 80 Q 24 80 29 ${80 - inputs.roughness * .24} Q 33 ${73 - inputs.roughness * .24} 37 ${80 - inputs.roughness * .24} Q 43 80 49 80 Z`} className="turb-hill" opacity={inputs.roughness / 100} />
          {revealed && [0, 1, 2].map(lane => <React.Fragment key={lane}>
            <path d={pathFor(mechanicalTrace(0, lane))} className="turb-reference" />
            <FlowPath path={pathFor(mechanicalTrace(inputs.roughness, lane))} marker={marker} paused={paused} sample={mechanicalTrace(inputs.roughness, lane)[55]} />
          </React.Fragment>)}
        </> : <>
          {[28, 72].map(x => <rect key={x} x={x - 18} y="80" width="36" height="20" className="turb-heat-patch" style={{ opacity: x === heat.x ? .15 + heat.amount * .7 : .1 }} />)}
          {revealed && heat.amount > 0 && <>
            <FlowPath path={heat.up} marker={marker} paused={paused} sample={{ x: heat.x, y: (72 + heat.top) / 2 }} />
            <FlowPath path={heat.down} marker={marker} paused={paused} sample={{ x: heat.neighbor, y: (72 + heat.top) / 2 }} />
            <path d={`M ${heat.x} ${heat.top} Q 50 ${heat.top - 6} ${heat.neighbor} ${heat.top}`} className="turb-reference" />
          </>}
        </>}
      </svg>
      <span className="turb-scene-caption">{trialId === "terrain" ? "Wiatr z lewej, bez zmiany ogrzewania" : "Płaskie podłoże, ogrzewany jeden skrawek"}</span>
      {!revealed && <span className="turb-concealed">Przepływ pokażemy po zapisaniu przewidywania.</span>}
      {trialId === "terrain" ? <button className="turb-terrain-handle" type="button" role="slider" aria-label="Wysunięcie przeszkody, skala umowna" aria-valuemin={0} aria-valuemax={100} aria-valuenow={inputs.roughness} disabled={locked}
        style={{ top: `${80 - inputs.roughness * .24}%` }} onKeyDown={terrainKey} {...bindings("terrain")}><ArrowsVertical aria-hidden="true" /><span>Podłoże</span></button>
        : ["left", "right"].map(side => <button key={side} type="button" className="turb-sun" aria-label={`Ogrzej ${side === "left" ? "lewy" : "prawy"} skrawek`} aria-pressed={inputs.side === side && inputs.heat > 0} disabled={locked || (!explore && side === "right")}
          style={{ left: side === "left" ? "28%" : "72%" }} onClick={() => onInputs({ side, heat: side === inputs.side ? (inputs.heat + 1) % 4 : 1 })}><Sun aria-hidden="true" /><span>{side === inputs.side ? inputs.heat : 0}</span></button>)}
    </div>}
    <div className="turb-readout" aria-live="polite">
      {trialId === "terrain" && <p>A: gładkie podłoże. B: {inputs.roughness ? "wysunięta przeszkoda" : "również gładkie podłoże"}. Dopływ powietrza ten sam.</p>}
      {trialId === "thermal" && <p>Poletko {inputs.side === "left" ? "lewe" : "prawe"}: {heatNames[inputs.heat]}. Otoczenie: bez dodatkowego ogrzewania. Cyfry 0–3 to ustawienia, nie temperatura.</p>}
      {trialId === "shear" && <p>Widok z góry na dwa poziomy. Strzałka pokazuje <strong>dokąd</strong> płynie powietrze; kąt „z” oznacza <strong>skąd</strong> wieje. 1 kt to 1 węzeł.</p>}
      {revealed && <p className="turb-observation" data-testid="observation">
        {trialId === "terrain" ? inputs.roughness > 0 ? "B: odchylenie nad przeszkodą i zawirowania po prawej, za nią. Szare linie A pozostają odniesieniem." : "A i B mają to samo podłoże. W tym porównaniu nie dodaliśmy przeszkody." :
          trialId === "thermal" ? inputs.heat > 0 ? "B: prąd w górę nad ogrzewanym skrawkiem, obok w dół. A: bez dodatkowego ogrzewania nie dodajemy tej cyrkulacji." : "Ustawienie A: bez dodatkowego ogrzewania. Nie oznacza to braku wszystkich innych ruchów powietrza." :
            `A: wiatr jednakowy na obu poziomach. B: różnica wektorów ${number(layerDifference(inputs.upperSpeed, inputs.upperFrom).magnitude)} kt. ${layerDifference(inputs.upperSpeed, inputs.upperFrom).magnitude < .001 ? "Wektory są jednakowe." : "Wektory nie są jednakowe."}`}
      </p>}
    </div>
    <div className="turb-controls">
      {trialId === "terrain" && <><div className="turb-tap-row"><button disabled={locked} onClick={() => onInputs({ roughness: 0 })}>Wygładź podłoże</button><button disabled={locked} onClick={() => onInputs({ roughness: 65 })}>Wysuń przeszkodę</button></div>
        <Slider id="turb-terrain" icon="terrain" label="Wysunięcie przeszkody (skala umowna)" min={0} max={100} step={1} nudge={5} value={inputs.roughness} display={`${inputs.roughness}/100`} disabled={locked} onChange={roughness => onInputs({roughness})} /></>}
      {trialId === "thermal" && <div className="turb-tap-row"><button disabled={locked} onClick={() => onInputs({ heat: 0 })}>Wyłącz ogrzewanie</button><button disabled={locked} onClick={() => onInputs({ heat: (inputs.heat + 1) % 4 })}>Zmień ogrzewanie poletka</button></div>}
      {trialId === "shear" && <><div className="turb-tap-row"><button disabled={locked} onClick={() => onInputs({ upperFrom: 270, upperSpeed: 10 })}>Tak samo jak na dole</button><button disabled={locked} onClick={() => onInputs({ upperFrom: 0 })}>Wiatr górą z północy</button></div>
        <Slider id="turb-direction" icon="wind" label="Kierunek wiatru górą" min={0} max={345} step={15} value={inputs.upperFrom % 360} display={`z ${inputs.upperFrom % 360}°`} disabled={locked} onChange={upperFrom => onInputs({upperFrom})} />
        {explore && <Slider id="turb-speed" icon="wind" label="Prędkość wiatru górą" min={0} max={30} step={5} value={inputs.upperSpeed} display={`${inputs.upperSpeed} kt`} onChange={upperSpeed => onInputs({upperSpeed})} />}</>}
    </div>
    <p className="turb-scale">{trialId === "shear" ? "Długości strzałek mają wspólną skalę prędkości. Nie są to prędkości animacji." : "Tory i ruch znaczników są umowne: nie pokazują realnej prędkości, odległości ani upływu czasu."}</p>
  </div>;
}

export function TurbulenceWorkshop({ mainSite }) {
  const [store] = useState(() => { try { return createTurbulenceStore(window.localStorage); } catch { return createTurbulenceStore(null); } });
  const [state, setState] = useState(() => store.load()), [mode, setMode] = useState("guide");
  const [prediction, setPrediction] = useState(null), [evidence, setEvidence] = useState(null), [hint, setHint] = useState(false);
  const [freeTrial, setFreeTrial] = useState("terrain"), [freeInputs, setFreeInputs] = useState(initialTurbulenceInputs);
  const [paused, setPaused] = useState(false), [reduced, setReduced] = useState(true), [hidden, setHidden] = useState(false);
  const [lesson, setLesson] = useState("zagrozenia");
  const bench = useRef(null), feedback = useRef(null);
  const active = activeTurbulenceAttempt(state), trial = turbulenceTrial(mode === "explore" ? freeTrial : state.trialId);
  const index = turbulenceTrials.findIndex(item => item.id === state.trialId);
  function dispatch(action) { setState(store.apply(action, state)); }
  function help(all = false) {
    if (mode === "assessment") markTransferHelp("turbulencja");
    else if (all) {
      let updated;
      for (const item of turbulenceTrials) updated = store.apply({ type: "help", trialId: item.id });
      setState(updated);
    } else setState(store.apply({ type: "help", trialId: mode === "explore" ? freeTrial : state.trialId }));
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches), visibility = () => setHidden(document.hidden);
    motion(); visibility(); setLesson(returnLesson(window.location.search, "zagrozenia"));
    media.addEventListener("change", motion); document.addEventListener("visibilitychange", visibility);
    return () => { media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    const navigation = () => help(), capture = { capture: true };
    const follow = event => { if (!event.defaultPrevented && event.button <= 1 && event.target?.closest?.("a[href]") && !event.target.closest(".transfer-trial")) navigation(); };
    window.addEventListener("hashchange", navigation, capture); window.addEventListener("popstate", navigation, capture);
    window.addEventListener("click", follow, capture); window.addEventListener("auxclick", follow, capture);
    return () => {
      window.removeEventListener("hashchange", navigation, capture); window.removeEventListener("popstate", navigation, capture);
      window.removeEventListener("click", follow, capture); window.removeEventListener("auxclick", follow, capture);
    };
  }, [mode, state.trialId, freeTrial]);
  function chooseMode(next) {
    if (next === mode) return;
    if (mode === "assessment") markTransferHelp("turbulencja");
    if (next === "explore") setState(store.apply({ type: "help", trialId: freeTrial }));
    setMode(next); setHint(false); focusOn(bench);
  }
  function chooseTrial(id, repeat = false) {
    setPrediction(null); setEvidence(null); setHint(false);
    if (mode === "explore") { setFreeTrial(id); setFreeInputs(initialTurbulenceInputs()); setState(store.apply({ type: "help", trialId: id })); }
    else dispatch({ type: "select", trialId: id, repeat });
    focusOn(bench);
  }
  const lessonLink = `${mainSite}#/learn/${lesson}`;
  return <div className="turb-workshop">
    <header className="turb-topbar"><a href="#pracownia"><ArrowLeft /> Pracownia</a><span>TURBULENCJA</span><a href={lessonLink}><BookOpen /> Lekcja</a></header>
    <main>
      <div className="turb-modes" role="group" aria-label="Sposób pracy">{[["guide", "Prowadź mnie"], ["explore", "Eksperymentuj"], ["assessment", "Sprawdź się"]].map(([id, label]) => <button key={id} aria-pressed={mode === id} onClick={() => chooseMode(id)}>{label}</button>)}</div>
      {mode === "assessment" ? <div ref={bench} tabIndex={-1} className="turb-assessment"><TransferTrial activityId="turbulencja" key="turbulencja" /></div> : <>
        <nav className="turb-stages" aria-label="Trzy doświadczenia">{turbulenceTrials.map((item, i) => <button key={item.id} aria-current={trial.id === item.id ? "step" : undefined} onClick={() => chooseTrial(item.id)}><span>{i + 1}</span>{item.short}</button>)}</nav>
        <div className="turb-brief"><p>{mode === "explore" ? "Swobodne porównanie, bez nowej oceny" : `Doświadczenie ${index + 1} z 3`}</p><h1>{trial.title}</h1><p>{trial.setup}</p></div>
        <div className="turb-bench" ref={bench} tabIndex={-1}>
          <TurbulenceScene trialId={trial.id} inputs={mode === "explore" ? freeInputs : state.inputs} onInputs={value => mode === "explore" ? setFreeInputs(old => ({ ...old, ...value })) : dispatch({ type: "inputs", value })}
            locked={mode === "guide" && Boolean(active)} revealed={mode === "explore" || Boolean(active?.observed)} explore={mode === "explore"} paused={paused || reduced || hidden} />
          <section className="turb-decision" aria-label="Bieżący krok">
            {mode === "explore" ? <><h2>Zmień jedną przyczynę</h2><p>{trial.id === "terrain" ? "Wysuwaj i chowaj przeszkodę. Porównaj tory przed nią i za nią; dopływ pozostaje taki sam." : trial.id === "thermal" ? "Ogrzej lewe, potem prawe poletko. Sprawdź, czy miejsce unoszenia podąża za źródłem ciepła." : "Najpierw ustaw jednakowy wiatr. Potem zmień tylko prędkość, a następnie tylko kierunek górnej warstwy. Porównaj różnice wektorów."}</p><p>{trial.explanation}</p><p>{trial.limit}</p></> : <>
              {!active ? <>
                <h2>1. Ustaw i przewidź</h2><p>{trial.action}</p>
                <fieldset className="turb-choices"><legend>{trial.question}</legend>{trial.predictions.map(([id, label]) => <label key={id}><input type="radio" name="turb-prediction" value={id} checked={prediction === id} onChange={() => setPrediction(id)} />{label}</label>)}</fieldset>
                <button className="turb-primary" disabled={!prediction || !readyToPredict(trial.id, state.inputs)} onClick={() => { dispatch({ type: "predict", value: prediction, id: crypto.randomUUID() }); focusOn(bench); }}>Zapisz przewidywanie <ArrowRight /></button>
                <p className="turb-note">{readyToPredict(trial.id, state.inputs) ? "Zapis zablokuje przewidywanie i warunki tej próby." : "Najpierw wykonaj zmianę wskazaną nad odpowiedziami."}</p>
              </> : <>
                <p className="turb-record"><strong>{active.repeated ? "Powtórka" : "Pierwsze przewidywanie"}{active.predictionHelped ? " z pomocą" : ": bez dodatkowej pomocy"}</strong><span>{labelFor(trial.predictions, active.prediction)}</span>Warunki i ten wybór są zapisane. To przewodnik, nie niezależny sprawdzian. Nie można zmienić tego zapisu.</p>
                {!active.observed ? <><h2>2. Porównaj wynik</h2><p>Odsłoń przepływ i porównaj zmienione warunki B z odniesieniem A.</p><button className="turb-primary" onClick={() => { dispatch({ type: "observe" }); focusOn(bench); }}>Porównaj A i B <ArrowRight /></button></> : !active.evidence ? <>
                  <h2>3. Wskaż dowód</h2><fieldset className="turb-choices"><legend>{trial.evidenceQuestion}</legend>{trial.evidence.map(([id, label]) => <label key={id}><input type="radio" name="turb-evidence" value={id} checked={evidence === id} onChange={() => setEvidence(id)} />{label}</label>)}</fieldset>
                  <button className="turb-primary" disabled={!evidence} onClick={() => { dispatch({ type: "evidence", value: evidence }); focusOn(feedback); }}>Zapisz dowód <ArrowRight /></button>
                </> : <div className="turb-feedback" ref={feedback} tabIndex={-1}>
                  <h2>Co pokazało porównanie?</h2><p><strong>{active.prediction === trial.correctPrediction ? "Przewidywanie zgodne z porównaniem." : "Porównanie nie potwierdziło Twojego przewidywania."}</strong></p>
                  <p>{active.evidence === trial.correctEvidence ? "Wybrany dowód pasuje." : `W tym porównaniu rozstrzyga: ${labelFor(trial.evidence, trial.correctEvidence)}`}</p><p>{trial.explanation}</p><p>{trial.limit}</p>
                  <p className="turb-note">Dowód: {active.evidenceHelped ? "z pomocą" : "bez dodatkowej pomocy"}. {active.evidenceHelped && !active.predictionHelped ? "Wcześniejsze przewidywanie zapisane bez pomocy zachowuje swój status." : "Przewidywanie i dowód są osobnymi zapisami."}</p>
                  <button className="turb-primary" onClick={() => index < 2 ? chooseTrial(turbulenceTrials[index + 1].id) : chooseMode("assessment")}>{index < 2 ? "Następne doświadczenie" : "Zastosuj zasadę w nowych danych"}<ArrowRight /></button>
                  <button className="turb-help" onClick={() => chooseTrial(trial.id, true)}>Powtórz to doświadczenie</button>
                </div>}
              </>}
              {!active?.evidence && <><button className="turb-help" onClick={() => { help(); setHint(true); }}>Podpowiedź do porównania</button>{hint && <aside role="status">{trial.hint} Dalszy wybór oznaczymy jako wspomagany.</aside>}</>}
            </>}
          </section>
        </div>
        <div className="turb-underbench"><button aria-pressed={paused || reduced} disabled={reduced} onClick={() => setPaused(value => !value)}>{reduced ? "Ruch ograniczony: wszystkie wyniki widoczne" : paused ? "Włącz umowny ruch znaczników" : "Zatrzymaj umowny ruch znaczników"}</button>
          <a href={turbulenceSources[trial.source].url} target="_blank" rel="noreferrer">Źródło tego doświadczenia</a></div>
        {(mode === "explore" || active?.evidence) && <details className="turb-recap" onToggle={event => { if (event.currentTarget.open) help(true); }}><summary>Podsumowanie i pierwsze zapisy</summary><ul>
          <li>Przeszkoda zmienia przepływ: szukaj różnicy po jej zawietrznej stronie.</li><li>Ogrzewanie od dołu może wywołać unoszenie bez przeszkody i bez widocznej chmury.</li><li>Porównuj prędkość oraz kierunek wiatru na obu poziomach.</li><li>Żaden z tych schematów nie określa intensywności turbulencji ani bezpieczeństwa lotu.</li>
        </ul>{turbulenceTrials.map(item => {
          const first = state.attempts.find(attempt => attempt.trialId === item.id);
          return <p key={item.id}><strong>{item.short}:</strong> {first ? `pierwszy wybór: „${labelFor(item.predictions, first.prediction)}”; ${first.predictionHelped ? "z pomocą" : "samodzielny"}. Dowód: ${first.evidence ? `„${labelFor(item.evidence, first.evidence)}”${first.evidenceHelped ? " z pomocą" : " bez dodatkowej pomocy"}` : "jeszcze niezapisany"}.` : "Brak zapisanego przewidywania."}</p>;
        })}</details>}
      </>}
      {!store.durable && <p role="status" className="turb-storage">Zapis jest dostępny tylko w tej karcie. Przeglądarka nie zapisała go na później.</p>}
      <footer className="turb-footer"><p>Trzy wyizolowane mechanizmy. W atmosferze mogą działać razem. To materiał szkoleniowy, nie prognoza ani ocena przygotowania do lotu.</p>
        <details onToggle={event => { if (event.currentTarget.open) help(true); }}><summary>Źródła i ograniczenia</summary><p>Geometria terenu, ogrzewanie i tory są ilustracyjne. Liczby przy dwóch warstwach to zadane wiatry, nie bieżące pomiary. Nie wyznaczamy intensywności turbulencji, ruchu samolotu ani stref bezpiecznych.</p><ul>{turbulenceSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></details>
        <a href={lessonLink}><BookOpen /> Wróć do pełnej lekcji</a></footer>
    </main>
  </div>;
}
