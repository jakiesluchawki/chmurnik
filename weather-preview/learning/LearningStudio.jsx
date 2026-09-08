import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Pause, Play, ArrowCounterClockwise, GridFour } from "@phosphor-icons/react";
import { activities, sources, lessonStateAt, lessonStepComplete } from "./catalog.mjs";
import { ActivityScene } from "./Scenes.jsx";
import { selectedSounding } from "./science.mjs";
import { Slider } from "../Slider.jsx";
import { returnLesson } from "../tutorial.mjs";
import "./style.css";

const tiles = { obserwacja: "./photos/observation.jpg", rodziny: "./photos/cirrus.jpg", front: "./mountain.webp",
  wiatr: "./cloud.webp", metar: "./cloud.webp", wysokosc: "./mountain.webp", sondaz: "./valley.webp",
  oblodzenie: "./wing.webp", turbulencja: "./mountain.webp", burza: "./cloud.webp", nazwy: "./photos/cumulus.jpg" };
const legacy = [
  { id: "bryza", title: "Dlaczego wiatr zawraca nad wybrzeżem?", short: "Bryza", image: "coast.webp", lesson: "wiatr" },
  { id: "chmura", title: "Kiedy unoszona porcja staje się chmurą?", short: "Kondensacja", image: "cloud.webp", lesson: "procesy" },
  { id: "mgla", title: "Jak nocne ochłodzenie prowadzi do mgły?", short: "Mgła", image: "valley.webp", lesson: "procesy" },
];

