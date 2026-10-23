import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeProfilePayload,profileURL} from '../src/public-profile.mjs';
import {generateShortPage} from '../src/short-page.mjs';
const base={v:1,name:'Kopi ☕',tagline:'Kopi tempatan',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456',instagram:'https://instagram.com/loffeecoffee.official',threads:'https://threads.com/@loffeecoffee.official',logo:'https://example.com/logo.png'};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
test('new short-page renderer preserves existing v1 profiles, Unicode, logo and social URLs',()=>{
  const profile=decodeProfilePayload(encode(base));assert.equal(profile.name,'Kopi ☕');assert.equal(profile.logo,base.logo);assert.equal(profile.threads,base.threads);assert.equal(profile.instagram,base.instagram);
});
test('generation passes only the short URL to the QR encoder and shared output',async()=>{
  const short='https://tap.imai.my/?s=abcdefghijklmnop';let encoded;let original;
  const page=await generateShortPage(base,{origin:'https://tap.imai.my',shorten:async url=>{original=url;return {url:short};},qr:async url=>{encoded=url;return 'png';}});
  assert.equal(page.url,short);assert.equal(encoded,short);assert.ok(original.includes('?p='));assert.equal(page.png,'png');
});
test('a failed or unsafe shortener never generates a QR for the original URL',async()=>{
  let qrCalls=0;const qr=async()=>{qrCalls++;};
  await assert.rejects(generateShortPage(base,{origin:'https://tap.imai.my',shorten:async()=>{throw new Error('offline');},qr}),/offline/);
  for(const url of ['https://evil.example/?s=abcdefghijklmnop','https://tap.imai.my/?p=encoded','https://tap.imai.my/?s=abcdefghijklmnop&extra=1'])await assert.rejects(generateShortPage(base,{origin:'https://tap.imai.my',shorten:async()=>({url}),qr}));
  assert.equal(qrCalls,0);
});
test('editing while a short URL request is pending cancels QR generation',async()=>{
  const controller=new AbortController();let complete;let qrCalls=0;
  const pending=generateShortPage(base,{origin:'https://tap.imai.my',signal:controller.signal,shorten:()=>new Promise(resolve=>{complete=resolve;}),qr:async()=>{qrCalls++;}});
  controller.abort();complete({url:'https://tap.imai.my/?s=abcdefghijklmnop'});await assert.rejects(pending,e=>e.name==='AbortError');assert.equal(qrCalls,0);
});
test('public renderer rejects unsafe links, unsupported versions and invalid review links',()=>{
  for(const value of [{...base,instagram:'javascript:alert(1)'},{...base,logo:'https://user:pass@example.com/a'},{...base,google:'https://evil.example/review'},{...base,v:2},{...base,name:''}])assert.throws(()=>decodeProfilePayload(encode(value)));
  for(const payload of ['not base64!','e30','A'.repeat(4097)])assert.throws(()=>decodeProfilePayload(payload));
  assert.equal(profileURL('https://example.com:8443/a'),null);
});
