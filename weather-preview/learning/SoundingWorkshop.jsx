import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, BookOpen } from "@phosphor-icons/react";
import { TransferTrial } from "./TransferTrial.jsx";
import { markTransferHelp } from "./transfer-state.mjs";
import { returnLesson } from "../tutorial.mjs";
import { soundingStages, soundingSources, soundingRow, soundingPlot, soundingPoint, levelAtPlotY, keyboardLevel,
  soundingReady, updateSoundingWorkshop, loadSoundingWorkshop, saveSoundingWorkshop } from "./sounding-workshop.mjs";
import "./sounding-workshop.css";

const fieldLabels = { temperature: "T · otoczenie", dewpoint: "Td · punkt rosy", parcel: "Porcja · dane umowne" };
const degrees = value => `${value}°C`;
const noop = () => {};

export function SoundingChart({ stage, pressure, projection = "straight", onLevel = noop, locked = false, explained = false }) {
  const clip = useId();
  const skew = projection === "skew", selected = soundingRow(pressure);
  const point = (t, p) => soundingPoint(t, p, stage, skew);
  const levels = stage.pressures.map(soundingRow);
  const ticks = stage.pressures.length > 6 ? [1000, 850, 700, 500, 300, 200] : stage.pressures;
  const temperatures = [];
  for (let t = Math.ceil(stage.domain[0] / 10) * 10; t <= stage.domain[1]; t += 10) temperatures.push(t);
  const bottom = stage.pressures[0], top = stage.pressures.at(-1);
  function selectAt(event) {
    if (locked) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.height) return;
    const next = levelAtPlotY(stage, (event.clientY - bounds.top) / bounds.height * soundingPlot.height);
    if (next !== null) onLevel(next);
  }
  function key(event) {
    if (locked) return;
    const next = keyboardLevel(stage, pressure, event.key);
    if (next !== null) { event.preventDefault(); onLevel(next); }
  }
  const valueText = `${pressure} hPa. ${stage.fields.map(field => `${fieldLabels[field]} ${degrees(selected[field])}`).join(". ")}${stage.wind ? `. Wiatr z ${selected.windDirection} stopni, ${selected.windSpeed} węzłów` : ""}`;
  return <div className="sounding-chart-group">
    <div className="sounding-chart" role="slider" tabIndex={locked ? -1 : 0} aria-label="Poziom odczytu na wykresie" aria-orientation="vertical"
      aria-valuemin={0} aria-valuemax={stage.pressures.length - 1} aria-valuenow={stage.pressures.indexOf(pressure)} aria-valuetext={valueText} aria-disabled={locked} onKeyDown={key}>
      <svg viewBox={`0 0 ${soundingPlot.width} ${soundingPlot.height}`} preserveAspectRatio="none" aria-hidden="true" onClick={selectAt}>
        <defs><clipPath id={clip}><rect x={soundingPlot.left - 5} y={soundingPlot.top - 5} width={soundingPlot.right - soundingPlot.left + 10} height={soundingPlot.bottom - soundingPlot.top + 10} /></clipPath></defs>
        <text x="7" y="17" className="sounding-axis-title">hPa</text><text x="263" y="277" className="sounding-axis-title">temperatura · °C</text>
        {ticks.map(p => <g key={p}><line x1={soundingPlot.left} x2={soundingPlot.right} y1={point(0, p).y} y2={point(0, p).y} className="sounding-grid" /><text x="48" y={point(0, p).y + 4} textAnchor="end">{p}</text></g>)}
        <g clipPath={`url(#${clip})`}>
          {temperatures.map(t => <line key={t} x1={point(t, bottom).x} x2={point(t, top).x} y1={soundingPlot.bottom} y2={soundingPlot.top} className="sounding-isotherm" />)}
          {explained && stage.id === "inversion" && <rect className="sounding-inversion" x={soundingPlot.left} width={soundingPlot.right - soundingPlot.left} y={point(0, 800).y} height={point(0, 850).y - point(0, 800).y} />}
          {!stage.single && stage.fields.map(field => <polyline key={field} className={`sounding-trace ${field}`} points={levels.map(row => { const p = point(row[field], row.pressure); return `${p.x},${p.y}`; }).join(" ")} />)}
          <line x1={soundingPlot.left} x2={soundingPlot.right} y1={point(0, pressure).y} y2={point(0, pressure).y} className="sounding-selected-line" />
          {stage.fields.map(field => { const p = point(selected[field], pressure); return <g key={field} className={`sounding-point ${field}`}>
            {field === "dewpoint" ? <rect x={p.x - 4} y={p.y - 4} width="8" height="8" /> : field === "parcel" ? <path d={`M${p.x},${p.y - 6}l6,6l-6,6l-6,-6Z`} /> : <circle cx={p.x} cy={p.y} r="5" />}
          </g>; })}
          {skew && <line className="sounding-reading-guide" x1={point(selected.temperature, pressure).x} y1={point(0, pressure).y} x2={point(selected.temperature, bottom).x} y2={soundingPlot.bottom} />}
        </g>
        {temperatures.map(t => <text key={t} x={point(t, bottom).x} y="257" textAnchor="middle">{t}</text>)}
      </svg>
    </div>
    <div className="sounding-chart-key">{stage.fields.map(field => <span key={field} className={field}>{fieldLabels[field]}</span>)}</div>
    <p className="sounding-chart-caption">{skew ? "Fioletowa prowadnica biegnie wzdłuż stałej temperatury do dolnej skali." : "Dotknij wysokości punktu lub wybierz poziom poniżej. Wyżej: mniejsze hPa."}</p>
    <div className="sounding-level-controls">
      <button type="button" onClick={() => onLevel(keyboardLevel(stage, pressure, "ArrowDown"))} disabled={locked || pressure === bottom} aria-label="Wybierz dostępny poziom niżej"><ArrowDown /></button>
      <label>Odczyt na <select aria-label="Poziom ciśnienia" value={pressure} disabled={locked} onChange={event => onLevel(Number(event.target.value))}>{stage.pressures.map(p => <option key={p} value={p}>{p} hPa</option>)}</select></label>
      <button type="button" onClick={() => onLevel(keyboardLevel(stage, pressure, "ArrowUp"))} disabled={locked || pressure === top} aria-label="Wybierz dostępny poziom wyżej"><ArrowUp /></button>
    </div>
  </div>;
}

