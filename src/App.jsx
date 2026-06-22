import { useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneTilt,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  Camera as CameraIcon,
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
  ImageSquare,
  Info,
  Lightning,
  List,
  MagnifyingGlass,
  MapPin,
  Notebook,
  Plus,
  ShieldCheck,
  Stack,
  Trash,
  Warning,
  Wind,
  X,
} from "@phosphor-icons/react";
import { cloudLevels, clouds, getCloud, getCloudImage } from "./data/clouds.js";
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
import {
  aviationBriefingSets,
  metarDecodeSections,
  metarSectionByGroupLabel,
  metarStructurePhases,
  metarTrainingScenarios,
  tafTrainingScenarios,
} from "./data/metar-training.js";
import {
  soundingGlossary,
  soundingPressureGrid,
  soundingScenarios,
  soundingTemperatureGrid,
} from "./data/soundings.js";
import { fieldPrinciples, fieldQuestions } from "./data/field-guide.js";
import { getSources, sourceList } from "./data/sources.js";
import {
  cloudBands,
  getWeatherLayer,
  pressureLevels,
  weatherLayers,
} from "./data/weather-layers.js";
import {
  createObservationDraft,
  evidenceCoverage,
  nextDiscriminatingObservation,
  observationVerdict,
  pairDiscriminator,
  scoreFieldObservation,
} from "./lib/field-guide.js";
import {
  emptyNomenclatureSelection,
  evaluateNomenclature,
  nomenclatureOptions,
  nomenclaturePresets,
} from "./lib/nomenclature.js";
import { calculatePlacement } from "./lib/placement.js";
import { soundingPath, soundingPoint, soundingSummary } from "./lib/sounding.js";
import {
  clearAviationReview,
  clearObservationDraft,
  loadAviationReview,
  loadJournal,
  loadLessonPosition,
  loadObservationDraft,
  loadOnboarding,
  loadProfile,
  loadProgress,
  loadRecognitionStats,
  saveJournal,
  saveAviationReview,
  saveLessonPosition,
  saveObservationDraft,
  saveOnboarding,
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
import {
  aviationReviewPriority,
  aviationReviewQueue,
  aviationReviewSummary,
  chooseDifferentScenario,
  createAviationQuestionBank,
  evaluateTrainingAnswer,
  updateAviationReview,
} from "./lib/metar-training.js";
import { searchCloudAtlas, searchTaxonomyTerms } from "./lib/cloud-search.js";
import {
  pressureSurfaceContext,
  weatherLayerReading,
} from "./lib/weather-layers.js";
import { windFromCloudMotion } from "./lib/wind.js";
import {
  captureCloudPhoto,
  isPhotoCaptureCancellation,
  isPhotoRecognitionSupported,
  photoCaptureErrorMessage,
  recognizeCloudPhoto,
} from "./lib/native-cloud-recognizer.js";

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
  const getHash = () => window.location.hash.replace("#/", "") || import.meta.env.VITE_QA_ROUTE || "home";
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
      <button className="brand" onClick={() => navigate("home")} aria-label="Chmurnik, strona główna">
        <span className="brand-wordmark-mark" aria-hidden="true" />
        <span className="sr-only">Chmurnik</span>
        <span className="brand-descriptor"><i aria-hidden="true" /> atlas chmur i atmosfery</span>
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

function BottomNav({ route, navigate }) {
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

function CloudName({ children }) {
  return <span className="scientific-name" lang="la">{children}</span>;
}

function HomePage({
  navigate,
  profile,
  onPlacement,
  completed,
  onSources,
  onOpenRecommended,
  onOpenOnboarding,
  onOpenRecognition,
  onOpenPhotoRecognition,
  showPhotoRecognition,
}) {
  const recommended = learningModules.find((module) => module.id === profile?.moduleId) || learningModules[0];
  const progress = Math.round((completed.length / learningModules.length) * 100);

  return (
    <>
      <section className="hero compact-home">
        <div className="hero-content">
          <span className="hero-kicker">Interaktywny atlas nieba</span>
          <h1>Naucz się<br />czytać niebo</h1>
          <p>
            Od pierwszego spojrzenia po lotniczą analizę warstw. Bez zgadywania i bez ukrywania niepewności.
          </p>
          <div className="hero-actions">
            <button className="button button--coral" onClick={onPlacement}>
              Zacznij <ArrowRight size={19} weight="bold" />
            </button>
          </div>
        </div>
        <figure className="hero-visual">
          <picture>
            <source
              type="image/avif"
              srcSet={`${publicAsset("assets/atmosphere-still-life-960.avif")} 960w, ${publicAsset("assets/atmosphere-still-life-1536.avif")} 1536w`}
              sizes="(max-width: 720px) calc(100vw - 30px), 72vw"
            />
            <source
              type="image/webp"
              srcSet={`${publicAsset("assets/atmosphere-still-life-960.webp")} 960w, ${publicAsset("assets/atmosphere-still-life-1536.webp")} 1536w`}
              sizes="(max-width: 720px) calc(100vw - 30px), 72vw"
            />
            <img
              src={publicAsset("assets/atmosphere-still-life.png")}
              alt=""
              className="hero-image"
              fetchPriority="high"
              decoding="async"
              width="1536"
              height="1024"
            />
          </picture>
        </figure>
        <nav className="home-primary-actions" aria-label="Najważniejsze miejsca">
          <button onClick={() => navigate("atlas")}>
            <Cloud size={22} />
            <span><strong>Atlas</strong>Prawdziwe zdjęcia</span>
            <ArrowRight size={17} />
          </button>
          <button onClick={() => navigate("layers")}>
            <Stack size={22} />
            <span><strong>Warstwy</strong>Zrozum atmosferę</span>
            <ArrowRight size={17} />
          </button>
          <button onClick={() => navigate("learn")}>
            <BookOpen size={22} />
            <span><strong>Nauka</strong>Krótkie lekcje</span>
            <ArrowRight size={17} />
          </button>
        </nav>
        <div className={`home-guidance-row ${showPhotoRecognition ? "has-photo-recognition" : ""}`}>
          <button className="home-tour-card" onClick={onOpenOnboarding}>
            <picture aria-hidden="true">
              <source type="image/avif" srcSet={publicAsset("assets/observer-guide-still-life-720.avif")} />
              <source type="image/webp" srcSet={publicAsset("assets/observer-guide-still-life-720.webp")} />
              <img src={publicAsset("assets/observer-guide-still-life.png")} alt="" />
            </picture>
            <span><small>Pierwszy raz?</small><strong>Oprowadzenie</strong></span>
            <ArrowRight size={17} />
          </button>
          <button className="home-test-card" onClick={() => onOpenRecognition()}>
            <Eye size={21} />
            <span><small>Na prawdziwych zdjęciach</small><strong>Sprawdź się</strong></span>
          </button>
          {showPhotoRecognition && (
            <button className="home-photo-card" onClick={onOpenPhotoRecognition}>
              <CameraIcon size={21} />
              <span><small>Na tym iPhonie</small><strong>Czytaj zdjęcie</strong></span>
            </button>
          )}
        </div>
      </section>

      <section className="paper-section home-intro home-intro--compact">
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

      </section>

      <section className="home-visual-folio" aria-labelledby="home-folio-title">
        <header>
          <span className="eyebrow">Pracownie</span>
          <h2 id="home-folio-title">Atmosferę poznajesz przez obserwację, porównanie i działanie.</h2>
        </header>
        <div>
          <button onClick={() => navigate("learn/procesy")}>
            <picture>
              <source
                type="image/avif"
                srcSet={`${publicAsset("assets/convection-still-life-720.avif")} 720w, ${publicAsset("assets/convection-still-life-1280.avif")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <source
                type="image/webp"
                srcSet={`${publicAsset("assets/convection-still-life-720.webp")} 720w, ${publicAsset("assets/convection-still-life-1280.webp")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <img
                src={publicAsset("assets/convection-still-life.png")}
                alt=""
                loading="lazy"
                decoding="async"
                width="1586"
                height="992"
              />
            </picture>
            <span>Procesy</span>
            <strong>Jak rośnie konwekcja</strong>
          </button>
          <button onClick={() => navigate("layers")}>
            <picture>
              <source
                type="image/avif"
                srcSet={`${publicAsset("assets/wind-profile-still-life-720.avif")} 720w, ${publicAsset("assets/wind-profile-still-life-1280.avif")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <source
                type="image/webp"
                srcSet={`${publicAsset("assets/wind-profile-still-life-720.webp")} 720w, ${publicAsset("assets/wind-profile-still-life-1280.webp")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <img
                src={publicAsset("assets/wind-profile-still-life.png")}
                alt=""
                loading="lazy"
                decoding="async"
                width="1586"
                height="992"
              />
            </picture>
            <span>Warstwy</span>
            <strong>Wiatr na różnych wysokościach</strong>
          </button>
          <button onClick={() => navigate("atlas")}>
            <picture>
              <source
                type="image/avif"
                srcSet={`${publicAsset("assets/upper-atmosphere/noctilucent-clouds-laboe-720.avif")} 720w, ${publicAsset("assets/upper-atmosphere/noctilucent-clouds-laboe-1280.avif")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <source
                type="image/webp"
                srcSet={`${publicAsset("assets/upper-atmosphere/noctilucent-clouds-laboe-720.webp")} 720w, ${publicAsset("assets/upper-atmosphere/noctilucent-clouds-laboe-1280.webp")} 1280w`}
                sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 900px) calc((100vw - 58px) / 2), calc((100vw - 76px) / 3)"
              />
              <img
                src={publicAsset("assets/upper-atmosphere/noctilucent-clouds-laboe.jpg")}
                alt="Obłoki srebrzyste nad wodą w Laboe"
                loading="lazy"
                decoding="async"
                width="1920"
                height="1280"
              />
            </picture>
            <span>Atlas</span>
            <strong>Prawdziwe niebo jako dowód</strong>
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

const onboardingSteps = [
  {
    eyebrow: "01 · Najpierw patrz",
    title: "Atlas pokazuje prawdziwe niebo",
    body: "Zdjęcia chmur są tu dowodem. Porównuj kształt, skalę, światło i opad, zanim wybierzesz nazwę.",
    image: "assets/observer-guide-still-life-720.webp",
    alt: "Filcowy obiekt obserwatora w studyjnej ramie",
  },
  {
    eyebrow: "02 · Potem zrozum",
    title: "Warstwy tłumaczą niewidoczne",
    body: "Filcowe modele prowadzą przez wysokość, ciśnienie i wiatr. Są objaśnieniem, nigdy substytutem zdjęcia chmury.",
    image: "assets/wind-profile-still-life-720.webp",
    alt: "Studyjny model przepływu powietrza na kilku wysokościach",
  },
  {
    eyebrow: "03 · Ćwicz krótko",
    title: "Lekcje zaczynają się od działania",
    body: "Możesz wejść od razu w potrzebny temat. Postęp zostaje wyłącznie na tym urządzeniu.",
    image: "assets/convection-still-life-720.webp",
    alt: "Studyjny model rozwoju konwekcji",
  },
  {
    eyebrow: "04 · Wracaj do dowodów",
    title: "Obserwacje mają własną pamięć",
    body: "Dziennik zachowuje opis, pewność i cechy widoczne w kadrze. Bez konta, reklam i śledzenia.",
    image: "assets/atmosphere-still-life-960.webp",
    alt: "Studyjny model warstw atmosfery",
  },
];

function OnboardingModal({ onClose, onFinish }) {
  const [step, setStep] = useState(0);
  const dialogRef = useDialogFocus(onClose);
  const item = onboardingSteps[step];
  const isLast = step === onboardingSteps.length - 1;

  return (
    <div className="modal-backdrop modal-backdrop--center" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button onboarding-close" onClick={onClose} aria-label="Zamknij oprowadzenie">
          <X size={21} />
        </button>
        <figure>
          <img src={publicAsset(item.image)} alt={item.alt} />
        </figure>
        <div className="onboarding-copy">
          <span className="eyebrow">{item.eyebrow}</span>
          <h2 id="onboarding-title">{item.title}</h2>
          <p>{item.body}</p>
          <div className="onboarding-progress" aria-label={`Krok ${step + 1} z ${onboardingSteps.length}`}>
            {onboardingSteps.map((entry, index) => (
              <span key={entry.title} className={index <= step ? "active" : ""} />
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="text-button" onClick={onFinish}>Pomiń</button>
            {step > 0 && <button className="button button--secondary" onClick={() => setStep(step - 1)}>Wstecz</button>}
            <button
              className="button button--coral"
              onClick={() => isLast ? onFinish() : setStep(step + 1)}
            >
              {isLast ? "Zaczynam" : "Dalej"} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
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
  const [orientationOpen, setOrientationOpen] = useState(
    () => !window.matchMedia("(max-width: 640px)").matches,
  );
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
        <details
          className="lesson-orientation-disclosure"
          open={orientationOpen}
          onToggle={(event) => setOrientationOpen(event.currentTarget.open)}
        >
          <summary>
            Plan i cele lekcji
            <CaretDown size={17} />
          </summary>
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
        </details>
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
      <header className="page-heading workbench-heading">
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
  const hasAtlasQuery = Boolean(query.trim());
  const heading = {
    atlas: ["Międzynarodowa klasyfikacja WMO", "Encyklopedia chmur", "Dziesięć rodzajów prowadzi dalej do cech, fizyki, pogody i formalnych nazw."],
    observer: ["Mobilny notes obserwatora", "Najpierw dowody", "Pięć krótkich pytań zamienia spojrzenie w hipotezę, którą możesz sprawdzić w atlasie."],
    compare: ["Diagnostyka różnicowa", "Porównaj dowody", "Zestaw podobne chmury obok siebie i zobacz kryteria, które naprawdę je rozdzielają."],
    encyclopedia: ["Formalne warstwy nazwy", "Indeks WMO", "Gatunki, odmiany, cechy dodatkowe oraz pochodzenie w jednym przeszukiwalnym indeksie."],
    cases: ["Najczęstsze pomyłki", "Trudne przypadki", "Ćwicz granice klasyfikacji na zestawach, w których pierwszy odruch często zawodzi."],
  }[tab];

  useEffect(() => {
    setTab(initialTab);
    if (initialComparisonIds?.length >= 2) setComparisonIds(initialComparisonIds);
  }, [initialComparisonIds?.join(","), initialTab]);

  const filtered = searchCloudAtlas(clouds, {
    query,
    level,
    getProfile: getCloudProfile,
    taxonomyTerms,
  });
  const matchedTerms = searchTaxonomyTerms(taxonomyTerms, {
    query,
    cloudList: clouds,
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
      <header className="page-heading page-heading--inline workbench-heading">
        <div>
          <span className="eyebrow">{heading[0]}</span>
          <h1>{heading[1]}</h1>
          <p>{heading[2]}</p>
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
          <section className="atlas-search" role="search" aria-labelledby="atlas-search-title">
            <div className="atlas-search__intro">
              <span className="eyebrow">Wyszukiwarka chmur</span>
              <h2 id="atlas-search-title">Szukaj po nazwie albo po tym, co widzisz</h2>
              <p>
                Możesz wpisać rodzaj, kod WMO, gatunek, cechę lub obserwację,
                na przykład „kowadło”, „bez halo” albo „drobne fale”.
              </p>
            </div>
            <label className="atlas-search__field">
              <MagnifyingGlass size={23} />
              <span className="sr-only">Szukaj w atlasie chmur</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  if (nextQuery.trim()) setLevel("wszystkie");
                }}
                placeholder="np. Cumulonimbus, Ci, kowadło, bez halo"
              />
              {hasAtlasQuery && (
                <button type="button" onClick={() => setQuery("")} aria-label="Wyczyść wyszukiwanie">
                  <X size={18} />
                </button>
              )}
            </label>
            <div className="atlas-search__status">
              <span aria-live="polite">
                {hasAtlasQuery
                  ? `${formatPolishCount(filtered.length, "rodzaj", "rodzaje", "rodzajów")} · ${formatPolishCount(matchedTerms.length, "hasło WMO", "hasła WMO", "haseł WMO")}`
                  : "Przeszukujesz 10 rodzajów i 49 formalnych haseł WMO"}
              </span>
              {hasAtlasQuery
                ? <small>Cała klasyfikacja · filtry poziomu są pomijane</small>
                : level !== "wszystkie" && <small>Filtr wysokości: {level}</small>}
            </div>
          </section>
          {hasAtlasQuery ? (
            <AtlasSearchResults
              query={query.trim()}
              cloudResults={filtered}
              termResults={matchedTerms}
              onSelectCloud={setSelected}
              onSelectTerm={setSelectedTerm}
              onClear={() => setQuery("")}
            />
          ) : (
            <>
              <div className="encyclopedia-stats" aria-label="Zakres encyklopedii">
                <article><strong>10</strong><span>rodzajów troposferycznych</span></article>
                <article><strong>15</strong><span>gatunków WMO</span></article>
                <article><strong>9</strong><span>odmian</span></article>
                <article><strong>25</strong><span>cech, chmur towarzyszących i klas specjalnych</span></article>
              </div>
              <div className="atlas-tools">
                <span className="atlas-tools__label">Filtruj według typowego poziomu</span>
                <div className="filter-scroll" aria-label="Filtruj według typowego poziomu">
                  {cloudLevels.map((item) => (
                    <button
                      key={item}
                      className={level === item ? "active" : ""}
                      onClick={() => setLevel(item)}
                      aria-pressed={level === item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <CloudCardGrid items={filtered} onSelect={setSelected} />
            </>
          )}
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

function CloudCardGrid({ items, onSelect }) {
  return (
    <div className="cloud-grid">
      {items.map((cloud) => (
        <button className="cloud-card" key={cloud.id} onClick={() => onSelect(cloud.id)}>
          <span className="cloud-image-wrap">
            <img
              src={publicAsset(getCloudImage(cloud).src)}
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
            <span className="cloud-card-count">
              {cloud.species.length + cloud.varieties.length + cloud.features.length + cloud.accessoryClouds.length} powiązanych terminów
            </span>
            <span className="card-link">Otwórz monografię <ArrowRight size={16} /></span>
          </span>
        </button>
      ))}
    </div>
  );
}

function AtlasSearchResults({
  query,
  cloudResults,
  termResults,
  onSelectCloud,
  onSelectTerm,
  onClear,
}) {
  const hasResults = cloudResults.length > 0 || termResults.length > 0;

  return (
    <section className="atlas-results" aria-labelledby="atlas-results-title">
      <header className="atlas-results__heading">
        <div>
          <span className="eyebrow">Wyniki w całej klasyfikacji</span>
          <h2 id="atlas-results-title">„{query}”</h2>
          <p>
            Rodzaj jest podstawową nazwą chmury. Gatunki, odmiany i cechy
            doprecyzowują jej wygląd, budowę albo pochodzenie.
          </p>
        </div>
        <button className="text-button" onClick={onClear}>Wyczyść wyszukiwanie</button>
      </header>

      {termResults.length > 0 && (
        <section className="atlas-result-group" aria-labelledby="term-results-title">
          <header>
            <span>01</span>
            <div>
              <h3 id="term-results-title">Hasła WMO</h3>
              <p>
                To formalne elementy klasyfikacji. Otwórz hasło, aby zobaczyć
                cechę diagnostyczną i wszystkie zgodne rodzaje.
              </p>
            </div>
          </header>
          <div className="atlas-term-results">
            {termResults.map((term) => {
              const category = taxonomyCategories.find((item) => item.id === term.category);
              return (
                <button
                  className="atlas-term-result"
                  key={term.id}
                  onClick={() => onSelectTerm(term.id)}
                  aria-label={`Otwórz hasło ${term.name}, ${category?.singular || "klasyfikacja WMO"}`}
                >
                  <span className="term-kind">{category?.singular}</span>
                  <span className="atlas-term-result__name">
                    <strong>{term.name}</strong>
                    <i>{term.polish}</i>
                  </span>
                  <p>{term.definition}</p>
                  <span className="atlas-term-result__footer">
                    <small>{taxonomyTermContext(term)}</small>
                    <span className="card-link">Czytaj hasło <ArrowRight size={16} /></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {cloudResults.length > 0 && (
        <section className="atlas-result-group" aria-labelledby="cloud-results-title">
          <header>
            <span>{termResults.length ? "02" : "01"}</span>
            <div>
              <h3 id="cloud-results-title">Rodzaje chmur</h3>
              <p>
                Monografie rodzajów, których nazwa, kod, wygląd albo
                powiązane hasła odpowiadają zapytaniu.
              </p>
            </div>
          </header>
          <CloudCardGrid items={cloudResults} onSelect={onSelectCloud} />
        </section>
      )}

      {!hasResults && (
        <div className="empty-state atlas-results__empty">
          <BookOpen size={32} />
          <h2>Nie znaleźliśmy tego w klasyfikacji</h2>
          <p>Spróbuj nazwy łacińskiej, polskiej cechy albo opisu wyglądu.</p>
          <button onClick={onClear}>Pokaż cały atlas</button>
        </div>
      )}
    </section>
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
                  <img src={publicAsset(getCloudImage(cloud).src)} alt={`${cloud.name}, ${cloud.polish}`} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="hypothesis-body">
                  <span className="eyebrow">{index === 0 ? verdict.label : "Hipoteza alternatywna"}</span>
                  <h3><CloudName>{cloud.name}</CloudName></h3>
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
            <h3>
              Jak rozdzielić <CloudName>{first.name}</CloudName> i <CloudName>{second.name}</CloudName>
            </h3>
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
                  <img src={publicAsset(getCloudImage(cloud).src)} alt={`${cloud.name}, ${cloud.polish}`} />
                </div>
                <h4><CloudName>{cloud.name}</CloudName></h4>
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
                src={publicAsset(getCloudImage(cloud).src)}
                alt={`${cloud.name}, ${cloud.polish}`}
                loading="lazy"
                decoding="async"
              />
              <span className="cloud-code">{cloud.code}</span>
            </div>
            <span className="eyebrow">{cloud.level}</span>
            <h3><CloudName>{cloud.name}</CloudName></h3>
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
                  <strong><span>{record.cloud.code}</span><CloudName>{record.cloud.name}</CloudName></strong>
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

function formatPolishCount(count, singular, few, many) {
  if (count === 1) return `1 ${singular}`;
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

function taxonomyTermContext(term) {
  if (term.genera.length) {
    return `Zgodne rodzaje: ${term.genera.map((id) => getCloud(id)?.code).filter(Boolean).join(", ")}`;
  }
  if (term.category === "special") {
    return "Klasa specjalna: nazwa opisuje źródło powstania";
  }
  if (term.category === "upper") {
    return "Klasa górnej atmosfery poza troposferycznymi rodzajami WMO";
  }
  return "Zgodność pełnej nazwy wynika z reguł WMO";
}

function NomenclatureChoiceGroup({
  number,
  label,
  description,
  options,
  selected,
  onToggle,
  emptyText,
}) {
  return (
    <fieldset className="nomenclature-step">
      <legend>
        <span>{number}</span>
        <div>
          <strong>{label}</strong>
          <small>{description}</small>
        </div>
      </legend>
      {options.length ? (
        <div className="nomenclature-choices">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                className={isSelected ? "selected" : ""}
                onClick={() => onToggle(option.id)}
                aria-pressed={isSelected}
              >
                <strong>{option.name}</strong>
                <small>{option.polish}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="nomenclature-empty">{emptyText}</p>
      )}
    </fieldset>
  );
}

function NomenclatureWorkshop({ onSources }) {
  const [selection, setSelection] = useState(emptyNomenclatureSelection);
  const options = nomenclatureOptions(selection.cloudId);
  const result = evaluateNomenclature(selection);
  const toggleMany = (field, id) => {
    setSelection((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((item) => item !== id)
        : [...current[field], id],
    }));
  };
  const chooseCloud = (cloudId) => {
    setSelection({
      ...emptyNomenclatureSelection,
      cloudId,
    });
  };

  return (
    <section className="nomenclature-workshop" aria-labelledby="nomenclature-title">
      <header className="nomenclature-workshop__header">
        <div>
          <span className="eyebrow">Pracownia nazewnictwa WMO</span>
          <h3 id="nomenclature-title">Zbuduj nazwę. Sprawdź jej granice.</h3>
          <p>
            Wybierz to, co rzeczywiście widzisz, a pochodzenie dodaj tylko
            wtedy, gdy znasz historię rozwoju. Walidator pokazuje zgodność
            formalną osobno od siły dowodu.
          </p>
        </div>
        <SourceButton ids={result.sourceIds} onOpen={onSources} />
      </header>

      <div className="nomenclature-presets" aria-label="Przykładowe przypadki">
        <span>Przypadki do rozebrania</span>
        <div>
          {nomenclaturePresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => setSelection(preset.selection)}
            >
              <strong>{preset.label}</strong>
              <small>{preset.hint}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="nomenclature-desk">
        <div className="nomenclature-builder">
          <fieldset className="nomenclature-step nomenclature-step--genus">
            <legend>
              <span>1</span>
              <div>
                <strong>Rodzaj</strong>
                <small>Każda obserwowana chmura należy do jednego rodzaju.</small>
              </div>
            </legend>
            <div className="nomenclature-genera">
              {clouds.map((cloud) => (
                <button
                  type="button"
                  key={cloud.id}
                  className={selection.cloudId === cloud.id ? "selected" : ""}
                  onClick={() => chooseCloud(cloud.id)}
                  aria-pressed={selection.cloudId === cloud.id}
                >
                  <strong>{cloud.code}</strong>
                  <small>{cloud.name}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <NomenclatureChoiceGroup
            number="2"
            label="Gatunek"
            description="Opisuje budowę. W pełnej nazwie wybierasz najwyżej jeden."
            options={options.species}
            selected={selection.speciesId ? [selection.speciesId] : []}
            onToggle={(id) => setSelection((current) => ({
              ...current,
              speciesId: current.speciesId === id ? null : id,
            }))}
            emptyText="Ten rodzaj nie ma formalnie wyróżnianych gatunków."
          />

          <NomenclatureChoiceGroup
            number="3"
            label="Odmiany"
            description="Możesz wybrać kilka. Sprzeczności pozostają widoczne, żeby dało się je przeanalizować."
            options={options.varieties}
            selected={selection.varietyIds}
            onToggle={(id) => toggleMany("varietyIds", id)}
            emptyText="Ten rodzaj nie ma formalnie wyróżnianych odmian."
          />

          <fieldset className="nomenclature-step">
            <legend>
              <span>4</span>
              <div>
                <strong>Cechy i chmury towarzyszące</strong>
                <small>Może występować ich kilka jednocześnie.</small>
              </div>
            </legend>
            {!options.features.length && !options.accessory.length ? (
              <p className="nomenclature-empty">Brak formalnych określeń w tej warstwie.</p>
            ) : (
              <>
                {!!options.features.length && (
                  <div className="nomenclature-subgroup">
                    <span>Cechy dodatkowe</span>
                    <div className="nomenclature-choices">
                      {options.features.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={selection.featureIds.includes(option.id) ? "selected" : ""}
                          onClick={() => toggleMany("featureIds", option.id)}
                          aria-pressed={selection.featureIds.includes(option.id)}
                        >
                          <strong>{option.name}</strong>
                          <small>{option.polish}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!!options.accessory.length && (
                  <div className="nomenclature-subgroup">
                    <span>Chmury towarzyszące</span>
                    <div className="nomenclature-choices">
                      {options.accessory.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={selection.accessoryIds.includes(option.id) ? "selected" : ""}
                          onClick={() => toggleMany("accessoryIds", option.id)}
                          aria-pressed={selection.accessoryIds.includes(option.id)}
                        >
                          <strong>{option.name}</strong>
                          <small>{option.polish}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </fieldset>

          <fieldset className="nomenclature-step nomenclature-step--origin">
            <legend>
              <span>5</span>
              <div>
                <strong>Pochodzenie</strong>
                <small>To zapis historii lub przyczyny, nie ozdobny przyrostek.</small>
              </div>
            </legend>
            <label>
              <span>Wybierz tylko przy znanym kontekście</span>
              <select
                value={selection.originId || ""}
                onChange={(event) => setSelection((current) => ({
                  ...current,
                  originId: event.target.value || null,
                  evidenceConfirmed: false,
                }))}
              >
                <option value="">Bez określenia pochodzenia</option>
                <optgroup label="Chmura macierzysta">
                  {options.origins.filter((origin) => origin.type === "mother").map((origin) => (
                    <option key={origin.id} value={origin.id}>{origin.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Chmura specjalna">
                  {options.origins.filter((origin) => origin.type === "special").map((origin) => (
                    <option key={origin.id} value={origin.id}>{origin.label}</option>
                  ))}
                  {options.origins.filter((origin) => origin.type === "contrail").map((origin) => (
                    <option key={origin.id} value={origin.id}>{origin.label}</option>
                  ))}
                </optgroup>
              </select>
            </label>
            {result.requiresEvidence && (
              <label className="nomenclature-evidence">
                <input
                  type="checkbox"
                  checked={selection.evidenceConfirmed}
                  onChange={(event) => setSelection((current) => ({
                    ...current,
                    evidenceConfirmed: event.target.checked,
                  }))}
                />
                <span>
                  <strong>Mam podstawę do opisania pochodzenia</strong>
                  <small>Obserwowałem przemianę albo znam wiarygodny kontekst procesu.</small>
                </span>
              </label>
            )}
          </fieldset>
        </div>

        <aside className={`nomenclature-result is-${result.status}`} aria-live="polite">
          <span className="eyebrow">Pełna nazwa robocza</span>
          <h4>{result.name}</h4>
          <div className="nomenclature-verdict">
            {result.status === "valid" && <Check size={22} />}
            {result.status === "needs-evidence" && <Eye size={22} />}
            {result.status === "conflict" && <Warning size={22} />}
            <div>
              <strong>
                {result.status === "valid" && "Nazwa spójna"}
                {result.status === "needs-evidence" && "Potrzebny dowód historii"}
                {result.status === "conflict" && "Sprzeczność w nazwie"}
              </strong>
              <p>{result.explanation}</p>
            </div>
          </div>
          {!!result.conflicts.length && (
            <ul className="nomenclature-conflicts">
              {result.conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}
            </ul>
          )}
          <dl>
            {result.layers.map((layer) => (
              <div key={layer.label}>
                <dt>{layer.label}</dt>
                <dd>{layer.value}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            className="nomenclature-reset"
            onClick={() => setSelection(emptyNomenclatureSelection)}
          >
            Zacznij od nowa
          </button>
        </aside>
      </div>
    </section>
  );
}

function EncyclopediaIndex({ onSelectTerm, onSelectCloud, onSources }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const filtered = searchTaxonomyTerms(taxonomyTerms, {
    query,
    category,
    cloudList: clouds,
    includeCompatibleGenera: true,
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

      <NomenclatureWorkshop onSources={onSources} />

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
                <span className="term-kind">{categoryRecord?.singular}</span>
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

function DiagnosticPhotoGallery({ cloud }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const image = cloud.images[activeIndex];
  const galleryTitleId = `diagnostic-gallery-${cloud.id}`;

  useEffect(() => {
    setActiveIndex(0);
    setRevealed(false);
  }, [cloud.id]);

  const selectFrame = (index) => {
    setActiveIndex(index);
    setRevealed(false);
  };

  const moveFrame = (offset) => {
    selectFrame((activeIndex + offset + cloud.images.length) % cloud.images.length);
  };

  return (
    <section className="diagnostic-gallery" aria-labelledby={galleryTitleId}>
      <header className="diagnostic-gallery__heading">
        <div>
          <span className="eyebrow">Galeria diagnostyczna · {cloud.images.length} kadry</span>
          <h3 id={galleryTitleId}>Ten sam rodzaj nie zawsze wygląda tak samo</h3>
        </div>
        <p>
          Zmieniaj perspektywę, światło i stadium rozwoju. Najpierw nazwij
          dowód widoczny w kadrze, dopiero potem odsłoń komentarz.
        </p>
      </header>

      <div className="diagnostic-gallery__stage">
        <figure>
          <img
            src={publicAsset(image.src)}
            alt={`${cloud.name}, kadr diagnostyczny ${activeIndex + 1} z ${cloud.images.length}`}
          />
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(cloud.images.length).padStart(2, "0")}</span>
        </figure>

        <div className="diagnostic-gallery__analysis">
          <div
            className="diagnostic-gallery__content"
            id={`${galleryTitleId}-analysis`}
            aria-live="polite"
          >
            {!revealed ? (
              <>
                <span className="eyebrow">Najpierw obserwacja</span>
                <h4>
                  Co w tym kadrze podtrzymuje hipotezę „<CloudName>{cloud.name}</CloudName>”?
                </h4>
                <p>
                  Zatrzymaj się na 15 sekund. Oceń kształt, skalę elementów,
                  cieniowanie, warstwowość i rozwój pionowy.
                </p>
              </>
            ) : (
              <>
                <span className="eyebrow">Co rozstrzyga</span>
                <h4>{image.diagnostic}</h4>
                <p>{image.note}</p>
                <div className="diagnostic-gallery__credit">
                  <span>Fot. <strong>{image.author}</strong> · {image.license}</span>
                  <a href={image.page} target="_blank" rel="noreferrer">
                    Plik i licencja <ArrowSquareOut size={14} />
                  </a>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className={revealed ? "text-button" : "button button--coral"}
            onClick={() => setRevealed(!revealed)}
            aria-expanded={revealed}
            aria-controls={`${galleryTitleId}-analysis`}
          >
            {revealed ? <>Ukryj analizę</> : <>Pokaż analizę <Eye size={17} /></>}
          </button>
        </div>
      </div>

      <div className="diagnostic-gallery__controls" aria-label="Wybierz kadr diagnostyczny">
        <button
          type="button"
          className="diagnostic-gallery__arrow"
          onClick={() => moveFrame(-1)}
          aria-label="Poprzedni kadr"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="diagnostic-gallery__thumbs">
          {cloud.images.map((candidate, index) => (
            <button
              type="button"
              key={candidate.id}
              className={index === activeIndex ? "active" : ""}
              onClick={() => selectFrame(index)}
              aria-label={`Pokaż kadr ${index + 1} z ${cloud.images.length}: ${candidate.note}`}
              aria-pressed={index === activeIndex}
            >
              <img src={publicAsset(candidate.src)} alt="" loading="lazy" decoding="async" />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="diagnostic-gallery__arrow"
          onClick={() => moveFrame(1)}
          aria-label="Następny kadr"
        >
          <ArrowRight size={19} />
        </button>
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
  const leadImage = getCloudImage(cloud);
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
          <img src={publicAsset(getCloudImage(cloud).src)} alt={`${cloud.name}, ${cloud.polish}`} />
          <span className="cloud-code">{cloud.code}</span>
        </div>
        <div className="detail-body">
          <span className="eyebrow">{cloud.level} · {cloud.altitude}</span>
          <h2><CloudName>{cloud.name}</CloudName></h2>
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
          <DiagnosticPhotoGallery cloud={cloud} />
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
            <p>{leadImage.note}</p>
            <p><strong>{leadImage.author}</strong> · {leadImage.license}</p>
            <a href={leadImage.page} target="_blank" rel="noreferrer">Strona pliku i licencja <ArrowSquareOut size={15} /></a>
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
          <span className="term-kind">{category?.singular}</span>
          <h2>{term.name}</h2>
          <p>{term.polish}</p>
        </div>
        {term.image && (
          <figure className="term-detail-visual">
            <img
              src={publicAsset(term.image.src)}
              alt={term.image.alt}
              width={term.image.width}
              height={term.image.height}
            />
            <figcaption>
              <span>Fot. {term.image.author} · {term.image.license}</span>
              <a href={term.image.page} target="_blank" rel="noreferrer">Plik i licencja</a>
            </figcaption>
          </figure>
        )}
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
                      <div><strong><CloudName>{cloud.name}</CloudName></strong><small>{cloud.polish}</small></div>
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

const weatherLayerIcons = {
  wind: Wind,
  gauge: Gauge,
  rain: CloudRain,
  cloud: Cloud,
  pin: MapPin,
  stack: Stack,
  lightning: Lightning,
};

function WindyDecoderPanel({
  terrain,
  setTerrain,
  pressure,
  setPressure,
  onSources,
}) {
  const [layerId, setLayerId] = useState("wind");
  const [cloudBand, setCloudBand] = useState("low");
  const [answerIndex, setAnswerIndex] = useState(null);
  const feedbackRef = useRef(null);
  const layer = getWeatherLayer(layerId);
  const LayerIcon = weatherLayerIcons[layer.icon] || Info;
  const pressureContext = pressureSurfaceContext(pressure, terrain);
  const reading = weatherLayerReading(layerId, { pressure, terrain, cloudBand });
  const answered = answerIndex !== null;
  const isCorrect = answerIndex === layer.check.correct;

  useEffect(() => {
    setAnswerIndex(null);
  }, [layerId]);

  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered, layerId]);

  return (
    <section className="windy-decoder">
      <div className="decoder-protocol">
        <div className="decoder-protocol__intro">
          <span className="eyebrow">Protokół czytania mapy</span>
          <h2>Nie patrz na kolor bez pytania</h2>
          <p>
            Każdą warstwę czytaj w tej samej kolejności. Dzięki temu mapa
            przestaje być zbiorem efektownych plam, a zaczyna być argumentem,
            który można sprawdzić.
          </p>
        </div>
        {[
          ["01", "Miejsce i czas", "Który termin, model i punkt naprawdę oglądasz?"],
          ["02", "Pole i jednostka", "Co oblicza kolor, liczba i legenda?"],
          ["03", "Poziom i odniesienie", "AGL, MSL, hPa, warstwa czy cała kolumna?"],
          ["04", "Porównanie", "Która druga warstwa lub obserwacja może obalić wniosek?"],
        ].map(([number, title, copy]) => (
          <article key={number}>
            <span>{number}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </div>

      <div className="decoder-workbench">
        <nav className="decoder-layer-picker" aria-label="Wybierz warstwę pogodową">
          <span>Warstwy do przećwiczenia</span>
          {weatherLayers.map((item) => {
            const Icon = weatherLayerIcons[item.icon] || Info;
            return (
              <button
                key={item.id}
                className={item.id === layerId ? "active" : ""}
                aria-pressed={item.id === layerId}
                onClick={() => setLayerId(item.id)}
              >
                <Icon size={21} />
                <span>{item.shortLabel}</span>
                <CaretRight size={16} />
              </button>
            );
          })}
        </nav>

        <article className="decoder-reader">
          <header>
            <div className="decoder-reader__icon"><LayerIcon size={28} /></div>
            <div>
              <span className="eyebrow">{layer.category}</span>
              <h2>{layer.label}</h2>
            </div>
          </header>

          <section className="decoder-question">
            <span>Ta mapa odpowiada na pytanie</span>
            <p>{layer.question}</p>
          </section>

          {layer.supportsPressure && (
            <section className="decoder-controls" aria-label="Ustaw poziom i teren">
              <div className="decoder-control-heading">
                <div>
                  <span>Poziom ciśnienia</span>
                  <strong>{pressure} hPa</strong>
                </div>
                <div>
                  <span>Orientacyjnie nad terenem</span>
                  <strong>
                    {pressureContext.intersectsTerrain
                      ? "poziom przecina teren"
                      : `${pressureContext.agl.toLocaleString("pl-PL")} m AGL`}
                  </strong>
                </div>
              </div>
              <div className="decoder-pressure-picker">
                {Object.keys(pressureLevels).map((value) => (
                  <button
                    key={value}
                    className={pressure === Number(value) ? "active" : ""}
                    aria-pressed={pressure === Number(value)}
                    onClick={() => setPressure(Number(value))}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <label>
                <span>
                  Modelowy teren
                  <strong>{terrain.toLocaleString("pl-PL")} m MSL</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="2200"
                  step="50"
                  value={terrain}
                  onChange={(event) => setTerrain(Number(event.target.value))}
                />
              </label>
            </section>
          )}

          {layer.supportsCloudBand && (
            <section className="decoder-band-control">
              <span>Wybierz pasmo wysokości</span>
              <div>
                {Object.values(cloudBands).map((band) => (
                  <button
                    key={band.id}
                    className={cloudBand === band.id ? "active" : ""}
                    aria-pressed={cloudBand === band.id}
                    onClick={() => setCloudBand(band.id)}
                  >
                    <strong>{band.label}</strong>
                    <small>{band.range}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <blockquote className="decoder-reading">
            <Eye size={24} />
            <div>
              <span>Poprawne zdanie interpretacyjne</span>
              <p>{reading}</p>
            </div>
          </blockquote>

          <div className="decoder-definitions">
            <section>
              <span>Jednostka</span>
              <p>{layer.unit}</p>
            </section>
            <section>
              <span>Układ odniesienia</span>
              <p>{layer.reference}</p>
            </section>
          </div>

          <section className="decoder-compare">
            <span className="eyebrow">Zanim wyciągniesz wniosek</span>
            <h3>Porównaj obok</h3>
            <ol>
              {layer.compare.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>

          <aside className="decoder-trap">
            <Warning size={24} />
            <div>
              <strong>Najczęstsza pułapka</strong>
              <p>{layer.trap}</p>
            </div>
          </aside>

          <SourceButton ids={layer.sourceIds} onOpen={onSources} />
        </article>

        <aside className="decoder-check">
          <span className="eyebrow">Sprawdź rozumowanie</span>
          <h2>Jedno pole, cztery interpretacje</h2>
          <p>{layer.check.prompt}</p>
          <div role="group" aria-label="Wybierz jedną interpretację">
            {layer.check.options.map((option, index) => {
              const optionIsCorrect = answered && index === layer.check.correct;
              const optionIsWrong = answered && index === answerIndex && !optionIsCorrect;
              return (
                <button
                  key={option}
                  className={`${optionIsCorrect ? "is-correct" : ""} ${optionIsWrong ? "is-wrong" : ""}`}
                  disabled={answered}
                  onClick={() => setAnswerIndex(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <section
              ref={feedbackRef}
              tabIndex="-1"
              className={`decoder-feedback ${isCorrect ? "is-correct" : "is-wrong"}`}
              aria-live="polite"
            >
              <strong>
                {isCorrect
                  ? "Tak. To wniosek, który dane rzeczywiście podtrzymują."
                  : `Nie. Poprawna odpowiedź: ${String.fromCharCode(65 + layer.check.correct)}.`}
              </strong>
              <p>{layer.check.explanation}</p>
              <button className="text-button" onClick={() => setAnswerIndex(null)}>
                Spróbuj jeszcze raz
              </button>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}

function LayersPage({ onSources }) {
  const [tab, setTab] = useState("decoder");
  const [terrain, setTerrain] = useState(300);
  const [pressure, setPressure] = useState(850);
  const selected = pressureLevels[pressure];
  const agl = Math.max(0, selected.altitude - terrain);
  const terrainPercent = Math.min(74, (terrain / 10000) * 100);
  const levelPercent = Math.min(96, (selected.altitude / 10000) * 100);
  const heading = {
    decoder: ["Pracownia pionowej atmosfery", "Czytnik Windy", "Wybierz warstwę i od razu zobacz, co oznacza dla wysokości, ciśnienia i terenu."],
    lab: ["Wysokość i ciśnienie", "Ten sam poziom, inna wysokość", "Przesuwaj teren i poziom hPa, aby zobaczyć różnicę między MSL i AGL."],
    wind: ["Ruch widoczny na niebie", "Wiatr z obserwacji", "Połącz kierunek ruchu chmur z zasadą, skąd wieje wiatr."],
    metar: ["Język pogody lotniczej", "METAR i TAF", "Czytaj depeszę grupami i sprawdzaj znaczenie bez pamięciówki."],
    hazards: ["Świadome granice", "Zagrożenia", "Rozpoznaj sygnały, których nie wolno interpretować bez danych operacyjnych."],
    sounding: ["Profil pionowy", "Sondaż i Skew-T", "Czytaj stabilność, wilgoć i wiatr na wspólnym przekroju atmosfery."],
  }[tab];

  return (
    <main className="page layers-page">
      <header className="page-heading page-heading--inline workbench-heading">
        <div>
          <span className="eyebrow">{heading[0]}</span>
          <h1>{heading[1]}</h1>
          <p>{heading[2]}</p>
        </div>
        <SourceButton
          ids={[
            "faaWeather",
            "windyOverlays",
            "windyAcademy",
            "windyLevels",
            "ecmwfModelLevels",
          ]}
          onOpen={onSources}
        />
      </header>

      <div className="segmented-control layers-tabs">
        {[["decoder", "Czytnik Windy"], ["lab", "Wysokość"], ["wind", "Wiatr z nieba"], ["metar", "METAR / TAF"], ["hazards", "Zagrożenia"], ["sounding", "Sondaż i Skew-T"]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "decoder" && (
        <WindyDecoderPanel
          terrain={terrain}
          setTerrain={setTerrain}
          pressure={pressure}
          setPressure={setPressure}
          onSources={onSources}
        />
      )}

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
            <button
              key={item}
              className={level === item ? "active" : ""}
              onClick={() => setLevel(item)}
              aria-pressed={level === item}
            >
              {item}
            </button>
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
        <SourceButton ids={["faaWeather", "wmoAtlas"]} onOpen={onSources} />
      </div>
      <div className="wind-caveats wind-caveats--wide">
        <article><strong>Lenticularis</strong><p>Kształt może stać w miejscu, gdy powietrze szybko przepływa przez falę.</p></article>
        <article><strong>Virga</strong><p>Nachylenie łączy znoszenie z opadaniem i parowaniem hydrometeorów.</p></article>
        <article><strong>Cumulonimbus</strong><p>Nowe komórki mogą rozwijać się w innym kierunku niż przepływa samo powietrze.</p></article>
        <article><strong>Radiatus</strong><p>Pasma pozornie zbiegają się przez perspektywę, choć są prawie równoległe.</p></article>
      </div>
    </section>
  );
}

const METAR_SPRINT_SECONDS = 30;

function ReportRibbon({ report, focusTokens = [], revealed = false }) {
  return (
    <div className="metar-report" aria-label={`Depesza: ${report}`}>
      {report.split(" ").map((token, index) => (
        <span
          key={`${token}-${index}`}
          className={revealed && focusTokens.includes(token) ? "is-focus" : ""}
        >
          {token}
        </span>
      ))}
    </div>
  );
}

function BriefingReportGrid({ briefing, question, revealed = false }) {
  return (
    <div className="briefing-report-grid">
      {briefing.reports.map((briefingReport) => {
        const scenario = metarTrainingScenarios.find(
          (candidate) => candidate.id === briefingReport.scenarioId,
        );
        if (!scenario) return null;
        const isFocused = revealed
          && question.focusScenarioIds.includes(briefingReport.scenarioId);

        return (
          <article
            key={briefingReport.scenarioId}
            className={`briefing-report-card ${isFocused ? "is-focus" : ""}`}
          >
            <header>
              <span>{briefingReport.role}</span>
              <strong>{scenario.station}</strong>
            </header>
            <p>{briefingReport.note}</p>
            <div className="briefing-report-code" aria-label={`Depesza ${scenario.station}`}>
              {scenario.report.split(" ").map((token, index) => (
                <span
                  key={`${token}-${index}`}
                  className={isFocused && question.focusTokens.includes(token) ? "is-focus" : ""}
                >
                  {token}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

const reviewKindLabels = {
  metar: "METAR",
  taf: "TAF",
  briefing: "Odprawa",
};

function formatReviewDue(dueAt, now = Date.now()) {
  if (!dueAt || dueAt <= now) return "teraz";
  const hours = Math.ceil((dueAt - now) / (60 * 60 * 1000));
  if (hours < 24) return `za ${hours} godz.`;
  const days = Math.ceil(hours / 24);
  if (days <= 7) return `za ${days} dni`;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(dueAt);
}

function ReviewEvidence({ item, revealed = false }) {
  if (item.kind === "briefing") {
    const briefing = aviationBriefingSets.find(
      (candidate) => candidate.id === item.sourceId,
    );
    return briefing ? (
      <BriefingReportGrid
        briefing={briefing}
        question={item.question}
        revealed={revealed}
      />
    ) : null;
  }

  return (
    <ReportRibbon
      report={item.report}
      focusTokens={item.question.focusTokens}
      revealed={revealed}
    />
  );
}

function TrainingQuestion({
  question,
  answerIndex,
  timedOut = false,
  headingRef,
  feedbackDetail = null,
  onAnswer,
  onNext,
  nextLabel,
}) {
  const answered = answerIndex !== null || timedOut;
  const feedbackRef = useRef(null);
  const result = answerIndex !== null
    ? evaluateTrainingAnswer(question, answerIndex)
    : timedOut
      ? {
          isCorrect: false,
          correct: question.options[question.correct],
          explanation: question.explanation,
        }
      : null;

  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered, question.id]);

  return (
    <div className="metar-question">
      <span className="metar-question__stage">{question.stage}</span>
      <h3 ref={headingRef} tabIndex="-1">{question.prompt}</h3>
      <div className="metar-options" role="group" aria-label="Wybierz jedną odpowiedź">
        {question.options.map((option, index) => {
          const isCorrect = answered && index === question.correct;
          const isWrong = answered && index === answerIndex && index !== question.correct;
          return (
            <button
              key={option}
              className={`${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}`}
              disabled={answered}
              onClick={() => onAnswer(index)}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          );
        })}
      </div>
      {result && (
        <div
          ref={feedbackRef}
          tabIndex="-1"
          className={`metar-feedback ${result.isCorrect ? "is-correct" : "is-wrong"}`}
          aria-live="polite"
        >
          <strong>
            {result.isCorrect
              ? "Dobrze odczytane."
              : timedOut
                ? "Czas minął."
                : `Poprawna odpowiedź: ${result.correct}`}
          </strong>
          <p>{result.explanation}</p>
          {feedbackDetail}
          <button className="button button--primary" onClick={onNext}>
            {nextLabel} <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

function MetarPanel({ onSources }) {
  const [mode, setMode] = useState("decode");
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedToken, setSelectedToken] = useState(null);
  const [guideSectionId, setGuideSectionId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerIndex, setAnswerIndex] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(METAR_SPRINT_SECONDS);
  const [score, setScore] = useState({
    correct: 0,
    attempts: 0,
    seconds: 0,
    timedAttempts: 0,
  });
  const [tafIndex, setTafIndex] = useState(0);
  const [tafQuestionIndex, setTafQuestionIndex] = useState(0);
  const [tafAnswerIndex, setTafAnswerIndex] = useState(null);
  const [briefingIndex, setBriefingIndex] = useState(0);
  const [briefingQuestionIndex, setBriefingQuestionIndex] = useState(0);
  const [briefingAnswerIndex, setBriefingAnswerIndex] = useState(null);
  const [aviationReviewRecords, setAviationReviewRecords] = useState(loadAviationReview);
  const [reviewSeenKeys, setReviewSeenKeys] = useState([]);
  const [reviewQuestionKey, setReviewQuestionKey] = useState(null);
  const [reviewAnswerIndex, setReviewAnswerIndex] = useState(null);
  const [reviewResetArmed, setReviewResetArmed] = useState(false);
  const trainingHeadingRef = useRef(null);
  const hasTrainingNavigatedRef = useRef(false);

  const questionBank = useMemo(() => createAviationQuestionBank(
    metarTrainingScenarios,
    tafTrainingScenarios,
    aviationBriefingSets,
  ), []);
  const questionBankByKey = useMemo(
    () => new Map(questionBank.map((item) => [item.key, item])),
    [questionBank],
  );
  const scenario = metarTrainingScenarios[scenarioIndex];
  const question = scenario.questions[questionIndex];
  const tafScenario = tafTrainingScenarios[tafIndex];
  const tafQuestion = tafScenario.questions[tafQuestionIndex];
  const briefing = aviationBriefingSets[briefingIndex];
  const briefingQuestion = briefing.questions[briefingQuestionIndex];
  const reviewNow = Date.now();
  const dueReviewItems = aviationReviewQueue(
    questionBank,
    aviationReviewRecords,
    reviewNow,
  ).filter((item) => !reviewSeenKeys.includes(item.key));
  const activeReviewItem = reviewQuestionKey
    ? questionBankByKey.get(reviewQuestionKey)
    : dueReviewItems[0];
  const activeReviewRecord = activeReviewItem
    ? aviationReviewRecords[activeReviewItem.key]
    : null;
  const reviewSummary = aviationReviewSummary(
    questionBank,
    aviationReviewRecords,
    reviewNow,
  );
  const reviewRecords = Object.values(aviationReviewRecords)
    .filter((record) => questionBankByKey.has(record.key))
    .sort((first, second) => (
      aviationReviewPriority(second, reviewNow)
      - aviationReviewPriority(first, reviewNow)
    ));
  const isSprint = mode === "sprint";
  const questionAnswered = answerIndex !== null || timedOut;
  const selectedGroup = scenario.groups.find((group) => group.token === selectedToken);
  const selectedGuide = metarDecodeSections.find((section) => (
    section.id === (guideSectionId || metarSectionByGroupLabel[selectedGroup?.label])
  ));
  const metarReviewItem = questionBankByKey.get(
    `metar:${scenario.id}:${question.id}`,
  );
  const tafReviewItem = questionBankByKey.get(
    `taf:${tafScenario.id}:${tafQuestion.id}`,
  );
  const briefingReviewItem = questionBankByKey.get(
    `briefing:${briefing.id}:${briefingQuestion.id}`,
  );

  const recordAviationAnswer = (item, correct) => {
    if (!item) return;
    setAviationReviewRecords((current) => {
      const next = updateAviationReview(current, item, correct);
      saveAviationReview(next);
      return next;
    });
  };

  useEffect(() => {
    if (!hasTrainingNavigatedRef.current || mode === "decode") return;
    trainingHeadingRef.current?.focus();
  }, [
    mode,
    questionIndex,
    tafQuestionIndex,
    briefingQuestionIndex,
    scenarioIndex,
    tafIndex,
    briefingIndex,
    activeReviewItem?.key,
  ]);

  useEffect(() => {
    if (!isSprint || questionAnswered) return undefined;
    if (secondsLeft <= 0) {
      setTimedOut(true);
      recordAviationAnswer(metarReviewItem, false);
      setScore((current) => ({
        ...current,
        attempts: current.attempts + 1,
        seconds: current.seconds + METAR_SPRINT_SECONDS,
        timedAttempts: current.timedAttempts + 1,
      }));
      return undefined;
    }

    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [isSprint, questionAnswered, secondsLeft, metarReviewItem]);

  const startMode = (nextMode) => {
    hasTrainingNavigatedRef.current = nextMode !== "decode";
    setMode(nextMode);
    setQuestionIndex(0);
    setAnswerIndex(null);
    setTafQuestionIndex(0);
    setTafAnswerIndex(null);
    setBriefingQuestionIndex(0);
    setBriefingAnswerIndex(null);
    setReviewSeenKeys([]);
    setReviewQuestionKey(null);
    setReviewAnswerIndex(null);
    setReviewResetArmed(false);
    setTimedOut(false);
    setSecondsLeft(METAR_SPRINT_SECONDS);
    setSelectedToken(null);
    setGuideSectionId(null);
  };

  const chooseScenario = (index) => {
    hasTrainingNavigatedRef.current = mode !== "decode";
    setScenarioIndex(index);
    setQuestionIndex(0);
    setAnswerIndex(null);
    setTimedOut(false);
    setSecondsLeft(METAR_SPRINT_SECONDS);
    setSelectedToken(null);
    setGuideSectionId(null);
  };

  const chooseAnswer = (index) => {
    if (questionAnswered) return;
    const result = evaluateTrainingAnswer(question, index);
    setAnswerIndex(index);
    recordAviationAnswer(metarReviewItem, result.isCorrect);
    setScore((current) => ({
      correct: current.correct + (result.isCorrect ? 1 : 0),
      attempts: current.attempts + 1,
      seconds: current.seconds + (isSprint ? METAR_SPRINT_SECONDS - secondsLeft : 0),
      timedAttempts: current.timedAttempts + (isSprint ? 1 : 0),
    }));
  };

  const nextMetarQuestion = () => {
    hasTrainingNavigatedRef.current = true;
    if (questionIndex < scenario.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
    } else {
      setScenarioIndex((current) => chooseDifferentScenario(
        current,
        metarTrainingScenarios.length,
      ));
      setQuestionIndex(0);
    }
    setAnswerIndex(null);
    setTimedOut(false);
    setSecondsLeft(METAR_SPRINT_SECONDS);
  };

  const chooseTafAnswer = (index) => {
    if (tafAnswerIndex !== null) return;
    setTafAnswerIndex(index);
    recordAviationAnswer(
      tafReviewItem,
      evaluateTrainingAnswer(tafQuestion, index).isCorrect,
    );
  };

  const nextTafQuestion = () => {
    hasTrainingNavigatedRef.current = true;
    if (tafQuestionIndex < tafScenario.questions.length - 1) {
      setTafQuestionIndex((current) => current + 1);
    } else {
      setTafIndex((current) => chooseDifferentScenario(
        current,
        tafTrainingScenarios.length,
      ));
      setTafQuestionIndex(0);
    }
    setTafAnswerIndex(null);
  };

  const chooseBriefingAnswer = (index) => {
    if (briefingAnswerIndex !== null) return;
    setBriefingAnswerIndex(index);
    recordAviationAnswer(
      briefingReviewItem,
      evaluateTrainingAnswer(briefingQuestion, index).isCorrect,
    );
  };

  const nextBriefingQuestion = () => {
    hasTrainingNavigatedRef.current = true;
    if (briefingQuestionIndex < briefing.questions.length - 1) {
      setBriefingQuestionIndex((current) => current + 1);
    } else {
      setBriefingIndex((current) => chooseDifferentScenario(
        current,
        aviationBriefingSets.length,
      ));
      setBriefingQuestionIndex(0);
    }
    setBriefingAnswerIndex(null);
  };

  const chooseReviewAnswer = (index) => {
    if (!activeReviewItem || reviewAnswerIndex !== null) return;
    setReviewQuestionKey(activeReviewItem.key);
    setReviewAnswerIndex(index);
    recordAviationAnswer(
      activeReviewItem,
      evaluateTrainingAnswer(activeReviewItem.question, index).isCorrect,
    );
  };

  const nextReviewQuestion = () => {
    if (activeReviewItem) {
      setReviewSeenKeys((current) => [...current, activeReviewItem.key]);
    }
    hasTrainingNavigatedRef.current = true;
    setReviewQuestionKey(null);
    setReviewAnswerIndex(null);
  };

  const resetAviationReview = () => {
    clearAviationReview();
    setAviationReviewRecords({});
    setReviewSeenKeys([]);
    setReviewQuestionKey(null);
    setReviewAnswerIndex(null);
    setReviewResetArmed(false);
  };

  const averageSeconds = score.timedAttempts > 0
    ? Math.round(score.seconds / score.timedAttempts)
    : null;

  return (
    <section className="knowledge-panel metar-workshop">
      <div className="panel-heading">
        <span className="panel-icon"><AirplaneTilt size={27} /></span>
        <div>
          <span className="eyebrow">Interaktywna pracownia kodu</span>
          <h2>Najpierw odczytaj. Potem odsłoń rozwiązanie.</h2>
          <p className="panel-lead">
            Uczysz się kolejności pracy: miejsce i czas, wiatr, widzialność,
            zjawiska, chmury, temperatura, QNH, a na końcu pułap i wniosek.
          </p>
        </div>
      </div>

      <div className="metar-mode-switch" aria-label="Tryb pracowni">
        <button aria-pressed={mode === "decode"} className={mode === "decode" ? "active" : ""} onClick={() => startMode("decode")}>Rozbiór aktywny</button>
        <button aria-pressed={mode === "practice"} className={mode === "practice" ? "active" : ""} onClick={() => startMode("practice")}>Trening METAR</button>
        <button aria-pressed={mode === "sprint"} className={mode === "sprint" ? "active" : ""} onClick={() => startMode("sprint")}>Odprawa 30 s</button>
        <button aria-pressed={mode === "taf"} className={mode === "taf" ? "active" : ""} onClick={() => startMode("taf")}>Oś czasu TAF</button>
        <button aria-pressed={mode === "briefing"} className={mode === "briefing" ? "active" : ""} onClick={() => startMode("briefing")}>Odprawa 3 stacji</button>
        <button aria-pressed={mode === "review"} className={mode === "review" ? "active" : ""} onClick={() => startMode("review")}>
          Powtórki {reviewSummary.due > 0 ? `· ${reviewSummary.due}` : ""}
        </button>
      </div>

      {["decode", "practice", "sprint"].includes(mode) && (
        <div className="metar-scenario-nav">
          <div>
            <span>Depesza edukacyjna {scenarioIndex + 1}/{metarTrainingScenarios.length}</span>
            <strong>{scenario.station} · {scenario.title}</strong>
          </div>
          <button
            className="button button--secondary"
            onClick={() => chooseScenario(chooseDifferentScenario(
              scenarioIndex,
              metarTrainingScenarios.length,
            ))}
          >
            Losuj inną
          </button>
        </div>
      )}

      {mode === "decode" && (
        <div className="metar-decode">
          <section className="metar-anatomy" aria-labelledby="metar-anatomy-title">
            <div className="metar-anatomy__heading">
              <div>
                <span className="eyebrow">Anatomia całej depeszy</span>
                <h3 id="metar-anatomy-title">METAR jest zdaniem czytanym od lewej do prawej</h3>
              </div>
              <p>
                Rdzeń ma stałą logikę, ale nie każda sekcja musi wystąpić.
                Jedna grupa może też zastąpić kilka następnych, jak CAVOK.
              </p>
            </div>
            <div className="metar-structure-phases">
              {metarStructurePhases.map((phase) => (
                <article key={phase.id}>
                  <span>{phase.number}</span>
                  <h4>{phase.title}</h4>
                  <code>{phase.pattern}</code>
                  <p>{phase.detail}</p>
                </article>
              ))}
            </div>
            <div className="cavok-quick-guide">
              <code>CAVOK</code>
              <div>
                <strong>Ceiling And Visibility OK</strong>
                <p>
                  Jeden skrót może zastąpić osobne grupy widzialności,
                  aktualnych zjawisk i chmur, gdy wszystkie wymagane kryteria są spełnione.
                </p>
              </div>
              <button
                className="button button--secondary"
                onClick={() => {
                  setSelectedToken(null);
                  setGuideSectionId("visibility");
                }}
              >
                Wyjaśnij dokładnie
              </button>
            </div>
          </section>

          <div className="metar-section-index" role="group" aria-label="Słownik sekcji METAR">
            {metarDecodeSections.map((section) => (
              <button
                key={section.id}
                aria-pressed={guideSectionId === section.id && !selectedToken}
                className={guideSectionId === section.id && !selectedToken ? "active" : ""}
                onClick={() => {
                  setSelectedToken(null);
                  setGuideSectionId(section.id);
                }}
              >
                {section.shortLabel}
              </button>
            ))}
          </div>

          <p className="metar-instruction">
            Teraz zastosuj mapę do konkretnego raportu. Kliknij grupę, nazwij
            ją własnymi słowami, a potem sprawdź znaczenie i możliwe warianty tej sekcji.
          </p>
          <div className="metar-token-board">
            {scenario.groups.map((group) => (
              <button
                key={group.token}
                className={selectedToken === group.token ? "active" : ""}
                aria-pressed={selectedToken === group.token}
                onClick={() => {
                  setSelectedToken(group.token);
                  setGuideSectionId(metarSectionByGroupLabel[group.label]);
                }}
              >
                {group.token}
              </button>
            ))}
          </div>
          <div className="metar-group-answer" aria-live="polite">
            {selectedGroup || selectedGuide ? (
              <>
                <div className="metar-guide-layout">
                  <div className="metar-guide-explanation">
                    <span>
                      {selectedGroup
                        ? `${selectedGroup.label} · ${selectedGuide?.position || "sekcja raportu"}`
                        : `Słownik sekcji · ${selectedGuide.position}`}
                    </span>
                    <strong>{selectedGroup?.token || selectedGuide.title}</strong>
                    <p>{selectedGroup?.meaning || selectedGuide.purpose}</p>
                    {selectedGuide && (
                      <>
                        <h4>Jak jest zbudowana ta sekcja?</h4>
                        <p className="metar-guide-copy">{selectedGuide.syntax}</p>
                      </>
                    )}
                    {selectedGroup?.ceiling && <small>Ta grupa może tworzyć pułap.</small>}
                  </div>
                  {selectedGuide && (
                    <aside className="metar-guide-examples">
                      <span>Co jeszcze możesz tu spotkać</span>
                      <div>
                        {selectedGuide.examples.map((example) => (
                          <article key={example.code}>
                            <code>{example.code}</code>
                            <p>{example.meaning}</p>
                          </article>
                        ))}
                      </div>
                    </aside>
                  )}
                </div>
                {selectedGuide?.spotlight && (
                  <div className="metar-spotlight">
                    <code>{selectedGuide.spotlight.code}</code>
                    <div>
                      <strong>{selectedGuide.spotlight.expansion}</strong>
                      <p>{selectedGuide.spotlight.meaning}</p>
                      <small>{selectedGuide.spotlight.limits}</small>
                    </div>
                  </div>
                )}
                {selectedGuide && (
                  <div className="metar-watch">
                    <Warning size={18} />
                    <p><strong>Uważaj:</strong> {selectedGuide.watchFor}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <span>Zadanie</span>
                <strong>Wybierz grupę raportu albo sekcję słownika</strong>
                <p>
                  {scenario.context} Słownik powyżej pozwala też sprawdzić
                  elementy, których akurat nie ma w tej depeszy.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {(mode === "practice" || mode === "sprint") && (
        <div className="metar-practice">
          <div className="metar-practice__topline">
            <span>Pytanie {questionIndex + 1}/{scenario.questions.length}</span>
            <div className="metar-score">
              <strong>{score.correct}/{score.attempts}</strong>
              <span>poprawne</span>
              {averageSeconds && <span>· średnio {averageSeconds} s</span>}
            </div>
            {isSprint && (
              <div
                className={`metar-timer ${secondsLeft <= 8 ? "is-urgent" : ""}`}
                role="timer"
                aria-label={`Pozostało ${secondsLeft} sekund`}
              >
                <Gauge size={20} />
                <strong>{secondsLeft}s</strong>
              </div>
            )}
          </div>
          <ReportRibbon
            report={scenario.report}
            focusTokens={question.focusTokens}
            revealed={questionAnswered}
          />
          <TrainingQuestion
            question={question}
            answerIndex={answerIndex}
            timedOut={timedOut}
            headingRef={trainingHeadingRef}
            onAnswer={chooseAnswer}
            onNext={nextMetarQuestion}
            nextLabel={questionIndex < scenario.questions.length - 1 ? "Następne pytanie" : "Następna depesza"}
          />
        </div>
      )}

      {mode === "taf" && (
        <div className="taf-practice">
          <div className="metar-scenario-nav">
            <div>
              <span>Prognoza edukacyjna {tafIndex + 1}/{tafTrainingScenarios.length}</span>
              <strong>{tafScenario.station} · {tafScenario.title}</strong>
            </div>
          </div>
          <ReportRibbon
            report={tafScenario.report}
            focusTokens={tafQuestion.focusTokens}
            revealed={tafAnswerIndex !== null}
          />
          <p className="taf-instruction">
            Najpierw odczytaj depeszę i odpowiedz. Pełny rozbiór osi czasu
            pojawi się w informacji zwrotnej po Twojej decyzji.
          </p>
          <TrainingQuestion
            question={tafQuestion}
            answerIndex={tafAnswerIndex}
            headingRef={trainingHeadingRef}
            feedbackDetail={tafAnswerIndex !== null ? (
              <div className="taf-debrief">
                <span className="eyebrow">Rozbiór osi czasu</span>
                <div className="taf-timeline" aria-label="Oś czasu prognozy TAF">
                  {tafScenario.timeline.map((period) => (
                    <article key={period.time}>
                      <span>{period.time}</span>
                      <strong>{period.label}</strong>
                      <p>{period.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
            onAnswer={chooseTafAnswer}
            onNext={nextTafQuestion}
            nextLabel={tafQuestionIndex < tafScenario.questions.length - 1 ? "Następne pytanie" : "Następna prognoza"}
          />
        </div>
      )}

      {mode === "briefing" && (
        <div className="briefing-practice">
          <div className="briefing-heading">
            <div>
              <span className="eyebrow">{briefing.kicker}</span>
              <h3>{briefing.title}</h3>
              <p>{briefing.context}</p>
            </div>
            <span className="briefing-progress">
              Pytanie {briefingQuestionIndex + 1}/{briefing.questions.length}
            </span>
          </div>
          <BriefingReportGrid
            briefing={briefing}
            question={briefingQuestion}
            revealed={briefingAnswerIndex !== null}
          />
          <p className="taf-instruction">
            Najpierw porównaj wszystkie trzy depesze. Wyróżnienie dowodów
            pojawi się dopiero po odpowiedzi.
          </p>
          <TrainingQuestion
            question={briefingQuestion}
            answerIndex={briefingAnswerIndex}
            headingRef={trainingHeadingRef}
            onAnswer={chooseBriefingAnswer}
            onNext={nextBriefingQuestion}
            nextLabel={briefingQuestionIndex < briefing.questions.length - 1
              ? "Następne pytanie"
              : "Następna odprawa"}
          />
        </div>
      )}

      {mode === "review" && (
        <div className="aviation-review">
          <header className="review-heading">
            <div>
              <span className="eyebrow">Pamięć lokalna · bez konta</span>
              <h3>Powtarzaj reguły, które rzeczywiście sprawiają trudność</h3>
              <p>
                Błąd przywraca pytanie natychmiast i podnosi jego priorytet.
                Kolejne poprawne odpowiedzi stopniowo wydłużają odstęp.
              </p>
            </div>
            <div className="review-summary" aria-label="Stan powtórek">
              <article><strong>{reviewSummary.tracked}</strong><span>śledzonych reguł</span></article>
              <article><strong>{reviewSummary.due}</strong><span>do powtórki</span></article>
              <article>
                <strong>{reviewSummary.nextDueAt
                  ? formatReviewDue(reviewSummary.nextDueAt, reviewNow)
                  : "—"}</strong>
                <span>następna sesja</span>
              </article>
            </div>
          </header>

          {activeReviewItem ? (
            <section className="review-session" aria-label="Aktywna powtórka">
              <div className="review-session__meta">
                <span>{reviewKindLabels[activeReviewItem.kind]}</span>
                <strong>{activeReviewItem.topic}</strong>
                <small>{activeReviewItem.title}</small>
              </div>
              <ReviewEvidence
                item={activeReviewItem}
                revealed={reviewAnswerIndex !== null}
              />
              <TrainingQuestion
                question={activeReviewItem.question}
                answerIndex={reviewAnswerIndex}
                headingRef={trainingHeadingRef}
                feedbackDetail={reviewAnswerIndex !== null ? (
                  <div className="review-feedback-detail">
                    <p>
                      <strong>Plan pamięci:</strong>{" "}
                      {activeReviewRecord?.lastResult === "correct"
                        ? `następna próba ${formatReviewDue(activeReviewRecord.dueAt)}`
                        : "pytanie pozostaje pilne i wróci w kolejnej sesji"}.
                    </p>
                    {activeReviewItem.kind === "taf" && (
                      <div className="taf-debrief">
                        <span className="eyebrow">Oś czasu prognozy</span>
                        <div className="taf-timeline">
                          {activeReviewItem.timeline.map((period) => (
                            <article key={period.time}>
                              <span>{period.time}</span>
                              <strong>{period.label}</strong>
                              <p>{period.detail}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                onAnswer={chooseReviewAnswer}
                onNext={nextReviewQuestion}
                nextLabel="Następna powtórka"
              />
            </section>
          ) : (
            <section className="review-empty">
              <Check size={32} weight="bold" />
              <div>
                <span className="eyebrow">
                  {reviewSeenKeys.length > 0 ? "Sesja zakończona" : "Brak pytań na teraz"}
                </span>
                <h4 ref={trainingHeadingRef} tabIndex="-1">
                  {reviewSummary.tracked === 0
                    ? "Najpierw odpowiedz na kilka pytań w pracowni"
                    : "Na tę chwilę wszystko zostało odtworzone"}
                </h4>
                <p>
                  {reviewSummary.tracked === 0
                    ? "Każda odpowiedź w METAR, TAF i odprawach tworzy prywatny plan powtórek na tym urządzeniu."
                    : reviewSummary.nextDueAt
                      ? `Najbliższa zaplanowana powtórka: ${formatReviewDue(reviewSummary.nextDueAt, reviewNow)}.`
                      : "Nowa sesja pojawi się po kolejnych odpowiedziach."}
                </p>
                <div>
                  <button className="button button--primary" onClick={() => startMode("practice")}>
                    Trening METAR <ArrowRight size={17} />
                  </button>
                  <button className="button button--secondary" onClick={() => startMode("briefing")}>
                    Odprawa 3 stacji
                  </button>
                </div>
              </div>
            </section>
          )}

          <details className="review-ledger">
            <summary>
              <span>
                <strong>Co zapisano na tym urządzeniu</strong>
                <small>{reviewRecords.length} rekordów · pełna kontrola i możliwość usunięcia</small>
              </span>
              <CaretDown size={19} />
            </summary>
            <div className="review-ledger__body">
              {reviewRecords.length > 0 ? (
                <div className="review-records">
                  {reviewRecords.map((record) => (
                    <article key={record.key}>
                      <div>
                        <span>{reviewKindLabels[record.kind]} · {record.topic}</span>
                        <strong>{record.title}</strong>
                      </div>
                      <dl>
                        <div><dt>dobrze</dt><dd>{record.correct}</dd></div>
                        <div><dt>błędy</dt><dd>{record.wrong}</dd></div>
                        <div><dt>seria</dt><dd>{record.streak}</dd></div>
                        <div><dt>termin</dt><dd>{formatReviewDue(record.dueAt, reviewNow)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="review-ledger__empty">Nie zapisano jeszcze żadnej odpowiedzi.</p>
              )}

              {reviewResetArmed ? (
                <div className="review-reset-confirm" role="alert">
                  <p>Usunąć wszystkie lokalne wyniki i terminy powtórek?</p>
                  <button className="button button--coral" onClick={resetAviationReview}>
                    Potwierdź usunięcie
                  </button>
                  <button className="button button--secondary" onClick={() => setReviewResetArmed(false)}>
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  className="review-reset-button"
                  onClick={() => setReviewResetArmed(true)}
                  disabled={reviewRecords.length === 0}
                >
                  <Trash size={17} /> Wyczyść pamięć powtórek
                </button>
              )}
            </div>
          </details>
        </div>
      )}

      <div className="notice">
        <Warning size={20} />
        <p>
          Wszystkie depesze w pracowni są fikcyjnymi przykładami edukacyjnymi.
          Nie są aktualnymi raportami ani materiałem do podejmowania decyzji operacyjnych.
        </p>
      </div>
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
  const [scenarioId, setScenarioId] = useState(soundingScenarios[0].id);
  const [visible, setVisible] = useState({
    environment: true,
    parcel: true,
    layers: true,
    wind: true,
  });
  const [answerIndex, setAnswerIndex] = useState(null);
  const feedbackRef = useRef(null);
  const scenario = soundingScenarios.find((item) => item.id === scenarioId);
  const summary = soundingSummary(scenario);
  const answered = answerIndex !== null;
  const answerIsCorrect = answerIndex === scenario.check.correct;

  useEffect(() => {
    setAnswerIndex(null);
  }, [scenarioId]);

  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered]);

  const toggleLayer = (id) => {
    setVisible((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <section className="sounding-lab">
      <header className="sounding-intro">
        <div>
          <span className="eyebrow">Pracownia pionowego profilu</span>
          <h2>Skew‑T czytaj jak argument, nie kolorowankę</h2>
          <p>
            Ciśnienie prowadzi od powierzchni ku górze. Temperatura i punkt rosy
            pokazują stabilność oraz wilgoć, tor parceli ujawnia wyporność, a
            wiatr dopowiada uskok i przepływ. Dopiero razem tworzą diagnozę.
          </p>
        </div>
        <SourceButton ids={["nwsSkewT", "nwsRadiosonde", "nwsSkewTAviation", "faaWeather"]} onOpen={onSources} />
      </header>

      <section className="sounding-provenance" aria-label="Rodzaje profili atmosferycznych">
        <article>
          <span>01</span>
          <div>
            <strong>Radiosonda obserwowana</strong>
            <p>Balon mierzy kolumnę podczas trwającego lotu i dryfuje z wiatrem. To nie jest idealnie pionowy ani jednoczesny przekrój.</p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <strong>Profil prognozowany</strong>
            <p>To kolumna modelu dla miejsca i terminu. Trzeba sprawdzić model, czas, reprezentację terenu i zgodność z obserwacjami.</p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <strong>Profile w tej pracowni</strong>
            <p>Idealizowane, deterministyczne przykłady dydaktyczne. Uczą struktury rozumowania, ale nie opisują bieżącej pogody.</p>
          </div>
        </article>
      </section>

      <nav className="sounding-scenarios" aria-label="Wybierz profil szkoleniowy">
        {soundingScenarios.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === scenarioId ? "active" : ""}
            aria-pressed={item.id === scenarioId}
            onClick={() => setScenarioId(item.id)}
          >
            <span>{item.number}</span>
            <div>
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <p>{item.short}</p>
            </div>
          </button>
        ))}
      </nav>

      <section className="sounding-protocol" aria-label="Kolejność czytania profilu">
        <div>
          <span className="eyebrow">Stała procedura</span>
          <h3>Pięć przejść przez ten sam diagram</h3>
        </div>
        {[
          ["1", "Oś", "Czas, miejsce, źródło i ciśnienie."],
          ["2", "T i Td", "Stabilność, wilgoć i warstwy nasycone."],
          ["3", "Parcel", "LCL, hamowanie, LFC i EL."],
          ["4", "Wiatr", "Zmiana kierunku i prędkości z wysokością."],
          ["5", "Granice", "Co profil wspiera, a czego nie dowodzi."],
        ].map(([number, title, copy]) => (
          <article key={number}>
            <span>{number}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <div className="sounding-workbench">
        <div className="sounding-visual-column">
          <div className="sounding-toolbar" role="group" aria-label="Warstwy diagramu">
            {[
              ["environment", "Temperatura i Td"],
              ["parcel", "Tor parceli"],
              ["layers", "Warstwy i poziomy"],
              ["wind", "Profil wiatru"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={visible[id] ? "active" : ""}
                aria-pressed={visible[id]}
                onClick={() => toggleLayer(id)}
              >
                {visible[id] && <Check size={14} />}
                {label}
              </button>
            ))}
          </div>

          <SoundingDiagram scenario={scenario} visible={visible} />

          <div className="sounding-legend">
            <span><i className="temperature" /> T · temperatura otoczenia</span>
            <span><i className="dewpoint" /> Td · punkt rosy</span>
            <span><i className="parcel" /> tor wybranej parceli</span>
          </div>
          <p className="sounding-plot-note">
            Schemat zachowuje logarytmiczną oś ciśnienia i skośne izotermy.
            Linie profili są idealizowane; nie odczytuj z nich wartości operacyjnych.
          </p>
        </div>

        <aside className="sounding-analysis">
          <span className="eyebrow">{scenario.sourceType}</span>
          <h3>{scenario.reading.verdict}</h3>
          <p className="sounding-analysis__lead">{scenario.short}</p>

          <dl className="sounding-levels">
            <div>
              <dt>Źródło parceli</dt>
              <dd>{summary.parcelOrigin}</dd>
            </div>
            <div>
              <dt>LCL</dt>
              <dd>{summary.lcl ? `${summary.lcl} hPa` : "brak"}</dd>
            </div>
            <div>
              <dt>LFC</dt>
              <dd>{summary.lfc ? `${summary.lfc} hPa` : "nie osiąga"}</dd>
            </div>
            <div>
              <dt>EL</dt>
              <dd>{summary.el ? `${summary.el} hPa` : "brak"}</dd>
            </div>
            <div>
              <dt>0°C</dt>
              <dd>{summary.freezing} hPa</dd>
            </div>
            <div>
              <dt>T–Td przy dole</dt>
              <dd>{summary.surfaceSpread}°C</dd>
            </div>
          </dl>
        </aside>

        <section className="sounding-interpretation">
          <header>
            <span className="eyebrow">Argument z całej kolumny</span>
            <h3>Co wspiera tę diagnozę</h3>
          </header>
          <div className="sounding-reading-list">
            {[
              ["Stabilność i parcela", scenario.reading.stability],
              ["Wilgoć i chmury", scenario.reading.moisture],
              ["Wiatr z wysokością", scenario.reading.wind],
              ["Znaczenie lotnicze", scenario.reading.aviation],
            ].map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{title}</strong><p>{copy}</p></div>
              </article>
            ))}
          </div>

          <aside className="sounding-uncertainty">
            <Warning size={21} />
            <div>
              <strong>Czego ten profil nie dowodzi</strong>
              <p>{scenario.reading.uncertainty}</p>
            </div>
          </aside>
        </section>
      </div>

      <section className="sounding-check">
        <div className="sounding-check__heading">
          <span className="eyebrow">Sprawdź diagnozę</span>
          <h3>Nie nazywaj jednej linii. Zinterpretuj kolumnę.</h3>
          <p>{scenario.check.prompt}</p>
        </div>
        <div className="sounding-check__options" role="group" aria-label="Wybierz interpretację profilu">
          {scenario.check.options.map((option, index) => {
            const isCorrect = answered && index === scenario.check.correct;
            const isWrong = answered && index === answerIndex && !isCorrect;
            return (
              <button
                type="button"
                key={option}
                className={`${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                disabled={answered}
                onClick={() => setAnswerIndex(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {option}
              </button>
            );
          })}
        </div>
        {answered && (
          <div
            ref={feedbackRef}
            tabIndex="-1"
            className={`sounding-feedback ${answerIsCorrect ? "correct" : "wrong"}`}
            aria-live="polite"
          >
            <strong>
              {answerIsCorrect
                ? "Tak. Wniosek wynika z kilku zgodnych warstw dowodu."
                : `Nie. Poprawna odpowiedź: ${String.fromCharCode(65 + scenario.check.correct)}.`}
            </strong>
            <p>{scenario.check.explanation}</p>
            <button type="button" onClick={() => setAnswerIndex(null)}>Przeanalizuj ponownie</button>
          </div>
        )}
      </section>

      <section className="sounding-glossary">
        <div>
          <span className="eyebrow">Cztery skróty bez magii</span>
          <h3>Poziomy opisują wybraną parcelę</h3>
        </div>
        <div>
          {soundingGlossary.map((item) => (
            <article key={item.id}>
              <strong>{item.term}</strong>
              <span>{item.polish}</span>
              <p>{item.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

const soundingChartLayout = {
  left: 62,
  top: 30,
  width: 548,
  height: 540,
};

function SoundingDiagram({ scenario, visible }) {
  const titleId = `sounding-${scenario.id}-title`;
  const descriptionId = `sounding-${scenario.id}-description`;
  const pressureY = (pressure) => soundingPoint(0, pressure, soundingChartLayout).y;
  const environmentTemperaturePath = soundingPath(
    scenario.profile,
    "temperature",
    soundingChartLayout,
  );
  const dewpointPath = soundingPath(scenario.profile, "dewpoint", soundingChartLayout);
  const parcelPath = soundingPath(scenario.profile, "parcel", soundingChartLayout);
  const levelMarkers = [
    ["LCL", scenario.levels.lcl, "condensation"],
    ["LFC", scenario.levels.lfc, "buoyancy"],
    ["EL", scenario.levels.el, "equilibrium"],
    ["0°C", scenario.levels.freezing, "freezing"],
  ].filter(([, pressure]) => pressure);
  const windLevels = soundingPressureGrid
    .map((pressure) => scenario.profile.find((level) => level.pressure === pressure))
    .filter(Boolean);

  return (
    <figure className="sounding-diagram">
      <svg
        viewBox="0 0 820 620"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{scenario.title}</title>
        <desc id={descriptionId}>
          Idealizowany diagram Skew-T przedstawiający temperaturę, punkt rosy,
          tor parceli, poziomy termodynamiczne oraz wiatr z wysokością.
        </desc>
        <defs>
          <clipPath id={`sounding-clip-${scenario.id}`}>
            <rect
              x={soundingChartLayout.left}
              y={soundingChartLayout.top}
              width={soundingChartLayout.width}
              height={soundingChartLayout.height}
            />
          </clipPath>
          <marker
            id={`wind-arrow-${scenario.id}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" />
          </marker>
        </defs>

        <rect
          className="sounding-diagram__paper"
          x={soundingChartLayout.left}
          y={soundingChartLayout.top}
          width={soundingChartLayout.width}
          height={soundingChartLayout.height}
        />

        <g clipPath={`url(#sounding-clip-${scenario.id})`}>
          {visible.layers && scenario.cloudLayers.map((layer) => {
            const top = pressureY(layer.top);
            const bottom = pressureY(layer.bottom);
            return (
              <rect
                key={layer.label}
                className="sounding-cloud-layer"
                x={soundingChartLayout.left}
                y={top}
                width={soundingChartLayout.width}
                height={Math.max(3, bottom - top)}
              />
            );
          })}

          {visible.layers && scenario.inversion && (
            <rect
              className="sounding-inversion-layer"
              x={soundingChartLayout.left}
              y={pressureY(scenario.inversion.top)}
              width={soundingChartLayout.width}
              height={pressureY(scenario.inversion.bottom) - pressureY(scenario.inversion.top)}
            />
          )}

          {soundingTemperatureGrid.map((temperature) => {
            const bottom = soundingPoint(temperature, 1000, soundingChartLayout);
            const top = soundingPoint(temperature, 200, soundingChartLayout);
            return (
              <line
                key={temperature}
                className={`sounding-isotherm ${temperature === 0 ? "zero" : ""}`}
                x1={bottom.x}
                y1={bottom.y}
                x2={top.x}
                y2={top.y}
              />
            );
          })}

          {soundingPressureGrid.map((pressure) => (
            <line
              key={pressure}
              className="sounding-isobar"
              x1={soundingChartLayout.left}
              x2={soundingChartLayout.left + soundingChartLayout.width}
              y1={pressureY(pressure)}
              y2={pressureY(pressure)}
            />
          ))}

          {visible.layers && levelMarkers.map(([label, pressure, type]) => (
            <line
              key={label}
              className={`sounding-level-line ${type}`}
              x1={soundingChartLayout.left}
              x2={soundingChartLayout.left + soundingChartLayout.width}
              y1={pressureY(pressure)}
              y2={pressureY(pressure)}
            />
          ))}

          {visible.environment && (
            <>
              <path className="sounding-profile sounding-profile--temperature" d={environmentTemperaturePath} />
              <path className="sounding-profile sounding-profile--dewpoint" d={dewpointPath} />
              {scenario.profile.map((level) => {
                const temperature = soundingPoint(level.temperature, level.pressure, soundingChartLayout);
                const dewpoint = soundingPoint(level.dewpoint, level.pressure, soundingChartLayout);
                return (
                  <g key={level.pressure}>
                    <circle className="temperature-point" cx={temperature.x} cy={temperature.y} r="3.5" />
                    <circle className="dewpoint-point" cx={dewpoint.x} cy={dewpoint.y} r="3.5" />
                  </g>
                );
              })}
            </>
          )}

          {visible.parcel && parcelPath && (
            <path className="sounding-profile sounding-profile--parcel" d={parcelPath} />
          )}
        </g>

        {soundingPressureGrid.map((pressure) => (
          <g key={pressure}>
            <text
              className="sounding-axis-label sounding-axis-label--pressure"
              x={soundingChartLayout.left - 10}
              y={pressureY(pressure) + 4}
              textAnchor="end"
            >
              {pressure}
            </text>
          </g>
        ))}
        <text className="sounding-axis-title" x="7" y="18">hPa · log P</text>

        {soundingTemperatureGrid.filter((temperature) => temperature % 20 === 0).map((temperature) => {
          const point = soundingPoint(temperature, 1000, soundingChartLayout);
          return (
            <text
              key={temperature}
              className="sounding-axis-label sounding-axis-label--temperature"
              x={point.x}
              y={soundingChartLayout.top + soundingChartLayout.height + 20}
              textAnchor="middle"
            >
              {temperature}°
            </text>
          );
        })}

        {visible.layers && levelMarkers.map(([label, pressure, type]) => (
          <g key={label} className={`sounding-level-label ${type}`}>
            <rect
              x={soundingChartLayout.left + 5}
              y={pressureY(pressure) - 10}
              width={label === "0°C" ? 42 : 36}
              height="18"
            />
            <text x={soundingChartLayout.left + 12} y={pressureY(pressure) + 3}>{label}</text>
          </g>
        ))}

        {visible.layers && scenario.inversion && (
          <text
            className="sounding-layer-label inversion"
            x={soundingChartLayout.left + soundingChartLayout.width - 8}
            y={pressureY(Math.sqrt(scenario.inversion.bottom * scenario.inversion.top))}
            textAnchor="end"
          >
            {scenario.inversion.label}
          </text>
        )}

        {visible.layers && scenario.cloudLayers.map((layer) => (
          <text
            key={layer.label}
            className="sounding-layer-label cloud"
            x={soundingChartLayout.left + soundingChartLayout.width - 8}
            y={pressureY(Math.sqrt(layer.bottom * layer.top))}
            textAnchor="end"
          >
            {layer.label}
          </text>
        ))}

        <g className={`sounding-wind-profile ${visible.wind ? "" : "hidden"}`}>
          <text x="648" y="25">wiatr z kierunku · kt</text>
          {windLevels.map((level) => {
            const y = pressureY(level.pressure);
            const rotation = level.windDirection + 90;
            return (
              <g key={level.pressure}>
                <g transform={`translate(670 ${y}) rotate(${rotation})`}>
                  <line
                    x1="-12"
                    x2="12"
                    y1="0"
                    y2="0"
                    markerEnd={`url(#wind-arrow-${scenario.id})`}
                  />
                </g>
                <text x="702" y={y + 4}>
                  {String(level.windDirection).padStart(3, "0")}° / {level.windSpeed}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </figure>
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

function PhotoRecognitionModal({ onClose, onCompare, onObserve }) {
  const [phase, setPhase] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const dialogRef = useDialogFocus(onClose);

  const analyze = async (source) => {
    setError(null);
    setResult(null);
    setPhase("capturing");
    try {
      const photo = await captureCloudPhoto(source);
      setPreviewUrl(photo.previewUrl);
      setPhase("analyzing");
      setResult(await recognizeCloudPhoto(photo));
      setPhase("result");
    } catch (failure) {
      if (isPhotoCaptureCancellation(failure)) {
        setPhase(previewUrl ? "result" : "idle");
        return;
      }
      console.error("[CHMURNIK camera]", failure?.code || "unknown", failure?.message || failure);
      setError(photoCaptureErrorMessage(failure));
      setPhase("idle");
    }
  };

  useEffect(() => {
    const qaMode = import.meta.env.VITE_QA_PHOTO_RECOGNITION;
    if (!['result', 'native'].includes(qaMode)) return;
    const cloud = getCloud("cumulus");
    const source = publicAsset(cloud.images[0].src);
    setPreviewUrl(source);
    setPhase("analyzing");
    const encodedPhoto = qaMode === "result"
      ? Promise.resolve("qa")
      : fetch(source)
        .then((response) => response.blob())
        .then((blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));
    encodedPhoto
      .then((base64) => recognizeCloudPhoto(base64))
      .then((value) => {
        setResult(value);
        setPhase("result");
      })
      .catch(() => setPhase("idle"));
  }, []);

  const rankedClouds = result?.ranked
    .filter((item) => item.id !== "clear_sky")
    .map((item) => ({ ...item, cloud: getCloud(item.id) }))
    .filter((item) => item.cloud);
  const leadingFamily = result?.leadingFamily;
  const familyPercent = leadingFamily ? Math.round(leadingFamily.probability * 100) : 0;
  const genusIsDecisive = result?.state === "hypothesis";

  return (
    <div className="modal-backdrop modal-backdrop--center" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="photo-recognition-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Rozpoznawanie chmur ze zdjęcia"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="photo-recognition-header">
          <div>
            <span className="eyebrow">Eksperymentalnie · model na urządzeniu</span>
            <h2>Czytaj zdjęcie</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Zamknij rozpoznawanie"><X size={22} /></button>
        </header>

        <div className="photo-privacy-note">
          <ShieldCheck size={21} weight="bold" />
          <span><strong>Prywatnie.</strong> Analiza odbywa się na tym iPhonie. Zdjęcie nie opuszcza urządzenia.</span>
        </div>

        {previewUrl ? (
          <figure className="photo-recognition-preview">
            <img src={previewUrl} alt="Zdjęcie nieba wybrane do analizy" />
            {phase === "analyzing" && <figcaption>Odczytuję kształt, skalę i światło…</figcaption>}
          </figure>
        ) : (
          <div className="photo-recognition-intro">
            <CameraIcon size={42} weight="light" />
            <div>
              <h3>Pokaż kawałek nieba</h3>
              <p>Najlepiej działa pojedynczy, wyraźny rodzaj chmury bez budynków i bardzo szerokiego horyzontu.</p>
            </div>
          </div>
        )}

        {result && phase === "result" && (
          <div className="photo-recognition-result" aria-live="polite">
            <div className="photo-family-result">
              <span className="eyebrow">Najbliższa rodzina · {familyPercent}% sygnału</span>
              <h3>{leadingFamily.label}</h3>
              <p>{leadingFamily.evidence}</p>
            </div>

            <div className="photo-hypotheses">
              <div>
                <span className="eyebrow">Hipotezy do sprawdzenia</span>
                <small>{genusIsDecisive ? "Pierwsza jest wyraźnie silniejsza" : "Kadr nie rozstrzyga jednego rodzaju"}</small>
              </div>
              <ol>
                {rankedClouds.map((item, index) => (
                  <li key={item.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong><CloudName>{item.cloud.name}</CloudName></strong><small>{item.cloud.polish}</small></div>
                    <b>{Math.round(item.probability * 100)}%</b>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="photo-recognition-caveat">
              <Info size={18} />
              <p><strong>To podpowiedź, nie werdykt.</strong> W próbie 30 niezależnych zdjęć model trafiał rodzinę w 8 na 10 przypadków, a właściwy rodzaj był w pierwszej trójce w ponad 8 na 10.</p>
            </aside>

            <div className="photo-result-actions">
              <button className="button button--coral" onClick={() => onCompare(rankedClouds.map((item) => item.id))} disabled={!rankedClouds.length}>
                Porównaj w atlasie <ArrowRight size={18} />
              </button>
              <button className="button button--ghost" onClick={onObserve}>Sprawdź cechy</button>
            </div>
          </div>
        )}

        {error && <p className="photo-recognition-error" role="alert"><Warning size={18} />{error}</p>}

        <footer className="photo-capture-actions">
          <button onClick={() => analyze("camera")} disabled={phase === "capturing" || phase === "analyzing"}>
            <CameraIcon size={20} /><span>{previewUrl ? "Zrób nowe" : "Zrób zdjęcie"}</span>
          </button>
          <button onClick={() => analyze("photos")} disabled={phase === "capturing" || phase === "analyzing"}>
            <ImageSquare size={20} /><span>Wybierz z biblioteki</span>
          </button>
        </footer>
      </section>
    </div>
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
  const lastImageByCloud = useRef({});
  const buildQuestion = (id) => {
    const questionCloud = getCloud(id);
    return createRecognitionQuestion(id, {
      imageIds: questionCloud.images.map((image) => image.id),
      previousImageId: lastImageByCloud.current[id],
    });
  };
  const [question, setQuestion] = useState(() => {
    const id = cloudIds.includes(initialCloudId)
      ? initialCloudId
      : selectRecognitionCloud(cloudIds, stats);
    return buildQuestion(id);
  });
  const [answer, setAnswer] = useState(null);
  useEffect(() => {
    lastImageByCloud.current[question.cloudId] = question.imageId;
  }, [question.cloudId, question.imageId]);
  const cloud = getCloud(question.cloudId);
  const image = getCloudImage(cloud, question.imageId);
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
    setQuestion(buildQuestion(id));
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
          <img src={publicAsset(image.src)} alt="Chmura do rozpoznania" />
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
                <div><strong><CloudName>{option.name}</CloudName></strong><small>{option.polish}</small></div>
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
                <span>Dlaczego nie <CloudName>{chosenCloud.name}</CloudName>?</span>
                <strong>
                  <CloudName>{chosenCloud.name}</CloudName> ↔ <CloudName>{cloud.name}</CloudName>
                </strong>
                <p>{discriminator}</p>
              </aside>
            )}
            <aside className="recognition-provenance">
              <span className="eyebrow">Dowód w tym kadrze</span>
              <strong>{image.diagnostic}</strong>
              <p>{image.note}</p>
              <small>
                Fot. {image.author} · {image.license} ·{" "}
                <a href={image.page} target="_blank" rel="noreferrer">
                  strona pliku i licencja <ArrowSquareOut size={13} />
                </a>
              </small>
            </aside>
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
            Każdy rodzaj jest ćwiczony na kilku niezależnych fotografiach.
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
      <div className="brand brand--footer">
        <span className="brand-wordmark-mark" aria-hidden="true" />
        <span className="sr-only">Chmurnik</span>
        <span className="brand-descriptor"><i aria-hidden="true" /> atlas chmur i atmosfery</span>
      </div>
      <p>Polski, bezpłatny atlas i pracownia obserwacji chmur. Bez kont, reklam, śledzenia i dźwięku.</p>
      <div>
        <button onClick={() => navigate("sources")}>Źródła</button>
        <a href="https://github.com/jakiesluchawki/chmurnik" target="_blank" rel="noreferrer">GitHub <ArrowSquareOut size={14} /></a>
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
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [photoRecognitionOpen, setPhotoRecognitionOpen] = useState(
    ["result", "native"].includes(import.meta.env.VITE_QA_PHOTO_RECOGNITION),
  );
  const photoRecognitionAvailable = isPhotoRecognitionSupported();

  useEffect(() => {
    if (import.meta.env.VITE_QA_NO_ONBOARDING === "1" || loadOnboarding().completed) return undefined;
    const frame = window.requestAnimationFrame(() => setOnboardingOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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

  const finishOnboarding = () => {
    saveOnboarding({ completed: true, completedAt: new Date().toISOString() });
    setOnboardingOpen(false);
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
            onOpenRecommended={openRecommended}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onOpenRecognition={openRecognition}
            onOpenPhotoRecognition={() => setPhotoRecognitionOpen(true)}
            showPhotoRecognition={photoRecognitionAvailable}
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
      />
      {validRoute !== "home" && (
        <button className="quick-test-button" onClick={() => openRecognition()}>
          <Eye size={20} weight="bold" />
          <span>Sprawdź się</span>
        </button>
      )}
      {placementOpen && <PlacementModal onClose={() => setPlacementOpen(false)} onFinish={chooseProfile} />}
      {onboardingOpen && <OnboardingModal onClose={finishOnboarding} onFinish={finishOnboarding} />}
      {photoRecognitionOpen && (
        <PhotoRecognitionModal
          onClose={() => setPhotoRecognitionOpen(false)}
          onCompare={(ids) => {
            setPhotoRecognitionOpen(false);
            navigate(`atlas/compare/${ids.join(",")}`);
          }}
          onObserve={() => {
            setPhotoRecognitionOpen(false);
            navigate("atlas/observer");
          }}
        />
      )}
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
