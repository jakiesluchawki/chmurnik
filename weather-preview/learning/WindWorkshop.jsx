import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ArrowCounterClockwise } from "@phosphor-icons/react";
import {
  windStations, windSources, windPosition, wavePosition, waveTrail, windFrameDescription, canReadSequence,
  currentWindRecord, loadWindSession, persistWindSession, updateWindSession,
} from "./wind-workshop.mjs";
import { TransferTrial } from "./TransferTrial.jsx";
import { markTransferHelp } from "./transfer-state.mjs";
import { returnLesson } from "../tutorial.mjs";
import "./wind-workshop.css";

export function WindField({ station, frame }) {
  const gridId = `wind-grid-${useId().replace(/:/g, "")}`;
  const lower = windPosition(station.lower, frame), upper = station.upper === null ? null : windPosition(station.upper, frame);
  const wave = wavePosition(frame);
  return <svg className="wind-field" viewBox="0 0 600 330" role="img" aria-label={windFrameDescription(station, frame)}>
    <defs><pattern id={gridId} width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#81754830" /></pattern></defs>
    <rect width="600" height="330" rx="20" fill="#eee0ed" /><rect width="600" height="330" rx="20" fill={`url(#${gridId})`} />
    {station.stationary ? <><path d="M0 325L180 250L270 170L340 250L480 300L600 325Z" fill="#9a9565" /><path d="M0 325L270 225L330 275L600 325Z" fill="#b4aa7d" /></> : <path d="M0 310Q150 240 330 290T600 280V330H0Z" fill="#b5b0ca" />}
    {!station.stationary && <g><path d="M552 64V24M544 34L552 24L560 34" fill="none" stroke="#6d6539" strokeWidth="3" /><text x="543" y="94">N</text><text x="22" y="174">W</text><text x="557" y="174">E</text><text x="291" y="318">S</text></g>}
    {station.stationary ? <>
      <image href="./cloud.webp" x="235" y="60" width="145" height="90" />
      {frame > 0 && <path d={waveTrail(frame)} fill="none" stroke="#7442d9" strokeDasharray="6 6" strokeWidth="3" />}
      <circle cx={wave.x} cy={wave.y} r="11" fill="#7442d9" />
    </> : <>
      {[station.lower, ...(station.upper === null ? [] : [station.upper])].map((direction, i) => <g key={i}>
        {[0, 1, 2].slice(0, frame + 1).map(n => {
          const point = windPosition(direction, n);
          return <circle key={n} cx={point.x} cy={point.y + (i ? -23 : 23)} r="5" fill={i ? "#537598" : "#7442d9"} opacity=".4" />;
        })}
      </g>)}
      <image href="./cloud.webp" x={lower.x - 42} y={lower.y - 5} width="95" height="60" />
      <circle cx={lower.x} cy={lower.y + 23} r="17" fill="#7442d9" /><text className="wind-marker-number" x={lower.x} y={lower.y + 31}>1</text>
      {upper && <><image href="./cloud.webp" x={upper.x - 37} y={upper.y - 48} width="85" height="50" opacity=".72" /><circle cx={upper.x} cy={upper.y - 23} r="17" fill="#537598" /><text className="wind-marker-number" x={upper.x} y={upper.y - 15}>2</text></>}
    </>}
  </svg>;
}

