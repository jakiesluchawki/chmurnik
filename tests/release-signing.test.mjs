import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("regenerated Catalyst projects inherit the education category", { skip: process.platform !== "darwin" }, () => {
  const result = spawnSync("plutil", ["-convert", "json", "-o", "-", "ios/App/App/Info.plist"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const info = JSON.parse(result.stdout);
  assert.equal(info.LSApplicationCategoryType, "public.app-category.education");
  assert.equal(info.ITSAppUsesNonExemptEncryption, false);
});

test("Mac QA rejects ad-hoc or invalid signing before staging any files", () => {
  for (const identity of ["-", "invalid-identity"]) {
    const result = spawnSync(process.execPath, ["scripts/prepare-macos-qa.mjs"], {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      env: { ...process.env, CHMURNIK_QA_SIGN_IDENTITY: identity },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /QA requires an existing Apple Development identity/);
  }
});

test("Mac UI-test setup rejects a non-QA plan before launching the application", async () => {
  const source = await readFile(new URL("../ios/App/AppUITests/AppStoreUITests.swift", import.meta.url), "utf8");
  const setup = source.slice(source.indexOf("override func setUpWithError()"), source.indexOf("private func button"));
  const conditionalIndex = setup.indexOf("#if targetEnvironment(macCatalyst)");
  const guardIndex = setup.indexOf('guard ProcessInfo.processInfo.environment["CHMURNIK_QA_APP_ID"]');
  const skipIndex = setup.indexOf("throw XCTSkip", guardIndex);
  assert.ok(conditionalIndex >= 0);
  assert.ok(guardIndex > conditionalIndex);
  assert.ok(skipIndex > guardIndex && skipIndex < setup.indexOf("app.launch()"));
  assert.match(setup, /cloud\.chmurnik\.qa\.v4\.development/);
});

test("TestFlight release rejects incomplete isolated signing configuration", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "chmurnik-signing-test-"));

  try {
    await writeFile(path.join(directory, "xcodebuild"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });

    const result = spawnSync("sh", ["scripts/upload-ios-testflight.sh"], {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${directory}${path.delimiter}${process.env.PATH || ""}`,
        CHMURNIK_ASC_KEY_PATH: "",
        CHMURNIK_ASC_KEY_ID: "",
        CHMURNIK_ASC_ISSUER_ID: "",
        CHMURNIK_IOS_SIGNING_KEYCHAIN_PATH: "",
        CHMURNIK_IOS_SIGNING_IDENTITY: "test-only-identity",
        CHMURNIK_IOS_PROVISIONING_PROFILE_SPECIFIER: "",
      },
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /signing keychain, identity and provisioning profile together/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("manual provisioning stays scoped to the app instead of Swift package dependencies", async () => {
  const project = await readFile(new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url), "utf8");
  const uploader = await readFile(new URL("../scripts/upload-ios-testflight.sh", import.meta.url), "utf8");

  assert.match(project, /CODE_SIGN_STYLE = "\$\(CHMURNIK_ARCHIVE_SIGNING_STYLE\)"/);
  assert.match(project, /PROVISIONING_PROFILE_SPECIFIER = "\$\(CHMURNIK_ARCHIVE_PROVISIONING_PROFILE\)"/);
  assert.match(uploader, /CHMURNIK_ARCHIVE_SIGNING_STYLE=Manual/);
  assert.match(uploader, /CHMURNIK_ARCHIVE_PROVISIONING_PROFILE=\$SIGNING_PROFILE/);
  assert.doesNotMatch(uploader, /"PROVISIONING_PROFILE_SPECIFIER=\$SIGNING_PROFILE"/);
});
