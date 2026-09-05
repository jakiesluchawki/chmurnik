const DEFAULT_DOMAIN = {
  pressureBottom: 1000,
  pressureTop: 200,
  temperatureMin: -70,
  temperatureMax: 40,
  skew: 0.24,
};

export function pressurePosition(pressure, domain = DEFAULT_DOMAIN) {
  const { pressureBottom, pressureTop } = domain;
  const bounded = Math.min(pressureBottom, Math.max(pressureTop, pressure));
  return (
    (Math.log(bounded) - Math.log(pressureTop))
    / (Math.log(pressureBottom) - Math.log(pressureTop))
  );
}

export function temperaturePosition(temperature, pressure, domain = DEFAULT_DOMAIN) {
  const {
    temperatureMin,
    temperatureMax,
    skew,
  } = domain;
  const temperatureFraction = (
    (temperature - temperatureMin)
    / (temperatureMax - temperatureMin)
  );
  return (
    (temperatureFraction * (1 - skew))
    + ((1 - pressurePosition(pressure, domain)) * skew)
  );
}

export function soundingPoint(
  temperature,
  pressure,
  {
    left = 68,
    top = 32,
    width = 590,
    height = 550,
    domain = DEFAULT_DOMAIN,
  } = {},
) {
  return {
    x: left + (temperaturePosition(temperature, pressure, domain) * width),
    y: top + (pressurePosition(pressure, domain) * height),
  };
}

export function soundingPath(profile, field, layout) {
  return profile
    .filter((level) => Number.isFinite(level[field]))
    .map((level, index) => {
      const point = soundingPoint(level[field], level.pressure, layout);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

export function dewpointSpread(level) {
  return level.temperature - level.dewpoint;
}

export function interpolatePressureAtTemperature(profile, targetTemperature = 0) {
  for (let index = 1; index < profile.length; index += 1) {
    const lower = profile[index - 1];
    const upper = profile[index];
    const lowerDelta = lower.temperature - targetTemperature;
    const upperDelta = upper.temperature - targetTemperature;

    if (lowerDelta === 0) return lower.pressure;
    if (lowerDelta * upperDelta > 0) continue;

    const fraction = lowerDelta / (lowerDelta - upperDelta);
    const logPressure = (
      Math.log(lower.pressure)
      + (fraction * (Math.log(upper.pressure) - Math.log(lower.pressure)))
    );
    return Math.round(Math.exp(logPressure));
  }

  return null;
}

export function windComponents(direction, speed) {
  const radians = ((direction + 180) * Math.PI) / 180;
  return {
    u: Math.sin(radians) * speed,
    v: Math.cos(radians) * speed,
  };
}

export function soundingSummary(scenario) {
  const surface = scenario.profile[0];
  const maximumWind = scenario.profile.reduce(
    (strongest, level) => level.windSpeed > strongest.windSpeed ? level : strongest,
    scenario.profile[0],
  );
  return {
    surfaceSpread: dewpointSpread(surface),
    freezing: scenario.levels.freezing,
    lcl: scenario.levels.lcl,
    lfc: scenario.levels.lfc,
    el: scenario.levels.el,
    elUnresolved: Boolean(scenario.levels.elUnresolved),
    maximumWind,
    hasInversion: Boolean(scenario.inversion),
    parcelOrigin: scenario.parcelOrigin,
  };
}
