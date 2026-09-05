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
    title: "Kształt i widoczne cechy",
    description:
      "Porównaj kształt, wielkość elementów i sposób przepuszczania światła. Sam kolor nie wystarcza do rozpoznania.",
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
      "Podobne chmury mogą powstawać w różny sposób. Żeby ocenić przyczynę, trzeba uwzględnić ich zmiany i szerszą sytuację pogodową.",
    value: ({ profile }) => profile.formation,
  },
  {
    id: "evolution",
    number: "04",
    eyebrow: "Czas",
    title: "Jak zwykle się rozwija",
    description:
      "Obserwuj, czy chmura grubieje, rozpada się, rośnie lub zaczyna tworzyć włóknisty wierzchołek. Zmiany w czasie pomagają odróżnić podobne rodzaje.",
    value: ({ profile }) => profile.evolution,
  },
  {
    id: "weather",
    number: "05",
    eyebrow: "Interpretacja",
    title: "Co mówi o sytuacji pogodowej",
    description:
      "Rodzaj chmury jest jedną ze wskazówek, nie samodzielną prognozą. Ważne są też zasięg zachmurzenia i kierunek zmian.",
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
    eyebrow: "Podobne cechy",
    title: "Co łatwo pomylić",
    description:
      "Sprawdź również, co nie pasuje do wybranego rodzaju. Podobieństwo na pierwszy rzut oka może być mylące.",
    value: ({ cloud }) => [cloud.trap],
    tone: "warning",
  },
];

export function defaultComparisonIds(cloudId) {
  return comparisonPresets.find((preset) => preset.cloudIds.includes(cloudId))?.cloudIds
    || comparisonPresets[0].cloudIds;
}
