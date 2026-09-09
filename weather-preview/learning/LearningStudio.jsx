import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Pause, Play, ArrowCounterClockwise, GridFour } from "@phosphor-icons/react";
import { activities, sources, lessonStateAt, lessonStepComplete } from "./catalog.mjs";
import { ActivityScene } from "./Scenes.jsx";
import { selectedSounding } from "./science.mjs";
import { Slider } from "../Slider.jsx";
import { returnLesson } from "../tutorial.mjs";
import { catalogArtwork } from "./artwork.mjs";
import { TransferTrial } from "./TransferTrial.jsx";
import { markTransferHelp } from "./transfer-state.mjs";
import "./style.css";

const legacy = [
  { id: "bryza", title: "Dlaczego wiatr zawraca nad wybrzeżem?", short: "Bryza", lesson: "wiatr" },
  { id: "chmura", title: "Kiedy unoszona porcja staje się chmurą?", short: "Kondensacja", lesson: "procesy" },
  { id: "mgla", title: "Jak nocne ochłodzenie prowadzi do mgły?", short: "Mgła", lesson: "procesy" },
];

function CatalogCover({ id }) {
  const art = catalogArtwork[id];
  return <div className={`learning-tile-art${art.contain ? " learning-tile-art-contained" : ""}`}>
    <img src={art.src} alt="" loading="lazy" decoding="async" />
  </div>;
}

function Header({ mainSite }) {
  return <header className="topbar learning-topbar"><a href={mainSite} aria-label="CHMURNIK"><img src="./wordmark.png" alt="CHMURNIK" /></a>
    <span className="preview-tag">Pracownia <span>· podgląd do akceptacji</span></span><a className="back-link" href={`${mainSite}#/layers`}><ArrowLeft /> Warstwy</a></header>;
}
export function LearningCatalog({ mainSite }) {
  useEffect(() => { document.title = "Pracownia pogody · CHMURNIK"; }, []);
  return <div className="learning-studio"><Header mainSite={mainSite} /><main className="learning-catalog">
    <div className="learning-intro"><p className="eyebrow">9 LEKCJI · 14 DOŚWIADCZEŃ I ĆWICZEŃ</p><h1>Sprawdź, dlaczego niebo się zmienia.</h1><p>Każde ćwiczenie prowadzi od pierwszego ruchu do wyjaśnienia wyniku. Oglądaj prawdziwe zdjęcia, zmieniaj warunki lub odczytuj dane. Pełne lekcje pozostają o krok dalej.</p></div>
    <section className="learning-catalog-group"><h2>Od czego zacząć?</h2><p>Te trzy doświadczenia wprowadzają w powstawanie pogody.</p><div className="learning-tiles">{legacy.map(item => <a className="learning-tile" href={`?from=${item.lesson}#${item.id}`} key={item.id}><CatalogCover id={item.id} /><div><span className="eyebrow">{item.short}</span><h3>{item.title}</h3><span className="learning-tile-action">Otwórz przewodnik <ArrowRight /></span></div></a>)}</div></section>
    {[...new Set(Object.values(activities).map(a => a.group))].map(group => <section className="learning-catalog-group" key={group}><h2>{group}</h2><div className="learning-tiles">
      {Object.entries(activities).filter(([, a]) => a.group === group).map(([id, activity]) => <a className="learning-tile" href={`?from=${activity.lesson}#${id}`} key={id}>
        <CatalogCover id={id} /><div><span className="eyebrow">{activity.short}</span><h3>{activity.title}</h3><p>{activity.steps.length} {activity.steps.length < 5 ? "kroki" : "kroków"} · przewodnik i samodzielna próba</p><span className="learning-tile-action">Wejdź do ćwiczenia <ArrowRight /></span></div></a>)}
    </div></section>)}
    <p className="learning-safety">Filcowe okładki ilustrują temat, nie rzeczywistą pogodę. Schematy w ćwiczeniach służą nauce: nie są prognozą, rozpoznaniem zdjęcia przez model ani oceną bezpieczeństwa lotu. Prawdziwe fotografie mają podpisanych autorów i źródła.</p>
    <a className="learning-return" href={`${mainSite}#/learn`}><BookOpen /> Wszystkie pełne lekcje <ArrowRight /></a>
  </main></div>;
}

