import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  app: { type: "string" }, output: { type: "string" },
} });
assert(values.app, "Pass --app with the actual built .app directory");
const root = fileURLToPath(new URL("../", import.meta.url));
const app = resolve(values.app);
const mac = existsSync(resolve(app, "Contents/Info.plist"));
const content = mac ? resolve(app, "Contents") : app;
const resources = mac ? resolve(content, "Resources") : content;
const info = JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", resolve(content, "Info.plist")], { encoding: "utf8" }));
assert(["cloud.chmurnik.app", "cloud.chmurnik.qa.v4.development"].includes(info.CFBundleIdentifier));
const files = (base, sub = "") => readdirSync(resolve(base, sub), { withFileTypes: true }).flatMap(entry => {
  assert(!entry.isSymbolicLink(), `Unexpected bundle symlink: ${sub}/${entry.name}`);
  const path = sub ? `${sub}/${entry.name}` : entry.name;
  return entry.isDirectory() ? files(base, path) : [path];
});
const expected = files(resolve(root, "dist")).sort();
const publicDir = resolve(resources, "public");
const actual = files(publicDir).sort();
assert.deepEqual(actual.filter(file => !["cordova.js", "cordova_plugins.js"].includes(file)), expected,
  "The package must not omit current assets or retain obsolete web assets");
assert(!actual.some(file => file.startsWith("premiera/") || file.startsWith("ocena/")));
const hash = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const assets = {};
for (const file of expected) {
  assets[file] = hash(resolve(root, "dist", file));
  assert.equal(hash(resolve(publicDir, file)), assets[file], `Stale or changed packaged asset: ${file}`);
}
const report = { checkedAt: new Date().toISOString(), app, platform: mac ? "macOS" : "iOS/iPadOS",
  bundleId: info.CFBundleIdentifier, version: info.CFBundleShortVersionString, build: info.CFBundleVersion,
  matchedFiles: expected.length, assets, verified: true, uploaded: false };
if (values.output) writeFileSync(resolve(values.output), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
console.log(`PASS: ${report.platform} ${report.version} (${report.build}), ${report.matchedFiles} packaged files match dist exactly. This is not an upload or App Store approval.`);
