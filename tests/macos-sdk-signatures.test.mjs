import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { assertSDKSignature, readSDKSignature, sdkSigningArguments } from "../scripts/macos-sdk-signatures.mjs";

const team = "78N6WG8P57";
const valid = name => ({
  signed: true, signatureType: "AppleDeveloperProgram", signatureIdentifier: team,
  isSecureTimestamp: true, certificates: ["fixture-certificate"], cdhashes: ["fixture-hash"],
  metadata: { library: `${name}.framework`, platform: "ios", platformVariant: "macabi" },
});

test("release SDK signing requires an explicit certificate and isolated keychain", () => {
  assert.throws(() => sdkSigningArguments(), /CHMURNIK_SDK_SIGN_IDENTITY/);
  assert.throws(() => sdkSigningArguments("-", "/keychain"));
  assert.throws(() => sdkSigningArguments("A".repeat(40)), /CHMURNIK_SIGNING_KEYCHAIN/);
  assert.deepEqual(sdkSigningArguments("A".repeat(40), "/private/keychain"),
    ["--timestamp", "--sign", "A".repeat(40), "--keychain", "/private/keychain"]);
});

test("reject the actual unsigned SDK record shape from the ITMS-91065 archive", () => {
  for (const name of ["Capacitor", "Cordova"]) {
    assert.throws(() => assertSDKSignature({ signed: false, isSecureTimestamp: false,
      metadata: valid(name).metadata }, name, team), /ITMS-91065/);
    assert.doesNotThrow(() => assertSDKSignature(valid(name), name, team));
  }
});

test("reject incomplete signatures, unexpected signers and non-Catalyst records", () => {
  for (const patch of [{ signatureType: "SelfSigned" }, { signatureIdentifier: "OTHERTEAM1" },
    { certificates: [] }, { cdhashes: [] },
    { metadata: { library: "Capacitor.framework", platform: "ios" } }]) {
    assert.throws(() => assertSDKSignature({ ...valid("Capacitor"), ...patch }, "Capacitor", team));
  }
});

test("Xcode timestamp metadata is not a substitute for checking the actual CMS signature", () => {
  assert.doesNotThrow(() => assertSDKSignature({ ...valid("Capacitor"), isSecureTimestamp: false }, "Capacitor", team));
});

test("typed plist extraction preserves Data in binary SDK records", { skip: process.platform !== "darwin" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "chmurnik-sdk-parser-test-"));
  try {
    const file = join(directory, "fixture.plist");
    writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>signed</key><true/>
<key>signatureType</key><string>AppleDeveloperProgram</string>
<key>signatureIdentifier</key><string>${team}</string>
<key>metadata</key><dict><key>library</key><string>Capacitor.framework</string>
<key>platform</key><string>ios</string><key>platformVariant</key><string>macabi</string></dict>
<key>certificates</key><array><data>YQ==</data></array>
<key>cdhashes</key><array><data>Yg==</data></array>
</dict></plist>`);
    execFileSync("plutil", ["-convert", "binary1", file]);
    const parsed = readSDKSignature(file);
    assert.equal(parsed.signed, true);
    assert.equal(parsed.signatureIdentifier, team);
    assert.deepEqual(parsed.certificates, ["YQ=="]);
    assert.deepEqual(parsed.cdhashes, ["Yg=="]);
    assert.deepEqual(parsed.metadata, valid("Capacitor").metadata);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
