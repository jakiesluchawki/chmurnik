import { useEffect, useId, useRef, useState } from "react";
import { movePhotoRegion, resizePhotoCorner, squarePhotoRegion, squareRegionForProposal, validatePhotoRegion } from "../lib/photo-frame.js";
import { createPhotoOperationScope } from "../lib/photo-operation.js";

const regionStyle = (bounds) => ({ left: `${bounds.x * 100}%`, top: `${bounds.y * 100}%`,
  width: `${bounds.width * 100}%`, height: `${bounds.height * 100}%` });
const notifyFrameFocus = mode => window.webkit?.messageHandlers?.chmurnikFrameFocus?.postMessage(mode);

export function PhotoFrame({ source, onAnalyze, onSelectionChange, regions = [], proposalStatus = "ready", disabled, analyzing }) {
  const id = useId();
  const [size, setSize] = useState(null);
  const [manualFrame, setManualFrame] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fraction, setFraction] = useState(.55);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const imageBox = useRef(null);
  const moveHandle = useRef(null);
  const resizeHandle = useRef(null);
  const drag = useRef(null);
  const lastHandle = useRef(null);
  const ignoreClick = useRef(false);
  const lastPointerEnd = useRef(-Infinity);
  const [dragging, setDragging] = useState(false);
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
  const canEditFrame = Boolean(frame) && !disabled && !busy;
  useEffect(() => () => notifyFrameFocus(""), [source, canEditFrame]);
  const side = frame && size ? frame.width * size.width : 0;
  const shortSide = size ? Math.min(size.width, size.height) : 0;
  const selectProposal = (region) => {
    if (disabled || busy || !size || region.id === selectedId) return;
    onSelectionChange();
    setSelectedId(region.id); setManualFrame(null); setError("");
  };
  const manual = (bounds) => {
    onSelectionChange();
    setSelectedId(null); setManualFrame(bounds); setError("");
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
    if (event.detail === 0) {
      manual(frame || squarePhotoRegion(size.width, size.height, { x: .5, y: .5 }, fraction));
      return;
    }
    const box = imageBox.current.getBoundingClientRect();
    manual(squarePhotoRegion(size.width, size.height,
      { x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
        y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)) }, fraction));
  };
  const keyPoint = (event) => {
    if (disabled || busy || !size) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    const current = frame || squarePhotoRegion(size.width, size.height, { x: .5, y: .5 }, fraction);
    const dx = event.key === "ArrowLeft" ? -.05 : event.key === "ArrowRight" ? .05 : 0;
    const dy = event.key === "ArrowUp" ? -.05 : event.key === "ArrowDown" ? .05 : 0;
    manual(movePhotoRegion(current, dx, dy));
  };
  const resize = (value) => {
    if (!frame || !size || disabled || busy) return;
    setFraction(value);
    manual(squarePhotoRegion(size.width, size.height,
      { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }, value));
  };
  const startDrag = (event) => {
    if (!event.isPrimary) return;
    ignoreClick.current = false;
    lastHandle.current = null;
    if (disabled || busy || !frame || event.button !== 0) return;
    // WebKit can retarget a finger to the larger move button under the corner.
    // Resolve the corner in photo coordinates before dispatching either gesture.
    const hit = rect => rect && event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    const resize = hit(resizeHandle.current?.getBoundingClientRect());
    if (!resize && (event.target.closest(".photo-region-marker") || !hit(moveHandle.current?.getBoundingClientRect()))) return;
    const control = resize ? resizeHandle.current : moveHandle.current;
    lastHandle.current = control;
    if (resize && !control.contains(event.target)) event.preventDefault();
    const box = imageBox.current.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, box, frame, mode: resize ? "resize" : "move" };
    ignoreClick.current = resize;
    setDragging(true);
    control.focus({ preventScroll: true });
    control.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event) => {
    const start = drag.current;
    if (disabled || busy || !start || start.id !== event.pointerId) return;
    const dx = (event.clientX - start.x) / start.box.width;
    const dy = (event.clientY - start.y) / start.box.height;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 3 || start.moved) {
      start.moved = true;
      ignoreClick.current = true;
      manual(start.mode === "resize" ? resizePhotoCorner(start.frame, size.width, size.height, dx, dy)
        : movePhotoRegion(start.frame, dx, dy));
    }
  };
  const restoreHandleFocus = (handle = lastHandle.current) => {
    const active = document.activeElement;
    if (handle?.isConnected && !handle.disabled && (active === document.body || active === handle.closest('[role="dialog"]'))) {
      handle.focus({ preventScroll: true });
    }
  };
  const endDrag = event => {
    if (drag.current?.id !== event.pointerId) return;
    const handle = lastHandle.current;
    lastPointerEnd.current = performance.now();
    drag.current = null;
    setDragging(false);
    requestAnimationFrame(() => { if (lastHandle.current === handle) restoreHandleFocus(handle); });
  };
  const resizeBy = delta => {
    if (!frame || disabled || busy) return;
    manual(resizePhotoCorner(frame, size.width, size.height, delta / size.width, delta / size.height));
  };
  const keyResize = event => {
    if (!frame || disabled || busy) return;
    const direction = ["ArrowUp", "ArrowLeft", "-"].includes(event.key) ? -1 :
      ["ArrowDown", "ArrowRight", "+", "="].includes(event.key) ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    resizeBy(direction * shortSide * (event.shiftKey ? .01 : .04));
  };
  return (
    <section className="photo-region-picker" data-dragging={dragging} data-analyzing={analyzing}
      aria-label="Wybór obszaru nieba" aria-busy={busy || analyzing || proposalStatus === "searching"}>
      <p className="photo-region-guide"><strong>Wskaż chmurę</strong> Dotknij miejsca na zdjęciu albo wybierz propozycję.</p>
      <div ref={imageBox} className="photo-region-image" style={size ? { maxWidth: `calc(40svh * ${size.width / size.height})` } : undefined}
        onPointerDownCapture={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
        onPointerCancel={endDrag} onLostPointerCapture={endDrag}
        onMouseDownCapture={event => {
          // The corner is adjusted in two dimensions, never by clicking a horizontal track.
          if (ignoreClick.current && !resizeHandle.current?.contains(event.target)) event.preventDefault();
        }}
        onClickCapture={event => {
          // iPadOS may focus the dialog between pointerup and its compatibility click.
          if (lastHandle.current?.contains(event.target) || ignoreClick.current) restoreHandleFocus();
          // The compatibility click after a drag must not select a fresh crop.
          if (ignoreClick.current && event.detail !== 0 && !resizeHandle.current?.contains(event.target)) {
            event.preventDefault(); event.stopPropagation();
          }
        }}>
        <img src={source} alt="Całe własne zdjęcie nieba, bez przycinania"
          onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        <button type="button" className="photo-region-surface" aria-describedby={id}
          aria-label="Wskaż miejsce na zdjęciu; strzałki przesuwają wybór" disabled={disabled || busy}
          onClick={selectPoint} onKeyDown={keyPoint} />
        {proposals.map((region, index) => (
          <button type="button" className="photo-region-marker" key={region.id} hidden={Boolean(manualFrame)}
            style={{ left: `${(region.anchor?.x ?? region.bounds.x + region.bounds.width / 2) * 100}%`,
              top: `${(region.anchor?.y ?? region.bounds.y + region.bounds.height / 2) * 100}%` }} disabled={disabled || busy || !size}
            aria-pressed={selectedId === region.id} aria-label={`Zaznacz proponowany fragment ${index + 1}`}
            onClick={() => selectProposal(region)}>{index + 1}</button>
        ))}
        {frame && <span className="photo-region-selection" style={regionStyle(frame)} aria-hidden="true">
          <span className="photo-frame-corners" key={selectedId || "manual"} />
        </span>}
        {frame && <button ref={moveHandle} type="button" className="photo-frame-grip" data-frame-keys="move" style={regionStyle(frame)}
          aria-label="Przesuń ramkę: przeciągnij lub użyj strzałek" disabled={disabled || busy}
          onFocus={() => notifyFrameFocus("move")} onBlur={() => notifyFrameFocus("")}
          onClick={event => {
            if (event.detail === 0 || event.target.closest(".photo-frame-handle")) return;
            const box = event.currentTarget.getBoundingClientRect();
            const dx = event.clientX - box.left - box.width / 2;
            const dy = event.clientY - box.top - box.height / 2;
            const photo = imageBox.current.getBoundingClientRect();
            if (Math.hypot(dx, dy) > 4) manual(movePhotoRegion(frame, dx / photo.width, dy / photo.height));
          }}
          onKeyDown={keyPoint}>
          <span className="photo-frame-handle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4" /></svg>
          </span>
        </button>}
        {frame && <span className="photo-resize-target" style={regionStyle(frame)}>
          <input ref={resizeHandle} type="range" className="photo-resize-grip" data-frame-keys="resize" disabled={disabled || busy}
            onFocus={() => notifyFrameFocus("resize")} onBlur={() => notifyFrameFocus("")}
            min={Math.round(Math.min(side, shortSide * .15))}
            max={Math.round(Math.min((1-frame.x)*size.width, (1-frame.y)*size.height))}
            value={Math.round(side)} step="1" aria-valuetext={`${Math.round(100 * side / shortSide)}% krótszego boku zdjęcia`}
            aria-label="Zmień rozmiar ramki: przeciągnij róg lub użyj strzałek"
            onChange={event => {
              // The pointer gesture calculates the diagonal; only native accessibility
              // adjustments should also interpret the range's one-dimensional value.
              if (!drag.current && performance.now() - lastPointerEnd.current > 250) resizeBy(event.target.valueAsNumber - side);
            }}
            onKeyDown={keyResize} />
          <svg className="photo-resize-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 15 15 4M10 16l6-6" /></svg>
        </span>}
      </div>
      <div className="photo-crop-readout">
        {frame && <div className="photo-crop-loupe" aria-hidden="true"><img src={source} alt=""
          style={{ width: `${100 / frame.width}%`, left: `${-100 * frame.x / frame.width}%`,
            top: `${-100 * frame.y / frame.height}%` }} /></div>}
        <p id={id} role="status">{proposalStatus === "searching" ? "Szukam obszarów chmur na zdjęciu."
        : analyzing ? "Analizuję wybrany wycinek na urządzeniu…" : frame
          ? <><strong>Wycinek do analizy</strong>Przesuń ramkę. Pociągnij jej róg, żeby zmienić rozmiar.</>
          : proposals.length ? "Numery wskazują miejsca do sprawdzenia, nie rodzaje chmur."
          : proposalStatus === "unavailable"
            ? "Automatyczny wybór obszarów jest niedostępny. Dotknij miejsca na zdjęciu, które chcesz sprawdzić."
            : "Nie znaleziono wyraźnego obszaru. Jeśli widzisz chmurę, wskaż ją na zdjęciu."}</p>
      </div>
      {proposals.length > 0 && <div className="photo-region-size" aria-label="Proponowane fragmenty">
        {proposals.map((region, index) => <button type="button" key={region.id} disabled={disabled || busy || !size}
          aria-pressed={selectedId === region.id} onClick={() => selectProposal(region)}>Fragment {index + 1}</button>)}
      </div>}
      {frame && <div className="photo-region-controls">
        <div className="photo-region-size photo-frame-zoom" role="group" aria-label="Rozmiar analizowanego fragmentu">
          {[[.35, "Bliżej"], [.55, "Fragment"], [.85, "Więcej kontekstu"]].map(([value, label]) => (
            <button type="button" key={value} disabled={disabled || busy}
              aria-pressed={Math.abs(frame.width * size.width / Math.min(size.width, size.height) - value) < 1e-6}
              onClick={() => resize(value)}>{label}</button>
          ))}
        </div>
        <button type="button" className="button button--primary" disabled={disabled || busy}
          onClick={() => apply(frame, selected)}>{busy ? "Analizuję fragment…" : "Sprawdź zaznaczony fragment"}</button>
        <button type="button" className="button button--ghost" disabled={disabled || busy}
          onClick={() => manual(null)}>Usuń zaznaczenie</button>
      </div>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