export function visibleControls(id, state, guide, stepIndex) {
  const activity = activities[id];
  if (guide) return [activity.controls.find(c => c.key === activity.steps[stepIndex]?.key)].filter(Boolean);
  return activity.controls.filter(control => {
    if (id === "wiatr" && control.key === "upper") return state.layers === "two";
    if (id === "metar" && ["cover", "base"].includes(control.key)) return state.product === "metar";
    if (id === "metar" && control.key === "hour") return state.product === "taf";
    if (id === "burza" && control.key === "phase") return state.moisture === "wet" && state.stability === "unstable" && state.trigger === "lift";
    return true;
  });
}
function Control({ control, value, onChange }) {
  if (control.options?.length > 4) return <label className="learning-parameter">{control.label}<select value={value} onChange={event => onChange(event.target.value)}>{control.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>;
  if (control.options) return <fieldset className={`learning-choice${control.options.every(([, label]) => label.length < 25) ? " learning-choice-short" : ""}`}><legend>{control.label}</legend><div>{control.options.map(([key, label]) => <button type="button" key={key} aria-pressed={value === key} onClick={() => onChange(key)}>{label}{value === key && <Check aria-hidden="true" />}</button>)}</div></fieldset>;
  let display = `${value}${control.unit === "°C" || control.unit === "°" ? "" : " "}${control.unit}`.trim();
  if (control.key === "level") display = `${selectedSounding(value).pressure} hPa`;
  if (control.key === "phase") display = ["Rozwój", "Dojrzałość", "Zanik"][value];
  if (control.key === "base") display = `${value * 100} ft AGL`;
  if (control.key === "hour") display = `${value}:00 UTC`;
  return <Slider id={`learning-${control.key}`} label={control.label} value={value} min={control.min} max={control.max} step={control.step}
    display={display} icon={control.icon} ends={control.key === "level" ? ["1000 hPa · dół", "200 hPa · góra"] : control.key === "phase" ? ["Rozwój", "Zanik"] : control.key === "base" ? ["500 ft", "4500 ft"] : undefined} onChange={onChange} />;
}

export function LearningStudio({ id, mainSite }) {
  const activity = activities[id];
  const [guidedState, setGuidedState] = useState({ ...activity.initial });
  const [exploreState, setExploreState] = useState({ ...activity.initial });
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState("tutorial");
  const guide = mode === "tutorial";
  const state = guide ? guidedState : exploreState;
  const setState = guide ? setGuidedState : setExploreState;
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [observe, setObserve] = useState(false);
  const [controlKey, setControlKey] = useState(activity.controls[0].key);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(matchMedia("(prefers-reduced-motion: reduce)").matches);
  const heading = useRef(null);
  const step = activity.steps[index];
  const complete = lessonStepComplete(id, index, state);
  const lesson = returnLesson(location.search, activity.lesson);
  const fullTool = { sondaz: "sounding", metar: "metar", wiatr: "wind", wysokosc: "lab", oblodzenie: "hazards", turbulencja: "hazards", burza: "hazards" }[id];
  useEffect(() => {
    document.title = `${activity.short} · Pracownia CHMURNIKA`;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => setHidden(document.hidden), preference = () => setReduced(motion.matches);
    document.addEventListener("visibilitychange", visibility); motion.addEventListener("change", preference);
    return () => { document.removeEventListener("visibilitychange", visibility); motion.removeEventListener("change", preference); };
  }, [activity]);
  function focusGuide() { requestAnimationFrame(() => { heading.current?.scrollIntoView({ behavior: "instant", block: "nearest" }); heading.current?.focus({ preventScroll: true }); }); }
  function chooseMode(value) { if (mode === "assessment" && value !== mode) markTransferHelp(id); setMode(value); }
  function restart() { setGuidedState({ ...activity.initial }); setIndex(0); chooseMode("tutorial"); setDone(false); setAnswer(null); setChecked(false); setObserve(false); focusGuide(); }
  function next() {
    if (!complete) return;
    if (index === activity.steps.length - 1) { setDone(true); setAnswer(null); setChecked(false); }
    else { setIndex(index + 1); setGuidedState(lessonStateAt(id, index + 1)); }
    setObserve(false);
    focusGuide();
  }
  const available = visibleControls(id, state, guide, index);
  const selectedControl = available.find(control => control.key === controlKey) || available[0];
  const compactTitle = { metar: "METAR / TAF", front: "Front", obserwacja: "Obserwacja", rodziny: "Rodzaje", wiatr: "Wiatr", wysokosc: "Wysokość", sondaz: "Sondaż", oblodzenie: "Oblodzenie", turbulencja: "Turbulencja", burza: "Burza", nazwy: "Nazwy chmur" }[id];
  function leaving() { if (mode === "assessment") markTransferHelp(id); }
  return <div className="learning-studio learning-focused" data-motion={paused || hidden || reduced ? "paused" : "running"} onClickCapture={event => { if (event.target.closest("a") && !event.target.closest(".transfer-trial")) leaving(); }}>
    <main className="learning-activity"><nav className="learning-breadcrumb"><a href="#pracownia"><ArrowLeft /> Pracownia</a><h1>{compactTitle}</h1><a href={`${mainSite}#/learn/${lesson}`} aria-label="Wróć do lekcji"><BookOpen /> Lekcja</a></nav>
      <div className="learning-toolbar"><div role="group" aria-label="Sposób pracy"><button aria-pressed={guide} onClick={() => chooseMode("tutorial")}>Prowadź mnie</button><button aria-pressed={mode === "assessment"} onClick={() => chooseMode("assessment")}>Sprawdź się</button><button aria-pressed={mode === "explore"} onClick={() => chooseMode("explore")}>Eksperymentuj</button></div>
        <button className="learning-motion" onClick={() => setPaused(!paused)} aria-label={reduced ? "Ograniczony ruch" : paused ? "Wznów ruch" : "Zatrzymaj ruch"} aria-pressed={paused} disabled={reduced}>{paused || reduced ? <Play /> : <Pause />}<span>{reduced ? "Ograniczony ruch" : paused ? "Wznów ruch" : "Zatrzymaj ruch"}</span></button></div>
      {mode === "assessment" ? <TransferTrial key={id} activityId={id} /> : <section className="learning-workbench" aria-label={activity.short}>
        <header className="learning-guide-heading" ref={heading} tabIndex={-1}>
          <p className="eyebrow">{guide ? done ? "Dokończ wniosek · bez instrukcji" : `Krok ${index + 1} z ${activity.steps.length}` : "Swobodne eksperymentowanie · bez oceny"}</p>
          <h2>{guide ? done ? "Co wynika z obserwacji?" : step.title : activity.title}</h2>
        </header>
        {guide && done ? <div className="learning-check"><h3>{activity.check.question}</h3><div>{activity.check.options.map((option, i) => <button key={option} disabled={checked} aria-pressed={answer === i} onClick={() => setAnswer(i)}>{option}</button>)}</div>
          {!checked ? <button className="learning-primary" disabled={answer === null} onClick={() => setChecked(true)}>Zatwierdź wniosek <Check /></button> : <><div className="learning-feedback" role="status"><strong>{answer === activity.check.correct ? "To właściwy wniosek z tego przykładu." : "W tym wniosku jest coś do poprawy."}</strong><p>{activity.check.explanation}</p><p>To podsumowanie przewodnika. Kolejne zadanie ma inne dane i wymaga własnego uzasadnienia.</p></div>
          <button className="learning-primary" onClick={() => chooseMode("assessment")}>Zastosuj to w nowym przypadku <ArrowRight /></button></>}
          <button className="learning-reset" onClick={restart}><ArrowCounterClockwise /> Powtórz przewodnik</button>
        </div> : <div className="learning-lab-grid"><div className="learning-visual"><ActivityScene id={id} state={state} /></div>
          <div className="learning-interaction">
            {guide && observe ? <div className="learning-step-result"><p className="eyebrow">Porównaj z własną obserwacją</p><h3>Co się zmieniło?</h3><p>{step.expect}</p><p>{step.explanation}</p><button className="learning-next" onClick={next}>{index === activity.steps.length - 1 ? "Dokończ wniosek" : "Następny krok"}<ArrowRight /></button><button className="learning-reset" onClick={() => setObserve(false)}>Wróć do sterowania</button></div> : <>
              {!guide && <label className="learning-parameter">Który warunek zmieniasz?<select value={selectedControl.key} onChange={event => setControlKey(event.target.value)}>{available.map(control => <option key={control.key} value={control.key}>{control.label}</option>)}</select></label>}
              <div className="learning-controls">{(guide ? available : [selectedControl]).map(control => <Control key={control.key} control={control} value={state[control.key]} onChange={value => setState(old => ({ ...old, [control.key]: value }))} />)}</div>
              {guide && <div className="learning-guide-actions">{!complete ? <button className="learning-primary" onClick={() => setGuidedState(old => ({ ...old, [step.key]: step.target }))}>{step.action}<ArrowRight /></button> : <button className="learning-next" onClick={() => { setObserve(true); focusGuide(); }}>Porównaj i wyjaśnij <ArrowRight /></button>}
                <p className="learning-step-hint">{complete ? "Zmiana wykonana. Obejrzyj wynik i spróbuj go wyjaśnić, zanim przejdziesz dalej." : "Zmień ustawienie ręcznie lub użyj przycisku. Potem porównasz wynik z wyjaśnieniem."}</p>
              </div>}
            </>}
            {guide && index > 0 && <button className="learning-reset" onClick={() => { setIndex(index - 1); setGuidedState(lessonStateAt(id, index - 1)); setObserve(false); focusGuide(); }}><ArrowLeft /> Poprzedni krok</button>}
          </div></div>}
      </section>}
      {guide && !done && <button className="learning-reset" onClick={restart}><ArrowCounterClockwise /> Zacznij przewodnik od początku</button>}
      <details className="learning-about"><summary>O tym ćwiczeniu</summary><p>{activity.lead}</p><p>Najpierw poznaj mechanizm w przewodniku. Potem sprawdź go w innym przypadku, bez gotowego rozwiązania. W eksperymentowaniu możesz swobodnie zmieniać warunki.</p></details>
      <div className="learning-continuation"><a className="learning-return" href={`${mainSite}#/learn/${lesson}`}><BookOpen /><span>Wróć do pełnej lekcji<br /><small>Rozdziały i zapisany postęp pozostają w lekcji.</small></span><ArrowRight /></a>
        {fullTool && <a href={`${mainSite}#/layers/${fullTool}`}>Przejdź do pełnego narzędzia: {id === "sondaz" ? "inne profile i Skew-T" : activity.short} <ArrowRight /></a>}</div>
      <details className="learning-sources"><summary>Źródła i granice tego ćwiczenia</summary><p>Materiał dydaktyczny. Nie korzysta z bieżącej pogody, nie określa bezpieczeństwa i nie zastępuje ostrzeżeń ani przygotowania do lotu. Schematy przedstawiają wybrane mechanizmy, nie kompletną atmosferę.</p><ul>{activity.sources.map(key => <li key={key}><a href={sources[key][1]} target="_blank" rel="noreferrer">{sources[key][0]}</a></li>)}</ul></details>
    </main></div>;
}
