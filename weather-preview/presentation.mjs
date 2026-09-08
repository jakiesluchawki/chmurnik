import { calculate } from "./model.mjs";

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// Art direction, not optical depth, visibility, cloud thickness or wind speed.
export function sceneAppearance(scene, input) {
  const result = calculate(scene, input);
  if (scene === "fog") {
    const amount = Math.max(0, input.cooling - result.needed);
    return { opacity: 0.96 * (1 - Math.exp(-amount / 1.5)) };
  }
  if (scene === "cloud") {
    const amount = Math.max(0, input.height - result.base);
    return {
      opacity: 1 - Math.exp(-amount / 220),
      scale: 0.55 + 0.45 * (1 - Math.exp(-amount / 650)),
    };
  }
  // Illustrative day/night lighting, not a solar ephemeris for a location/date.
  const daylight = Math.sin(((input.hour - 6) * Math.PI) / 12);
  return {
    night: 1 - smoothstep((daylight + 0.15) / 0.45),
    flow: smoothstep((Math.abs(result.difference) - 0.3) / 2.5),
    speed:
      result.direction === "calm"
        ? 0
        : (result.direction === "onshore" ? -1 : 1) *
          (12 + 42 * result.strength),
  };
}

// A short, non-overshooting response. The exact target remains the saved input.
export function advanceInputs(current, target, elapsed) {
  const fraction = 1 - Math.exp(-Math.max(0, Math.min(64, elapsed)) / 65);
  return Object.fromEntries(
    Object.entries(target).map(([key, value]) => {
      // Midnight must not sweep backwards through a whole daylight cycle.
      if (key === "hour" && value === 0 && current[key] > 23)
        return [key, value];
      const next = current[key] + (value - current[key]) * fraction;
      const tolerance = key === "height" ? 0.5 : 0.002;
      return [key, Math.abs(next - value) < tolerance ? value : next];
    }),
  );
}

export function inputsSettled(current, target) {
  return Object.keys(target).every((key) => current[key] === target[key]);
}
