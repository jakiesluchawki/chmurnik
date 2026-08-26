import {
  decodeAviationConditions,
  decodeMetar,
  detectAviationReportType,
  normalizeAviationReport,
} from "./metar-reader.js";

const DAY = 24 * 60;
const PERIOD = /^(\d{4})\/(\d{4})$/;
const CHANGE = /^(?:FM|BECMG|TEMPO|PROB|INTER|NOSIG)/;

export const tafGroupMeaning = {
  INITIAL: {
    label: "Baza prognozy",
    detail:
      "Warunki przewidywane na początek okresu ważności. To prognoza, nie pomiar wykonany przy wydaniu raportu.",
  },
  FM: {
    label: "Nowa baza · FM",
    detail:
      "Od wskazanej chwili zaczyna się nowy zestaw warunków bazowych. FM zastępuje poprzednią bazę; brakującej wartości nie dopisujemy z wcześniejszej grupy.",
  },
  BECMG: {
    label: "Stopniowa zmiana · BECMG",
    detail:
      "Zmiana nastąpi w podanym przedziale, niekoniecznie na jego początku. Po jego końcu zmienione elementy należą do bazy. Niewymienione elementy pozostają z tła prognozy.",
  },
  TEMPO: {
    label: "Przejściowo · TEMPO",
    detail:
      "Krótkie epizody w podanym oknie: każdy krótszy niż godzina, łącznie krócej niż połowa okna. Nie zastępują na stałe bazy. Niewymienione elementy pozostają z tła prognozy.",
  },
  PROB: {
    label: "Możliwy wariant · PROB",
    detail:
      "Osobny wariant z zakodowanym prawdopodobieństwem 30% lub 40%. Procent nie opisuje części czasu. Nie zastępuje prognozy bazowej.",
  },
};

export function formatTafTime(point) {
  return `dzień ${point.day}, ${String(point.hour).padStart(2, "0")}:${String(point.minute).padStart(2, "0")} UTC`;
}

function timePoint(code, { minutes = false, end = false } = {}) {
  const match = code.match(
    minutes ? /^(\d{2})(\d{2})(\d{2})$/ : /^(\d{2})(\d{2})$/,
  );
  if (!match) throw new Error(`Nieprawidłowa grupa czasu TAF: ${code}.`);
  const point = { day: +match[1], hour: +match[2], minute: +(match[3] || 0) };
  if (
    point.day < 1 ||
    point.day > 31 ||
    point.hour > (end ? 24 : 23) ||
    point.minute > 59 ||
    (point.hour === 24 && point.minute !== 0)
  )
    throw new Error(`Nieprawidłowy dzień lub czas UTC w TAF: ${code}.`);
  return point;
}

function period(code) {
  const match = code?.match(PERIOD);
  if (!match)
    throw new Error(
      `Oczekuję okresu TAF w formacie DDHH/DDHH, np. 2618/2718. Otrzymano: ${code || "brak"}.`,
    );
  return {
    code,
    start: timePoint(match[1]),
    end: timePoint(match[2], { end: true }),
  };
}

function offset(point, frame) {
  if (point.day > frame.monthDays) return NaN;
  const day = point.day + (point.day < frame.start.day ? frame.monthDays : 0);
  return (
    (day - frame.start.day) * DAY +
    (point.hour - frame.start.hour) * 60 +
    point.minute
  );
}

function validityFrames(validity) {
  // Retain every possible month length. Never attach an unverified calendar date.
  return [28, 29, 30, 31].flatMap((monthDays) => {
    if (validity.start.day > monthDays || validity.end.day > monthDays)
      return [];
    const frame = { monthDays, start: validity.start };
    frame.end = offset(validity.end, frame);
    return frame.end > 0 && frame.end <= 30 * 60 ? [frame] : [];
  });
}

