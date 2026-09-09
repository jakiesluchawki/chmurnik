import React, { createContext, useContext, useRef, useState } from "react";
import { ArrowUp, ArrowDown, ArrowRight, Drop, Snowflake, Sun, Wind, Cloud, Clock, Check, Question } from "@phosphor-icons/react";
import { clouds } from "../../src/data/clouds.js";
import { skyReport, tafAt, tafExample, forcedLift, icingConditions, heightReference,
  selectedSounding, stormIngredients, windFromCloudMotion, soundingScenarios, soundingCoordinates } from "./science.mjs";

const fmt = (number) => Number(number.toFixed(1)).toLocaleString("pl-PL");
export const observationPhoto = clouds.find(c => c.id === "stratocumulus").images.find(i => i.id === "stratocumulus-jastrzebie");
export const photoPath = (image) => `./photos/${image.src.split("/").pop()}`;
const FeltCloud = ({ className = "", style }) => <img className={`lab-cloud ${className}`} src="./cloud.webp" alt="" style={style} />;
const Metric = ({ label, children, className = "" }) => <div className={`lab-metric ${className}`}><span>{label}</span><strong>{children}</strong></div>;
const InterpretationContext = createContext(false);
const Readout = ({ children }) => useContext(InterpretationContext) ? null : <details className="lab-readout"><summary>Odczyt i objaśnienie sceny</summary><div>{children}</div></details>;
const CurrentEvidence = ({ label, children }) => <div className="lab-current-evidence" role="group" aria-label={label}>{children}</div>;

// One coordinate for ground, reference line and tests; labels never offset it.
export const heightScenePosition = (metres) => 8 + metres / 2500 * 74;

export function draggedSceneValue(value, displacement, travel, min, max, step) {
  if (!Number.isFinite(travel) || travel <= 0) return value;
  return Math.max(min, Math.min(max, Math.round((value - displacement / travel * (max - min)) / step) * step));
}
function DragHandle({ label, value, min, max, step, travel, onChange, style }) {
  const drag = useRef(null);
  return <button type="button" role="slider" className="lab-manipulator" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-orientation="vertical" style={style}
    onPointerDown={event => { event.preventDefault(); const rect = event.currentTarget.parentElement.getBoundingClientRect(); drag.current = { y: event.clientY, value, travel: rect.height * travel }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { if (drag.current) onChange(draggedSceneValue(drag.current.value, event.clientY - drag.current.y, drag.current.travel, min, max, step)); }}
    onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => { const next = ({ArrowUp:value+step,ArrowRight:value+step,ArrowDown:value-step,ArrowLeft:value-step,PageUp:value+step*5,PageDown:value-step*5,Home:min,End:max})[event.key]; if (next !== undefined) { event.preventDefault(); onChange(Math.max(min,Math.min(max,next))); } }}><ArrowUp aria-hidden="true" /></button>;
}

