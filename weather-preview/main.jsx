import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  ArrowCounterClockwise,
  Sun,
  Moon,
  Wind,
  Cloud,
  BookOpen,
  Check,
  Plus,
  Minus,
  FloppyDisk,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import {
  DEFAULTS,
  cleanInputs,
  calculate,
  readTrials,
  serializeTrials,
  STORAGE_KEY,
  timeLabel,
  directionLabel,
} from "./model.mjs";
import { experiments } from "./content.mjs";
import "./style.css";

const num = (value, digits = 1) =>
  value.toLocaleString("pl-PL", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
const metres = (value) => `${Math.round(value / 10) * 10} m`;
const mainSite = "https://jakiesluchawki.github.io/chmurnik/";
function initialScene() {
  return location.hash === "#chmura" ? "cloud" : "breeze";
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
  disabled,
  ends,
}) {
  return (
    <div className="control">
      <div className="control-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <div className="range-row">
        <button
          className="step"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          aria-label={`Zmniejsz: ${label}`}
        >
          <Minus />
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={display}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          className="step"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          aria-label={`Zwiększ: ${label}`}
        >
          <Plus />
        </button>
      </div>
      <div className="range-ends">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </div>
    </div>
  );
}

function Scene({ scene, input, result, playing, diagram, mini = false }) {
  const breezeScene = scene === "breeze";
  const night = breezeScene && result.night;
  const heightY = breezeScene ? 0 : 72 - (input.height / 3000) * 48;
  const baseY = breezeScene ? 0 : 72 - (result.base / 3000) * 48;
  return (
    <div
      className={`scene ${night ? "night" : ""} ${playing ? "running" : ""} ${mini ? "mini" : ""}`}
      role="img"
      aria-label={
        breezeScene
          ? `Przekrój zatoki, godzina ${timeLabel(input.hour)}. Ląd ${num(result.land)} stopnia, woda ${num(result.water)} stopnia. ${directionLabel(result.direction)} przy powierzchni.`
          : `Unoszone powietrze na ${metres(input.height)} nad ziemią. Temperatura ${num(result.parcel)} stopnia. ${result.saturated ? "Osiągnęło nasycenie." : "Jeszcze bez kondensacji."}`
      }
    >
      <img className="landscape" src="./coast.webp" alt="" />
      <div className="night-wash" />
      {!mini && (
        <span className="scene-stamp">SCHEMAT EDUKACYJNY · NIE PROGNOZA</span>
      )}
      {breezeScene ? (
        <>
          <div className="celestial" aria-hidden="true">
            {night ? <Moon weight="fill" /> : <Sun weight="fill" />}
          </div>
          <div className="scene-hour">
            {timeLabel(input.hour)}
            <small>{night ? "Noc nad zatoką" : "Dzień nad zatoką"}</small>
          </div>
          {diagram && result.direction !== "calm" && (
            <>
              <svg
                className={`circulation ${result.direction === "offshore" ? "reverse" : ""}`}
                viewBox="0 0 800 500"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{ "--flow-duration": `${12 - result.strength * 7}s` }}
              >
                <path
                  className="flow-base"
                  d="M180 335 L620 335 C730 335 730 155 620 155 L180 155 C70 155 70 335 180 335Z"
                />
                <path
                  className="flow-dots"
                  d="M180 335 L620 335 C730 335 730 155 620 155 L180 155 C70 155 70 335 180 335Z"
                />
              </svg>
              <span className="flow-arrow lower" aria-hidden="true">
                {result.direction === "onshore" ? (
                  <ArrowRight weight="bold" />
                ) : (
                  <ArrowLeft weight="bold" />
                )}
              </span>
              <span className="flow-arrow upper" aria-hidden="true">
                {result.direction === "onshore" ? (
                  <ArrowLeft weight="bold" />
                ) : (
                  <ArrowRight weight="bold" />
                )}
              </span>
              {!mini && (
                <span className="return-label">wyżej: powrót powietrza</span>
              )}
            </>
          )}
          {result.direction === "calm" && (
            <span className="calm-label">
              Podobne temperatury
              <br />
              brak wyraźnej bryzy
            </span>
          )}
          <span className="measure water">
            <small>WODA</small>
            <b>{num(result.water)}°</b>
          </span>
          <span className="measure land">
            <small>LĄD</small>
            <b>{num(result.land)}°</b>
          </span>
          <span className="scene-result">
            <Wind /> {directionLabel(result.direction)}{" "}
            <small>przy powierzchni</small>
          </span>
        </>
      ) : (
        <>
          {diagram && (
            <div className="height-scale" aria-hidden="true">
              {[3000, 2000, 1000, 0].map((h) => (
                <span key={h} style={{ top: `${((3000 - h) / 3000) * 100}%` }}>
                  {h} m
                </span>
              ))}
            </div>
          )}
          {diagram && !result.aboveScene && (
            <div className="condensation-line" style={{ top: `${baseY}%` }}>
              <span>kondensacja ≈ {metres(result.base)}</span>
            </div>
          )}
          <div
            className="parcel"
            style={{ top: `${heightY}%` }}
            aria-hidden="true"
          >
            {result.saturated ? (
              <img
                src="./cloud.webp"
                alt=""
                style={{ width: `${110 + 70 * result.growth}px` }}
              />
            ) : (
              <span className="parcel-ring">
                <ArrowRight className="up-arrow" />
              </span>
            )}
            <span className="parcel-readout">
              {metres(input.height)}
              <b>{num(result.parcel)}°C</b>
            </span>
          </div>
          <span className="scene-result">
            <Cloud />{" "}
            {result.saturated
              ? "Zaczęła się kondensacja"
              : "Jeszcze bez chmury"}
            <small>unoszona porcja powietrza</small>
          </span>
        </>
      )}
    </div>
  );
}

