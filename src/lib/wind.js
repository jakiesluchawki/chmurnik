export const compassDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function normalizeDegrees(value) {
  return ((Number(value) % 360) + 360) % 360;
}

export function degreesToCompass(value) {
  const normalized = normalizeDegrees(value);
  return compassDirections[Math.round(normalized / 45) % compassDirections.length];
}

export function windFromCloudMotion(motionTowardDegrees) {
  const toward = normalizeDegrees(motionTowardDegrees);
  const from = normalizeDegrees(toward + 180);
  return {
    toward,
    from,
    towardLabel: degreesToCompass(toward),
    fromLabel: degreesToCompass(from),
  };
}

function finiteNumber(value, name, minimum = -Infinity, maximum = Infinity) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`Invalid ${name}`);
  }
  return value;
}

export function windComponents(windFrom, speed, course) {
  finiteNumber(windFrom, "wind direction");
  finiteNumber(course, "course");
  finiteNumber(speed, "wind speed", 0, 300);
  const angle = (normalizeDegrees(windFrom - course) * Math.PI) / 180;
  const clean = (value) => Math.abs(value) < 1e-9 ? 0 : value;
  return {
    headwind: clean(speed * Math.cos(angle)),
    crosswind: clean(speed * Math.sin(angle)),
  };
}

// Both velocities use the same reference frame; current and leeway are excluded.
export function apparentWind(windFrom, trueSpeed, heading, boatSpeed) {
  finiteNumber(windFrom, "wind direction");
  finiteNumber(heading, "heading");
  finiteNumber(trueSpeed, "wind speed", 0, 300);
  finiteNumber(boatSpeed, "boat speed", 0, 100);
  const radians = (degrees) => degrees * Math.PI / 180;
  const east = -trueSpeed * Math.sin(radians(windFrom)) - boatSpeed * Math.sin(radians(heading));
  const north = -trueSpeed * Math.cos(radians(windFrom)) - boatSpeed * Math.cos(radians(heading));
  const speed = Math.hypot(east, north);
  if (speed < 1e-9) return { speed: 0, from: null, relative: null };
  const from = normalizeDegrees(Math.atan2(-east, -north) * 180 / Math.PI);
  const relative = ((from - normalizeDegrees(heading) + 540) % 360) - 180;
  return { speed, from, relative };
}

export function beaufortForce(knots) {
  finiteNumber(knots, "wind speed", 0, 300);
  // Boundaries in knots from the Met Office scale, applied to whole reported knots.
  const boundaries = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
  const index = boundaries.findIndex((limit) => Math.round(knots) < limit);
  return index < 0 ? 12 : index;
}