const photoDescriptions = {
  cumulus: "Oddzielne białe kopuły mają zbliżony poziom płaskich podstaw. Między kłębami widać niebo.",
  cirrus: "Na niebie widać cienkie, włókniste smugi, a nie oddzielne kłęby o płaskich podstawach.",
  altostratus: "Szara, rozległa zasłona ma miejscami pofalowaną strukturę. Nie rozpada się na osobne kłęby.",
  stratocumulus: "Zdjęcie z góry pokazuje połączone, wyraźne człony tworzące wspólną warstwę.",
};
function PhotoScene({ id, state, conceal, compareState, annotate, describePhotos = false, annotation, onAnnotation }) {
  const [localMark, setLocalMark] = useState(null);
  const mark = onAnnotation ? annotation : localMark;
  const setMark = onAnnotation || setLocalMark;
  const hidden = conceal || id === "obserwacja" && state.reveal !== "shown";
  const genus = clouds.find(c => c.id === (id === "obserwacja" ? "stratocumulus" : state.genus));
  const image = id === "obserwacja" ? observationPhoto : genus.images[0];
  if (compareState) {
    const before = clouds.find(c => c.id === compareState.genus);
    return <><div className="lab-photo-comparison">{[before, genus].map((item, index) => <figure key={`${item.id}-${index}`}><b>{index === 0 ? "A · poprzedni przykład" : "B · porównaj budowę"}</b><img src={photoPath(item.images[0])} alt={hidden ? `Fotografia ${index === 0 ? "A" : "B"}: porównaj budowę chmur w pełnym kadrze` : `${item.name}: ${item.images[0].diagnostic}`} /><figcaption>{!hidden && <strong>{item.name}<br /></strong>}Fot. {item.images[0].author} · {item.images[0].license}{!hidden && <> · <a href={item.images[0].page} target="_blank" rel="noreferrer">Źródło</a></>}</figcaption>{describePhotos && <p className="lab-photo-description">{photoDescriptions[item.id]}</p>}</figure>)}</div><Readout><h2>{genus.name}</h2><p>{image.diagnostic}</p><p>{genus.level} · {genus.altitude}. To kontekst atlasu, nie pomiar ze zdjęcia.</p></Readout></>;
  }
  const photo = <img src={id === "obserwacja" ? "./photos/observation.jpg" : photoPath(image)} alt={hidden ? "Pełny kadr nieba nad polem i drzewami. Obejrzyj budowę chmur przed odsłonięciem porównania." : `${genus.name}: ${image.diagnostic}`} />;
  return <>
    <figure className="lab-photo">
      {annotate ? <><button className="lab-photo-pick" aria-label="Zaznacz fragment fotografii; klawiatura zaznaczy środek" onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setMark(event.detail === 0 ? {x:50,y:50} : {x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100}); }}>{photo}{mark && <span className="lab-photo-mark" style={{left:`${mark.x}%`,top:`${mark.y}%`}} />}</button><div className="lab-photo-mark-buttons"><button onClick={() => setMark({x:50,y:22})}>Zaznacz górną część</button><button onClick={() => setMark({x:50,y:72})}>Zaznacz dolną część</button>{mark && <button onClick={() => setMark(null)}>Usuń znacznik</button>}</div></> : mark ? <div className="lab-photo-pick">{photo}<span className="lab-photo-mark" style={{left:`${mark.x}%`,top:`${mark.y}%`}} /></div> : photo}
      <figcaption>Fot. {image.author} · {image.license} · prawdziwa fotografia, pełny kadr
        {!hidden && <> · <a href={image.page} target="_blank" rel="noreferrer">Oryginał i licencja</a></>}
      </figcaption>
      {describePhotos && <p className="lab-photo-description">{id === "obserwacja" ? "Nad polem i drzewami widać rozległą warstwę z połączonymi wypukłościami i ciemniejszymi podstawami. Przy horyzoncie niebo ma ciepłe barwy. Kadr nie zawiera pomiaru wysokości chmur." : photoDescriptions[genus.id]}</p>}
    </figure>
    <Readout>{hidden ? <><h2>Jeszcze bez nazwy</h2><p>{state.feature === "rolls" ? "Wskazałeś szerokie, połączone wały. Przyjrzyj się również ich cieniowaniu." : "Obejrzyj układ członów. Horyzont pozostaje widoczny, aby nie gubić kontekstu obserwacji."}</p>
      {state.altitude === "unknown" && <p>Wysokość podstawy: brak pomiaru.</p>}</> : <><h2>{genus.name}</h2><p>{image.diagnostic}</p>
      <p className="lab-small">{genus.level} · {genus.altitude}. Zakres orientacyjny, nie pomiar ze zdjęcia.</p></>}</Readout>
  </>;
}

