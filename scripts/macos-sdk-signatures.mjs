import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function sdkSigningArguments(identity, keychain) {
  assert.match(identity ?? "", /^[A-Fa-f0-9]{40}$/, "Set CHMURNIK_SDK_SIGN_IDENTITY to the distribution certificate SHA-1.");
  assert.ok(keychain, "Set CHMURNIK_SIGNING_KEYCHAIN to the isolated signing keychain.");
  return ["--timestamp", "--sign", identity, "--keychain", keychain];
}

export function assertSDKSignature(signature, name, teamId) {
  assert.equal(signature.signed, true, `${name}: missing SDK origin signature (ITMS-91065).`);
  assert.equal(signature.signatureType, "AppleDeveloperProgram", `${name}: not an Apple developer signature.`);
  assert.equal(signature.signatureIdentifier, teamId, `${name}: unexpected SDK signer.`);
  assert.ok(signature.certificates?.length > 0, `${name}: missing certificate chain.`);
  assert.ok(signature.cdhashes?.length > 0, `${name}: missing signed code hashes.`);
  assert.deepEqual(signature.metadata, { library: `${name}.framework`, platform: "ios", platformVariant: "macabi" });
}

export function readSDKSignature(file) {
  const extract = (key, format, type) => execFileSync("plutil",
    ["-extract", key, format, "-expect", type, "-o", "-", file], { encoding: "utf8" }).trim();
  const signed = extract("signed", "raw", "bool") === "true";
  if (!signed) return { signed };
  // plutil cannot convert plist Data (certificates/hashes) to JSON. Extract it
  // through its typed API instead of parsing the human-readable -p output.
  const dataArray = key => {
    const count = Number(extract(key, "raw", "array"));
    assert.ok(Number.isInteger(count) && count >= 0 && count <= 20);
    return Array.from({ length: count }, (_, index) => extract(`${key}.${index}`, "raw", "data"));
  };
  return { signed, signatureType: extract("signatureType", "raw", "string"),
    signatureIdentifier: extract("signatureIdentifier", "raw", "string"),
    metadata: JSON.parse(extract("metadata", "json", "dictionary")),
    certificates: dataArray("certificates"), cdhashes: dataArray("cdhashes") };
}

export function verifyMacArchiveSDKSignatures(archive, teamId) {
  assert.match(teamId ?? "", /^[A-Z0-9]{10}$/, "Supply the expected Apple team ID.");
  const packages = fileURLToPath(new URL("../build/catalyst-runtime/capacitor-swift-pm/", import.meta.url));
  for (const name of ["Capacitor", "Cordova"]) {
    // Xcode produces these records from the XCFramework; never synthesize them.
    const file = resolve(archive, "Signatures", `${name}.xcframework-ios-macabi.signature`);
    const signature = readSDKSignature(file);
    assertSDKSignature(signature, name, teamId);
    const sdk = resolve(packages, `${name}.xcframework`);
    execFileSync("codesign", ["--verify", "--strict", "-R",
      `=anchor apple generic and certificate leaf[subject.OU] = "${teamId}"`, sdk], { stdio: "inherit" });
    const details = spawnSync("codesign", ["-d", "--verbose=3", sdk], { encoding: "utf8" });
    assert.equal(details.status, 0, `${name}: cannot inspect the SDK signature.`);
    // Xcode may write isSecureTimestamp=false even when the CMS has a timestamp.
    assert.match(details.stderr, /^Timestamp=.+$/m, `${name}: missing actual secure timestamp.`);
    const hash = details.stderr.match(/^CDHash=([a-f0-9]+)$/m)?.[1];
    assert.ok(hash && signature.cdhashes.some(value => Buffer.from(value, "base64").toString("hex") === hash),
      `${name}: archive signature record does not match the signed SDK package.`);
    console.log(`${name}: signed Catalyst SDK, team ${teamId}, secure timestamp verified.`);
  }
  execFileSync("codesign", ["--verify", "--deep", "--strict", "--verbose=2",
    resolve(archive, "Products/Applications/App.app")], { stdio: "inherit" });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv.length, 4, "Usage: node scripts/macos-sdk-signatures.mjs ARCHIVE TEAM_ID");
  verifyMacArchiveSDKSignatures(resolve(process.argv[2]), process.argv[3]);
}