function LevelData({ stage, pressure, reference = false }) {
  const row = soundingRow(pressure);
  return <div className={`sounding-level-data ${reference ? "reference" : ""}`}>
    <strong>{reference ? "Porównaj: " : "Wybrane: "}{pressure} hPa</strong>
    <dl>{stage.fields.map(field => <div key={field}><dt>{fieldLabels[field]}</dt><dd>{degrees(row[field])}</dd></div>)}
      {stage.wind && <div className="sounding-wind-data"><dt>Wiatr na {pressure} hPa</dt><dd>z {row.windDirection}° · {row.windSpeed} kt</dd></div>}</dl>
  </div>;
}

function ProjectionSwitch({ value, onChange, disabled = false }) {
  return <div className="sounding-projection" role="group" aria-label="Sposób rysowania osi temperatury">
    <button type="button" aria-pressed={value === "straight"} disabled={disabled} onClick={() => onChange("straight")}>Proste osie</button>
    <button type="button" aria-pressed={value === "skew"} disabled={disabled} onClick={() => onChange("skew")}>Pochyl osie</button>
  </div>;
}

export function SoundingGuide({ state, dispatch = noop }) {
  const stage = soundingStages[state.stageIndex], a = state.attempt;
  const first = state.first[stage.id];
  const focus = useRef(null);
  function change(action, moveFocus = false) {
    dispatch(action);
    if (moveFocus && action.type !== "stage" && action.type !== "mode" && typeof requestAnimationFrame === "function") requestAnimationFrame(() => { focus.current?.focus({ preventScroll: true }); focus.current?.scrollIntoView({ block: "nearest", behavior: "instant" }); });
  }
  const source = soundingSources[stage.source];
  const ready = soundingReady(stage, a);
  const options = a.committed ? stage.reasons : stage.choices;
  const choice = a.committed ? a.reason : a.decision;
  return <>
    <header className="sounding-brief"><p className="sounding-kicker">Krok {state.stageIndex + 1} z {soundingStages.length} · {a.repeated ? "powtórka znanego odczytu" : "z przewodnikiem"}</p><h1>{stage.title}</h1><p>{stage.intro}</p></header>
    <div className="sounding-bench">
      <section className="sounding-apparatus" aria-label="Wykres i bieżące odczyty">
        <p className="sounding-profile-stamp">Profil szkoleniowy B · {stage.pressures[0]}–{stage.pressures.at(-1)} hPa · dane syntetyczne</p>
        <SoundingChart stage={stage} pressure={a.pressure} projection={a.projection} onLevel={pressure => change({ type: "level", pressure })} locked={a.committed} explained={a.explained} />
        <div className="sounding-data-pair" aria-live="polite" aria-atomic="true">
          {stage.reference && stage.reference !== a.pressure && <LevelData stage={stage} pressure={stage.reference} reference />}
          <LevelData stage={stage} pressure={a.pressure} />
        </div>
        {stage.id === "skew" && <><ProjectionSwitch value={a.projection} disabled={!a.committed} onChange={value => change({ type: "projection", value })} />{!a.committed && <p className="sounding-small">Przełącznik odblokuje się po zapisaniu przewidywania.</p>}</>}
      </section>
      <section className="sounding-decision" ref={focus} tabIndex={-1} aria-label="Odczyt i uzasadnienie">
        {!a.explained ? <>
          <p className="sounding-instruction">{a.committed ? stage.id === "skew" && !a.skewSeen ? "Teraz naciśnij „Pochyl osie” i sprawdź odczyt. Potem wybierz uzasadnienie." : "Pierwszy wybór zapisany. Wskaż dane, które go uzasadniają." : stage.instruction}</p>
          <fieldset><legend>{a.committed ? stage.reasonQuestion : stage.question}</legend><div className="sounding-choices">{options.map(option => <label key={option.id}>
            <input type="radio" name={`sounding-${stage.id}-${a.committed ? "reason" : "decision"}`} value={option.id} checked={choice === option.id} onChange={() => change({ type: a.committed ? "reason" : "decision", value: option.id })} /><span>{option.label}</span>
          </label>)}</div></fieldset>
          <button className="sounding-primary" type="button" disabled={!choice || (!a.committed && !ready) || (a.committed && stage.id === "skew" && !a.skewSeen)} onClick={() => change({ type: a.committed ? "explain" : "commit" }, true)}>{a.committed ? "Zapisz uzasadnienie i sprawdź" : stage.id === "skew" ? "Zapisz przewidywanie" : "Zapisz odczyt"}<ArrowRight /></button>
          {!a.committed && !ready && <p className="sounding-small">Odczytaj {stage.required.join(" i ")} hPa. Na końcu wybierz {stage.target} hPa. Sam wybór poziomu nie zalicza odpowiedzi.</p>}
          <button className="sounding-help" type="button" onClick={() => change({ type: "help", hint: true })}>Podpowiedź do tego kroku</button>
          {a.hint && <p className="sounding-hint" role="status">{stage.hint}</p>}
          {a.help && <p className="sounding-small">{a.committed && a.decisionHelped === false ? "Odczyt zapisano przed pomocą. Pomoc dotyczy teraz uzasadnienia." : "Ta część próby jest oznaczona jako wykonana z pomocą."}</p>}
        </> : <div className="sounding-feedback">
          <h2>{a.decision === stage.answer && a.reason === stage.reason ? "Odczyt i uzasadnienie się zgadzają" : "Sprawdź różnicę w swoim rozumowaniu"}</h2>
          <p>Twój pierwszy wybór w tej próbie: <strong>{stage.choices.find(option => option.id === a.decision).label}</strong>. {a.decision === stage.answer ? "Poprawny odczyt." : "Ten odczyt wymaga poprawy."}</p>
          <p>Uzasadnienie: <strong>{stage.reasons.find(option => option.id === a.reason).label}</strong> {a.reason === stage.reason ? "Zgadza się z danymi." : "Nie wyjaśnia tych danych."}</p>
          {stage.conclusion.map(text => <p key={text}>{text}</p>)}
          <p className="sounding-small">Odczyt: {a.decisionHelped ? "z pomocą" : "bez dodatkowej pomocy"}. Uzasadnienie: {a.reasonHelped ? "z pomocą" : "bez dodatkowej pomocy"}. To krok z przewodnikiem, nie niezależny sprawdzian.</p>
          {first && first.number !== a.number && <aside className="sounding-first-record"><strong>Pierwszy zapis tego kroku pozostaje bez zmian</strong><p>Odczyt: {stage.choices.find(option => option.id === first.decision)?.label} · {first.decisionHelped ? "z pomocą" : "bez dodatkowej pomocy"}.</p><p>{first.reason === null ? "W pierwszej próbie nie zapisano uzasadnienia." : `Uzasadnienie: ${stage.reasons.find(option => option.id === first.reason)?.label} · ${first.reasonHelped ? "z pomocą" : "bez dodatkowej pomocy"}.`}</p></aside>}
          {stage.id === "skew" && <div className="sounding-recap"><h3>Przed nowym profilem</h3><ul><li>Najpierw wybierz ciśnienie, potem odczytaj temperaturę.</li><li>T i Td zestawiaj na tym samym poziomie.</li><li>Inwersję rozpoznawaj z wartości, nie samego kierunku krzywej.</li><li>Porcję i wiatr odczytuj z ich własnych danych.</li><li>Pochylenie osi nie zmienia danych ani nie dodaje prognozy.</li></ul></div>}
          <button className="sounding-primary" type="button" onClick={() => change(state.stageIndex === soundingStages.length - 1 ? { type: "mode", mode: "assessment" } : { type: "stage", index: state.stageIndex + 1 }, true)}>{state.stageIndex === soundingStages.length - 1 ? "Sprawdź się na innym profilu" : "Następny krok"}<ArrowRight /></button>
        </div>}
      </section>
    </div>
    <div className="sounding-stage-footer"><button type="button" disabled={state.stageIndex === 0} onClick={() => change({ type: "stage", index: state.stageIndex - 1 }, true)}><ArrowLeft /> Poprzedni krok</button><button type="button" onClick={() => change({ type: "stage", index: state.stageIndex }, true)}>Powtórz ten krok</button></div>
    <details className="sounding-method" onToggle={event => { if (event.currentTarget.open) change({ type: "help" }); }}><summary>Jak czytać ten rysunek i skąd pochodzi zasada?</summary>
      <p>{stage.instruction}</p><p>Strzałki na wykresie wybierają sąsiedni dostępny poziom. Home wybiera najniższy, End najwyższy. Dotknięcie wybiera najbliższą próbkę w pokazanym zakresie; linie między próbkami nie są dodatkowymi pomiarami.</p>
      <p>W źródłach spotkasz też mb: 1 mb to 1 hPa. Nie zamieniamy tutaj ciśnienia na metry ani nie dodajemy danych poza zakresem profilu.</p>
      <a href={source.url} target="_blank" rel="noreferrer" onClick={() => change({ type: "help" })} onAuxClick={() => change({ type: "help" })}>{source.label}</a>
    </details>
  </>;
}

