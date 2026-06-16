export const comparisonPresets = [
  {
    id: "cirrus-cirrostratus",
    label: "Ci / Cs",
    title: "Włókna czy zasłona?",
    cloudIds: ["cirrus", "cirrostratus"],
  },
  {
    id: "cirrocumulus-altocumulus",
    label: "Cc / Ac",
    title: "Skala drobnych elementów",
    cloudIds: ["cirrocumulus", "altocumulus"],
  },
  {
    id: "cirrostratus-altostratus",
    label: "Cs / As",
    title: "Halo czy matowe szkło?",
    cloudIds: ["cirrostratus", "altostratus"],
  },
  {
    id: "altocumulus-stratocumulus",
    label: "Ac / Sc",
    title: "Średnie czy niskie człony?",
    cloudIds: ["altocumulus", "stratocumulus"],
  },
  {
    id: "altostratus-nimbostratus",
    label: "As / Ns",
    title: "Warstwa czy system opadowy?",
    cloudIds: ["altostratus", "nimbostratus"],
  },
  {
    id: "nimbostratus-stratus",
    label: "Ns / St",
    title: "Głęboki opad czy niska warstwa?",
    cloudIds: ["nimbostratus", "stratus"],
  },
  {
    id: "stratocumulus-stratus",
    label: "Sc / St",
    title: "Człony czy jednolita pokrywa?",
    cloudIds: ["stratocumulus", "stratus"],
  },
  {
    id: "cumulus-cumulonimbus",
    label: "Cu / Cb",
    title: "Kalafior czy już zlodzenie?",
    cloudIds: ["cumulus", "cumulonimbus"],
  },
];

export const comparisonDimensions = [
  {
    id: "appearance",
    number: "01",
    eyebrow: "Obraz",
    title: "Sylwetka i cechy widoczne",
    description:
      "Najpierw porównaj geometrię, skalę i światło. To najsilniejsza obrona przed zgadywaniem po kolorze.",
    value: ({ cloud }) => cloud.observe,
  },
  {
    id: "composition",
    number: "02",
    eyebrow: "Mikrofizyka",
    title: "Z czego zbudowana jest chmura",
    description:
      "Krople, przechłodzona woda i kryształki lodu wpływają na wygląd, opad, oblodzenie i przemiany.",
    value: ({ profile }) => [profile.composition],
  },
  {
    id: "formation",
    number: "03",
    eyebrow: "Geneza",
    title: "Jak najczęściej powstaje",
    description:
      "Ten sam wygląd może mieć różne przyczyny. Mechanizm powstania jest hipotezą sprawdzaną w czasie i w całej sytuacji pogodowej.",
    value: ({ profile }) => profile.formation,
  },
  {
    id: "evolution",
    number: "04",
    eyebrow: "Czas",
    title: "Jak zwykle się rozwija",
    description:
      "Przemiana bywa bardziej diagnostyczna niż pojedynczy kadr. Obserwuj grubienie, rozpad, wzrost i zmianę fazy.",
    value: ({ profile }) => profile.evolution,
  },
  {
    id: "weather",
    number: "05",
    eyebrow: "Interpretacja",
    title: "Co może znaczyć pogodowo",
    description:
      "Nazwa chmury jest jednym dowodem, nie samodzielną prognozą. Liczy się układ, zasięg i kierunek zmian.",
    value: ({ profile }) => profile.weather,
  },
  {
    id: "aviation",
    number: "06",
    eyebrow: "Lotnictwo",
    title: "Znaczenie operacyjne i ograniczenia",
    description:
      "Porównanie pokazuje potencjalne zagrożenia, ale nie zastępuje odprawy, depesz, ostrzeżeń ani procedur.",
    value: ({ profile }) => profile.aviation,
  },
  {
    id: "trap",
    number: "07",
    eyebrow: "Diagnostyka",
    title: "Najważniejsza pułapka",
    description:
      "Dobra identyfikacja nie tylko zbiera cechy zgodne. Aktywnie szuka powodu, dla którego pierwsza nazwa może być błędna.",
    value: ({ cloud }) => [cloud.trap],
    tone: "warning",
  },
];

export function defaultComparisonIds(cloudId) {
  return comparisonPresets.find((preset) => preset.cloudIds.includes(cloudId))?.cloudIds
    || comparisonPresets[0].cloudIds;
}
