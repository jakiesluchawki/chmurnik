import { Gauge, MapPin, Warning } from "@phosphor-icons/react";
import { pressureLevels } from "../data/weather-layers.js";
import { pressureSurfaceContext } from "../lib/weather-layers.js";

export function PressureHeightLab({ terrain, setTerrain, pressure, setPressure }) {
  const context = pressureSurfaceContext(pressure, terrain);
  const terrainPercent = Math.min(74, (terrain / 10000) * 100);
  const levelPercent = Math.min(96, (context.altitude / 10000) * 100);
  const heightLabel = context.agl < 0 ? "Poniżej terenu" : context.agl === 0
    ? "Na wysokości terenu" : `${context.agl.toLocaleString("pl-PL")} m AGL`;
  return (
    <div className="atmosphere-lab">
      <section className="atmosphere-visual" aria-label="Schemat poziomu ciśnienia i terenu">
        <div className="atmosphere-label atmosphere-label--top">górna troposfera</div>
        <div className="pressure-line" style={{ bottom: `${levelPercent}%` }}>
          <span>{pressure} hPa</span>
          <strong>≈ {context.altitude.toLocaleString("pl-PL")} m MSL*</strong>
        </div>
        <div className="terrain-line" style={{ height: `${terrainPercent}%` }}>
          <span>teren {terrain} m MSL</span>
        </div>
        {!context.intersectsTerrain && (
          <div className="agl-bracket" style={{ bottom: `${terrainPercent}%`, height: `${levelPercent - terrainPercent}%` }}>
            <span>{heightLabel}</span>
          </div>
        )}
        <div className="atmosphere-label atmosphere-label--bottom">powierzchnia</div>
      </section>
      <section className="lab-controls">
        <span className="eyebrow">Schemat szkoleniowy</span>
        <h2>Wysokość nad morzem a wysokość nad ziemią</h2>
        <p>Zmień wysokość terenu i wybierz poziom ciśnienia. Zobaczysz, jak zmienia się odległość między ziemią a wybranym poziomem.</p>
        <label>
          <span>Wysokość terenu <strong>{terrain} m MSL</strong></span>
          <input type="range" min="0" max="2200" step="50" value={terrain} onChange={(event) => setTerrain(Number(event.target.value))} />
        </label>
        <div className="pressure-picker" aria-label="Poziom ciśnienia">
          {Object.keys(pressureLevels).map((value) => (
            <button key={value} className={pressure === Number(value) ? "active" : ""}
              aria-pressed={pressure === Number(value)} onClick={() => setPressure(Number(value))}>{value} hPa</button>
          ))}
        </div>
        <div className="lab-reading">
          <Gauge size={26} />
          <div><span>Wybrany poziom</span><strong>{pressure} hPa · {context.use}</strong></div>
        </div>
        <div className="lab-reading" aria-live="polite">
          <MapPin size={26} />
          <div><span>Wysokość względem terenu w tym schemacie</span><strong>{heightLabel}</strong></div>
        </div>
        {context.intersectsTerrain && (
          <div className="lab-reading">
            <Warning size={26} />
            <p>Wybrany poziom nie znajduje się ponad terenem. W tym miejscu nie przedstawia warstwy swobodnego powietrza nad ziemią.</p>
          </div>
        )}
        <p className="lab-footnote">MSL to wysokość nad średnim poziomem morza, a AGL nad gruntem. * Wysokości poziomów ciśnienia są przybliżeniem atmosfery standardowej, nie aktualnym pomiarem. W rzeczywistej atmosferze zmieniają się; w modelu pogody sprawdza się geopotencjał.</p>
      </section>
    </div>
  );
}
