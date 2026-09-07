import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='http://127.0.0.1:18973',credentials=JSON.parse(await readFile('.local/review-portal/credentials.json'));
let checks=0;
// Only this isolated, disposable test storage may be reset by the test runner.
await rm('.local/review-portal/qa-root/ocena/_private/storage.php',{force:true});
async function request(action,values={},session=null,expected=200,extraHeaders={}){
  const r=await fetch(base+'/ocena/api.php',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Portal-Request':'1',...(session?{Cookie:session.cookie}:{}),...extraHeaders},body:JSON.stringify({action,csrf:session?.csrf,...values})});
  assert.equal(r.status,expected,`${action}: ${await r.clone().text()}`);checks++;
  assert.match(r.headers.get('cache-control'),/no-store/);return r;
}
const sessions={};
await request('session',{},null,401);
await request('login',{login:'meteo1',password:'wrong'},null,401);
await request('session',{},null,403,{Origin:'https://untrusted.example'});
for(const a of credentials){
  const r=await request('login',{login:a.login,password:a.password});const data=await r.json();
  const cookie=r.headers.getSetCookie()[0];assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Strict/i);assert.match(cookie,/path=\/ocena\//i);
  sessions[a.login]={cookie:cookie.split(';')[0],csrf:data.csrf};
  assert.equal(data.user.login,a.login);assert.equal(data.count,0);
}
const a=sessions.meteo1,b=sessions.meteo2,owner=sessions.koordynator;
await request('save',{id:'R001',revision:0,answer:{},csrf:'wrong'},a,403);
await request('overview',{},a,403);await request('report',{},a,403);
const answer={status:'single',genera:['Cu'],alternatives:[],quality:'dobra',features:'QA: wyraźne krawędzie',limitations:'',notes:'<script>window.leak=true</script>'};
let r=await request('save',{id:'R001',revision:0,answer},a);assert.equal((await r.json()).count,1);
await request('save',{id:'R001',revision:0,answer},a,409);
await request('save',{id:'R001',revision:1,answer:{...answer,genera:['invalid']}},a,400);
await request('save',{id:'R001',revision:0,answer},owner,403);
// New optional fields neither infer a level from Cu nor overwrite older data.
r=await request('session',{},a);assert.equal((await r.json()).answers.R001.level,'');
const contextual={...answer,level:'uncertain',contextLimits:['horizon','wide_frame']};
r=await request('save',{id:'R001',revision:1,answer:contextual},a);
assert.equal((await r.json()).answer.level,'uncertain');
await request('save',{id:'R001',revision:2,answer:{...contextual,level:'guessed'}},a,400);
await request('save',{id:'R001',revision:2,answer:{...contextual,contextLimits:['horizon','horizon']}},a,400);
await request('save',{id:'R001',revision:2,answer:{...contextual,contextLimits:['invalid']}},a,400);
// A v1 browser tab omits fields it does not know. Preserve their stored values.
r=await request('save',{id:'R001',revision:2,answer},a);
let saved=(await r.json()).answer;assert.equal(saved.level,'uncertain');assert.deepEqual(saved.contextLimits,['horizon','wide_frame']);
r=await request('save',{id:'R001',revision:3,answer:{...answer,level:'',contextLimits:[]}},a);
saved=(await r.json()).answer;assert.equal(saved.level,'');assert.deepEqual(saved.contextLimits,[]);
r=await request('save',{id:'R001',revision:4,answer:contextual},a);
const frozenAnswer=(await r.json()).answer;
r=await request('session',{},b);assert.deepEqual((await r.json()).answers,{});
await request('save',{id:'R002',user:'meteo1',revision:0,answer:{...answer,status:'uncertain',genera:[],alternatives:['Sc','Ac']}},b);
r=await request('session',{},a);assert.equal((await r.json()).answers.R002,undefined);
r=await request('photo',{id:'R001'},a);assert.match(r.headers.get('content-type'),/image\/jpeg/);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(await readFile('.local/v4/consultation-20260907/01-ocena-bez-podpowiedzi/images/R001.jpg')));
await request('photo',{id:'../x'},a,404);
const get=await fetch(base+'/ocena/api.php?action=photo&id=R001',{headers:{Cookie:a.cookie}});assert.equal(get.status,405);checks++;
await request('submit',{confirm:false},a,400);
r=await request('submit',{confirm:true},a);const submission=(await r.json()).submission;assert.equal(submission.count,1);assert.deepEqual(submission.answers.R001,frozenAnswer);
await request('save',{id:'R001',revision:5,answer:{...contextual,level:'low'}},a,409);
await request('save',{id:'R001',revision:1,answer},a,409);
r=await request('report',{},a);const report=await r.json();assert.equal(report.sourceLabels.length,33);assert.equal(report.pilot.length,22);
await request('report',{},b,403);
r=await request('overview',{},owner);const overview=await r.json();assert.equal(overview.reviewers.length,3);assert.equal(overview.reviewers.find(u=>u.login==='meteo1').count,1);
r=await request('export',{},owner);const text=await r.text();const exported=JSON.parse(text).data;assert.deepEqual(exported.reviews.meteo1.R001,frozenAnswer);assert(!text.includes('sessions'));assert(!text.includes('rateSecret'));for(const c of credentials)assert(!text.includes(c.password));
await request('logout',{},a);await request('session',{},a,401);
// One wrong password above already counts towards this IP's ten attempts.
for(let i=0;i<9;i++)await request('login',{login:'unknown',password:'bad'},null,401);
await request('login',{login:'unknown',password:'bad'},null,429);
await mkdir('build/review-portal-qa',{recursive:true});
await writeFile('build/review-portal-qa/api.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,accounts:4,isolation:true,csrf:true,reportGate:true,frozenSnapshot:true,optimisticConcurrency:true,rateLimit:true,protectedPhotoHash:true},null,2));
// Reset only this disposable QA dataset before the independent browser test.
await rm('.local/review-portal/qa-root/ocena/_private/storage.php');
console.log(`PASS: ${checks} API checks, 3 isolated reviewers + coordinator, durable writes and protected report.`);
