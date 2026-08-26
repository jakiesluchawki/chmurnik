import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { publicInformationPages } from "./scripts/public-info-pages.mjs";

const base = process.env.CHMURNIK_BASE_PATH || "/";

function completeOfflineManifest() {
  return {
    name: "chmurnik-offline-manifest",
    async writeBundle(options, bundle) {
      const runtimeAssets = Object.keys(bundle)
        .filter((file) => /\.(?:js|css)$/.test(file))
        .sort();
      const version = createHash("sha256")
        .update(runtimeAssets.join("\n"))
        .digest("hex")
        .slice(0, 12);
      const workerPath = resolve(options.dir || "dist", "service-worker.js");
      const source = await readFile(workerPath, "utf8");
      const prepared = source
        .replace('"__CHMURNIK_BUILD_VERSION__"', JSON.stringify(version))
        .replace("/* __CHMURNIK_RUNTIME_ASSETS__ */ []", JSON.stringify(runtimeAssets));
      if (prepared === source || prepared.includes("__CHMURNIK_BUILD_VERSION__")) {
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
