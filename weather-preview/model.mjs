export const MODEL_VERSION = 1;
export const STORAGE_KEY = "chmurnik:weather-preview:v1";
export const DEFAULTS = {
  breeze: { hour: 14, heating: 70 },
  cloud: { temperature: 24, humidity: 55, height: 900 },
};
export const LIMITS = {
  breeze: { hour: [0, 23.5], heating: [0, 100] },
  cloud: { temperature: [5, 35], humidity: [20, 100], height: [0, 3000] },
};
export function cleanInputs(scene, input = {}) {
  if (!LIMITS[scene]) throw new Error("Unknown experiment");
  if (!input || typeof input !== "object") input = {};
  return Object.fromEntries(
    Object.entries(LIMITS[scene]).map(([key, [min, max]]) => {
      const value = input[key];
      return [
        key,
        typeof value === "number" && Number.isFinite(value)
          ? Math.min(max, Math.max(min, value))
          : DEFAULTS[scene][key],
      ];
    }),
  );
}
export function breeze(input) {
  const { hour, heating } = cleanInputs("breeze", input);
  // Prescribed teaching cycle, not a solved surface energy budget or forecast.
  const land =
    20 + ((10 * heating) / 100) * Math.cos(((hour - 14) * Math.PI) / 12);
  const water =
    20 + ((1.5 * heating) / 100) * Math.cos(((hour - 17) * Math.PI) / 12);
  const difference = land - water;
  const direction =
    Math.abs(difference) < 0.3
      ? "calm"
      : difference > 0
        ? "onshore"
        : "offshore";
  return {
    land,
    water,
    difference,
    direction,
    strength: Math.min(1, Math.abs(difference) / 10),
    night: hour < 6 || hour >= 19,
  };
}
export function dewPoint(temperature, humidity) {
  if (humidity === 100) return temperature;
  const gamma =
    Math.log(humidity / 100) + (17.625 * temperature) / (243.04 + temperature);
  return (243.04 * gamma) / (17.625 - gamma);
}
export function cloud(input) {
  const { temperature, humidity, height } = cleanInputs("cloud", input);
  const dew = dewPoint(temperature, humidity);
  // Approximate LCL: dry parcel / dew-point lapse rates 9.8 and 1.8 K/km.
  const base = Math.max(0, 125 * (temperature - dew));
  const saturated = height >= base;
  const atBase = temperature - (9.8 * base) / 1000;
  const parcel = saturated
    ? atBase - (6 * (height - base)) / 1000
    : temperature - (9.8 * height) / 1000;
  const parcelDew = saturated ? parcel : dew - (1.8 * height) / 1000;
  return {
    dew,
    base,
    parcel,
    parcelDew,
    saturated,
    aboveScene: base > 3000,
    growth: saturated ? Math.min(1, 0.2 + (height - base) / 1000) : 0,
  };
}
export function calculate(scene, input) {
  return scene === "breeze" ? breeze(input) : cloud(input);
}
export function readTrials(raw) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== MODEL_VERSION || !Array.isArray(value.trials))
      return [];
    return value.trials
      .filter((t) => t && LIMITS[t.scene] && typeof t.id === "string")
      .slice(-8)
      .map((t) => ({
        id: t.id.slice(0, 80),
        scene: t.scene,
        input: cleanInputs(t.scene, t.input),
      }));
  } catch {
    return [];
  }
}
export function serializeTrials(trials) {
  return JSON.stringify({ version: MODEL_VERSION, trials: trials.slice(-8) });
}
export function timeLabel(hour) {
  return `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 >= 0.5 ? "30" : "00"}`;
}
export function directionLabel(direction) {
  return {
    onshore: "Z wody na ląd",
    offshore: "Z lądu nad wodę",
    calm: "Brak wyraźnej bryzy",
  }[direction];
}
