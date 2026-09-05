import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  DownloadSimple,
  Heart,
  ImageSquare,
  Plus,
  ShieldCheck,
  SquaresFour,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { clouds } from "../data/clouds.js";
import { compactObservationPhoto } from "../lib/journal.js";
import { localDateKey } from "../lib/daily-cloud.js";
import {
  clearObservationDraft,
  loadObservationDraft,
  saveObservationDraft,
} from "../lib/storage.js";
import {
  confirmedGenera,
  MAX_BACKUP_BYTES,
  normalizeObservation,
  observationFromRecognition,
  observationTitle,
  savedHypothesisMessage,
  parseObservationBackup,
} from "../lib/observations.js";
import {
  deleteObservation,
  downloadFile,
  exportObservations,
  importObservations,
  listObservations,
  observationPhoto,
  pickObservationBackup,
  saveObservation,
  sharePostcard,
} from "../lib/observation-store.js";
import { createObservationPostcard } from "../lib/postcard.js";
import { isMacWorkspace } from "../lib/native-workspace.js";

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const dateLabel = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const statusLabel = (entry) =>
  entry.confirmedCloudId
    ? "Twoje rozpoznanie"
    : entry.hypothesis
      ? "Wynik modelu do sprawdzenia"
      : "Wpis z obserwacji";