function LiftScene({ state, onStateChange, controlKey }) {
  const hideInterpretation = useContext(InterpretationContext);
  const result = forcedLift(state);
  const difference = Number(result.parcel.toFixed(1)) - Number(result.temperatureEnvironment.toFixed(1));
  const mountain = state.mechanism === "mountain";
  const y = mountain ? 60 - state.progress * .32 : 78 - result.height / 2200 * 53;
  const x = mountain ? 15 + state.progress * .45 : 36 + state.progress * .21;
  return <>
    <div className={`lab-scene lab-lift ${mountain ? "with-mountain" : ""}`} role={onStateChange ? "group" : "img"}
      aria-label={`Porcja na ${Math.round(result.height)} metrach. Temperatura ${fmt(result.parcel)} stopni, otoczenie ${fmt(result.temperatureEnvironment)}.${hideInterpretation ? "" : result.saturated ? " Osiągnięte nasycenie." : " Przed kondensacją."}`}>
      <img className="lab-backdrop" src={mountain ? "./mountain.webp" : "./coast.webp"} alt="" />
      {!mountain && <div className="lab-cold-mass" style={{ "--advance": `${state.progress * .34}%` }}><span>chłodniejsza masa</span></div>}
      <svg className="lab-lift-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1={mountain ? 15 : 36} y1={mountain ? 60 : 78} x2={mountain ? 60 : 57} y2={mountain ? 28 : 25} /></svg>
      <div className="lab-portion" style={{ top: `${y}%`, left: `${x}%` }}>
        <span className="lab-air-ring" /><FeltCloud style={{ opacity: result.opacity }} /><ArrowUp className="lab-lift-arrow" />
      </div>
      <span className="lab-scene-tag">{mountain ? "Przepływ nad zboczem" : "Przekrój przez front"} · schemat</span>
      {onStateChange && controlKey === "progress" && <DragHandle label="Unieś porcję na scenie" value={state.progress} min={0} max={100} step={1} travel={mountain ? .32 : .53} style={{top:`${y}%`,left:`${x}%`}} onChange={progress => onStateChange({progress})} />}
    </div>
    <CurrentEvidence label="Temperatury na tej samej wysokości">
      <p className="lab-evidence-context">Ta sama wysokość: <strong>{Math.round(result.height)} m uniesienia</strong></p>
      <div className="lab-metrics"><Metric label="Temperatura porcji">{fmt(result.parcel)}°C</Metric><Metric label="Temperatura otoczenia">{fmt(result.temperatureEnvironment)}°C</Metric></div>
      {!hideInterpretation && <p>{difference === 0 ? "Temperatury są równe w pokazanej dokładności." : `Porcja jest o ${fmt(Math.abs(difference))}°C ${difference > 0 ? "cieplejsza" : "chłodniejsza"} od otoczenia.`} Ruch nadal wymuszamy.</p>}
    </CurrentEvidence>
    <Readout>
      <p>{result.saturated ? "Porcja osiągnęła nasycenie; wraz z dalszym unoszeniem rośnie widoczność chmury." : "Ta porcja nie osiągnęła jeszcze poziomu kondensacji."} {result.height > 0 && (result.buoyant ? "Jest cieplejsza od otoczenia, co w tym uproszczeniu sprzyja dalszemu unoszeniu." : "Nie jest wyraźnie cieplejsza od otoczenia; ruch nadal wymuszamy.")}</p>
      <p className="lab-small">Wysokość dotyczy uniesienia porcji, nie wysokości frontu. Rysunek nie zachowuje skali poziomej i pionowej.</p></Readout>
  </>;
}

function WindLane({ direction, title, onChange }) {
  const wind = windFromCloudMotion(direction);
  const angle = direction * Math.PI / 180;
  return <section className="lab-wind-lane">
    <h3>{title}</h3><div className="lab-compass" role={onChange ? "group" : "img"} aria-label={`Dryf do ${wind.toward} stopni, wiatr z ${wind.from} stopni.`}>
      <span className="north">N</span><span className="east">E</span><span className="south">S</span><span className="west">W</span>
      <div className="lab-compass-arrow" style={{ transform: `rotate(${direction}deg)` }}><ArrowUp /></div>
      {[0, 1, 2].map(i => <div key={i} className="lab-drifter" style={{ "--dx": `${Math.sin(angle) * 85}px`, "--dy": `${-Math.cos(angle) * 85}px`, animationDelay: `${-i * 2}s` }}><FeltCloud /></div>)}
      {onChange && <div className="lab-compass-points">{["N","NE","E","SE","S","SW","W","NW"].map((name,i) => <button key={name} aria-label={`${title}: skieruj chmurę do ${name}, ${i*45} stopni`} aria-pressed={direction === i*45} style={{left:`${50+46*Math.sin(i*Math.PI/4)}%`,top:`${50-46*Math.cos(i*Math.PI/4)}%`}} onClick={() => onChange(i*45)}>{name}</button>)}</div>}
    </div><p>Chmura <strong>do {wind.towardLabel} · {wind.toward}°</strong><br />Wiatr <strong>z {wind.fromLabel} · {wind.from}°</strong></p>
  </section>;
}
function WindScene({ state, onStateChange, controlKey }) {
  return <><div className="lab-wind-scene"><WindLane direction={state.direction} title="Niższa warstwa" onChange={onStateChange && controlKey === "direction" ? direction => onStateChange({direction}) : undefined} />
    {state.layers === "two" && <WindLane direction={state.upper} title="Wyższa warstwa" onChange={onStateChange && controlKey === "upper" ? upper => onStateChange({upper}) : undefined} />}</div>
    <Readout><p>Widok z góry. Ruch znacznika pokazuje kierunek dryfu; tempo animacji nie przedstawia prędkości wiatru. Po zatrzymaniu animacji kierunek nadal wskazuje strzałka.</p></Readout></>;
}

