import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildGallery } from './gallery.mjs';
import { addWallpaperBonusToFullPack } from './wallpaper-bundle.mjs';
import { writeDownloadZip } from './zip-downloads.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const site=path.join(here,'site');
const qa=path.resolve(here,'../../build/astra-wallpapers-qa');
const hash=b=>createHash('sha256').update(b).digest('hex');
const designs=[
  {id:'01-astra',title:'Odrobina Astry',alt:'Miękka biała chmura przed fioletową, rzeźbiarską gwiazdą na oliwkowym postumencie. Pudroworóżowe tło.'},
  {id:'02-okno',title:'Okno na niebo',alt:'Jasny, rzeźbiarski łuk otwiera się na błękitne niebo i białą chmurę. Oliwkowy stopień, mała fioletowa kula i różowe tło.'},
  {id:'03-orbity',title:'Własne orbity',alt:'Białe, filcowe chmury unoszą się w cienkich kremowych orbitach na spokojnym lawendowym tle.'},
  {id:'04-warstwy',title:'Warstwy ciszy',alt:'Trzy miękkie, białe warstwy chmur unoszą się nad oliwkową podstawą w spokojnym kremowo-lawendowym świetle.'},
  {id:'05-wiatr',title:'Linie wiatru',alt:'Białą chmurę otulają smukłe, falujące wstęgi w kolorach lawendy i kremu, na pudroworóżowym tle.'},
  {id:'06-deszcz',title:'Po deszczu',alt:'Miękka biała chmura i szkliste krople nad lawendową taflą wody tworzą spokojną rzeźbę deszczu.'},
  {id:'07-slonce',title:'Złota godzina',alt:'Matowa tarcza słońca wznosi się nad miękką białą chmurą i oliwkowym horyzontem w ciepłym różowym świetle.'},
  {id:'08-mapa',title:'Mapa nieba',alt:'Kremowa konstrukcja przypominająca astrolabium otacza drobną białą chmurę nad lawendową podstawą.'},
  {id:'09-woda',title:'Cisza nad wodą',alt:'Samotna biała chmura odbija się w spokojnej, okrągłej tafli wody przy oliwkowym brzegu.'},
  {id:'10-schody',title:'Bliżej nieba',alt:'Lawendowe, rzeźbiarskie schody prowadzą ku miękkiej białej chmurze na różowym tle.'},
];
for(const dir of ['tapety','previews/tapety'])await mkdir(path.join(site,dir),{recursive:true});
await mkdir(qa,{recursive:true});
const wallpapers=[],sourceChecks=[];
for(const design of designs){
  for(const orientation of ['desktop','phone']){
    const width=orientation==='desktop'?3840:2160,height=orientation==='desktop'?2160:3840;
    const source=path.join(here,'art/wallpapers',`${design.id}-${orientation}.png`);
    const metadata=await sharp(source).metadata();
    assert(Math.max(metadata.width,metadata.height)>=1600&&Math.min(metadata.width,metadata.height)>=900,`Source too small: ${source}`);
    assert(orientation==='desktop'?metadata.width>metadata.height:metadata.height>metadata.width,`Wrong orientation: ${source}`);
    const file=`tapety/chmurnik-${design.id}-${width}x${height}.png`;
    await sharp(source).rotate().flatten({background:'#f8e2ea'}).resize(width,height,{fit:'cover',position:'centre',kernel:'lanczos3'}).png({compressionLevel:9}).toFile(path.join(site,file));
    const bytes=await readFile(path.join(site,file));
    const preview=`previews/tapety/${design.id}-${orientation}.jpg`;
    await sharp(bytes).resize(orientation==='desktop'?640:360,orientation==='desktop'?360:640).jpeg({quality:88}).toFile(path.join(site,preview));
    wallpapers.push({...design,orientation,width,height,file,preview,bytes:bytes.length,sha256:hash(bytes)});
    sourceChecks.push({id:design.id,orientation,sourceWidth:metadata.width,sourceHeight:metadata.height,exportWidth:width,exportHeight:height,resized:metadata.width!==width||metadata.height!==height});
    console.log(`Wallpaper: ${file} (${metadata.width}x${metadata.height} source)`);
  }
}
const instructions=`CHMURNIK / TAPETY 4K

10 różnych motywów. Każdy w dwóch osobno przygotowanych kompozycjach: na komputer i telefon. Łącznie 20 plików PNG, bez napisów i znaków aplikacji.

${designs.map((d,i)=>`${String(i+1).padStart(2,'0')}. ${d.title}`).join('\n')}

KOMPUTER: 3840 x 2160 px, poziomo, 16:9.
TELEFON: 2160 x 3840 px, pionowo, 9:16.

Pobierz oryginalny PNG, nie mały podgląd z galerii. W systemowych ustawieniach wybierz obraz jako tapetę i dopasuj pozycję do swojego ekranu. Proporcje poszczególnych telefonów mogą wymagać niewielkiego kadrowania; podgląd ekranu blokady pozwoli sprawdzić zegar i przyciski.

Ilustracje przeskalowano do podanych rozdzielczości 4K. Mają charakter dekoracyjny, nie są fotografiami chmur do rozpoznawania.

Do osobistego użytku jako tło ekranu. Możesz przesłać zainteresowanym link do pobrania. Autor publikacji: Mieszko Mahboob / CHMURNIK.

Link do tapet: https://jakiesluchawki.github.io/chmurnik/premiera/astra/#tapety
Stała biblioteka: https://jakiesluchawki.github.io/chmurnik/assetySM/

Galeria nie wymaga logowania. Osoba mająca link może otworzyć ją i przekazać dalej. Jest nieindeksowana, ale nie jest prywatnym repozytorium plików.
`;
await writeFile(path.join(site,'tapety/CZYTAJ-MNIE.txt'),instructions);
const entries=[...wallpapers.map(w=>w.file),'tapety/CZYTAJ-MNIE.txt'];
const temporary=await mkdtemp(path.join(tmpdir(),'chmurnik-wallpapers-'));
try{
  const zip='CHMURNIK-TAPETY-4K.zip',target=path.join(temporary,zip);
  await writeDownloadZip(site,target,entries);execFileSync('unzip',['-t',target]);
  await copyFile(target,path.join(site,zip));
  const bytes=await readFile(target);
  await writeFile(path.join(site,'wallpapers-manifest.json'),JSON.stringify({title:'Tapety CHMURNIK · 4K',date:'2026-09-04',wallpapers,archive:{file:zip,entries,bytes:bytes.length,sha256:hash(bytes)}},null,2));
}finally{await rm(temporary,{recursive:true,force:true});}
await writeFile(path.join(qa,'source-dimensions.json'),JSON.stringify(sourceChecks,null,2));
await addWallpaperBonusToFullPack(site);
await buildGallery();
