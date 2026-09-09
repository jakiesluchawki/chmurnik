import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { stories, posts, webUrl, workshopUrl, storeUrl, copyStatus, title, availability } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');
const site = resolve(here, 'site');
const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
await mkdir(resolve(site, 'teksty'), { recursive: true });
await mkdir(resolve(site, 'assets'), { recursive: true });
for (const font of ['Roobert-Regular.woff2', 'Roobert-Bold.woff2', 'Romie-Regular.woff2']) {
  await copyFile(resolve(root, 'public/fonts', font), resolve(site, 'assets', font));
}
await copyFile(resolve(root, 'public/brand/chmurnik-wordmark.png'), resolve(site, 'assets/wordmark.png'));
await copyFile(resolve(root, 'weather-preview/public/covers/wind-v1.webp'), resolve(site, 'assets/cover.webp'));
// Retain the owner's established mobile download-gallery presentation.
await copyFile(resolve(here, '../2026-09-08-pogoda/site/copy.js'), resolve(site, 'copy.js'));
const galleryCss = await readFile(resolve(here, '../2026-09-08-pogoda/site/style.css'), 'utf8');
await writeFile(resolve(site, 'style.css'), galleryCss + '\n.banner>img{object-position:50% 25%}\n');
const copy = `CHMURNIK: ${title}\nTEKSTY DO AKCEPTACJI, 09.09.2026\n\n${availability}\n\nWWW: ${webUrl}\nPracownie: ${workshopUrl}\nApp Store (nie potwierdza dostępności 1.2.1): ${storeUrl}\nBiblioteka: https://jakiesluchawki.github.io/chmurnik/assetySM/\n\n` + stories.map((s, i) => `STORY / SLAJD ${i + 1}: ${s.title}\n${s.text}\nLink do naklejki: ${workshopUrl}`).join('\n\n') + '\n\n' + Object.entries(posts).map(([p, text]) => `${p.toUpperCase()}\n${text}`).join('\n\n');
await writeFile(resolve(site, 'TEKSTY-I-LINKI.txt'), copy + '\n');
for (const [p, text] of Object.entries(posts)) await writeFile(resolve(site, 'teksty', `${p}-post.txt`), text + '\n');
await writeFile(resolve(site, 'manifest.json'), JSON.stringify({ date: '2026-09-09', copyStatus, title, availability, stories, posts, webUrl, workshopUrl, storeUrl, renderedSocialAssets: false }, null, 2) + '\n');
const revision = createHash('sha256').update(await readFile(resolve(site, 'style.css'))).digest('hex').slice(0, 12);
await writeFile(resolve(site, 'index.html'), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(title)} · Materiały SM · CHMURNIK</title><link rel="stylesheet" href="style.css?v=${revision}"></head><body>
<header><img src="assets/wordmark.png" alt="CHMURNIK"><a href="../../assetySM/">Wszystkie materiały SM</a></header>
<main><p class="eyebrow">PRACOWNIE POGODY · WWW I APLIKACJE</p><h1>${escape(title)}</h1>
<div class="banner"><img src="assets/cover.webp" alt="Stylizowana ilustracja obserwacji wiatru z pracowni CHMURNIKA"><div>
<p class="status">Pełne teksty do akceptacji · 9 września 2026</p><p>${escape(availability)}</p>
<p>Wszystkie 10 Stories i slajdów karuzeli oraz posty na trzy platformy są poniżej, w całości. To nowy zestaw, zastępujący zapowiedź dwóch doświadczeń z 8 września.</p>
<a class="button" href="TEKSTY-I-LINKI.txt" download>Pobierz pełny tekst</a><a class="button" href="CHMURNIK-PRACOWNIE-TEKSTY.zip" download>Pobierz paczkę tekstów</a>
<p class="note">Finalne 10 statycznych Stories PNG, karuzela PNG, grafika Facebooka i dokument LinkedIn PDF powstaną po akceptacji treści. Nie publikowano postów na kontach. Ilustracja powyżej pochodzi z pracowni, nie jest gotową planszą społecznościową.</p></div></div>
<nav class="links"><a href="#stories">10 Stories i karuzela</a><a href="#instagram">Instagram</a><a href="#facebook">Facebook</a><a href="#linkedin">LinkedIn</a><a href="#linki">Linki</a></nav>
<section class="section" id="stories"><h2>Cała opowieść.</h2>${stories.map((s, i) => `<article class="story"><span>STORY / SLAJD ${String(i + 1).padStart(2, '0')}</span><h3>${escape(s.title)}</h3><p>${escape(s.text)}</p></article>`).join('')}</section>
${Object.entries(posts).map(([p, text]) => `<section class="section" id="${p}"><h2>${p === 'linkedin' ? 'LinkedIn' : p === 'facebook' ? 'Facebook' : 'Instagram'}</h2><article class="post"><pre id="text-${p}">${escape(text)}</pre></article><button class="button" data-copy="text-${p}">Kopiuj cały post</button><a href="teksty/${p}-post.txt" download>Pobierz TXT</a></section>`).join('')}
<section class="section" id="linki"><h2>Linki do publikacji.</h2><p>Do naklejki o nowych pracowniach użyj strony WWW. Link App Store prowadzi do karty aplikacji; nie dowodzi, że wersja 1.2.1 została już udostępniona.</p>
${[['web', 'Strona WWW', webUrl], ['workshop', 'Pracownie', workshopUrl], ['store', 'App Store', storeUrl]].map(([id, label, url]) => `<p><label for="link-${id}">${label}</label></p><input id="link-${id}" readonly value="${url}"><button class="button" data-copy="link-${id}">Kopiuj link</button>`).join('')}
</section></main><footer>Stała biblioteka: <a href="../../assetySM/">CHMURNIK / assetySM</a>. Ten zestaw nie ogłasza nowego modelu rozpoznawania chmur.</footer><script src="copy.js"></script></body></html>`);
execFileSync('zip', ['-q', '-r', 'CHMURNIK-PRACOWNIE-TEKSTY.zip', 'TEKSTY-I-LINKI.txt', 'teksty', 'manifest.json'], { cwd: site });
console.log('Complete 10-story/carousel copy and three posts prepared. Final PNG/PDF await copy approval.');
