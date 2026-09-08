import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { cp, mkdir } from "node:fs/promises";
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
      },
    },
  ],
  build: { outDir: "../build/weather-preview", emptyOutDir: true },
});
