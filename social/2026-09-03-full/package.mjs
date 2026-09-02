import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clouds } from '../../src/data/clouds.js';
import { storeUrl, stories } from './copy.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(directory, 'site');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const videos = manifest.artworks.flatMap(item => item.video ? [item.video] : []);
assert.equal(manifest.artworks.length, 21);
assert.equal(videos.length, 10);
assert.equal(videos.filter(video => video.kind === 'walkthrough').length, 6);
assert.equal(manifest.documents.length, 1);
for (const media of [...manifest.artworks, ...videos, ...manifest.documents]) {
  const bytes = await readFile(path.join(site, media.file));
  assert.equal(bytes.length, media.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), media.sha256);
}
const photographed = clouds.flatMap(cloud => cloud.images.slice(0, cloud.id === 'cirrus' ? cloud.images.length : 1).map(image => ({ cloud: cloud.name, ...image })));
const licenseUrl = license => license.match(/CC BY-SA ([\d.]+)/) ? `https://creativecommons.org/licenses/by-sa/${license.match(/CC BY-SA ([\d.]+)/)[1]}/`
  : license.match(/CC BY ([\d.]+)/) ? `https://creativecommons.org/licenses/by/${license.match(/CC BY ([\d.]+)/)[1]}/` : null;
const creditText = `CHMURNIK / ŹRÓDŁA FOTOGRAFII\n\nPrawdziwe zdjęcia widoczne w atlasie i jego demonstracji. Zestaw obejmuje główne fotografie dziesięciu rodzajów oraz fotografie monografii Cirrus. Nie wszystkie występują w każdej planszy. Metadane pochodzą z rejestru źródeł aplikacji.\n\n${photographed.map(image => `${image.cloud} / ${image.id}\nAutor: ${image.author}\nLicencja: ${image.license}${licenseUrl(image.license) ? `\n${licenseUrl(image.license)}` : ''}\nŹródło: ${image.page}`).join('\n\n')}\n\nW materiałach pokazujemy rzeczywisty interfejs aplikacji. Nagrania skrócono, skalowano i kadrowano na potrzeby montażu. Nie podmieniamy zdjęć ani wyników i nie retuszujemy fotografii. Prawa i licencje fotografii pozostają przy ich autorach; obecność fotografii nie oznacza poparcia aplikacji przez autora. Zachowaj małe podpisy w materiałach i ten wykaz źródeł przy dalszym udostępnianiu pakietu.\n`;
await writeFile(path.join(site, 'ZRODLA-ZDJEC.txt'), creditText);
const guide = `CHMURNIK / PEŁNY PAKIET NA 3 WRZEŚNIA 2026 / MONTAŻ V2

Materiały są gotowe do ręcznej publikacji. Nic nie zostało automatycznie zamieszczone na Instagramie, Facebooku ani LinkedIn.

1. INSTAGRAM STORIES
Polecana wersja: 10 filmów MP4 w kolejności 01–10, po 6–8 sekund. Sześć demonstracji i cztery montaże produktowe. Szybkie cięcia, zbliżenia i prawdziwe gesty, bez postojów na czytanie. Cały zatwierdzony tekst każdej storki jest stale widoczny w filmie, nie znika wraz z kolejnym ujęciem. JPG z tym samym numerem jest alternatywą, nie dodatkową relacją. Wszystkie pliki: 1080 x 1920, H.264 MP4, 30 fps, bez dźwięku. Muzykę dobierz w Instagramie.

Dodaj w Instagramie prawdziwą naklejkę Link. Jej pole w każdej storce: x=240, y=1510, szerokość 600, wysokość 120. Nie zasłaniaj zastrzeżeń pod polem.
Link: ${storeUrl}
Podpisy naklejek: teksty/linki-do-storek.txt. Pełen tekst: teksty/storki-pelny-tekst.txt.

2. INSTAGRAM POST / KARUZELA
Wybierz 10 plików images/karuzela-*.jpg w kolejności 01–10. Wszystkie mają 1080 x 1350 (4:5); zachowaj proporcje całej serii. Opis: teksty/instagram-post.txt. W opisie odsyłamy do relacji, więc opublikuj też relacje z naklejką Link. Możesz również dodać adres do linków w profilu. Sam JPG ani tekst adresu w opisie nie jest klikalnym przyciskiem.

3. LINKEDIN
Dołącz chmurnik-historia-linkedin.pdf jako Dokument, nie jako zdjęcie. Tytuł: CHMURNIK: zaczęło się od kogoś bliskiego. Wklej cały tekst z teksty/linkedin-post.txt. PDF ma 10 stron i klikalny link do App Store na ostatniej stronie.
Oficjalna instrukcja dodawania dokumentu: https://www.linkedin.com/help/linkedin/answer/a518909/upload-and-share-documents-on-linkedin?lang=en

4. FACEBOOK
Dołącz images/facebook-z-kogos-bliskiego.jpg i wklej teksty/facebook-post.txt. Link do App Store jest już w tekście posta.

5. ZAPIS NA IPHONIE
Galeria udostępnia pojedyncze JPG i MP4 oraz przycisk systemowego udostępnienia, jeśli przeglądarka go obsługuje. Alternatywa JPG: otwórz obraz i przytrzymaj, aby go zapisać. Alternatywa MP4: pobierz do Plików, otwórz i wybierz Udostępnij / Zapisz wideo. ZIP rozpakujesz, stukając plik w aplikacji Pliki. Rzeczywista lista opcji zależy od systemu. Pobierz ponownie paczkę V2, żeby nie użyć wcześniejszego montażu zapisanego w Plikach.

6. DEMONSTRACJE I GRANICE
To montaż nagrań prawdziwego interfejsu React z mobilnym układem, z izolowanej przeglądarki, nie nagrania fizycznego iPhone’a. Dotknięcia, przewijanie, wklejanie i przesuwanie suwaków zmieniają rzeczywisty stan aplikacji. Nagrania skrócono, przyspieszono i wykadrowano. Nie podmieniano odpowiedzi, odczytów ani fotografii. Pokazujemy fragment pierwszej lekcji, nie jej ukończenie. Raport METAR jest przykładem szkoleniowym. Pracownia Windy jest niezależna, bez integracji. Telefon nie mierzy wiatru. Narzędzia nie zastępują oficjalnego briefingu.

7. ŹRÓDŁA
Fotografie: ZRODLA-ZDJEC.txt. Zachowaj autorstwo i licencje. Opowieść pochodzi od autora CHMURNIKA; dziesięć tekstów zostało zatwierdzonych przed produkcją i nie zostało skróconych w V2. Oryginalna identyfikacja: Romie, Roobert, róż, oliwka, fiolet i filcowy obiekt. Pliki fontów nie są dołączone do paczek. Prywatne statystyki, tokeny, dane kont i robocze klatki nagrań są wykluczone.
`;
await writeFile(path.join(site, 'CZYTAJ-MNIE.txt'), guide);
await writeFile(path.join(site, 'teksty/alt-teksty.txt'), manifest.artworks.map(item => `${item.id}\n${item.alt}`).join('\n\n') + '\n');
const common = ['CZYTAJ-MNIE.txt', 'ZRODLA-ZDJEC.txt'];
const storyFiles = manifest.artworks.filter(item => item.format === 'story').map(item => item.file);
const carouselFiles = manifest.artworks.filter(item => item.format === 'carousel').map(item => item.file);
const facebookFiles = manifest.artworks.filter(item => item.format === 'facebook').map(item => item.file);
const storyCopy = ['teksty/storki-pelny-tekst.txt', 'teksty/linki-do-storek.txt'];
const archives = [
  { file: 'chmurnik-pelny-pakiet.zip', title: 'Pełny pakiet', entries: [...common, ...manifest.artworks.map(item => item.file), ...videos.map(item => item.file), ...manifest.documents.map(item => item.file), ...manifest.captions.map(item => `teksty/${item.id}.txt`), 'teksty/alt-teksty.txt'] },
  { file: 'chmurnik-stories.zip', title: 'Stories z filmami', entries: [...common, ...storyFiles, ...videos.map(item => item.file), ...storyCopy] },
  { file: 'chmurnik-stories-jpg.zip', title: 'Stories JPG', entries: [...common, ...storyFiles, ...storyCopy] },
  { file: 'chmurnik-instagram-karuzela.zip', title: 'Instagram: karuzela i opis', entries: [...common, ...carouselFiles, 'teksty/instagram-post.txt', 'teksty/instagram-bio-link.txt', 'teksty/alt-teksty.txt'] },
  { file: 'chmurnik-linkedin.zip', title: 'LinkedIn: PDF i post', entries: [...common, ...manifest.documents.map(item => item.file), 'teksty/linkedin-post.txt'] },
  { file: 'chmurnik-facebook.zip', title: 'Facebook: grafika i post', entries: [...common, ...facebookFiles, 'teksty/facebook-post.txt'] },
];
const temporary = await mkdtemp(path.join(tmpdir(), 'chmurnik-full-'));
try {
  for (const archive of archives) {
    const target = path.join(temporary, archive.file);
    assert.equal(new Set(archive.entries).size, archive.entries.length);
    execFileSync('zip', ['-q', '-X', target, ...archive.entries], { cwd: site });
    execFileSync('unzip', ['-t', target]);
    assert.deepEqual(execFileSync('unzip', ['-Z1', target], { encoding: 'utf8' }).trim().split('\n'), archive.entries);
    await copyFile(target, path.join(site, archive.file));
    const bytes = await readFile(target);
    Object.assign(archive, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    console.log(`${archive.file}: ${archive.entries.length} verified entries, ${(bytes.length / 1024 / 1024).toFixed(1)} MB`);
  }
} finally { await rm(temporary, { recursive: true, force: true }); }
manifest.archives = archives;
manifest.photoCredits = photographed.map(({ cloud, id, author, license, page }) => ({ cloud, id, author, license, licenseUrl: licenseUrl(license), sourceUrl: page }));
manifest.publicationOrder = stories.map(story => `story-${story.id}.mp4`);
await writeFile(path.join(site, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
