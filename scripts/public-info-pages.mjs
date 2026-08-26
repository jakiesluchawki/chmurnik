import { applicationInformation } from "../src/data/app-information.js";

const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

export function renderInformationPage(page) {
  const info = applicationInformation.pages[page];
  if (!info) throw new Error("Unknown information page");
  // Relative links work both at the domain root and under GitHub Pages /chmurnik/.
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escape(info.intro)}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${escape(info.title)} · CHMURNIK</title>
  <style>
    @font-face{font-family:Roobert;src:url("fonts/Roobert-Regular.woff2") format("woff2");font-display:swap}
    @font-face{font-family:Romie;src:url("fonts/Romie-Regular.woff2") format("woff2");font-display:swap}
    *{box-sizing:border-box}body{margin:0;background:#fbe1eb;color:#55512d;font:17px/1.65 Roobert,system-ui,sans-serif}
    main{max-width:780px;margin:auto;padding:32px 24px 80px}a{color:#5f31af;text-underline-offset:4px}
    a:focus-visible{outline:3px solid #7442d9;outline-offset:5px}nav{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0}
    nav a{padding:8px 0}header{margin:36px 0}h1,h2{font-family:Romie,Georgia,serif;font-weight:400;line-height:1.15}
    h1{font-size:clamp(42px,10vw,68px);margin:10px 0 20px}h2{font-size:30px;margin:0 0 16px}
    header small{font-size:13px}section{padding:24px 0;border-top:1px solid #55512d40}p{margin:0 0 16px}
    footer{border-top:1px solid #55512d40;padding-top:24px}a[aria-current=page]{color:#55512d;font-weight:bold}
  </style>
</head>
<body><main>
  <a href="./">CHMURNIK · wróć do aplikacji</a>
  <header><small>CHMURNIK · Aktualizacja: ${escape(applicationInformation.updated)}</small><h1>${escape(info.title)}</h1><p>${escape(info.intro)}</p></header>
  <nav aria-label="Informacje o aplikacji"><a href="support.html"${page === "support" ? ' aria-current="page"' : ""}>Pomoc</a><a href="privacy.html"${page === "privacy" ? ' aria-current="page"' : ""}>Prywatność</a></nav>
  ${info.sections.map((section) => `<section><h2>${escape(section.title)}</h2>${section.paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join("")}</section>`).join("\n")}
  <footer><p>${escape(applicationInformation.publisher)} · CHMURNIK</p><a href="${escape(applicationInformation.supportUrl)}" rel="noreferrer">${escape(applicationInformation.supportLabel)}</a></footer>
</main></body></html>
`;
}

export function publicInformationPages() {
  return {
    name: "chmurnik-public-information",
    generateBundle() {
      for (const page of Object.keys(applicationInformation.pages)) {
        this.emitFile({
          type: "asset",
          fileName: `${page}.html`,
          source: renderInformationPage(page),
        });
      }
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url, "http://localhost").pathname;
        const page = Object.keys(applicationInformation.pages).find(
          (key) => pathname === `${server.config.base}${key}.html`,
        );
        if (!page) return next();
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(renderInformationPage(page));
      });
    },
  };
}
