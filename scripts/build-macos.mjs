import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sdkSigningArguments } from "./macos-sdk-signatures.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = resolve(root, "build/catalyst-runtime");
const source = resolve(runtime, "source");
const staging = resolve(root, "build/mac-app");
const version = "8.4.1";
const revision = "7217b5215a175eededf607a216e0cab2a8450a34";
const signingArgs = process.argv.includes("--store-sdk")
  ? sdkSigningArguments(process.env.CHMURNIK_SDK_SIGN_IDENTITY, process.env.CHMURNIK_SIGNING_KEYCHAIN)
  : null;
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: root, stdio: "inherit", ...options });
const output = (command, args) => run(command, args, { stdio: "pipe", encoding: "utf8" }).trim();
const installed = JSON.parse(readFileSync(resolve(root, "node_modules/@capacitor/ios/package.json"))).version;
if (installed !== version) throw new Error(`Review the Catalyst source pin before upgrading Capacitor (${installed}).`);
mkdirSync(runtime, { recursive: true });
if (!existsSync(source)) run("git", ["clone", "--depth", "1", "--branch", version, "https://github.com/ionic-team/capacitor.git", source]);
if (output("git", ["-C", source, "rev-parse", "HEAD"]) !== revision) throw new Error("Unexpected Capacitor source revision.");
if (output("git", ["-C", source, "status", "--porcelain"])) throw new Error("Capacitor source checkout must be unmodified.");

// The official binary SPM distribution has no Catalyst slice. Build the same version
// in isolation; neither the iOS package graph nor installed npm packages are changed.
run("xcodebuild", ["-quiet", "-project", resolve(source, "ios/Capacitor/Capacitor.xcodeproj"),
  "-scheme", "Capacitor", "-configuration", "Release", "-destination", "generic/platform=macOS,variant=Mac Catalyst",
  "-derivedDataPath", resolve(runtime, "derived"), "CODE_SIGNING_ALLOWED=NO",
  "BUILD_LIBRARY_FOR_DISTRIBUTION=YES", "SKIP_INSTALL=NO", "build"]);
const localPackage = resolve(runtime, "capacitor-swift-pm");
mkdirSync(localPackage, { recursive: true });
for (const name of ["Capacitor", "Cordova"]) {
  const xcframework = resolve(localPackage, `${name}.xcframework`);
  rmSync(xcframework, { force: true, recursive: true });
  run("xcodebuild", ["-create-xcframework", "-framework",
    resolve(runtime, `derived/Build/Products/Release-maccatalyst/${name}.framework`), "-output", xcframework]);
  if (signingArgs) {
    // Attest our build of the pinned upstream source, not Ionic's binary release.
    run("codesign", [...signingArgs, xcframework]);
    run("codesign", ["--verify", "--strict", "--verbose=2", xcframework]);
  }
}
cpSync(resolve(source, "LICENSE"), resolve(localPackage, "LICENSE"));
writeFileSync(resolve(localPackage, "Package.swift"), `// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "capacitor-swift-pm", platforms: [.iOS(.v15)],
  products: [.library(name: "Capacitor", targets: ["Capacitor"]), .library(name: "Cordova", targets: ["Cordova"])],
  targets: [.binaryTarget(name: "Capacitor", path: "Capacitor.xcframework"), .binaryTarget(name: "Cordova", path: "Cordova.xcframework")])
`);
if (!process.argv.includes("--skip-sync")) run("npm", ["run", "ios:sync"]);
mkdirSync(staging, { recursive: true });
for (const name of ["App", "App.xcodeproj", "AppUITests", "CapApp-SPM"]) {
  rmSync(resolve(staging, name), { recursive: true, force: true });
  cpSync(resolve(root, "ios/App", name), resolve(staging, name), { recursive: true });
}
const manifest = resolve(staging, "CapApp-SPM/Package.swift");
const original = readFileSync(manifest, "utf8");
const remote = `.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "${version}")`;
if (!original.includes(remote)) throw new Error("Capacitor CLI manifest changed; review Catalyst generation.");
writeFileSync(manifest, original.replace(remote, `.package(path: "${localPackage}")`)
  .replaceAll("../../../node_modules/", `${root}/node_modules/`));

const project = resolve(staging, "App.xcodeproj/project.pbxproj");
const parsed = JSON.parse(output("plutil", ["-convert", "json", "-o", "-", project]));
for (const object of Object.values(parsed.objects)) {
  if (object.isa === "PBXFileReference" && object.path === "../debug.xcconfig") {
    object.path = resolve(root, "ios/debug.xcconfig");
    object.sourceTree = "<absolute>";
  }
  const settings = object.buildSettings;
  if (settings?.PRODUCT_BUNDLE_IDENTIFIER) {
    settings.SUPPORTS_MACCATALYST = "YES";
    if (settings.PRODUCT_BUNDLE_IDENTIFIER === "cloud.chmurnik.app") {
      settings.CODE_SIGN_ENTITLEMENTS = "App/Mac.entitlements";
    }
  }
}
writeFileSync(project, JSON.stringify(parsed));
run("plutil", ["-convert", "xml1", project]);
run("xcodebuild", ["-quiet", "-project", resolve(staging, "App.xcodeproj"), "-scheme", "App",
  "-configuration", "Debug", "-destination", "generic/platform=macOS,variant=Mac Catalyst",
  "-derivedDataPath", resolve(root, "build/macos"), "CODE_SIGN_IDENTITY=-", "CODE_SIGN_STYLE=Manual",
  "DEVELOPMENT_TEAM=", "PROVISIONING_PROFILE_SPECIFIER=", "build"]);
console.log(`Local development build: ${resolve(root, "build/macos/Build/Products/Debug-maccatalyst/App.app")}`);
console.log("Ad-hoc signed for local testing; not a notarized or App Store distribution.");
if (!signingArgs) console.log("SDKs are unsigned: regenerate with --store-sdk before an App Store archive.");
