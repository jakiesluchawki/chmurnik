import { useId, useState } from "react";
import { photoFrame, prepareRecognitionFrame } from "../lib/photo-frame.js";

export function PhotoFrame({ source, onAnalyze, disabled }) {
  const id = useId();
  const [selection, setSelection] = useState({
    zoom: 1.5,
    horizontal: 50,
    vertical: 50,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frame = photoFrame(
    100,
    100,
    selection.zoom,
    selection.horizontal,
    selection.vertical,
  );
  const apply = async () => {
    setBusy(true);
    setError("");
    try {
      await onAnalyze(
        await prepareRecognitionFrame(source, selection),
        selection,
      );
    } catch {
      setError(
        "Nie udało się odczytać fragmentu. Całe zdjęcie pozostaje bez zmian.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="photo-frame">
      <summary>Wskaż fragment nieba</summary>
      <p>
        Wybierz jedną chmurę. Zapis do kolekcji zachowa cały kadr, nie tylko
        wycinek.
      </p>
      <div className="photo-frame-image">
        <img src={source} alt="Cały kadr z ramką fragmentu do analizy" />
        <span
          style={{
            left: `${frame.x}%`,
            top: `${frame.y}%`,
            width: `${frame.width}%`,
            height: `${frame.height}%`,
          }}
        />
      </div>
      {[
        ["zoom", "Powiększenie", 1, 3, 0.1],
        ["horizontal", "Położenie lewo–prawo", 0, 100, 5],
        ["vertical", "Położenie góra–dół", 0, 100, 5],
      ].map(([key, label, min, max, step]) => (
        <label className="field-slider" htmlFor={`${id}-${key}`} key={key}>
          <span>
            {label}
            <output htmlFor={`${id}-${key}`} aria-hidden="true">
              {selection[key]}
              {key === "zoom" ? "×" : "%"}
            </output>
          </span>
          <input
            id={`${id}-${key}`}
            type="range"
            min={min}
            max={max}
            step={step}
            disabled={disabled || busy}
            value={selection[key]}
            onChange={(event) =>
              setSelection({ ...selection, [key]: Number(event.target.value) })
            }
          />
        </label>
      ))}
      <button
        className="button button--secondary"
        disabled={disabled || busy}
        onClick={apply}
      >
        {busy ? "Analizuję fragment…" : "Sprawdź ten fragment"}
      </button>
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
