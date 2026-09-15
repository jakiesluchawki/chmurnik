import assert from 'node:assert/strict';
import { mkdir, writeFile, copyFile, readFile, mkdtemp, rm, utimes, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { themes, title, copyStatus, webUrl, libraryUrl, packUrl, sources } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url)), root = resolve(here, '../..'), site = resolve(here, 'site');
const exports = JSON.parse(await readFile(resolve(site, 'exports-manifest.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(copyStatus, 'owner-delegated-production'); assert.equal(themes.length, 2);
assert.equal(exports.copyHash, hash(JSON.stringify(themes)), 'Re-render after any copy change');
assert.equal(exports.artworks.length, 48); assert.equal(exports.documents.length, 2); assert.equal(exports.mosaics.length, 2);
for (const item of [...exports.artworks, ...exports.documents, ...exports.mosaics]) assert.equal(hash(await readFile(resolve(site, item.file))), item.sha256, item.file);
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
await mkdir(resolve(site, 'assets'), { recursive: true });
for (const f of ['Roobert-Regular.woff2', 'Roobert-Bold.woff2', 'Romie-Regular.woff2']) await copyFile(resolve(root, 'public/fonts', f), resolve(site, 'assets', f));
await copyFile(resolve(root, 'public/brand/chmurnik-wordmark.png'), resolve(site, 'assets/wordmark.png'));
for (const f of ['style.css', 'copy.js']) await copyFile(resolve(here, f), resolve(site, f));
const sourceNotes = sources.map(([label, url]) => label + ': ' + url).join('\n');
const storyLink = (theme, number) => theme.id === 'woda' && [6, 7].includes(number) ? 'https://chmurnik.cloud/pogoda-preview/#mgla' : theme.id === 'woda' && number === 8 ? 'https://chmurnik.cloud/pogoda-preview/#wiatr' : theme.link;
const instructions = `CHMURNIK / DWIE OPOWIEŚCI / 15.09.2026

DOKŁADNIE DWA TEMATY, po 10 Stories. Razem 20 statycznych PNG.
Temat CHMURY: Co chmura mówi o powietrzu?
Temat WODA: Wieczór nad wodą ma swoją fizykę.

STORIES: w każdym temacie stories/01.png do 10.png, 1080 x 1920.
Nie przycinaj. Dodaj aktywną naklejkę z linkiem; dolne pole jest na nią wolne.
Chmury: https://chmurnik.cloud/pogoda-preview/#chmura
Bryza: https://chmurnik.cloud/pogoda-preview/#bryza
Mgła: https://chmurnik.cloud/pogoda-preview/#mgla
Wiatr: https://chmurnik.cloud/pogoda-preview/#wiatr
Sam adres narysowany na PNG nie jest aktywnym linkiem.

INSTAGRAM: trzy POSTY/KARUZELE NA TEMAT, nie trzy tematy.
Każdy post ma własną okładkę i pełne plansze opowieści wewnątrz.
W każdym temacie publikuj foldery instagram/ w tej kolejności:
1. 01-post: PRAWA okładka, część 3, slajdy 8-10.
2. 02-post: ŚRODKOWA okładka, część 2, slajdy 5-7.
3. 03-post: LEWA okładka, część 1, slajdy 1-4.
W poście wybierz najpierw 00-okladka.png, potem ponumerowane slajdy.
Wklej CAŁY opis z opis-instagram.txt w tym samym folderze.

Taki odwrócony porządek sprawia, że po zakończeniu rząd profilu układa się
od lewej do prawej w pełną panoramę. Części są samodzielne; możesz opublikować
je jedna po drugiej. Przed zakończeniem trójki siatka będzie niepełna.
Publikuj najpierw komplet CHMURY, potem komplet WODA (np. następnego dnia).
Wtedy WODA będzie górnym rzędem, CHMURY dolnym: patrz siatka-6-postow.jpg.
Nie wstawiaj pomiędzy tymi postami innej publikacji. Nowe pojedyncze posty
przesuwają siatkę; rząd wróci do wyrównania po kolejnej pełnej trójce.

FORMAT: 1080 x 1440, 3:4, także wszystkie plansze wewnątrz karuzeli.
Nie zmieniaj kadru, nie dodawaj ramek ani nie skaluj okładek osobno.
Podgląd pokazuje projekt dla siatki 3:4, NIE zrzut konta mieszko.wav.
Prawdziwy profil był niedostępny po odmowie automatycznej kontroli dostępu.
Sprawdź podgląd kadru przed publikacją. Przypięte posty lub ręcznie zmieniona
kolejność profilu mogą przesunąć skład; nie zmieniałem Twojego konta.
Panoramy są jednym wspólnym płótnem, nie trzema podobnymi obrazkami.
Rekonstrukcja trzech okładek jest dokładna piksel w piksel.
Istniejące odstępy Instagrama między kafelkami pozostaną widoczne.

Klasyczna alternatywa: karuzela/01.png do 10.png jako jeden post na temat,
z opisem teksty/instagram-post.txt. NIE tworzy rzędu trzech okładek.
Nie publikuj jednocześnie obu wariantów, chyba że świadomie chcesz powtórzyć treść.

FACEBOOK: facebook/01.png i pełny tekst teksty/facebook-post.txt na temat.
Można zamiast jednej grafiki użyć 10 plansz z karuzela/.
LINKEDIN: PDF w folderze tematu dodaj jako dokument. Ma 10 stron i pełne
zaznaczalne teksty, aktywny link do pracowni i tytuł identyczny z tematem.
Opis: teksty/linkedin-post.txt. Opcja Dokument była wcześniej dostępna
w Twojej aplikacji LinkedIn na iPhonie; nie zakładam jej obecności na WWW.

PRAWDA O MATERIAŁACH: 12 nowych ilustracji ImageGen, nie zdjęcia obserwacyjne
i nie zrzuty interfejsu. Atlas w CHMURNIKU używa prawdziwych fotografii;
te ilustracje są tylko oprawą opowieści. Źródła naukowe są w ZRODLA.txt.
Panoramy źródłowe: 1881 x 836. Eksport 3240 x 1440 jest powiększony.
Pozostałe źródła: 1536 x 1024. PNG sociali są składami w docelowych wymiarach.
Nie jest to ogłoszenie nowego modelu ML ani obietnica trafności rozpoznawania.
Nie ogłaszam nowych buildów Apple ani ich bieżącego statusu. Pakiet kieruje
do WWW; nie podmieniałem chmurnik.cloud. To nauka, nie prognoza ani briefing.
Nie opublikowałem żadnego posta w Twoim imieniu.

Stała biblioteka: ${libraryUrl}
Ten pakiet: ${packUrl}
`;
await writeFile(resolve(site, 'PUBLIKACJA.txt'), instructions);
await writeFile(resolve(site, 'ZRODLA.txt'), sourceNotes + '\n');
const allTexts = [];
const archives = [];
const common = ['PUBLIKACJA.txt', 'TEKSTY-I-LINKI.txt', 'ZRODLA.txt'];
for (const theme of themes) {
  await mkdir(resolve(site, theme.id, 'teksty'), { recursive: true });
  const text = theme.title + '\n\n' + theme.stories.map((s, i) => 'STORY ' + String(i + 1).padStart(2, '0') + ': ' + s.title + '\n' + s.text + '\nLink do naklejki: ' + storyLink(theme, i + 1)).join('\n\n') + '\n\n' + Object.entries(theme.posts).map(([p, s]) => p.toUpperCase() + '\n' + s).join('\n\n') + '\n\n' + theme.parts.map((p, i) => 'INSTAGRAM CZĘŚĆ ' + (i + 1) + '\n' + p.caption).join('\n\n');
  allTexts.push(text);
  for (const [platform, caption] of Object.entries(theme.posts)) await writeFile(resolve(site, theme.id, 'teksty', platform + '-post.txt'), caption + '\n');
  await writeFile(resolve(site, theme.id, 'teksty', 'alt-teksty.txt'), exports.artworks.filter(a => a.theme === theme.id).map(a => a.file + '\n' + a.alt).join('\n\n') + '\n');
  const igFiles = [];
  for (let x = 0; x < 3; x++) {
    const order = 3 - x, dir = theme.id + '/instagram/0' + order + '-post';
    const part = theme.parts[x];
    await mkdir(resolve(site, dir), { recursive: true });
    await writeFile(resolve(site, dir, 'opis-instagram.txt'), part.caption + '\n');
    igFiles.push(dir + '/00-okladka.png', dir + '/opis-instagram.txt');
    for (let j = 0; j < part.numbers.length; j++) {
      const name = dir + '/' + String(j + 1).padStart(2, '0') + '-slajd-' + String(part.numbers[j]).padStart(2, '0') + '.png';
      await copyFile(resolve(site, theme.id, 'karuzela', String(part.numbers[j]).padStart(2, '0') + '.png'), resolve(site, name));
      igFiles.push(name);
    }
  }
  const prefix = 'CHMURNIK-' + theme.id.toUpperCase();
  const platformFiles = p => exports.artworks.filter(a => a.theme === theme.id && a.format === p).map(a => a.file);
  const ownCommon = [...common, theme.id + '/teksty/alt-teksty.txt'];
  const doc = exports.documents.find(a => a.theme === theme.id).file;
  const groups = [
    ['STORIES', '10 Stories PNG', platformFiles('stories')],
    ['INSTAGRAM', '3 karuzele + panorama profilu', [...igFiles, theme.id + '/teksty/instagram-post.txt', theme.id + '/siatka/podglad.jpg']],
    ['FACEBOOK', 'Facebook: grafika i pełny post', [...platformFiles('facebook'), theme.id + '/teksty/facebook-post.txt']],
    ['LINKEDIN', 'LinkedIn: 10-stronicowy PDF i post', [doc, theme.id + '/teksty/linkedin-post.txt']],
    ['CALOSC', 'Cały temat', [...platformFiles('stories'), ...igFiles, ...platformFiles('facebook'), doc, ...Object.keys(theme.posts).map(p => theme.id + '/teksty/' + p + '-post.txt'), theme.id + '/siatka/podglad.jpg']],
  ];
  for (const [id, label, files] of groups) archives.push({ theme: theme.id, kind: id, file: prefix + '-' + id + '.zip', label, entries: [...ownCommon, ...files] });
}
await writeFile(resolve(site, 'TEKSTY-I-LINKI.txt'), title + '\nPEŁNA TREŚĆ / WYBÓR I PRODUKCJA ZLECONE PRZEZ WŁAŚCICIELA / 15.09.2026\n\n' + allTexts.join('\n\n====================\n\n') + '\n\n' + sourceNotes + '\n');
archives.push({ theme: 'both', kind: 'CALOSC', file: 'CHMURNIK-NIEBO-I-WODA-CALOSC.zip', label: 'Oba tematy: cały pakiet', entries: [...new Set([...archives.filter(a => a.kind === 'CALOSC').flatMap(a => a.entries), 'siatka-6-postow.jpg'])] });
const staging = await mkdtemp(resolve(tmpdir(), 'chmurnik-two-sm-'));
try {
  const fixedTime = new Date('2026-09-15T00:00:00Z');
  for (const file of new Set(archives.flatMap(a => a.entries))) {
    const target = resolve(staging, 'content', file);
    await mkdir(resolve(target, '..'), { recursive: true });
    await copyFile(resolve(site, file), target);
    await chmod(target, 0o644);
    await utimes(target, fixedTime, fixedTime);
  }
  for (const archive of archives) {
    assert.equal(new Set(archive.entries).size, archive.entries.length);
    const out = resolve(staging, archive.file);
    execFileSync('zip', ['-q', '-0', '-X', out, ...archive.entries], { cwd: resolve(staging, 'content'), env: { ...process.env, TZ: 'UTC' } });
    execFileSync('unzip', ['-t', out]);
    assert.deepEqual(execFileSync('unzip', ['-Z1', out], { encoding: 'utf8' }).trim().split('\n'), archive.entries);
    await copyFile(out, resolve(site, archive.file));
    const bytes = await readFile(out); Object.assign(archive, { bytes: bytes.length, sha256: hash(bytes) });
  }
} finally { await rm(staging, { recursive: true, force: true }); }
const releaseBase = 'https://github.com/jakiesluchawki/chmurnik/releases/download/sm-niebo-woda-20260915/';
for (const archive of archives) archive.url = releaseBase + archive.file;
const galleryArchives = archives.map(a => ({ ...a, file: a.url }));
await writeFile(resolve(site, 'manifest.json'), JSON.stringify({ date: '2026-09-15', title, copyStatus, themes, sourceNotes, archives, copyHash: exports.copyHash, counts: { themes: 2, stories: 20, mosaicCovers: 6, instagramPosts: 6, facebookPosts: 2, linkedinDocuments: 2 }, profileInspected: false, profileBlock: 'Auto-review denied broad Instagram-origin access', libraryUrl, packUrl }, null, 2) + '\n');
const download = (file, label) => '<a class="button" href="' + (archives.find(a => a.file === file)?.url || file) + '" download>' + esc(label) + '</a>';
const aFor = (theme, format, number) => exports.artworks.find(a => a.theme === theme.id && a.format === format && a.number === number);
const platformName = p => p === 'linkedin' ? 'LinkedIn' : p === 'facebook' ? 'Facebook' : 'Instagram';
const themeHtml = theme => {
  const own = galleryArchives.filter(a => a.theme === theme.id);
  return '<article class="theme ' + theme.id + '" id="' + theme.id + '"><div class="theme-header"><p class="eyebrow">TEMAT ' + (theme.id === 'chmury' ? '01' : '02') + ' / ' + theme.label + '</p><h2>' + esc(theme.title) + '</h2><p>10 Stories, trzy samodzielne karuzele z okładkami tworzącymi jeden rząd, Facebook i dokument na LinkedIn.</p><div class="buttons">' + download(own.find(a => a.kind === 'CALOSC').file, 'Pobierz cały temat') + '<a href="#' + theme.id + '-stories">Zobacz pełną opowieść</a></div></div><img class="grid-preview" src="' + theme.id + '/siatka/podglad.jpg" width="1296" height="576" alt="Projekt jednego rzędu: trzy okładki składają się w ciągłą panoramę"><section class="section"><h3>Paczki do pobrania</h3><div class="download-grid">' + own.map(a => '<a class="download" href="' + a.file + '" download><strong>' + esc(a.label) + '</strong><span>ZIP / ' + (a.bytes / 1048576).toFixed(1) + ' MB</span></a>').join('') + '</div></section><section class="section" id="' + theme.id + '-stories"><h3>Wszystkie 10 Stories, pełne teksty</h3><p class="note">Pobieraj PNG przyciskiem. Podglądy JPG są pomniejszone. Do aktywnej naklejki użyj: <a href="' + theme.link + '">' + theme.link + '</a>.</p><div class="story-grid">' + theme.stories.map((s, i) => { const a = aFor(theme, 'stories', i + 1), c = aFor(theme, 'karuzela', i + 1); return '<article class="story-card"><small>STORY ' + String(i + 1).padStart(2, '0') + ' / 10</small><h3>' + esc(s.title) + '</h3><a href="' + a.file + '"><img src="' + a.preview + '" width="432" height="768" loading="lazy" alt="' + esc(a.alt) + '"></a>' + download(a.file, 'Story PNG / 1080 × 1920') + download(c.file, 'Slajd PNG / 1080 × 1440') + '<p>' + esc(s.text) + '</p></article>'; }).join('') + '</div></section><section class="section" id="' + theme.id + '-instagram"><h3>Instagram: trzy części, jeden obraz</h3><p>Na profilu oglądasz je od lewej do prawej. Publikujesz odwrotnie: <strong>prawa, środkowa, lewa</strong>. Poniżej są pełne opisy każdego posta; gotowe foldery są ponumerowane według kolejności publikacji.</p><div class="post-grid">' + theme.parts.map((p, x) => { const cover = exports.artworks.find(a => a.theme === theme.id && a.format === 'okladka' && a.part === x + 1); const id = theme.id + '-ig-' + x; return '<article class="post"><a href="' + cover.file + '"><img src="' + cover.preview + '" width="432" height="576" loading="lazy" alt="' + esc(cover.alt) + '"></a><div><p class="eyebrow">CZĘŚĆ ' + (x + 1) + ' / PUBLIKUJ JAKO ' + (3 - x) + '</p><h3>' + esc(p.title) + '</h3><pre class="caption" id="' + id + '">' + esc(p.caption) + '</pre><button data-copy="' + id + '">Kopiuj cały opis</button>' + download(theme.id + '/instagram/0' + (3 - x) + '-post/opis-instagram.txt', 'Opis TXT') + '</div></article>'; }).join('') + '</div></section>' + Object.entries(theme.posts).map(([p, text]) => '<section class="platform" id="' + theme.id + '-' + p + '-post"><p class="eyebrow">' + platformName(p).toUpperCase() + (p === 'instagram' ? ' / ALTERNATYWA: JEDNA KLASYCZNA KARUZELA' : '') + '</p><h3>' + (p === 'linkedin' ? 'Tytuł dokumentu: ' : '') + esc(theme.title) + '</h3>' + (p === 'facebook' ? '<a href="' + aFor(theme, 'facebook', 1).file + '"><img src="' + aFor(theme, 'facebook', 1).preview + '" width="432" height="576" loading="lazy" alt="Grafika Facebooka z pełnym tekstem pierwszej planszy"></a>' + download(aFor(theme, 'facebook', 1).file, 'Pobierz PNG Facebooka') : p === 'linkedin' ? download(exports.documents.find(d => d.theme === theme.id).file, 'Pobierz 10-stronicowy PDF') : '') + '<pre class="caption" id="' + theme.id + '-text-' + p + '">' + esc(text) + '</pre><div class="buttons"><button data-copy="' + theme.id + '-text-' + p + '">Kopiuj cały post</button>' + download(theme.id + '/teksty/' + p + '-post.txt', 'Pełny tekst TXT') + '</div></section>').join('') + '</article>';
};
const rev = hash(await readFile(resolve(site, 'style.css'))).slice(0, 12);
await writeFile(resolve(site, 'index.html'), '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#ffe2ec"><title>Dwie opowieści / Stories i mozaiki / CHMURNIK</title><link rel="stylesheet" href="style.css?v=' + rev + '"></head><body><header><img src="assets/wordmark.png" width="200" alt="CHMURNIK"><a href="../../assetySM/">Wszystkie materiały SM</a></header><main><p class="eyebrow">15 WRZEŚNIA 2026 / DWA TEMATY / GOTOWE PNG</p><h1>Niebo i woda mają swoje opowieści.</h1><p class="intro">Dwie serie po 10 Stories. Dwie panoramy, każda podzielona na trzy okładki postów. Pełne karuzele, Facebook i LinkedIn. Wszystkie teksty są poniżej, bez szukania po paczkach.</p><div class="buttons">' + download('CHMURNIK-NIEBO-I-WODA-CALOSC.zip', 'Pobierz oba tematy') + download('TEKSTY-I-LINKI.txt', 'Pełne teksty i linki') + '</div><nav aria-label="Sekcje pakietu"><a href="#siatka">Układ profilu</a><a href="#chmury">Chmury i powietrze</a><a href="#woda">Wieczór nad wodą</a><a href="#publikacja">Jak publikować</a><a href="#zrodla">Źródła i granice</a></nav><section class="section" id="siatka"><h2>Dwa rzędy, dwa krajobrazy.</h2><img class="grid-preview" src="siatka-6-postow.jpg" width="1296" height="1158" alt="Projekt siatki sześciu postów: górny rząd tworzy wieczorną zatokę, dolny jeden krajobraz z chmurami"><p class="note">To projekt mozaiki, nie zrzut Twojego profilu. Podgląd mieszko.wav zablokowała automatyczna kontrola dostępu. Przyjąłem pionową siatkę 3:4; rzeczywisty kadr, przypięte posty i odstępy wymagają sprawdzenia w Instagramie przed publikacją.</p></section>' + themes.map(themeHtml).join('') + '<section class="section" id="publikacja"><h2>Publikacja bez składania puzzli.</h2><div class="actions"><ol><li>Wybierz temat i pobierz jego cały ZIP albo paczkę Instagram.</li><li>Stories publikuj 01–10 i dodaj naklejkę z linkiem do pracowni.</li><li>Na Instagramie publikuj kolejno foldery <strong>01-post, 02-post, 03-post</strong>. W każdym zacznij od 00-okladka.png i dodaj pozostałe slajdy po kolei.</li><li>Skopiuj pełny opis z tego samego folderu. Nie przeplataj trójki innymi postami.</li><li>Na Facebooku dodaj grafikę i gotowy post. Na LinkedIn dodaj PDF jako dokument i osobny opis.</li></ol>' + download('PUBLIKACJA.txt', 'Pobierz dokładną instrukcję') + '</div><p class="note">Jeśli nie chcesz trzech postów, możesz użyć klasycznej karuzeli 10 slajdów i jej osobnego opisu. Wtedy nie powstanie cały rząd mozaiki. Nie publikuj obu wariantów nieświadomie.</p></section><section class="section" id="zrodla"><h2>Piękny obraz, uczciwa treść.</h2><p>12 nowych, stylizowanych ilustracji służy opowieści, nie identyfikacji chmur. Prawdziwe zdjęcia są w atlasie aplikacji. Pracownie pokazują uproszczone mechanizmy, nie prognozę ani warunki pozwalające wypłynąć lub polecieć. Ten pakiet nie ogłasza nowego modelu ML ani aktualnego statusu buildów Apple.</p><p class="note">Panoramy 3240 × 1440 są składami powiększonymi z oryginałów 1881 × 836. Pozostałe źródła mają 1536 × 1024. Nie podmieniałem produkcyjnej strony i nie publikowałem postów na koncie.</p><ul class="source-list">' + sources.map(([label, url]) => '<li><a href="' + url + '">' + esc(label) + '</a></li>').join('') + '</ul>' + download('ZRODLA.txt', 'Źródła TXT') + '<p><a href="' + webUrl + '">Otwórz CHMURNIKA</a> / <a href="../../assetySM/">Wróć do stałej biblioteki</a></p></section></main><footer>Autor: Mieszko Mahboob. Wybór tematów i produkcja zlecone 15.09.2026. Wszystkie starsze paczki pozostają w <a href="../../assetySM/">bibliotece materiałów SM</a>.<script src="copy.js"></script></footer></body></html>');
console.log('Two-theme gallery complete; 11 verified ZIPs, 20 full Stories and six ordered Instagram posts.');
