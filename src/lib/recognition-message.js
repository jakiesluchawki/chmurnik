export function recognitionMessage(result, candidate) {
  if (result?.quality?.status === "low_light") {
    return {
      kind: "limited",
      title: "Za mało światła na rozpoznanie",
      text: "Na tym zdjęciu trudno odczytać strukturę chmur. Możesz zachować obserwację bez rozpoznania albo spróbować wyraźniejszego ujęcia zrobionego za dnia.",
      showComparison: false,
    };
  }
  if (result?.state === "clear") {
    return {
      kind: "clear",
      title: "Bez wyraźnych chmur",
      text: "Model wskazuje głównie niebo bez chmur. Cienkie pasma mogą jednak umknąć analizie. Jeśli je widzisz, wskaż ten fragment.",
      showComparison: false,
    };
  }
  if (result?.ranked?.[0]?.id === "clear_sky") {
    return {
      kind: "ambiguous",
      title: "Brak wiarygodnej podpowiedzi",
      text: "Ten wynik nie wystarcza, żeby wskazać rodzaj chmury ani potwierdzić bezchmurne niebo. Jeśli widzisz chmurę, zaznacz ją na zdjęciu albo przejdź do rozpoznawania po cechach.",
      showComparison: false,
    };
  }
  if (result?.state === "hypothesis" && candidate) {
    return {
      kind: "hypothesis",
      title: `Najbardziej pasuje ${candidate.name}`,
      text: `To hipoteza do sprawdzenia. ${candidate.headline} Porównaj te cechy ze swoim zdjęciem poniżej.`,
      showComparison: true,
    };
  }
  return {
    kind: "ambiguous",
    title: "Nie udało się rozpoznać rodzaju chmury",
    text: candidate
      ? "Model nie potrafi wybrać jednej nazwy. Poniżej możesz porównać swoje zdjęcie z propozycjami z atlasu. Żadna z nich nie jest potwierdzonym rozpoznaniem."
      : "Model nie podał propozycji do porównania. Możesz zaznaczyć inny fragment zdjęcia, rozpoznać chmurę po jej cechach albo zapisać obserwację bez nazwy.",
    showComparison: Boolean(candidate),
  };
}
