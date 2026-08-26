// A deliberately bounded educational decoder, not a briefing service.
const WEATHER = {
  MI: "płytkie",
  PR: "częściowe",
  BC: "płaty",
  DR: "niska zamieć",
  BL: "zawieja",
  SH: "przelotne",
  TS: "burza",
  FZ: "marznące",
  DZ: "mżawka",
  RA: "deszcz",
  SN: "śnieg",
  SG: "śnieg ziarnisty",
  IC: "kryształki lodu",
  PL: "ziarna lodowe",
  GR: "grad",
  GS: "krupa / drobny grad",
  UP: "nieokreślony opad",
  BR: "zamglenie",
  FG: "mgła",
  FU: "dym",
  VA: "popiół wulkaniczny",
  DU: "pył",
  SA: "piasek",
  HZ: "zmętnienie",
  PY: "rozpylona woda",
  PO: "wiry pyłowe",
  SQ: "szkwał",
  FC: "chmura lejkowata / trąba",
  SS: "burza piaskowa",
  DS: "burza pyłowa",
};
const COVER = {
  FEW: "1–2/8 nieba",
  SCT: "3–4/8 nieba",
  BKN: "5–7/8 nieba",
  OVC: "8/8 nieba",
  VV: "widzialność pionowa",
};

function weatherText(token) {
  const match = token.match(/^(-|\+|VC)?((?:[A-Z]{2}){1,3})$/);
  if (!match) return null;
  const codes = match[2].match(/../g);
  if (!codes.every((code) => WEATHER[code])) return null;
  if (codes.includes("TS") && ["-", "+"].includes(match[1]))
    return `${codes.map((code) => WEATHER[code]).join(" · ")} (natężenie opadu: ${match[1] === "-" ? "słabe" : "silne"})`;
  const qualifier =
    { "-": "słabe: ", "+": "silne: ", VC: "w pobliżu: " }[match[1]] || "";
  return qualifier + codes.map((code) => WEATHER[code]).join(" · ");
}

function temperature(value) {
  if (value === "//" || value === "") return null;
  return Number(value.replace("M", "-"));
}

export function normalizeAviationReport(input) {
  if (typeof input !== "string" || input.length > 6000)
    throw new Error("Wklej jeden METAR, SPECI lub TAF (do 6000 znaków).");
  const raw = input.trim().toUpperCase().replace(/\s+/g, " ").replace(/=$/, "");
  if (!raw) throw new Error("Najpierw wklej raport lub wybierz przykład.");
  if (raw.includes("="))
    throw new Error("Wklej tylko jeden raport, bez kolejnych komunikatów.");
  return raw.trim();
}

export function detectAviationReportType(input) {
  const raw = normalizeAviationReport(input);
  const body = raw.split(/\s+RMK\b/)[0];
  // A copied TAF often omits its heading. METAR trends use HHMM, not DDHHMM.
  if (
    /^(TAF|AMD)\b/.test(raw) ||
    /\b(?:\d{4}\/\d{4}|FM\d{6}|PROB\d{2})\b/.test(body)
  )
    return "TAF";
  return /^SPECI\b/.test(raw) ? "SPECI" : "METAR";
}

