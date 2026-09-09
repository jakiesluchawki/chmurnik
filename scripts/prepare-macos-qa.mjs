import assert from "node:assert/strict";
import { cpSync, existsSync, lstatSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function assertMatchingPublicBundles(staged, current) {
  const files = (base, sub = "") => {
    assert.ok(lstatSync(resolve(base, sub)).isDirectory(), "Public bundle must be a real directory");
    return readdirSync(resolve(base, sub), { withFileTypes: true }).flatMap(entry => {
      const file = sub ? `${sub}/${entry.name}` : entry.name;
      assert.ok(!entry.isSymbolicLink(), `Unexpected public bundle symlink: ${file}`);
      if (entry.isDirectory()) return files(base, file);
      assert.ok(entry.isFile(), `Unexpected public bundle entry: ${file}`);
      return [file];
    });
  };
  const expected = files(current).sort();
  assert.ok(expected.includes("index.html"), "Current public bundle is missing index.html");
  assert.deepEqual(files(staged).sort(), expected, "Refresh the Mac staging bundle first: public file lists differ");
  for (const file of expected) {
    assert.ok(readFileSync(resolve(staged, file)).equals(readFileSync(resolve(current, file))),
      `Refresh the Mac staging bundle first: changed public asset ${file}`);
  }
}

function prepareMacosQA() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const source = resolve(root, "build/mac-app");
  const stage = resolve(root, "build/mac-app-qa");
  const derived = resolve(root, "build/macos-qa-development");
  const bundleId = "cloud.chmurnik.qa.v4.development";
  const identity = process.env.CHMURNIK_QA_SIGN_IDENTITY || "Apple Development";
  assert.match(identity, /^(Apple Development(?:: .+)?|[0-9a-f]{40})$/i,
    "QA requires an existing Apple Development identity, not ad-hoc signing");
  const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, stdio: "inherit", ...options });
  const plist = (path) => JSON.parse(run("plutil", ["-convert", "json", "-o", "-", path], { stdio: "pipe", encoding: "utf8" }));
  const savePlist = (path, data) => {
    writeFileSync(path, JSON.stringify(data));
    run("plutil", ["-convert", "xml1", path]);
  };

  assert.ok(existsSync(resolve(source, "App.xcodeproj/project.pbxproj")), "Run build-macos.mjs first");
  assertMatchingPublicBundles(resolve(source, "App/public"), resolve(root, "ios/App/App/public"));
  // Copying over a previous stage leaves obsolete hashed bundles behind.
  rmSync(resolve(stage, "App/public"), { recursive: true, force: true });
  cpSync(source, stage, { recursive: true });
  cpSync(resolve(root, "ios/App/AppUITests"), resolve(stage, "AppUITests"), { recursive: true });
  const projectPath = resolve(stage, "App.xcodeproj/project.pbxproj");
  const project = plist(projectPath);
  const teams = new Set(Object.values(project.objects)
    .filter((object) => object.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER)
    .map((object) => object.buildSettings.DEVELOPMENT_TEAM));
  assert.equal(teams.size, 1, "QA app and tests must use the same development team");
  const [team] = teams;
  assert.match(team || "", /^[A-Z0-9]{10}$/);
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
    "-disableAutomaticPackageResolution", "-onlyUsePackageVersionsFromResolvedFile",
    "-configuration", "Debug", "-destination", "platform=macOS,variant=Mac Catalyst,arch=arm64",
    "-derivedDataPath", derived, `CODE_SIGN_IDENTITY=${identity}`, "CODE_SIGN_STYLE=Manual", `DEVELOPMENT_TEAM=${team}`,
    "PROVISIONING_PROFILE_SPECIFIER=", "clean", "build-for-testing"]);
  const products = resolve(derived, "Build/Products");
  const app = resolve(products, "Debug-maccatalyst/App.app");
  assert.equal(plist(resolve(app, "Contents/Info.plist")).CFBundleIdentifier, bundleId);
  // Hardened test runners cannot load an ad-hoc test bundle without a Team ID.
  const runner = resolve(products, "Debug-maccatalyst/AppUITests-Runner.app");
  for (const path of [app, runner, resolve(runner, "Contents/PlugIns/AppUITests.xctest")]) {
    run("codesign", ["--verify", "--deep", "--strict", path]);
    const signature = spawnSync("codesign", ["-dvvv", path], { encoding: "utf8" });
    assert.equal(signature.status, 0, signature.stderr);
    assert.ok(signature.stderr.split("\n").includes(`TeamIdentifier=${team}`),
      `QA signing team mismatch: ${path}`);
  }
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) prepareMacosQA();
