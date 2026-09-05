import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fieldQuestions, fieldPrinciples, pairDiscriminators } from "../src/data/field-guide.js";
import { comparisonDimensions, comparisonPresets } from "../src/data/comparison.js";
import { observationVerdict } from "../src/lib/field-guide.js";
import { learningModules, quizQuestions } from "../src/data/learning.js";
import { layersHeadings, windyReadingSteps, windCaveats, hazardCards, soundingReadingSteps } from "../src/data/layers-copy.js";
import { soundingScenarios, soundingGlossary } from "../src/data/soundings.js";
import { windFromCloudMotion } from "../src/lib/wind.js";
import { clouds } from "../src/data/clouds.js";
import { savedHypothesisMessage } from "../src/lib/observations.js";
import { metarStructurePhases, metarDecodeSections, metarTrainingScenarios, tafTrainingScenarios, aviationBriefingSets } from "../src/data/metar-training.js";
import { cloudBands, pressureLevels, weatherLayers } from "../src/data/weather-layers.js";
import { weatherLayerReading } from "../src/lib/weather-layers.js";
import { getSources } from "../src/data/sources.js";
import { metarExamples, tafExamples, practiceCases } from "../src/data/field-practice.js";
import { decodeAviationReport, tafGroupMeaning } from "../src/lib/taf-reader.js";

const root = new URL("../", import.meta.url);
function trainingQuestions(items) {
  return items.map((question, index) => [
    `**${index + 1}. ${question.stage}: ${question.prompt}**`,
    ...question.options.map((text, choice) => `- **${String.fromCharCode(65 + choice)}.** ${text}${choice === question.correct ? " (poprawna)" : ""}`),
    question.explanation,
  ].join("\n\n")).join("\n\n");
}
const questionCopy = fieldQuestions.map((question) => [
  `### ${question.eyebrow}`,
  `**${question.prompt}**`, question.help,
  ...question.options.map((option) => `- **${option.label}**: ${option.description}\n  Tekst w podsumowaniu: „${option.signal}”.`),
].join("\n\n")).join("\n\n");
const verdictCopy = [[], [{ score: 4 }], [{ score: 20 }, { score: 10 }],
  [{ score: 14 }, { score: 10 }], [{ score: 11 }, { score: 10 }]]
  .map((results) => observationVerdict(results))
  .map((value) => `### ${value.label}\n\n${value.explanation}`).join("\n\n");