function SoundingExplore() {
  const [pressure, setPressure] = useState(850), [projection, setProjection] = useState("straight"), [detail, setDetail] = useState("temperature");
  const stage = { ...soundingStages.at(-1), fields: detail === "temperature" || detail === "wind" ? ["temperature"] : detail === "moisture" ? ["temperature", "dewpoint"] : ["temperature", "parcel"], wind: detail === "wind" };
  return <>
    <header className="sounding-brief"><p className="sounding-kicker">Swobodny odczyt · bez oceny</p><h1>Zbadaj ten sam profil</h1><p>Wybierasz dane i sposób rysowania, nie sterujesz pogodą. Skala obejmuje tylko dostarczone 1000–200 hPa.</p></header>
    <div className="sounding-bench"><section className="sounding-apparatus"><p className="sounding-profile-stamp">Profil szkoleniowy B · dane syntetyczne</p><SoundingChart stage={stage} pressure={pressure} projection={projection} onLevel={setPressure} /><LevelData stage={stage} pressure={pressure} /></section>
      <section className="sounding-explore-controls"><label>Co odczytujesz?<select value={detail} onChange={event => setDetail(event.target.value)}><option value="temperature">Temperatura</option><option value="moisture">Temperatura i punkt rosy</option><option value="parcel">Porcja i otoczenie</option><option value="wind">Wiatr na wybranym poziomie</option></select></label><ProjectionSwitch value={projection} onChange={setProjection} />
        <p>Na pochyłym wykresie prowadnica pokazuje drogę do skali temperatury. Porównuj wartości na jednej poziomej linii ciśnienia.</p><p>Brak tu pełnej siatki termodynamicznej, obliczeń energii i danych o terenie. Z samego profilu nie odczytasz czasu burzy ani warunków całej trasy.</p>
      </section></div>
  </>;
}

