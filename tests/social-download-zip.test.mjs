import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, utimes, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { writeDownloadZip } from '../social/2026-09-04-astra/zip-downloads.mjs';

test('Social ZIP downloads are portable and independent of checkout times or permissions',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'chmurnik-zip-test-'));
  try{
    const entries=['first.txt','second.bin'];
    const contents=[Buffer.from('CHMURNIK\n'),Buffer.from([0,1,2,128,255])];
    for(const [i,entry]of entries.entries())await writeFile(path.join(root,entry),contents[i]);
    const first=path.join(root,'first.zip'),second=path.join(root,'second.zip');
    await writeDownloadZip(root,first,entries);
    for(const entry of entries){await utimes(path.join(root,entry),1,1);await chmod(path.join(root,entry),0o600);}
    await writeDownloadZip(root,second,entries);
    assert.deepEqual(await readFile(first),await readFile(second));
    execFileSync('unzip',['-t',first]);
    assert.deepEqual(execFileSync('unzip',['-Z1',first],{encoding:'utf8'}).trim().split('\n'),entries);
    for(const [i,entry]of entries.entries())assert.deepEqual(execFileSync('unzip',['-p',first,entry]),contents[i]);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Social ZIP builder rejects duplicate entries and paths outside the package',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'chmurnik-zip-paths-'));
  try{
    const target=path.join(root,'output.zip');
    for(const entries of [['a','a'],['../outside.txt'],['/absolute.txt'],['nested/../../outside.txt']])await assert.rejects(writeDownloadZip(root,target,entries));
  }finally{await rm(root,{recursive:true,force:true});}
});
