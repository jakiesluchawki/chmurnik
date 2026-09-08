const links = {
  obserwacja: [{ id: "obserwacja", title: "Opis przed nazwą: obejrzyj pełny kadr" }],
  rodziny: [{ id: "rodziny", title: "Porównaj piętro i budowę chmur" }],
  fronty: [{ id: "front", title: "Front i zbocze: co unosi powietrze?" }],
  wiatr: [{ id: "wiatr", title: "Śledź ruch chmur na dwóch poziomach" }, { id: "bryza", title: "Skąd bierze się bryza?" }],
  procesy: [
    { id: "chmura", title: "Kiedy pojawi się chmura?" },
    { id: "mgla", title: "Dlaczego nocą może powstać mgła?" },
  ],
  lotnictwo: [{ id: "metar", title: "Zmień warstwę i odczytaj METAR / TAF" }],
  warstwy: [{ id: "wysokosc", title: "Porównaj wysokość nad morzem i nad gruntem" }, { id: "sondaz", title: "Sondaż: od pojedynczego poziomu do Skew-T" }],
  zagrozenia: [{ id: "oblodzenie", title: "Sprawdź, kiedy krople osadzają lód" }, { id: "turbulencja", title: "Porównaj trzy źródła turbulencji" }, { id: "burza", title: "Złóż warunki rozwoju burzy" }],
  ekspert: [{ id: "nazwy", title: "Zbuduj nazwę z obserwacji, nie z domysłów" }],
};

export function weatherLessonLinks(lesson, base) {
  if (base !== "/chmurnik/" || !Object.hasOwn(links, lesson)) return [];
  return links[lesson].map(({ id, title }) => ({
    title,
    href: `${base}pogoda-preview/?from=${lesson}#${id}`,
  }));
}
