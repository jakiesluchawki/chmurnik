import { useEffect, useMemo, useState } from "react";
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
  learningModules,
  placementQuestions,
  quizQuestions,
} from "./data/learning.js";
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
  loadObservationDraft,
  loadProfile,
  loadProgress,
  loadRecognitionStats,
  saveJournal,
  saveObservationDraft,
  saveProfile,
  saveProgress,
  saveRecognitionStats,
} from "./lib/storage.js";
import {
  createRecognitionQuestion,
  recognitionSummary,
  selectRecognitionCloud,
  updateRecognitionStats,
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

const lessonContent = {
  obserwacja: {
    lead:
      "Dobra identyfikacja nie zaczyna się od zgadywania nazwy. Zaczyna się od opisu, który inna osoba mogłaby sprawdzić.",
    blocks: [
      {
        title: "1. Sylwetka",
        body:
          "Czy widzisz oddzielne kłęby, jednolitą warstwę, włókna, fale czy głęboką wieżę? Nazwij geometrię bez używania nazw chmur.",
      },
      {
        title: "2. Skala",
        body:
          "Wyciągnij rękę. Drobne elementy mniejsze od małego palca wspierają wysokie Cirrocumulus, elementy wielkości 1–3 palców częściej wskazują Altocumulus, a większe człony mogą prowadzić do Stratocumulus.",
      },
      {
        title: "3. Światło i opad",
        body:
          "Sprawdź cieniowanie, ostrość tarczy Słońca, halo i to, czy smugi opadu docierają do ziemi. Te cechy są często bardziej rozstrzygające niż kolor.",
      },
      {
        title: "4. Czas",
        body:
          "Jedno zdjęcie zatrzymuje proces. Zapisz, czy chmura rośnie, rozpada się, rozlewa w warstwę albo gęstnieje. Przemiana bywa kluczem do poprawnej nazwy.",
      },
    ],
  },
  rodziny: {
    lead:
      "Nazwy WMO są złożeniami. Kiedy rozumiesz ich części, klasyfikacja staje się mapą, a nie listą do pamięciowego opanowania.",
    blocks: [
      { title: "cirro-", body: "Wysoki poziom i przewaga kryształków lodu." },
      { title: "alto-", body: "Poziom średni; nie oznacza najwyższej chmury." },
      { title: "-stratus", body: "Warstwa albo zasłona." },
      { title: "-cumulus", body: "Człony, kłęby lub rozwój konwekcyjny." },
      { title: "nimbo-", body: "Chmura związana z opadem; w nazwie rodzaju występuje w Nimbostratus." },
    ],
  },
  procesy: {
    lead:
      "Chmura pojawia się, gdy wilgotne powietrze osiąga nasycenie. Najczęściej prowadzi do tego unoszenie i ochładzanie, ale droga może być konwekcyjna, frontowa, orograficzna lub turbulentna.",
    blocks: [
      {
        title: "Stabilność",
        body:
          "W atmosferze stabilnej wychylona porcja powietrza wraca ku poziomowi równowagi, więc łatwiej powstają rozległe warstwy. W niestabilnej dalsze unoszenie jest podtrzymywane i rosną chmury kłębiaste.",
      },
      {
        title: "Inwersja",
        body:
          "Warstwa, w której temperatura rośnie z wysokością, może działać jak pokrywa. Pod nią rozlewa się Stratus lub Stratocumulus, a Cumulus traci pionowy rozpęd.",
      },
      {
        title: "Podstawa nie jest wierzchołkiem",
        body:
          "Podstawa wiąże się z poziomem kondensacji unoszonego powietrza. Wierzchołek zależy od głębokości warstwy niestabilnej, wilgoci, wymuszania i mieszania.",
      },
    ],
  },
  fronty: {
    lead:
      "Sekwencja Cirrus → Cirrostratus → Altostratus → Nimbostratus jest użytecznym modelem frontu ciepłego, ale rzeczywiste niebo może pomijać etapy albo nakładać kilka układów.",
    blocks: [
      {
        title: "Front ciepły",
        body:
          "Łagodne unoszenie na dużym obszarze sprzyja warstwom, które z czasem obniżają się i grubieją. Tempo nie jest uniwersalnym zegarem.",
      },
      {
        title: "Front chłodny",
        body:
          "Silniejsze, węższe wymuszanie może organizować konwekcję, wały szkwałowe lub linię Cumulonimbus. Słaby front nie musi jednak dawać burz.",
      },
      {
        title: "Po przejściu",
        body:
          "Napływ chłodniejszego powietrza nad cieplejsze podłoże często daje pola Cumulus i Stratocumulus z przelotnymi opadami.",
      },
    ],
  },
  wiatr: {
    lead:
      "Chmura nie mierzy wiatru tak jak anemometr. Pokazuje ruch i deformację na własnej wysokości, a wynik trzeba oddzielić od perspektywy, opadania hydrometeorów, propagacji fali i rozwoju samej chmury.",
    blocks: [
      {
        title: "Wiatr jest „z”, ruch jest „do”",
        body:
          "Jeżeli element chmury przemieszcza się ku północnemu wschodowi, prosty dryf adwekcyjny wskazuje wiatr z południowego zachodu. Najpierw nazwij kierunek ruchu, potem odwróć go o 180°.",
      },
      {
        title: "Każda warstwa może płynąć inaczej",
        body:
          "Stratus, Altocumulus i Cirrus mogą jednocześnie poruszać się w różnych kierunkach. To obserwacja uskoku pionowego, nie błąd oka. Zawsze zapisuj rodzaj albo przybliżony poziom obserwowanej chmury.",
      },
      {
        title: "Perspektywa zbiega pasma",
        body:
          "Radiatus wygląda tak, jakby pasma zbiegały się nad horyzontem, choć często są prawie równoległe. Obserwuj ruch fragmentów wysoko nad głową i korzystaj z kilku punktów odniesienia.",
      },
      {
        title: "Chmura może stać mimo silnego wiatru",
        body:
          "Lenticularis jest wytwarzany w stałym obszarze wznoszenia fali: krople kondensują po stronie napływu i zanikają po zawietrznej. Kształt stoi, ale powietrze przepływa przez niego.",
      },
      {
        title: "Virga nie pokazuje samego wiatru",
        body:
          "Smuga opadu opada i jednocześnie jest znoszona. Jej nachylenie łączy prędkość opadania, parowanie oraz zmianę wiatru z wysokością, dlatego nie należy odczytywać go jak prostej chorągiewki.",
      },
      {
        title: "Burza także się propaguje",
        body:
          "Cumulonimbus jest sterowany przepływem, ale nowe komórki mogą rosnąć po jednej stronie układu, a stare zanikać po drugiej. Ruch echa i ruch powietrza nie są zawsze tym samym.",
      },
    ],
  },
  lotnictwo: {
    lead:
      "Kod opisuje obserwację lotniskową w określonym miejscu i czasie. Nie jest pełnym modelem atmosfery ani automatyczną decyzją o bezpieczeństwie.",
    blocks: [
      {
        title: "FEW, SCT, BKN, OVC",
        body:
          "To przedziały pokrycia nieba: 1–2, 3–4, 5–7 i 8 oktantów. Wysokość grupy jest podawana w setkach stóp nad poziomem lotniska.",
      },
      {
        title: "Pułap",
        body:
          "W praktyce operacyjnej pułap tworzy najniższa warstwa BKN lub OVC albo widzialność pionowa. FEW i SCT mogą być ważne, ale nie tworzą ceiling w tym znaczeniu.",
      },
      {
        title: "CB i TCU",
        body:
          "Dopiski wskazują Cumulonimbus lub wypiętrzony Cumulus. Brak dopisku nie dowodzi braku zagrożenia poza bezpośrednim otoczeniem obserwacji.",
      },
    ],
  },
  warstwy: {
    lead:
      "Mapa na poziomie 850 hPa nie pokazuje pogody „1500 metrów nad Tobą”. Pokazuje pole na powierzchni określonego ciśnienia, której wysokość zmienia się przestrzennie i w czasie.",
    blocks: [
      {
        title: "AGL i MSL",
        body:
          "AGL liczy wysokość od lokalnego gruntu, MSL od średniego poziomu morza. Na wysokim terenie ta sama wysokość MSL może znaleźć się bardzo blisko powierzchni.",
      },
      {
        title: "Poziom ciśnienia",
        body:
          "1000, 850 czy 500 hPa są powierzchniami w atmosferze. Ich wysokość odczytuje się z pola geopotencjału, a nie z jednej stałej tabeli.",
      },
      {
        title: "Model a rzeczywistość",
        body:
          "Model wygładza teren i atmosferę w komórkach siatki. W górach niektóre poziomy ciśnienia mogą przebiegać pod powierzchnią modelowego gruntu.",
      },
    ],
  },
  zagrozenia: {
    lead:
      "Niebezpieczeństwo wynika z połączenia fazy wody, temperatury, ruchu pionowego, uskoku wiatru i czasu ekspozycji. Sama nazwa chmury nie daje pełnej odpowiedzi.",
    blocks: [
      {
        title: "Oblodzenie",
        body:
          "Najważniejsza jest obecność przechłodzonej wody ciekłej i ujemnej temperatury. Silne prądy pionowe mogą podtrzymywać duże krople i zwiększać zagrożenie.",
      },
      {
        title: "Turbulencja",
        body:
          "Może być konwekcyjna, mechaniczna, falowa albo występować w czystym powietrzu przy silnym uskoku. Brak chmur nie oznacza braku turbulencji.",
      },
      {
        title: "CAPE i hamowanie",
        body:
          "CAPE opisuje potencjalną energię unoszącej się parceli po spełnieniu założeń. Nie mówi samodzielnie, czy burza powstanie; potrzebne są wilgoć, inicjacja i ocena warstwy hamującej.",
      },
    ],
  },
  ekspert: {
    lead:
      "Pełna nazwa może łączyć rodzaj, gatunek, odmianę, cechę dodatkową, chmurę towarzyszącą oraz informację o przemianie. Nie każda kombinacja jest dopuszczalna.",
    blocks: [
      {
        title: "Rodzaj i gatunek",
        body:
          "Rodzaj jest jedną z dziesięciu głównych kategorii i chmura należy w danym momencie do jednego rodzaju. Gatunek opisuje kształt lub strukturę i nie każdy rodzaj ma gatunki.",
      },
      {
        title: "Odmiana",
        body:
          "Odmiany opisują układ elementów lub przezroczystość. Niektóre mogą współwystępować, dlatego nazwa może być dłuższa bez tworzenia nowego rodzaju.",
      },
      {
        title: "Przemiana i matka",
        body:
          "Genitus wskazuje rozwój z innego rodzaju, mutatus przemianę całej chmury, a homogenitus pochodzenie związane z działalnością człowieka. To opis historii, nie ocena „naturalności”.",
      },
    ],
  },
};

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

  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="source-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Źródła"
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
      <div className="placement-modal" role="dialog" aria-modal="true" aria-label="Diagnoza wiedzy" onMouseDown={(event) => event.stopPropagation()}>
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

function LearnPage({ completed, onToggleCompleted, onSources, initialModule, onConsumeInitial }) {
  const [selected, setSelected] = useState(initialModule || null);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    if (initialModule) {
      setSelected(initialModule);
      onConsumeInitial();
    }
  }, [initialModule, onConsumeInitial]);

  if (selected) {
    const module = learningModules.find((item) => item.id === selected);
    const content = lessonContent[selected];
    const isDone = completed.includes(selected);
    return (
      <main className="page lesson-page">
        <button className="back-button" onClick={() => setSelected(null)}><ArrowLeft size={18} /> Ścieżka nauki</button>
        <div className="lesson-hero">
          <span className="lesson-number">{module.number}</span>
          <div>
            <span className="eyebrow">{module.level} · {module.minutes} min</span>
            <h1>{module.title}</h1>
            <p>{content.lead}</p>
          </div>
        </div>
        <SourceButton ids={module.sourceIds} onOpen={onSources} />
        <div className="lesson-blocks">
          {content.blocks.map((block) => (
            <article key={block.title}>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </article>
          ))}
        </div>
        <div className="lesson-practice">
          <div>
            <span className="eyebrow">Ćwiczenie terenowe</span>
            <h2>Opisz niebo przez 90 sekund bez użycia nazwy chmury.</h2>
            <p>Zapisz wysokość pozorną, budowę, cieniowanie, opad i kierunek zmiany. Dopiero potem otwórz atlas.</p>
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
            <button className="learning-card" key={module.id} onClick={() => setSelected(module.id)}>
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

      <section className="quiz-invite">
        <div>
          <span className="eyebrow">Krótki sprawdzian</span>
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
      <div className="quiz-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
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

function AtlasPage({ onSources, onSaveObservation, initialTab = "atlas" }) {
  const [tab, setTab] = useState(initialTab);
  const [level, setLevel] = useState("wszystkie");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [comparisonIds, setComparisonIds] = useState(comparisonPresets[1].cloudIds);
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

  const choose = (optionId) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
  };

  const next = () => {
    if (!selectedId) return;
    if (step === fieldQuestions.length - 1) setResultsOpen(true);
    else setStep((current) => current + 1);
  };

  const reset = () => {
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
            <h2>Trzy hipotezy, nie jeden werdykt</h2>
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
              onClick={() => setStep(index)}
              disabled={!answers[item.id] && index > step}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Krok ${index + 1}: ${item.prompt}`}
            >
              {answers[item.id] ? <Check size={14} /> : index + 1}
            </button>
          ))}
        </div>
        <span className="eyebrow">{question.eyebrow}</span>
        <h3>{question.prompt}</h3>
        <p className="field-question-help">{question.help}</p>
        <div className="field-options">
          {question.options.map((option) => (
            <button
              key={option.id}
              className={selectedId === option.id ? "selected" : ""}
              onClick={() => choose(option.id)}
              aria-pressed={selectedId === option.id}
            >
              <span>{selectedId === option.id ? <Check size={18} weight="bold" /> : null}</span>
              <div><strong>{option.label}</strong><small>{option.description}</small></div>
            </button>
          ))}
        </div>
        <footer className="field-question-actions">
          <button
            className="text-button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
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

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <article className="cloud-detail" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
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
  if (!term) return null;
  const category = taxonomyCategories.find((item) => item.id === term.category);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <article className="term-detail" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
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

function RecognitionTest({ stats, onUpdateStats, onClose, onSources }) {
  const cloudIds = clouds.map((cloud) => cloud.id);
  const [question, setQuestion] = useState(() => {
    const id = selectRecognitionCloud(cloudIds, stats);
    return createRecognitionQuestion(id);
  });
  const [answer, setAnswer] = useState(null);
  const cloud = getCloud(question.cloudId);
  const summary = recognitionSummary(stats);

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
      <section className="recognition-test" role="dialog" aria-modal="true" aria-label="Test rozpoznawania chmur" onMouseDown={(event) => event.stopPropagation()}>
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
          <div className={`recognition-feedback ${answer === question.cloudId ? "is-correct" : "is-wrong"}`}>
            <span className="eyebrow">{answer === question.cloudId ? "Trafnie" : `Poprawna odpowiedź: ${cloud.name}`}</span>
            <h3>{cloud.headline}</h3>
            <ul>{cloud.observe.map((item) => <li key={item}><Eye size={16} />{item}</li>)}</ul>
            <p><strong>Pułapka:</strong> {cloud.trap}</p>
            <div className="recognition-feedback-actions">
              <SourceButton ids={cloud.sourceIds} onOpen={onSources} compact />
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
  const [recognitionStats, setRecognitionStats] = useState(loadRecognitionStats);

  const [routeName, routeDetail] = route.split("/");
  const validRoute = useMemo(
    () => [...navItems.map((item) => item.id), "sources"].includes(routeName) ? routeName : "home",
    [routeName],
  );

  const chooseProfile = (result) => {
    setProfile(result);
    saveProfile(result);
    setPlacementOpen(false);
    setEntryModule(result.moduleId);
    navigate("learn");
  };

  const openRecommended = () => {
    setEntryModule(profile?.moduleId || "obserwacja");
    navigate("learn");
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
            initialModule={entryModule}
            onConsumeInitial={() => setEntryModule(null)}
          />
        )}
        {validRoute === "atlas" && (
          <AtlasPage
            onSources={setSourceIds}
            onSaveObservation={saveFieldObservation}
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
      <BottomNav route={validRoute} navigate={navigate} />
      <button className="quick-test-button" onClick={() => setRecognitionOpen(true)}>
        <Eye size={20} weight="bold" />
        <span>Sprawdź się</span>
      </button>
      {placementOpen && <PlacementModal onClose={() => setPlacementOpen(false)} onFinish={chooseProfile} />}
      {sourceIds && <SourceDrawer ids={sourceIds} onClose={() => setSourceIds(null)} />}
      {recognitionOpen && (
        <RecognitionTest
          stats={recognitionStats}
          onUpdateStats={updateRecognition}
          onClose={() => setRecognitionOpen(false)}
          onSources={(ids) => {
            setRecognitionOpen(false);
            setSourceIds(ids);
          }}
        />
      )}
    </div>
  );
}
