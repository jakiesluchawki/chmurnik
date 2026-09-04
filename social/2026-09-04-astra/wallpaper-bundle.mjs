import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeDownloadZip } from './zip-downloads.mjs';

export async function addWallpaperBonusToFullPack(site){
  let bonus;
  try{bonus=JSON.parse(await readFile(path.join(site,'wallpapers-manifest.json')));}catch(error){if(error.code==='ENOENT')return;throw error;}
  const manifest=JSON.parse(await readFile(path.join(site,'platforms-manifest.json')));
  const archive=manifest.archives.find(a=>a.file==='CHMURNIK-ASTRA-PELNY-PAKIET.zip');
  archive.entries=[...archive.entries.filter(f=>!f.startsWith('tapety/')),...bonus.archive.entries];
  const temporary=await mkdtemp(path.join(tmpdir(),'chmurnik-full-wallpapers-'));
  try{
    const target=path.join(temporary,archive.file);
    await writeDownloadZip(site,target,archive.entries);execFileSync('unzip',['-t',target]);
    assert.deepEqual(execFileSync('unzip',['-Z1',target],{encoding:'utf8'}).trim().split('\n'),archive.entries);
    await copyFile(target,path.join(site,archive.file));
    const bytes=await readFile(target);archive.bytes=bytes.length;archive.sha256=createHash('sha256').update(bytes).digest('hex');
    await writeFile(path.join(site,'platforms-manifest.json'),JSON.stringify(manifest,null,2));
  }finally{await rm(temporary,{recursive:true,force:true});}
}
