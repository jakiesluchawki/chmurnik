import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { publicInformationPages } from "./scripts/public-info-pages.mjs";
import { clouds } from "./src/data/clouds.js";

const base = process.env.CHMURNIK_BASE_PATH || "/";
const workshopDirectory = fileURLToPath(new URL("./build/weather-bundle/", import.meta.url));
const workshopPrefix = "pogoda-preview/";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

export async function workshopBundleFiles(directory) {
  const files = [];
  async function visit(relative = "") {
    for (const entry of (await readdir(resolve(directory, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      if (entry.name.startsWith(".")) continue;
      const file = `${relative}${entry.name}`;
      if (entry.isDirectory()) await visit(`${file}/`);
      else if (entry.isFile()) files.push({ file, source: await readFile(resolve(directory, file)) });
      else throw new Error(`Unsupported workshop bundle entry: ${file}`);
    }
  }
  try { await visit(); } catch (error) {
    throw new Error(`Cannot read workshop bundle at ${directory}. Run npm run weather:bundle before the main Vite build.`, { cause: error });
  }
  if (!files.some(({ file, source }) => file === "index.html" && source.length)
    || !files.some(({ file }) => /^assets\/.+\.js$/.test(file))
    || !files.some(({ file }) => /^assets\/.+\.css$/.test(file))) {
    throw new Error(`Incomplete workshop bundle at ${directory}; rebuild it with npm run weather:bundle.`);
  }
  return files;
}

export function bundledWorkshops({ directory = process.env.CHMURNIK_WORKSHOP_BUNDLE || workshopDirectory } = {}) {
  let sourceDirectory = resolve(directory);
  return {
    name: "chmurnik-bundled-workshops",
    configResolved(config) {
      sourceDirectory = resolve(config.root, directory);
      const output = resolve(config.root, config.build.outDir);
      if (sourceDirectory === output || sourceDirectory.startsWith(`${output}${sep}`)) {
        throw new Error("Workshop staging must be outside the main build output directory.");
      }
    },
    async generateBundle() {
      const files = await workshopBundleFiles(sourceDirectory);
      for (const { file, source } of files) this.emitFile({ type: "asset", fileName: `${workshopPrefix}${file}`, source });
      this.emitFile({ type: "asset", fileName: `${workshopPrefix}bundle-manifest.json`, source: JSON.stringify({
        revision: 1, entry: "index.html", files: Object.fromEntries(files.map(({ file, source }) => [file, sha256(source)])),
      }, null, 2) });
    },
    configureServer(server) {
      const prefix = `${server.config.base}${workshopPrefix}`;
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); } catch { return next(); }
        if (!pathname.startsWith(prefix)) return next();
        const relative = pathname.slice(prefix.length) || "index.html";
        const file = resolve(sourceDirectory, relative);
        if (!file.startsWith(`${sourceDirectory}${sep}`)) { response.statusCode = 400; response.end(); return; }
        try {
          const bytes = await readFile(file);
          const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff" };
          response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
          response.setHeader("Cache-Control", "no-cache"); response.end(bytes);
        } catch { response.statusCode = 503; response.end("Workshop bundle unavailable. Run npm run weather:bundle."); }
      });
    },
  };
}

function offlineWorkshopNavigation(source) {
  const fallback = "fetch(event.request).catch(() => caches.match(BASE))";
  if (!source.includes(fallback)) throw new Error("Missing offline navigation fallback; review workshop routing before building.");
  return source.replace(fallback, `fetch(event.request).catch(() => {
      const path = new URL(event.request.url).pathname;
      const workshop = path === \`\${BASE}pogoda-preview/index.html\` || path === \`\${BASE}pogoda-preview/\`;
      return caches.match(workshop ? \`\${BASE}pogoda-preview/index.html\` : BASE);
    })`);
}

export function completeOfflineManifest() {
  return {
    name: "chmurnik-offline-manifest",
    async writeBundle(options, bundle) {
      const runtimeAssets = Object.keys(bundle)
        .filter((file) => /\.(?:js|css)$/.test(file) || file.startsWith(workshopPrefix))
        .sort();
      const directory = options.dir || "dist";
      const workerPath = resolve(directory, "service-worker.js");
      const template = await readFile(workerPath, "utf8");
      const workshopAssets = runtimeAssets.filter(file => file.startsWith(workshopPrefix));
      const source = workshopAssets.length ? offlineWorkshopNavigation(template) : template;
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
      const workshopHashes = {};
      for (const file of workshopAssets) workshopHashes[file] = sha256(await readFile(resolve(directory, file)));
      const version = createHash("sha256")
        .update(runtimeAssets.join("\n"))
        .update(source)
        .update(JSON.stringify(atlasHashes))
        .update(JSON.stringify(workshopHashes))
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
  plugins: [react(), publicInformationPages(), bundledWorkshops(), completeOfflineManifest()],
});
