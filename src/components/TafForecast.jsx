import { useId, useState } from "react";
import { formatTafTime, tafGroupMeaning } from "../lib/taf-reader.js";

const format = (number) =>
  number.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

export function ReportGroups({ groups }) {
  const [active, setActive] = useState(0);
  return (
    <>
      <h3>Dotknij grupy, żeby zobaczyć jej znaczenie</h3>
      <div className="field-metar-tokens" aria-label="Grupy raportu">
        {groups.map((group, index) => (
          <button
            key={`${index}-${group.code}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            {group.code}
          </button>
        ))}
      </div>
      <div className="field-token-detail" aria-live="polite">
        <span className="eyebrow">{groups[active]?.label}</span>
        <p>{groups[active]?.detail}</p>
      </div>
    </>
  );
}

function windText(wind, fallback) {
  if (!wind) return fallback;
  if (wind.calm) return "Cisza · 0 kt";
  return `${wind.variable ? "Kierunek zmienny" : `Z ${wind.from || 360}°T`} · ${format(wind.speed)} kt${wind.gust == null ? "" : `, porywy ${format(wind.gust)} kt`}`;
}

function segmentLabel(segment) {
  return segment.kind === "PROB"
    ? `${segment.probability}%${segment.temporary ? " · przejściowo" : " · możliwy wariant"}`
    : tafGroupMeaning[segment.kind].label;
}

function segmentTime(segment) {
  return segment.end
    ? `${formatTafTime(segment.start)} → ${formatTafTime(segment.end)}`
    : `Od ${formatTafTime(segment.start)}`;
}

export function TafForecast({ result }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  if (result.status !== "forecast") {
    return (
      <p className="field-caution" role="status">
        {result.status === "cancelled"
          ? "CNL: prognoza została odwołana. Nie używaj wcześniejszych warunków jako nadal obowiązującej prognozy."
          : "NIL: prognoza nie jest dostępna. Nie oznacza to dobrej pogody."}
      </p>
    );
  }
  const segment = result.segments[selected];
  const conditions = segment.conditions;
  const fallback = conditions.unsupported.length
    ? "Nie odczytano · sprawdź oryginał"
    : segment.partial
      ? "Bez zmiany w tej grupie"
      : "Brak danych w grupie";
  const ceiling = !conditions.skyReported
    ? fallback
    : conditions.ceiling?.uncertain
      ? "Wysokość nieznana / niepełna"
      : conditions.ceiling?.height != null
        ? `${conditions.ceiling.height} ft nad lotniskiem`
        : "Nie wskazano warstwy wyznaczającej pułap";
  const explanation = tafGroupMeaning[segment.kind].detail;
  const groups = [
    ...result.groups,
    ...(segment.kind === "INITIAL"
      ? []
      : [
          {
            code: segment.marker,
            label: segmentLabel(segment),
            detail: `${segmentTime(segment)}. ${explanation}${segment.temporary ? ` ${tafGroupMeaning.TEMPO.detail}` : ""}`,
          },
        ]),
    ...conditions.groups,
  ];
  return (
    <div className="field-taf-result">
      <div className="field-taf-window">
        <span className="eyebrow">Okres ważności prognozy</span>
        <strong>
          {formatTafTime(result.validity.start)} <span>→</span>{" "}
          {formatTafTime(result.validity.end)}
        </strong>
        <p>
          <code>{result.validity.code}</code> to przedział czasu.{" "}
          <code>{result.groups[1].code}</code> to czas wydania.
        </p>
      </div>
      <h3>Oś prognozy</h3>
      <p className="field-taf-hint">
        Wybierz grupę. Okna mogą się nakładać; wariantów PROB i epizodów TEMPO
        nie łączymy z bazą w jedną pogodę.
      </p>
      <ol className="field-taf-timeline" aria-label="Okresy prognozy TAF">
        {result.segments.map((item, index) => (
          <li key={`${index}-${item.marker}`} data-kind={item.kind}>
            <button
              aria-pressed={selected === index}
              aria-controls={id}
              onClick={() => setSelected(index)}
            >
              <span className="field-taf-kind">{segmentLabel(item)}</span>
              <strong>{segmentTime(item)}</strong>
              <code>{item.marker}</code>
            </button>
          </li>
        ))}
      </ol>
      <section
        id={id}
        className="field-taf-period"
        aria-label="Wybrany okres prognozy"
      >
        <div
          className="field-taf-period-heading"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="eyebrow">Prognoza · {segmentLabel(segment)}</span>
          <h3>{segmentTime(segment)}</h3>
        </div>
        <p>{explanation}</p>
        {segment.temporary && <p>{tafGroupMeaning.TEMPO.detail}</p>}
        <div className="field-metar-summary">
          <div>
            <span>Przewidywany wiatr</span>
            <strong>{windText(conditions.wind, fallback)}</strong>
          </div>
          <div>
            <span>Przewidywana widzialność</span>
            <strong>{conditions.visibility?.text || fallback}</strong>
          </div>
          <div>
            <span>Pułap w tej grupie prognozy</span>
            <strong>{ceiling}</strong>
          </div>
          <div>
            <span>Przewidywane zjawiska</span>
            <strong>
              {conditions.weather.length
                ? conditions.weather.join(" · ")
                : conditions.noSignificantWeather
                  ? "Brak istotnych zjawisk według kodu"
                  : segment.partial || conditions.unsupported.length
                    ? fallback
                    : "Nie wymieniono istotnych zjawisk"}
            </strong>
          </div>
        </div>
        {segment.partial && (
          <p className="field-taf-hint">
            Pokazujemy tylko elementy zapisane w tej grupie. „Bez zmiany” odsyła
            do tła prognozy, nie oznacza ciszy, bezchmurnego nieba ani wartości
            zero.
          </p>
        )}
        {conditions.clouds.length > 0 && (
          <p className="field-taf-clouds">
            <strong>Warstwy:</strong>{" "}
            {conditions.clouds
              .map(
                (cloud) =>
                  `${cloud.cover} ${cloud.height == null ? "wysokość nieznana" : `${cloud.height} ft`}${cloud.type ? ` (${cloud.type})` : ""}`,
              )
              .join(" · ")}
            . Wysokości nad lotniskiem.
          </p>
        )}
        {conditions.windShear.map((shear) => (
          <p className="field-caution" key={shear.code}>
            Uskok wiatru LLWS: na {shear.height} ft wiatr z {shear.from || 360}
            °T / {shear.speed} kt. Nie myl go z wiatrem przy powierzchni.
          </p>
        ))}
        {conditions.warnings.length > 0 && (
          <ul className="field-warnings">
            {conditions.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
        {conditions.unsupported.length > 0 && (
          <p>
            <strong>Nierozkodowane w tej grupie:</strong>{" "}
            <code>{conditions.unsupported.join(" ")}</code>
          </p>
        )}
        <ReportGroups key={selected} groups={groups} />
      </section>
      {result.temperatureExtremes.length > 0 && (
        <div className="field-taf-extremes">
          <h3>Temperatura w prognozie</h3>
          {result.temperatureExtremes.map((extreme) => (
            <p key={extreme.code}>
              <strong>
                {extreme.kind === "max" ? "Maksimum" : "Minimum"}:{" "}
                {extreme.temperature}°C
              </strong>{" "}
              · {formatTafTime(extreme.at)} <code>{extreme.code}</code>
            </p>
          ))}
          <p>
            TX/TN to prognozowane ekstremum, nie temperatura ani punkt rosy
            zmierzone teraz.
          </p>
        </div>
      )}
      {result.warnings.length > 0 && (
        <ul className="field-warnings">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {result.remarks && (
        <details className="field-disclosure">
          <summary>RMK: uwagi w oryginale</summary>
          <code>{result.remarks}</code>
          <p>
            Nie dekodujemy uwag automatycznie. Nie pomijaj ich w pełnym
            raporcie.
          </p>
        </details>
      )}
    </div>
  );
}