function MetarScene({ state, onStateChange, controlKey }) {
  const hideInterpretation = useContext(InterpretationContext);
  if (state.product === "taf") {
    const result = tafAt(state.hour);
    return <><div className="lab-taf-scene"><span className="eyebrow">Prognoza szkoleniowa · dzień 8 · UTC</span><code className="lab-report">{tafExample}</code>
      <div className="lab-time-strip" aria-label="Okres ważności od 12 do 18 UTC">
        {[12, 13, 14, 15, 16, 17, 18].map(hour => onStateChange && controlKey === "hour" ? <button key={hour} aria-label={`Odczytaj TAF o ${hour}:00 UTC`} aria-pressed={hour === state.hour} onClick={() => onStateChange({hour})}>{hour}</button> : <span key={hour} className={hour === state.hour ? "selected" : ""}>{hour}</span>)}
      </div><div className="lab-time-bands"><span className="lab-base-band">12–16 · stan bazowy</span><span className="lab-fm-band">16–18 · FM</span><span className="lab-tempo-band">13–15 · TEMPO</span></div>
      <div className="lab-forecast-card"><Clock /><h3>{result.base}</h3><p>{result.temporary || (result.valid ? "Dla tej godziny nie obowiązuje grupa TEMPO z tego przykładu." : "O 18:00 kończy się ważność tej prognozy. Nie przedłużamy jej automatycznie.")}</p></div>
    </div><Readout><p>Przesuwasz godzinę odczytu prognozy, nie obserwowany czas pogody. TEMPO może wystąpić przejściowo w swoim oknie, nie musi trwać przez całe okno.</p></Readout></>;
  }
  const result = skyReport(state);
  const upperUnknown = result.code === "OVC";
  const layer = (count, height, key) => <div key={key} className="lab-sky-layer" style={{ bottom: `${14 + height / 7000 * 69}%` }}>
    <span>{height} ft</span><div>{Array.from({ length: 8 }, (_, i) => <FeltCloud key={i} style={{ opacity: i < count ? 1 : .1 }} />)}</div></div>;
  return <><div className="lab-scene lab-metar-sky" role="img" aria-label={`${result.groups}.${hideInterpretation ? "" : ` Pułap ${result.ceiling} stóp nad lotniskiem.`}${upperUnknown ? " Powyżej OVC: brak danych, nie dowód braku chmur." : ""}`}>
    <div className="lab-airfield">Poziom lotniska · 0 ft AGL</div>{upperUnknown ? <div className="lab-sky-unknown">Powyżej OVC: brak danych</div> : layer(6, 6000, "upper")}{layer(result.oktas, result.base, "lower")}
    <span className="lab-scene-tag">Podstawy warstw · nie grubość chmur</span></div>
    <CurrentEvidence label="Bieżący METAR i wysokości warstw">
      <p className="lab-evidence-context">METAR szkoleniowy · AGL: nad lotniskiem</p>
      <code className="lab-report">{result.report}</code><div className="lab-metrics"><Metric label="Najniższa podstawa">{result.base} ft AGL</Metric>{!hideInterpretation && <Metric label="Pułap (ceiling)">{result.ceiling} ft AGL</Metric>}</div>
      {onStateChange && controlKey === "cover" && <div className="lab-photo-mark-buttons" role="group" aria-label="Zmień grupę niższej warstwy">{["FEW","SCT","BKN","OVC"].map(cover => <button className="lab-report-token" key={cover} aria-pressed={state.cover === cover} onClick={() => onStateChange({cover})}>{cover}{String(state.base).padStart(3,"0")}</button>)}</div>}
      {!hideInterpretation && <p>{["FEW", "SCT"].includes(result.code) ? "Niższa warstwa nie tworzy pułapu. Robi to BKN060 powyżej niej." : "Najniższa warstwa BKN lub OVC tworzy pułap."}</p>}
      {upperUnknown && <p>Powyżej OVC nie znamy warstw. To nie znaczy, że nie ma tam chmur.</p>}
    </CurrentEvidence>
    <Readout>
      <p className="lab-small">AGL: nad poziomem lotniska w tym raporcie. Ikony pokazują umowne pokrycie nieba, nie osiem oddzielnych chmur. Zakończenie na OVC nie oznacza braku chmur wyżej.</p></Readout></>;
}

