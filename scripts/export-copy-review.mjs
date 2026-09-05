import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fieldQuestions, fieldPrinciples, pairDiscriminators } from "../src/data/field-guide.js";
import { comparisonDimensions, comparisonPresets } from "../src/data/comparison.js";
import { observationVerdict } from "../src/lib/field-guide.js";
import { learningModules, quizQuestions } from "../src/data/learning.js";

const root = new URL("../", import.meta.url);
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
  "<!-- FIELD_VERDICTS -->": verdictCopy,
  "<!-- FIELD_PRINCIPLES -->": fieldPrinciples.map((text) => `- ${text}`).join("\n"),
  "<!-- COMPARISON_COPY -->": comparisonCopy,
  "<!-- LEARNING_CARDS -->": learningModules.map((item) =>
    `### ${item.number}. ${item.title}\n\n${item.level} · ${item.minutes} min\n\n${item.summary}\n\n${item.outcomes.slice(0, 3).map((text) => `- ${text}`).join("\n")}`).join("\n\n"),
  "<!-- LEARNING_QUIZ -->": quizQuestions.map((item, index) =>
    `### Pytanie ${index + 1}\n\n${item.prompt}\n\n${item.options.map((text, option) => `- ${text}${option === item.correct ? " (poprawna)" : ""}`).join("\n")}\n\n${item.explanation}`).join("\n\n"),
};
const sections = [];
for (const name of ["copy-v4-entry-review.md", "copy-v4-recognition-review.md", "copy-v4-atlas-review.md", "copy-v4-learning-review.md"]) {
  let content = await readFile(new URL(`design/${name}`, root), "utf8");
  for (const [marker, value] of Object.entries(substitutions)) content = content.replace(marker, value);
  sections.push(content.trim());
}
const header = `# CHMURNIK V4: całość dotychczasowej redakcji

Jeden dokument zawiera teksty startowe, oprowadzenia, wprowadzenia do pracowni,
pełny przepływ analizy zdjęcia oraz atlas, pięć pytań obserwatora, porównanie,
nawigację nauki, powtórki i quiz.
Zachowuje też niezmienione odpowiedzi i komunikaty potrzebne do oceny całości.
Pytania, warianty odpowiedzi i opisy porównań są pobierane bezpośrednio z kodu.

To wersja robocza, nie opublikowane wydanie. Szczegółowe lekcje, dziennik,
indeks terminów i wszystkie ekrany narzędzi wymagają jeszcze osobnego przeglądu.
Teksty nie stanowią potwierdzenia jakości klasyfikatora ani testu układu ekranów.

Dokument można odtworzyć poleceniem:

    node scripts/export-copy-review.mjs
`;
const output = new URL("design/copy-v4-review.md", root);
await writeFile(output, `${header}\n---\n\n${sections.join("\n\n---\n\n")}\n`);
console.log(fileURLToPath(output));
