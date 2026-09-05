import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

// Render actual components in unit tests without a browser or generated files.
export async function loadJsx(url, extraExports = []) {
  const source = await readFile(url, "utf8");
  const expose = extraExports.length ? `\nexport { ${extraExports.join(", ")} };` : "";
  const bundle = buildSync({
    stdin: { contents: source + expose, sourcefile: fileURLToPath(url), loader: "jsx",
      resolveDir: fileURLToPath(new URL(".", url)) },
    bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic",
    external: ["react", "react-dom"], mainFields: ["module", "main"],
    define: { "import.meta.env": JSON.stringify({ BASE_URL: "/", VITE_QA_NATIVE_LAYOUT: "0" }) },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(url), module, module.exports);
  return module.exports;
}
