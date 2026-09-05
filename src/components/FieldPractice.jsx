import { useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Check,
  Compass,
  Info,
  Wind,
  X,
} from "@phosphor-icons/react";
import { decodeAviationReport } from "../lib/taf-reader.js";
import { ReportGroups, TafForecast } from "./TafForecast.jsx";
import {
  apparentWind,
  beaufortForce,
  degreesToCompass,
  windComponents,
} from "../lib/wind.js";
import {
  metarExamples,
  tafExamples,
  practiceCases,
  recordPracticeAttempt,
} from "../data/field-practice.js";

const TRACKS = {
  metar: [
    "Depesze lotnicze",
    "Rozczytaj METAR i TAF",
    "METAR opisuje obserwację, a TAF jest prognozą. Wklej depeszę, żeby zobaczyć znaczenie jej skrótów i grup, albo wybierz przykład do ćwiczeń.",
  ],
  wind: [
    "Żeglarstwo i lotnictwo",
    "Sprawdź składowe wiatru",
    "Ustaw kierunek i prędkość wiatru. Sprawdź, jak ruch jachtu zmienia wiatr odczuwany na pokładzie albo ile wiatru wieje w poprzek drogi startowej.",
  ],
  maps: [
    "Odczytywanie map",
    "Zrozum mapy w Windy",
    "Na przykładzie szkoleniowym sprawdzisz, jak poziom atmosfery, czas i wybrany model zmieniają odczyt wiatru. Pełna pracownia wyjaśnia też warstwy dostępne w Windy.",
  ],
};
const format = (value) =>
  Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 1 });
const PROGRESS_KEY = "chmurnik:field-practice:v1";

function loadPractice() {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Object.fromEntries(
      practiceCases
        .filter(
          (item) =>
            Number.isInteger(value?.[item.id]?.attempts) &&
            Number.isInteger(value?.[item.id]?.correct) &&
            typeof value?.[item.id]?.lastCorrect === "boolean",
        )
        .map((item) => [item.id, value[item.id]]),
    );
  } catch {
    return {};
  }
}

export function PracticeLinks({ navigate }) {
  return (
    <nav className="field-practice-links" aria-label="Praktyczne narzędzia">
      {[
        ["metar", "METAR / TAF", "Rozczytaj depeszę"],
        ["wind", "Wiatr", "Oblicz składowe wiatru"],
        ["maps", "Windy", "Zrozum warstwy mapy"],
      ].map(([id, label, text]) => (
        <button key={id} onClick={() => navigate(`practice/${id}`)}>
          <span className="eyebrow">{label}</span>
          <strong>{text}</strong>
          <ArrowRight size={19} />
        </button>
      ))}
    </nav>
  );
}

export function FullLearningLinks({ navigate }) {
  return (
    <nav className="full-learning-links" aria-label="Pełne lekcje i pracownia atmosfery">
      <button onClick={() => navigate("layers")}>
        <span className="eyebrow">Pełna pracownia</span>
        <strong>Warstwy atmosfery i Windy</strong>
        <span>Sprawdź, jak wysokość i ciśnienie zmieniają odczyt map, oraz poznaj pionowy przekrój atmosfery na sondażu.</span>
        <ArrowRight size={20} />
      </button>
      <button onClick={() => navigate("learn")}>
        <span className="eyebrow">Cała ścieżka nauki</span>
        <strong>Lekcje o chmurach i pogodzie</strong>
        <span>Wybierz dowolny temat i ucz się na przykładach, z pytaniami oraz wyjaśnieniami odpowiedzi.</span>
        <ArrowRight size={20} />
      </button>
    </nav>
  );
}

function SourceLink({ ids, onSources }) {
  return (
    <button
      className="field-source"
      aria-label="Źródła i metoda"
      onClick={() => onSources(ids)}
    >
      <Info size={16} /> Źródła
    </button>
  );
}

