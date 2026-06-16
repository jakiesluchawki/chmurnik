import { useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneTilt,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  CaretDown,
  CaretRight,
  Check,
  Cloud,
  CloudRain,
  Compass,
  Eye,
  Gauge,
  GraduationCap,
  House,
  Info,
  Lightning,
  List,
  MagnifyingGlass,
  MapPin,
  Notebook,
  Plus,
  Stack,
  Trash,
  Warning,
  Wind,
  X,
} from "@phosphor-icons/react";
import { cloudLevels, clouds, getCloud } from "./data/clouds.js";
import {
  comparisonDimensions,
  comparisonPresets,
  defaultComparisonIds,
} from "./data/comparison.js";
import {
  getCloudProfile,
  getTaxonomyTerm,
  taxonomyCategories,
  taxonomyTerms,
} from "./data/encyclopedia.js";
import {
  hardCases,
  lessonPractices,
  learningModules,
  moduleChecks,
  placementQuestions,
  quizQuestions,
} from "./data/learning.js";
import { lessons } from "./data/lessons.js";
import { fieldPrinciples, fieldQuestions } from "./data/field-guide.js";
import { getSources, sourceList } from "./data/sources.js";
import {
  createObservationDraft,
  evidenceCoverage,
  nextDiscriminatingObservation,
  observationVerdict,
  pairDiscriminator,
  scoreFieldObservation,
} from "./lib/field-guide.js";
import { calculatePlacement } from "./lib/placement.js";
import {
  clearObservationDraft,
  loadJournal,
  loadLessonPosition,
  loadObservationDraft,
  loadProfile,
  loadProgress,
  loadRecognitionStats,
  saveJournal,
  saveLessonPosition,
  saveObservationDraft,
  saveProfile,
  saveProgress,
  saveRecognitionStats,
} from "./lib/storage.js";
import {
  createRecognitionQuestion,
  recognitionMastery,
  recognitionSummary,
  selectRecognitionCloud,
  updateRecognitionStats,
  weakestRecognitionCloud,
} from "./lib/recognition.js";
import { windFromCloudMotion } from "./lib/wind.js";

const navItems = [
  { id: "home", label: "Start", icon: House },
  { id: "learn", label: "Nauka", icon: BookOpen },
  { id: "atlas", label: "Atlas", icon: Cloud },
  { id: "layers", label: "Warstwy", icon: Stack },
  { id: "journal", label: "Dziennik", icon: Notebook },
];

const publicAsset = (path) => `${import.meta.env.BASE_URL}${path}`;

const dialogFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const dialogStack = [];

function useDialogFocus(onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogStack.push(dialog);

    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = dialog?.querySelector(dialogFocusableSelector);
      (firstFocusable || dialog)?.focus();
    });

    const handleKeyDown = (event) => {
      if (dialogStack.at(-1) !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll(dialogFocusableSelector)]
        .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      const stackIndex = dialogStack.lastIndexOf(dialog);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return dialogRef;
}

