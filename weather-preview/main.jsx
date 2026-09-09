import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LearningCatalog, LearningStudio } from "./learning/LearningStudio.jsx";
import { WorkshopBoundary } from "./WorkshopBoundary.jsx";
const StormWorkshop = lazy(() => import("./learning/StormWorkshop.jsx").then(m => ({ default: m.StormWorkshop })));
const WindWorkshop = lazy(() => import("./learning/WindWorkshop.jsx").then(m => ({ default: m.WindWorkshop })));
const SoundingWorkshop = lazy(() => import("./learning/SoundingWorkshop.jsx").then(m => ({ default: m.SoundingWorkshop })));
const TurbulenceWorkshop = lazy(() => import("./learning/TurbulenceWorkshop.jsx").then(m => ({ default: m.TurbulenceWorkshop })));
const FoundationWorkshop = lazy(() => import("./learning/FoundationWorkshop.jsx").then(m => ({ default: m.FoundationWorkshop })));
import { activities } from "./learning/catalog.mjs";
import { TransferTrial } from "./learning/TransferTrial.jsx";
import { markTransferHelp } from "./learning/transfer-state.mjs";
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
import { Slider } from "./Slider.jsx";

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
      {!mini && (
        <p className="scene-stamp">SCHEMAT EDUKACYJNY · NIE PROGNOZA</p>
      )}
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
          Schemat mgły, nie pomiar widzialności.
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
  const navigationState = useRef({ scene, mode });
  navigationState.current = { scene, mode };
  const modeInputs = useRef({});
  const [exploreControl, setExploreControl] = useState({
    breeze: "hour", cloud: "height", fog: "cooling",
  });
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
  const tabId = sceneHashes[scene];
  const assessment = mode === "assessment";
  const currentTrials = trials.filter((t) => t.scene === scene).slice(-2);
  const locked = assessment || (mode === "guided" && step === "predict");
  const quiz = quizCases[scene];
  const tested = input[quiz.key] === quiz.target;
  const guide = guides[scene];
  const guideStep = guide.steps[guideIndex];
  const tutorial = mode === "tutorial";
  const guideDone = tutorial && !guideStep;
  const stepDone = guideStepComplete(scene, guideIndex, input);
  const lesson = returnLesson(location.search, data.lesson);
  const lessonHref = `${mainSite}#/learn/${lesson}`;
  const showControl = (key) => !assessment && (tutorial
    ? guideStep?.key === key
    : exploreControl[scene] === key);
  const controlChoices = scene === "breeze"
    ? [["hour", "Pora dnia", timeLabel(input.hour)], ["heating", "Kontrast nagrzewania", `${input.heating}%`]]
    : [
        [scene === "cloud" ? "height" : "cooling", scene === "cloud" ? "Uniesienie" : "Ochłodzenie", scene === "cloud" ? metres(input.height) : `o ${num(input.cooling)}°C`],
        ["temperature", "Temperatura początkowa", `${num(input.temperature)}°C`],
        ["humidity", "Wilgotność początkowa", `${input.humidity}%`],
      ];
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
    const previous = navigationState.current;
    if (next === previous.scene) return;
    if (previous.mode === "assessment") markTransferHelp(sceneHashes[previous.scene]);
    modeInputs.current = {};
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
    if (!["tutorial", "assessment", "explore"].includes(next) || next === mode) return;
    if (mode === "assessment") markTransferHelp(tabId);
    else modeInputs.current[mode] = { ...input };
    setMode(next);
    setStep("predict");
    setPrediction(null);
    setPlaying(false);
    setNotice("");
    if (next === "tutorial") setDiagram(true);
    if (next !== "assessment" && modeInputs.current[next]) {
      const restored = { ...modeInputs.current[next] };
      setInputs((old) => ({ ...old, [scene]: restored }));
    }
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
      setDiagram(true);
      setNotice("");
      guideTo(0);
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
      const heading = document.getElementById("guide-heading");
      heading?.focus({ preventScroll: true });
      const bounds = heading?.getBoundingClientRect();
      if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight))
        heading.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  }

  return (
    <div className="legacy-weather-preview">
      <header className="topbar">
        <a href={mainSite} aria-label="Wróć do CHMURNIKA">
          <img src="./wordmark.png" alt="CHMURNIK" />
        </a>
        <h1>{data.short}</h1>
        <a className="back-link" href="#pracownia" aria-label="Wróć do pracowni">
          <ArrowLeft /> <span>Pracownia</span>
        </a>
      </header>
      <main>
        <div className="workshop-title">
          <div className="mode-switch" role="group" aria-label="Sposób nauki">
            <button
              aria-pressed={tutorial}
              onClick={() => chooseMode("tutorial")}
            >
              Prowadź mnie
            </button>
            <button
              aria-pressed={assessment}
              onClick={() => chooseMode("assessment")}
            >
              Sprawdź się
            </button>
            <button
              aria-pressed={mode === "explore"}
              onClick={() => chooseMode("explore")}
            >
              Eksperymentuj
            </button>
          </div>
        </div>
        {assessment ? <TransferTrial key={tabId} activityId={tabId} /> : (
        <>
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
                    ? "POKAZ UKOŃCZONY"
                    : `KROK ${guideIndex + 1} Z ${guide.steps.length}`}
                </p>
                <h3 id="guide-heading" tabIndex={-1}>
                  {guideDone
                    ? "Zastosuj poznaną zasadę"
                    : guideStep.action}
                </h3>
              </div>
              {guideDone ? (
                <div className="guide-finish">
                  <p>
                    Pokaz za Tobą. Sprawdź się na innym przypadku albo porównaj
                    własne ustawienia w trybie „Eksperymentuj”.
                  </p>
                  <button
                    className="primary"
                    onClick={() => chooseMode("assessment")}
                  >
                    Sprawdź się <ArrowRight />
                  </button>
                  <button
                    className="plain"
                    onClick={() => chooseMode("explore")}
                  >
                    Eksperymentuj <ArrowRight />
                  </button>
                </div>
              ) : null}
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
          </div>
          <div className="scene-action">
          <aside className="controls">
            {!tutorial && (
              <label className="legacy-control-choice">
                Zmieniany warunek
                <select
                  value={exploreControl[scene]}
                  onChange={(event) => setExploreControl((old) => ({
                    ...old, [scene]: event.target.value,
                  }))}
                >
                  {controlChoices.map(([key, label, value]) => (
                    <option key={key} value={key}>{label}: {value}</option>
                  ))}
                </select>
              </label>
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
              </>
            ) : (
              <>
                {showControl("temperature") && (
                  <Slider
                    id="temperature"
                    label={scene === "fog" ? "Temperatura początkowa" : "Temperatura przy ziemi"}
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
                    label={scene === "fog" ? "Wilgotność początkowa" : "Wilgotność przy ziemi"}
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
              </>
            )}
            {tutorial && !guideDone && (
              <div className="guide-action">
                <button
                  className="primary guide-target"
                  onClick={() => update(guideStep.key, guideStep.target)}
                  disabled={stepDone}
                >
                  {stepDone ? <Check /> : <ArrowRight />}
                  {stepDone ? "Ustawienie gotowe" : guideStep.action}
                </button>
                <div className="guide-feedback" role="status">
                  {stepDone && <p>{guideStep.explanation}</p>}
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
                    {guideIndex === guide.steps.length - 1 ? "Podsumuj" : "Dalej"} <ArrowRight />
                  </button>
                </div>
                <details className="legacy-details" key={`${scene}:${guideIndex}`}>
                  <summary>Instrukcja i obserwacja</summary>
                  <p><b>{guideStep.title}</b></p>
                  <p>{guideStep.instruction}</p>
                  <p>{guideStep.expect}</p>
                </details>
              </div>
            )}
            {scene === "cloud" &&
              showControl("height") &&
              !controlDisabled("height") && (
                <details className="lift-actions legacy-details">
                  <summary>Przeciąganie i kroki po 100 m</summary>
                  <p id="parcel-instructions">
                    Przeciągnij kółko lub chmurę w górę albo zmień uniesienie suwakiem
                    i przyciskami plus i minus. Tutaj możesz zmieniać je co 100 m.
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
                </details>
              )}
            <div className="scene-toolbar">
              {!tutorial && <button
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
              </button>}
              {!tutorial && <button
                className="plain"
                aria-pressed={diagram}
                disabled={tutorial}
                onClick={() => setDiagram((d) => !d)}
              >
                {diagram ? "Ukryj schemat" : "Pokaż schemat"}
              </button>}
              <button className="plain" onClick={reset}>
                <ArrowCounterClockwise /> {tutorial ? "Przewodnik od początku" : "Od nowa"}
              </button>
            </div>
            {reduced && (
              <p className="motion-note">
                Ograniczony ruch: wartości zmieniają się skokowo, bez płynnej
                animacji.
              </p>
            )}
            {!tutorial && <details className="legacy-details">
              <summary>Jak czytać wynik?</summary>
            {scene === "breeze" ? (
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
            ) : scene === "fog" ? (
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
            )}
            </details>}
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
          </div>
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
              <a className="lesson-link" href={lessonHref}>
                <BookOpen />
                {lesson === data.lesson
                  ? data.lessonLabel
                  : "Wróć do lekcji, z której przyszedłeś"}
                <ArrowRight />
              </a>
            </section>
            <details className="method">
              <summary>O ćwiczeniu: źródła i ograniczenia</summary>
              <h2>{data.title}</h2>
              <p>{data.intro}</p>
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
        </>
        )}
        <details className="legacy-details legacy-experiments">
          <summary>Inne doświadczenia pogodowe</summary>
          <nav className="experiment-nav" aria-label="Wybierz eksperyment">
            {Object.entries(experiments)
              .sort((a, b) => a[1].number.localeCompare(b[1].number))
              .map(([key, exp]) => (
                <button key={key} aria-pressed={scene === key} onClick={() => chooseScene(key)}>
                  <span>{exp.number}</span>{exp.short}
                  {key === "breeze" ? <Wind /> : key === "fog" ? <Moon /> : <Cloud />}
                </button>
              ))}
          </nav>
          <a className="plain" href={`${mainSite}#/layers`}>Warstwy <ArrowRight /></a>
        </details>
      </main>
      <footer>
        <span>CHMURNIK · Pracownia pogody · podgląd 09.09.2026</span>
        <span>Bez logowania i przesyłania Twoich danych.</span>
        <a href={`${mainSite}assetySM/`}>
          Materiały do udostępnienia <ArrowRight />
        </a>
      </footer>
    </div>
  );
}
function PreviewRouter() {
  const [hash, setHash] = useState(location.hash.slice(1));
  useEffect(() => {
    const change = () => { setHash(location.hash.slice(1)); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  if (hash === "pracownia" || hash === "") return <LearningCatalog mainSite={mainSite} />;
  if (hash === "burza") return <StormWorkshop mainSite={mainSite} />;
  if (hash === "wiatr") return <WindWorkshop mainSite={mainSite} />;
  if (hash === "sondaz") return <SoundingWorkshop mainSite={mainSite} />;
  if (hash === "turbulencja") return <TurbulenceWorkshop mainSite={mainSite} />;
  if (["bryza", "chmura", "mgla"].includes(hash)) return <FoundationWorkshop key={hash} id={hash} mainSite={mainSite} />;
  if (Object.hasOwn(activities, hash)) return <LearningStudio key={hash} id={hash} mainSite={mainSite} />;
  return <LearningCatalog mainSite={mainSite} />;
}
createRoot(document.getElementById("root")).render(<WorkshopBoundary mainSite={mainSite}><Suspense fallback={<p className="learning-loading" role="status">Otwieramy pracownię…</p>}><PreviewRouter /></Suspense></WorkshopBoundary>);