function HeightScene({ state, onStateChange }) {
  const hideInterpretation = useContext(InterpretationContext);
  const result = heightReference(state);
  const atGround = result.agl === 0;
  const relation = result.belowGround ? `${result.terrain - result.msl} m pod terenem` : atGround ? "0 m AGL · na powierzchni terenu" : `${result.agl} m AGL · nad gruntem`;
  return <><div className="lab-scene lab-height-scene" role={onStateChange ? "group" : "img"} aria-label={`Teren ${result.terrain} metrów MSL, poziom ${result.msl} metrów MSL.${hideInterpretation ? "" : ` ${relation}.`}`}>
    <div className="lab-sea-level">0 m MSL · poziom morza</div>
    <div className="lab-terrain-column" style={{ height: `${heightScenePosition(result.terrain)}%` }}><span>Teren {result.terrain} m</span></div>
    <div className={`lab-reference-line ${result.belowGround ? "buried" : atGround ? "at-ground" : ""}`} style={{ bottom: `${heightScenePosition(result.msl)}%` }}><span className="lab-reference-label">{result.msl} m MSL</span></div>
    {onStateChange && <DragHandle label="Wysokość terenu na scenie, metry MSL" value={state.terrain} min={0} max={2000} step={100} travel={.592} style={{top:`${100-heightScenePosition(state.terrain)}%`,left:"65%"}} onChange={terrain => onStateChange({terrain})} />}
  </div><CurrentEvidence label="Położenie poziomu względem terenu">{hideInterpretation ?
    <div className="lab-metrics"><Metric label="Poziom odniesienia">{result.msl} m MSL</Metric><Metric label="Teren">{result.terrain} m MSL</Metric></div> :
    <><p><strong>{relation}</strong></p><p>{result.belowGround ? "Ten poziom nie jest tu warstwą powietrza nad gruntem." : atGround ? "Poziom pokrywa się z powierzchnią, nie leży ponad nią." : `${result.msl} − ${result.terrain} = ${result.agl} m.`}</p></>}</CurrentEvidence>
    <Readout><p>MSL oznacza wysokość nad średnim poziomem morza, AGL nad lokalnym gruntem. Zmiana terenu nie przesuwa stałego poziomu MSL.</p><p>Pokazujemy poziom geometryczny, nie chmurę ani powierzchnię stałego ciśnienia. Nie odczytuj danych pod terenem jak warunków nad gruntem.</p></Readout></>;
}

