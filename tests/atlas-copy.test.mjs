import assert from "node:assert/strict";
import test from "node:test";
import { clouds } from "../src/data/clouds.js";
import { cloudProfiles, taxonomyTerms } from "../src/data/encyclopedia.js";
import { evaluateNomenclature, getNomenclatureOrigins } from "../src/lib/nomenclature.js";
import { getSources } from "../src/data/sources.js";

// WMO section 2.1.4 lists common origins, not every possible transformation.
const commonOrigins = {
  cirrus: [["cirrocumulogenitus", "altocumulogenitus", "cumulonimbogenitus"], ["cirrostratomutatus"]],
  cirrocumulus: [[], ["cirromutatus", "cirrostratomutatus", "altocumulomutatus"]],
  cirrostratus: [["cirrocumulogenitus", "cumulonimbogenitus"], ["cirromutatus", "cirrocumulomutatus", "altostratomutatus"]],
  altocumulus: [["cumulogenitus", "cumulonimbogenitus"], ["cirrocumulomutatus", "altostratomutatus", "nimbostratomutatus", "stratocumulomutatus"]],
  altostratus: [["altocumulogenitus", "cumulonimbogenitus"], ["cirrostratomutatus", "nimbostratomutatus"]],
  nimbostratus: [["cumulogenitus", "cumulonimbogenitus"], ["altocumulomutatus", "altostratomutatus", "stratocumulomutatus"]],
  stratocumulus: [["altostratogenitus", "nimbostratogenitus", "cumulogenitus", "cumulonimbogenitus"], ["altocumulomutatus", "nimbostratomutatus", "stratomutatus"]],
  stratus: [["nimbostratogenitus", "cumulogenitus", "cumulonimbogenitus"], ["stratocumulomutatus"]],
  cumulus: [["altocumulogenitus", "stratocumulogenitus"], ["stratocumulomutatus", "stratomutatus"]],
  cumulonimbus: [["altocumulogenitus", "altostratogenitus", "nimbostratogenitus", "stratocumulogenitus", "cumulogenitus"], ["cumulomutatus"]],
};

test("all ten profiles use canonical common WMO origin names and combinations", () => {
  for (const cloud of clouds) {
    const profile = cloudProfiles[cloud.id];
    assert.deepEqual([profile.motherClouds.genitus, profile.motherClouds.mutatus], commonOrigins[cloud.id], cloud.id);
    for (const origin of getNomenclatureOrigins(cloud.id).filter((item) => item.type === "mother")) {
      const result = evaluateNomenclature({ cloudId: cloud.id, originId: origin.id });
      assert.equal(result.status, "needs-evidence");
      assert.equal(result.name, `${cloud.name} ${origin.name}`);
      assert.ok(result.sourceIds.includes("wmoMotherNames"));
      assert.equal(getSources(result.sourceIds).length, result.sourceIds.length);
    }
  }
  assert.match(taxonomyTerms.find((term) => term.id === "mutatus").diagnostic, /Stratocumulus stratomutatus/);
});

test("Stratus and contrail copy preserves the limits of visual identification", () => {
  const cirrus = clouds.find((cloud) => cloud.id === "cirrus");
  assert.match(cirrus.trap, /10 minut/);
  assert.match(cirrus.trap, /homomutatus/);
  const stratus = clouds.find((cloud) => cloud.id === "stratus");
  assert.doesNotMatch(stratus.headline, /mgła, która/);
  assert.match(cloudProfiles.stratus.essence, /nie jest to jedyna/);
  assert.match(cloudProfiles.stratus.weather[0], /śnieg ziarnisty/);
  assert.ok(!stratus.features.includes("virga"));
  assert.match(stratus.images.find((photo) => photo.id === "stratus-virga-elko").diagnostic, /nie rozstrzyga/);
  assert.match(taxonomyTerms.find((term) => term.id === "tuba").diagnostic, /lej nie musi sięgać ziemi/);
});

test("the editorial pass retains the full atlas, attribution and substantive profiles", () => {
  assert.equal(clouds.length, 10);
  assert.equal(taxonomyTerms.length, 49);
  assert.equal(clouds.flatMap((cloud) => cloud.images).length, 30);
  for (const term of taxonomyTerms) {
    assert.ok(term.definition.length > 60, term.id);
    assert.ok(term.diagnostic.length > 40, term.id);
    assert.equal(getSources(term.sourceIds).length, term.sourceIds.length, term.id);
  }
  for (const cloud of clouds) {
    for (const key of ["formation", "weather", "evolution", "aviation", "optics", "fieldChecklist", "namingExamples", "lookAlikes"]) {
      assert.ok(cloudProfiles[cloud.id][key].length >= 2, `${cloud.id}: ${key}`);
    }
    for (const image of cloud.images) {
      assert.ok(image.src && image.author && image.license && image.page, image.id);
    }
  }
});
