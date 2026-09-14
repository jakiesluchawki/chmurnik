import assert from 'node:assert/strict';
import { mkdir, copyFile, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { date, title, groups, posts, adminMessage, guidance, webUrl } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const site = resolve(here, 'site');
const root = resolve(here, '../..');
const previous = resolve(here, '../2026-09-09-pracownie/site');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = JSON.parse(await readFile(resolve(previous, 'exports-manifest.json'), 'utf8'));
const names = {'02':'chmura', '03':'nad-woda', '04':'wiatr', '05':'metar', '06':'sondaz'};
const images = [];
for (const directory of ['obrazy', 'podglady', 'teksty', 'assets']) await mkdir(resolve(site, directory), {recursive:true});
for (const number of Object.keys(names)) {
  const item = source.artworks.find(a => a.format === 'karuzela' && a.number === Number(number));
  assert(item, `Missing approved image ${number}`);
  const bytes = await readFile(resolve(previous, item.file));
  assert.equal(hash(bytes), item.sha256, 'Do not silently modify approved images');
  const file = `obrazy/${number}-${names[number]}.png`;
  const preview = `podglady/${number}.jpg`;
  await copyFile(resolve(previous, item.file), resolve(site, file));
  await copyFile(resolve(previous, item.preview), resolve(site, preview));
  images.push({number, file, preview, alt:item.alt, sha256:item.sha256, source:`../pracownie/${item.file}`, width:1080, height:1350});
}
for (const font of ['Roobert-Regular.woff2', 'Roobert-Bold.woff2', 'Romie-Regular.woff2']) await copyFile(resolve(root, 'public/fonts', font), resolve(site, 'assets', font));
await copyFile(resolve(root, 'public/brand/chmurnik-wordmark.png'), resolve(site, 'assets/wordmark.png'));
for (const file of ['style.css', 'copy.js']) await copyFile(resolve(here, file), resolve(site, file));

const intro = `CHMURNIK / POSTY DO GRUP / 14.09.2026\n\nPięć pełnych postów i pięć wcześniej zaakceptowanych plansz PNG. Cztery konkretne grupy zweryfikowano w zakresie opisanym poniżej. Wariant pogodowy nie ma jeszcze zweryfikowanej grupy docelowej. Nie opublikowano żadnego posta na Facebooku.\n\n`;
const allCopy = intro + posts.map(p => `${p.audience.toUpperCase()}\n${p.use}\n\n${p.text}`).join('\n\n================================\n\n') + `\n\nWIADOMOŚĆ DO ADMINISTRATORA\n\n${adminMessage}\n`;
await writeFile(resolve(site, 'PELNE-POSTY.txt'), allCopy);
for (const post of posts) await writeFile(resolve(site, 'teksty', `${post.id}.txt`), `${post.text}\n`);
await writeFile(resolve(site, 'teksty/administrator.txt'), `${adminMessage}\n`);
const research = `GRUPY I PUBLIKACJA / stan odczytu: ${date}\n\n` + groups.map(g => `${g.name}\n${g.url}\n${g.visibility} · ${g.members}\n${g.activity}\n${g.fit}\nZASADY: ${g.rules}\nPODSTAWA: ${g.evidence}`).join('\n\n') + '\n\nJAK PUBLIKOWAĆ\n\n' + guidance.map((s,i) => `${i+1}. ${s}`).join('\n\n') + '\n\nGranice weryfikacji: nie uzyskano zgody administratorów, nie czytano prywatnych wpisów. Dalsze przeglądanie Google i Facebooka zostało odrzucone przez kontrolę uprawnień; nie obchodzono odmowy. Nie podajemy niepotwierdzonych grup pogodowych ani liczby ich członków.\n\nGrafiki: wybrane, niezmienione plansze 02–06 z zaakceptowanej serii Pracownie. Numery 02/10 itd. pochodzą z oryginalnej serii. To stylizowane ilustracje, nie fotografie do identyfikacji chmur. Nie ogłaszają nowszego modelu ani aktualnego statusu recenzji Apple.\n';
await writeFile(resolve(site, 'GRUPY-I-PUBLIKACJA.txt'), research);
await writeFile(resolve(site, 'teksty/alt-teksty.txt'), images.map(i => `${i.file}\n${i.alt}`).join('\n\n') + '\n');
const archives = [];
const common = ['GRUPY-I-PUBLIKACJA.txt', 'teksty/alt-teksty.txt'];
const definitions = [
  {id:'calosc', file:'CHMURNIK-GRUPY-CALOSC.zip', entries:['PELNE-POSTY.txt',...common,'teksty/administrator.txt',...posts.map(p=>`teksty/${p.id}.txt`),...images.map(i=>i.file)]},
  ...posts.map(p=>({id:p.id,file:`CHMURNIK-GRUPY-${p.id.toUpperCase()}.zip`,entries:[`teksty/${p.id}.txt`,...common,...p.images.map(n=>images.find(i=>i.number===n).file)]})),
];
const temp = await mkdtemp(resolve(tmpdir(),'chmurnik-groups-'));
try {
  for (const archive of definitions) {
    assert.equal(new Set(archive.entries).size,archive.entries.length);
    const target=resolve(temp,archive.file);
    execFileSync('zip',['-q','-X',target,...archive.entries],{cwd:site});
    execFileSync('unzip',['-t',target]);
    assert.deepEqual(execFileSync('unzip',['-Z1',target],{encoding:'utf8'}).trim().split('\n'),archive.entries);
    await copyFile(target,resolve(site,archive.file));
    const bytes=await readFile(target);
    archives.push({...archive,bytes:bytes.length,sha256:hash(bytes)});
  }
} finally { await rm(temp,{recursive:true,force:true}); }
await writeFile(resolve(site,'manifest.json'),JSON.stringify({date,title,webUrl,groups,posts,images,archives,adminMessage,guidance,newGeneratedImages:0,facebookPostsPublished:0},null,2)+'\n');

const download=(file,label)=>`<a class="button" href="${escape(file)}" download>${escape(label)}</a>`;
const imageCard=number=>{const i=images.find(item=>item.number===number);return `<figure><a href="${i.file}"><img src="${i.preview}" width="432" height="540" loading="lazy" alt="${escape(i.alt)}"></a><figcaption>Plansza ${number} · PNG 1080 × 1350</figcaption>${download(i.file,'Pobierz PNG')}</figure>`;};
const revision=hash(await readFile(resolve(site,'style.css'))).slice(0,12);
await writeFile(resolve(site,'index.html'),`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f8e2ea"><title>Posty do grup · CHMURNIK</title><link rel="stylesheet" href="style.css?v=${revision}"></head><body><header><img src="assets/wordmark.png" width="200" height="34" alt="CHMURNIK"><a href="../../assetySM/">Wszystkie materiały SM</a></header><main>
<p class="eyebrow">DO GRUP NA FACEBOOKU · 14 WRZEŚNIA 2026</p><h1>${escape(title)}</h1><p class="lead">Osobista geneza, konkretne zastosowania i zaproszenie do korzystania. Pięć pełnych postów dla różnych odbiorców, z krótkim PS o niezależnej ocenie 33 zdjęć.</p>
<div class="notice"><strong>Materiały do Twojej publikacji.</strong> Żaden post ani wiadomość nie zostały wysłane. Cztery grupy mają sprawdzone adresy; stopień weryfikacji zasad opisuję przy każdej. Pięć plansz pochodzi z zaakceptowanej serii, bez nowego generowania i przerabiania obrazów.</div>
<div class="actions">${download('CHMURNIK-GRUPY-CALOSC.zip','Pobierz cały pakiet')}${download('PELNE-POSTY.txt','Wszystkie teksty TXT')}</div>
<nav aria-label="Zawartość pakietu"><a href="#grupy">Grupy i zasady</a>${posts.map(p=>`<a href="#${p.id}">${escape(p.audience)}</a>`).join('')}<a href="#administrator">Do administratora</a><a href="#publikacja">Jak publikować</a></nav>
<section id="grupy"><p class="eyebrow">KONKRETNE MIEJSCA, NIE PRZYPADKOWA LISTA</p><h2>Gdzie zacząć.</h2><p>Najpierw jedna grupa lotnicza. Żeglarze to osobna grupa odbiorców; pozostałe lotnicze potraktuj jako alternatywy. Liczby to stan z odczytu, nie gwarancja zasięgu.</p><div class="groups">${groups.map(g=>`<article><span class="tag">${escape(g.status)}</span><h3><a href="${g.url}" rel="noreferrer">${escape(g.name)}</a></h3><p><strong>${escape(g.visibility)}</strong> · ${escape(g.members)}</p><p>${escape(g.fit)}</p><p class="rules"><strong>Przed publikacją:</strong> ${escape(g.rules)}</p><details><summary>Zakres weryfikacji i aktywność</summary><p>${escape(g.activity)}</p><p>${escape(g.evidence)}</p><p>Sprawdzono ${date}. Nie jest to zgoda administratora ani pomiar jakości społeczności.</p></details><a href="#${g.post}">Przejdź do dopasowanego posta</a></article>`).join('')}</div><p class="note">Nie dopisuję grup pogodowych na podstawie samej nazwy z wyszukiwarki. Pełny wariant dla obserwatorów jest poniżej, do wykorzystania po sprawdzeniu konkretnej społeczności.</p></section>
${posts.map(p=>`<section id="${p.id}" class="post-section"><p class="eyebrow">GOTOWY TEKST · ${escape(p.id.toUpperCase())}</p><h2>${escape(p.audience)}</h2><p class="note">${escape(p.use)}</p><div class="post-layout"><div><pre id="text-${p.id}">${escape(p.text)}</pre><div class="actions"><button data-copy="text-${p.id}">Kopiuj cały post z PS</button>${download(`teksty/${p.id}.txt`,'Pobierz tekst TXT')}</div></div><div><div class="images">${p.images.map(imageCard).join('')}</div>${download(archives.find(a=>a.id===p.id).file,'Post i dobrane PNG · ZIP')}</div></div></section>`).join('')}
<section id="administrator"><h2>Najpierw zapytaj, jeśli zasady tego wymagają.</h2><p>Nie wstawiaj w poście deklaracji „za zgodą administratora”, dopóki faktycznie jej nie masz.</p><pre id="text-admin">${escape(adminMessage)}</pre><div class="actions"><button data-copy="text-admin">Kopiuj wiadomość</button>${download('teksty/administrator.txt','Pobierz TXT')}</div></section>
<section id="publikacja"><h2>Mała kampania, dużo szacunku.</h2><ol>${guidance.map(g=>`<li>${escape(g)}</li>`).join('')}</ol>${download('GRUPY-I-PUBLIKACJA.txt','Grupy, źródła i instrukcja TXT')}<p class="note">Strona materiałów jest publiczna, bez indeksowania; to nie ochrona hasłem. Nie zawiera kont, haseł ani zdjęć z panelu oceny. Nowa kampania nie jest ogłoszeniem poprawy skuteczności modelu ani nowego wydania Apple.</p></section>
<footer><a href="../../assetySM/">Wróć do stałej biblioteki materiałów</a><p>Do postów używaj <a href="${webUrl}">chmurnik.cloud</a>, nie linku do tej strony roboczej. Źródła informacji o grupach: ich podlinkowane strony i dostępne regulaminy, odczytane ${date}.</p></footer></main><p id="copy-status" role="status" aria-live="polite"></p><script src="copy.js"></script></body></html>`);
console.log(`Group campaign built: ${groups.length} verified group addresses, ${posts.length} complete posts, ${images.length} unchanged PNG, ${archives.length} ZIPs.`);
