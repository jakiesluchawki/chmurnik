import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { publicInformationPages } from "./scripts/public-info-pages.mjs";
import { clouds } from "./src/data/clouds.js";

const base = process.env.CHMURNIK_BASE_PATH || "/";

export function completeOfflineManifest() {
  return {
    name: "chmurnik-offline-manifest",
    async writeBundle(options, bundle) {
      const runtimeAssets = Object.keys(bundle)
        .filter((file) => /\.(?:js|css)$/.test(file))
        .sort();
      const directory = options.dir || "dist";
      const workerPath = resolve(directory, "service-worker.js");
      const source = await readFile(workerPath, "utf8");
      for (const marker of ['"__CHMURNIK_BUILD_VERSION__"', "/* __CHMURNIK_RUNTIME_ASSETS__ */ []", "/* __CHMURNIK_ATLAS_HASHES__ */ {}"]) {
        if (!source.includes(marker)) throw new Error(`Missing offline build marker: ${marker}`);
      }
      const photoPaths = [...new Set(clouds.flatMap(cloud => cloud.images.map(image => image.src.replace(/^\//, ""))))].sort();
      const atlasHashes = {};
      for (const file of photoPaths) {
        if (!/^assets\/clouds\/[\w-]+\.jpg$/.test(file)) throw new Error(`Unexpected atlas path: ${file}`);
        atlasHashes[file.slice("assets/clouds/".length)] = createHash("sha256")
          .update(await readFile(resolve(directory, file))).digest("hex");
      }
      const version = createHash("sha256")
        .update(runtimeAssets.join("\n"))
        .update(source)
        .update(JSON.stringify(atlasHashes))
        .digest("hex")
        .slice(0, 12);
      const prepared = source
        .replace('"__CHMURNIK_BUILD_VERSION__"', JSON.stringify(version))
        .replace("/* __CHMURNIK_RUNTIME_ASSETS__ */ []", JSON.stringify(runtimeAssets))
        .replace("/* __CHMURNIK_ATLAS_HASHES__ */ {}", JSON.stringify(atlasHashes));
      if (prepared === source || /__CHMURNIK_(?:BUILD_VERSION|RUNTIME_ASSETS|ATLAS_HASHES)__/.test(prepared)) {
        throw new Error("The service worker runtime manifest could not be generated.");
      }
      await writeFile(workerPath, prepared);
    },
  };
}

export default defineConfig({
  base,
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    watch: {
      ignored: ["**/build/**", "**/ios/**", "**/release/**"],
    },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@phosphor-icons/")) return "icons";
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react/")) {
            return "react-runtime";
          }
          if (id.includes("node_modules/")) return "platform";
          if (id.includes("/src/data/")) return "cloud-knowledge";
          return undefined;
        },
      },
    },
  },
  plugins: [react(), publicInformationPages(), completeOfflineManifest()],
});
