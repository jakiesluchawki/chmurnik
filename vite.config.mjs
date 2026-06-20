import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.CHMURNIK_BASE_PATH || "/";

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
  plugins: [react()],
});
