import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("entry screens explain actions without the rejected slogans or time promises", async () => {
  const app = await read("src/App.jsx");
  const home = await read("src/components/FieldHome.jsx");
  for (const copy of [app, home]) {
    assert.doesNotMatch(copy, /Zauważ niebo|Jedna dobra obserwacja|Na wodę\. W powietrze|Jedna minuta wystarczy/);
    assert.match(copy, /Poznaj chmury nad sobą/);
  }
  assert.match(home, /sprawdź podpowiedź modelu i porównaj ją z atlasem/);
  assert.match(app, /Model może się pomylić/);
  assert.match(app, /Zapiszesz całe zdjęcie wraz z dostępnym wynikiem analizy/);
  const css = await read("src/zgrywa.css");
  const headings = [...css.matchAll(/\.compact-home h1\s*\{([^}]+)\}/g)];
  assert.ok(headings.length > 0);
  for (const [, rule] of headings) assert.doesNotMatch(rule, /white-space:\s*nowrap/);
});

test("practice introductions distinguish observation, forecast and simulation", async () => {
  const practice = await read("src/components/FieldPractice.jsx");
  assert.match(practice, /METAR opisuje obserwację, a TAF jest prognozą/);
  assert.match(practice, /ruch jachtu zmienia wiatr odczuwany na pokładzie/);
  assert.match(practice, /Na przykładzie szkoleniowym sprawdzisz/);
  assert.match(practice, /Telefon nie mierzy tu wiatru/);
  assert.match(practice, /Wynik ćwiczenia nie jest zgodą na lot lub wyjście na wodę/);
  assert.match(practice, /Pełna pracownia wyjaśnia też warstwy dostępne w Windy/);
});