function SourceLinks({ station }) {
  return <div className="wind-source-links">{(station.stationary ? [windSources[1], windSources[3]] : [windSources[0], windSources[2]]).map(source =>
    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>;
}
function Choices({ options, value, onChange, directions = false }) {
  return <fieldset className={directions ? "wind-direction-choices" : "wind-statement-choices"}>
    <legend>Wybierz jedną odpowiedź</legend>{options.map(([key, label]) =>
      <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>{label}</button>)}
  </fieldset>;
}
const choiceLabel = (options, value) => options.find(([id]) => id === value)?.[1];

export function WindWorkshop({ mainSite }) {
  const [state, setState] = useState(loadWindSession), [notice, setNotice] = useState("");
  const live = useRef(state), focusPending = useRef(null), phaseHeading = useRef(null), introHeading = useRef(null);
  const { index, frame, seen, mode } = state, station = windStations[index], record = currentWindRecord(state);
  const ready = canReadSequence(seen), completed = Boolean(record?.evidence);
  const first = state.records.find(item => item.station === station.id);
  const lesson = returnLesson(globalThis.location?.search || "", "wiatr");
  const helpId = useId();
  useEffect(() => { document.title = "Czytaj ruch powietrza · CHMURNIK"; }, []);
  useEffect(() => { if (mode === "guide") markTransferHelp("wiatr"); }, [mode]);
  useEffect(() => {
    if (focusPending.current) {
      const target = ["next", "retry", "restart"].includes(focusPending.current) ? introHeading : phaseHeading;
      target.current?.focus();
      focusPending.current = null;
    }
  }, [state]);
  function send(action) {
    const next = updateWindSession(live.current, action);
    if (next === live.current) return;
    const saved = persistWindSession(next);
    live.current = saved.state;
    focusPending.current = ["commit", "explain", "next", "retry", "restart"].includes(action.type) ? action.type : null;
    setState(saved.state);
    setNotice(saved.durable ? "" : "Zapis w przeglądarce jest niedostępny. Próba pozostaje w tej karcie; po jej zamknięciu może zniknąć.");
  }
  function changeMode(next) {
    if (live.current.mode === "assessment" && next !== "assessment") markTransferHelp("wiatr");
    send({ type: "mode", mode: next });
  }
  function leaveWorkshop() { if (live.current.mode === "assessment") markTransferHelp("wiatr"); }
  return <div className="wind-workshop"><header className="wind-header">
    <a href="#pracownia" onClick={leaveWorkshop}><ArrowLeft aria-hidden="true" />Pracownia</a>
    <a href={`${mainSite}#/learn/${lesson}`} onClick={leaveWorkshop}><BookOpen aria-hidden="true" />Lekcja o wietrze</a>
  </header><main>
    <nav className="wind-modes" aria-label="Sposób pracy z wiatrem">
      <button aria-pressed={mode === "guide"} onClick={() => changeMode("guide")}>Czytaj obserwacje</button>
      <button aria-pressed={mode === "assessment"} onClick={() => changeMode("assessment")}>Sprawdź się</button>
    </nav>
    {mode === "assessment" ? <><TransferTrial activityId="wiatr" />{notice && <p role="status">{notice}</p>}</> : <>
      <header className="wind-intro"><p className="eyebrow">Obserwacja {index + 1} z 3 · dane syntetyczne, nie prognoza</p><h1 ref={introHeading} tabIndex={-1}>{station.title}</h1><p>{station.task}</p></header>
      <div className="wind-workbench"><section aria-label="Sekwencja ruchu powietrza">
        <p className="wind-scene-key">{station.stationary ? "Przekrój nad grzbietem. Biała bryła: umowny obrys chmury. Kropka: porcja powietrza." :
          station.upper === null ? "Widok z góry. 1: fragment chmury. N: północ, E: wschód, S: południe, W: zachód." :
            "Widok z góry. 1: niższa warstwa. 2: wyższa warstwa. N: północ, E: wschód, S: południe, W: zachód."}</p>
        <WindField station={station} frame={frame} />
        <div className="wind-frames" role="group" aria-label="Wybierz chwilę obserwacji">
          {["Początek", "W trakcie", "Koniec"].map((label, n) => <button key={label} aria-pressed={frame === n} onClick={() => send({ type: "frame", frame: n })}>
            {label}{seen.includes(n) && <Check aria-hidden="true" />}
          </button>)}
        </div>
        <p className="wind-sr-only" role="status" aria-live="polite" aria-atomic="true">{windFrameDescription(station, frame)}</p>
        <p className="wind-field-note">{station.stationary ? "Schemat bez skali. Przełączanie chwil nie pokazuje rzeczywistego tempa ruchu." :
          "Zakładamy dryf fragmentów z wiatrem na ich poziomach. Bez skali odległości, wysokości i czasu."}</p>
      </section>
      <section className="wind-decision" aria-label="Wniosek i dowód">
        <p className="wind-step">{!ready ? "1. Obserwuj" : !record ? "2. Zapisz wniosek" : !completed ? "3. Wskaż dowód" : "4. Porównaj"}</p>
        <h2 ref={phaseHeading} tabIndex={-1}>{!ready ? "Co zmieniło położenie?" : !record ? station.question : !completed ? station.evidenceQuestion : "Wniosek i dowód to dwie rzeczy"}</h2>
        {!ready ? <p>Obejrzyj początek i koniec. Potem pojawi się pytanie. Możesz wracać do każdej chwili bez limitu.</p> : !record ? <>
          <Choices options={station.options} value={state.draft} directions={station.id === "drift"} onChange={answer => send({ type: "answer", answer })} />
          <button className="wind-primary" disabled={state.draft === null} onClick={() => send({ type: "commit" })}>Zapisz wniosek<ArrowRight aria-hidden="true" /></button>
        </> : <>
          <p className="wind-locked"><strong>Zapisany wniosek:</strong> {choiceLabel(station.options, record.answer)}.<br />{record.helped ? "Z pomocą." : "Bez otwierania pomocy w tej próbie."}{record.repeated && " Powtórka, nie pierwsza próba."}</p>
          {!completed ? <>
            <p>Wniosek jest już zablokowany. Wróć do rysunku i wybierz obserwację, na której go opierasz.</p>
            <Choices options={station.evidenceOptions} value={state.evidenceDraft} onChange={answer => send({ type: "evidence", answer })} />
            <button className="wind-primary" disabled={state.evidenceDraft === null} onClick={() => send({ type: "explain" })}>Zapisz dowód i porównaj<ArrowRight aria-hidden="true" /></button>
          </> : <div className="wind-result">
            <p><strong>Wniosek:</strong> {record.correct ? "zgodny z modelem" : "do poprawy"}. <strong>Odczyt dowodu:</strong> {record.evidenceCorrect ? "zgodny z rysunkiem" : "do poprawy"}{record.evidenceHelped ? " (z pomocą)" : " (bez otwierania pomocy)"}.</p>
            <p><strong>Twój dowód:</strong> {choiceLabel(station.evidenceOptions, record.evidence)}.</p>
            <p>{station.explanation}</p><p>{station.evidence}</p>
            <SourceLinks station={station} />
            <button className="wind-primary" onClick={() => index < 2 ? send({ type: "next" }) : changeMode("assessment")}>
              {index < 2 ? "Porównaj kolejny przypadek" : "Rozwiąż nowe przypadki"}<ArrowRight aria-hidden="true" />
            </button>
          </div>}
        </>}
        {ready && !completed && <>
          <button className="wind-help-toggle" aria-expanded={state.helpOpen} aria-controls={helpId} onClick={() => send({ type: "help", open: !state.helpOpen })}>
            {state.helpOpen ? "Zamknij pomoc" : "Potrzebuję pomocy (zostanie odnotowana)"}
          </button>
          {state.helpOpen && <aside id={helpId} className="wind-help"><p>{station.stationary ?
            "Porównaj oddzielnie położenie obrysu i kropki. Nie wnioskuj o całym powietrzu z jednego obiektu." :
            "Kierunek meteorologiczny mówi, skąd napływa powietrze. Prześledź każdy znacznik od początku do końca względem siatki."}</p>
            <SourceLinks station={station} />
          </aside>}
        </>}
        {notice && <p role="status">{notice}</p>}
      </section></div>
      {completed && <div className="wind-replay"><button className="wind-reset" onClick={() => send({ type: "retry" })}><ArrowCounterClockwise aria-hidden="true" />Powtórz obserwację</button>
        {index > 0 && <button className="wind-reset" onClick={() => send({ type: "restart" })}>Wróć do pierwszej obserwacji</button>}
      </div>}
      {first && (completed || record?.repeated) && <p className="wind-history"><strong>Pierwszy zapis tego przypadku:</strong> {choiceLabel(station.options, first.answer)}. {first.legacy ? "Starszy zapis: brak danych o pomocy i odczycie dowodu." :
        `${first.helped ? "Wniosek z pomocą" : "Wniosek bez otwierania pomocy"}; ${first.evidence ? `dowód ${first.evidenceCorrect ? "zgodny z rysunkiem" : "do poprawy"}${first.evidenceHelped ? ", z pomocą" : ", bez otwierania pomocy"}` : "dowód jeszcze niezapisany"}.`} Powtórka go nie zastępuje.</p>}
      <p className="wind-footer-note">To ćwiczenie odczytu ruchu, nie pomiar wiatru ani ocena bezpieczeństwa lotu. Samo przełączenie chwil nie sprawdza rozumienia.</p>
      {completed && <details className="wind-sources"><summary>Granice modelu i dalsza nauka</summary><p>Rysunek nie wyjaśnia powstawania całego pola wiatru. Różnice ciśnienia i ogrzewania poznasz w osobnej pracowni. Ruch chmur nie wystarcza do określenia wiatru przy ziemi.</p><a href="?from=wiatr#bryza">Zbadaj, dlaczego powstaje bryza</a></details>}
    </>}
  </main></div>;
}
