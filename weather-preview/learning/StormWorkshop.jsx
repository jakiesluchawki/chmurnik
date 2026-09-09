import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowsVertical, Minus, Plus, ArrowCounterClockwise, BookOpen } from "@phosphor-icons/react";
import { stormTrials, stormProfiles, stormParcel, initialResponse, inTrialWindow, appendStormAttempt, recordStormEvidence, illustrativeProgress } from "./storm-model.mjs";
import { returnLesson } from "../tutorial.mjs";
import "./storm-workshop.css";

const STORAGE = "chmurnik-storm-workshop-v1";
const y = height => 84 - height / 5000 * 70;
const temperature = value => `${value.toFixed(1).replace(".", ",")}°C`;
const directions = { up: "Zacznie się unosić", down: "Zacznie opadać", still: "Bez tendencji w którąś stronę" };
const relations = { up: "Była cieplejsza", down: "Była chłodniejsza", still: "Temperatury były zbliżone" };
function loadHistory() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    return Array.isArray(records) ? records.filter(r => r && stormTrials.some(t => t.id === r.trial) && directions[r.prediction] && [r.height, r.temperature, r.environment].every(Number.isFinite)) : [];
  } catch { return []; }
}

function ParcelScene({ trial, height, setHeight, locked, prediction, released, reduced }) {
  const scene = useRef(null), drag = useRef(null);
  const data = stormParcel(trial.profile, trial.humidity, height);
  const change = value => setHeight(Math.max(0, Math.min(5000, Math.round(value / 10) * 10)));
  function pointerDown(event) {
    if (locked || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, y: event.clientY, height };
  }
  function pointerMove(event) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    change(drag.current.height + (drag.current.y - event.clientY) / (scene.current.clientHeight * 0.7) * 5000);
  }
  function pointerEnd(event, cancel = false) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    if (cancel) change(drag.current.height);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyDown(event) {
    const delta = { ArrowUp: 100, ArrowRight: 100, ArrowDown: -100, ArrowLeft: -100, PageUp: 500, PageDown: -500 }[event.key];
    if (delta === undefined && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    change(event.key === "Home" ? 0 : event.key === "End" ? 5000 : height + delta);
  }
  return <div className="storm-scene-wrap">
    <div className="storm-scene" ref={scene} aria-label="Porównanie porcji powietrza i temperatury otoczenia na tej samej wysokości">
      <img className="storm-landscape" src="./valley.webp" alt="" />
      <svg className="storm-plot" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1000, 2000, 3000, 4000, 5000].map(h => <line key={h} x1="65" x2="560" y1={y(h) * 4} y2={y(h) * 4} className="storm-gridline" />)}
        {trial.profile === "cap" && <rect x="65" y={y(1200) * 4} width="495" height={(y(800) - y(1200)) * 4} className="storm-inversion" />}
        <rect x="165" width="120" y={y(trial.target + 100) * 4} height={(y(trial.target - 100) - y(trial.target + 100)) * 4} className="storm-target-band" />
        <line x1="65" x2="560" y1={y(data.base) * 4} y2={y(data.base) * 4} className="storm-condensation-line" />
        <polyline points={stormProfiles[trial.profile].map(([h, t]) => `${440 + t * 2},${y(h) * 4}`).join(" ")} className="storm-profile-line" />
        <line x1="235" x2={440 + data.environment * 2} y1={y(height) * 4} y2={y(height) * 4} className="storm-comparison-line" />
        <circle cx={440 + data.environment * 2} cy={y(height) * 4} r="6" className="storm-environment-dot" />
      </svg>
      <span className="storm-scene-label">Wysokość nad ziemią</span>
      <span className="storm-profile-label">Temperatura<br />otoczenia</span>
      {[0, 1000, 2000, 3000, 4000, 5000].map(h => <span className="storm-altitude" key={h} style={{ top: `${y(h)}%` }}>{h === 0 ? "0 m" : `${h / 1000} km`}</span>)}
      <button className="storm-parcel" type="button" role="slider" aria-label="Wysokość porcji powietrza" aria-valuemin={0} aria-valuemax={5000} aria-valuenow={Math.round(height)} aria-valuetext={`${Math.round(height)} metrów, porcja ${temperature(data.temperature)}, otoczenie ${temperature(data.environment)}`} aria-orientation="vertical" disabled={locked}
        style={{ top: `${y(height)}%` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={keyDown}>
        <span className="storm-parcel-ring" /><img src="./cloud.webp" alt="" style={{ opacity: data.opacity }} />
        {!locked && <ArrowsVertical className="storm-drag-hint" aria-hidden="true" />}
        <span className="storm-parcel-height">{Math.round(height)} m</span>
        {released && prediction !== "still" && (prediction === "up" ? <ArrowUp className="storm-response-arrow" /> : <ArrowDown className="storm-response-arrow" />)}
      </button>
      <span className="storm-scene-footnote">Porcja powietrza, nie cała chmura</span>
    </div>
    <div className="storm-instruments" aria-label="Bieżące temperatury na tej samej wysokości">
      <div><span>Porcja</span><strong>{temperature(data.temperature)}</strong></div><span className="storm-instrument-link">na {Math.round(height)} m</span><div><span>Otoczenie</span><strong>{temperature(data.environment)}</strong></div>
    </div>
    <p className="storm-scene-key">Przerywana linia: kondensacja około {Math.round(data.base / 10) * 10} m. {trial.profile === "cap" ? "Różowy pas: cieplejsza warstwa (inwersja)." : "Oliwkowa linia łączy temperatury otoczenia."}</p>
    {!locked && <div className="storm-lift-controls"><button aria-label="Opuść porcję o 100 metrów" onClick={() => change(height - 100)} disabled={height <= 0}><Minus />100 m</button><button className="storm-target-button" onClick={() => change(trial.target)}>Unieś na {trial.target} m</button><button aria-label="Unieś porcję o 100 metrów" onClick={() => change(height + 100)} disabled={height >= 5000}><Plus />100 m</button></div>}
    {released && <p className="storm-motion-note">Strzałka pokazuje początkową tendencję. {reduced ? "Animacja ruchu jest wyłączona. " : "Przesunięcie jest umowne. "}Nie wyliczamy prędkości ani dalszego toru porcji.</p>}
  </div>;
}

function TrialSession({ trial, onRecord, onEvidence, onNext, previous, helped, onHelp, reduced, sessionNumber }) {
  const [height, setHeight] = useState(0), [prediction, setPrediction] = useState(null);
  const [release, setRelease] = useState(null), [evidence, setEvidence] = useState(null), [checked, setChecked] = useState(false);
  const [running, setRunning] = useState(false);
  const feedback = useRef(null), animation = useRef(null), apparatus = useRef(null);
  const attemptId = useRef(crypto.randomUUID());
  const ready = inTrialWindow(trial, height);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  function run() {
    if (!ready || !prediction || release) return;
    const result = initialResponse(trial.profile, trial.humidity, height);
    setRelease(result);
    apparatus.current?.scrollIntoView({ block: "start", behavior: "instant" });
    onRecord({ id: attemptId.current, trial: trial.id, prediction, height, correct: prediction === result.tendency, helped: helped || trial.guide, temperature: result.temperature, environment: result.environment, session: sessionNumber });
    if (reduced) { setHeight(result.end); return; }
    setRunning(true);
    const start = performance.now();
    function frame(now) {
      const fraction = Math.min(1, (now - start) / 1100);
      setHeight(result.height + (result.end - result.height) * illustrativeProgress(fraction));
      if (fraction < 1) animation.current = requestAnimationFrame(frame);
      else setRunning(false);
    }
    animation.current = requestAnimationFrame(frame);
  }
  function explain() { setChecked(true); onEvidence(attemptId.current, evidence, evidence === release.tendency); requestAnimationFrame(() => feedback.current?.focus()); }
  const correctEvidence = release && evidence === release.tendency;
  return <>
    <div className="storm-brief"><div className="storm-step-label">{trial.name} · {trial.guide ? "z przewodnikiem" : "samodzielnie"}</div><h1>{trial.title}</h1><p>{trial.instruction}</p></div>
    <div className="storm-bench">
      <section className="storm-apparatus" ref={apparatus} aria-label="Stanowisko do unoszenia powietrza"><div className="storm-apparatus-header"><span>Przy ziemi: 26°C · wilgotność {trial.humidity}%</span><span>Profil {trial.profile === "cap" ? "A" : trial.profile === "open" ? "B" : "C"}</span></div>
        <ParcelScene trial={trial} height={height} setHeight={value => { setHeight(value); setPrediction(null); }} locked={Boolean(release)} prediction={release?.tendency} released={Boolean(release) && !running} reduced={reduced} />
      </section>
      <section className="storm-decision" aria-label="Przewidywanie i wyjaśnienie">
        {!release ? <><div className="storm-step-label">1. Przewidź</div><h2>Co się stanie, gdy przestaniesz podnosić?</h2><p>Trzymasz porcję w spoczynku. Teraz puścisz ją na wybranej wysokości.</p>
          <fieldset className="storm-choices"><legend>Moje przewidywanie</legend>{["up", "still", "down"].map(value => <button type="button" aria-pressed={prediction === value} key={value} onClick={() => setPrediction(value)}>{value === "up" ? <ArrowUp /> : value === "down" ? <ArrowDown /> : <Minus />}{directions[value]}</button>)}</fieldset>
          <button className="storm-primary" disabled={!ready || !prediction} onClick={run}>Puść porcję <ArrowRight /></button><p className="storm-inline-hint">{!ready ? `Najpierw wybierz wysokość ${trial.target - 100}–${trial.target + 100} m: przeciągnij kółko, użyj strzałek klawiatury lub przycisków pod sceną.` : !prediction ? "Wybierz przewidywanie. Wysokość jest gotowa." : "Przewidywanie zostanie zapisane przed pokazaniem wyniku."}</p>
        </> : <><div className="storm-step-label">2. Sprawdź dowód</div><h2>{running ? "Obserwuj początkową reakcję" : directions[release.tendency]}</h2><p>W chwili puszczenia na {Math.round(release.height)} m: porcja <strong>{temperature(release.temperature)}</strong>, otoczenie <strong>{temperature(release.environment)}</strong>.</p><p className="storm-prediction-record">Twoje przewidywanie: {directions[prediction].toLowerCase()}. {prediction === release.tendency ? "Zgadza się z wynikiem." : "Wynik jest inny. Sprawdź, które dane go wyjaśniają."}</p>
          <fieldset className="storm-choices" disabled={checked}><legend>Jaka była porcja względem otoczenia przy puszczeniu?</legend>{["down", "up", "still"].map(value => <button key={value} aria-pressed={evidence === value} onClick={() => setEvidence(value)}>{relations[value]}</button>)}</fieldset>
          {!checked && <button className="storm-primary" disabled={!evidence || running} onClick={explain}>Sprawdź wyjaśnienie <ArrowRight /></button>}
          {checked && <div className="storm-explanation" tabIndex={-1} ref={feedback}><strong>{correctEvidence ? "To właśnie ta różnica wyjaśnia wynik." : "Spójrz jeszcze raz na obie temperatury."}</strong><p>{relations[release.tendency]} od otoczenia. W tym uproszczeniu {release.tendency === "up" ? "cieplejsza porcja ma mniejszą gęstość i tendencję do unoszenia." : release.tendency === "down" ? "chłodniejsza porcja ma większą gęstość i tendencję do opadania." : "podobne temperatury nie wskazują wyraźnej tendencji termicznej."} {release.opacity > 0 ? "Widoczne kropelki mówią o kondensacji, nie o tym, czy porcja będzie nadal się unosić." : "Kierunek oceniamy z porównania temperatur, nie z obecności chmury."}</p><button className="storm-primary" onClick={onNext}>{trial.id === "e" ? "Zobacz wnioski" : "Następne doświadczenie"} <ArrowRight /></button></div>}
        </>}
        {!trial.guide && !release && <button className="storm-help" onClick={onHelp}><BookOpen /> Wróć po pomoc do próby A</button>}
        {!trial.guide && helped && <p className="storm-inline-hint">Dalsza część próby będzie oznaczona jako wykonana z pomocą. Wcześniejszy zapis pozostaje bez zmian.</p>}
      </section>
    </div>
    {previous.length > 0 && <section className="storm-notebook" aria-label="Porównanie zapisanych prób"><h2>Porównaj ze swoją wcześniejszą próbą</h2><div>{previous.map(record => <article key={`${record.trial}-${record.attempt}`}><span>{stormTrials.find(t => t.id === record.trial)?.name} · {Math.round(record.height)} m</span><strong>{temperature(record.temperature)} <span>porcja</span> / {temperature(record.environment)} <span>otoczenie</span></strong><p>{directions[stormParcel(stormTrials.find(t => t.id === record.trial).profile, stormTrials.find(t => t.id === record.trial).humidity, record.height).tendency]}</p></article>)}</div><p>{trial.id === "b" ? "A i B: to samo powietrze i otoczenie, inna wysokość puszczenia." : trial.id === "c" ? "A i C: ta sama wilgotność i podobna wysokość, inna temperatura otoczenia." : "Porównuj temperatury na tej samej wysokości, nie wysokości z różnych prób."}</p></section>}
  </>;
}

export function StormWorkshop({ mainSite }) {
  const [index, setIndex] = useState(0), [session, setSession] = useState(0), [history, setHistory] = useState(loadHistory);
  const [helped, setHelped] = useState(() => { try { return localStorage.getItem(`${STORAGE}-help`) === "yes"; } catch { return false; } }), [storageFailed, setStorageFailed] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [motionOff, setMotionOff] = useState(false);
  const trial = stormTrials[index], top = useRef(null);
  const lesson = returnLesson(location.search, "zagrozenia");
  useEffect(() => {
    document.title = "Co podtrzymuje unoszenie? · Pracownia CHMURNIKA";
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(history)); } catch { setStorageFailed(true); } }, [history]);
  useEffect(() => { if (helped) { try { localStorage.setItem(`${STORAGE}-help`, "yes"); } catch { setStorageFailed(true); } } }, [helped]);
  function go(next) {
    if ((index >= 3 && next < 3) || next === 5) setHelped(true);
    setIndex(next); setSession(value => value + 1);
    requestAnimationFrame(() => { top.current?.scrollIntoView({ block: "start", behavior: "instant" }); top.current?.focus({ preventScroll: true }); });
  }
  const completed = history.filter(r => r.session >= 0);
  const firstIndependent = ["d", "e"].map(id => history.find(r => r.trial === id)).filter(Boolean);
  const previous = index === 1 ? history.filter(r => r.trial === "a").slice(-1) : index === 2 ? ["a", "b"].map(id => history.filter(r => r.trial === id).at(-1)).filter(Boolean) : [];
  return <div className="storm-workshop">
    <header className="storm-topbar"><a href="#pracownia"><ArrowLeft /> Pracownia</a><span>BURZA · UNOSZENIE POWIETRZA</span><a href={`${mainSite}#/learn/${lesson}`}><BookOpen /> Lekcja</a></header>
    <main ref={top} tabIndex={-1}>
      <nav className="storm-progress" aria-label="Etapy pracowni">{["Porównaj trzy próby", "Sprawdź się", "Wnioski"].map((name, step) => <button key={name} aria-current={(index < 3 ? 0 : index < 5 ? 1 : 2) === step ? "step" : undefined} onClick={() => go(step === 0 ? 0 : step === 1 ? 3 : 5)}>{step + 1}<span>{name}</span></button>)}</nav>
      {trial ? <TrialSession key={`${index}-${session}`} trial={trial}
        onRecord={record => setHistory(old => appendStormAttempt(old, record))}
        onEvidence={(id, evidence, evidenceCorrect) => setHistory(old => recordStormEvidence(old, id, evidence, evidenceCorrect, helped || trial.guide))}
        onNext={() => go(index + 1)} previous={previous} helped={helped} onHelp={() => go(0)} reduced={reduced || motionOff} sessionNumber={session} /> :
        <section className="storm-conclusion">
          <img src="./covers/storm-v1.webp" alt="Ilustracja rozwiniętej chmury burzowej z rozbudowanym wierzchołkiem i opadem" />
          <div><p className="storm-step-label">Od porcji powietrza do głębokiej konwekcji</p><h1>Chmura może powstać i nie rosnąć dalej.</h1>
            <p>W próbie A wilgotna porcja utworzyła kropelki, ale przy puszczeniu była chłodniejsza od otoczenia. Silniejsze uniesienie w próbie B doprowadziło ją do poziomu, na którym była cieplejsza. Próba C pokazała, że wynik zależy również od profilu temperatury.</p>
            <p>To jeden z mechanizmów istotnych dla rozwoju burz, nie pełny model burzy. Do głębokiej konwekcji potrzebne są odpowiednia wilgotność, chwiejność i inicjacja. Znaczenie mają też hamowanie, mieszanie i przepływ w całej warstwie atmosfery.</p>
            <div className="storm-result-summary"><strong>Twoje pierwsze przewidywania w nowych przypadkach</strong>
              {firstIndependent.length ? firstIndependent.map(record => <p key={record.trial}>
                {stormTrials.find(t => t.id === record.trial).name}: {record.correct ? "trafne" : "nietrafne"}{record.helped ? " · z pomocą" : " · bez pomocy przewodnika"}.
                {record.evidence === undefined ? " Nie zapisano jeszcze wyjaśnienia." : record.evidenceCorrect ? " Relacja temperatur odczytana poprawnie." : " Relacja temperatur wymagała wyjaśnienia."}{record.evidenceHelped && " Przy uzasadnieniu skorzystano z pomocy."} Kolejne próby nie zmieniają tego zapisu.
              </p>) : <p>Nie wykonałeś jeszcze nowych przypadków. Wnioski nie są zaliczeniem ćwiczenia.</p>}
            </div>
            <button className="storm-primary" onClick={() => go(3)}>Sprawdź się na nowych danych <ArrowRight /></button>
            <a className="storm-lesson-link" href={`${mainSite}#/learn/${lesson}`}>Dalej w lekcji: rozwój i zagrożenia burz <BookOpen /></a>
          </div>
        </section>}
      <footer className="storm-footer">
        <div><button onClick={() => go(index < 5 ? index : 0)}><ArrowCounterClockwise /> Powtórz od początku tej próby</button>
          <button aria-pressed={reduced || motionOff} disabled={reduced} onClick={() => setMotionOff(value => !value)}>{reduced ? "Ruch ograniczony przez system" : "Pomiń animację ruchu"}</button>
          <span>{completed.length} zapisanych prób w tej przeglądarce.{storageFailed && " Trwały zapis jest niedostępny; wynik pozostaje tylko w otwartej stronie."}</span>
        </div>
        <details onToggle={event => { if (event.currentTarget.open && index >= 3 && index < 5) setHelped(true); }}>
          <summary>Jak działa schemat i czego nie wyliczamy?</summary>
          <p>To fikcyjne profile do nauki. Przyjmujemy 26°C przy ziemi, ochładzanie unoszonej porcji o 9,8°C/km przed kondensacją i umowne 6°C/km po kondensacji. Poziom kondensacji szacujemy z temperatury i punktu rosy. Porównujemy temperatury na tej samej wysokości i przy tym samym ciśnieniu, pomijając poprawkę na wilgotność, obciążenie wodą, mieszanie i bezwładność. Dlatego strzałka oznacza tylko uproszczoną tendencję termiczną po puszczeniu w spoczynku. Nie obliczamy CAPE, CIN, prędkości, czasu, wierzchołka chmury ani prawdopodobieństwa burzy. Różnicę do 0,2°C traktujemy jako nierozstrzygającą.</p>
          <p>Pomoc przy przewidywaniu i przy późniejszym uzasadnieniu zapisujemy osobno. Otworzenie tego wyjaśnienia oznaczy dalszą część samodzielnej próby jako wspomaganą.</p>
          <a href="https://www.weather.gov/spotterguide/ingredients" target="_blank" rel="noreferrer">NWS: wilgotność, unoszenie, chwiejność i hamowanie</a>
        </details>
        <p>Pracownia edukacyjna. Nie używaj jej do oceny bezpieczeństwa lotu ani aktualnego zagrożenia burzą.</p>
      </footer>
    </main>
  </div>;
}
