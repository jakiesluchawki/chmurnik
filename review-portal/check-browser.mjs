import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, rm} from 'node:fs/promises';
import {chromium} from '/Users/mieszkomahboob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base='http://127.0.0.1:18973', out='build/review-portal-qa';
const accounts=JSON.parse(await readFile('.local/review-portal/credentials.json'));
await rm('.local/review-portal/qa-root/ocena/_private/storage.php',{force:true});
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
async function login(name){
  const account=accounts.find(a=>a.login===name);
  await page.locator('[name=login]').fill(name);
  await page.locator('[name=password]').fill(account.password);
  await page.getByRole('button',{name:'Zaloguj się',exact:true}).click();
  await page.getByRole('button',{name:'Wyloguj',exact:true}).waitFor();
}
async function saved(){await page.waitForFunction(()=>document.querySelector('#save-status')?.textContent==='Zapisano na serwerze.');}
async function fits(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}
try{
  await page.goto(base+'/ocena/');
  await page.locator('[name=login]').waitFor();
  await page.screenshot({path:out+'/login-desktop.png',fullPage:true});
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await fits();}
  await login('meteo1');
  await page.locator('#viewer img').waitFor();
  assert(!await page.locator('body').innerText().then(t=>t.includes('etykieta_zrodla')));
  await page.screenshot({path:out+'/review-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await fits();
  await page.screenshot({path:out+'/review-mobile.png',fullPage:true});
  await page.locator('#enlarge').click();await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Zamknij');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.modal').count(),0);
  await page.locator('[name=status][value=single]').check();
  await page.locator('[name=genera][value=Cu]').check();await saved();
  assert(await page.locator('[name=level][value=""]').isChecked(),'genus must not infer level');
  await page.locator('[name=level][value=uncertain]').check();
  await page.locator('[name=contextLimits][value=horizon]').check();
  await page.locator('[name=contextLimits][value=wide_frame]').check();await saved();
  await page.screenshot({path:out+'/context-mobile.png',fullPage:true});
  await page.getByText('Dodaj uzasadnienie lub uwagę',{exact:false}).click();
  await page.locator('[name=notes]').fill('<script>window.leak=true</script> Test QA.');
  await page.locator('#next').click();
  await page.getByRole('heading',{name:'Zdjęcie 2 z 33',exact:true}).waitFor();
  await page.locator('[name=status][value=uncertain]').check();
  await page.locator('[name=alternatives][value=Sc]').check();await saved();
  await page.reload();await page.locator('#viewer img').waitFor();
  assert.equal(await page.locator('#counter').innerText(),'Ocenione: 2 z 33');
  await page.locator('[data-index="0"]').click();
  await page.locator('[name=notes]').waitFor();
  assert.equal(await page.locator('[name=notes]').inputValue(),'<script>window.leak=true</script> Test QA.');
  assert(await page.locator('[name=level][value=uncertain]').isChecked());
  assert(await page.locator('[name=contextLimits][value=horizon]').isChecked());
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await fits();}
  await page.screenshot({path:out+'/context-desktop.png',fullPage:true});
  assert.equal(await page.evaluate(()=>window.leak),undefined);
  // Check all source images are retrievable only through authenticated POSTs.
  const photos=await page.evaluate(async()=>{
    const call=async body=>fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json','X-Portal-Request':'1'},body:JSON.stringify(body)});
    const session=await (await call({action:'session'})).json();const result=[];
    for(let i=1;i<=33;i++){const r=await call({action:'photo',csrf:session.csrf,id:'R'+String(i).padStart(3,'0')});result.push([r.status,(await r.arrayBuffer()).byteLength]);}
    return result;
  });
  assert(photos.every(([status,size])=>status===200&&size>1000));
  for(const file of ['config.php','materials.php','storage.php','lock.php']){
    const response=await context.request.get(base+'/ocena/_private/'+file);assert.equal(response.status(),404,file);
  }
  await page.getByRole('button',{name:'Wyloguj',exact:true}).click();await login('meteo2');
  await page.locator('#viewer img').waitFor();assert.equal(await page.locator('#counter').innerText(),'Ocenione: 0 z 33');
  await page.getByRole('button',{name:'Wyloguj',exact:true}).click();await login('meteo1');
  page.once('dialog',d=>d.accept());await page.locator('#finish').click();
  await page.getByRole('heading',{name:'Wcześniejsze etykiety źródłowe',exact:true}).waitFor();
  assert.equal(await page.locator('th').first().innerText(),'Zdjęcie');
  await page.locator('#back').click();await page.locator('#viewer img').waitFor();
  assert(await page.locator('[name=status]').first().isDisabled());
  assert(await page.locator('[name=level]').first().isDisabled());
  assert(await page.locator('[name=contextLimits]').first().isDisabled());
  await page.getByRole('button',{name:'Wyloguj',exact:true}).click();await login('koordynator');
  await page.getByRole('heading',{name:'Trzy niezależne oceny.',exact:true}).waitFor();
  await page.getByText('Ekspert 1: odpowiedzi i uwagi',{exact:true}).click();
  assert.match(await page.locator('table').innerText(),/Nie mogę ocenić piętra/);
  assert.match(await page.locator('table').innerText(),/Brakuje widocznego horyzontu/);
  await fits();assert.equal(await page.evaluate(()=>window.leak),undefined);
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:out+'/coordinator.png',fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile(out+'/browser.json',JSON.stringify({checkedAt:new Date().toISOString(),widths:[320,390,768,1440],photos:33,autosave:true,reloadPersistence:true,accountIsolation:true,reportFreeze:true,privateDirectAccessBlocked:true,xssEscaped:true,errors},null,2));
  console.log('PASS: browser QA, 33 photos, mobile/desktop, autosave/reload, account isolation, report freeze, private guards.');
}finally{await browser.close();}