function decodeForecastConditions(tokens, partial) {
  const weather = [];
  const windShear = [];
  const extraGroups = [];
  for (const token of tokens) {
    const shear = token.match(/^WS(\d{3})\/(\d{3})(\d{2,3})KT$/);
    if (
      shear &&
      +shear[1] <= 20 &&
      +shear[1] > 0 &&
      +shear[2] <= 360 &&
      +shear[2] > 0 &&
      +shear[3] <= 300
    ) {
      windShear.push({
        height: +shear[1] * 100,
        from: +shear[2] % 360,
        speed: +shear[3],
        code: token,
      });
      extraGroups.push({
        code: token,
        label: "Uskok wiatru · LLWS",
        detail: `Prognozowany uskok wiatru: wiatr na ${+shear[1] * 100} ft nad lotniskiem z ${shear[2]}°T, ${+shear[3]} kt. To nie wiatr przy powierzchni ani zmierzona składowa boczna.`,
      });
    } else {
      weather.push(token);
    }
  }
  const result = decodeAviationConditions(weather, { forecast: true, partial });
  return { ...result, windShear, groups: [...result.groups, ...extraGroups] };
}

export function decodeTaf(input) {
  const raw = normalizeAviationReport(input);
  const tokens = raw.split(" ");
  const hasHeading = tokens[0] === "TAF";
  if (hasHeading) tokens.shift();
  if (/^(METAR|SPECI)$/.test(tokens[0]))
    throw new Error(
      "Nagłówek mówi METAR/SPECI, ale treść ma strukturę TAF. Sprawdź oryginał; nie łącz obserwacji z prognozą.",
    );
  const modifiers = [];
  while (["AMD", "COR"].includes(tokens[0])) modifiers.push(tokens.shift());
  const station = tokens.shift();
  const stamp = tokens.shift();
  if (
    !/^[A-Z][A-Z0-9]{3}$/.test(station || "") ||
    !/^\d{6}Z$/.test(stamp || "")
  )
    throw new Error(
      "Oczekuję kodu stacji i czasu wydania TAF, np. KLVM 261730Z. Wklej jeden pełny raport.",
    );
  const issued = timePoint(stamp.slice(0, -1), { minutes: true });
  const result = {
    raw,
    type: "TAF",
    station,
    issued,
    modifiers,
    hasHeading,
    validity: null,
    durationMinutes: null,
    segments: [],
    temperatureExtremes: [],
    remarks: "",
    warnings: [],
    status: "forecast",
    detection: hasHeading
      ? "Nagłówek TAF oznacza prognozę warunków dla lotniska."
      : "Rozpoznano TAF po strukturze prognozy, mimo braku słowa TAF na początku.",
    groups: [
      {
        code: station,
        label: "Lotnisko",
        detail:
          "Kod ICAO lotniska, którego dotyczy prognoza. Nie jest to prognoza całej trasy.",
      },
      {
        code: stamp,
        label: "Czas wydania",
        detail: `${formatTafTime(issued)}. To czas wydania, nie początek okresu ważności ani czas pomiaru. Miesiąc i rok nie są tu zapisane.`,
      },
      ...modifiers.map((code) => ({
        code,
        label: code === "AMD" ? "Zmiana prognozy" : "Korekta",
        detail:
          code === "AMD"
            ? "Zmieniona prognoza zastępuje wcześniejszą. Sprawdź pełną, najnowszą depeszę w oficjalnym źródle."
            : "Korekta wcześniej wydanego TAF. Nie łącz obu wersji.",
      })),
    ],
  };
  if (PERIOD.test(tokens[0] || "")) result.validity = period(tokens.shift());
  if (["NIL", "CNL"].includes(tokens[0])) {
    const flag = tokens.shift();
    if (tokens.length)
      throw new Error(
        `${flag} występuje razem z dodatkowymi warunkami. Sprawdź jeden oryginalny TAF.`,
      );
    result.status = flag === "NIL" ? "unavailable" : "cancelled";
    return result;
  }
  if (!result.validity) period(tokens[0]);
  let frames = validityFrames(result.validity);
  if (!frames.length)
    throw new Error(
      "Nieprawidłowy lub nieobsługiwany okres ważności TAF. Ten czytnik obsługuje dodatnie okresy do 30 godzin, bez zgadywania miesiąca i roku.",
    );
  if (
    tokens
      .slice(0, tokens.includes("RMK") ? tokens.indexOf("RMK") : undefined)
      .some((token) => /^(METAR|SPECI|TAF|\d{6}Z|NIL|CNL)$/.test(token))
  )
    throw new Error(
      "Wklej jeden pełny TAF, bez drugiej depeszy ani sprzecznych oznaczeń NIL/CNL.",
    );
  result.groups.push({
    code: result.validity.code,
    label: "Okres ważności prognozy",
    detail: `Od ${formatTafTime(result.validity.start)} do ${formatTafTime(result.validity.end)}. 24:00 to koniec wskazanego dnia. To okres prognozy, a nie czas obserwacji.`,
  });
  let segment = {
    kind: "INITIAL",
    marker: result.validity.code,
    start: result.validity.start,
    end: null,
    partial: false,
    probability: null,
    temporary: false,
    tokens: [],
  };
  const finish = () => {
    if (!segment.tokens.length)
      throw new Error(
        `Grupa ${segment.marker} nie zawiera warunków. Wklej pełny TAF.`,
      );
    segment.conditions = decodeForecastConditions(
      segment.tokens,
      segment.partial,
    );
    result.segments.push(segment);
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "RMK") {
      result.remarks = tokens.slice(index + 1).join(" ");
      break;
    }
    const extreme = token.match(/^T(X|N)(M?\d{2})\/(\d{4})Z$/);
    if (extreme) {
      const at = timePoint(extreme[3]);
      frames = frames.filter(
        (frame) => offset(at, frame) >= 0 && offset(at, frame) <= frame.end,
      );
      result.temperatureExtremes.push({
        kind: extreme[1] === "X" ? "max" : "min",
        temperature: Number(extreme[2].replace("M", "-")),
        at,
        code: token,
      });
      continue;
    }
    if (!CHANGE.test(token)) {
      if (PERIOD.test(token))
        throw new Error(
          `Okres ${token} nie ma znacznika zmiany. Sprawdź, czy nie połączono dwóch raportów.`,
        );
      segment.tokens.push(token);
      continue;
    }
    finish();
    let kind;
    let start;
    let end = null;
    let probability = null;
    let temporary = false;
    let marker = token;
    if (/^FM\d{6}$/.test(token)) {
      kind = "FM";
      start = timePoint(token.slice(2), { minutes: true });
      const prior = result.segments.filter((item) => item.kind === "FM").at(-1);
      frames = frames.filter(
        (frame) =>
          offset(start, frame) >= 0 &&
          offset(start, frame) < frame.end &&
          (!prior || offset(start, frame) > offset(prior.start, frame)),
      );
    } else if (["TEMPO", "BECMG", "PROB30", "PROB40"].includes(token)) {
      kind = token.startsWith("PROB") ? "PROB" : token;
      if (kind === "PROB") {
        probability = +token.slice(4);
        if (tokens[index + 1] === "TEMPO") {
          temporary = true;
          marker += ` ${tokens[++index]}`;
        }
      }
      const range = period(tokens[++index]);
      marker += ` ${range.code}`;
      ({ start, end } = range);
      frames = frames.filter(
        (frame) =>
          offset(start, frame) >= 0 &&
          offset(end, frame) > offset(start, frame) &&
          offset(end, frame) <= frame.end,
      );
    } else {
      throw new Error(
        `Nieobsługiwany lub niepełny znacznik czasu ${token}. Obsługujemy FMDDHHMM, BECMG, TEMPO oraz PROB30/40 z okresem DDHH/DDHH. Nie odczytujemy dalszych grup jako jednej bazy.`,
      );
    }
    if (!frames.length)
      throw new Error(
        `Okres lub kolejność ${marker} nie mieści się w ważności TAF. Sprawdź pełny oryginał.`,
      );
    segment = {
      kind,
      marker,
      start,
      end,
      probability,
      temporary,
      partial: kind !== "FM",
      tokens: [],
    };
  }
  finish();
  if (!frames.length)
    throw new Error(
      "Czas temperatury TX/TN wypada poza ważnością TAF. Sprawdź oryginał.",
    );
  const durations = [...new Set(frames.map((frame) => frame.end))];
  result.durationMinutes = durations.length === 1 ? durations[0] : null;
  if (result.validity.end.day < result.validity.start.day)
    result.warnings.push(
      "Prognoza przechodzi przez koniec miesiąca. Nie przypisujemy miesiąca ani roku; sprawdź datę w źródle.",
    );
  if (result.segments.some((item) => item.conditions.unsupported.length))
    result.warnings.push(
      "Nie wszystkie kody zostały odczytane. Nierozkodowane grupy są zachowane przy odpowiednim okresie; mogą być istotne.",
    );
  return result;
}

export function decodeAviationReport(input) {
  return detectAviationReportType(input) === "TAF"
    ? decodeTaf(input)
    : decodeMetar(input);
}