function SoundingScene({ state }) {
  const level = selectedSounding(state.level);
  const profile = soundingScenarios[0].profile;
  const detail = ["temperature", "moisture", "parcel", "wind"].indexOf(state.detail);
  const skew = state.projection === "skew";
  const point = (t, p) => soundingCoordinates(t, p, skew);
  const path = (key) => profile.map((row, i) => { const p = point(row[key], row.pressure); return `${i ? "L" : "M"}${p.x},${p.y}`; }).join(" ");
  const y = point(0, level.pressure).y;
  return <><div className="lab-sounding-chart"><div className="lab-current-level"><span>Na poziomie <strong>{level.pressure} hPa</strong></span><div><Metric label="Temperatura otoczenia">{level.temperature}°C</Metric>{detail > 0 && <Metric label="Punkt rosy">{level.dewpoint}°C</Metric>}{detail > 1 && <Metric label="Unoszona porcja">{level.parcel}°C</Metric>}{detail > 2 && <Metric label={`Wiatr na ${level.pressure} hPa`} className="lab-wind-metric">z {level.windDirection}° · {level.windSpeed} kt</Metric>}</div>{detail > 2 && <p className="lab-level-wind"><Wind aria-hidden="true" /> Kierunek „z”: skąd wieje. kt: węzły, jednostka prędkości.</p>}</div><details className="lab-profile-details" open={skew || detail > 2}><summary>Pełny profil i osie wykresu</summary><span className="eyebrow">{skew ? "Uproszczony Skew-T / log-p" : "Profil na prostych osiach temperatury"}</span>
    <svg viewBox="0 0 470 390" role="img" aria-label={`Wybrany poziom ${level.pressure} hPa, temperatura ${level.temperature} stopni.${detail > 0 ? ` Punkt rosy ${level.dewpoint} stopni.` : ""}`}>
      <defs><clipPath id="profile-clip"><rect x="55" y="48" width="355" height="298" /></clipPath></defs>
      {[1000, 850, 700, 500, 300, 200].map(p => <g key={p}><line x1="55" x2="410" y1={point(0, p).y} y2={point(0, p).y} stroke="var(--line)" /><text x="47" y={point(0, p).y + 4} textAnchor="end">{p}</text></g>)}
      <g clipPath="url(#profile-clip)">{[-70, -50, -30, -10, 10, 30].map(t => <line key={t} x1={point(t, 1000).x} y1="344" x2={point(t, 200).x} y2="52" stroke="var(--line)" />)}
        <line x1="55" x2="410" y1={y} y2={y} stroke="var(--violet)" strokeDasharray="4 4" />
        {[["temperature", "#a2483c", 0], ["dewpoint", "#377268", 1], ["parcel", "#7442d9", 2]].filter(([, , n]) => detail >= n).map(([key, color]) => <g key={key}><path d={path(key)} stroke={color} strokeWidth="3" fill="none" strokeDasharray={key === "parcel" ? "7 4" : undefined} /><circle cx={point(level[key], level.pressure).x} cy={y} r="5" fill={color} stroke="var(--white)" strokeWidth="2" /></g>)}
      </g>{[-70, -50, -30, -10, 10, 30].map(t => <text key={t} x={point(t, 1000).x} y="365" textAnchor="middle">{t}°</text>)}
      <text x="14" y="28">hPa</text><text x="244" y="387" textAnchor="middle">Temperatura °C</text>
    </svg><div className="lab-chart-key"><span className="t">Temperatura</span>{detail > 0 && <span className="td">Punkt rosy</span>}{detail > 1 && <span className="parcel">Porcja · linia przerywana</span>}</div></details>
  </div><Readout><div className="lab-metrics"><Metric label="Wybrany poziom">{level.pressure} hPa</Metric><Metric label="Otoczenie">{level.temperature}°C</Metric>{detail > 0 && <Metric label="Punkt rosy">{level.dewpoint}°C</Metric>}{detail > 1 && <Metric label="Unoszona porcja">{level.parcel}°C</Metric>}</div>
    {detail > 0 && <p>Odstęp temperatury od punktu rosy: <strong>{level.spread}°C</strong>.</p>}
    <p className="lab-small">Ciśnienie maleje ku górze w skali logarytmicznej. Rysunek nie zawiera jeszcze siatki adiabatycznej ani całkowania energii CAPE. Dane są dydaktyczne, a nie bieżące.</p></Readout></>;
}