const comparisonCopy = [
  "### Gotowe pary", ...comparisonPresets.map((item) => `- **${item.label}**: ${item.title}`),
  "### Sekcje porównania", ...comparisonDimensions.map((item) =>
    `**${item.number}. ${item.title}** (${item.eyebrow})\n\n${item.description}`),
  "### Różnice między parami", ...Object.entries(pairDiscriminators).map(([ids, text]) =>
    `**${ids.split("|").join(" / ")}**\n\n${text}`),
].join("\n\n");
const substitutions = { "<!-- FIELD_QUESTIONS -->": questionCopy,
  "<!-- FIELD_REPORT_EXAMPLES -->": [...metarExamples, ...tafExamples].map((example) => {
    const result = decodeAviationReport(example.report);
    const groups = result.type === "TAF" ? [...result.groups, ...result.segments.flatMap((segment) => segment.conditions.groups)] : result.groups;
    return [`### ${example.label}`, `\`${example.report}\``,
      example.synthetic === false ? "Przykładowa depesza, nie bieżąca pogoda." : "Przykład szkoleniowy.",
      ...groups.map((group) => `- **${group.code} · ${group.label}**: ${group.detail}`),
      ...(result.warnings || []).map((warning) => `**Uwaga:** ${warning}`),
    ].join("\n\n");
  }).join("\n\n") + "\n\n" + Object.values(tafGroupMeaning).map((group) => `**${group.label}**\n\n${group.detail}`).join("\n\n"),
  "<!-- FIELD_PRACTICE_CASES -->": practiceCases.map((item) => [
    `### ${item.title}`, `**Pracownia:** ${item.track}`, item.context, item.question,
    ...item.choices.map((text, choice) => `- **${String.fromCharCode(65 + choice)}.** ${text}${choice === item.answer ? " (poprawna)" : ""}`),
    item.explanation, `**Wniosek:** ${item.takeaway}`,
    `Źródła: ${getSources(item.sources).map((source) => `[${source.title}](${source.url})`).join(", ")}.`,
  ].join("\n\n")).join("\n\n"),
  "<!-- METAR_PHASES -->": metarStructurePhases.map((phase) => `### ${phase.number}. ${phase.title}\n\n${phase.pattern}\n\n${phase.detail}`).join("\n\n"),
  "<!-- METAR_SECTIONS -->": metarDecodeSections.map((section) => [
    `### ${section.title}`, `**${section.shortLabel}** · ${section.position}`,
    section.purpose, `**Budowa:** ${section.syntax}`,
    ...section.examples.map((example) => `- **${example.code}**: ${example.meaning}`),
    ...(section.spotlight ? [`**${section.spotlight.code} · ${section.spotlight.expansion}**`, section.spotlight.meaning, section.spotlight.limits] : []),
    `**Uważaj:** ${section.watchFor}`,
  ].join("\n\n")).join("\n\n"),
  "<!-- METAR_SCENARIOS -->": metarTrainingScenarios.map((scenario) => [
    `### ${scenario.station}: ${scenario.title}`, scenario.context, `\`${scenario.report}\``,
    ...scenario.groups.map((group) => `- **${group.token} · ${group.label}**: ${group.meaning}${group.ceiling ? " Ta grupa może tworzyć pułap." : ""}`),
    trainingQuestions(scenario.questions),
  ].join("\n\n")).join("\n\n"),
  "<!-- TAF_SCENARIOS -->": tafTrainingScenarios.map((scenario) => [
    `### ${scenario.station}: ${scenario.title}`, scenario.context, `\`${scenario.report}\``,
    ...scenario.timeline.map((period) => `**${period.time} · ${period.label}**\n\n${period.detail}`),
    trainingQuestions(scenario.questions),
  ].join("\n\n")).join("\n\n"),
  "<!-- BRIEFING_SCENARIOS -->": aviationBriefingSets.map((briefing) => [
    `### ${briefing.title}`, briefing.kicker, briefing.context,
    ...briefing.reports.map((report) => {
      const scenario = metarTrainingScenarios.find((item) => item.id === report.scenarioId);
      return `**${report.role} · ${scenario.station}**\n\n${report.note}\n\n\`${scenario.report}\``;
    }),
    trainingQuestions(briefing.questions),
  ].join("\n\n")).join("\n\n"),
  "<!-- COLLECTION_CLOUD_NAMES -->": clouds.map((cloud) => `- **${cloud.code}: ${cloud.name}** · ${cloud.polish}`).join("\n"),
  "<!-- SAVED_HYPOTHESIS_MESSAGES -->": [
    { label: "Niebo głównie bez chmur", state: "clear", candidates: [] },
    { label: "Brak propozycji", state: "ambiguous", candidates: [] },
    { label: "Hipoteza rodzaju", state: "hypothesis", candidates: [{ id: "cumulus" }] },
    { label: "Nierozstrzygnięte propozycje", state: "uncertain", candidates: [{ id: "cumulus" }] },
  ].map((item) => `**${item.label}**\n\n${savedHypothesisMessage(item)}`).join("\n\n"),
  "<!-- FIELD_VERDICTS -->": verdictCopy,
  "<!-- FIELD_PRINCIPLES -->": fieldPrinciples.map((text) => `- ${text}`).join("\n"),
  "<!-- COMPARISON_COPY -->": comparisonCopy,
  "<!-- LEARNING_CARDS -->": learningModules.map((item) =>
    `### ${item.number}. ${item.title}\n\n${item.level} · ${item.minutes} min\n\n${item.summary}\n\n${item.outcomes.slice(0, 3).map((text) => `- ${text}`).join("\n")}`).join("\n\n"),
  "<!-- LEARNING_QUIZ -->": quizQuestions.map((item, index) =>
    `### Pytanie ${index + 1}\n\n${item.prompt}\n\n${item.options.map((text, option) => `- ${text}${option === item.correct ? " (poprawna)" : ""}`).join("\n")}\n\n${item.explanation}`).join("\n\n"),
  "<!-- LAYERS_HEADINGS -->": Object.values(layersHeadings).map(([eyebrow, title, intro]) =>
    `### ${title}\n\n${eyebrow}\n\n${intro}`).join("\n\n"),
  "<!-- WINDY_STEPS -->": windyReadingSteps.map(([number, title, copy]) =>
    `${number}. **${title}**: ${copy}`).join("\n\n"),
  "<!-- PRESSURE_LEVELS -->": Object.entries(pressureLevels).map(([pressure, level]) =>
    `- **${pressure} hPa**, około ${level.altitude} m MSL: ${level.use}.`).join("\n"),
  "<!-- WIND_DIRECTIONS -->": Array.from({ length: 8 }, (_, i) => windFromCloudMotion(i * 45))
    .map((value) => `- Ruch na **${value.towardLabel}** (${value.toward}°): wiatr z **${value.fromLabel}** (${value.from}°).`).join("\n"),
  "<!-- WIND_CAVEATS -->": windCaveats.map(([title, copy]) => `### ${title}\n\n${copy}`).join("\n\n"),
  "<!-- HAZARD_CARDS -->": hazardCards.map((item) => `### ${item.title}\n\n${item.text}`).join("\n\n"),
  "<!-- SOUNDING_STEPS -->": soundingReadingSteps.map(([number, title, copy]) => `${number}. **${title}**: ${copy}`).join("\n\n"),
  "<!-- SOUNDING_GLOSSARY -->": soundingGlossary.map((item) => `**${item.term}: ${item.polish}**\n\n${item.explanation}`).join("\n\n"),
  "<!-- SOUNDING_SCENARIOS -->": soundingScenarios.map((item) => [
    `#### ${item.number}. ${item.title}`, `**${item.label}**`, item.short, item.sourceType,
    `**Skąd unosimy powietrze:** ${item.parcelOrigin}`,
    `LCL: ${item.levels.lcl ?? "brak"} hPa · LFC: ${item.levels.lfc ? `${item.levels.lfc} hPa` : "nie osiąga"} · EL: ${item.levels.el ? `${item.levels.el} hPa` : item.levels.elUnresolved ? "Nie wyznaczono w profilu" : "Brak w tym przykładzie"} · 0°C: ${item.levels.freezing} hPa.`,
    "**Podpisy warstw:**", ...[item.inversion, ...item.cloudLayers].filter(Boolean).map((layer) => `- ${layer.label}`),
    `**${item.reading.verdict}**`,
    ...Object.entries({ "Czy powietrze może się unosić?": item.reading.stability, "Wilgoć i chmury": item.reading.moisture,
      "Wiatr z wysokością": item.reading.wind, "Znaczenie lotnicze": item.reading.aviation, "Czego ten profil nie dowodzi": item.reading.uncertainty })
      .map(([title, copy]) => `**${title}**\n\n${copy}`),
    `**Ćwiczenie:** ${item.check.prompt}`,
    ...item.check.options.map((text, option) => `- **${String.fromCharCode(65 + option)}.** ${text}${option === item.check.correct ? " (poprawna)" : ""}`),
    item.check.explanation,
  ].join("\n\n")).join("\n\n"),
  "<!-- WEATHER_LAYERS -->": weatherLayers.map((layer) => {
    const cases = layer.supportsPressure ? [{ pressure: 850, terrain: 300 }, { pressure: 925, terrain: 700 }, { pressure: 1000, terrain: 300 }]
      : layer.supportsCloudBand ? Object.keys(cloudBands).map((cloudBand) => ({ cloudBand })) : [{}];
    return [
      `### ${layer.label}`, layer.category, `**Pytanie:** ${layer.question}`,
      "**Przykłady opisu ustawień** (liczby zmieniają się z suwakami):",
      ...cases.map((settings) => weatherLayerReading(layer.id, settings)),
      `**Jednostka:** ${layer.unit}`, `**Układ odniesienia:** ${layer.reference}`,
      "**Co jeszcze warto sprawdzić:**", ...layer.compare.map((text) => `- ${text}`),
      `**Najczęstsza pułapka:** ${layer.trap}`,
      `**Ćwiczenie:** ${layer.check.prompt}`,
      ...layer.check.options.map((text, option) => `- **${String.fromCharCode(65 + option)}.** ${text}${option === layer.check.correct ? " (poprawna)" : ""}`),
      layer.check.explanation,
      `Źródła: ${getSources(layer.sourceIds).map((source) => `[${source.title}](${source.url})`).join(", ")}.`,
    ].join("\n\n");
  }).join("\n\n"),
};
const sections = [];
for (const name of ["copy-v4-entry-review.md", "copy-v4-recognition-review.md", "copy-v4-atlas-review.md", "copy-v4-learning-review.md", "copy-v4-layers-review.md", "copy-v4-weather-workshops-review.md", "copy-v4-collection-review.md", "copy-v4-metar-review.md", "copy-v4-field-tools-review.md"]) {
  let content = await readFile(new URL(`design/${name}`, root), "utf8");
  for (const [marker, value] of Object.entries(substitutions)) content = content.replace(marker, value);
  sections.push(content.trim());
}
const header = `# CHMURNIK V4: całość dotychczasowej redakcji

Jeden dokument zawiera teksty startowe, oprowadzenia, wprowadzenia do pracowni,
pełny przepływ analizy zdjęcia oraz atlas, pięć pytań obserwatora, porównanie,
nawigację nauki, powtórki, quiz, czytnik Windy, schemat wysokości,
wiatr z ruchu chmur, zagrożenia, wszystkie cztery profile atmosfery oraz kolekcję
obserwacji, pocztówki, kopie, cały warsztat szkoleniowy METAR/TAF, czytnik
wklejanych depesz, symulator wiatru i ćwiczenia odczytu map.
Zachowuje też niezmienione odpowiedzi i komunikaty potrzebne do oceny całości.
Pytania, warianty odpowiedzi i opisy porównań są pobierane bezpośrednio z kodu.

To wersja robocza, nie opublikowane wydanie. Szczegółowe lekcje,
indeks terminów i monografie poszczególnych chmur wymagają jeszcze osobnego
przeglądu.
Teksty nie stanowią potwierdzenia jakości klasyfikatora ani testu układu ekranów.

Dokument można odtworzyć poleceniem:

    node scripts/export-copy-review.mjs
`;
const output = new URL("design/copy-v4-review.md", root);
await writeFile(output, `${header}\n---\n\n${sections.join("\n\n---\n\n")}\n`);
console.log(fileURLToPath(output));
