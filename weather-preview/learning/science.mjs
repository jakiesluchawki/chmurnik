import { cloud } from "../model.mjs";
import { decodeMetar } from "../../src/lib/metar-reader.js";
import { windFromCloudMotion } from "../../src/lib/wind.js";
import { soundingScenarios } from "../../src/data/soundings.js";

export const coverage = [
  { code: "FEW", label: "FEW · 1–2/8", oktas: 2 },
  { code: "SCT", label: "SCT · 3–4/8", oktas: 4 },
  { code: "BKN", label: "BKN · 5–7/8", oktas: 6 },
  { code: "OVC", label: "OVC · 8/8", oktas: 8 },
];
const bound = (value, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : min;

export function skyReport(input) {
  const code = coverage.find(c => c.code === input.cover)?.code || "SCT";
  const base = Math.round(bound(input.base, 5, 45));
  // The upper layer is above every allowed lower base; OVC ends the report.
  const groups = `${code}${String(base).padStart(3, "0")}${code === "OVC" ? "" : " BKN060"}`;
  const report = `METAR EPWA 081200Z 24008KT 9999 ${groups} 18/12 Q1015`;
  return { code, base: base * 100, groups, report, decoded: decodeMetar(report),
    ceiling: ["BKN", "OVC"].includes(code) ? base * 100 : 6000,
    oktas: coverage.find(c => c.code === code).oktas };
}

export const tafExample = "TAF EPWA 081100Z 0812/0818 24008KT 9999 SCT020 BKN060 TEMPO 0813/0815 4000 SHRA BKN015 FM081600 28012KT 9999 SCT030";
export function tafAt(hour) {
  const h = bound(hour, 12, 18);
  if (h >= 18) return { valid: false, base: "Poza okresem ważności", temporary: null };
  return { valid: true, base: h >= 16 ? "SCT030 · od 16:00 UTC" : "SCT020 BKN060 · warunki bazowe",
    temporary: h >= 13 && h < 15 ? "TEMPO: przejściowo 4000 m, przelotny deszcz i BKN015" : null };
}

export function forcedLift(input) {
  const progress = bound(input.progress, 0, 100) / 100;
  const height = 2200 * progress;
  const result = cloud({ temperature: 24, humidity: input.moisture === "wet" ? 80 : 25, height });
  const temperatureEnvironment = 24 - (input.stability === "unstable" ? 9 : 4) * height / 1000;
  return { ...result, height, temperatureEnvironment,
    buoyant: result.parcel > temperatureEnvironment + 0.2,
    opacity: Math.min(1, Math.max(0, (height - result.base) / 600)) };
}

export function icingConditions(input) {
  const temperature = bound(input.temperature, -25, 5);
  const liquid = input.phase === "liquid";
  return { temperature, liquid, accretion: liquid && temperature < 0,
    // Qualitative exposure only, never mm/min or an aircraft risk rating.
    amount: liquid && temperature < 0 ? bound(input.exposure, 0, 100) / 100 : 0 };
}

export function heightReference(input) {
  const msl = 1500, terrain = bound(input.terrain, 0, 2000);
  return { msl, terrain, agl: terrain <= msl ? msl - terrain : null,
    belowGround: terrain > msl };
}

export function selectedSounding(index) {
  const profile = soundingScenarios[0].profile;
  const level = profile[Math.round(bound(index, 0, profile.length - 1))];
  return { ...level, spread: level.temperature - level.dewpoint };
}

export function stormIngredients(input) {
  const moisture = input.moisture === "wet";
  const instability = input.stability === "unstable";
  const trigger = input.trigger === "lift";
  return { moisture, instability, trigger, possible: moisture && instability && trigger };
}

export function soundingCoordinates(temperature, pressure, skew) {
  const fraction = Math.log(1000 / pressure) / Math.log(5);
  return { x: 56 + (temperature + 75) / 115 * 322 + (skew ? fraction * 114 : 0), y: 344 - fraction * 292 };
}

export { windFromCloudMotion, soundingScenarios };