function IcingScene({ state }) {
  const result = icingConditions(state);
  const phase = state.phase === "liquid" ? result.temperature < 0 ? "Przechłodzone krople ciekłej wody" : "Krople ciekłej wody" : state.phase === "ice" ? "Tylko suche kryształki lodu" : "Bez kropli";
  return <><div className="lab-scene lab-icing-scene" role="img" aria-label={`${result.temperature} stopni, ${state.phase === "liquid" ? "krople ciekłej wody" : state.phase === "ice" ? "suche kryształki" : "brak kropli"}. ${result.amount > 0 ? "Widoczny symbol osadu na krawędzi." : "Brak akrecji z kropli w tej próbie."}`}>
    <span className="lab-scene-tag">Przekrój przez skrzydło · napływ z lewej</span>
    <div className="lab-wing"><img src="./wing.webp" alt="" /><div className="lab-ice-deposit" style={{ opacity: result.amount, transform: `scale(${.8 + result.amount * .35})` }}>{[0, 1, 2, 3].map(i => <Snowflake key={i} weight="fill" />)}</div></div>
    {state.phase !== "dry" && [0, 1, 2, 3, 4].map(i => <span key={i} className="lab-incoming" style={{ top: `${30 + i * 8}%`, animationDelay: `${-i * .7}s` }}>{state.phase === "liquid" ? <Drop weight="fill" /> : <Snowflake />}</span>)}
    <div className="lab-flow-caption"><ArrowRight /> kierunek przepływu</div>
  </div><CurrentEvidence label="Warunki osobnej próby oblodzenia">
    <p className="lab-evidence-context">Osobna próba od czystej powierzchni · ekspozycja {state.exposure}%</p>
    <div className="lab-metrics"><Metric label="Powietrze i skrzydło">{result.temperature}°C</Metric><Metric label="Napływająca woda" className="lab-phase-metric">{phase}</Metric></div>
    <p>{result.amount > 0 ? "Na krawędzi pokazano umowny osad." : result.accretion ? "Ekspozycja wynosi 0%: jeszcze bez osadu." : "Brak osadu z kropli w tej próbie."}</p>
    <p>Zmiana ustawień to nowa próba. Zniknięcie osadu nie oznacza topnienia.</p>
  </CurrentEvidence><Readout>
    <p>{result.liquid && result.temperature < 0 ? "To przechłodzona ciekła woda. Zwiększ ekspozycję, aby zobaczyć umowny osad." : "Ten wariant nie spełnia warunków pokazanego mechanizmu akrecji."}</p>
    <p className="lab-small">Każda zmiana warunków zaczyna nową próbę, nie topi poprzedniego lodu. Pomijamy inne mechanizmy, m.in. szron i oblodzenie silników. Nie obliczamy grubości ani intensywności oblodzenia.</p></Readout></>;
}

function TurbulenceScene({ state }) {
  const strength = state.strength / 100;
  const thermal = state.mechanism === "thermal", shear = state.mechanism === "shear";
  return <><div className={`lab-scene lab-turbulence ${state.mechanism}`} role="img" aria-label={`Schemat zaburzenia: ${thermal ? "nierówne ogrzewanie" : shear ? "uskok wiatru" : "przeszkoda"}, umowne wymuszenie ${state.strength} procent.`}>
    <img className="lab-backdrop" src={thermal || shear ? "./coast.webp" : "./mountain.webp"} alt="" />
    {thermal && <Sun className="lab-heating-sun" weight="fill" style={{ opacity: .25 + strength * .75 }} />}
    {shear && <div className="lab-shear-boundary">granica warstw</div>}
    <div className="lab-streams" aria-hidden="true">{[0, 1, 2].map(row => <div className="lab-stream-row" key={row} style={{ top: `${18 + row * 23}%` }}>{[0, 1, 2, 3].map(i => <span key={i} className="lab-stream-dot" style={{ "--eddy": `${strength * (thermal ? -65 : 28) * (row % 2 ? 1 : -1)}px`, "--travel": `${shear ? 5 + (row === 0 ? -2 : 2) * strength : 5}s`, animationDelay: `${-i * 1.7}s`, opacity: .25 + strength * .75 }}><ArrowRight /></span>)}</div>)}</div>
    <span className="lab-scene-tag">Tory symboliczne · nie pomiar turbulencji</span>
  </div><Readout><h3>{thermal ? "Ruch pionowy nad cieplejszym podłożem" : shear ? "Różna prędkość na sąsiednich poziomach" : "Przepływ zaburzany przez przeszkodę"}</h3>
    <p>{state.strength === 0 ? "Wymuszenie jest wyłączone. Zwiększ je i porównaj ruch znaczników." : thermal ? "Cieplejsze porcje unoszą się, a powietrze w sąsiedztwie przemieszcza się inaczej. Bez dostatecznej wilgoci nie musi powstać chmura." : shear ? "Wyższa warstwa płynie szybciej. Zaburzenia przy granicy ilustrują możliwość powstawania turbulencji, nie jej gwarantowaną intensywność." : "Za przeszkodą przepływ może być nieregularny. Wielkość i kształt strefy zależą od warunków, których ten rysunek nie oblicza."}</p>
    <p className="lab-small">Przy zatrzymanej animacji widzisz kierunki strzałek; opis podaje źródło zaburzeń. Brak chmur nie oznacza braku turbulencji.</p></Readout></>;
}