function App() {
  const [scene, setScene] = useState(initialScene);
  const [inputs, setInputs] = useState(DEFAULTS);
  const [playing, setPlaying] = useState(false);
  const [diagram, setDiagram] = useState(true);
  const [mode, setMode] = useState("explore");
  const [step, setStep] = useState("predict");
  const [prediction, setPrediction] = useState(null);
  const [trials, setTrials] = useState(() => {
    try {
      return readTrials(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState("");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const input = inputs[scene];
  const result = calculate(scene, input);
  const data = experiments[scene];
  const currentTrials = trials.filter((t) => t.scene === scene).slice(-2);
  const locked = mode === "guided" && step === "predict";
  const tested = scene === "breeze" ? input.hour === 2 : input.humidity === 70;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(media.matches);
      setPlaying(false);
    };
    media.addEventListener("change", change);
    const hidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hidden);
    const hash = () => {
      setScene(initialScene());
      setPlaying(false);
      setMode("explore");
      setStep("predict");
      setPrediction(null);
    };
    window.addEventListener("hashchange", hash);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("hashchange", hash);
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => {
        setInputs((old) => ({
          ...old,
          [scene]:
            scene === "breeze"
              ? { ...old.breeze, hour: (old.breeze.hour + 0.5) % 24 }
              : { ...old.cloud, height: Math.min(3000, old.cloud.height + 50) },
        }));
      },
      scene === "breeze" ? 900 : 400,
    );
    return () => clearInterval(timer);
  }, [playing, scene]);
  useEffect(() => {
    if (scene === "cloud" && input.height >= 3000) setPlaying(false);
  }, [scene, input.height]);

  function update(key, value) {
    setPlaying(false);
    if (mode === "guided" && step === "explain") setStep("experiment");
    setInputs((old) => ({
      ...old,
      [scene]: cleanInputs(scene, { ...old[scene], [key]: value }),
    }));
  }
  function chooseScene(next) {
    setScene(next);
    setPlaying(false);
    setMode("explore");
    setStep("predict");
    setPrediction(null);
    setNotice("");
    history.replaceState(null, "", next === "cloud" ? "#chmura" : "#bryza");
  }
  function chooseMode(next) {
    setMode(next);
    setStep("predict");
    setPrediction(null);
    setPlaying(false);
    if (next === "guided")
      setInputs((old) => ({
        ...old,
        [scene]:
          scene === "breeze"
            ? { hour: 14, heating: 70 }
            : { temperature: 24, humidity: 40, height: 1500 },
      }));
  }
  function storeTrials(next) {
    setTrials(next);
    try {
      localStorage.setItem(STORAGE_KEY, serializeTrials(next));
      return true;
    } catch {
      return false;
    }
  }
  function saveTrial() {
    setPlaying(false);
    if (
      currentTrials.length &&
      JSON.stringify(currentTrials.at(-1).input) === JSON.stringify(input)
    ) {
      setNotice(
        "Ta próba jest już zapisana. Zmień jeden warunek i zapisz kolejny wynik.",
      );
      return;
    }
    const saved = storeTrials(
      [
        ...trials,
        { id: crypto.randomUUID(), scene, input: { ...input } },
      ].slice(-8),
    );
    setNotice(
      saved
        ? "Próba zapisana. Porównanie znajdziesz poniżej."
        : "Próba jest dostępna do zamknięcia tej strony. Przeglądarka nie pozwoliła jej zapisać na później.",
    );
  }
  function reset() {
    setPlaying(false);
    setInputs((old) => ({ ...old, [scene]: { ...DEFAULTS[scene] } }));
    setMode("explore");
    setStep("predict");
    setPrediction(null);
  }

  return (
    <>
      <header className="topbar">
        <a href={mainSite} aria-label="Wróć do CHMURNIKA">
          <img src="./wordmark.png" alt="CHMURNIK" />
        </a>
        <span className="preview-tag">
          Pracownia pogody <span>· podgląd</span>
        </span>
        <a className="back-link" href={`${mainSite}#/layers`}>
          <ArrowLeft /> Warstwy
        </a>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">JAK POWSTAJE POGODA</p>
            <h1>Niebo ma swoje powody.</h1>
          </div>
          <p>
            Zmień warunki, obserwuj skutki i porównaj dwie próby. Tutaj możesz
            zatrzymać pogodę, żeby lepiej ją zrozumieć.
          </p>
        </div>
        <nav className="experiment-nav" aria-label="Wybierz eksperyment">
          {Object.entries(experiments).map(([key, exp]) => (
            <button
              key={key}
              aria-pressed={scene === key}
              onClick={() => chooseScene(key)}
            >
              <span>{exp.number}</span>
              {exp.short}
              {key === "breeze" ? <Wind /> : <Cloud />}
            </button>
          ))}
        </nav>
        <div className="workshop-title">
          <div>
            <p className="eyebrow">EKSPERYMENT {data.number} / 02</p>
            <h2>{data.title}</h2>
          </div>
          <div className="mode-switch" aria-label="Sposób nauki">
            <button
              aria-pressed={mode === "explore"}
              onClick={() => chooseMode("explore")}
            >
              Eksperymentuj
            </button>
            <button
              aria-pressed={mode === "guided"}
              onClick={() => chooseMode("guided")}
            >
              Zadanie z wyjaśnieniem
            </button>
          </div>
        </div>
        {mode === "guided" && (
          <section className="challenge" aria-labelledby="challenge-heading">
            <div className="challenge-step">
              {step === "predict"
                ? "1 · PRZEWIDŹ"
                : step === "experiment"
                  ? "2 · SPRAWDŹ"
                  : "3 · WYJAŚNIJ"}
            </div>
            {step === "predict" ? (
              <>
                <h3 id="challenge-heading">{data.question}</h3>
                <div className="answers">
                  {data.choices.map((choice, i) => (
                    <button
                      aria-pressed={prediction === i}
                      key={choice}
                      onClick={() => setPrediction(i)}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {choice}
                    </button>
                  ))}
                </div>
                <button
                  className="primary"
                  disabled={prediction === null}
                  onClick={() => setStep("experiment")}
                >
                  Sprawdź w doświadczeniu <ArrowRight />
                </button>
              </>
            ) : step === "experiment" ? (
              <>
                <h3 id="challenge-heading">{data.instruction}</h3>
                <p>
                  Obserwuj rysunek i wartości. Wyjaśnienie odsłonisz po
                  wykonaniu próby.
                </p>
                <button
                  className="primary"
                  disabled={!tested}
                  onClick={() => setStep("explain")}
                >
                  Pokaż wyjaśnienie <ArrowRight />
                </button>
              </>
            ) : (
              <>
                <h3 id="challenge-heading">
                  {prediction === data.correct
                    ? "Twoje przewidywanie się potwierdziło."
                    : "Wynik jest inny niż Twoje przewidywanie."}
                </h3>
                <p>{data.explanation}</p>
                <button className="plain" onClick={() => chooseMode("guided")}>
                  <ArrowsClockwise /> Powtórz zadanie
                </button>
              </>
            )}
          </section>
        )}
        <section className="workbench" aria-label={data.short}>
          <div className="scene-area">
            <Scene
              {...{ scene, input, result, diagram }}
              playing={playing && !reduced}
            />
            <div className="scene-toolbar">
              <button
                className="plain"
                disabled={mode === "guided"}
                onClick={() => {
                  if (scene === "cloud" && input.height === 3000)
                    update("height", 0);
                  setPlaying((p) => !p);
                }}
              >
                {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
                {playing
                  ? "Zatrzymaj"
                  : scene === "breeze"
                    ? "Uruchom dobę"
                    : "Unoś powietrze"}
              </button>
              <button
                className="plain"
                aria-pressed={diagram}
                onClick={() => setDiagram((d) => !d)}
              >
                {diagram ? "Ukryj schemat" : "Pokaż schemat"}
              </button>
              <button className="plain" onClick={reset}>
                <ArrowCounterClockwise /> Od nowa
              </button>
            </div>
            {reduced && (
              <p className="motion-note">
                Ograniczony ruch: wartości zmieniają się skokowo, bez płynnej
                animacji.
              </p>
            )}
          </div>
          <aside className="controls">
            <p className="eyebrow">TWOJE WARUNKI</p>
            <p className="controls-intro">{data.intro}</p>
            {scene === "breeze" ? (
              <>
                <Slider
                  id="hour"
                  label="Pora dnia"
                  value={input.hour}
                  min={0}
                  max={23.5}
                  step={0.5}
                  display={timeLabel(input.hour)}
                  onChange={(v) => update("hour", v)}
                  disabled={locked}
                  ends={["00:00", "23:30"]}
                />
                <div className="presets">
                  <button disabled={locked} onClick={() => update("hour", 2)}>
                    <Moon /> 02:00
                  </button>
                  <button disabled={locked} onClick={() => update("hour", 14)}>
                    <Sun /> 14:00
                  </button>
                </div>
                <Slider
                  id="heating"
                  label="Kontrast nagrzewania"
                  value={input.heating}
                  min={0}
                  max={100}
                  step={10}
                  display={`${input.heating}%`}
                  onChange={(v) => update("heating", v)}
                  disabled={mode === "guided"}
                  ends={["Brak różnicy", "Duża różnica"]}
                />
                <div className="instrument">
                  <span>Różnica: ląd − woda</span>
                  <strong>
                    {result.difference > 0 ? "+" : ""}
                    {num(result.difference)}°C
                  </strong>
                  <p>
                    {result.direction === "calm"
                      ? "Przy podobnych temperaturach lokalny obieg zanika."
                      : result.direction === "onshore"
                        ? "W tym ustawieniu cieplejszy jest ląd."
                        : "W tym ustawieniu cieplejsza jest woda."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Slider
                  id="temperature"
                  label="Temperatura przy ziemi"
                  value={input.temperature}
                  min={5}
                  max={35}
                  display={`${input.temperature}°C`}
                  onChange={(v) => update("temperature", v)}
                  disabled={mode === "guided"}
                  ends={["5°C", "35°C"]}
                />
                <Slider
                  id="humidity"
                  label="Wilgotność przy ziemi"
                  value={input.humidity}
                  min={20}
                  max={100}
                  step={5}
                  display={`${input.humidity}%`}
                  onChange={(v) => update("humidity", v)}
                  disabled={locked}
                  ends={["20%", "100%"]}
                />
                <Slider
                  id="height"
                  label="Uniesienie nad ziemię"
                  value={input.height}
                  min={0}
                  max={3000}
                  step={50}
                  display={metres(input.height)}
                  onChange={(v) => update("height", v)}
                  disabled={mode === "guided"}
                  ends={["Poziom ziemi", "3000 m"]}
                />
                <div className="instrument">
                  <span>Szacowany poziom kondensacji</span>
                  <strong>≈ {metres(result.base)}</strong>
                  <p>
                    {result.aboveScene
                      ? "Powyżej zakresu tej sceny. Nie dorysowujemy chmury na granicy wykresu."
                      : `Punkt rosy przy ziemi: ${num(result.dew)}°C. To temperatura, przy której początkowe powietrze osiągnęłoby nasycenie przy niezmienionym ciśnieniu.`}
                  </p>
                </div>
              </>
            )}
            <button
              className="primary save-button"
              onClick={saveTrial}
              disabled={locked}
            >
              <FloppyDisk /> Zapisz próbę do porównania
            </button>
          </aside>
        </section>
        <p className="notice" role="status">
          {notice}
        </p>
        {!locked && (
          <section className="comparison" aria-labelledby="comparison-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ZACHOWAJ WYNIK I ZMIEŃ JEDEN WARUNEK</p>
                <h2 id="comparison-heading">Co zmieniło się między próbami?</h2>
              </div>
              {currentTrials.length > 0 && (
                <button
                  className="plain"
                  onClick={() => {
                    const ok = storeTrials(
                      trials.filter((t) => t.scene !== scene),
                    );
                    setNotice(
                      ok
                        ? "Usunięto porównanie tego eksperymentu."
                        : "Usunięto porównanie z tej sesji; zapis przeglądarki jest niedostępny.",
                    );
                  }}
                >
                  Wyczyść porównanie
                </button>
              )}
            </div>
            {currentTrials.length === 0 ? (
              <p className="empty">
                Zapisz pierwszą próbę przyciskiem obok sceny. Potem zmień porę
                dnia albo wilgotność i zapisz drugą. Porównanie zostaje tylko w
                tej przeglądarce.
              </p>
            ) : (
              <div className="comparison-grid">
                {currentTrials.map((trial, i) => (
                  <article className="trial" key={trial.id}>
                    <header>
                      <b>Próba {String.fromCharCode(65 + i)}</b>
                      <button
                        className="plain"
                        onClick={() => {
                          setInputs((old) => ({
                            ...old,
                            [scene]: { ...trial.input },
                          }));
                          setPlaying(false);
                          setMode("explore");
                          setNotice("Przywrócono ustawienia zapisanej próby.");
                          document
                            .getElementById("root")
                            .scrollIntoView({ behavior: "instant" });
                        }}
                      >
                        Przywróć ustawienia <ArrowRight />
                      </button>
                    </header>
                    <Scene
                      scene={scene}
                      input={trial.input}
                      result={calculate(scene, trial.input)}
                      diagram
                      mini
                    />
                    <p>
                      {scene === "breeze"
                        ? `${timeLabel(trial.input.hour)} · kontrast ${trial.input.heating}% · ${directionLabel(calculate(scene, trial.input).direction)}`
                        : `${trial.input.temperature}°C · wilgotność ${trial.input.humidity}% · uniesienie ${metres(trial.input.height)} · kondensacja ≈ ${metres(calculate(scene, trial.input).base)}`}
                    </p>
                  </article>
                ))}
                {currentTrials.length === 1 && (
                  <div className="empty second-trial">
                    <span>B</span>
                    <p>Teraz zmień jeden warunek i zapisz drugą próbę.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        {!locked && (
          <>
            <section className="read-on">
              <div>
                <p className="eyebrow">DALEJ W CHMURNIKU</p>
                <h2>Od doświadczenia do wyjaśnienia.</h2>
                <p>
                  Ten podgląd uzupełnia pełne lekcje. Nie zastępuje atlasu,
                  Warstw ani narzędzi METAR i Windy.
                </p>
              </div>
              <a
                className="lesson-link"
                href={`${mainSite}#/learn/${data.lesson}`}
              >
                <BookOpen />
                {data.lessonLabel}
                <ArrowRight />
              </a>
            </section>
            <details className="method">
              <summary>Źródła, założenia i granice tego doświadczenia</summary>
              <p>{data.limits}</p>
              <p>
                Ilustracje są stylizowanymi modelami, nie fotografiami służącymi
                do rozpoznawania chmur. Ten moduł nie jest narzędziem do
                planowania lotu ani żeglugi.
              </p>
              <a href={data.source} target="_blank" rel="noreferrer">
                {data.sourceLabel} <ArrowRight />
              </a>
              {scene === "cloud" && (
                <a
                  href="https://www.weather.gov/media/zhu/ZHU_Training_Page/Met_Tutorials/Forecasters_Reference_Book_1997.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Podręcznik meteorologiczny: unoszenie, adiabaty i kondensacja{" "}
                  <ArrowRight />
                </a>
              )}
            </details>
          </>
        )}
        {mode === "guided" && step === "explain" && (
          <section className="recap">
            <h3>Co zabierasz z tego doświadczenia</h3>
            {data.recap.map((line) => (
              <p key={line}>
                <Check />
                {line}
              </p>
            ))}
          </section>
        )}
      </main>
      <footer>
        <span>CHMURNIK · Pracownia pogody · podgląd 08.09.2026</span>
        <span>Bez logowania, zdjęć i przesyłania wyników.</span>
        <a href={`${mainSite}assetySM/`}>
          Materiały do udostępnienia <ArrowRight />
        </a>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
