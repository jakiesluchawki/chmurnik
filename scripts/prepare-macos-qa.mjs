import assert from "node:assert/strict";
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(root, "build/mac-app");
const stage = resolve(root, "build/mac-app-qa");
const derived = resolve(root, "build/macos-qa");
const bundleId = "cloud.chmurnik.qa.v4";
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, stdio: "inherit", ...options });
const plist = (path) => JSON.parse(run("plutil", ["-convert", "json", "-o", "-", path], { stdio: "pipe", encoding: "utf8" }));
const savePlist = (path, data) => {
  writeFileSync(path, JSON.stringify(data));
  run("plutil", ["-convert", "xml1", path]);
};

assert.ok(existsSync(resolve(source, "App.xcodeproj/project.pbxproj")), "Run build-macos.mjs first");
assert.equal(readFileSync(resolve(source, "App/public/index.html"), "utf8"),
  readFileSync(resolve(root, "ios/App/App/public/index.html"), "utf8"), "Refresh the Mac staging bundle first");
cpSync(source, stage, { recursive: true });
cpSync(resolve(root, "ios/App/AppUITests"), resolve(stage, "AppUITests"), { recursive: true });
const projectPath = resolve(stage, "App.xcodeproj/project.pbxproj");
const project = plist(projectPath);
let changed = 0;
for (const object of Object.values(project.objects)) {
  const settings = object.buildSettings;
  if (!settings?.PRODUCT_BUNDLE_IDENTIFIER) continue;
  assert.ok(["cloud.chmurnik.app", "cloud.chmurnik.app.uitests"].includes(settings.PRODUCT_BUNDLE_IDENTIFIER));
  const runner = settings.PRODUCT_BUNDLE_IDENTIFIER.endsWith(".uitests");
  settings.PRODUCT_BUNDLE_IDENTIFIER = bundleId + (runner ? ".uitests" : "");
  settings.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER = "NO";
  if (runner) settings.IPHONEOS_DEPLOYMENT_TARGET = "17.0";
  changed++;
}
assert.equal(changed, 4, "Review the app/test configuration isolation before running");
savePlist(projectPath, project);
const infoPath = resolve(stage, "App/Info.plist");
savePlist(infoPath, { ...plist(infoPath), CFBundleDisplayName: "CHMURNIK QA" });
const entitlements = plist(resolve(stage, "App/Mac.entitlements"));
assert.equal(entitlements["com.apple.security.app-sandbox"], true);
assert.equal(entitlements["com.apple.security.application-groups"], undefined);

run("xcodebuild", ["-quiet", "-project", resolve(stage, "App.xcodeproj"), "-scheme", "App",
  "-configuration", "Debug", "-destination", "platform=macOS,variant=Mac Catalyst,arch=arm64",
  "-derivedDataPath", derived, "CODE_SIGN_IDENTITY=-", "CODE_SIGN_STYLE=Manual", "DEVELOPMENT_TEAM=",
  "PROVISIONING_PROFILE_SPECIFIER=", "build-for-testing"]);
const products = resolve(derived, "Build/Products");
const app = resolve(products, "Debug-maccatalyst/App.app");
assert.equal(plist(resolve(app, "Contents/Info.plist")).CFBundleIdentifier, bundleId);
const files = readdirSync(products).filter((name) => name.endsWith(".xctestrun"));
assert.equal(files.length, 1);
const runPath = resolve(products, files[0]);
const plan = plist(runPath);
assert.ok(plan.AppUITests.TestHostBundleIdentifier.startsWith(`${bundleId}.uitests`));
// The runner receives only a public atlas fixture, never a user's photo path.
const fixture = resolve(stage, "qa-cumulus.jpg");
cpSync(resolve(root, "public/assets/clouds/cumulus.jpg"), fixture);
assert.ok(readFileSync(fixture).length > 0);
plan.AppUITests.EnvironmentVariables = { ...plan.AppUITests.EnvironmentVariables,
  CHMURNIK_QA_APP_ID: bundleId, CHMURNIK_QA_PHOTO: fixture };
savePlist(runPath, plan);
console.log(`Isolated QA bundle: ${bundleId}`);
console.log(`Test plan: ${runPath}`);
console.log("Prepared only; no UI test launched and no existing app data changed.");
