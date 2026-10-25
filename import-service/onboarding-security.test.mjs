import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {onboardingResult} from '../src/onboarding-result.mjs';

const url='https://tap.imai.my/?s=abcdefghijklmnop';

test('public creation is a pending draft with a manual admin contact, never an activation promise',()=>{
  const result=onboardingResult({url,name:'Kopi & Roti\nShah Alam',language:'en'});
  assert.match(result.status,/awaiting registration and activation/i);
  assert.match(result.notice,/super admin.*register.*Gmail/i);
  assert.match(result.openLabel,/status/i);
  const contact=new URL(result.contactURL);
  assert.equal(contact.origin,'https://wa.me');
  assert.equal(contact.pathname,'/60103250032');
  assert.match(contact.searchParams.get('text'),/Kopi & Roti\nShah Alam/);
  assert.match(contact.searchParams.get('text'),/abcdefghijklmnop/);
  assert.match(contact.searchParams.get('text'),/https:\/\/tap.imai.my\/\?s=abcdefghijklmnop/);
  assert.equal(result.showContact,true);
});

test('registered admin result preserves management flow and does not request duplicate registration',()=>{
  const result=onboardingResult({url,name:'Perniagaan',registering:true,language:'ms'});
  assert.equal(result.showContact,false);
  assert.equal(result.contactURL,'');
  assert.match(result.notice,/Pendaftaran Gmail selesai/);
  assert.match(result.notice,/ToyyibPay/);
  assert.doesNotMatch(result.notice,/hantar.*rujukan bayaran/i);
});

test('result copy follows the selected language and invalid short IDs cannot be sent to admin',()=>{
  const result=onboardingResult({url,name:'Kopi',language:'ms'});
  assert.match(result.status,/menunggu pendaftaran dan pengaktifan/);
  assert.match(new URL(result.contactURL).searchParams.get('text'),/Perniagaan: Kopi/);
  for(const bad of ['https://evil.example/?s=abcdefghijklmnop','https://tap.imai.my/?p=encoded','https://tap.imai.my/?s=bad','https://tap.imai.my/?s=abcdefghijklmnop&email=private@gmail.com','https://tap.imai.my/?s=abcdefghijklmnop#other']){
    assert.throws(()=>onboardingResult({url:bad,name:'Kopi'}),/URL pendek/);
  }
});

test('static security headers constrain executable content while preserving Google login and PWA',async()=>{
  const source=await readFile(new URL('../_headers',import.meta.url),'utf8');
  const global=source.split(/\r?\n/).slice(1).filter(line=>/^\s/.test(line)).join('\n');
  assert.match(source,/^\/\*\r?\n/);
  assert.match(global,/X-Frame-Options: DENY/);
  assert.match(global,/X-Content-Type-Options: nosniff/);
  assert.match(global,/Strict-Transport-Security: max-age=31536000/);
  assert.doesNotMatch(global,/includeSubDomains|preload/);
  assert.match(global,/Permissions-Policy:.*camera=\(\).*microphone=\(\)/);
  const csp=global.match(/Content-Security-Policy: (.+)/)?.[1];
  assert.ok(csp);
  const directives=new Map(csp.split(';').map(part=>part.trim().split(/\s+/)).filter(([name])=>name).map(([name,...values])=>[name,values]));
  assert.deepEqual(directives.get('script-src'),["'self'",'https://accounts.google.com/gsi/client']);
  assert.deepEqual(directives.get('frame-ancestors'),["'none'"]);
  assert.deepEqual(directives.get('object-src'),["'none'"]);
  assert.deepEqual(directives.get('worker-src'),["'self'"]);
  assert.deepEqual(directives.get('manifest-src'),["'self'"]);
  assert.ok(directives.get('style-src').includes('https://accounts.google.com/gsi/style'));
  assert.ok(directives.get('frame-src').includes('https://accounts.google.com/gsi/'));
  assert.ok(directives.get('connect-src').includes('https://accounts.google.com/gsi/'));
  assert.ok(directives.get('img-src').includes('https:'));
  assert.doesNotMatch(csp,/'unsafe-eval'/);
  assert.match(global,/Cross-Origin-Opener-Policy: same-origin-allow-popups/);
  assert.match(source,/\/sw\.js\r?\n\s+Cache-Control: no-store/);
});