function StormScene({ state }) {
  const conditions = stormIngredients(state);
  return <><div className="lab-scene lab-storm-scene" role="img" aria-label={conditions.possible ? `Umowna komórka: ${["rozwój", "stadium dojrzałe", "zanik"][state.phase]}.` : "Nie ma kompletu warunków w tym schemacie."}>
    <img className="lab-backdrop" src="./coast.webp" alt="" />
    <div className="lab-storm-cell" style={{ opacity: conditions.possible ? 1 : .12, transform: `translateX(-50%) scale(${state.phase === 0 ? .7 : 1})` }}><FeltCloud /><FeltCloud /><FeltCloud /></div>
    {conditions.possible && <>{state.phase < 2 && <div className="lab-updraft"><ArrowUp /><span>unoszenie</span></div>}{state.phase > 0 && <><div className="lab-downdraft"><ArrowDown /><span>opadanie</span></div><div className="lab-rain">{[0, 1, 2, 3].map(i => <Drop key={i} weight="fill" />)}</div></>}</>}
    <span className="lab-scene-tag">Schemat pojedynczej komórki</span>
  </div><Readout><div className="lab-ingredients">{[["moisture", "Wilgoć"], ["instability", "Chwiejność"], ["trigger", "Skuteczne unoszenie"]].map(([key, label]) => <span key={key} className={conditions[key] ? "ready" : ""}>{conditions[key] ? <Check /> : <Question />} {label}</span>)}</div>
    <h3>{conditions.possible ? ["Możliwy rozwój: dominuje unoszenie", "Stadium dojrzałe: unoszenie i opadanie", "Zanik: dominuje opadanie"][state.phase] : "Brakuje części warunków w tym schemacie"}</h3><p>To objaśnienie składników i cyklu, nie automat przewidujący burzę. Grad, wyładowania, oblodzenie i silne prądy mogą występować razem; nie oceniaj bezpieczeństwa z samego wyglądu chmury.</p></Readout></>;
}

function NameScene({ state, conceal }) {
  const valid = state.species !== "calvus";
  return <><div className="lab-name-scene"><span className="eyebrow">Opis szkoleniowy · nie wynik rozpoznawania</span><div className="lab-evidence"><Cloud /><p>Osobne wysokie kłęby zachowują ostre wypukłości. Opad dochodzi do ziemi. Nie obserwowano wcześniejszego rozwoju.</p></div>
    {conceal ? <div className="lab-name-slots"><span>Cumulus</span><span>gatunek do ustalenia</span><span>cecha opadu</span></div> : <div className="lab-name-parts"><strong>Cumulus</strong><span>{valid ? state.species || "gatunek?" : "gatunek niezgodny"}</span><span>{state.feature || "cecha opadu?"}</span></div>}
  </div><Readout><p>{!valid ? "Calvus jest gatunkiem Cumulonimbus. Nie tworzymy nazwy Cumulus calvus." : state.species === "humilis" ? "Humilis nie odpowiada opisanemu silnemu rozwojowi pionowemu." : state.species === "congestus" ? "Congestus odpowiada silnemu rozwojowi pionowemu zachowującemu kłębiastą budowę." : "Dopasuj gatunek do obserwowanej budowy."}</p>
    {state.feature && <p>{state.feature === "virga" ? "Virga zanika nad ziemią. W tym opisie opad do niej dochodzi." : "Praecipitatio opisuje opad docierający do powierzchni."}</p>}
    {state.history && <p>{state.history === "invent" ? "Nie znamy pochodzenia: nie ma podstaw, aby je dopisać." : "Pochodzenie pozostaje nieznane. Tego członu nie dopisujemy."}</p>}
  </Readout></>;
}

export function ActivityScene({ id, state, hideInterpretation = false, ...props }) {
  const Scene = { obserwacja:PhotoScene, rodziny:PhotoScene, front: LiftScene, wiatr: WindScene, metar: MetarScene, wysokosc: HeightScene, sondaz: SoundingScene,
    oblodzenie: IcingScene, turbulencja: TurbulenceScene, burza: StormScene, nazwy: NameScene }[id];
  return <InterpretationContext.Provider value={hideInterpretation}><Scene id={id} state={state} {...props} /></InterpretationContext.Provider>;
}
