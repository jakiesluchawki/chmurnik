import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { clouds } from "../src/data/clouds.js";
import { squareRegionForProposal } from "../src/lib/photo-frame.js";
import { interpretCloudProbabilities, cloudComparisonCandidates } from "../src/lib/photo-recognition.js";

// Diagnostic only: a whole-photo atlas label is not a ground truth for every crop.
const [app, output] = process.argv.slice(2);
assert(app && output, "Pass the compiled .app and a private output JSON path");
const temp = mkdtempSync(join(tmpdir(), "chmurnik-model-audit-"));
try {
  const bin = join(temp, "audit");
  execFileSync("xcrun", ["--sdk", "macosx", "swiftc", "-O", "ios/App/App/CloudImagePreprocessor.swift",
    "ios/App/App/CloudRegionProposer.swift", "ios/App/App/CloudRegionDetector.swift", "tests/native-photo-audit/main.swift", "-o", bin]);
  const run = (mode, paths) => JSON.parse(execFileSync(bin, [resolve(app), mode], { input: JSON.stringify(paths), encoding: "utf8" }));
  const photos = clouds.flatMap(c => c.images.map(img => ({ label: c.id, file: img.src })));
  const scenes = run("proposals", photos.map(p => resolve("public", p.file)));
  assert.equal(scenes.length, photos.length);
  const cases = [], paths = [];
  let proposals = 0, betterOverlap = 0;
  function priorCrop(crop, anchor) {
    return { ...crop, x: Math.max(0, Math.min(1-crop.width, anchor.x-crop.width/2)),
      y: Math.max(0, Math.min(1-crop.height, anchor.y-crop.height/2)) };
  }
  for (const [i, { width, height, regions }] of scenes.entries()) {
    for (const { bounds: b, anchor: a } of regions) {
      const crop = squareRegionForProposal(width, height, b, a);
      const overlap = r => Math.max(0, Math.min(b.x+b.width, r.x+r.width)-Math.max(b.x,r.x)) *
        Math.max(0, Math.min(b.y+b.height, r.y+r.height)-Math.max(b.y,r.y));
      const change = overlap(crop) - overlap(priorCrop(crop, a));
      assert.ok(change >= -1e-8, "Proposal overlap regressed");
      proposals++; if (change > 1e-6) betterOverlap++;
    }
    if (!regions.length) continue;
    const { bounds, anchor } = regions[0];
    const crop = squareRegionForProposal(width, height, bounds, anchor);
    const old = priorCrop(crop, anchor);
    const original = await sharp(resolve("public", photos[i].file)).rotate().resize(width, height, { fit: "fill" }).png().toBuffer();
    for (const [variant, box] of Object.entries({ old, corrected: crop })) {
      const side = Math.max(1, Math.round(width * box.width));
      const file = join(temp, i+"-"+variant+".jpg");
      await sharp(original).extract({ left: Math.min(width-side, Math.round(width*box.x)),
        top: Math.min(height-side, Math.round(height*box.y)), width: side, height: side })
        .resize({ width: Math.min(side,1600) }).jpeg({ quality: 90 }).toFile(file);
      paths.push(file);
      cases.push({ ...photos[i], variant, crop: box });
    }
  }
  const predictions = run("classify", paths);
  assert.equal(predictions.length, cases.length);
  for (const [i, c] of cases.entries()) {
    const r = interpretCloudProbabilities(predictions[i].probabilities, { minimumConfidence: 1.01, marginThreshold: .51 });
    c.candidates = cloudComparisonCandidates(r).map(x => x.id);
    c.atlasLabelInSuggestions = c.candidates.includes(c.label);
  }
  const stats = { photos: photos.length, withProposal: scenes.filter(s => s.regions.length).length, proposals, betterOverlap };
  for (const variant of ["old", "corrected"]) stats[variant] = cases.filter(c => c.variant === variant && c.atlasLabelInSuggestions).length;
  writeFileSync(output, JSON.stringify({ stats, scenes, photos, cases }, null, 2), { mode: 0o600 });
  console.log(stats);
} finally { rmSync(temp, { recursive: true, force: true }); }
