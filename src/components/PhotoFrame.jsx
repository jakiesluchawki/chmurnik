import { useEffect, useId, useState } from "react";
import { movePhotoRegion, squarePhotoRegion, squareRegionForProposal, validatePhotoRegion } from "../lib/photo-frame.js";
import { createPhotoOperationScope } from "../lib/photo-operation.js";

const regionStyle = (bounds) => ({ left: `${bounds.x * 100}%`, top: `${bounds.y * 100}%`,
  width: `${bounds.width * 100}%`, height: `${bounds.height * 100}%` });

export function PhotoFrame({ source, onAnalyze, regions = [], proposalStatus = "ready", disabled, analyzing }) {
  const id = useId();
  const [size, setSize] = useState(null);
  const [manualFrame, setManualFrame] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fraction, setFraction] = useState(.55);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [operations] = useState(createPhotoOperationScope);
  useEffect(() => operations.mount(), [operations, source]);
  const proposals = regions.filter((region) => {
    try {
      validatePhotoRegion(region.bounds);
      if (size) squareRegionForProposal(size.width, size.height, region.bounds, region.anchor);
      return Boolean(region.id);
    } catch { return false; }
  }).slice(0, 5);
  const selected = proposals.find((region) => region.id === selectedId);
  const frame = size && selected ? squareRegionForProposal(size.width, size.height, selected.bounds, selected.anchor)
    : manualFrame;
  const selectProposal = (region) => {
    if (disabled || busy || !size) return;
    setSelectedId(region.id); setManualFrame(null); setError("");
  };
  const apply = async (bounds, region) => {
    if (disabled || busy) return;
    const operation = operations.begin();
    if (!operation) return;
    setBusy(true); setError("");
    try {
      await onAnalyze(bounds, region);
    } catch {
      if (operation.isCurrent()) setError("Nie udało się odczytać fragmentu. Całe zdjęcie pozostaje bez zmian.");
    } finally {
      if (operation.isCurrent()) setBusy(false);
      operation.finish();
    }
  };
  const selectPoint = (event) => {
    if (disabled || busy || !size) return;
    setSelectedId(null);
    const box = event.currentTarget.getBoundingClientRect();
    setManualFrame(squarePhotoRegion(size.width, size.height,
      { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
        y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) }, fraction));
    setError("");
  };
  const keyPoint = (event) => {
    if (disabled || busy || !size) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setSelectedId(null);
    const current = frame || squarePhotoRegion(size.width, size.height, { x: .5, y: .5 }, fraction);
    const dx = event.key === "ArrowLeft" ? -.05 : event.key === "ArrowRight" ? .05 : 0;
    const dy = event.key === "ArrowUp" ? -.05 : event.key === "ArrowDown" ? .05 : 0;
    setManualFrame(movePhotoRegion(current, dx, dy)); setError("");
  };
  const resize = (value) => {
    if (!frame || !size || disabled || busy) return;
    setFraction(value);
    setManualFrame(squarePhotoRegion(size.width, size.height,
      { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }, value));
  };
  return (
    <section className="photo-region-picker" aria-label="Wybór obszaru nieba" aria-busy={busy || analyzing || proposalStatus === "searching"}>
      <div className="photo-region-image" style={size ? { maxWidth: `calc(40svh * ${size.width / size.height})` } : undefined}>
        <img src={source} alt="Całe własne zdjęcie nieba, bez przycinania"
          onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        <button type="button" className="photo-region-surface" aria-describedby={id}
          aria-label="Wskaż miejsce na zdjęciu; strzałki przesuwają wybór" disabled={disabled || busy}
          onClick={selectPoint} onKeyDown={keyPoint} />
        {proposals.map((region, index) => (
          <button type="button" className="photo-region-marker" key={region.id}
            style={{ left: `${(region.anchor?.x ?? region.bounds.x + region.bounds.width / 2) * 100}%`,
              top: `${(region.anchor?.y ?? region.bounds.y + region.bounds.height / 2) * 100}%` }} disabled={disabled || busy || !size}
            aria-pressed={selectedId === region.id} aria-label={`Zaznacz proponowany fragment ${index + 1}`}
            onClick={() => selectProposal(region)}>{index + 1}</button>
        ))}
        {frame && <span className="photo-region-selection" style={regionStyle(frame)} aria-hidden="true" />}
      </div>
      <p id={id} role="status">{proposalStatus === "searching" ? "Szukam obszarów chmur na zdjęciu. Zdjęcie nie opuszcza urządzenia."
        : analyzing ? "Analizuję zaznaczony fragment na urządzeniu…" : proposals.length
          ? "Dotknij numeru, żeby zobaczyć proponowany fragment, albo wskaż inne miejsce na zdjęciu. Ramka pokazuje obszar analizy, nie dokładny obrys chmury."
          : proposalStatus === "unavailable"
            ? "Automatyczny wybór obszarów jest niedostępny. Dotknij miejsca na zdjęciu, które chcesz sprawdzić."
            : "Nie udało się wyznaczyć osobnych obszarów. To nie znaczy, że nie ma chmur. Dotknij miejsca na zdjęciu, które chcesz sprawdzić."}</p>
      {proposals.length > 0 && <div className="photo-region-size" aria-label="Proponowane fragmenty">
        {proposals.map((region, index) => <button type="button" key={region.id} disabled={disabled || busy || !size}
          aria-pressed={selectedId === region.id} onClick={() => selectProposal(region)}>Fragment {index + 1}</button>)}
      </div>}
      {frame && <div className="photo-region-controls">
        {!selected && <div className="photo-region-size" aria-label="Rozmiar analizowanego fragmentu">
          {[[.35, "Bliżej"], [.55, "Fragment"], [.85, "Więcej kontekstu"]].map(([value, label]) => (
            <button type="button" key={value} disabled={disabled || busy}
              aria-pressed={Math.abs(frame.width * size.width / Math.min(size.width, size.height) - value) < 1e-6}
              onClick={() => resize(value)}>{label}</button>
          ))}
        </div>}
        <button type="button" className="button button--secondary" disabled={disabled || busy}
          onClick={() => apply(frame, selected)}>{busy ? "Analizuję fragment…" : "Sprawdź zaznaczony fragment"}</button>
        <button type="button" className="button button--ghost" disabled={disabled || busy}
          onClick={() => { setManualFrame(null); setSelectedId(null); }}>Usuń zaznaczenie</button>
      </div>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