export function decodeMetar(input) {
  const raw = normalizeAviationReport(input);
  if (detectAviationReportType(raw) === "TAF")
    throw new Error(
      "To prognoza TAF, nie obserwacja METAR. Użyj wspólnego czytnika METAR / TAF.",
    );
  const tokens = raw.split(" ");
  const type = /^(METAR|SPECI)$/.test(tokens[0]) ? tokens.shift() : "METAR";
  const corrected = tokens[0] === "COR";
  if (corrected) tokens.shift();
  const station = tokens.shift();
  const stamp = tokens.shift();
  const date = stamp?.match(/^(\d{2})(\d{2})(\d{2})Z$/);
  if (
    !/^[A-Z][A-Z0-9]{3}$/.test(station || "") ||
    !date ||
    +date[1] < 1 ||
    +date[1] > 31 ||
    +date[2] > 23 ||
    +date[3] > 59
  ) {
    throw new Error(
      "Oczekuję kodu stacji i czasu UTC, np. EPWA 261200Z. Usuń nagłówek strony, a pozostaw sam raport.",
    );
  }
  if (
    tokens
      .slice(0, tokens.includes("RMK") ? tokens.indexOf("RMK") : undefined)
      .some((token) => /^(METAR|SPECI|TAF|\d{6}Z)$/.test(token))
  )
    throw new Error("Wklej jedną obserwację, bez drugiej depeszy.");
  const conditions = decodeAviationConditions(tokens);
  return {
    ...conditions,
    raw,
    type,
    station,
    day: +date[1],
    time: `${date[2]}:${date[3]} UTC`,
    corrected: corrected || conditions.corrected,
    groups: [
      {
        code: station,
        label: "Stacja",
        detail:
          "Kod ICAO miejsca obserwacji. Warunki w innym miejscu mogą być inne.",
      },
      {
        code: stamp,
        label: "Czas obserwacji",
        detail: `Dzień ${+date[1]}, ${date[2]}:${date[3]} UTC. W raporcie nie ma miesiąca ani roku; ten czytnik nie potwierdza aktualności.`,
      },
      ...conditions.groups,
    ],
  };
}

