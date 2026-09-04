import {
  ArrowRight,
  BookOpen,
  Camera,
  Compass,
  ImageSquare,
  Info,
} from "@phosphor-icons/react";
import { clouds } from "../data/clouds.js";
import { selectDailyCloud } from "../lib/daily-cloud.js";
import { PracticeLinks, FullLearningLinks } from "./FieldPractice.jsx";

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export function FieldHome({
  navigate,
  onCapture,
  onRecognition,
  onSources,
  day,
  desktop = false,
}) {
  const daily = selectDailyCloud(clouds, day);
  return (
    <main className="page field-page field-home">
      <header className="field-home-heading">
        <span className="eyebrow">
          {day.toLocaleDateString("pl-PL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <h1>Poznaj chmury nad sobą</h1>
        <p>Rozpoznawaj ich cechy na zdjęciach, a w lekcjach sprawdzaj, jak powstają.</p>
      </header>
      <section className="field-capture-card">
        <div>
          <span className="eyebrow">Rozpoznawanie ze zdjęcia</span>
          <h2>
            Co masz
            <br />
            nad głową?
          </h2>
          <p>{desktop ? "Wybierz zdjęcie, sprawdź podpowiedź modelu i porównaj ją z atlasem." : "Zrób zdjęcie, sprawdź podpowiedź modelu i porównaj ją z atlasem."}</p>
          <button className="button button--primary" onClick={onCapture}>
            {desktop ? <ImageSquare size={21} /> : <Camera size={21} />} {desktop ? "Wybierz zdjęcie nieba" : "Zrób zdjęcie"}
          </button>
        </div>
        <img src={asset("assets/observer-guide-still-life-720.webp")} alt="" />
      </section>
      <button
        className="field-collection-shortcut"
        onClick={() => navigate("journal")}
      >
        <ImageSquare size={24} weight="light" />
        <span>
          <strong>Moje niebo</strong>
          <small>Zapisane zdjęcia i Twoje notatki o chmurach</small>
        </span>
        <ArrowRight size={21} />
      </button>
      <section className="field-home-practice">
        <div className="field-section-label">
          <span className="eyebrow">Pogoda w praktyce</span>
          <Compass size={21} />
        </div>
        <h2>Poznaj depesze, wiatr i mapy</h2>
        <PracticeLinks navigate={navigate} />
        <FullLearningLinks navigate={navigate} />
      </section>
      <section className="field-daily">
        <div className="field-section-label">
          <span className="eyebrow">Fotografia z atlasu</span>
          <button
            className="field-source"
            onClick={() => onSources(daily.cloud.sourceIds)}
          >
            <Info size={17} /> Źródła
          </button>
        </div>
        <img
          src={asset(daily.image.src)}
          alt={`Prawdziwa fotografia ${daily.cloud.name}`}
        />
        <div className="field-daily-caption">
          <h2>{daily.cloud.name}</h2>
          <p>{daily.image.diagnostic}</p>
          <button
            className="button button--secondary"
            onClick={() => onRecognition(daily.cloud.id)}
          >
            Ćwicz rozpoznawanie <ArrowRight size={17} />
          </button>
          <small>
            Fot. {daily.image.author} ·{" "}
            <a href={daily.image.page} target="_blank" rel="noreferrer">
              {daily.image.license}
            </a>
            . To zdjęcie z atlasu, nie widok dzisiejszej pogody.
          </small>
        </div>
      </section>
      <nav className="field-deep-links" aria-label="Wiedza i narzędzia">
        <button onClick={() => navigate("learn")}>
          <BookOpen size={21} />
          <span>Pełne lekcje</span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => navigate("layers/sounding")}>
          <Compass size={21} />
          <span>Warstwy i sondaże</span>
          <ArrowRight size={18} />
        </button>
        <button onClick={() => navigate("support")}>
          <Info size={21} />
          <span>Pomoc i prywatność</span>
          <ArrowRight size={18} />
        </button>
      </nav>
    </main>
  );
}
