import { ArrowLeft, ArrowSquareOut, ShieldCheck } from "@phosphor-icons/react";
import { applicationInformation } from "../data/app-information.js";

export function ApplicationInfo({ page, navigate }) {
  const info = applicationInformation.pages[page];
  return (
    <main className="page field-page app-information">
      <button className="field-back" onClick={() => navigate("home")}>
        <ArrowLeft size={18} /> Start
      </button>
      <header className="field-page-heading">
        <span className="eyebrow">
          CHMURNIK · {applicationInformation.updated}
        </span>
        <h1>{info.title}</h1>
        <p>{info.intro}</p>
      </header>
      <nav className="field-segments" aria-label="Informacje o aplikacji">
        <button
          aria-pressed={page === "support"}
          onClick={() => navigate("support")}
        >
          Pomoc
        </button>
        <button
          aria-pressed={page === "privacy"}
          onClick={() => navigate("privacy")}
        >
          Prywatność
        </button>
      </nav>
      <div className="app-information-sections">
        {info.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
      <div className="field-action-row">
        <a
          className="button button--secondary"
          href={applicationInformation.supportUrl}
          target="_blank"
          rel="noreferrer"
        >
          {applicationInformation.supportLabel} <ArrowSquareOut size={18} />
        </a>
        {page === "support" && (
          <button className="field-source" onClick={() => navigate("privacy")}>
            <ShieldCheck size={18} /> Polityka prywatności
          </button>
        )}
      </div>
    </main>
  );
}
