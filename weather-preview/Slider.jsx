import React from "react";
import { Sun, Moon, Drop, Thermometer, Wind, Cloud, Plus, Minus } from "@phosphor-icons/react";

export function Slider({ id, label, value, min, max, step = 1, nudge = step,
  display, onChange, disabled, ends = [String(min), String(max)], icon = id }) {
  const ratio = (value - min) / (max - min);
  const Handle = { cooling: Moon, humidity: Drop, temperature: Thermometer,
    wind: Wind, cloud: Cloud }[icon] || Sun;
  return <div className={`control ${disabled ? "disabled" : ""}`}>
    <div className="control-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{display}</output></div>
    <div className="range-row">
      <button className="step" onClick={() => onChange(Math.max(min, Number((value - nudge).toFixed(3))))}
        disabled={disabled || value <= min} aria-label={`Zmniejsz: ${label}`}><Minus /></button>
      <div className={`range-track handle-${icon}`}>
        <input id={id} type="range" min={min} max={max} step={step} value={value}
          style={{ "--range-fill": `${ratio * 100}%` }} disabled={disabled}
          aria-valuetext={display} onChange={e => onChange(Number(e.target.value))} />
        <span className="range-thumb" style={{ left: `calc(${ratio * 100}% + ${22 - 44 * ratio}px)` }} aria-hidden="true">
          {icon === "height" ? <img src="./cloud.webp" alt="" /> : <Handle weight="fill" />}
        </span>
      </div>
      <button className="step" onClick={() => onChange(Math.min(max, Number((value + nudge).toFixed(3))))}
        disabled={disabled || value >= max} aria-label={`Zwiększ: ${label}`}><Plus /></button>
    </div>
    <div className="range-ends"><span>{ends[0]}</span><span>{ends[1]}</span></div>
  </div>;
}