export function ObservationPhoto({ entry, className = "", onReady }) {
  const [photo, setPhoto] = useState(null);
  const [failed, setFailed] = useState(false);
  const callback = useRef(onReady);
  callback.current = onReady;
  useEffect(() => {
    let current = true;
    let resource;
    setPhoto(null);
    setFailed(false);
    observationPhoto(entry)
      .then((value) => {
        resource = value;
        if (current) {
          setPhoto(value?.url || null);
          callback.current?.(value?.url || null);
        } else value?.release();
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
      resource?.release();
      callback.current?.(null);
    };
  }, [entry.id, entry.hasPhoto, entry.photoURI]);
  if (photo && !failed)
    return (
      <img
        src={photo}
        className={className}
        alt={`Własne zdjęcie nieba, ${dateLabel(entry.date)}`}
        loading="lazy"
        onError={() => {
          setFailed(true);
          callback.current?.(null);
        }}
      />
    );
  return (
    <div className={`sky-photo-placeholder ${className}`}>
      <ImageSquare size={30} weight="light" />
      <span>
        {failed
          ? "Nie można odczytać zdjęcia"
          : entry.hasPhoto
            ? "Wczytuję zdjęcie"
            : "Obserwacja bez zdjęcia"}
      </span>
    </div>
  );
}

function ObservationDetail({ entry, onBack, onChange, navigate }) {
  const candidates = entry.hypothesis?.state === "clear" ? [] : entry.hypothesis?.candidates || [];
  const [form, setForm] = useState(entry);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [card, setCard] = useState(null);
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await saveObservation(form);
      await onChange();
      setCard(null);
      setNotice(entry.hypothesis ? "Zmiany zapisane. Oryginalny wynik modelu pozostał bez zmian." : "Zmiany zapisane.");
    } catch {
      setNotice(
        "Nie udało się zapisać. Twoje zmiany nadal są w formularzu; sprawdź wolne miejsce.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteObservation(entry.id);
      await onChange();
      onBack();
    } catch {
      setNotice("Nie udało się usunąć obserwacji.");
      setBusy(false);
    }
  };
  const prepareCard = async () => {
    setBusy(true);
    setNotice("");
    try {
      setCard(await createObservationPostcard(entry, photoUrl));
    } catch {
      setNotice(
        "Nie udało się przygotować pocztówki. Spróbuj ponownie po wczytaniu zdjęcia.",
      );
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    setBusy(true);
    try {
      await sharePostcard(card);
    } catch (error) {
      if (error?.name !== "AbortError")
        setNotice("Nie udało się udostępnić. Możesz spróbować ponownie.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="page field-page sky-detail">
      <button className="field-back" onClick={onBack}>
        <ArrowLeft size={18} /> Moje niebo
      </button>
      <header className="field-page-heading">
        <span className="eyebrow">
          {dateLabel(entry.date)} · {statusLabel(entry)}
        </span>
        <h1>{observationTitle(entry)}</h1>
      </header>
      <ObservationPhoto
        entry={entry}
        className="sky-detail-photo"
        onReady={setPhotoUrl}
      />
      {entry.hypothesis && (
        <section className="sky-hypothesis">
          <span className="eyebrow">
            Zapisany wynik analizy
          </span>
          <p>{savedHypothesisMessage(entry.hypothesis)}</p>
          <div>
            {candidates.map((candidate) => (
              <span key={candidate.id}>
                {clouds.find((cloud) => cloud.id === candidate.id)?.name}
              </span>
            ))}
          </div>
          {candidates.length > 0 && <button
            className="field-source"
            onClick={() =>
              navigate(
                `atlas/compare/${candidates.map((candidate) => candidate.id).join(",")}`,
              )
            }
          >
            {candidates.length === 1 ? "Otwórz opis w atlasie" : "Porównaj opisy w atlasie"} <ArrowRight size={16} />
          </button>}
          <details className="photo-technical">
            <summary>Szczegóły zapisanego wyniku</summary>
            <p>Procenty to względne wyniki modelu, nie prawdopodobieństwo poprawnego rozpoznania. Zachowujemy je z chwili analizy; zapisanie obserwacji nie uruchamia jej ponownie.</p>
            {entry.hypothesis.candidates.length > 0 && <dl>
              {entry.hypothesis.candidates.map((candidate) => <div key={candidate.id}>
                <dt>{clouds.find((cloud) => cloud.id === candidate.id)?.name}</dt>
                <dd>{Math.round(candidate.probability * 100)}%</dd>
              </div>)}
            </dl>}
            {entry.hypothesis.family && <p>Etykieta zapisana przy analizie: {entry.hypothesis.family}.</p>}
            <small>Wersja modelu: {entry.hypothesis.modelVersion || "brak informacji"}. Wynik nie służy do oceny bezpieczeństwa lotu ani żeglugi.</small>
          </details>
        </section>
      )}
      <form className="sky-edit-form" onSubmit={save}>
        <h2>Twoje rozpoznanie i notatki</h2>
        <p>
          Wybierz nazwę, jeśli potrafisz rozpoznać chmurę. Możesz też zostawić
          obserwację bez rozpoznania. Twoje zmiany nie zastąpią zapisanego wyniku modelu.
        </p>
        <label>
          Moje rozpoznanie
          <select
            value={form.confirmedCloudId || ""}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({
                ...current,
                confirmedCloudId: value || null,
              }));
            }}
          >
            <option value="">Nie wiem, jaki to rodzaj</option>
            {clouds.map((cloud) => (
              <option key={cloud.id} value={cloud.id}>
                {cloud.name} · {cloud.polish}
              </option>
            ))}
          </select>
        </label>
        <label>
          Miejsce (opcjonalnie)
          <input
            value={form.location}
            maxLength={160}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, location: value }));
            }}
            placeholder="np. Gdynia, brzeg morza"
          />
        </label>
        <label>
          Notatka
          <textarea
            value={form.evidence}
            maxLength={4000}
            rows={4}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, evidence: value }));
            }}
            placeholder="Co widać? Co zmieniło się w ciągu kilku minut?"
          />
        </label>
        <label className="sky-checkbox">
          <input
            type="checkbox"
            checked={form.favorite}
            onChange={(event) => {
              const value = event.target.checked;
              setForm((current) => ({ ...current, favorite: value }));
            }}
          />{" "}
          Ulubiona obserwacja
        </label>
        <button
          type="submit"
          className="button button--primary"
          disabled={busy}
        >
          {busy ? "Trwa operacja…" : "Zapisz zmiany"}
          <Check size={18} />
        </button>
      </form>
      {notice && (
        <p className="sky-notice" role="status">
          {notice}
        </p>
      )}
      {entry.hasPhoto && (
        <section className="sky-share">
          <h2>Wyślij kawałek swojego nieba</h2>
          <p>
            Przygotujemy podgląd z zapisanym zdjęciem, datą i opisem rozpoznania.
            Nie dodamy miejsca, prywatnych notatek ani metadanych EXIF.
            Zapisz zmiany w formularzu, zanim przygotujesz pocztówkę.
          </p>
          {card ? (
            <>
              <img src={card} alt="Podgląd pocztówki przed udostępnieniem" />
              <div className="field-action-row">
                <button
                  className="button button--primary"
                  onClick={share}
                  disabled={busy}
                >
                  Udostępnij pocztówkę
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => setCard(null)}
                >
                  Zamknij podgląd
                </button>
              </div>
            </>
          ) : (
            <button
              className="button button--secondary"
              disabled={!photoUrl || busy}
              onClick={prepareCard}
            >
              Zobacz pocztówkę <ArrowRight size={18} />
            </button>
          )}
        </section>
      )}
      <section className="sky-delete">
        {confirmDelete ? (
          <>
            <p>
              Usunąć tę obserwację i jej zdjęcie z kolekcji? Tej operacji nie
              można cofnąć bez własnej kopii.
            </p>
            <button
              className="button button--secondary"
              onClick={() => setConfirmDelete(false)}
            >
              Zachowaj
            </button>
            <button
              className="button button--ghost"
              onClick={remove}
              disabled={busy}
            >
              Usuń tę obserwację
            </button>
          </>
        ) : (
          <button
            className="field-source"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash size={17} /> Usuń obserwację…
          </button>
        )}
      </section>
    </main>
  );
}

function ObservationForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...observationFromRecognition(null),
    ...(loadObservationDraft() || {}),
  }));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const draftTimer = useRef(null);
  useEffect(() => {
    draftTimer.current = setTimeout(() => {
      const { photo, id, createdAt, ...draft } = form;
      saveObservationDraft(draft);
    }, 350);
    return () => clearTimeout(draftTimer.current);
  }, [form]);
  const attach = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setNotice("");
    try {
      const photo = await compactObservationPhoto(file);
      setForm((value) => ({ ...value, photo }));
    } catch {
      setNotice(
        "Nie udało się odczytać zdjęcia. Wybierz obraz JPEG, PNG lub WebP.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await saveObservation(normalizeObservation(form));
      clearTimeout(draftTimer.current);
      clearObservationDraft();
      await onSaved(form.id);
    } catch {
      setNotice(
        "Nie udało się zapisać. Formularz został zachowany; sprawdź datę i wolne miejsce.",
      );
      setBusy(false);
    }
  };
  return (
    <form className="sky-edit-form" onSubmit={save}>
      <div className="field-section-label">
        <h2>Nowa obserwacja</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onCancel}
          aria-label="Zamknij formularz"
        >
          <X size={20} />
        </button>
      </div>
      <p>Dodaj zdjęcie, notatkę lub oba naraz. Nazwa chmury nie jest wymagana. Zdjęcie dodane w tym formularzu nie jest automatycznie analizowane.</p>
      <label>
        Zdjęcie nieba (opcjonalnie)
        <input type="file" accept="image/*" onChange={attach} disabled={busy} />
      </label>
      {form.photo && (
        <img
          className="sky-form-photo"
          src={form.photo}
          alt="Zdjęcie do zapisania"
        />
      )}
      <div className="sky-form-pair">
        <label>
          Data
          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, date: value }));
            }}
          />
        </label>
        <label>
          Miejsce (opcjonalnie)
          <input
            maxLength={160}
            value={form.location}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, location: value }));
            }}
            placeholder="np. Gdynia"
          />
        </label>
      </div>
      <label>
        Własne rozpoznanie
        <select
          value={form.confirmedCloudId || ""}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({
              ...current,
              confirmedCloudId: value || null,
            }));
          }}
        >
          <option value="">Nie wiem, jaki to rodzaj</option>
          {clouds.map((cloud) => (
            <option key={cloud.id} value={cloud.id}>
              {cloud.name} · {cloud.polish}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notatka
        <textarea
          maxLength={4000}
          value={form.evidence}
          rows={3}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, evidence: value }));
          }}
          placeholder="Opisz kształt chmur, światło albo zmianę, którą udało Ci się zauważyć."
        />
      </label>
      {form.cloud && form.cloud !== "Nierozpoznana" && (
        <p>
          Wcześniejsza wskazówka: {form.cloud}. Potwierdź ją dopiero po
          sprawdzeniu cech.
        </p>
      )}
      <p className="field-safety">
        Tekst formularza zachowuje się jako lokalny szkic. Żeby zapisać także
        zdjęcie i dodać wpis do kolekcji, wybierz „Zapisz obserwację”.
      </p>
      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? "Przygotowuję…" : "Zapisz obserwację"}
        <Check size={18} />
      </button>
      {notice && <p role="alert">{notice}</p>}
    </form>
  );
}

