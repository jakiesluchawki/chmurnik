import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:18973';
const path='.local/review-portal/qa-root/ocena/_private/storage.php';
const legacy={status:'uncertain',genera:[],alternatives:['Ac'],quality:'ograniczona',features:'',limitations:'Stara ocena',notes:'',revision:1,updatedAt:'2026-09-06T12:00:00Z'};
const submission={submittedAt:'2026-09-06T12:01:00Z',count:1,total:33,answers:{R033:legacy}};
if(process.argv.includes('--seed')){
  // Stop the disposable PHP server before seeding: WASM caches mounted files.
  await writeFile(path,'<?php http_response_code(404); exit; ?>\n'+JSON.stringify({schema:1,sessions:{},limits:{},reviews:{meteo3:{R033:legacy}},submissions:{meteo3:submission}}));
  console.log('Seeded isolated QA v1 record. Start the QA server before checking.');
}else{
  const credentials=JSON.parse(await readFile('.local/review-portal/credentials.json'));
  const account=credentials.find(a=>a.login==='meteo3');
  let cookie='',csrf='';
  async function call(action,values={},expected=200){
    const r=await fetch(base+'/ocena/api.php',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Portal-Request':'1',Cookie:cookie},body:JSON.stringify({action,csrf,...values})});
    assert.equal(r.status,expected);if(r.headers.getSetCookie().length)cookie=r.headers.getSetCookie()[0].split(';')[0];
    return r.json();
  }
  const session=await call('login',{login:account.login,password:account.password});csrf=session.csrf;
  assert.deepEqual(session.answers.R033,legacy);assert.deepEqual(session.submission,submission);
  await call('save',{id:'R033',revision:1,answer:{...legacy,level:'low'}},409);
  const exported=await call('export');
  assert.deepEqual(exported.data.answers.R033,legacy);assert.deepEqual(exported.data.submission,submission);
  console.log('PASS: existing v1 response and frozen snapshot remain exactly unchanged.');
}
