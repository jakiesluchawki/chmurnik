import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Pages publishes only the consultation introduction, never PHP or protected materials',()=>{
  const workflow=read('.github/workflows/deploy-pages.yml');
  assert.match(workflow,/cp -R review-portal\/entry dist\/ocena/);
  assert.doesNotMatch(workflow,/cp.*review-portal\/(site|delivery)/);
  assert.deepEqual(readdirSync(new URL('../review-portal/entry',import.meta.url)).sort(),['entry.css','index.html']);
  const html=read('review-portal/entry/index.html');
  assert.match(html,/https:\/\/chmurnik.cloud\/ocena\//);
  assert.match(html,/nie nowy benchmark/);
  assert.doesNotMatch(html,/sourceLabels|materials.php|credentials|password|85,4/);
});
test('private API reads cannot enter the parent app GET service-worker cache',()=>{
  const php=read('review-portal/site/api.php');
  assert.match(php,/Cache-Control: no-store, private/);
  assert.match(php,/\$_SERVER\['REQUEST_METHOD'\].* !== 'POST'/);
  const js=read('review-portal/site/portal.js');
  assert.match(js,/method:'POST'/);assert.match(js,/api\('photo'/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|api.php\?action=photo/);
});
test('server gates reports, isolates accounts and freezes first submissions',()=>{
  const php=read('review-portal/site/api.php');
  assert.match(php,/hash_equals\(\$session\['csrf'\]/);
  assert.match(php,/\$user = \$session\['user'\]/);
  assert.match(php,/if \(!\$admin && !isset\(\$db\['submissions'\]\[\$user\]\)\)/);
  assert.match(php,/if \(isset\(\$db\['submissions'\]\[\$user\]\)\) reject/);
  assert.match(php,/flock\(\$lock, LOCK_EX\)/);assert.match(php,/rename\(\$temp, \$path\)/);
});
