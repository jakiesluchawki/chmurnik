import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { clouds } from "../src/data/clouds.js";
import { transferCases } from "./learning/transfer-cases.mjs";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root,
  base: "./",
  publicDir: "public",
  plugins: [
    react(),
    {
      name: "weather-preview-brand",
      async writeBundle({ dir }) {
        const destination = resolve(root, dir ?? "../build/weather-preview");
        await mkdir(destination, { recursive: true });
        await cp(
          resolve(root, "../public/brand/chmurnik-wordmark.png"),
          resolve(destination, "wordmark.png"),
        );
        await mkdir(resolve(destination, "photos"), { recursive: true });
        for (const cloud of clouds) {
          const image = cloud.images[0];
          await cp(resolve(root, "../public", image.src), resolve(destination, "photos", image.src.split("/").pop()));
        }
        await cp(resolve(root, "../public/assets/clouds/stratocumulus-jastrzebie.jpg"), resolve(destination, "photos/observation.jpg"));
        const originals = new Map(clouds.flatMap((cloud) => cloud.images.map((image) => [image.page, image.src])));
        const aliases = new Set();
        for (const exercise of Object.values(transferCases).flat()) {
          for (const image of exercise.images ?? (exercise.image ? [exercise.image] : [])) {
            const original = originals.get(image.sourceUrl);
            if (!original || !/^\.\/photos\/transfer-\d{2}\.jpg$/.test(image.src) || aliases.has(image.src)) {
              throw new Error(`Invalid transfer photo mapping: ${image.src}`);
            }
            aliases.add(image.src);
            await cp(resolve(root, "../public", original), resolve(destination, image.src));
          }
        }
      },
    },
  ],
  build: { outDir: "../build/weather-preview", emptyOutDir: true },
});
