import assert from 'node:assert/strict';
import { mkdir, writeFile, copyFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { stories, posts, webUrl, workshopUrl, storeUrl, copyStatus, title, availability } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');
const site = resolve(here, 'site');
const exports = JSON.parse(await readFile(resolve(site, 'exports-manifest.json'), 'utf8'));
assert.equal(copyStatus, 'approved');
assert.equal(exports.copyHash, createHash('sha256').update(JSON.stringify({ stories, posts })).digest('hex'), 'Re-render assets after any approved-copy change');
assert.equal(exports.artworks.length, 21);
for (const item of [...exports.artworks, ...exports.documents]) {
  assert.equal(createHash('sha256').update(await readFile(resolve(site, item.file))).digest('hex'), item.sha256, `Changed export: ${item.file}`);
}
const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
await mkdir(resolve(site, 'teksty'), { recursive: true });
await mkdir(resolve(site, 'assets'), { recursive: true });
for (const font of ['Roobert-Regular.woff2', 'Roobert-Bold.woff2', 'Romie-Regular.woff2']) {
  await copyFile(resolve(root, 'public/fonts', font), resolve(site, 'assets', font));
}
await copyFile(resolve(root, 'public/brand/chmurnik-wordmark.png'), resolve(site, 'assets/wordmark.png'));
await copyFile(resolve(site, 'assets/art/01-nebo.webp'), resolve(site, 'assets/cover.webp'));
// Retain the owner's established mobile download-gallery presentation.
await copyFile(resolve(here, '../2026-09-08-pogoda/site/copy.js'), resolve(site, 'copy.js'));
const galleryCss = await readFile(resolve(here, '../2026-09-08-pogoda/site/style.css'), 'utf8');
await writeFile(resolve(site, 'style.css'), galleryCss + '\n' + await readFile(resolve(here, 'exports-gallery.css'), 'utf8'));
const copy = `CHMURNIK: ${title}\nZAAKCEPTOWANE TEKSTY, 09.09.2026\n\n${availability}\n\nWWW: ${webUrl}\nPracownie: ${workshopUrl}\nApp Store (nie potwierdza dostępności 1.2.1): ${storeUrl}\nBiblioteka: https://jakiesluchawki.github.io/chmurnik/assetySM/\n\n` + stories.map((s, i) => `STORY / SLAJD ${i + 1}: ${s.title}\n${s.text}\nLink do naklejki: ${workshopUrl}`).join('\n\n') + '\n\n' + Object.entries(posts).map(([p, text]) => `${p.toUpperCase()}\n${text}`).join('\n\n');
await writeFile(resolve(site, 'TEKSTY-I-LINKI.txt'), copy + '\n');
for (const [p, text] of Object.entries(posts)) await writeFile(resolve(site, 'teksty', `${p}-post.txt`), text + '\n');
await writeFile(resolve(site, 'PUBLIKACJA.txt'), `CHMURNIK / NIEBO MA SWOJE POWODY / 09.09.2026

STORIES: 10 statycznych PNG 1080 x 1920 w folderze stories, kolejność 01-10.
Każda plansza zawiera całą zaakceptowaną treść. Bez muzyki i bez filmu.
Dodaj naklejkę z linkiem ${workshopUrl} w wolnym dolnym polu.
Adres narysowany na grafice nie jest aktywną naklejką. Nie przycinaj plansz.

INSTAGRAM POST: 10 PNG 1080 x 1350 z folderu karuzela, kolejność 01-10.
Wklej cały opis z teksty/instagram-post.txt. Odsyła do linku w Stories,
więc opublikuj także Story z naklejką. Alt-teksty: teksty/alt-teksty.txt.

FACEBOOK: dodaj facebook/chmurnik-pracownie-facebook.png i wklej cały
tekst z teksty/facebook-post.txt. Możesz też użyć całej karuzeli.

LINKEDIN: dodaj CHMURNIK-PRACOWNIE-LINKEDIN.pdf jako dokument, nie zdjęcie.
Tytuł dokumentu: ${title} CHMURNIK
Opis: teksty/linkedin-post.txt. PDF ma 10 stron, zaznaczalny tekst i linki.
Jeśli komputer nie pokazuje opcji Dokument, użyj aplikacji LinkedIn na telefonie,
w której właściciel potwierdził tę funkcję przy poprzednim pakiecie.

DOSTĘPNOŚĆ: ${availability}
Przed późniejszą publikacją zweryfikuj aktualny status Apple. Ten pakiet
nie ogłasza nowego modelu rozpoznawania chmur. Materiały są edukacyjne,
nie zastępują oficjalnej prognozy ani briefingu przed lotem lub żeglugą.

ILUSTRACJE: 10 nowych motywów wygenerowanych przez ImageGen, nie fotografie
obserwacyjne, nie zrzuty interfejsu i nie dokładne diagramy naukowe.
Skład, typografia Romie/Roobert i wszystkie teksty wykonane deterministycznie.
PNG mają docelowe wymiary. Nie wysłano żadnych postów na konta społecznościowe.

Biblioteka: https://jakiesluchawki.github.io/chmurnik/assetySM/
Pakiet: https://jakiesluchawki.github.io/chmurnik/premiera/pracownie/
`);
const common = ['PUBLIKACJA.txt', 'TEKSTY-I-LINKI.txt', 'teksty/alt-teksty.txt'];
const archives = [
  { file: 'CHMURNIK-PRACOWNIE-STORIES.zip', label: '10 Stories PNG', entries: [...common, ...exports.artworks.filter(a => a.format === 'stories').map(a => a.file)] },
  { file: 'CHMURNIK-PRACOWNIE-INSTAGRAM.zip', label: 'Karuzela i opis', entries: [...common, 'teksty/instagram-post.txt', ...exports.artworks.filter(a => a.format === 'karuzela').map(a => a.file)] },
  { file: 'CHMURNIK-PRACOWNIE-FACEBOOK.zip', label: 'Facebook: grafika i post', entries: [...common, 'teksty/facebook-post.txt', ...exports.artworks.filter(a => a.format === 'facebook').map(a => a.file)] },
  { file: 'CHMURNIK-PRACOWNIE-LINKEDIN.zip', label: 'LinkedIn: PDF i post', entries: [...common, 'teksty/linkedin-post.txt', ...exports.documents.map(d => d.file)] },
  { file: 'CHMURNIK-PRACOWNIE-PELNY-PAKIET.zip', label: 'Cały pakiet', entries: [...common, ...Object.keys(posts).map(p => `teksty/${p}-post.txt`), ...exports.artworks.map(a => a.file), ...exports.documents.map(d => d.file)] },
];
const staging = await mkdtemp(resolve(tmpdir(), 'chmurnik-sm-'));
try {
  for (const archive of archives) {
    assert.equal(new Set(archive.entries).size, archive.entries.length);
    const target = resolve(staging, archive.file);
    execFileSync('zip', ['-q', '-X', target, ...archive.entries], { cwd: site });
    execFileSync('unzip', ['-t', target]);
    assert.deepEqual(execFileSync('unzip', ['-Z1', target], { encoding: 'utf8' }).trim().split('\n'), archive.entries);
    await copyFile(target, resolve(site, archive.file));
    const bytes = await readFile(target);
    Object.assign(archive, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
} finally { await rm(staging, { recursive: true, force: true }); }
await writeFile(resolve(site, 'manifest.json'), JSON.stringify({ date: '2026-09-09', copyStatus, title, availability, stories, posts, webUrl, workshopUrl, storeUrl, renderedSocialAssets: true, copyHash: exports.copyHash, artworks: exports.artworks, documents: exports.documents, archives }, null, 2) + '\n');
const asset = (format, number) => exports.artworks.find(a => a.format === format && a.number === number);
const download = (file, label) => `<a class="button" href="${file}" download>${label}</a>`;
const revision = createHash('sha256').update(await readFile(resolve(site, 'style.css'))).digest('hex').slice(0, 12);
await writeFile(resolve(site, 'index.html'), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(title)} · Materiały SM · CHMURNIK</title><link rel="stylesheet" href="style.css?v=${revision}"></head><body>
<header><img src="assets/wordmark.png" alt="CHMURNIK"><a href="../../assetySM/">Wszystkie materiały SM</a></header>
<main><p class="eyebrow">PRACOWNIE POGODY · WWW I APLIKACJE</p><h1>${escape(title)}</h1>
<div class="banner"><img src="assets/cover.webp" alt="Stylizowane otwarte okno, za którym widać krajobraz i chmurę w świetle poranka"><div>
<p class="status">Gotowy pakiet · zaakceptowane teksty · 9 września 2026</p><p>${escape(availability)}</p>
<p>10 nowych ilustracji, 10 statycznych Stories, 10 slajdów karuzeli, grafika Facebooka i 10-stronicowy PDF na LinkedIn. Każda plansza zawiera całą zatwierdzoną treść. Wszystkie posty znajdziesz poniżej.</p>
${download('CHMURNIK-PRACOWNIE-PELNY-PAKIET.zip', 'Pobierz cały pakiet')}${download('TEKSTY-I-LINKI.txt', 'Pełne teksty i linki')}
<p class="note">PNG, nie filmy. Ilustracje są stylizowane, nie są zdjęciami obserwacyjnymi ani zrzutami aplikacji. Żadne materiały nie zostały automatycznie opublikowane na kontach społecznościowych.</p></div></div>
<nav class="links"><a href="#pobierz">Paczki ZIP</a><a href="#stories">10 Stories i karuzela</a><a href="#instagram">Instagram</a><a href="#facebook">Facebook</a><a href="#linkedin">LinkedIn</a><a href="#linki">Linki</a></nav>
<section class="section" id="pobierz"><h2>Gotowe do pobrania.</h2><div class="download-grid">${archives.map(a => `<a class="download-card" href="${a.file}" download><strong>${a.label}</strong><span>ZIP · ${(a.bytes / 1048576).toFixed(1)} MB</span></a>`).join('')}</div><p class="note">Pobieraj PNG przyciskami pod podglądem, nie zapisuj pomniejszonego JPG. Instrukcja publikacji jest w każdej paczce.</p>${download('PUBLIKACJA.txt', 'Instrukcja publikacji')}</section>
<section class="section" id="stories"><h2>Cała opowieść.</h2>${stories.map((s, i) => `<article class="story"><span>STORY / SLAJD ${String(i + 1).padStart(2, '0')}</span><h3>${escape(s.title)}</h3><div class="slide-previews">${[['stories', 'Story', '1080 × 1920'], ['karuzela', 'Karuzela', '1080 × 1350']].map(([format, label, size]) => { const a = asset(format, i + 1); return `<figure><a href="${a.file}"><img src="${a.preview}" width="432" height="${format === 'stories' ? 768 : 540}" loading="lazy" alt="${escape(a.alt)}"></a><figcaption>${label} · ${size}</figcaption>${download(a.file, `Pobierz PNG: ${label}`)}</figure>`; }).join('')}</div><p>${escape(s.text)}</p></article>`).join('')}</section>
${Object.entries(posts).map(([p, text]) => `<section class="section" id="${p}"><h2>${p === 'linkedin' ? 'LinkedIn' : p === 'facebook' ? 'Facebook' : 'Instagram'}</h2>${p === 'facebook' ? `<a href="${asset('facebook', 1).file}"><img class="facebook-preview" src="${asset('facebook', 1).preview}" width="432" height="540" alt="${escape(asset('facebook', 1).alt)}"></a>${download(asset('facebook', 1).file, 'Pobierz grafikę Facebooka')}` : p === 'linkedin' ? `${download('CHMURNIK-PRACOWNIE-LINKEDIN.pdf', 'Pobierz PDF na LinkedIn')}<p>Dodaj PDF jako dokument. Tytuł: <strong>${escape(title)} CHMURNIK</strong>. Wklej cały opis poniżej.</p>` : download('CHMURNIK-PRACOWNIE-INSTAGRAM.zip', 'Pobierz karuzelę i opis')}<article class="post"><pre id="text-${p}">${escape(text)}</pre></article><button class="button" data-copy="text-${p}">Kopiuj cały post</button><a href="teksty/${p}-post.txt" download>Pobierz TXT</a></section>`).join('')}
<section class="section" id="linki"><h2>Linki do publikacji.</h2><p>Do naklejki o nowych pracowniach użyj strony WWW. Link App Store prowadzi do karty aplikacji; nie dowodzi, że wersja 1.2.1 została już udostępniona.</p>
${[['web', 'Strona WWW', webUrl], ['workshop', 'Pracownie', workshopUrl], ['store', 'App Store', storeUrl]].map(([id, label, url]) => `<p><label for="link-${id}">${label}</label></p><input id="link-${id}" readonly value="${url}"><button class="button" data-copy="link-${id}">Kopiuj link</button>`).join('')}
</section></main><footer>Stała biblioteka: <a href="../../assetySM/">CHMURNIK / assetySM</a>. Ten zestaw nie ogłasza nowego modelu rozpoznawania chmur.</footer><script src="copy.js"></script></body></html>`);
execFileSync('zip', ['-q', '-r', 'CHMURNIK-PRACOWNIE-TEKSTY.zip', 'TEKSTY-I-LINKI.txt', 'teksty', 'manifest.json'], { cwd: site });
console.log('Final gallery ready: 21 PNG, 10-page PDF, five platform ZIPs and complete approved copy.');