export function decodeAviationConditions(
  tokens,
  { forecast = false, partial = false } = {},
) {
  const result = {
    corrected: false,
    wind: null,
    visibility: null,
    clouds: [],
    ceiling: null,
    temperature: null,
    dewpoint: null,
    pressure: null,
    weather: [],
    groups: [],
    unsupported: [],
    warnings: [],
    trend: "",
    remarks: "",
    nil: false,
    cavok: false,
    skyReported: false,
    weatherReported: false,
    noSignificantWeather: false,
  };
  const group = (code, label, detail) =>
    result.groups.push({ code, label, detail });
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    let match;
    if (
      !forecast &&
      /^(TEMPO|BECMG|NOSIG|INTER|PROB\d{2}|FM\d{4,6})$/.test(token)
    ) {
      const rest = tokens.slice(index);
      const remarksIndex = rest.indexOf("RMK");
      result.trend = (
        remarksIndex < 0 ? rest : rest.slice(0, remarksIndex)
      ).join(" ");
      if (remarksIndex >= 0)
        result.remarks = rest.slice(remarksIndex + 1).join(" ");
      break;
    }
    if (token === "RMK") {
      result.remarks = tokens.slice(index + 1).join(" ");
      break;
    }
    if (!forecast && token === "NIL") {
      result.nil = true;
      group(token, "Brak raportu", "Stacja nie dostarczyła obserwacji.");
      continue;
    }
    if (!forecast && ["AUTO", "COR"].includes(token)) {
      if (token === "COR") result.corrected = true;
      group(
        token,
        "Rodzaj raportu",
        token === "AUTO"
          ? "Raport automatyczny."
          : "Korekta wcześniejszego raportu.",
      );
    } else if (
      (match = token.match(
        /^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/,
      )) &&
      (match[1] === "VRB" || +match[1] <= 360) &&
      (match[3] == null || +match[3] >= +match[2])
    ) {
      if (result.wind) {
        result.unsupported.push(token);
        continue;
      }
      const multiplier =
        match[4] === "MPS" ? 1 / 0.514444 : match[4] === "KMH" ? 1 / 1.852 : 1;
      if (
        +match[2] * multiplier > 300 ||
        (match[3] && +match[3] * multiplier > 300)
      ) {
        result.unsupported.push(token);
        continue;
      }
      const calm = +match[2] === 0 && !match[3];
      // 000 is reserved for calm, never silently interpreted as a north wind.
      if (match[1] === "000" && !calm) {
        result.unsupported.push(token);
        continue;
      }
      result.wind = {
        from: match[1] === "VRB" || calm ? null : +match[1] % 360,
        speed: +match[2] * multiplier,
        gust: match[3] ? +match[3] * multiplier : null,
        variable: match[1] === "VRB",
        calm,
        unit: match[4],
        range: null,
      };
      group(
        token,
        "Wiatr",
        calm
          ? "Cisza."
          : `${match[1] === "VRB" ? "Kierunek zmienny" : `Z ${match[1]}° względem północy geograficznej (T)`}, ${match[2]} ${match[4]}${match[3] ? `, porywy ${match[3]} ${match[4]}` : ""}.`,
      );
    } else if (
      (match = token.match(/^(\d{3})V(\d{3})$/)) &&
      result.wind &&
      +match[1] <= 360 &&
      +match[2] <= 360
    ) {
      result.wind.range = [+match[1] % 360, +match[2] % 360];
      group(
        token,
        "Zmienność kierunku",
        `Wahania od ${match[1]}° do ${match[2]}° zgodnie z ruchem wskazówek zegara. Jedna składowa dla kierunku średniego nie opisuje całego zakresu.`,
      );
    } else if (token === "CAVOK") {
      result.cavok = true;
      result.skyReported = true;
      result.weatherReported = true;
      result.noSignificantWeather = true;
      result.visibility = {
        meters: 10000,
        qualifier: "at-least",
        text: "co najmniej 10 km",
      };
      group(
        token,
        "CAVOK",
        "Widzialność co najmniej 10 km, brak istotnych zjawisk i chmur istotnych operacyjnie według definicji kodu. To nie znaczy: niebo bez chmur.",
      );
    } else if (/^\d{4}$/.test(token) && !result.visibility) {
      result.visibility = {
        meters: token === "9999" ? 10000 : +token,
        qualifier:
          token === "9999"
            ? "at-least"
            : token === "0000"
              ? "less-than"
              : "reported",
        text:
          token === "9999"
            ? "co najmniej 10 km"
            : token === "0000"
              ? "poniżej 50 m"
              : `${+token} m`,
      };
      if (token === "0000") result.visibility.meters = 50;
      group(token, "Widzialność", result.visibility.text);
    } else if (
      /^(?:[MP]?\d+(?:\/\d+)?SM|\d+)$/.test(token) &&
      !result.visibility
    ) {
      let code = token;
      let whole = 0;
      if (/^\d+$/.test(token) && /^\d+\/\d+SM$/.test(tokens[index + 1] || "")) {
        whole = +token;
        code += ` ${tokens[++index]}`;
      }
      const part = code
        .split(" ")
        .at(-1)
        .match(/^([MP]?)(\d+)(?:\/(\d+))?SM$/);
      if (!part || (part[3] != null && +part[3] === 0)) {
        result.unsupported.push(code);
        continue;
      }
      const miles = whole + +part[2] / (part[3] ? +part[3] : 1);
      if (!Number.isFinite(miles) || miles > 1000) {
        result.unsupported.push(code);
        continue;
      }
      result.visibility = {
        meters: miles * 1609.344,
        qualifier:
          part[1] === "M"
            ? "less-than"
            : part[1] === "P"
              ? "greater-than"
              : "reported",
        text: `${part[1] === "M" ? "mniej niż " : part[1] === "P" ? "więcej niż " : ""}${miles} SM (≈ ${(miles * 1.609344).toFixed(2)} km)`,
      };
      group(code, "Widzialność", result.visibility.text);
    } else if (
      (match = token.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)(CB|TCU)?$/))
    ) {
      const height = match[2] === "///" ? null : +match[2] * 100;
      result.skyReported = true;
      result.clouds.push({
        cover: match[1],
        height,
        type: match[3] || null,
        code: token,
      });
      group(
        token,
        "Niebo",
        `${COVER[match[1]]}; ${height == null ? "wysokość nieznana" : `${height} ft nad lotniskiem`}${match[3] ? `; ${match[3] === "CB" ? "Cumulonimbus" : "wypiętrzony Cumulus"}` : ""}.`,
      );
    } else if (forecast && token === "NSW") {
      result.weatherReported = true;
      result.noSignificantWeather = true;
      group(
        token,
        "Zjawiska",
        "Nie przewiduje się istotnych zjawisk pogodowych w tej grupie. NSW nie znaczy: bez chmur, bez wiatru ani bez zagrożeń.",
      );
    } else if (
      (forecast ? ["NSC", "SKC"] : ["NSC", "NCD", "SKC", "CLR"]).includes(token)
    ) {
      result.skyReported = true;
      group(
        token,
        "Niebo",
        {
          NSC: "Brak chmur istotnych według kryteriów raportowania. Nie gwarantuje całkowicie pustego nieba.",
          NCD: "Automat nie wykrył chmur w swoim zakresie pomiaru.",
          SKC: forecast
            ? "Prognozowane bezchmurne niebo."
            : "Raportowane bezchmurne niebo.",
          CLR: "Automat nie wykrył chmur do granicy raportowania; wyżej mogą być chmury.",
        }[token],
      );
    } else if (
      !forecast &&
      (match = token.match(/^(M?\d{2}|\/\/)\/(M?\d{2}|\/\/)?$/))
    ) {
      result.temperature = temperature(match[1]);
      result.dewpoint = temperature(match[2] || "");
      group(
        token,
        "Temperatura / punkt rosy",
        `${result.temperature ?? "brak"} / ${result.dewpoint ?? "brak"} °C.`,
      );
    } else if (!forecast && (match = token.match(/^(Q|A)(\d{4})$/))) {
      const hpa = match[1] === "Q" ? +match[2] : (+match[2] / 100) * 33.8638867;
      if (hpa < 600 || hpa > 1100 || result.pressure) {
        result.unsupported.push(token);
        continue;
      }
      result.pressure =
        match[1] === "Q"
          ? { hpa: +match[2], text: `${+match[2]} hPa` }
          : {
              hpa: (+match[2] / 100) * 33.8638867,
              text: `${(+match[2] / 100).toFixed(2)} inHg (≈ ${Math.round((+match[2] / 100) * 33.8638867)} hPa)`,
            };
      group(
        token,
        "Ciśnienie",
        `Nastawa wysokościomierza: ${result.pressure.text}.`,
      );
    } else if (weatherText(token)) {
      const text = weatherText(token);
      result.weather.push(text);
      result.weatherReported = true;
      group(token, "Zjawiska", text);
    } else {
      result.unsupported.push(token);
    }
  }
  const ceilings = result.clouds.filter((cloud) =>
    ["BKN", "OVC", "VV"].includes(cloud.cover),
  );
  if (ceilings.length) {
    const known = ceilings.filter((cloud) => cloud.height != null);
    result.ceiling = {
      height: known.length
        ? Math.min(...known.map((cloud) => cloud.height))
        : null,
      uncertain: ceilings.some((cloud) => cloud.height == null),
    };
  }
  if (result.nil)
    result.warnings.push("NIL: nie ma obserwacji do interpretacji.");
  if (!result.wind && !result.nil && !partial)
    result.warnings.push(
      "Brak rozpoznanej grupy wiatru. Nie obliczamy składowych.",
    );
  if (!result.visibility && !result.nil && !partial)
    result.warnings.push("Brak rozpoznanej widzialności.");
  if (!result.skyReported && !result.nil && !partial)
    result.warnings.push(
      "Brak rozpoznanych danych o niebie. Nie wnioskuj z tego o braku pułapu.",
    );
  if (result.cavok && (result.clouds.length || result.weather.length))
    result.warnings.push(
      "CAVOK występuje razem z innymi grupami nieba lub zjawisk. Sprawdź oryginał: czytnik nie rozstrzyga tej sprzeczności.",
    );
  if (result.noSignificantWeather && result.weather.length && !result.cavok)
    result.warnings.push(
      "NSW występuje razem ze zjawiskami pogodowymi. Sprawdź sprzeczne grupy w oryginale.",
    );
  if (result.unsupported.length)
    result.warnings.push(
      "Część grup nie została zdekodowana. Zachowujemy je poniżej; mogą zawierać istotne informacje, np. RVR lub uskok wiatru.",
    );
  return result;
}
