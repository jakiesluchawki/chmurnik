import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const work=path.join(root,'.local/v4/consultation-workbook-tool');
await fs.mkdir(work,{recursive:true});
const modules='/Users/mieszkomahboob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
try{await fs.symlink(modules,path.join(work,'node_modules'));}catch(e){if(e.code!=='EEXIST')throw e;}
const require=createRequire(path.join(work,'builder.mjs'));
const {Workbook,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')));
const output=path.join(root,'.local/v4/consultation-20260907/01-ocena-bez-podpowiedzi');
const manifest=JSON.parse(await fs.readFile(path.join(output,'images.json')));
const wb=Workbook.create();
const sheet=wb.worksheets.add('Ocena');
sheet.showGridLines=false;
sheet.getRange('A1:H1').values=[['ID','Ocena','Rodzaje obecne','Alternatywy','Jakość','Ograniczenia kadru','Widoczne cechy','Uwagi']];
sheet.getRange('A2:H34').values=manifest.items.map(i=>[i.photo_id,null,null,null,null,null,null,null]);
sheet.getRange('A1:H34').format.font={name:'Arial',size:11,color:'#333333'};
sheet.getRange('A1:H34').format.wrapText=true;
sheet.getRange('A1:H1').format={fill:'#656334',font:{name:'Arial',bold:true,color:'#FFFFFF',size:11},rowHeight:38};
sheet.getRange('A2:H34').format.rowHeight=52;
sheet.getRange('B2:H34').format.fill='#FFF6DD';
sheet.getRange('A1:A34').format.columnWidth=9;
sheet.getRange('B1:E34').format.columnWidth=20;
sheet.getRange('F1:H34').format.columnWidth=36;
sheet.freezePanes.freezeRows(1);
sheet.getRange('B2:B34').dataValidation={rule:{type:'list',values:['single','mixed','uncertain','clear','unusable']}};
sheet.getRange('E2:E34').dataValidation={rule:{type:'list',values:['dobra','ograniczona','nieprzydatna']}};
const guide=wb.worksheets.add('Instrukcja');guide.showGridLines=false;
const rows=[
 ['Ocena zdjęć CHMURNIKA','33 zdjęcia rozwojowe. To nie nowy test skuteczności.'],
 ['Jak pracować','Obejrzyj index.html z paczki. Oceniaj bez pomocy modelu i bez raportu 02. Wypełniaj żółte pola. Zachowaj ID.'],
 ['single','Jeden rozpoznawalny rodzaj. Jego kod wpisz w Rodzaje obecne.'],
 ['mixed','Co najmniej dwa rodzaje obecne równocześnie, np. Cu|Ci.'],
 ['uncertain','Brak podstaw do rozstrzygnięcia. Rodzaje obecne pozostają puste. Możliwe alternatywy wpisz oddzielnie, np. Ac|Sc.'],
 ['clear','Na widocznym niebie nie ma chmur. Rodzaje i alternatywy pozostają puste.'],
 ['unusable','Zdjęcie nie nadaje się do oceny. Rodzaje i alternatywy pozostają puste.'],
 ['Kody','Ci, Cc, Cs, Ac, As, Ns, Sc, St, Cu, Cb. Rozwinięcia w INSTRUKCJA.md.'],
 ['Jakość','dobra / ograniczona / nieprzydatna. Opisz ograniczenia i cechy, które faktycznie widać.'],
 ['Puste komórki','Nie oceniono. Nigdy nie oznaczają domyślnie clear. Można oddać częściową ocenę.'],
 ['Po ocenie','Zapisz własny XLSX. Nie trzeba dodatkowo wypełniać CSV. Powrót do uczenia wymaga odrębnego przeglądu, nie automatycznego importu.'],
 ['Prawa do zdjęć','IMGW, CC BY 4.0. Autorzy: Szymon Kopeć, Grzegorz Duniec, Bogdan Bochenek, Mariusz Figurski.'],
 ['Źródło',manifest.attribution.source],
 ['Licencja',manifest.attribution.license_url],
 ['Przygotowanie','Pełne dostępne kadry, wcześniej przetworzone EXIF/RGB, maksymalnie 640 px, JPEG 92. Bez nowego kadrowania.'],
 ['Dalszy etap','PLAN-NOWYCH-DANYCH.md opisuje osobną, przyszłą próbę potwierdzającą i warunki wznowienia badań.'],
];
guide.getRange(`A1:B${rows.length}`).values=rows;
guide.getRange(`A1:B${rows.length}`).format={font:{name:'Arial',size:11,color:'#333333'},wrapText:true,rowHeight:65};
guide.getRange(`A1:A${rows.length}`).format.columnWidth=26;
guide.getRange(`B1:B${rows.length}`).format.columnWidth=100;
guide.getRange(`A1:A${rows.length}`).format.font.bold=true;
assert.equal(sheet.getRange('A2:A34').values.length,33);
assert(sheet.getRange('B2:H34').values.flat().every(v=>v===null||v===''));
console.log((await wb.inspect({kind:'table',range:'Ocena!A1:H4',include:'values,formulas',tableMaxRows:4,tableMaxCols:8,maxChars:2000})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:20},maxChars:1000})).ndjson);
for(const [name,range] of [['Ocena','A1:H5'],['Instrukcja','A1:B16']]){
 const blob=await wb.render({sheetName:name,range,scale:1.5,format:'png'});
 await fs.writeFile(path.join(work,`${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(output,'OCENA-33.xlsx'));
console.log('Blank 33-row workbook exported; no predictions or source labels in workbook.');
