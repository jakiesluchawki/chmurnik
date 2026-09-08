import React, { useRef, useState } from "react";
import { ArrowsVertical } from "@phosphor-icons/react";
import { dragHeight, keyboardHeight, HEIGHT_RANGE } from "./interaction.mjs";

export function ParcelControl({ value, position, onChange }) {
  const drag = useRef(null);
  const [active, setActive] = useState(false);

  function finish(event, cancelled = false) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    setActive(false);
    if (cancelled) onChange(start.value);
    else
      onChange(dragHeight(start.value, start.y, event.clientY, start.height));
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <button
      type="button"
      className={`parcel-control ${active ? "dragging" : ""}`}
      style={{ top: `${position}%` }}
      role="slider"
      aria-label="Uniesienie powietrza na rysunku"
      aria-orientation="vertical"
      aria-valuemin={HEIGHT_RANGE.min}
      aria-valuemax={HEIGHT_RANGE.max}
      aria-valuenow={value}
      aria-valuetext={`${value} metrów nad ziemią`}
      aria-describedby="parcel-instructions"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0 || drag.current) return;
        const height = event.currentTarget
          .closest(".scene")
          .getBoundingClientRect().height;
        drag.current = {
          pointerId: event.pointerId,
          value,
          y: event.clientY,
          height,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setActive(true);
        onChange(value);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (start?.pointerId !== event.pointerId) return;
        onChange(dragHeight(start.value, start.y, event.clientY, start.height));
      }}
      onPointerUp={(event) => finish(event)}
      onPointerCancel={(event) => finish(event, true)}
      onLostPointerCapture={(event) => finish(event, true)}
      onKeyDown={(event) => {
        const next = keyboardHeight(value, event.key);
        if (next === null) return;
        event.preventDefault();
        onChange(next);
      }}
    >
      <ArrowsVertical aria-hidden="true" />
    </button>
  );
}
