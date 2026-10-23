import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('HTTP admin routes reject anonymous/forged access and cross-origin writes; production ignores demo flag',async t=>{
  const child=spawn(process.execPath,['import-service/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'18972',PREVIEW_DEMO:'1',GOOGLE_PLACES_API_KEY:'test',IMPORT_SIGNING_SECRET:'s'.repeat(32),ADMIN_GOOGLE_CLIENT_ID:'123456789-test.apps.googleusercontent.com',ADMIN_EMAILS:'admin@example.com',SHORT_LINK_BUCKET:''},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());let started='';
  for await(const chunk of child.stdout){started+=chunk;if(started.includes('\n'))break;}
  assert.equal(JSON.parse(started).demo,false);
  const base='http://127.0.0.1:18972';const origin='https://tap.imai.my';
  const config=await fetch(base+'/api/admin/config',{headers:{Origin:origin}});assert.equal(config.status,200);const data=await config.json();assert.equal(data.configured,true);assert.equal(data.demo,undefined);assert.equal(data.emails,undefined);
  assert.equal((await fetch(base+'/api/admin/links',{headers:{Origin:origin}})).status,401);
  assert.equal((await fetch(base+'/api/admin/links',{headers:{Origin:origin,Authorization:'Bearer fake'}})).status,401);
  assert.equal((await fetch(base+'/api/search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{"query":"Loffee Coffee"}'})).status,401);
  assert.equal((await fetch(base+'/api/search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer fake'},body:'{"query":"Loffee Coffee"}'})).status,401);
  assert.equal((await fetch(base+'/api/admin/links/abcdefghijklmnop',{method:'PUT',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/api/admin/links/abcdefghijklmnop',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  const preflight=await fetch(base+'/api/admin/links/abcdefghijklmnop',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'PUT'}});assert.equal(preflight.status,204);assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);
  const searchPreflight=await fetch(base+'/api/search',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}});assert.equal(searchPreflight.status,204);assert.match(searchPreflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);
  child.kill();await once(child,'exit');
});