export function PracticeChallenge({ track, onSources }) {
  const all = useMemo(
    () => practiceCases.filter((item) => item.track === track),
    [track],
  );
  const [queue, setQueue] = useState(all);
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [missed, setMissed] = useState([]);
  const [records, setRecords] = useState(loadPractice);
  const [notice, setNotice] = useState("");
  const heading = useRef(null);
  const item = queue[position];
  const choose = (choice) => {
    if (answer != null) return;
    setAnswer(choice);
    const correct = choice === item.answer;
    if (!correct) setMissed((values) => [...values, item]);
    const next = recordPracticeAttempt(records, item.id, correct);
    setRecords(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      setNotice(
        "Wynik działa w tej sesji, ale nie udało się go zapisać na później.",
      );
    }
  };
  const advance = () => {
    setPosition(position + 1);
    setAnswer(null);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const restart = (items) => {
    setQueue(items);
    setPosition(0);
    setMissed([]);
    setAnswer(null);
    requestAnimationFrame(() => heading.current?.focus());
  };
  return (
    <section className="field-challenge" aria-labelledby={`challenge-${track}`}>
      <div className="field-section-label">
        <span className="eyebrow">Ćwiczenia na wymyślonych sytuacjach</span>
        <span>
          {all.filter((value) => records[value.id]?.lastCorrect).length}/
          {all.length} ostatnio poprawnych
        </span>
      </div>
      <h2 id={`challenge-${track}`} ref={heading} tabIndex={-1}>
        {item ? item.title : "Podsumowanie ćwiczeń"}
      </h2>
      {item ? (
        <>
          <div
            className="field-case-progress"
            aria-label={`Przypadek ${position + 1} z ${queue.length}`}
          >
            {queue.map((value, index) => (
              <i
                key={value.id}
                className={index <= position ? "is-done" : ""}
              />
            ))}
          </div>
          <p className="field-case-context">{item.context}</p>
          <p className="field-question">{item.question}</p>
          <div className="field-answers">
            {item.choices.map((choice, index) => (
              <button
                key={choice}
                disabled={answer != null}
                className={
                  answer != null && index === item.answer
                    ? "is-correct"
                    : answer === index
                      ? "is-incorrect"
                      : ""
                }
                onClick={() => choose(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {choice}
                {answer != null && index === item.answer && <Check size={19} />}
                {answer === index && index !== item.answer && <X size={19} />}
              </button>
            ))}
          </div>
          {answer != null && (
            <div className="field-explanation" role="status">
              <span className="eyebrow">
                {answer === item.answer
                  ? "Poprawna odpowiedź"
                  : "Zaznaczona odpowiedź nie jest poprawna"}
              </span>
              <p>{item.explanation}</p>
              <strong>{item.takeaway}</strong>
              <div className="field-action-row">
                <SourceLink ids={item.sources} onSources={onSources} />
                <button className="button button--primary" onClick={advance}>
                  {position === queue.length - 1
                    ? "Podsumowanie"
                    : "Kolejny przypadek"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="field-round-summary">
          <p>
            W tej rundzie:{" "}
            <strong>
              {queue.length - missed.length} z {queue.length}
            </strong>{" "}
            poprawnych odpowiedzi za pierwszym razem. Możesz wrócić do
            trudniejszych pytań i przeczytać ich wyjaśnienia.
          </p>
          <div className="field-action-row">
            {missed.length > 0 && (
              <button
                className="button button--primary"
                onClick={() => restart(missed)}
              >
                Powtórz trudniejsze ({missed.length})
              </button>
            )}
            <button
              className="button button--secondary"
              onClick={() => restart(all)}
            >
              Jeszcze jedna runda
            </button>
          </div>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}

function Slider({ label, value, onChange, min = 0, max, step = 1, unit }) {
  const id = useId();
  return (
    <label className="field-slider" htmlFor={id}>
      <span>
        {label}
        <output htmlFor={id} aria-hidden="true">
          {value}
          {unit}
        </output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function WindRose({ from, speed, heading, apparent, sailing }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="field-wind-rose"
      viewBox="0 0 260 260"
      role="img"
      aria-label={`${speed > 0 ? `Wiatr z ${from} stopni` : "Cisza: wiatr nie ma kierunku"}. ${sailing ? "Dziób jachtu" : "Oś drogi startowej"} ${heading} stopni. Strzałki pokazują przepływ powietrza.`}
    >
      <defs>
        {[
          ["arrow", "var(--coral)"],
          ["apparent", "#216462"],
        ].map(([name, color]) => (
          <marker
            key={name}
            id={`${id}-${name}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10Z" fill={color} />
          </marker>
        ))}
      </defs>
      <circle
        cx="130"
        cy="130"
        r="88"
        fill="none"
        stroke="currentColor"
        opacity=".22"
      />
      <circle
        cx="130"
        cy="130"
        r="55"
        fill="none"
        stroke="currentColor"
        opacity=".13"
      />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line
          key={angle}
          x1="130"
          y1="39"
          x2="130"
          y2="47"
          transform={`rotate(${angle} 130 130)`}
          stroke="currentColor"
          opacity=".4"
        />
      ))}
      <text x="130" y="22" textAnchor="middle">
        N
      </text>
      <text x="244" y="136" textAnchor="middle">
        E
      </text>
      <text x="130" y="250" textAnchor="middle">
        S
      </text>
      <text x="15" y="136" textAnchor="middle">
        W
      </text>
      <g transform={`rotate(${heading} 130 130)`}>
        {sailing ? (
          <path
            d="M130 96 Q108 115 120 153 Q130 161 140 153 Q152 115 130 96Z"
            fill="var(--ink)"
          />
        ) : (
          <>
            <rect
              x="122"
              y="77"
              width="16"
              height="106"
              rx="3"
              fill="var(--ink)"
            />
            <path d="M130 85V175" stroke="var(--white)" strokeDasharray="6 5" />
          </>
        )}
        <path
          d="M130 65L125 74M130 65L135 74"
          stroke="var(--ink)"
          fill="none"
        />
      </g>
      {speed > 0 && (
        <line
          x1="130"
          y1="30"
          x2="130"
          y2="86"
          stroke="var(--coral)"
          strokeWidth="5"
          markerEnd={`url(#${id}-arrow)`}
          transform={`rotate(${from} 130 130)`}
        />
      )}
      {apparent?.from != null && (
        <line
          x1="130"
          y1="48"
          x2="130"
          y2="91"
          stroke="#216462"
          strokeWidth="3"
          strokeDasharray="4 2"
          markerEnd={`url(#${id}-apparent)`}
          transform={`rotate(${apparent.from} 130 130)`}
        />
      )}
    </svg>
  );
}

export function WindWorkbench({ reportWind = null, fixed = false, onSources }) {
  const [mode, setMode] = useState(fixed ? "pilot" : "sailing");
  const [from, setFrom] = useState(reportWind?.from ?? 90);
  const [speed, setSpeed] = useState(reportWind?.speed ?? 12);
  const [heading, setHeading] = useState(fixed ? 270 : 0);
  const [boat, setBoat] = useState(5);
  const sailing = mode === "sailing";
  const apparent = apparentWind(from, speed, heading, boat);
  const components = windComponents(from, speed, heading);
  const gust =
    reportWind?.gust != null
      ? windComponents(from, reportWind.gust, heading)
      : null;
  return (
    <section className="field-wind-workbench">
      <div className="field-section-label">
        <span className="eyebrow">
          {fixed ? "Wiatr z wklejonej depeszy" : "Symulator wiatru"}
        </span>
        <SourceLink
          ids={
            sailing
              ? ["orcWindVectors", "metOfficeBeaufort"]
              : ["awcCodes", "faaWeather"]
          }
          onSources={onSources}
        />
      </div>
      {!fixed && (
        <div className="field-segments" aria-label="Zastosowanie wiatru">
          <button aria-pressed={sailing} onClick={() => setMode("sailing")}>
            Na pokładzie
          </button>
          <button aria-pressed={!sailing} onClick={() => setMode("pilot")}>
            Na drodze startowej
          </button>
        </div>
      )}
      <h2>{sailing ? "Wiatr na pokładzie" : "Wiatr względem drogi startowej"}</h2>
      <p>{sailing
        ? "Ustaw wiatr, kierunek dziobu i prędkość jachtu. Zobaczysz wiatr pozorny, czyli wiatr odczuwany przez poruszającą się załogę. Zmieniaj jedno ustawienie naraz i porównuj wynik."
        : fixed
          ? "Wiatr pochodzi z wklejonej depeszy. Ustaw geograficzny kierunek drogi startowej, żeby obliczyć składową boczną oraz czołową lub tylną. Nie są to dopuszczalne limity dla samolotu."
          : "Ustaw wiatr i geograficzny kierunek drogi startowej. Wynik pokaże składową boczną oraz czołową lub tylną. Te obliczenia nie określają dopuszczalnych limitów dla samolotu."}</p>
      <p>Kierunki °T odnoszą się do północy geograficznej. Prędkości podajemy w węzłach (kt). To obliczenia z podanych ustawień, nie pomiar telefonem.</p>
      <div className="field-wind-layout">
        <div className="field-wind-picture">
          <WindRose
            from={from}
            speed={speed}
            heading={heading}
            apparent={sailing ? apparent : null}
            sailing={sailing}
          />
          <p>
            <i className="wind-key" />{" "}
            {speed > 0 ? `z ${degreesToCompass(from)}` : "cisza"} ·{" "}
            {format(speed)} kt
            {sailing && (
              <>
                <br />
                <i className="wind-key wind-key--apparent" /> pozorny na
                pokładzie
              </>
            )}
          </p>
        </div>
        <div>
          {!fixed && (
            <>
              <Slider
                label="Kierunek, z którego wieje wiatr"
                value={from}
                onChange={setFrom}
                max={359}
                unit="°T"
              />
              <Slider
                label="Prędkość wiatru rzeczywistego"
                value={speed}
                onChange={setSpeed}
                max={50}
                unit=" kt"
              />
            </>
          )}
          <Slider
            label={sailing ? "Kierunek dziobu" : "Geograficzny kierunek drogi startowej"}
            value={heading}
            onChange={setHeading}
            max={359}
            unit="°T"
          />
          {sailing && (
            <Slider
              label="Prędkość jachtu"
              value={boat}
              onChange={setBoat}
              max={25}
              unit=" kt"
            />
          )}
          <div className="field-readouts" aria-live="polite" aria-atomic="true">
            {sailing ? (
              <>
                <div>
                  <strong>
                    {format(apparent.speed)}
                    <small> kt</small>
                  </strong>
                  <span>wiatr pozorny</span>
                </div>
                <div>
                  <strong>
                    {apparent.relative == null
                      ? "—"
                      : `${Math.round(Math.abs(apparent.relative))}°`}
                  </strong>
                  <span>
                    {apparent.relative == null
                      ? "brak kierunku przy ciszy"
                      : Math.abs(apparent.relative) < 1
                        ? "od dziobu"
                        : Math.abs(apparent.relative) > 179
                          ? "od rufy"
                          : apparent.relative > 0
                            ? "od prawej burty, licząc od dziobu"
                            : "od lewej burty, licząc od dziobu"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong>
                    {format(Math.abs(components.crosswind))}
                    <small> kt</small>
                  </strong>
                  <span>
                    {components.crosswind === 0
                      ? "brak składowej bocznej"
                      : components.crosswind > 0
                        ? "boczny z prawej"
                        : "boczny z lewej"}
                  </span>
                </div>
                <div>
                  <strong>
                    {format(Math.abs(components.headwind))}
                    <small> kt</small>
                  </strong>
                  <span>
                    {components.headwind >= 0
                      ? "składowa czołowa"
                      : "składowa tylna"}
                  </span>
                </div>
              </>
            )}
          </div>
          {gust && (
            <p>
              Przy raportowanym porywie {format(reportWind.gust)} kt:{" "}
              <strong>{format(Math.abs(gust.crosswind))} kt bocznego</strong>,
              zakładając ten sam kierunek.
            </p>
          )}
        </div>
      </div>
      <details className="field-disclosure">
        <summary>Co zakładamy i czego to nie mierzy?</summary>
        <p>
          {sailing
            ? "Model wektorowy bez prądu i dryfu: kurs jest równy kierunkowi dziobu, a obie prędkości mają wspólny układ odniesienia. Wiatr pozorny to ruch powietrza minus ruch jachtu. Telefon nie mierzy tu wiatru."
            : "Wszystkie kierunki są względem północy geograficznej (T), jak kierunek w METAR. Nie wpisuj numeru pasa ani kierunku magnetycznego bez właściwego przeliczenia. Boczny = prędkość × sin(różnicy kierunków), czołowy = prędkość × cos(różnicy). To nie ocena możliwości statku powietrznego ani zgoda na lot."}
        </p>
        <p>
          Wiatr {format(speed)} kt odpowiada około {beaufortForce(speed)}°B dla
          zaokrąglonych węzłów. To nie prognoza wysokości fali: znaczenie mają
          też czas, rozbieg, prąd i osłona akwenu.
        </p>
      </details>
      {reportWind?.range && (
        <p className="field-caution">
          Kierunek waha się {reportWind.range[0]}–{reportWind.range[1]}°T. Wynik
          dotyczy kierunku średniego, nie największej możliwej składowej.
        </p>
      )}
    </section>
  );
}

function AviationReader({ onSources, onTraining }) {
  const [text, setText] = useState(metarExamples[0].report);
  const [example, setExample] = useState("synthetic");
  const [result, setResult] = useState(() =>
    decodeAviationReport(metarExamples[0].report),
  );
  const [error, setError] = useState("");
  const read = (event) => {
    event.preventDefault();
    try {
      setResult(decodeAviationReport(text));
      setError("");
    } catch (failure) {
      setResult(null);
      setError(failure.message);
    }
  };
  return (
    <section className="field-metar-reader">
      <div className="field-section-label">
        <span className="eyebrow">Czytnik depesz na urządzeniu</span>
        <SourceLink ids={["awcCodes", "faaTaf"]} onSources={onSources} />
      </div>
      <p>Wklej depeszę, a potem wybieraj jej fragmenty, żeby przeczytać wyjaśnienia. Czytnik działa bez internetu i nie pobiera aktualnej pogody.</p>
      <details className="field-report-guide">
        <summary>Czym różni się METAR od TAF?</summary>
        <div className="field-report-comparison">
          <div>
            <span className="eyebrow">METAR / SPECI</span>
            <h3>Co zaobserwowano?</h3>
            <p>
              METAR opisuje pogodę zaobserwowaną w określonej chwili. SPECI to
              obserwacja specjalna. Do METAR może być dołączona krótka prognoza
              zmian, nazywana trendem. Pokazujemy ją osobno od obserwacji.
            </p>
          </div>
          <div>
            <span className="eyebrow">TAF</span>
            <h3>Czego się spodziewamy?</h3>
            <p>
              Prognoza dla lotniska w przedziale czasu, np.{" "}
              <code>2618/2718</code>. <code>FM262300</code> rozpoczyna nowe
              warunki od konkretnej chwili. Skopiowany TAF może nie mieć
              nagłówka.
            </p>
          </div>
        </div>
        <p>
          Samo <code>TEMPO</code> nie rozstrzyga: występuje też w trendzie
          METAR. Czytamy strukturę całej depeszy, nie tylko jeden skrót.
        </p>
        <button className="field-source" onClick={onTraining}>
          Przećwicz różnicę <ArrowRight size={17} />
        </button>
      </details>
      <form onSubmit={read}>
        <label htmlFor="raw-metar">Wklej jeden METAR, SPECI lub TAF</label>
        <textarea
          id="raw-metar"
          value={text}
          rows={4}
          maxLength={6000}
          spellCheck={false}
          autoCapitalize="characters"
          onChange={(event) => {
            setText(event.target.value);
            setExample(null);
            setResult(null);
            setError("");
          }}
        />
        <button className="button button--primary" type="submit">
          Wyjaśnij depeszę <ArrowRight size={18} />
        </button>
      </form>
      <div className="field-example-picker">
        <span>Przykłady do ćwiczeń · nie aktualna pogoda:</span>
        {[...metarExamples, ...tafExamples].map((value) => (
          <button
            key={value.label}
            onClick={() => {
              setText(value.report);
              setResult(decodeAviationReport(value.report));
              setError("");
              setExample(value.synthetic === false ? "provided" : "synthetic");
            }}
          >
            {value.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="field-caution" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="field-metar-result">
          <div className="field-section-label">
            <div className="field-report-identity">
              <strong>
                {result.type} · {result.station}
              </strong>
              <span>
                {result.type === "TAF"
                  ? `Wydano: dzień ${result.issued.day}, ${String(result.issued.hour).padStart(2, "0")}:${String(result.issued.minute).padStart(2, "0")} UTC`
                  : `Obserwacja: dzień ${result.day}, ${result.time}`}
              </span>
            </div>
            <span className="field-badge">
              {example === "synthetic"
                ? "Przykład szkoleniowy"
                : example === "provided"
                  ? "Przykładowa depesza, nie bieżąca pogoda"
                  : "Wklejona depesza, bez sprawdzania aktualności"}
            </span>
          </div>
          <div
            className="field-report-type"
            data-kind={result.type}
            role="status"
          >
            <strong>
              {result.type === "TAF"
                ? "Rozpoznano TAF · prognoza, nie obserwacja"
                : `${result.type} · obserwacja, nie prognoza TAF`}
            </strong>
            <p>
              {result.type === "TAF"
                ? result.detection
                : "Poniżej odczyt pomiaru. Ewentualny trend pokazujemy osobno i nie podmieniamy nim obserwacji."}
            </p>
          </div>
          <p className="field-caution">
            {example === "synthetic"
              ? "Dane wymyślone do ćwiczeń, nie opisują obecnej pogody."
              : "Nie sprawdziliśmy źródła ani aktualności. Depesza nie zawiera miesiąca i roku. Zweryfikuj datę i pełny oryginał w oficjalnym serwisie."}
          </p>
          {result.type === "TAF" ? (
            <TafForecast key={result.raw} result={result} />
          ) : result.nil ? (
            <p role="status">NIL: brak obserwacji.</p>
          ) : (
            <>
              <div className="field-metar-summary">
                <div>
                  <span>Widzialność</span>
                  <strong>{result.visibility?.text || "Brak danych"}</strong>
                </div>
                <div>
                  <span>Raportowany pułap</span>
                  <strong>
                    {!result.skyReported
                      ? "Brak danych o niebie"
                      : result.ceiling?.uncertain
                        ? "Nieznany / niepełny"
                        : result.ceiling?.height != null
                          ? `${result.ceiling.height} ft nad lotniskiem`
                          : "Brak określonego pułapu"}
                  </strong>
                </div>
                <div>
                  <span>Temperatura / punkt rosy</span>
                  <strong>
                    {result.temperature ?? "?"} / {result.dewpoint ?? "?"} °C
                  </strong>
                </div>
                <div>
                  <span>Nastawa wysokościomierza</span>
                  <strong>{result.pressure?.text || "Brak danych"}</strong>
                </div>
              </div>
              <ReportGroups key={result.raw} groups={result.groups} />
              {result.warnings.length > 0 && (
                <ul className="field-warnings">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {result.unsupported.length > 0 && (
                <p>
                  <strong>Nieodczytane grupy:</strong>{" "}
                  <code>{result.unsupported.join(" ")}</code>
                </p>
              )}
              {result.trend && (
                <details className="field-disclosure">
                  <summary>Trend, oddzielony od obserwacji</summary>
                  <code>{result.trend}</code>
                  <p>
                    {result.trend === "NOSIG"
                      ? "NOSIG: nie przewiduje się istotnych zmian w okresie trendu. To nie gwarancja niezmiennych warunków."
                      : "Nie wliczamy tych grup do bieżącego pułapu ani widzialności. Interpretację trendów przećwicz w module METAR / TAF."}
                  </p>
                </details>
              )}
              {result.remarks && (
                <details className="field-disclosure">
                  <summary>RMK: uwagi w oryginale</summary>
                  <code>{result.remarks}</code>
                  <p>
                    Ta wersja czytnika nie dekoduje uwag. Nie traktuj ich jako
                    nieistotnych.
                  </p>
                </details>
              )}
              {result.wind &&
                !result.wind.variable &&
                (result.wind.from != null || result.wind.calm) && (
                  <WindWorkbench
                    key={result.raw}
                    reportWind={{ ...result.wind, from: result.wind.from ?? 0 }}
                    fixed
                    onSources={onSources}
                  />
                )}
              {result.wind?.variable && (
                <p className="field-caution">
                  VRB: kierunek wiatru jest zmienny. Bez jednego kierunku
                  nie obliczamy składowej bocznej.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function MapWorkbench({ onSources }) {
  const [level, setLevel] = useState("surface");
  const [hour, setHour] = useState(0);
  const [model, setModel] = useState("A");
  const data = {
    surface: { A: [12, 16, 21], B: [14, 23, 26] },
    upper: { A: [30, 35, 42], B: [32, 39, 45] },
  };
  const value = data[level][model][hour];
  return (
    <section className="field-map-workbench">
      <div className="field-section-label">
        <span className="eyebrow">Ćwiczenie odczytu mapy</span>
        <SourceLink
          ids={["windyOverlays", "windyAcademy", "ecmwfModelLevels"]}
          onSources={onSources}
        />
      </div>
      <h2>Co zmienia odczyt na mapie?</h2>
      <p>
        Wybierz poziom atmosfery, termin i model A lub B. Porównasz prędkości
        wiatru w jednym punkcie. Wszystkie liczby są wymyślone do ćwiczenia;
        modele A i B nie są prawdziwymi modelami pogody ani danymi Windy.
      </p>
      <div className="field-map-grid">
        <div className="field-map-readout">
          <Compass size={38} weight="light" />
          <span>Punkt ćwiczeniowy</span>
          <strong>
            {value}
            <small> kt</small>
          </strong>
          <span>
            {level === "surface"
              ? "10 m przy powierzchni"
              : "850 hPa, poziom ciśnienia"}
          </span>
          <small>
            model {model} · za {[0, 3, 6][hour]} h
          </small>
        </div>
        <div className="field-map-controls">
          <label>
            Poziom
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="surface">10 m · przy powierzchni</option>
              <option value="upper">850 hPa · powierzchnia ciśnienia</option>
            </select>
          </label>
          <label>
            Model szkoleniowy
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              <option>A</option>
              <option>B</option>
            </select>
          </label>
          <Slider
            label="Za ile godzin"
            value={hour * 3}
            onChange={(value) => setHour(value / 3)}
            max={6}
            step={3}
            unit=" h"
          />
          <p aria-live="polite">
            Drugi model dla tego samego czasu i poziomu:{" "}
            <strong>{data[level][model === "A" ? "B" : "A"][hour]} kt.</strong>{" "}
            Różnica nie mówi, który model ma rację.
          </p>
        </div>
      </div>
      <p className="field-caution">
        W rzeczywistym Windy sprawdź model, poziom, legendę, czas ważności i
        czas aktualizacji. Powierzchnia 850 hPa nie leży zawsze na stałej
        wysokości; w górach może przecinać teren.
      </p>
      <a
        className="field-external"
        href="https://www.windy.com/"
        target="_blank"
        rel="noreferrer"
      >
        Otwórz Windy w przeglądarce <ArrowSquareOut size={17} />
      </a>
    </section>
  );
}

export function FieldPractice({ track = "metar", navigate, onSources }) {
  const selected = TRACKS[track] ? track : "metar";
  const [panel, setPanel] = useState("tool");
  const [audience, title, subtitle] = TRACKS[selected];
  return (
    <main className="page field-page">
      <button className="field-back" onClick={() => navigate("home")}>
        <ArrowLeft size={18} /> Dziś
      </button>
      <header className="field-page-heading">
        <span className="eyebrow">Pracownia terenowa · {audience}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <button className="field-source field-full-workshop" onClick={() => navigate(selected === "metar" ? "layers/metar" : selected === "maps" ? "layers/decoder" : "layers/wind")}>
          Otwórz pełną pracownię atmosfery <ArrowRight size={17} />
        </button>
      </header>
      <nav className="field-segments" aria-label="Pracownie">
        {[
          ["metar", "METAR / TAF"],
          ["wind", "Wiatr"],
          ["maps", "Windy i mapy"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-current={selected === id ? "page" : undefined}
            aria-pressed={selected === id}
            onClick={() => navigate(`practice/${id}`)}
          >
            {label}
          </button>
        ))}
      </nav>
      <nav
        className="field-lab-mode"
        aria-label="Sposób korzystania z pracowni"
      >
        <button
          aria-pressed={panel === "tool"}
          aria-controls="field-tool"
          onClick={() => setPanel("tool")}
        >
          Narzędzie
        </button>
        <button
          aria-pressed={panel === "training"}
          aria-controls="field-training"
          onClick={() => setPanel("training")}
        >
          Trening ·{" "}
          {practiceCases.filter((item) => item.track === selected).length}{" "}
          <ArrowRight size={17} />
        </button>
      </nav>
      <div id="field-tool" hidden={panel !== "tool"}>
        {selected === "metar" && (
          <AviationReader
            onSources={onSources}
            onTraining={() => setPanel("training")}
          />
        )}
        {selected === "wind" && <WindWorkbench onSources={onSources} />}
        {selected === "maps" && <MapWorkbench onSources={onSources} />}
      </div>
      <div id="field-training" hidden={panel !== "training"}>
        <PracticeChallenge
          key={selected}
          track={selected}
          onSources={onSources}
        />
      </div>
      <aside className="field-deeper">
        <Wind size={24} />
        <div>
          <strong>Poznaj pełną pracownię atmosfery</strong>
          <p>
            Znajdziesz w niej opisy warstw Windy, trening depesz, ćwiczenia
            porównywania raportów ze stacji i sondaże pokazujące zmiany pogody
            wraz z wysokością.
          </p>
        </div>
        <button
          className="button button--secondary"
          onClick={() =>
            navigate(
              selected === "metar"
                ? "layers/metar"
                : selected === "maps"
                  ? "layers/decoder"
                  : "layers/wind",
            )
          }
        >
          Pełna pracownia <ArrowRight size={17} />
        </button>
      </aside>
      <p className="field-safety">
        Narzędzia edukacyjne. Nie zastępują oficjalnego briefingu, ostrzeżeń,
        aktualnych pomiarów ani ograniczeń statku powietrznego, jachtu i załogi.
        Wynik ćwiczenia nie jest zgodą na lot lub wyjście na wodę.
      </p>
    </main>
  );
}
