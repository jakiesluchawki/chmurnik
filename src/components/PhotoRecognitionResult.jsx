import { useState } from "react";
import { recognitionMessage } from "../lib/recognition-message.js";
import { getSources } from "../data/sources.js";
import { clouds } from "../data/clouds.js";

export function PhotoRecognitionResult({ result, candidates, ownPhoto, isRegion, assetUrl, onExplore, onObserve }) {
  const [selected, setSelected] = useState(null);
  const [manualId, setManualId] = useState("");
  const message = recognitionMessage(result, candidates[0]?.cloud);
  const manualCloud = clouds.find(cloud => cloud.id === manualId);
  const modelCandidate = candidates.find((item) => item.id === selected) || candidates[0];
  const candidate = manualCloud ? { id: manualCloud.id, cloud: manualCloud } : modelCandidate;
  const reference = (manualCloud || message.showComparison) && candidate?.cloud.images[0];
  return (
    <>
      <section className={`photo-answer photo-answer--${message.kind}`} aria-live="polite">
        <span className="eyebrow">{message.kind === "hypothesis" ? "Wskazówka modelu" : "Wynik analizy"}</span>
        <h3>{message.title}</h3>
        <p>{message.text}</p>
      </section>

      <details className="photo-manual-compare">
        <summary>Porównaj z inną chmurą</summary>
        <label>Rodzaj z atlasu
          <select value={manualId} onChange={event => setManualId(event.target.value)}>
            <option value="">{message.showComparison ? "Wróć do propozycji modelu" : "Wybierz rodzaj"}</option>
            {clouds.map(cloud => <option key={cloud.id} value={cloud.id}>{cloud.name} · {cloud.polish}</option>)}
          </select>
        </label>
        <small>Ten wybór służy tylko do porównania. Nie zmienia wyniku ani zapisu obserwacji.</small>
      </details>
      {reference && (
        <section className="photo-evidence" aria-label="Porównanie własnego zdjęcia z atlasem">
          <h4>Sprawdź podobieństwa</h4>
          {message.showComparison && <div className="photo-evidence-options" aria-label="Wybierz fotografię atlasową do porównania">
            {candidates.slice(0, 2).map((item) => (
              <button key={item.id} type="button" aria-pressed={!manualCloud && candidate.id === item.id}
                onClick={() => { setManualId(""); setSelected(item.id); }}>
                <strong>{item.cloud.name}</strong><span>{item.cloud.polish}</span>
              </button>
            ))}
          </div>}
          <div className="photo-evidence-images">
            <figure>
              <figcaption>{isRegion ? "Twój wybrany fragment" : "Twoje zdjęcie"}</figcaption>
              <img src={ownPhoto} alt={isRegion ? "Wybrany fragment własnego zdjęcia" : "Własne zdjęcie nieba"} />
            </figure>
            <figure>
              <figcaption>{manualCloud ? "Twój wybór z atlasu" : "Atlas"} · {candidate.cloud.name}</figcaption>
              <img src={assetUrl(reference.src)} alt={`Fotografia porównawcza z atlasu: ${candidate.cloud.name}`} />
            </figure>
          </div>
          <p className="photo-evidence-prompt">{reference.diagnostic}</p>
          <small>Fotografia atlasowa: {reference.author} · {reference.license}. <a href={reference.page} target="_blank" rel="noreferrer">Źródło i licencja</a></small>
          <small>Podstawa opisu: {getSources(candidate.cloud.sourceIds).map((source, index) => <span key={source.id}>{index > 0 ? "; " : ""}<a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></span>)}</small>
          <div className="photo-result-actions">
            {!manualCloud && <button className="button button--secondary" onClick={() => onExplore(candidates.map((item) => item.id))}>Otwórz opisy w atlasie</button>}
            <button className="button button--ghost" onClick={onObserve}>Sprawdź cechy krok po kroku</button>
          </div>
        </section>
      )}

      {!reference && <div className="photo-result-actions">
        <button className="button button--secondary" onClick={onObserve}>Rozpoznaj po cechach chmury</button>
      </div>}

      <details className="photo-technical">
        <summary>Szczegóły analizy i jej ograniczenia</summary>
        <p>To względne wyniki modelu, nie gwarancja poprawnego rozpoznania. Jedno zdjęcie może pokazywać kilka rodzajów chmur. Światło, perspektywa i kadr zmieniają wynik.</p>
        <dl>{result.ranked.map((item) => (
          <div key={item.id}><dt>{item.id === "clear_sky" ? "Bezchmurne niebo" : candidates.find((value) => value.id === item.id)?.cloud.name || item.id}</dt><dd>{Math.round(item.probability * 100)}%</dd></div>
        ))}</dl>
        <small>Model: {result.modelVersion}. Analiza lokalna, bez wysyłania zdjęcia. Wynik nie służy do podejmowania decyzji o bezpieczeństwie lotu ani żeglugi.</small>
      </details>
    </>
  );
}
