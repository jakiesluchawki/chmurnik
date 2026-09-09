const links = {
  obserwacja: [{ id: "obserwacja", title: "Opis przed nazwą: obejrzyj pełny kadr" }],
  rodziny: [{ id: "rodziny", title: "Porównaj piętro i budowę chmur" }],
  fronty: [{ id: "front", title: "Front i zbocze: co unosi powietrze?" }],
  wiatr: [{ id: "wiatr", title: "Odczytaj ruch chmur i kierunek wiatru" }, { id: "bryza", title: "Skąd bierze się bryza?" }],
  procesy: [
    { id: "chmura", title: "Kiedy pojawi się chmura?" },
    { id: "mgla", title: "Dlaczego nocą może powstać mgła?" },
  ],
  lotnictwo: [{ id: "metar", title: "Odczytaj warstwy i czas w METAR / TAF" }],
  warstwy: [{ id: "wysokosc", title: "Porównaj wysokość nad morzem i nad gruntem" }, { id: "sondaz", title: "Sondaż: od pojedynczego poziomu do Skew-T" }],
  zagrozenia: [{ id: "oblodzenie", title: "Sprawdź, kiedy krople osadzają lód" }, { id: "turbulencja", title: "Porównaj trzy źródła turbulencji" }, { id: "burza", title: "Sprawdź, co podtrzymuje unoszenie powietrza" }],
  ekspert: [{ id: "nazwy", title: "Zbuduj nazwę z obserwacji, nie z domysłów" }],
};

export function weatherWorkshopEntry(base) {
  if (typeof base !== "string" || (base !== "./" && !/^\/(?:[\w-]+\/)*$/.test(base))) return null;
  // Capacitor routes extensionless paths to the root app, not a directory index.
  return `${base}pogoda-preview/index.html`;
}

export function weatherWorkshopCatalog(base) {
  const entry = weatherWorkshopEntry(base);
  return entry ? `${entry}#pracownia` : null;
}

export function weatherLessonLinks(lesson, base) {
  const entry = weatherWorkshopEntry(base);
  if (!entry || !Object.hasOwn(links, lesson)) return [];
  return links[lesson].map(({ id, title }) => ({
    title,
    href: `${entry}?from=${lesson}#${id}`,
  }));
}