export function SkyCollection({
  navigate,
  selectedId,
  onCapture,
  captureAvailable,
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(() =>
    Boolean(loadObservationDraft()),
  );
  const [favorite, setFavorite] = useState(false);
  const [date, setDate] = useState("");
  const [filter, setFilter] = useState("");
  const [compare, setCompare] = useState(false);
  const [pair, setPair] = useState([]);
  const [limit, setLimit] = useState(36);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [backupParts, setBackupParts] = useState([]);
  const importRef = useRef(null);
  const refresh = async () => {
    const values = await listObservations();
    setEntries(values);
    setError("");
  };
  const load = async () => {
    setLoading(true);
    try {
      await refresh();
    } catch {
      setError(
        "Nie udało się otworzyć kolekcji. Oryginalny dziennik nie został usunięty. Sprawdź wolne miejsce i spróbuj ponownie.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [selectedId]);
  const entry = entries.find((value) => value.id === selectedId);
  const genera = confirmedGenera(entries);
  const filtered = entries.filter(
    (value) =>
      (!favorite || value.favorite) &&
      (!date || value.date === date) &&
      (!filter || value.confirmedCloudId === filter),
  );
  const restoreBackup = async (read) => {
    setBusy(true);
    setNotice("");
    try {
      const text = await read();
      if (text === null) return;
      await importObservations(parseObservationBackup(text));
      await refresh();
      setNotice("Kopia przywrócona. Istniejące wpisy nie zostały nadpisane.");
    } catch (failure) {
      setNotice(
        `Nie przywrócono kopii. ${failure.message || "Sprawdź plik i wolne miejsce."}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const importBackup = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    return restoreBackup(() => {
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error("Kopia ma więcej niż 50 MB. Wybierz pojedynczą część eksportu.");
      return file.text();
    });
  };
  const exportBackup = async () => {
    setBusy(true);
    setNotice("");
    try {
      const result = await exportObservations();
      if (result.parts) {
        setBackupParts(result.parts);
        setNotice(
          "Kopia gotowa. Pobierz wszystkie części poniżej; zawierają zdjęcia, miejsca i notatki.",
        );
      }
    } catch {
      setNotice(
        "Nie udało się przygotować pełnej kopii. Nie usunięto żadnych danych.",
      );
    } finally {
      setBusy(false);
    }
  };
  const toggleFavorite = async (value) => {
    if (busy) return;
    setBusy(true);
    try {
      await saveObservation({ ...value, favorite: !value.favorite });
      await refresh();
    } catch {
      setNotice("Nie udało się zapisać ulubionej obserwacji.");
    } finally {
      setBusy(false);
    }
  };
  const select = (value) => {
    if (!compare) {
      navigate(`journal/${encodeURIComponent(value.id)}`);
      return;
    }
    setPair((current) =>
      current.includes(value.id)
        ? current.filter((id) => id !== value.id)
        : current.length < 2
          ? [...current, value.id]
          : current,
    );
  };
  if (entry)
    return (
      <ObservationDetail
        key={entry.id}
        entry={entry}
        navigate={navigate}
        onBack={() => navigate("journal")}
        onChange={refresh}
      />
    );
  return (
    <main className="page field-page sky-collection">
      <header className="field-page-heading">
        <span className="eyebrow">Twoje zdjęcia i notatki</span>
        <h1>Moje niebo</h1>
        <p>
          Zapisuj zdjęcia nieba i to, co udało Ci się zauważyć. Możesz wracać
          do obserwacji, porównywać je i uzupełniać nazwy chmur, kiedy je rozpoznasz.
        </p>
      </header>
      <div className="sky-top-actions">
        {captureAvailable && (
          <button className="button button--primary" onClick={onCapture}>
            <Camera size={20} /> Rozpoznaj ze zdjęcia
          </button>
        )}
        <button
          className="button button--secondary"
          onClick={() => setFormOpen(!formOpen)}
        >
          <Plus size={19} /> Dodaj wpis
        </button>
      </div>
      {loading && <p role="status">Otwieram Twoją kolekcję…</p>}
      {error && (
        <div className="sky-notice" role="alert">
          <p>{error}</p>
          <button className="button button--secondary" onClick={load}>
            Spróbuj ponownie
          </button>
        </div>
      )}
      {selectedId && !loading && !entry && (
        <p role="status">
          Nie znaleziono tej obserwacji. Poniżej jest Twoja kolekcja.
        </p>
      )}
      {formOpen && !loading && !error && (
        <ObservationForm
          onCancel={() => setFormOpen(false)}
          onSaved={async (id) => {
            setFormOpen(false);
            await refresh();
            navigate(`journal/${encodeURIComponent(id)}`);
          }}
        />
      )}
      {!loading && !error && (
        <>
          <section className="sky-genera">
            <div>
              <strong>Rodzaje w Twoich obserwacjach</strong>
              <span>{genera.length}/10 · według Twoich rozpoznań</span>
            </div>
            <div className="sky-genus-chips">
              {clouds.map((cloud) => (
                <button
                  key={cloud.id}
                  title={cloud.name}
                  aria-label={`Filtr: ${cloud.name}${genera.includes(cloud.id) ? ", masz obserwację" : ", jeszcze brak"}`}
                  aria-pressed={filter === cloud.id}
                  className={genera.includes(cloud.id) ? "is-collected" : ""}
                  onClick={() => setFilter(filter === cloud.id ? "" : cloud.id)}
                >
                  {cloud.code}
                  {genera.includes(cloud.id) && <Check size={12} />}
                </button>
              ))}
            </div>
            <small>
              Liczymy tylko rodzaje wybrane przez Ciebie, nie podpowiedzi modelu.
            </small>
          </section>
          {entries.length > 0 ? (
            <>
              <div className="sky-filters">
                <button
                  className="button button--secondary"
                  aria-pressed={favorite}
                  onClick={() => setFavorite(!favorite)}
                >
                  <Heart size={18} weight={favorite ? "fill" : "regular"} />{" "}
                  Ulubione
                </button>
                <label>
                  Data obserwacji
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
                <button
                  className="button button--secondary"
                  aria-pressed={compare}
                  onClick={() => {
                    setCompare(!compare);
                    setPair([]);
                  }}
                >
                  <SquaresFour size={18} />{" "}
                  {compare ? "Zakończ porównanie" : "Porównaj dwie obserwacje"}
                </button>
              </div>
              {(date || filter || favorite) && (
                <button
                  className="field-source"
                  onClick={() => {
                    setDate("");
                    setFilter("");
                    setFavorite(false);
                  }}
                >
                  Wyczyść filtry
                  {filter
                    ? ` · ${clouds.find((cloud) => cloud.id === filter)?.name}`
                    : ""}
                  <X size={16} />
                </button>
              )}
              {compare && (
                <section className="sky-pair">
                  <p>
                    {pair.length < 2
                      ? pair.length === 1 ? "Wybierz drugą obserwację z kolekcji." : "Wybierz dwie obserwacje z kolekcji."
                      : "Porównaj kształty chmur i oświetlenie na obu zdjęciach. Obserwacje mogą przedstawiać różne rodzaje chmur."}
                  </p>
                  <div>
                    {pair.map((id) => {
                      const value = entries.find((item) => item.id === id);
                      return (
                        <figure key={id}>
                          <ObservationPhoto entry={value} />
                          <figcaption>
                            {dateLabel(value.date)}
                            <strong>{observationTitle(value)}</strong>
                            <small>{statusLabel(value)}</small>
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                </section>
              )}
              <div className="sky-grid">
                {filtered.slice(0, limit).map((value) => (
                  <article
                    className={
                      pair.includes(value.id)
                        ? "sky-card is-selected"
                        : "sky-card"
                    }
                    key={value.id}
                  >
                    <button
                      className="sky-card-main"
                      aria-pressed={
                        compare ? pair.includes(value.id) : undefined
                      }
                      onClick={() => select(value)}
                    >
                      <ObservationPhoto entry={value} />
                      <span className="sky-card-caption">
                        <small>{dateLabel(value.date)}</small>
                        <strong>{observationTitle(value)}</strong>
                        <span>{statusLabel(value)}</span>
                      </span>
                      {pair.includes(value.id) && (
                        <span className="sky-selected">
                          <Check size={19} />
                        </span>
                      )}
                    </button>
                    <button
                      className="sky-favorite"
                      disabled={busy}
                      onClick={() => toggleFavorite(value)}
                      aria-label={`${value.favorite ? "Usuń z" : "Dodaj do"} ulubionych: ${observationTitle(value)}`}
                      aria-pressed={value.favorite}
                    >
                      <Heart
                        size={19}
                        weight={value.favorite ? "fill" : "regular"}
                      />
                    </button>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="sky-notice">
                  Brak obserwacji dla tych filtrów. Wyczyść je, żeby zobaczyć
                  całą kolekcję.
                </p>
              )}
              {filtered.length > limit && (
                <button
                  className="button button--secondary"
                  onClick={() => setLimit(limit + 36)}
                >
                  Pokaż kolejne obserwacje
                </button>
              )}
            </>
          ) : (
            <section className="sky-empty">
              <img
                src={asset("assets/observer-guide-still-life-720.webp")}
                alt=""
              />
              <h2>Tu pojawią się Twoje obserwacje</h2>
              <p>
                Dodaj pierwsze zdjęcie lub notatkę. Nie musisz znać nazwy chmury,
                żeby zachować to, co widzisz. Wpis nie zostanie opublikowany.
              </p>
              <button
                className="button button--primary"
                onClick={captureAvailable ? onCapture : () => setFormOpen(true)}
              >
                {captureAvailable
                  ? "Rozpoznaj ze zdjęcia"
                  : "Dodaj pierwszą obserwację"}
                <ArrowRight size={18} />
              </button>
            </section>
          )}
          <details className="sky-backups">
            <summary>
              <ShieldCheck size={19} /> Prywatność i kopie kolekcji
            </summary>
            <p>
              Zdjęcia i notatki zapisują się na tym urządzeniu. CHMURNIK nie wysyła
              ich na serwer ani nie używa do trenowania modelu. Usunięcie aplikacji
              lub danych witryny może usunąć kolekcję, dlatego warto eksportować
              kopię. Systemowe kopie urządzenia zależą od Twoich ustawień.
            </p>
            <p>
              Pełna kopia zawiera zdjęcia, miejsca i prywatne notatki, więc nie
              udostępniaj jej tak jak pocztówki. Jeśli dane przeniesiono ze starego
              dziennika, jego oryginał pozostaje zapisany lokalnie.
            </p>
            <div className="field-action-row">
              <button
                className="button button--secondary"
                disabled={busy || !entries.length}
                onClick={exportBackup}
              >
                <DownloadSimple size={18} />{" "}
                {busy ? "Przygotowuję…" : "Eksportuj kopię"}
              </button>
              <button
                className="button button--secondary"
                disabled={busy}
                onClick={() => isMacWorkspace() ? restoreBackup(pickObservationBackup) : importRef.current?.click()}
              >
                <UploadSimple size={18} /> Importuj kopię
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={importBackup}
              />
            </div>
            {backupParts.length > 0 && (
              <div className="sky-backup-parts">
                {backupParts.map((blob, index) => (
                  <button
                    className="field-source"
                    key={index}
                    onClick={() =>
                      downloadFile(
                        blob,
                        `chmurnik-moje-niebo-${localDateKey()}-${index + 1}.json`,
                      )
                    }
                  >
                    Pobierz część {index + 1}/{backupParts.length} ·{" "}
                    {(blob.size / 1_000_000).toFixed(1)} MB
                  </button>
                ))}
              </div>
            )}
          </details>
        </>
      )}
      {notice && (
        <p className="sky-notice" role="status">
          {notice}
        </p>
      )}
    </main>
  );
}
