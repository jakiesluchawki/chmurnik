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
  Drop,
  Thermometer,
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
import { sceneAppearance } from "./presentation.mjs";
import { useSceneMotion } from "./motion.jsx";
import { ParcelControl } from "./parcel-control.jsx";
import {
  guides,
  guideInputsAt,
  guideStepComplete,
  quizCases,
  sceneHashes,
  sceneFromHash,
  returnLesson,
} from "./tutorial.mjs";
import "./style.css";

const num = (value, digits = 1) =>
  value.toLocaleString("pl-PL", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
const metres = (value) => `${Math.round(value / 10) * 10} m`;
const mainSite = location.pathname.includes("/pogoda-preview/")
  ? new URL("../", location.href).href
  : "https://jakiesluchawki.github.io/chmurnik/";
function initialScene() {
  return sceneFromHash(location.hash);
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  nudge = step,
  display,
  onChange,
  disabled,
  ends,
}) {
  const ratio = (value - min) / (max - min);
  const Handle =
    id === "cooling"
      ? Moon
      : id === "humidity"
        ? Drop
        : id === "temperature"
          ? Thermometer
          : Sun;
  return (
    <div className={`control ${disabled ? "disabled" : ""}`}>
      <div className="control-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <div className="range-row">
        <button
          className="step"
          onClick={() =>
            onChange(Math.max(min, Number((value - nudge).toFixed(3))))
          }
          disabled={disabled || value <= min}
          aria-label={`Zmniejsz: ${label}`}
        >
          <Minus />
        </button>
        <div className={`range-track handle-${id}`}>
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            style={{ "--range-fill": `${ratio * 100}%` }}
            disabled={disabled}
            aria-valuetext={display}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span
            className="range-thumb"
            style={{ left: `calc(${ratio * 100}% + ${22 - 44 * ratio}px)` }}
            aria-hidden="true"
          >
            {id === "height" ? (
              <img src="./cloud.webp" alt="" />
            ) : (
              <Handle weight="fill" />
            )}
          </span>
        </div>
        <button
          className="step"
          onClick={() =>
            onChange(Math.min(max, Number((value + nudge).toFixed(3))))
          }
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

function Scene({
  scene,
  input: target,
  playing,
  diagram,
  reduced,
  mini = false,
  onHeightChange,
}) {
  const { input, flowOffset } = useSceneMotion(
    scene,
    target,
    playing,
    reduced || mini,
  );
  const result = calculate(scene, input);
  const appearance = sceneAppearance(scene, input);
  const breezeScene = scene === "breeze";
  const fogScene = scene === "fog";
  const humidityLabel = fogScene
    ? result.saturated
      ? "100"
      : result.relative >= 99.9
        ? "<100"
        : num(result.relative)
    : "";
  const night = breezeScene && appearance.night > 0.5;
  const heightY = scene === "cloud" ? 72 - (input.height / 3000) * 48 : 0;
  const baseY = scene === "cloud" ? 72 - (result.base / 3000) * 48 : 0;
  return (
    <>
      <div
        className={`scene scene-${scene} ${night ? "night" : ""} ${playing ? "running" : ""} ${mini ? "mini" : ""}`}
      >
        <div
          className="scene-visual"
          role="img"
          aria-label={
            breezeScene
              ? `Przekrój zatoki, godzina ${timeLabel(input.hour)}. Ląd ${num(result.land)} stopnia, woda ${num(result.water)} stopnia. ${directionLabel(result.direction)} przy powierzchni.`
              : fogScene
                ? `Powietrze przy gruncie: ${num(result.current)} stopnia, wilgotność względna ${humidityLabel.replace("<", "mniej niż ")} procent. ${result.saturated ? "Warunki do kondensacji." : "Jeszcze bez kondensacji."}`
                : `Unoszone powietrze na ${metres(input.height)} nad ziemią. Temperatura ${num(result.parcel)} stopnia. ${result.saturated ? "Osiągnęło nasycenie." : "Jeszcze bez kondensacji."}`
          }
        >
          <img
            className="landscape"
            src={fogScene ? "./valley.webp" : "./coast.webp"}
            alt=""
          />
          <div
            className="night-wash"
            style={{ opacity: breezeScene ? appearance.night * 0.74 : 0 }}
          />
          {!mini && (
            <span className="scene-stamp">
              SCHEMAT EDUKACYJNY · NIE PROGNOZA
            </span>
          )}
          {breezeScene ? (
            <>
              <div className="celestial" aria-hidden="true">
                <Sun
                  weight="fill"
                  style={{
                    opacity: 1 - appearance.night,
                    transform: `translateY(${appearance.night * 14}px)`,
                  }}
                />
                <Moon
                  weight="fill"
                  style={{
                    opacity: appearance.night,
                    transform: `translateY(${(1 - appearance.night) * -14}px)`,
                  }}
                />
              </div>
              <div className="scene-hour">
                {timeLabel(input.hour)}
                <small>{night ? "Noc nad zatoką" : "Dzień nad zatoką"}</small>
              </div>
              {diagram && (
                <div className="airflow" style={{ opacity: appearance.flow }}>
                  <svg
                    className={`circulation ${result.direction === "offshore" ? "reverse" : ""}`}
                    viewBox="0 0 800 500"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      className="flow-base"
                      d="M180 335 L620 335 C730 335 730 155 620 155 L180 155 C70 155 70 335 180 335Z"
                    />
                    <path
                      className="flow-dots"
                      style={{ strokeDashoffset: flowOffset }}
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
                    <span className="return-label">
                      wyżej: powrót powietrza
                    </span>
                  )}
                </div>
              )}
              <span className="measure water">
                <small>WODA</small>
                <b>{num(result.water)}°</b>
                <meter
                  min="5"
                  max="35"
                  value={result.water}
                  aria-hidden="true"
                />
              </span>
              <span className="measure land">
                <small>LĄD</small>
                <b>{num(result.land)}°</b>
                <meter
                  min="5"
                  max="35"
                  value={result.land}
                  aria-hidden="true"
                />
              </span>
              <span className="scene-result">
                <Wind /> {directionLabel(result.direction)}{" "}
                <small>przy powierzchni</small>
              </span>
            </>
          ) : fogScene ? (
            <>
              <div className="fog-readout">
                <Moon weight="fill" />
                <span>POWIETRZE PRZY ZIEMI</span>
                <b>{num(result.current)}°C</b>
                <small>Wilgotność względna: {humidityLabel}%</small>
                <meter
                  min="0"
                  max="100"
                  value={result.relative}
                  aria-hidden="true"
                />
              </div>
              <div
                className="fog-layer"
                aria-hidden="true"
                style={{ opacity: appearance.opacity }}
              >
                <img src="./fog.webp" alt="" />
              </div>
              {diagram && (
                <span className="fog-dew">
                  Początkowy punkt rosy: {num(result.initialDew)}°C
                </span>
              )}
            </>
          ) : (
            <>
              {diagram && (
                <div className="height-scale" aria-hidden="true">
                  {[3000, 2000, 1000, 0].map((h) => (
                    <span
                      key={h}
                      style={{ top: `${((3000 - h) / 3000) * 100}%` }}
                    >
                      {h} m
                    </span>
                  ))}
                </div>
              )}
              {diagram && !result.aboveScene && (
                <div
                  className="condensation-line"
                  style={{ top: `${baseY}%` }}
                />
              )}
              <div
                className="parcel"
                style={{ top: `${heightY}%` }}
                aria-hidden="true"
              >
                <div className="parcel-visual">
                  <img
                    src="./cloud.webp"
                    alt=""
                    style={{
                      opacity: appearance.opacity,
                      transform: `scale(${appearance.scale})`,
                    }}
                  />
                  <span
                    className="parcel-ring"
                    style={{ opacity: 1 - appearance.opacity }}
                  >
                    <ArrowRight className="up-arrow" />
                  </span>
                </div>
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
        {scene === "cloud" && !mini && onHeightChange && (
          <ParcelControl
            value={target.height}
            position={heightY}
            onChange={onHeightChange}
          />
        )}
      </div>
      {!mini && scene === "cloud" && diagram && (
        <p className="scene-caption">
          {result.aboveScene
            ? `Kondensacja ≈ ${metres(result.base)}, powyżej rysunku.`
            : `Przerywana linia: kondensacja ≈ ${metres(result.base)}.`}
        </p>
      )}
      {!mini && fogScene && (
        <p className="scene-caption fog-caption">
          <b>
            {result.saturated
              ? "Warunki do kondensacji przy ziemi"
              : "Jeszcze bez kondensacji"}
          </b>
          <span>
            Mgła gęstnieje na rysunku po nasyceniu. To ilustracja, nie pomiar
            widzialności.
          </span>
        </p>
      )}
    </>
  );
}

function App() {
  const [scene, setScene] = useState(initialScene);
  const [inputs, setInputs] = useState(() =>
    Object.fromEntries(
      Object.keys(guides).map((key) => [key, guideInputsAt(key, 0)]),
    ),
  );
  const [playing, setPlaying] = useState(false);
  const [diagram, setDiagram] = useState(true);
  const [mode, setMode] = useState("tutorial");
  const [guideIndex, setGuideIndex] = useState(0);
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
  const quiz = quizCases[scene];
  const tested = input[quiz.key] === quiz.target;
  const guide = guides[scene];
  const guideStep = guide.steps[guideIndex];
  const tutorial = mode === "tutorial";
  const guideDone = tutorial && !guideStep;
  const stepDone = guideStepComplete(scene, guideIndex, input);
  const lesson = returnLesson(location.search, data.lesson);
  const lessonHref = `${mainSite}#/learn/${lesson}`;
  const showControl = (key) => !tutorial || guideStep?.key === key;
  const controlDisabled = (key) =>
    locked || (mode === "guided" && key !== quiz.key);

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
      if (
        Object.values(sceneHashes).some((hash) => `#${hash}` === location.hash)
      )
        chooseScene(initialScene());
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
              ? {
                  ...old.breeze,
                  hour:
                    old.breeze.hour > 23
                      ? 0
                      : Number((old.breeze.hour + 0.5).toFixed(1)),
                }
              : scene === "cloud"
                ? {
                    ...old.cloud,
                    height: Math.min(3000, old.cloud.height + 50),
                  }
                : { ...old.fog, cooling: Math.min(10, old.fog.cooling + 0.5) },
        }));
      },
      scene === "breeze" ? 900 : 400,
    );
    return () => clearInterval(timer);
  }, [playing, scene]);
  useEffect(() => {
    if (scene === "cloud" && input.height >= 3000) setPlaying(false);
    if (scene === "fog" && input.cooling >= 10) setPlaying(false);
  }, [scene, input.height, input.cooling]);

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
    setMode("tutorial");
    setGuideIndex(0);
    setInputs((old) => ({ ...old, [next]: guideInputsAt(next, 0) }));
    setDiagram(true);
    setStep("predict");
    setPrediction(null);
    setNotice("");
    history.replaceState(null, "", `#${sceneHashes[next]}`);
    requestAnimationFrame(() =>
      document
        .getElementById("workbench")
        ?.scrollIntoView({ behavior: "instant" }),
    );
  }
  function chooseMode(next) {
    setMode(next);
    setStep("predict");
    setPrediction(null);
    setPlaying(false);
    setNotice("");
    if (next === "tutorial") {
      setGuideIndex(0);
      setDiagram(true);
      setInputs((old) => ({ ...old, [scene]: guideInputsAt(scene, 0) }));
    }
    if (next === "guided")
      setInputs((old) => ({
        ...old,
        [scene]: { ...quiz.start },
      }));
    requestAnimationFrame(() =>
      document
        .querySelector(next === "guided" ? ".challenge" : "#workbench")
        ?.scrollIntoView({ behavior: "instant" }),
    );
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
    if (tutorial) {
      chooseMode("tutorial");
      return;
    }
    setPlaying(false);
    setInputs((old) => ({ ...old, [scene]: { ...DEFAULTS[scene] } }));
    setMode("explore");
    setStep("predict");
    setPrediction(null);
  }
  function guideTo(index) {
    setGuideIndex(index);
    setPlaying(false);
    setInputs((old) => ({ ...old, [scene]: guideInputsAt(scene, index) }));
    requestAnimationFrame(() => {
      document
        .getElementById("workbench")
        ?.scrollIntoView({ behavior: "instant" });
      document.getElementById("guide-heading")?.focus({ preventScroll: true });
    });
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
            Nie musisz znać meteorologii. Przewodnik pokaże Ci, co zmienić,
            gdzie spojrzeć i jak odczytać wynik. Potem możesz spróbować
            samodzielnie.
            <a
              className="start-guide"
              href="#workbench"
              onClick={(event) => {
                event.preventDefault();
                document
                  .getElementById("workbench")
                  ?.scrollIntoView({ behavior: "instant" });
              }}
            >
              Zacznij od pierwszego kroku <ArrowRight />
            </a>
          </p>
        </div>
        <nav className="experiment-nav" aria-label="Wybierz eksperyment">
          {Object.entries(experiments)
            .sort((a, b) => a[1].number.localeCompare(b[1].number))
            .map(([key, exp]) => (
              <button
                key={key}
                aria-pressed={scene === key}
                onClick={() => chooseScene(key)}
              >
                <span>{exp.number}</span>
                {exp.short}
                {key === "breeze" ? (
                  <Wind />
                ) : key === "fog" ? (
                  <Moon />
                ) : (
                  <Cloud />
                )}
              </button>
            ))}
        </nav>
        <div className="workshop-title">
          <div>
            <p className="eyebrow">EKSPERYMENT {data.number} / 03</p>
            <h2>{data.title}</h2>
          </div>
          <div className="mode-switch" aria-label="Sposób nauki">
            <button
              aria-pressed={tutorial}
              onClick={() => chooseMode("tutorial")}
            >
              Prowadź mnie
            </button>
            <button
              aria-pressed={mode === "explore"}
              onClick={() => chooseMode("explore")}
            >
              Spróbuj samodzielnie
            </button>
            <button
              aria-pressed={mode === "guided"}
              onClick={() => chooseMode("guided")}
            >
              Sprawdź się
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
        <section
          id="workbench"
          className={`workbench ${tutorial ? "with-guide" : ""}`}
          aria-label={data.short}
        >
          {tutorial && (
            <section className="guide-intro" aria-labelledby="guide-heading">
              <div>
                <p className="eyebrow">
                  {guideDone
                    ? "PRZEWODNIK UKOŃCZONY"
                    : `KROK ${guideIndex + 1} Z ${guide.steps.length}`}
                </p>
                <div className="guide-progress" aria-hidden="true">
                  {guide.steps.map((item, i) => (
                    <span
                      key={item.title}
                      className={i <= guideIndex ? "filled" : ""}
                    />
                  ))}
                </div>
                <h3 id="guide-heading" tabIndex={-1}>
                  {guideDone
                    ? "Teraz porównaj własne pomysły"
                    : guideStep.title}
                </h3>
              </div>
              {guideDone ? (
                <div className="guide-finish">
                  <p>
                    Masz za sobą wszystkie kroki. W trybie samodzielnym możesz
                    zmieniać każdy warunek i zapisywać dwie próby do porównania.
                  </p>
                  <button
                    className="primary"
                    onClick={() => chooseMode("explore")}
                  >
                    Spróbuj samodzielnie <ArrowRight />
                  </button>
                  <button
                    className="plain"
                    onClick={() => chooseMode("guided")}
                  >
                    Sprawdź, co pamiętasz <ArrowRight />
                  </button>
                  <a className="plain" href={lessonHref}>
                    <BookOpen /> Wróć do pełnej lekcji
                  </a>
                </div>
              ) : (
                <p>{guideStep.instruction}</p>
              )}
            </section>
          )}
          <div className="scene-area">
            <Scene
              key={`${scene}:${mode}`}
              {...{ scene, input, result, diagram }}
              reduced={reduced}
              playing={playing && !reduced}
              onHeightChange={
                scene === "cloud" &&
                showControl("height") &&
                !controlDisabled("height")
                  ? (value) => update("height", value)
                  : undefined
              }
            />
            {scene === "cloud" &&
              showControl("height") &&
              !controlDisabled("height") && (
                <div className="lift-actions">
                  <p id="parcel-instructions">
                    Przeciągnij kółko lub chmurę w górę. Możesz też użyć
                    przycisków.
                  </p>
                  <div>
                    <button
                      className="lift-step"
                      disabled={input.height <= 0}
                      onClick={() =>
                        update("height", Math.max(0, input.height - 100))
                      }
                    >
                      <Minus /> Opuść o 100 m
                    </button>
                    <button
                      className="lift-step"
                      disabled={input.height >= 3000}
                      onClick={() =>
                        update("height", Math.min(3000, input.height + 100))
                      }
                    >
                      <Plus /> Unieś o 100 m
                    </button>
                  </div>
                </div>
              )}
            {tutorial && !guideDone && (
              <div className="scene-action">
                <button
                  className="primary guide-target"
                  onClick={() => update(guideStep.key, guideStep.target)}
                  disabled={stepDone}
                >
                  {stepDone ? <Check /> : <ArrowRight />}
                  {stepDone ? "Ustawienie gotowe" : guideStep.action}
                </button>
              </div>
            )}
            <div className="scene-toolbar">
              <button
                className="plain"
                disabled={mode !== "explore"}
                onClick={() => {
                  if (scene === "cloud" && input.height === 3000)
                    update("height", 0);
                  if (scene === "fog" && input.cooling === 10)
                    update("cooling", 0);
                  setPlaying((p) => !p);
                }}
              >
                {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
                {playing
                  ? "Zatrzymaj"
                  : scene === "breeze"
                    ? "Uruchom dobę"
                    : scene === "cloud"
                      ? "Unoś powietrze"
                      : "Ochładzaj powietrze"}
              </button>
              <button
                className="plain"
                aria-pressed={diagram}
                disabled={tutorial}
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
            {!tutorial && (
              <>
                <p className="eyebrow">TWOJE WARUNKI</p>
                <p className="controls-intro">{data.intro}</p>
              </>
            )}
            {scene === "breeze" ? (
              <>
                {showControl("hour") && (
                  <>
                    <Slider
                      id="hour"
                      label="Pora dnia"
                      value={input.hour}
                      min={0}
                      max={23.5}
                      step={0.1}
                      nudge={0.5}
                      display={timeLabel(input.hour)}
                      onChange={(v) => update("hour", v)}
                      disabled={controlDisabled("hour")}
                      ends={["00:00", "23:30"]}
                    />
                    {!tutorial && (
                      <div className="presets">
                        <button
                          disabled={locked}
                          onClick={() => update("hour", 2)}
                        >
                          <Moon /> 02:00
                        </button>
                        <button
                          disabled={locked}
                          onClick={() => update("hour", 14)}
                        >
                          <Sun /> 14:00
                        </button>
                      </div>
                    )}
                  </>
                )}
                {showControl("heating") && (
                  <Slider
                    id="heating"
                    label="Kontrast nagrzewania"
                    value={input.heating}
                    min={0}
                    max={100}
                    step={1}
                    nudge={10}
                    display={`${input.heating}%`}
                    onChange={(v) => update("heating", v)}
                    disabled={controlDisabled("heating")}
                    ends={["Brak różnicy", "Duża różnica"]}
                  />
                )}
                {!tutorial && (
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
                )}
              </>
            ) : (
              <>
                {showControl("temperature") && (
                  <Slider
                    id="temperature"
                    label={
                      scene === "fog"
                        ? "Temperatura początkowa"
                        : "Temperatura przy ziemi"
                    }
                    value={input.temperature}
                    min={scene === "fog" ? 15 : 5}
                    max={scene === "fog" ? 30 : 35}
                    step={0.1}
                    nudge={1}
                    display={`${num(input.temperature)}°C`}
                    onChange={(v) => update("temperature", v)}
                    disabled={controlDisabled("temperature")}
                    ends={scene === "fog" ? ["15°C", "30°C"] : ["5°C", "35°C"]}
                  />
                )}
                {showControl("humidity") && (
                  <Slider
                    id="humidity"
                    label={
                      scene === "fog"
                        ? "Wilgotność początkowa"
                        : "Wilgotność przy ziemi"
                    }
                    value={input.humidity}
                    min={scene === "fog" ? 40 : 20}
                    max={scene === "fog" ? 95 : 100}
                    step={1}
                    nudge={5}
                    display={`${input.humidity}%`}
                    onChange={(v) => update("humidity", v)}
                    disabled={controlDisabled("humidity")}
                    ends={scene === "fog" ? ["40%", "95%"] : ["20%", "100%"]}
                  />
                )}
                {scene === "cloud" && showControl("height") && (
                  <Slider
                    id="height"
                    label="Uniesienie nad ziemię"
                    value={input.height}
                    min={0}
                    max={3000}
                    step={10}
                    nudge={50}
                    display={metres(input.height)}
                    onChange={(v) => update("height", v)}
                    disabled={controlDisabled("height")}
                    ends={["Poziom ziemi", "3000 m"]}
                  />
                )}
                {scene === "fog" && showControl("cooling") && (
                  <Slider
                    id="cooling"
                    label="Nocne ochłodzenie"
                    value={input.cooling}
                    min={0}
                    max={10}
                    step={0.1}
                    nudge={0.5}
                    display={`o ${num(input.cooling)}°C`}
                    onChange={(v) => update("cooling", v)}
                    disabled={controlDisabled("cooling")}
                    ends={["Bez ochłodzenia", "O 10°C"]}
                  />
                )}
                {!tutorial &&
                  (scene === "fog" ? (
                    <div className="instrument">
                      <span>Do rozpoczęcia kondensacji</span>
                      <strong>
                        {result.saturated
                          ? "Nasycenie"
                          : `jeszcze ${num(result.remaining)}°C`}
                      </strong>
                      <p>
                        Początkowy punkt rosy: {num(result.initialDew)}°C. To
                        temperatura, do której trzeba ochłodzić początkowe
                        powietrze, aby osiągnęło nasycenie.
                      </p>
                    </div>
                  ) : (
                    <div className="instrument">
                      <span>Szacowany poziom kondensacji</span>
                      <strong>≈ {metres(result.base)}</strong>
                      <p>
                        {result.aboveScene
                          ? "Powyżej zakresu tej sceny. Nie dorysowujemy chmury na granicy wykresu."
                          : `Punkt rosy przy ziemi: ${num(result.dew)}°C. To temperatura, przy której początkowe powietrze osiągnęłoby nasycenie przy niezmienionym ciśnieniu.`}
                      </p>
                    </div>
                  ))}
              </>
            )}
            {tutorial && !guideDone && (
              <div className="guide-action">
                <div className="guide-expect">
                  <b>Na co patrzeć</b>
                  <p>{guideStep.expect}</p>
                </div>
                <div className="guide-feedback" role="status">
                  {stepDone && (
                    <>
                      <b>Co się zmieniło i dlaczego</b>
                      <p>{guideStep.explanation}</p>
                    </>
                  )}
                </div>
                <div className="guide-navigation">
                  <button
                    className="plain"
                    disabled={guideIndex === 0}
                    onClick={() => guideTo(guideIndex - 1)}
                  >
                    <ArrowLeft /> Wstecz
                  </button>
                  <button
                    className="primary"
                    disabled={!stepDone}
                    onClick={() => guideTo(guideIndex + 1)}
                  >
                    {guideIndex === guide.steps.length - 1
                      ? "Podsumuj"
                      : "Dalej"}{" "}
                    <ArrowRight />
                  </button>
                </div>
                {!stepDone && (
                  <p className="guide-hint">
                    Najpierw wykonaj wskazaną zmianę. Suwak, przyciski plus i
                    minus oraz fioletowy przycisk pod rysunkiem zmieniają te
                    same warunki.
                  </p>
                )}
              </div>
            )}
            {!tutorial && (
              <button
                className="primary save-button"
                onClick={saveTrial}
                disabled={locked}
              >
                <FloppyDisk /> Zapisz próbę do porównania
              </button>
            )}
          </aside>
        </section>
        <p className="notice" role="status">
          {notice}
        </p>
        {!locked && !tutorial && (
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
                        : scene === "fog"
                          ? `Początkowo ${trial.input.temperature}°C i ${trial.input.humidity}% · ochłodzenie o ${trial.input.cooling}°C · ${calculate(scene, trial.input).saturated ? "warunki do kondensacji" : "bez kondensacji"}`
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
              <a className="lesson-link" href={lessonHref}>
                <BookOpen />
                {lesson === data.lesson
                  ? data.lessonLabel
                  : "Wróć do lekcji, z której przyszedłeś"}
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
              {scene === "fog" && (
                <a
                  href="https://about.metservice.com/learning/radiation-fog-s7gkj"
                  target="_blank"
                  rel="noreferrer"
                >
                  MetService: rola gruntu, wilgoci i mieszania powietrza{" "}
                  <ArrowRight />
                </a>
              )}
            </details>
          </>
        )}
        {((mode === "guided" && step === "explain") || guideDone) && (
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
