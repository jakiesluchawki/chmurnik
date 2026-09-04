import { useId, useState } from "react";
import { squarePhotoRegion, prepareRecognitionRegion, validatePhotoRegion } from "../lib/photo-frame.js";

const regionStyle = (bounds) => ({ left: `${bounds.x * 100}%`, top: `${bounds.y * 100}%`,
  width: `${bounds.width * 100}%`, height: `${bounds.height * 100}%` });

export function PhotoFrame({ source, onAnalyze, onSelectRegion, regions = [], disabled, analyzing }) {
  const id = useId();
  const [size, setSize] = useState(null);
  const [point, setPoint] = useState(null);
  const [fraction, setFraction] = useState(.55);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frame = size && point ? squarePhotoRegion(size.width, size.height, point, fraction) : null;
  const proposals = regions.filter((region) => {
    try { validatePhotoRegion(region.bounds); return Boolean(region.id); } catch { return false; }
  }).slice(0, 5);
  const apply = async (bounds, region) => {
    if (disabled || busy) return;
    setBusy(true); setError("");
    try {
      const photo = await prepareRecognitionRegion(source, bounds);
      if (region && onSelectRegion) await onSelectRegion(region, photo);
      else await onAnalyze(photo, { bounds });
    } catch {
      setError("Nie udało się odczytać fragmentu. Całe zdjęcie pozostaje bez zmian.");
    } finally { setBusy(false); }
  };
  const selectPoint = (event) => {
    if (disabled || busy || !size) return;
    const box = event.currentTarget.getBoundingClientRect();
    setPoint({ x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) });
  };
  const keyPoint = (event) => {
    if (disabled || busy || !size) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    const next = { ...(point || { x: .5, y: .5 }) };
    if (event.key === "ArrowLeft") next.x -= .05;
    if (event.key === "ArrowRight") next.x += .05;
    if (event.key === "ArrowUp") next.y -= .05;
    if (event.key === "ArrowDown") next.y += .05;
    setPoint({ x: Math.max(0, Math.min(1, next.x)), y: Math.max(0, Math.min(1, next.y)) });
  };
  return (
    <section className="photo-region-picker" aria-label="Wybór obszaru nieba" aria-busy={busy || analyzing}>
      <div className="photo-region-image" style={size ? { maxWidth: `calc(40svh * ${size.width / size.height})` } : undefined}>
        <img src={source} alt="Całe własne zdjęcie nieba, bez przycinania"
          onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        <button type="button" className="photo-region-surface" aria-describedby={id}
          aria-label="Wskaż miejsce na zdjęciu; strzałki przesuwają wybór" disabled={disabled || busy}
          onClick={selectPoint} onKeyDown={keyPoint} />
        {proposals.map((region, index) => (
          <button type="button" className="photo-region-proposal" key={region.id}
            style={regionStyle(region.bounds)} disabled={disabled || busy}
            aria-label={`Sprawdź proponowany fragment ${index + 1}`}
            onClick={() => apply(region.bounds, region)}><span>{index + 1}</span></button>
        ))}
        {frame && <span className="photo-region-selection" style={regionStyle(frame)} aria-hidden="true" />}
      </div>
      <p id={id}>{analyzing ? "Analizuję zdjęcie na urządzeniu…" : proposals.length
        ? "Dotknij zaznaczonego obszaru albo wskaż inne miejsce na zdjęciu. Ramki są propozycją, nie dokładną granicą chmury."
        : "Kilka chmur na jednym zdjęciu? Dotknij tej, którą chcesz sprawdzić. Możesz też użyć strzałek na klawiaturze."}</p>
      {frame && <div className="photo-region-controls">
        <div className="photo-region-size" aria-label="Rozmiar analizowanego fragmentu">
          {[[.35, "Bliżej"], [.55, "Fragment"], [.85, "Więcej kontekstu"]].map(([value, label]) => (
            <button type="button" key={value} disabled={disabled || busy} aria-pressed={fraction === value}
              onClick={() => setFraction(value)}>{label}</button>
          ))}
        </div>
        <button type="button" className="button button--secondary" disabled={disabled || busy}
          onClick={() => apply(frame)}>{busy ? "Analizuję fragment…" : "Sprawdź zaznaczony fragment"}</button>
        <button type="button" className="button button--ghost" disabled={disabled || busy} onClick={() => setPoint(null)}>Usuń zaznaczenie</button>
      </div>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