function Header({ mainSite }) {
  return <header className="topbar learning-topbar"><a href={mainSite} aria-label="CHMURNIK"><img src="./wordmark.png" alt="CHMURNIK" /></a>
    <span className="preview-tag">Pracownia <span>· podgląd do akceptacji</span></span><a className="back-link" href={`${mainSite}#/layers`}><ArrowLeft /> Warstwy</a></header>;
}
export function LearningCatalog({ mainSite }) {
  useEffect(() => { document.title = "Pracownia pogody · CHMURNIK"; }, []);
  return <div className="learning-studio"><Header mainSite={mainSite} /><main className="learning-catalog">
    <div className="learning-intro"><p className="eyebrow">9 LEKCJI · 14 DOŚWIADCZEŃ I ĆWICZEŃ</p><h1>Sprawdź, dlaczego niebo się zmienia.</h1><p>Każde ćwiczenie prowadzi od pierwszego ruchu do wyjaśnienia wyniku. Oglądaj prawdziwe zdjęcia, zmieniaj warunki lub odczytuj dane. Pełne lekcje pozostają o krok dalej.</p></div>
    <section className="learning-catalog-group"><h2>Od czego zacząć?</h2><p>Te trzy doświadczenia wprowadzają w powstawanie pogody.</p><div className="learning-tiles">{legacy.map(item => <a className="learning-tile" href={`?from=${item.lesson}#${item.id}`} key={item.id}><div className="learning-tile-art"><img src={`./${item.image}`} alt="" /></div><div><span className="eyebrow">{item.short}</span><h3>{item.title}</h3><span className="learning-tile-action">Otwórz przewodnik <ArrowRight /></span></div></a>)}</div></section>
    {[...new Set(Object.values(activities).map(a => a.group))].map(group => <section className="learning-catalog-group" key={group}><h2>{group}</h2><div className="learning-tiles">
      {Object.entries(activities).filter(([, a]) => a.group === group).map(([id, activity]) => <a className="learning-tile" href={`?from=${activity.lesson}#${id}`} key={id}>
        <div className={`learning-tile-art tile-${id}`}><img src={tiles[id]} alt="" loading="lazy" /></div><div><span className="eyebrow">{activity.short}</span><h3>{activity.title}</h3><p>{activity.steps.length} kroki · przewodnik i samodzielna próba</p><span className="learning-tile-action">Wejdź do ćwiczenia <ArrowRight /></span></div></a>)}
    </div></section>)}
    <p className="learning-safety">Schematy służą nauce. Nie są prognozą, rozpoznaniem zdjęcia przez model ani oceną bezpieczeństwa lotu. Fotografie mają podpisanych autorów i źródła.</p>
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
  if (control.options) return <fieldset className="learning-choice"><legend>{control.label}</legend><div>{control.options.map(([key, label]) => <button type="button" key={key} aria-pressed={value === key} onClick={() => onChange(key)}>{label}{value === key && <Check aria-hidden="true" />}</button>)}</div></fieldset>;
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
  const [state, setState] = useState({ ...activity.initial });
  const [index, setIndex] = useState(0);
  const [guide, setGuide] = useState(true);
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState(null);
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
  function focusGuide() { requestAnimationFrame(() => { heading.current?.scrollIntoView({ behavior: "instant", block: "start" }); heading.current?.focus({ preventScroll: true }); }); }
  function restart() { setState({ ...activity.initial }); setIndex(0); setGuide(true); setDone(false); setAnswer(null); focusGuide(); }
  function next() {
    if (!complete) return;
    if (index === activity.steps.length - 1) { setDone(true); setAnswer(null); }
    else { setIndex(index + 1); setState(lessonStateAt(id, index + 1)); }
    focusGuide();
  }
  return <div className="learning-studio" data-motion={paused || hidden || reduced ? "paused" : "running"}><Header mainSite={mainSite} />
    <main className="learning-activity"><nav className="learning-breadcrumb"><a href="#pracownia"><GridFour /> Wszystkie doświadczenia</a><a href={`${mainSite}#/learn/${lesson}`}><BookOpen /> Wróć do lekcji</a></nav>
      <div className="learning-intro"><p className="eyebrow">{activity.group} · {activity.short}</p><h1>{activity.title}</h1><p>{activity.lead}</p></div>
      <div className="learning-toolbar"><div role="group" aria-label="Sposób pracy"><button aria-pressed={guide} onClick={restart}>Prowadź mnie</button><button aria-pressed={!guide} onClick={() => { setGuide(false); setDone(false); }}>Samodzielna próba</button></div>
        <button className="learning-motion" onClick={() => setPaused(!paused)} aria-pressed={paused} disabled={reduced}>{paused || reduced ? <Play /> : <Pause />}{reduced ? "Ograniczony ruch" : paused ? "Wznów ruch" : "Zatrzymaj ruch"}</button></div>
      <section className="learning-workbench" aria-label={activity.short}>
        <header className="learning-guide-heading" ref={heading} tabIndex={-1}>
          <p className="eyebrow">{guide ? done ? "Przewodnik ukończony · sprawdź zrozumienie" : `Krok ${index + 1} z ${activity.steps.length}` : "Zmieniaj po jednym warunku"}</p>
          <h2>{guide ? done ? "Co wynika z Twojej próby?" : step.title : "Porównaj, co się zmienia"}</h2>
          <p>{guide ? done ? "Wybierz odpowiedź. Wyjaśnienie pojawi się po Twojej próbie." : step.expect : "Zmień jedną rzecz i porównaj rysunek z odczytem pod nim. Możesz w każdej chwili wrócić do przewodnika od początku."}</p>
        </header>
        {done ? <div className="learning-check"><h3>{activity.check.question}</h3><div>{activity.check.options.map((option, i) => <button key={option} aria-pressed={answer === i} onClick={() => setAnswer(i)}>{option}</button>)}</div>
          {answer !== null && <div className="learning-feedback" role="status"><strong>{answer === activity.check.correct ? "Tak, to właściwy wniosek." : "Przyjrzyj się temu jeszcze raz."}</strong><p>{activity.check.explanation}</p></div>}
          <button className="learning-primary" onClick={() => { setGuide(false); setDone(false); }}>Sprawdź inne ustawienia <ArrowRight /></button><button className="learning-reset" onClick={restart}><ArrowCounterClockwise /> Powtórz przewodnik</button>
        </div> : <div className="learning-lab-grid"><div className="learning-visual"><ActivityScene id={id} state={state} /></div>
          <div className="learning-interaction">
            <div className="learning-controls">{visibleControls(id, state, guide, index).map(control => <Control key={control.key} control={control} value={state[control.key]} onChange={value => setState(old => ({ ...old, [control.key]: value }))} />)}</div>
            {guide && <div className="learning-guide-actions"><button className="learning-primary" onClick={() => setState(old => ({ ...old, [step.key]: step.target }))}>{step.action}<ArrowRight /></button>
              <div className="learning-feedback" role="status">{complete ? <><strong><Check /> Wykonane. Co się zmieniło?</strong><p>{step.explanation}</p></> : <p>Użyj kontrolki albo przycisku powyżej. Przycisk wykona tę samą zmianę bez przeciągania.</p>}</div>
              <button className="learning-next" disabled={!complete} onClick={next}>{index === activity.steps.length - 1 ? "Sprawdź zrozumienie" : "Następny krok"}<ArrowRight /></button>
              {index > 0 && <button className="learning-reset" onClick={() => { setIndex(index - 1); setState(lessonStateAt(id, index - 1)); focusGuide(); }}><ArrowLeft /> Poprzedni krok</button>}
            </div>}
          </div></div>}
      </section>
      <div className="learning-continuation"><a className="learning-return" href={`${mainSite}#/learn/${lesson}`}><BookOpen /><span>Wróć do pełnej lekcji<br /><small>Rozdziały i zapisany postęp pozostają w lekcji.</small></span><ArrowRight /></a>
        {fullTool && <a href={`${mainSite}#/layers/${fullTool}`}>Przejdź do pełnego narzędzia: {id === "sondaz" ? "inne profile i Skew-T" : activity.short} <ArrowRight /></a>}</div>
      <details className="learning-sources"><summary>Źródła i granice tego ćwiczenia</summary><p>Materiał dydaktyczny. Nie korzysta z bieżącej pogody, nie określa bezpieczeństwa i nie zastępuje ostrzeżeń ani przygotowania do lotu. Schematy przedstawiają wybrane mechanizmy, nie kompletną atmosferę.</p><ul>{activity.sources.map(key => <li key={key}><a href={sources[key][1]} target="_blank" rel="noreferrer">{sources[key][0]}</a></li>)}</ul></details>
    </main></div>;
}