export function SoundingWorkshop({ mainSite = "../" }) {
  const [state, setState] = useState(loadSoundingWorkshop), [durable, setDurable] = useState(true);
  const current = useRef(state), top = useRef(null);
  const lesson = returnLesson(globalThis.location?.search || "", "warstwy");
  useEffect(() => { const previous = document.title; document.title = "Czytanie sondażu · Pracownia CHMURNIKA"; return () => { document.title = previous; }; }, []);
  function dispatch(action) {
    if (current.current.mode === "assessment" && action.type === "mode" && action.mode !== "assessment") markTransferHelp("sondaz");
    const next = updateSoundingWorkshop(current.current, action);
    current.current = next;
    setDurable(saveSoundingWorkshop(next));
    setState(next);
    if ((action.type === "mode" || action.type === "stage") && typeof requestAnimationFrame === "function") requestAnimationFrame(() => { top.current?.focus({ preventScroll: true }); top.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function lessonHelp() { if (current.current.mode !== "assessment") dispatch({ type: "help" }); }
  return <div className="sounding-workshop">
    <header className="sounding-topbar"><a href="#pracownia"><ArrowLeft /> Pracownia</a><span>SONDAŻ · ODCZYT DANYCH</span><a href={`${mainSite}#/learn/${lesson}`} onClick={lessonHelp} onAuxClick={lessonHelp}><BookOpen /> Lekcja</a></header>
    <main ref={top} tabIndex={-1}>
      <nav className="sounding-modes" aria-label="Tryb warsztatu sondażu">{[["guide", "Krok po kroku"], ["explore", "Swobodny odczyt"], ["assessment", "Sprawdź się"]].map(([mode, label]) => <button key={mode} type="button" aria-current={state.mode === mode ? "page" : undefined} onClick={() => dispatch({ type: "mode", mode })}>{label}</button>)}</nav>
      {!durable && <p role="status" className="sounding-storage">Nie udało się zapisać postępu na później. Jest dostępny tylko do zamknięcia tego warsztatu.</p>}
      {state.mode === "guide" ? <SoundingGuide state={state} dispatch={dispatch} /> : state.mode === "explore" ? <SoundingExplore /> : <div className="sounding-assessment"><h1>Odczytaj inny profil</h1><p>Nowe dane, nie wartości z przewodnika. Najpierw zapisz decyzje, potem zasadę. Powrót do przewodnika lub swobodnego odczytu będzie pomocą w otwartej próbie.</p><TransferTrial activityId="sondaz" /></div>}
      {state.mode !== "assessment" && <footer className="sounding-footer"><p>Pracujesz na syntetycznym profilu szkoleniowym B, nie na dzisiejszym radiosondażu. To nauka odczytu, nie prognoza ani ocena bezpieczeństwa lotu.</p>
        <details onToggle={event => { if (event.currentTarget.open) dispatch({ type: "help" }); }}><summary>Zakres danych, źródła i dalsza lektura</summary><p>Temperatury, punkt rosy, porcja i wiatr pochodzą z jednego syntetycznego profilu CHMURNIKA. Nie wykorzystujemy jego gotowych etykiet chmur jako dowodów. Prawdziwy balon przemieszcza się z wiatrem, a zebranie profilu trwa; nie jest to jednoczesny pomiar całej trasy.</p><ul>{Object.values(soundingSources).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" onClick={() => dispatch({ type: "help" })} onAuxClick={() => dispatch({ type: "help" })}>{source.label}</a></li>)}</ul><p>Otwieranie pomocy po zapisaniu odczytu nie zmienia jego wcześniejszego statusu. Pomoc przed uzasadnieniem jest zapisywana oddzielnie. Wyniki przewodnika nie oznaczają opanowania tematu.</p></details>
      </footer>}
    </main>
  </div>;
}