function useRoute() {
  const getHash = () => window.location.hash.replace("#/", "") || "home";
  const [route, setRoute] = useState(getHash);

  useEffect(() => {
    const update = () => setRoute(getHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const navigate = (next) => {
    window.location.hash = `/${next}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return [route, navigate];
}

function SourceButton({ ids, onOpen, compact = false }) {
  const count = getSources(ids).length;
  if (!count) return null;

  return (
    <button className={`source-button ${compact ? "source-button--compact" : ""}`} onClick={() => onOpen(ids)}>
      <Info size={16} weight="bold" />
      {compact ? `${count} źr.` : count === 1 ? "Zobacz źródło" : `Źródła (${count})`}
    </button>
  );
}

function SourceDrawer({ ids, onClose }) {
  const selected = getSources(ids);
  const dialogRef = useDialogFocus(onClose);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        ref={dialogRef}
        className="source-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Źródła"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Warsztat źródłowy</span>
            <h2>Skąd to wiemy</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Zamknij źródła">
            <X size={22} />
          </button>
        </div>
        <p className="drawer-intro">
          Rozdzielamy normę klasyfikacyjną, poradniki operacyjne i objaśnienia interfejsu. To nie są źródła o tej samej roli.
        </p>
        <div className="source-list">
          {selected.map((source) => (
            <article className="source-record" key={source.id}>
              <span className="source-kind">{source.kind}</span>
              <h3>{source.title}</h3>
              <p className="source-org">{source.organization}</p>
              <p>{source.scope}</p>
              <p className="source-trust">{source.trust}</p>
              <a href={source.url} target="_blank" rel="noreferrer">
                Otwórz oryginał <ArrowSquareOut size={15} />
              </a>
              <small>Dostęp sprawdzony: {source.retrieved}</small>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function AppHeader({ route, navigate }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate("home")} aria-label="Cloud Recognition, strona główna">
        <span className="brand-mark"><Cloud size={21} weight="fill" /></span>
        <span>CLOUD RECOGNITION</span>
      </button>
      <nav className="desktop-nav" aria-label="Główna nawigacja">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={route === item.id ? "active" : ""}
            onClick={() => navigate(item.id)}
            aria-current={route === item.id ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
        {open ? <X size={24} /> : <List size={24} />}
      </button>
      {open && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.id);
                setOpen(false);
              }}
            >
              <item.icon size={20} />
              {item.label}
              <CaretRight size={16} />
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function BottomNav({ route, navigate, onTest, testOpen }) {
  return (
    <nav className="bottom-nav" aria-label="Nawigacja mobilna">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={route === item.id ? "active" : ""}
          onClick={() => navigate(item.id)}
          aria-current={route === item.id ? "page" : undefined}
        >
          <item.icon size={22} weight={route === item.id ? "fill" : "regular"} />
          <span>{item.label}</span>
        </button>
      ))}
      <button
        className={testOpen ? "active" : ""}
        onClick={onTest}
        aria-pressed={testOpen}
      >
        <Eye size={22} weight={testOpen ? "fill" : "regular"} />
        <span>Test</span>
      </button>
    </nav>
  );
}

function HeightScale() {
  return (
    <div className="height-scale" aria-hidden="true">
      <span>12 km</span>
      <i />
      <span>7 km</span>
      <i />
      <span>2 km</span>
      <i />
      <span>0</span>
    </div>
  );
}

function HomePage({ navigate, profile, onPlacement, onBeginner, completed, onSources, onOpenRecommended }) {
  const recommended = learningModules.find((module) => module.id === profile?.moduleId) || learningModules[0];
  const progress = Math.round((completed.length / learningModules.length) * 100);

  return (
    <>
      <section className="hero">
        <img
          src={publicAsset("assets/hero-atlas-swiatla.png")}
          alt=""
          className="hero-image"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <HeightScale />
        <div className="hero-content">
          <span className="hero-kicker">Interaktywny atlas nieba</span>
          <h1>Naucz się<br />czytać niebo</h1>
          <p>
            Od pierwszego spojrzenia po lotniczą analizę warstw. Bez zgadywania i bez ukrywania niepewności.
          </p>
          <div className="hero-actions">
            <button className="button button--coral" onClick={onPlacement}>
              Sprawdź, co już umiesz <ArrowRight size={19} weight="bold" />
            </button>
            <button className="button button--glass" onClick={onBeginner}>
              Zacznij od podstaw
            </button>
          </div>
        </div>
        <div className="hero-credit">Ilustracja dekoracyjna wygenerowana dla projektu</div>
      </section>

      <section className="paper-section home-intro">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">{profile ? "Twoja ścieżka" : "Nie musisz znać nazw"}</span>
            <h2>{profile ? profile.title : "Najpierw nauczysz się widzieć"}</h2>
          </div>
          <SourceButton ids={["wmoAtlas"]} onOpen={onSources} />
        </div>
        <p className="section-lead">
          {profile
            ? profile.message
            : "Kształt, skala, światło, opad i zmiana w czasie tworzą dowód. Nazwa pojawia się dopiero wtedy, gdy umiesz go opisać."}
        </p>

        <div className="feature-strip">
          <button onClick={() => navigate("atlas/observer")}>
            <Eye size={25} />
            <span><strong>Obserwator</strong> od cech do hipotez</span>
            <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate("layers")}>
            <Stack size={25} />
            <span><strong>Warstwy</strong> wysokości i ciśnienia</span>
            <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate("journal")}>
            <Notebook size={25} />
            <span><strong>Dziennik</strong> obserwacji</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="blue-section">
        <div className="section-heading section-heading--light">
          <div>
            <span className="eyebrow">Następny krok</span>
            <h2>{recommended.title}</h2>
          </div>
          {profile && <span className="progress-badge">{progress}% ścieżki</span>}
        </div>
        <p>{recommended.summary}</p>
        <div className="module-preview">
          <div>
            <span>{recommended.level} · {recommended.minutes} min</span>
            <div className="tag-row">
              {recommended.outcomes.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <button className="round-button" onClick={onOpenRecommended} aria-label="Przejdź do rekomendowanego modułu">
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      <section className="paper-section promise-section">
        <div className="promise-quote">
          <Eye size={28} />
          <blockquote>„Nie uczymy zgadywać zdjęć. Uczymy budować rozpoznanie z widocznych cech.”</blockquote>
        </div>
        <div className="promise-grid">
          <article>
            <span>01</span>
            <h3>Łagodny początek</h3>
            <p>Diagnoza nie ocenia. Po prostu pomija rzeczy, które już umiesz.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Ekspercka głębia</h3>
            <p>Gatunki, odmiany, cechy dodatkowe, przemiany i sporne granice są zawsze dostępne.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Źródła na widoku</h3>
            <p>Przy ważnych twierdzeniach możesz od razu sprawdzić podstawę i rolę źródła.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function PlacementModal({ onClose, onFinish }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState([]);
  const [result, setResult] = useState(null);
  const question = placementQuestions[step];
  const dialogRef = useDialogFocus(onClose);

  const answer = (score) => {
    const nextScores = [...scores, score];
    if (step === placementQuestions.length - 1) {
      setScores(nextScores);
      setResult(calculatePlacement(nextScores));
    } else {
      setScores(nextScores);
      setStep(step + 1);
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop--center" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="placement-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Diagnoza wiedzy"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button placement-close" onClick={onClose} aria-label="Zamknij diagnozę"><X size={22} /></button>
        {!result ? (
          <>
            <div className="placement-progress" aria-label={`Pytanie ${step + 1} z ${placementQuestions.length}`}>
              {placementQuestions.map((item, index) => <span key={item.id} className={index <= step ? "active" : ""} />)}
            </div>
            <span className="eyebrow">Pytanie {step + 1} / {placementQuestions.length}</span>
            <h2>{question.prompt}</h2>
            <p className="placement-note">To nie jest egzamin. Odpowiedź służy tylko do wyboru początku.</p>
            <div className="answer-list">
              {question.answers.map((option) => (
                <button key={option.label} onClick={() => answer(option.score)}>
                  <span>{option.label}</span><ArrowRight size={18} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="placement-result">
            <span className="result-icon"><Compass size={32} /></span>
            <span className="eyebrow">Rekomendowany początek</span>
            <h2>{result.title}</h2>
            <p>{result.message}</p>
            <button className="button button--primary" onClick={() => onFinish(result)}>
              Otwórz moją ścieżkę <ArrowRight size={18} />
            </button>
            <button className="text-button" onClick={() => onFinish(calculatePlacement([]))}>Mimo wszystko zacznij od zera</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonCheck({ check }) {
  const [answer, setAnswer] = useState(null);

  return (
    <section className="lesson-check" aria-labelledby="lesson-check-title">
      <div className="lesson-check-heading">
        <span className="eyebrow">Punkt kontrolny</span>
        <h2 id="lesson-check-title">{check.prompt}</h2>
      </div>
      <div className="lesson-check-options">
        {check.options.map((option, index) => {
          const state = answer === null
            ? ""
            : index === check.correct
              ? "correct"
              : answer === index
                ? "wrong"
                : "";
          return (
            <button
              key={option}
              className={state}
              onClick={() => answer === null && setAnswer(index)}
              aria-pressed={answer === index}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{option}</strong>
              {state === "correct" && <Check size={19} />}
              {state === "wrong" && <X size={19} />}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <div className="lesson-check-feedback" aria-live="polite">
          <Info size={20} />
          <p>{check.explanation}</p>
        </div>
      )}
    </section>
  );
}

function ChapterCheckpoint({ checkpoint }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <aside className="chapter-checkpoint">
      <span className="eyebrow">Zatrzymaj się na 20 sekund</span>
      <h3>{checkpoint.prompt}</h3>
      <button
        type="button"
        className="text-button"
        onClick={() => setRevealed((current) => !current)}
        aria-expanded={revealed}
      >
        {revealed ? "Ukryj odpowiedź" : "Sprawdź odpowiedź"}
        <CaretDown size={17} className={revealed ? "is-open" : ""} />
      </button>
      {revealed && <p aria-live="polite">{checkpoint.answer}</p>}
    </aside>
  );
}

function LearnPage({
  completed,
  onToggleCompleted,
  onSources,
  initialModule,
  onConsumeInitial,
  onBack,
  onSelectModule,
  recognitionStats,
  onOpenRecognition,
}) {
  const [selected, setSelected] = useState(initialModule || null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const mastery = recognitionMastery(clouds.map((cloud) => cloud.id), recognitionStats);
  const masteryAttempts = mastery.reduce((sum, item) => sum + item.attempts, 0);
  const steadyCount = mastery.filter((item) => item.state === "steady").length;
  const weakestCloudId = weakestRecognitionCloud(clouds.map((cloud) => cloud.id), recognitionStats);
  const weakestCloud = getCloud(weakestCloudId);

  useEffect(() => {
    if (initialModule) {
      setSelected(initialModule);
      onConsumeInitial();
    }
  }, [initialModule, onConsumeInitial]);

  useEffect(() => {
    if (!selected) return;
    const chapterCount = lessons[selected]?.chapters.length || 1;
    setActiveChapter(Math.min(loadLessonPosition(selected), chapterCount - 1));
  }, [selected]);

  useEffect(() => {
    if (!selected || !window.matchMedia("(max-width: 640px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      const rail = document.querySelector(`[data-lesson-contents="${selected}"]`);
      const active = rail?.querySelector(`[data-chapter-index="${activeChapter}"]`);
      if (rail && active) {
        rail.scrollTo({ left: Math.max(0, active.offsetLeft - 20), behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeChapter, selected]);

  if (selected) {
    const module = learningModules.find((item) => item.id === selected);
    const content = lessons[selected];
    const practice = lessonPractices[selected];
    const check = moduleChecks[selected];
    const isDone = completed.includes(selected);
    const chooseChapter = (index) => {
      const nextIndex = Math.max(0, Math.min(index, content.chapters.length - 1));
      setActiveChapter(nextIndex);
      saveLessonPosition(selected, nextIndex);
      window.setTimeout(() => document
        .getElementById(`chapter-${selected}-${content.chapters[nextIndex].number}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };
    return (
      <main className={`page lesson-page ${activeChapter === content.chapters.length - 1 ? "is-final-chapter" : ""}`}>
        <button
          className="back-button"
          onClick={() => {
            setSelected(null);
            onBack();
          }}
        >
          <ArrowLeft size={18} /> Ścieżka nauki
        </button>
        <div className="lesson-hero">
          <span className="lesson-number">{module.number}</span>
          <div>
            <span className="eyebrow">{module.level} · {module.minutes} min</span>
            <h1>{module.title}</h1>
            <p>{content.lead}</p>
          </div>
        </div>
        <section className="lesson-orientation" aria-label="Plan lekcji">
          <div className="lesson-time-plan">
            <span className="eyebrow">Skąd bierze się {module.minutes} minut</span>
            <div>
              {content.timePlan.map((item) => (
                <span key={item.label}>
                  <strong>{item.minutes} min</strong>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="lesson-objectives">
            <span className="eyebrow">Po tej lekcji potrafisz</span>
            <ul>
              {content.objectives.map((objective) => (
                <li key={objective}><Check size={16} />{objective}</li>
              ))}
            </ul>
          </div>
        </section>
        <div className="lesson-source-row">
          <SourceButton ids={module.sourceIds} onOpen={onSources} />
          <p>Czas obejmuje czytanie, krótkie przypomnienia, analizę przykładów, zadanie i sprawdzenie — nie sam tekst.</p>
        </div>
        <div className="lesson-mobile-progress" aria-label={`Rozdział ${activeChapter + 1} z ${content.chapters.length}`}>
          <div>
            <span>Rozdział {activeChapter + 1} z {content.chapters.length}</span>
            <strong>{content.chapters[activeChapter].title}</strong>
          </div>
          <span aria-hidden="true">
            <i style={{ width: `${((activeChapter + 1) / content.chapters.length) * 100}%` }} />
          </span>
        </div>
        <nav className="lesson-contents" aria-label="Spis rozdziałów lekcji">
          <span className="eyebrow">W tej lekcji</span>
          <div data-lesson-contents={selected}>
            {content.chapters.map((chapter, index) => (
              <button
                key={chapter.number}
                data-chapter-index={index}
                className={index === activeChapter ? "active" : ""}
                onClick={() => chooseChapter(index)}
                aria-current={index === activeChapter ? "step" : undefined}
              >
                <span>{chapter.number}</span>
                {chapter.title}
              </button>
            ))}
          </div>
        </nav>
        <div className="lesson-chapters">
          {content.chapters.map((chapter, index) => (
            <article
              id={`chapter-${selected}-${chapter.number}`}
              className={`lesson-chapter ${index === activeChapter ? "is-active" : ""}`}
              key={chapter.number}
            >
              <header>
                <span>{chapter.number}</span>
                <div>
                  <small>{chapter.minutes} min lektury i przypomnienia</small>
                  <h2>{chapter.title}</h2>
                </div>
              </header>
              <div className="lesson-chapter-body">
                {chapter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {chapter.points && (
                  <ul>
                    {chapter.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                )}
                {chapter.example && (
                  <aside className="lesson-example">
                    <span>{chapter.example.label}</span>
                    <strong>{chapter.example.title}</strong>
                    <p>{chapter.example.body}</p>
                  </aside>
                )}
                {chapter.callout && (
                  <aside className="lesson-callout">
                    <Info size={20} />
                    <p>{chapter.callout}</p>
                  </aside>
                )}
                <SourceButton ids={chapter.sourceIds} onOpen={onSources} compact />
                <ChapterCheckpoint
                  key={`${selected}-${chapter.number}`}
                  checkpoint={chapter.checkpoint}
                />
                <nav className="lesson-chapter-nav" aria-label="Nawigacja między rozdziałami">
                  <button
                    type="button"
                    onClick={() => chooseChapter(index - 1)}
                    disabled={index === 0}
                  >
                    <ArrowLeft size={17} /> Poprzedni
                  </button>
                  <span>{index + 1} / {content.chapters.length}</span>
                  {index < content.chapters.length - 1 ? (
                    <button type="button" onClick={() => chooseChapter(index + 1)}>
                      Następny <ArrowRight size={17} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document
                        .getElementById(`lesson-recap-${selected}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      Podsumowanie <ArrowRight size={17} />
                    </button>
                  )}
                </nav>
              </div>
            </article>
          ))}
        </div>
        <section className="lesson-recap" id={`lesson-recap-${selected}`}>
          <span className="eyebrow">Zapamiętaj przed ćwiczeniem</span>
          <h2>Krótka mapa lekcji</h2>
          <ol>
            {content.recap.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>
        <LessonCheck key={selected} check={check} />
        <div className="lesson-practice">
          <div>
            <span className="eyebrow">Ćwiczenie · {practice.label}</span>
            <h2>{practice.title}</h2>
            <p>{practice.body}</p>
            <ol>
              {practice.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="practice-outcome">
              <Check size={20} />
              <span><strong>Warunek ukończenia:</strong> {practice.outcome}</span>
            </div>
          </div>
          <button className={`button ${isDone ? "button--done" : "button--coral"}`} onClick={() => onToggleCompleted(selected)}>
            {isDone ? <><Check size={19} weight="bold" /> Ukończono</> : <>Oznacz jako ukończone <Check size={19} /></>}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-heading">
        <span className="eyebrow">Od obserwatora do analityka</span>
        <h1>Twoja ścieżka nauki</h1>
        <p>Możesz iść po kolei albo wejść od razu w temat, którego potrzebujesz. Ukończenie zapisuje się tylko na tym urządzeniu.</p>
      </header>

      <div className="path-summary">
        <div className="path-progress">
          <span style={{ width: `${(completed.length / learningModules.length) * 100}%` }} />
        </div>
        <strong>{completed.length} z {learningModules.length} modułów</strong>
        <span>Dane prywatne · zapis lokalny</span>
      </div>

      <div className="learning-path">
        {learningModules.map((module) => {
          const done = completed.includes(module.id);
          return (
            <button
              className="learning-card"
              key={module.id}
              onClick={() => {
                setSelected(module.id);
                onSelectModule(module.id);
              }}
            >
              <span className={`learning-number ${done ? "done" : ""}`}>{done ? <Check size={20} /> : module.number}</span>
              <span className="learning-card-content">
                <span className="eyebrow">{module.level} · {module.minutes} min</span>
                <strong>{module.title}</strong>
                <span>{module.summary}</span>
                <span className="tag-row">
                  {module.outcomes.slice(0, 3).map((item) => <i key={item}>{item}</i>)}
                </span>
              </span>
              <CaretRight size={21} />
            </button>
          );
        })}
      </div>

      <section className="recognition-dashboard">
        <div className="recognition-dashboard-heading">
          <div>
            <span className="eyebrow">Pamięć rozpoznawania</span>
            <h2>Wiesz, co wymaga powtórki</h2>
            <p>
              Liczymy osobno każdą z dziesięciu chmur. Błąd zwiększa częstotliwość
              powrotu danego rodzaju, a odpowiedzi zostają tylko na tym urządzeniu.
            </p>
          </div>
          <div className="recognition-dashboard-summary" aria-label="Podsumowanie treningu">
            <span><strong>{masteryAttempts}</strong> odpowiedzi</span>
            <span><strong>{steadyCount}</strong> utrwalonych</span>
          </div>
        </div>
        <div className="mastery-grid">
          {mastery.map((item) => {
            const cloud = getCloud(item.cloudId);
            return (
              <button
                key={item.cloudId}
                className={`mastery-card mastery-card--${item.state}`}
                onClick={() => onOpenRecognition(item.cloudId)}
                aria-label={`Ćwicz ${cloud.name}: ${item.label}`}
              >
                <span className="mastery-code">{cloud.code}</span>
                <span className="mastery-copy">
                  <strong>{cloud.name}</strong>
                  <small>{item.label}</small>
                </span>
                <span className="mastery-score">
                  {item.attempts ? `${item.correct}/${item.attempts}` : "—"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="recognition-dashboard-action">
          <p>
            Następna rekomendacja: <strong>{weakestCloud.name}</strong>.
            Priorytet uwzględnia błędy i zbyt małą liczbę prób.
          </p>
          <button className="button button--coral" onClick={() => onOpenRecognition(weakestCloudId)}>
            Ćwicz najsłabszy rodzaj <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="quiz-invite">
        <div>
          <span className="eyebrow">Przekrojowy sprawdzian</span>
          <h2>Trzy pytania, bez rankingu</h2>
          <p>Każda odpowiedź od razu wyjaśnia tok rozumowania.</p>
        </div>
        <button className="button button--primary" onClick={() => setQuizOpen(true)}>
          Otwórz quiz <ArrowRight size={18} />
        </button>
      </section>
      {quizOpen && <QuizModal onClose={() => setQuizOpen(false)} />}
    </main>
  );
}

function QuizModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const question = quizQuestions[step];
  const finished = step === quizQuestions.length;
  const dialogRef = useDialogFocus(onClose);

  const select = (index) => {
    if (answer !== null) return;
    setAnswer(index);
    if (index === question.correct) setScore(score + 1);
  };

  const next = () => {
    setStep(step + 1);
    setAnswer(null);
  };

  return (
    <div className="modal-backdrop modal-backdrop--center" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="quiz-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Przekrojowy sprawdzian"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button placement-close" onClick={onClose} aria-label="Zamknij quiz"><X size={22} /></button>
        {!finished ? (
          <>
            <span className="eyebrow">Pytanie {step + 1} / {quizQuestions.length}</span>
            <h2>{question.prompt}</h2>
            <div className="answer-list">
              {question.options.map((option, index) => {
                const state = answer === null ? "" : index === question.correct ? "correct" : answer === index ? "wrong" : "";
                return (
                  <button className={state} key={option} onClick={() => select(index)}>
                    <span>{option}</span>
                    {state === "correct" && <Check size={19} />}
                    {state === "wrong" && <X size={19} />}
                  </button>
                );
              })}
            </div>
            {answer !== null && (
              <div className="quiz-explanation">
                <Info size={20} />
                <p>{question.explanation}</p>
                <button className="button button--primary" onClick={next}>Dalej <ArrowRight size={17} /></button>
              </div>
            )}
          </>
        ) : (
          <div className="placement-result">
            <span className="result-icon"><GraduationCap size={34} /></span>
            <span className="eyebrow">Koniec rundy</span>
            <h2>{score} / {quizQuestions.length}</h2>
            <p>Wynik nie blokuje treści. Wróć do wyjaśnień wtedy, gdy konkretny trop nadal nie jest intuicyjny.</p>
            <button className="button button--primary" onClick={onClose}>Wróć do nauki</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AtlasPage({
  onSources,
  onSaveObservation,
  initialTab = "atlas",
  initialComparisonIds = null,
}) {
  const [tab, setTab] = useState(initialTab);
  const [level, setLevel] = useState("wszystkie");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [comparisonIds, setComparisonIds] = useState(
    initialComparisonIds?.length >= 2 ? initialComparisonIds : comparisonPresets[1].cloudIds,
  );

  useEffect(() => {
    setTab(initialTab);
    if (initialComparisonIds?.length >= 2) setComparisonIds(initialComparisonIds);
  }, [initialComparisonIds?.join(","), initialTab]);

  const filtered = clouds.filter((cloud) => {
    const matchesLevel = level === "wszystkie" || cloud.level === level;
    const profile = getCloudProfile(cloud.id);
    const haystack = [
      cloud.name,
      cloud.polish,
      cloud.code,
      cloud.headline,
      profile?.essence,
      ...cloud.species,
      ...cloud.varieties,
      ...cloud.features,
      ...(cloud.accessoryClouds || []),
    ].join(" ").toLowerCase();
    return matchesLevel && haystack.includes(query.toLowerCase());
  });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const openObserver = () => {
    setSelected(null);
    setSelectedTerm(null);
    setTab("observer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openComparison = (cloudIds) => {
    setSelected(null);
    setSelectedTerm(null);
    setComparisonIds(cloudIds);
    setTab("compare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="page atlas-page">
      <header className="page-heading page-heading--inline">
        <div>
          <span className="eyebrow">Międzynarodowa klasyfikacja WMO</span>
          <h1>Encyklopedia chmur</h1>
          <p>Dziesięć rodzajów jest mapą wejścia. Dalej czeka 49 formalnych pojęć, reguły pochodzenia, fizyka, pogoda i znaczenie lotnicze.</p>
        </div>
        <SourceButton ids={["wmoAtlas", "wmoSummary", "wmoPrinciples", "wmoUpperAtmosphere"]} onOpen={onSources} />
      </header>

      <div className="segmented-control" role="tablist">
        {[
          ["atlas", "Rodzaje · 10"],
          ["observer", "Obserwator terenowy"],
          ["compare", "Porównaj"],
          ["encyclopedia", "Indeks · 49"],
          ["cases", "Trudne przypadki"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "atlas" && (
        <>
          <div className="encyclopedia-stats" aria-label="Zakres encyklopedii">
            <article><strong>10</strong><span>rodzajów troposferycznych</span></article>
            <article><strong>15</strong><span>gatunków WMO</span></article>
            <article><strong>9</strong><span>odmian</span></article>
            <article><strong>25</strong><span>cech, chmur towarzyszących i klas specjalnych</span></article>
          </div>
          <div className="atlas-tools">
            <label className="search-field">
              <MagnifyingGlass size={20} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj nazwy, kodu albo terminu WMO" />
            </label>
            <div className="filter-scroll">
              {cloudLevels.map((item) => (
                <button key={item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>
              ))}
            </div>
          </div>
          <div className="cloud-grid">
            {filtered.map((cloud) => (
              <button className="cloud-card" key={cloud.id} onClick={() => setSelected(cloud.id)}>
                <span className="cloud-image-wrap">
                  <img
                    src={publicAsset(cloud.image.src)}
                    alt={`${cloud.name}, ${cloud.polish}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="cloud-code">{cloud.code}</span>
                  <span className="cloud-level">{cloud.level}</span>
                </span>
                <span className="cloud-card-body">
                  <span>
                    <strong>{cloud.name}</strong>
                    <i>{cloud.polish}</i>
                  </span>
                  <small>{cloud.headline}</small>
                  <span className="cloud-card-count">{cloud.species.length + cloud.varieties.length + cloud.features.length + cloud.accessoryClouds.length} powiązanych terminów</span>
                  <span className="card-link">Otwórz monografię <ArrowRight size={16} /></span>
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && <div className="empty-state"><Cloud size={32} /><h2>Nie znaleźliśmy takiej nazwy</h2><button onClick={() => { setQuery(""); setLevel("wszystkie"); }}>Wyczyść filtry</button></div>}
        </>
      )}
      {tab === "encyclopedia" && (
        <EncyclopediaIndex
          onSelectTerm={setSelectedTerm}
          onSelectCloud={setSelected}
          onSources={onSources}
        />
      )}
      {tab === "observer" && (
        <FieldObserver
          onOpenCloud={setSelected}
          onCompareClouds={openComparison}
          onSaveObservation={onSaveObservation}
          onSources={onSources}
        />
      )}
      {tab === "compare" && (
        <CloudComparison
          initialIds={comparisonIds}
          onOpenCloud={setSelected}
          onSources={onSources}
        />
      )}
      {tab === "cases" && <HardCases onCompareClouds={openComparison} onSources={onSources} />}
      {selected && (
        <CloudDetail
          cloud={getCloud(selected)}
          onClose={() => setSelected(null)}
          onOpenTerm={(id) => {
            setSelected(null);
            setSelectedTerm(id);
          }}
          onOpenComparison={() => openComparison(defaultComparisonIds(selected))}
          onOpenObserver={openObserver}
          onSources={onSources}
        />
      )}
      {selectedTerm && (
        <TermDetail
          term={getTaxonomyTerm(selectedTerm)}
          onClose={() => setSelectedTerm(null)}
          onOpenCloud={(id) => {
            setSelectedTerm(null);
            setSelected(id);
          }}
          onSources={onSources}
        />
      )}
    </main>
  );
}

function FieldObserver({ onOpenCloud, onCompareClouds, onSaveObservation, onSources }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [resultsOpen, setResultsOpen] = useState(false);
  const questionHeadingRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const hasNavigatedRef = useRef(false);
  const coverage = evidenceCoverage(answers);
  const question = fieldQuestions[step];
  const selectedId = answers[question.id];
  const ranked = useMemo(
    () => scoreFieldObservation(clouds.map((cloud) => cloud.id), answers),
    [answers],
  );
  const topResults = ranked.slice(0, 3);
  const verdict = observationVerdict(topResults);
  const discriminator = nextDiscriminatingObservation(topResults);
  const leadingScore = Math.max(topResults[0]?.score || 1, 1);

  useEffect(() => {
    if (!hasNavigatedRef.current) return;
    if (resultsOpen) resultsHeadingRef.current?.focus();
    else questionHeadingRef.current?.focus();
  }, [resultsOpen, step]);

  const choose = (optionId) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
  };

  const next = () => {
    if (!selectedId) return;
    hasNavigatedRef.current = true;
    if (step === fieldQuestions.length - 1) setResultsOpen(true);
    else setStep((current) => current + 1);
  };

  const reset = () => {
    hasNavigatedRef.current = false;
    setAnswers({});
    setStep(0);
    setResultsOpen(false);
  };

  if (resultsOpen) {
    const first = getCloud(topResults[0].cloudId);
    const second = getCloud(topResults[1].cloudId);

    return (
      <section className="field-observer field-observer--results">
        <header className="field-results-heading">
          <div>
            <span className="eyebrow">Asystent obserwacji · wynik heurystyczny</span>
            <h2 ref={resultsHeadingRef} tabIndex="-1">Trzy hipotezy, nie jeden werdykt</h2>
            <p>
              Ranking pokazuje zgodność z zaznaczonymi cechami. Nie mierzy
              prawdopodobieństwa i nie zastępuje obserwacji całego nieba.
            </p>
          </div>
          <div className={`field-verdict field-verdict--${verdict.level}`}>
            <span>{verdict.label}</span>
            <p>{verdict.explanation}</p>
          </div>
        </header>

        <div className="field-answer-summary" aria-label="Zapisane odpowiedzi">
          {fieldQuestions.map((item, index) => {
            const option = item.options.find((candidate) => candidate.id === answers[item.id]);
            return (
              <button
                key={item.id}
                onClick={() => {
                  hasNavigatedRef.current = true;
                  setStep(index);
                  setResultsOpen(false);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><small>{item.prompt}</small><strong>{option?.label}</strong></div>
              </button>
            );
          })}
        </div>

        <div className="field-hypotheses">
          {topResults.map((result, index) => {
            const cloud = getCloud(result.cloudId);
            const matches = [...new Set(result.matches)].slice(0, 4);
            const conflicts = [...new Set(result.conflicts)].slice(0, 2);
            return (
              <article className={index === 0 ? "leading" : ""} key={result.cloudId}>
                <div className="hypothesis-image">
                  <img src={publicAsset(cloud.image.src)} alt={`${cloud.name}, ${cloud.polish}`} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="hypothesis-body">
                  <span className="eyebrow">{index === 0 ? verdict.label : "Hipoteza alternatywna"}</span>
                  <h3>{cloud.name}</h3>
                  <p className="hypothesis-polish">{cloud.polish}</p>
                  <div className="hypothesis-meter" aria-label={`Wynik zgodności ${result.score}`}>
                    <span style={{ width: `${Math.max(8, (result.score / leadingScore) * 100)}%` }} />
                  </div>
                  <div className="hypothesis-evidence">
                    <strong>Co pasuje</strong>
                    <ul>{matches.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul>
                    {conflicts.length > 0 && (
                      <>
                        <strong>Co osłabia</strong>
                        <ul className="conflicts">{conflicts.map((item) => <li key={item}><X size={15} />{item}</li>)}</ul>
                      </>
                    )}
                  </div>
                  <button className="card-link" onClick={() => onOpenCloud(cloud.id)}>
                    Otwórz monografię <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <section className="field-next-observation">
          <div>
            <span className="eyebrow">Najbardziej wartościowy kolejny dowód</span>
            <h3>Jak rozdzielić {first.name} i {second.name}</h3>
          </div>
          <p>{discriminator}</p>
        </section>

        <section className="field-comparison">
          <div className="field-comparison-heading">
            <div>
              <span className="eyebrow">Porównanie prowadzącej pary</span>
              <h3>Patrz na różnicę, nie na podobieństwo</h3>
            </div>
            <SourceButton ids={["wmoObservation", "wmoAtlas"]} onOpen={onSources} />
          </div>
          <div className="comparison-grid">
            {[first, second].map((cloud) => (
              <article key={cloud.id}>
                <div>
                  <span className="cloud-code">{cloud.code}</span>
                  <img src={publicAsset(cloud.image.src)} alt={`${cloud.name}, ${cloud.polish}`} />
                </div>
                <h4>{cloud.name}</h4>
                <p>{cloud.altitude}</p>
                <ul>{cloud.observe.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                <aside><strong>Uwaga na pułapkę</strong><p>{cloud.trap}</p></aside>
              </article>
            ))}
          </div>
          <button
            className="comparison-deep-link"
            onClick={() => onCompareClouds([first.id, second.id])}
          >
            <Stack size={19} />
            <span>
              <strong>Otwórz pełne porównanie</strong>
              <small>Mikrofizyka, geneza, ewolucja, pogoda i lotnictwo</small>
            </span>
            <ArrowRight size={17} />
          </button>
        </section>

        <div className="field-results-actions">
          <button
            className="button button--coral"
            onClick={() => onSaveObservation(
              createObservationDraft(
                answers,
                topResults,
                (cloudId) => getCloud(cloudId).name,
              ),
            )}
          >
            <Notebook size={18} /> Zapisz dowody w dzienniku
          </button>
          <button className="button button--primary" onClick={() => {
            hasNavigatedRef.current = true;
            setStep(0);
            setResultsOpen(false);
          }}>
            Zmień odpowiedzi
          </button>
          <button className="text-button" onClick={reset}>Nowa obserwacja</button>
        </div>
      </section>
    );
  }

  return (
    <section className="field-observer">
      <aside className="field-method">
        <span className="eyebrow">Mobilny notes obserwatora</span>
        <h2>Najpierw dowody</h2>
        <p>
          Pięć krótkich kroków porządkuje to, co widzisz. Możesz wracać do
          odpowiedzi; wynik pozostaje hipotezą do sprawdzenia w atlasie.
        </p>
        <div className="field-coverage">
          <span style={{ width: `${(coverage / fieldQuestions.length) * 100}%` }} />
        </div>
        <strong>{coverage} z {fieldQuestions.length} dowodów zapisanych</strong>
        <ul>
          {fieldPrinciples.map((item) => <li key={item}><Eye size={17} />{item}</li>)}
        </ul>
        <SourceButton ids={["wmoObservation", "wmoAtlas"]} onOpen={onSources} />
      </aside>

      <div className="field-question-panel">
        <div className="field-stepper" aria-label={`Krok ${step + 1} z ${fieldQuestions.length}`}>
          {fieldQuestions.map((item, index) => (
            <button
              key={item.id}
              className={index === step ? "active" : answers[item.id] ? "answered" : ""}
              onClick={() => {
                hasNavigatedRef.current = true;
                setStep(index);
              }}
              disabled={!answers[item.id] && index > step}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Krok ${index + 1}: ${item.prompt}`}
            >
              {answers[item.id] ? <Check size={14} /> : index + 1}
            </button>
          ))}
        </div>
        <span className="eyebrow">{question.eyebrow}</span>
        <h3 id="field-question-title" ref={questionHeadingRef} tabIndex="-1">
          {question.prompt}
        </h3>
        <p className="field-question-help" id="field-question-help">{question.help}</p>
        <div
          className="field-options"
          role="group"
          aria-labelledby="field-question-title"
          aria-describedby="field-question-help"
        >
          {question.options.map((option, index) => (
            <button
              key={option.id}
              className={selectedId === option.id ? "selected" : ""}
              onClick={() => choose(option.id)}
              aria-pressed={selectedId === option.id}
            >
              <span>
                {selectedId === option.id
                  ? <Check size={18} weight="bold" />
                  : String.fromCharCode(65 + index)}
              </span>
              <div><strong>{option.label}</strong><small>{option.description}</small></div>
            </button>
          ))}
        </div>
        <footer className="field-question-actions">
          <button
            className="text-button"
            onClick={() => {
              hasNavigatedRef.current = true;
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={step === 0}
          >
            <ArrowLeft size={17} /> Wstecz
          </button>
          <button className="button button--coral" onClick={next} disabled={!selectedId}>
            {step === fieldQuestions.length - 1 ? "Zobacz hipotezy" : "Następny dowód"}
            <ArrowRight size={17} />
          </button>
        </footer>
      </div>
    </section>
  );
}

function CloudComparison({ initialIds, onOpenCloud, onSources }) {
  const [selectedIds, setSelectedIds] = useState(initialIds.slice(0, 3));
  const selectedClouds = selectedIds.map((id) => {
    const cloud = getCloud(id);
    return { cloud, profile: getCloudProfile(id) };
  });
  const activePreset = comparisonPresets.find(
    (preset) => preset.cloudIds.length === selectedIds.length
      && preset.cloudIds.every((id) => selectedIds.includes(id)),
  );
  const nextEvidence = selectedIds.length === 2
    ? pairDiscriminator(selectedIds[0], selectedIds[1])
    : "Przy trzech hipotezach najpierw odrzuć tę, której poziom, skala elementów albo rodzaj opadu najmniej pasuje. Potem porównaj pozostałą parę przez 10–15 minut.";

  useEffect(() => {
    setSelectedIds(initialIds.slice(0, 3));
  }, [initialIds]);

  const toggleCloud = (cloudId) => {
    const selected = selectedIds.includes(cloudId);
    if (selected && selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter((id) => id !== cloudId));
    } else if (!selected && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, cloudId]);
    }
  };

  return (
    <section className="cloud-comparison">
      <header className="comparison-intro">
        <div>
          <span className="eyebrow">Laboratorium różnic</span>
          <h2>Te same pytania. Różne chmury.</h2>
          <p>
            Wybierz dwa lub trzy rodzaje. Każdy zostanie opisany w tym samym
            porządku, dzięki czemu podobieństwo nie przesłoni cechy rozstrzygającej.
          </p>
        </div>
        <aside>
          <strong>{selectedIds.length} / 3</strong>
          <span>hipotezy w porównaniu</span>
          <SourceButton ids={["wmoAtlas", "wmoObservation", "faaWeather"]} onOpen={onSources} />
        </aside>
      </header>

      <div className="comparison-presets" aria-label="Najczęściej mylone pary">
        {comparisonPresets.map((preset) => (
          <button
            key={preset.id}
            className={activePreset?.id === preset.id ? "active" : ""}
            onClick={() => setSelectedIds(preset.cloudIds)}
          >
            <span>{preset.label}</span>
            <strong>{preset.title}</strong>
          </button>
        ))}
      </div>

      <div className="comparison-picker">
        <div>
          <span className="eyebrow">Własny zestaw</span>
          <p>Minimum dwie, maksimum trzy chmury. Kolejność wyboru ustala kolejność kolumn.</p>
        </div>
        <div>
          {clouds.map((cloud) => {
            const selected = selectedIds.includes(cloud.id);
            const disabled = selected
              ? selectedIds.length <= 2
              : selectedIds.length >= 3;
            return (
              <button
                key={cloud.id}
                className={selected ? "selected" : ""}
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => toggleCloud(cloud.id)}
              >
                <span>{selected ? <Check size={15} weight="bold" /> : cloud.code}</span>
                <strong>{cloud.name}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="comparison-cloud-strip"
        style={{ "--comparison-count": selectedClouds.length }}
        aria-live="polite"
      >
        {selectedClouds.map(({ cloud }) => (
          <article key={cloud.id}>
            <div>
              <img
                src={publicAsset(cloud.image.src)}
                alt={`${cloud.name}, ${cloud.polish}`}
                loading="lazy"
                decoding="async"
              />
              <span className="cloud-code">{cloud.code}</span>
            </div>
            <span className="eyebrow">{cloud.level}</span>
            <h3>{cloud.name}</h3>
            <p>{cloud.polish}</p>
            <small>{cloud.altitude}</small>
            <button className="card-link" onClick={() => onOpenCloud(cloud.id)}>
              Otwórz monografię <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>

      <section className="comparison-next-evidence">
        <span className="eyebrow">Najbardziej wartościowy kolejny dowód</span>
        <p>{nextEvidence}</p>
      </section>

      <div className="comparison-dimensions">
        {comparisonDimensions.map((dimension) => (
          <section className={`comparison-dimension ${dimension.tone ? `is-${dimension.tone}` : ""}`} key={dimension.id}>
            <header>
              <span>{dimension.number}</span>
              <div>
                <small>{dimension.eyebrow}</small>
                <h3>{dimension.title}</h3>
                <p>{dimension.description}</p>
              </div>
            </header>
            <div
              className="comparison-values"
              style={{ "--comparison-count": selectedClouds.length }}
            >
              {selectedClouds.map((record) => (
                <article key={record.cloud.id}>
                  <strong><span>{record.cloud.code}</span>{record.cloud.name}</strong>
                  <ul>
                    {dimension.value(record).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="comparison-method-note">
        <Info size={20} />
        <p>
          Porównanie porządkuje wiedzę o rodzajach WMO. Nie wyznacza wysokości,
          intensywności oblodzenia ani bezpieczeństwa operacji z samego wyglądu.
        </p>
      </footer>
    </section>
  );
}

function formatResultCount(count) {
  if (count === 1) return "1 wynik";
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
    return `${count} wyniki`;
  }
  return `${count} wyników`;
}

function EncyclopediaIndex({ onSelectTerm, onSelectCloud, onSources }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = taxonomyTerms.filter((term) => {
    const matchesCategory = category === "all" || term.category === category;
    const genusNames = term.genera.map((id) => {
      const cloud = getCloud(id);
      return cloud ? `${cloud.name} ${cloud.polish} ${cloud.code}` : "";
    });
    const haystack = [
      term.name,
      term.polish,
      term.definition,
      term.diagnostic,
      ...(term.searchTerms || []),
      ...genusNames,
    ].join(" ").toLowerCase();
    return matchesCategory && haystack.includes(normalized);
  });
  const activeCategory = taxonomyCategories.find((item) => item.id === category);

  return (
    <section className="encyclopedia-index">
      <div className="encyclopedia-intro">
        <div>
          <span className="eyebrow">Pełny indeks pojęć</span>
          <h2>Od kształtu do pełnej nazwy</h2>
          <p>
            Nazwa WMO może łączyć rodzaj, gatunek, odmianę, cechę dodatkową,
            chmurę towarzyszącą i historię przemiany. Indeks pokazuje każdą
            warstwę osobno oraz rodzaje, z którymi może występować.
          </p>
        </div>
        <aside className="naming-formula">
          <span>Składnia obserwacji</span>
          <strong>rodzaj + gatunek + odmiana + cecha + pochodzenie</strong>
          <small>Nie każda kombinacja jest dopuszczalna. Zgodność wynika z tabel WMO.</small>
        </aside>
      </div>

      <div className="atlas-tools encyclopedia-tools">
        <label className="search-field">
          <MagnifyingGlass size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj: soczewka, virga, turbulencja, Cb…"
          />
        </label>
        <SourceButton ids={["wmoSummary", "wmoPrinciples", "wmoUpperAtmosphere"]} onOpen={onSources} />
      </div>

      <div className="taxonomy-category-grid">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
          <strong>49</strong>
          <span>wszystkie pojęcia</span>
        </button>
        {taxonomyCategories.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => setCategory(item.id)}
          >
            <strong>{item.count}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="index-context">
        <div>
          <span className="eyebrow">{activeCategory ? activeCategory.label : "Cała klasyfikacja"}</span>
          <p>{activeCategory?.description || "Formalne warstwy klasyfikacji WMO oraz trzy klasy chmur górnej atmosfery."}</p>
        </div>
        <strong>{formatResultCount(filtered.length)}</strong>
      </div>

      <div className="term-grid">
        {filtered.map((term) => {
          const categoryRecord = taxonomyCategories.find((item) => item.id === term.category);
          return (
            <article className="term-card" key={term.id}>
              <button className="term-card-main" onClick={() => onSelectTerm(term.id)}>
                <span className="term-kind">{categoryRecord?.label}</span>
                <strong>{term.name}</strong>
                <i>{term.polish}</i>
                <p>{term.definition}</p>
                <span className="card-link">Czytaj hasło <ArrowRight size={16} /></span>
              </button>
              {term.genera.length > 0 && (
                <div className="term-genera">
                  {term.genera.map((id) => {
                    const cloud = getCloud(id);
                    return (
                      <button key={id} onClick={() => onSelectCloud(id)} title={`Otwórz ${cloud.name}`}>
                        {cloud.code}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <BookOpen size={32} />
          <h2>Brak hasła dla tego zapytania</h2>
          <button onClick={() => { setQuery(""); setCategory("all"); }}>Pokaż cały indeks</button>
        </div>
      )}
    </section>
  );
}

function HardCases({ onCompareClouds, onSources }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="hard-cases">
      <div className="cases-intro">
        <span className="eyebrow">Niepewność jest częścią obserwacji</span>
        <h2>Spór może być informacją</h2>
        <p>Klasyfikacja ma kryteria, ale chmury płynnie się rozwijają, a pojedynczy kadr może ukrywać wysokość, skalę i historię.</p>
      </div>
      <div className="case-list">
        {hardCases.map((item, index) => (
          <article className={open === index ? "open" : ""} key={item.pair}>
            <button onClick={() => setOpen(open === index ? null : index)}>
              <span><small>Przypadek {String(index + 1).padStart(2, "0")}</small><strong>{item.pair}</strong></span>
              <CaretDown size={20} />
            </button>
            {open === index && (
              <div>
                <p className="case-question">{item.question}</p>
                <p>{item.answer}</p>
                <div className="case-actions">
                  <SourceButton ids={item.sourceIds} onOpen={onSources} compact />
                  {item.cloudIds.length === 2 && (
                    <button onClick={() => onCompareClouds(item.cloudIds)}>
                      Porównaj rodzaje <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function CloudDetail({
  cloud,
  onClose,
  onOpenComparison,
  onOpenTerm,
  onOpenObserver,
  onSources,
}) {
  const profile = getCloudProfile(cloud.id);
  const dialogRef = useDialogFocus(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <article
        ref={dialogRef}
        className="cloud-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`Monografia ${cloud.name}`}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button detail-close" onClick={onClose} aria-label="Zamknij kartę"><X size={22} /></button>
        <div className="detail-image">
          <img src={publicAsset(cloud.image.src)} alt={`${cloud.name}, ${cloud.polish}`} />
          <span className="cloud-code">{cloud.code}</span>
        </div>
        <div className="detail-body">
          <span className="eyebrow">{cloud.level} · {cloud.altitude}</span>
          <h2>{cloud.name}</h2>
          <p className="detail-polish">{cloud.polish}</p>
          <p className="detail-lead">{cloud.headline}</p>
          <p className="detail-essence">{profile.essence}</p>
          <div className="detail-analysis-actions">
            <button className="detail-observer-action" onClick={onOpenObserver}>
              <Eye size={20} />
              <span>
                <strong>Porównaj z własną obserwacją</strong>
                <small>Wróć do cech i sprawdź konkurencyjne hipotezy</small>
              </span>
              <ArrowRight size={18} />
            </button>
            <button className="detail-observer-action" onClick={onOpenComparison}>
              <Stack size={20} />
              <span>
                <strong>Porównaj z podobną chmurą</strong>
                <small>Zobacz te same kryteria obok siebie</small>
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
          <section>
            <h3>Na co patrzeć</h3>
            <ul>{cloud.observe.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul>
          </section>
          <div className="detail-notes">
            <article><span>Pogodowo</span><p>{cloud.meaning}</p></article>
            <article className="detail-trap"><span>Pułapka</span><p>{cloud.trap}</p></article>
          </div>
          <section className="encyclopedic-section">
            <span className="eyebrow">Budowa i geneza</span>
            <h3>Mikrofizyka</h3>
            <p>{profile.composition}</p>
            <h4>Najczęstsze mechanizmy powstawania</h4>
            <ul>{profile.formation.map((item) => <li key={item}><CaretRight size={15} />{item}</li>)}</ul>
          </section>
          <div className="knowledge-columns">
            <section>
              <span className="eyebrow">Interpretacja</span>
              <h3>Pogoda i ewolucja</h3>
              <ul>{profile.weather.map((item) => <li key={item}><CaretRight size={15} />{item}</li>)}</ul>
              <h4>Typowe przemiany</h4>
              <ul>{profile.evolution.map((item) => <li key={item}><CaretRight size={15} />{item}</li>)}</ul>
            </section>
            <section className="aviation-reference">
              <span className="eyebrow">Znaczenie lotnicze</span>
              <h3>Co ta nazwa mówi, a czego nie mówi</h3>
              <ul>{profile.aviation.map((item) => <li key={item}><AirplaneTilt size={16} />{item}</li>)}</ul>
              <small>Materiał edukacyjny. Nie zastępuje odprawy, prognoz, depesz, ostrzeżeń ani procedur operacyjnych.</small>
            </section>
          </div>
          <section className="taxonomy">
            <span className="eyebrow">Formalna klasyfikacja</span>
            <h3>Warstwy nazwy WMO</h3>
            <p className="section-intro">Każdy termin jest osobnym hasłem. Otwórz go, aby zobaczyć definicję i wszystkie zgodne rodzaje.</p>
            <TaxonomyRow label="Gatunki" values={cloud.species} onOpen={onOpenTerm} />
            <TaxonomyRow label="Odmiany" values={cloud.varieties} onOpen={onOpenTerm} />
            <TaxonomyRow label="Cechy dodatkowe" values={cloud.features} onOpen={onOpenTerm} />
            <TaxonomyRow label="Chmury towarzyszące" values={cloud.accessoryClouds} onOpen={onOpenTerm} />
          </section>
          <section className="naming-examples">
            <span className="eyebrow">Przykłady pełnych nazw</span>
            <div>{profile.namingExamples.map((item) => <code key={item}>{item}</code>)}</div>
          </section>
          <section className="mother-clouds">
            <span className="eyebrow">Historia chmury</span>
            <h3>Genitus i mutatus</h3>
            <div>
              <article>
                <button onClick={() => onOpenTerm("genitus")}>genitus <ArrowRight size={14} /></button>
                <p>{profile.motherClouds.genitus.join(" · ")}</p>
              </article>
              <article>
                <button onClick={() => onOpenTerm("mutatus")}>mutatus <ArrowRight size={14} /></button>
                <p>{profile.motherClouds.mutatus.join(" · ")}</p>
              </article>
            </div>
          </section>
          <section className="look-alikes">
            <span className="eyebrow">Diagnostyka różnicowa</span>
            <h3>Z czym najłatwiej pomylić</h3>
            <div>
              {profile.lookAlikes.map((item) => (
                <article key={item.name}><strong>{item.name}</strong><p>{item.rule}</p></article>
              ))}
            </div>
          </section>
          <div className="knowledge-columns compact">
            <section>
              <span className="eyebrow">Zjawiska optyczne</span>
              <ul>{profile.optics.map((item) => <li key={item}><Eye size={16} />{item}</li>)}</ul>
            </section>
            <section>
              <span className="eyebrow">Protokół terenowy</span>
              <ul>{profile.fieldChecklist.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul>
            </section>
          </div>
          <section className="photo-record">
            <span className="eyebrow">Metryka fotografii</span>
            <p>{cloud.image.note}</p>
            <p><strong>{cloud.image.author}</strong> · {cloud.image.license}</p>
            <a href={cloud.image.page} target="_blank" rel="noreferrer">Strona pliku i licencja <ArrowSquareOut size={15} /></a>
          </section>
          <SourceButton ids={[...cloud.sourceIds, "wmoPrinciples", "faaWeather", "commons"]} onOpen={onSources} />
        </div>
      </article>
    </div>
  );
}

function TaxonomyRow({ label, values, onOpen }) {
  return (
    <div className="taxonomy-row">
      <span>{label}</span>
      <p>
        {values.length
          ? values.map((value) => <button key={value} onClick={() => onOpen(value)}>{value}</button>)
          : <small>nie występują w tej warstwie klasyfikacji</small>}
      </p>
    </div>
  );
}

function TermDetail({ term, onClose, onOpenCloud, onSources }) {
  const dialogRef = useDialogFocus(onClose);
  if (!term) return null;
  const category = taxonomyCategories.find((item) => item.id === term.category);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <article
        ref={dialogRef}
        className="term-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`Hasło ${term.name}`}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button detail-close" onClick={onClose} aria-label="Zamknij hasło"><X size={22} /></button>
        <div className="term-detail-heading">
          <span className="term-kind">{category?.label}</span>
          <h2>{term.name}</h2>
          <p>{term.polish}</p>
        </div>
        <div className="term-detail-body">
          <span className="eyebrow">Definicja</span>
          <p className="term-definition">{term.definition}</p>
          <aside>
            <Eye size={24} />
            <div><strong>Cecha diagnostyczna</strong><p>{term.diagnostic}</p></div>
          </aside>
          <section>
            <h3>{term.genera.length ? "W jakich rodzajach występuje" : "Miejsce w klasyfikacji"}</h3>
            {term.genera.length ? (
              <div className="compatible-clouds">
                {term.genera.map((id) => {
                  const cloud = getCloud(id);
                  return (
                    <button key={id} onClick={() => onOpenCloud(id)}>
                      <span>{cloud.code}</span>
                      <div><strong>{cloud.name}</strong><small>{cloud.polish}</small></div>
                      <ArrowRight size={17} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p>{category?.description}</p>
            )}
          </section>
          <SourceButton ids={term.sourceIds} onOpen={onSources} />
        </div>
      </article>
    </div>
  );
}

const pressureLevels = {
  1000: { altitude: 110, use: "warstwa przyziemna nad niskim terenem" },
  925: { altitude: 760, use: "niska warstwa, inwersje i napływ" },
  850: { altitude: 1460, use: "temperatura i adwekcja w dolnej troposferze" },
  700: { altitude: 3010, use: "wilgoć i ruch pionowy poziomu średniego" },
  500: { altitude: 5570, use: "zatoki, niże górne i sterowanie przepływem" },
  300: { altitude: 9160, use: "prąd strumieniowy i górna troposfera" },
};

function LayersPage({ onSources }) {
  const [tab, setTab] = useState("lab");
  const [terrain, setTerrain] = useState(300);
  const [pressure, setPressure] = useState(850);
  const selected = pressureLevels[pressure];
  const agl = Math.max(0, selected.altitude - terrain);
  const terrainPercent = Math.min(74, (terrain / 10000) * 100);
  const levelPercent = Math.min(96, (selected.altitude / 10000) * 100);

  return (
    <main className="page layers-page">
      <header className="page-heading page-heading--inline">
        <div>
          <span className="eyebrow">Pracownia pionowej atmosfery</span>
          <h1>Warstwy bez tajemnic</h1>
          <p>Zrozum, co naprawdę zmieniasz w aplikacjach pogodowych, gdy przesuwasz wysokość albo wybierasz poziom hPa.</p>
        </div>
        <SourceButton
          ids={["faaWeather", "windyLevels", "windyClouds", "windyCloudBase"]}
          onOpen={onSources}
        />
      </header>

      <div className="segmented-control layers-tabs">
        {[["lab", "Wysokość"], ["wind", "Wiatr z nieba"], ["metar", "METAR / TAF"], ["hazards", "Zagrożenia"], ["sounding", "Sondaż i Skew-T"]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "lab" && (
        <div className="atmosphere-lab">
          <section className="atmosphere-visual">
            <div className="atmosphere-label atmosphere-label--top">górna troposfera</div>
            <div className="pressure-line" style={{ bottom: `${levelPercent}%` }}>
              <span>{pressure} hPa</span>
              <strong>≈ {selected.altitude.toLocaleString("pl-PL")} m MSL*</strong>
            </div>
            <div className="terrain-line" style={{ height: `${terrainPercent}%` }}>
              <span>teren {terrain} m MSL</span>
            </div>
            <div className="agl-bracket" style={{ bottom: `${terrainPercent}%`, height: `${Math.max(2, levelPercent - terrainPercent)}%` }}>
              <span>{agl.toLocaleString("pl-PL")} m AGL</span>
            </div>
            <div className="atmosphere-label atmosphere-label--bottom">powierzchnia</div>
          </section>
          <section className="lab-controls">
            <span className="eyebrow">Eksperyment 01</span>
            <h2>Ten sam poziom, inna odległość od ziemi</h2>
            <p>Przesuń teren. Zobacz, dlaczego powietrze na 850 hPa nad morzem i nad wysokim płaskowyżem nie jest „tak samo wysoko nad Tobą”.</p>
            <label>
              <span>Wysokość terenu <strong>{terrain} m MSL</strong></span>
              <input type="range" min="0" max="2200" step="50" value={terrain} onChange={(event) => setTerrain(Number(event.target.value))} />
            </label>
            <div className="pressure-picker" aria-label="Poziom ciśnienia">
              {Object.keys(pressureLevels).map((value) => (
                <button key={value} className={pressure === Number(value) ? "active" : ""} onClick={() => setPressure(Number(value))}>{value}</button>
              ))}
            </div>
            <div className="lab-reading">
              <Gauge size={26} />
              <div><span>Wybrana powierzchnia</span><strong>{pressure} hPa · {selected.use}</strong></div>
            </div>
            <div className="lab-reading">
              <MapPin size={26} />
              <div><span>Przybliżona odległość nad terenem</span><strong>{agl.toLocaleString("pl-PL")} m AGL</strong></div>
            </div>
            <p className="lab-footnote">* Wartości wysokości są przybliżeniem atmosfery standardowej. W realnym modelu sprawdza się pole geopotencjału; powierzchnia hPa faluje.</p>
          </section>
        </div>
      )}

      {tab === "wind" && <WindPanel onSources={onSources} />}
      {tab === "metar" && <MetarPanel onSources={onSources} />}
      {tab === "hazards" && <HazardsPanel onSources={onSources} />}
      {tab === "sounding" && <SoundingPanel onSources={onSources} />}
    </main>
  );
}

function WindPanel({ onSources }) {
  const [motion, setMotion] = useState(45);
  const [level, setLevel] = useState("niskie");
  const result = windFromCloudMotion(motion);
  const directionNames = {
    N: "północy",
    NE: "północnego wschodu",
    E: "wschodu",
    SE: "południowego wschodu",
    S: "południa",
    SW: "południowego zachodu",
    W: "zachodu",
    NW: "północnego zachodu",
  };
  const towardNames = {
    N: "północ",
    NE: "północny wschód",
    E: "wschód",
    SE: "południowy wschód",
    S: "południe",
    SW: "południowy zachód",
    W: "zachód",
    NW: "północny zachód",
  };

  return (
    <section className="wind-lab">
      <div className="wind-compass">
        <span className="compass-point compass-point--n">N</span>
        <span className="compass-point compass-point--e">E</span>
        <span className="compass-point compass-point--s">S</span>
        <span className="compass-point compass-point--w">W</span>
        <div className="motion-arrow" style={{ transform: `rotate(${result.toward}deg)` }}>
          <ArrowRight weight="bold" />
        </div>
        <div className="wind-compass-center">
          <Cloud size={34} weight="fill" />
          <small>{level}</small>
        </div>
      </div>
      <div className="wind-controls">
        <span className="eyebrow">Pracownia ruchu chmur</span>
        <h2>Najpierw „dokąd”, potem „skąd”</h2>
        <p>
          Ustaw kierunek, w którym przemieszcza się rozpoznawalny fragment
          chmury. Dla prostego dryfu wynik odwracamy o 180°. To informacja o
          przepływie na wysokości tej chmury, nie automatycznie o wietrze przy ziemi.
        </p>
        <label className="wind-range">
          <span>Chmura przemieszcza się na <strong>{towardNames[result.towardLabel]}</strong></span>
          <input
            type="range"
            min="0"
            max="315"
            step="45"
            value={motion}
            onChange={(event) => setMotion(Number(event.target.value))}
          />
        </label>
        <div className="concept-switch wind-levels">
          {["niskie", "średnie", "wysokie"].map((item) => (
            <button key={item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>
          ))}
        </div>
        <div className="wind-result">
          <Wind size={30} />
          <div>
            <span>Wniosek dla tej warstwy</span>
            <strong>wiatr z {directionNames[result.fromLabel]} ({result.fromLabel})</strong>
            <small>ruch chmury do {result.towardLabel} · kierunek wiatru podajemy „z”</small>
          </div>
        </div>
        <div className="wind-caveats">
          <article><strong>Lenticularis</strong><p>Kształt może stać w miejscu, gdy powietrze szybko przepływa przez falę.</p></article>
          <article><strong>Virga</strong><p>Nachylenie łączy znoszenie z opadaniem i parowaniem hydrometeorów.</p></article>
          <article><strong>Cumulonimbus</strong><p>Nowe komórki mogą rozwijać się w innym kierunku niż przepływa samo powietrze.</p></article>
          <article><strong>Radiatus</strong><p>Pasma pozornie zbiegają się przez perspektywę, choć są prawie równoległe.</p></article>
        </div>
        <SourceButton ids={["faaWeather", "wmoAtlas"]} onOpen={onSources} />
      </div>
    </section>
  );
}

function MetarPanel({ onSources }) {
  const [decoded, setDecoded] = useState(false);
  return (
    <section className="knowledge-panel">
      <div className="panel-heading">
        <span className="panel-icon"><AirplaneTilt size={27} /></span>
        <div><span className="eyebrow">Warsztat kodu</span><h2>EPWA 161230Z 24012KT 9999 BKN018CB OVC050 18/14 Q1012</h2></div>
      </div>
      <button className="button button--primary" onClick={() => setDecoded(!decoded)}>{decoded ? "Ukryj rozbiór" : "Rozłóż raport na części"}</button>
      {decoded && (
        <div className="decode-grid">
          <article><strong>161230Z</strong><span>16. dzień miesiąca, 12:30 UTC</span></article>
          <article><strong>24012KT</strong><span>wiatr z 240°, 12 węzłów</span></article>
          <article><strong>9999</strong><span>widzialność 10 km lub więcej</span></article>
          <article><strong>BKN018CB</strong><span>5–7 oktantów, podstawa 1800 ft AGL, Cumulonimbus</span></article>
          <article><strong>OVC050</strong><span>pełne pokrycie, podstawa 5000 ft AGL</span></article>
          <article><strong>18/14 Q1012</strong><span>temperatura 18°C, punkt rosy 14°C, QNH 1012 hPa</span></article>
        </div>
      )}
      <div className="notice"><Warning size={20} /><p>Pułap tworzy tu BKN018, nie OVC050. To przykład edukacyjny, nie aktualny raport lotniskowy.</p></div>
      <SourceButton ids={["awcCodes", "easaAircrew"]} onOpen={onSources} />
    </section>
  );
}

function HazardsPanel({ onSources }) {
  const cards = [
    { icon: CloudRain, title: "Oblodzenie", text: "Szukaj przechłodzonej wody, temperatury, zakresu pionowego i czasu ekspozycji. Sama obecność chmury nie określa intensywności." },
    { icon: Wind, title: "Turbulencja", text: "Konwekcyjna, mechaniczna, falowa lub w czystym powietrzu. Porównuj wiatr na kilku poziomach, nie tylko przy ziemi." },
    { icon: Lightning, title: "Burze", text: "CAPE jest paliwem warunkowym. Inicjacja, wilgoć, CIN i ścinanie decydują, czy i jak konwekcja się zorganizuje." },
  ];
  return (
    <section className="knowledge-panel">
      <div className="panel-heading"><span className="panel-icon"><Warning size={27} /></span><div><span className="eyebrow">Myślenie wieloparametrowe</span><h2>Nie szukaj jednej magicznej mapy</h2></div></div>
      <p className="panel-lead">Warstwa chmur, temperatura, wilgotność, ruch pionowy i wiatr odpowiadają na inne pytania. Decyzję buduje ich zgodność albo konflikt.</p>
      <div className="hazard-grid">
        {cards.map((card) => <article key={card.title}><card.icon size={28} /><h3>{card.title}</h3><p>{card.text}</p></article>)}
      </div>
      <SourceButton ids={["faaWeather", "easaAircrew"]} onOpen={onSources} />
    </section>
  );
}

function SoundingPanel({ onSources }) {
  const [parcel, setParcel] = useState("stable");
  return (
    <section className="knowledge-panel">
      <div className="panel-heading"><span className="panel-icon"><Gauge size={27} /></span><div><span className="eyebrow">Pierwsze czytanie profilu</span><h2>Skew-T to historia całej kolumny</h2></div></div>
      <p className="panel-lead">Temperatura, punkt rosy i tor unoszonej parceli pomagają znaleźć warstwy wilgotne, inwersje, poziomy kondensacji i potencjalną energię konwekcji.</p>
      <div className="concept-switch">
        <button className={parcel === "stable" ? "active" : ""} onClick={() => setParcel("stable")}>Profil stabilny</button>
        <button className={parcel === "unstable" ? "active" : ""} onClick={() => setParcel("unstable")}>Profil chwiejny</button>
      </div>
      <div className={`profile-explainer ${parcel}`}>
        <div><strong>{parcel === "stable" ? "Parcel chłodniejsza od otoczenia" : "Parcel cieplejsza od otoczenia"}</strong><span>{parcel === "stable" ? "unoszenie wygasa bez dalszego wymuszenia" : "możliwe dalsze swobodne unoszenie po osiągnięciu LFC"}</span></div>
        <p>{parcel === "stable" ? "Warstwa może sprzyjać chmurom warstwowym lub uwięzieniu wilgoci pod inwersją." : "Jeśli wilgoć i inicjacja wystarczą, rośnie potencjał głębokiej konwekcji. CAPE nadal nie jest prognozą burzy samą w sobie."}</p>
      </div>
      <SourceButton ids={["faaWeather"]} onOpen={onSources} />
    </section>
  );
}

function JournalPage({ navigate }) {
  const [entries, setEntries] = useState(loadJournal);
  const [draft] = useState(loadObservationDraft);
  const [formOpen, setFormOpen] = useState(entries.length === 0 || Boolean(draft));
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    location: "",
    cloud: draft?.cloud || "",
    confidence: draft?.confidence || "średnia",
    evidence: draft?.evidence || "",
  });

  useEffect(() => {
    if (draft) clearObservationDraft();
  }, [draft]);

  const submit = (event) => {
    event.preventDefault();
    const entry = { ...form, id: crypto.randomUUID(), createdAt: Date.now() };
    const next = [entry, ...entries];
    setEntries(next);
    saveJournal(next);
    setForm({ ...form, location: "", cloud: "", evidence: "" });
    setFormOpen(false);
  };

  const remove = (id) => {
    const next = entries.filter((entry) => entry.id !== id);
    setEntries(next);
    saveJournal(next);
  };

  return (
    <main className="page journal-page">
      <header className="page-heading page-heading--inline">
        <div>
          <span className="eyebrow">Prywatny notes terenowy</span>
          <h1>Dziennik obserwacji</h1>
          <p>Zapisuj dowody, nie tylko nazwę. Dane pozostają w pamięci tej przeglądarki i nie są wysyłane na serwer.</p>
        </div>
        <button className="button button--coral" onClick={() => setFormOpen(!formOpen)}>{formOpen ? <X size={18} /> : <Plus size={18} />} {formOpen ? "Zamknij" : "Nowa obserwacja"}</button>
      </header>

      <section className="journal-observer-invite">
        <div className="panel-icon"><Eye size={27} /></div>
        <div>
          <span className="eyebrow">Zanim zapiszesz nazwę</span>
          <h2>Uporządkuj dowody w obserwatorze</h2>
          <p>Pięć kroków pomoże oddzielić widoczne cechy od hipotezy i wskaże, co warto sprawdzić przez kolejne 10–15 minut.</p>
        </div>
        <button className="button button--primary" onClick={() => navigate("atlas/observer")}>
          Otwórz obserwator <ArrowRight size={17} />
        </button>
      </section>

      {formOpen && (
        <form className="journal-form" onSubmit={submit}>
          <div className="form-row">
            <label>Data<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
            <label>Miejsce<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="np. Gdynia, marina" /></label>
          </div>
          <div className="form-row">
            <label>Rozpoznanie
              <select required value={form.cloud} onChange={(event) => setForm({ ...form, cloud: event.target.value })}>
                <option value="">Wybierz lub zostaw jako nierozpoznane</option>
                {clouds.map((cloud) => <option key={cloud.id} value={cloud.name}>{cloud.name} · {cloud.polish}</option>)}
                <option value="Nierozpoznana">Nierozpoznana / przypadek sporny</option>
              </select>
            </label>
            <label>Pewność
              <select value={form.confidence} onChange={(event) => setForm({ ...form, confidence: event.target.value })}>
                <option>niska</option><option>średnia</option><option>wysoka</option>
              </select>
            </label>
          </div>
          <label>Dowody i zmiana w czasie
            <textarea required value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder="Kształt, skala, światło, opad, kierunek ruchu, co zmieniło się po 10 minutach…" />
          </label>
          <div className="form-footer">
            <span><Info size={17} /> Bez zdjęć i bez automatycznego rozpoznawania w tej wersji.</span>
            <button className="button button--primary" type="submit">Zapisz obserwację <Check size={18} /></button>
          </div>
        </form>
      )}

      {entries.length ? (
        <div className="journal-list">
          {entries.map((entry) => (
            <article key={entry.id}>
              <div className="entry-date"><span>{new Date(`${entry.date}T12:00:00`).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}</span><small>{new Date(`${entry.date}T12:00:00`).getFullYear()}</small></div>
              <div className="entry-body">
                <span className="entry-meta"><MapPin size={15} />{entry.location} · pewność {entry.confidence}</span>
                <h2>{entry.cloud}</h2>
                <p>{entry.evidence}</p>
              </div>
              <button className="icon-button" onClick={() => remove(entry.id)} aria-label={`Usuń obserwację ${entry.cloud}`}><Trash size={19} /></button>
            </article>
          ))}
        </div>
      ) : !formOpen && (
        <div className="empty-state"><Notebook size={34} /><h2>Twój pierwszy zapis zacznie atlas osobistych doświadczeń</h2><button onClick={() => setFormOpen(true)}>Dodaj obserwację</button></div>
      )}
    </main>
  );
}

function SourcesPage({ onSources }) {
  return (
    <main className="page">
      <header className="page-heading">
        <span className="eyebrow">Jawny warsztat</span>
        <h1>Biblioteka źródeł</h1>
        <p>Pełna lista materiałów wykorzystanych w encyklopedii. Fotografie mają dodatkowo osobne metryki na kartach atlasu.</p>
      </header>
      <div className="source-library">
        {sourceList.map((source) => (
          <button key={source.id} onClick={() => onSources([source.id])}>
            <span className="source-kind">{source.kind}</span>
            <strong>{source.title}</strong>
            <span>{source.organization}</span>
            <ArrowRight size={18} />
          </button>
        ))}
      </div>
    </main>
  );
}

function RecognitionTest({
  stats,
  initialCloudId,
  onUpdateStats,
  onClose,
  onCompare,
  onSources,
}) {
  const cloudIds = clouds.map((cloud) => cloud.id);
  const [question, setQuestion] = useState(() => {
    const id = cloudIds.includes(initialCloudId)
      ? initialCloudId
      : selectRecognitionCloud(cloudIds, stats);
    return createRecognitionQuestion(id);
  });
  const [answer, setAnswer] = useState(null);
  const cloud = getCloud(question.cloudId);
  const chosenCloud = answer ? getCloud(answer) : null;
  const summary = recognitionSummary(stats);
  const dialogRef = useDialogFocus(onClose);
  const discriminator = answer && answer !== question.cloudId
    ? pairDiscriminator(answer, question.cloudId)
    : null;

  const choose = (id) => {
    if (answer) return;
    const correct = id === question.cloudId;
    setAnswer(id);
    onUpdateStats(updateRecognitionStats(stats, question.cloudId, correct));
  };

  const next = () => {
    const id = selectRecognitionCloud(cloudIds, stats, question.cloudId);
    setQuestion(createRecognitionQuestion(id));
    setAnswer(null);
  };

  return (
    <div className="modal-backdrop modal-backdrop--center" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="recognition-test"
        role="dialog"
        aria-modal="true"
        aria-label="Test rozpoznawania chmur"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="recognition-header">
          <div>
            <span className="eyebrow">Test wyrywkowy · cztery prawdopodobne odpowiedzi</span>
            <h2>Co widzisz?</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Zamknij test"><X size={22} /></button>
        </div>
        <div className="recognition-photo">
          <img src={publicAsset(cloud.image.src)} alt="Chmura do rozpoznania" />
          <span>{cloud.level}</span>
        </div>
        <div className="recognition-options">
          {question.choices.map((id) => {
            const option = getCloud(id);
            let state = "";
            if (answer && id === question.cloudId) state = "correct";
            if (answer === id && id !== question.cloudId) state = "wrong";
            return (
              <button key={id} className={state} onClick={() => choose(id)}>
                <span>{option.code}</span>
                <div><strong>{option.name}</strong><small>{option.polish}</small></div>
                {state === "correct" && <Check size={20} />}
                {state === "wrong" && <X size={20} />}
              </button>
            );
          })}
        </div>
        {answer && (
          <div
            className={`recognition-feedback ${answer === question.cloudId ? "is-correct" : "is-wrong"}`}
            aria-live="polite"
          >
            <span className="eyebrow">{answer === question.cloudId ? "Trafnie" : `Poprawna odpowiedź: ${cloud.name}`}</span>
            <h3>{cloud.headline}</h3>
            <ul>{cloud.observe.map((item) => <li key={item}><Eye size={16} />{item}</li>)}</ul>
            <p><strong>Pułapka:</strong> {cloud.trap}</p>
            {discriminator && (
              <aside className="recognition-discriminator">
                <span>Dlaczego nie {chosenCloud.name}?</span>
                <strong>{chosenCloud.name} ↔ {cloud.name}</strong>
                <p>{discriminator}</p>
              </aside>
            )}
            <div className="recognition-feedback-actions">
              <SourceButton ids={cloud.sourceIds} onOpen={onSources} compact />
              {discriminator && (
                <button
                  className="button button--secondary"
                  onClick={() => onCompare([answer, question.cloudId])}
                >
                  Porównaj tę parę
                </button>
              )}
              <button className="button button--primary" onClick={next}>Następna chmura <ArrowRight size={17} /></button>
            </div>
          </div>
        )}
        <footer className="recognition-method">
          <div>
            <strong>{summary.correct + summary.wrong}</strong>
            <span>odpowiedzi lokalnie</span>
          </div>
          <p>
            Dystraktory pochodzą z grup rzeczywiście mylonych wizualnie.
            Algorytm częściej wraca do rodzajów, przy których popełniasz błędy.
            Wynik zostaje wyłącznie w tej przeglądarce.
          </p>
        </footer>
      </section>
    </div>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="app-footer">
      <div className="brand brand--footer"><span className="brand-mark"><Cloud size={20} weight="fill" /></span><span>CLOUD RECOGNITION</span></div>
      <p>Polski, bezpłatny atlas i pracownia obserwacji chmur. Bez kont, reklam, śledzenia i dźwięku.</p>
      <div>
        <button onClick={() => navigate("sources")}>Źródła</button>
        <a href="https://github.com/jakiesluchawki/cloud-recognition" target="_blank" rel="noreferrer">GitHub <ArrowSquareOut size={14} /></a>
      </div>
    </footer>
  );
}

export function App() {
  const [route, navigate] = useRoute();
  const [profile, setProfile] = useState(loadProfile);
  const [completed, setCompleted] = useState(loadProgress);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [sourceIds, setSourceIds] = useState(null);
  const [entryModule, setEntryModule] = useState(null);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [recognitionTarget, setRecognitionTarget] = useState(null);
  const [recognitionStats, setRecognitionStats] = useState(loadRecognitionStats);

  const [routeName, routeDetail, routePayload] = route.split("/");
  const validRoute = useMemo(
    () => [...navItems.map((item) => item.id), "sources"].includes(routeName) ? routeName : "home",
    [routeName],
  );
  const routeComparisonIds = routeDetail === "compare"
    ? (routePayload || "")
      .split(",")
      .filter((id, index, values) => getCloud(id) && values.indexOf(id) === index)
      .slice(0, 3)
    : [];

  const chooseProfile = (result) => {
    setProfile(result);
    saveProfile(result);
    setPlacementOpen(false);
    setEntryModule(result.moduleId);
    navigate(`learn/${result.moduleId}`);
  };

  const openRecommended = () => {
    const moduleId = profile?.moduleId || "obserwacja";
    setEntryModule(moduleId);
    navigate(`learn/${moduleId}`);
  };

  const toggleCompleted = (id) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    saveProgress(next);
  };

  const updateRecognition = (stats) => {
    setRecognitionStats(stats);
    saveRecognitionStats(stats);
  };

  const openRecognition = (cloudId = null) => {
    setRecognitionTarget(cloudId);
    setRecognitionOpen(true);
  };

  const closeRecognition = () => {
    setRecognitionOpen(false);
    setRecognitionTarget(null);
  };

  const saveFieldObservation = (draft) => {
    const cloud = getCloud(draft.cloudId);
    saveObservationDraft({
      cloud: cloud?.name || "Nierozpoznana",
      confidence: draft.confidence,
      evidence: draft.evidence,
    });
    navigate("journal");
  };

  const pageProps = { navigate, onSources: setSourceIds };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Przejdź do treści</a>
      <AppHeader route={validRoute} navigate={navigate} />
      <div id="main-content">
        {validRoute === "home" && (
          <HomePage
            {...pageProps}
            profile={profile}
            completed={completed}
            onPlacement={() => setPlacementOpen(true)}
            onBeginner={() => chooseProfile(calculatePlacement([]))}
            onOpenRecommended={openRecommended}
          />
        )}
        {validRoute === "learn" && (
          <LearnPage
            completed={completed}
            onToggleCompleted={toggleCompleted}
            onSources={setSourceIds}
            initialModule={
              entryModule
              || learningModules.find((module) => module.id === routeDetail)?.id
              || null
            }
            onConsumeInitial={() => setEntryModule(null)}
            onBack={() => navigate("learn")}
            onSelectModule={(id) => navigate(`learn/${id}`)}
            recognitionStats={recognitionStats}
            onOpenRecognition={openRecognition}
          />
        )}
        {validRoute === "atlas" && (
          <AtlasPage
            onSources={setSourceIds}
            onSaveObservation={saveFieldObservation}
            initialComparisonIds={routeComparisonIds}
            initialTab={
              routeDetail === "observer"
                ? "observer"
                : routeDetail === "compare"
                  ? "compare"
                  : "atlas"
            }
          />
        )}
        {validRoute === "layers" && <LayersPage onSources={setSourceIds} />}
        {validRoute === "journal" && <JournalPage navigate={navigate} />}
        {validRoute === "sources" && <SourcesPage onSources={setSourceIds} />}
      </div>
      <Footer navigate={navigate} />
      <BottomNav
        route={validRoute}
        navigate={navigate}
        onTest={() => openRecognition()}
        testOpen={recognitionOpen}
      />
      <button className="quick-test-button" onClick={() => openRecognition()}>
        <Eye size={20} weight="bold" />
        <span>Sprawdź się</span>
      </button>
      {placementOpen && <PlacementModal onClose={() => setPlacementOpen(false)} onFinish={chooseProfile} />}
      {sourceIds && <SourceDrawer ids={sourceIds} onClose={() => setSourceIds(null)} />}
      {recognitionOpen && (
        <RecognitionTest
          stats={recognitionStats}
          initialCloudId={recognitionTarget}
          onUpdateStats={updateRecognition}
          onClose={closeRecognition}
          onCompare={(ids) => {
            closeRecognition();
            navigate(`atlas/compare/${ids.join(",")}`);
          }}
          onSources={(ids) => {
            closeRecognition();
            setSourceIds(ids);
          }}
        />
      )}
    </div>
  );
}
