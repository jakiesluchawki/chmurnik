export function recognitionMessage(result, candidate) {
  if (result?.quality?.status === "low_light") {
    return {
      kind: "limited",
      title: "Za mało światła na rozpoznanie",
      text: "Na tym zdjęciu trudno odczytać strukturę chmur. Zachowaj obserwację albo spróbuj wyraźniejszego ujęcia. Nie przypisuję nazwy na siłę.",
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
    title: "Nie rozstrzygam rodzaju",
    text: "Ten kadr nie daje modelowi wystarczająco wyraźnej odpowiedzi. Poniżej są możliwości do porównania, nie rozpoznane chmury. Możesz też wskazać inną część nieba.",
    showComparison: Boolean(candidate),
  };
}
