import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { clouds } from "../src/data/clouds.js";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root,
  base: "./",
  publicDir: "public",
  plugins: [
    react(),
    {
      name: "weather-preview-brand",
      async closeBundle() {
        const destination = resolve(root, "../build/weather-preview");
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
      },
    },
  ],
  build: { outDir: "../build/weather-preview", emptyOutDir: true },
});
