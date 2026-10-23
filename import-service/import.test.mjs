import test from 'node:test';
import assert from 'node:assert/strict';
import { publicIP, safeWebURL } from './safe-fetch.mjs';
import { extractMetadata, socialType } from './metadata.mjs';
import { createImportService } from './service.mjs';
import { createGoogleProvider } from './google.mjs';

test('outbound URLs reject local targets, credentials, ports and unsafe schemes',()=>{
  for(const value of ['http://example.com','file:///etc/passwd','https://localhost/a','https://127.0.0.1/','https://2130706433/','https://[::1]/','https://10.1.1.1/','https://user:pass@example.com/','https://example.com:8443/']) assert.equal(safeWebURL(value),null,value);
  assert.equal(safeWebURL('/logo.png','https://example.com/').href,'https://example.com/logo.png');
});
test('public address checks deny private, mapped, metadata and reserved addresses',()=>{
  for(const value of ['0.0.0.0','127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.2','169.254.169.254','100.64.0.1','192.0.2.1','198.18.0.1','198.51.100.1','203.0.113.1','224.0.0.1','::1','fc00::1','fe80::1','::ffff:8.8.8.8','2001:db8::1','2002:7f00:1::']) assert.equal(publicIP(value),false,value);
  assert.equal(publicIP('8.8.8.8'),true); assert.equal(publicIP('192.0.78.153'),true); assert.equal(publicIP('2606:4700:4700::1111'),true);
});
test('extract actual logo, summary and social accounts from official site markup',()=>{
  const html=`<meta name="description" content="Kopi &amp; makanan tempatan."><meta property="og:site_name" content="Kedai Kopi"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"CafeOrCoffeeShop","name":"Kedai Kopi","logo":{"url":"/logo.png"},"sameAs":["https://www.instagram.com/kedaikopi/","https://www.tiktok.com/@kedaikopi"]}]}</script><a href="https://wa.me/60123456789">Hubungi</a><a href="https://facebook.com/sharer/sharer.php?u=example">Share</a>`;
  const data=extractMetadata(html,'https://example.com/');
  assert.equal(data.profile.name,'Kedai Kopi'); assert.equal(data.profile.logo,'https://example.com/logo.png');
  assert.equal(data.profile.tagline,'Kopi & makanan tempatan.'); assert.equal(data.profile.instagram,'https://www.instagram.com/kedaikopi/');
  assert.equal(data.profile.tiktok,'https://www.tiktok.com/@kedaikopi'); assert.equal(data.profile.whatsapp,'https://wa.me/60123456789');
  assert.equal(data.profile.facebook,undefined); assert.equal(data.sources.logo,'https://example.com/');
});
test('do not guess logo from general photo, invent accounts, or choose ambiguous accounts',()=>{
  const data=extractMetadata('<meta property="og:image" content="https://example.com/shop.jpg"><a href="https://instagram.com/branch1">A</a><a href="https://instagram.com/branch2">B</a><a href="https://instagram.com/p/post123">Post</a><script type="application/ld+json">not valid json</script>','https://example.com/');
  assert.equal(data.profile.logo,undefined); assert.equal(data.profile.instagram,undefined); assert.equal(data.profile.facebook,undefined);
  assert.equal(data.candidates.instagram.length,2);
  assert.equal(socialType('https://facebook.com.evil.example/account'),null);
  assert.equal(socialType('javascript:alert(1)'),null);
});
test('a clearly marked official header logo can be imported without taking social icons',()=>{
  const data=extractMetadata('<header><img src="/facebook-logo.png" alt="Facebook"><a rel="home"><img src="/brand-logo.svg" alt="Our logo"></a></header>','https://example.com/');
  assert.equal(data.profile.logo,'https://example.com/brand-logo.svg');
});
function setup({website='https://example.com/',readWebsite,now}={}) {
  let detailsCalls=0;
  const google={search:async()=>[{id:'ChIJTest123456',name:'Google result',address:'Address'}],details:async id=>{detailsCalls++;return {id,website};}};
  const service=createImportService({google,secret:'s'.repeat(32),now,...(readWebsite?{readWebsite}:{readWebsite:async()=>({url:website,html:'<meta name="description" content="Official summary">'})})});
  return {service,calls:()=>detailsCalls};
}
test('search requires explicit selection and import derives exact review URL',async()=>{
  const {service,calls}=setup(); const search=await service.search('My Business');
  assert.equal(calls(),0); assert.equal(search.places[0].name,'Google result');
  const result=await service.import(search.places[0].token);
  assert.equal(calls(),1); assert.equal(result.profile.google,'https://search.google.com/local/writereview?placeid=ChIJTest123456');
  assert.equal(result.profile.name,'My Business'); assert.equal(result.profile.tagline,'Official summary');
});
test('tampered and expired selections fail before a billed details lookup',async()=>{
  let time=100000; const {service,calls}=setup({now:()=>time}); const token=(await service.search('Business')).places[0].token;
  await assert.rejects(service.import(token.slice(0,-1)+'!')); assert.equal(calls(),0);
  time+=16*60*1000; await assert.rejects(service.import(token)); assert.equal(calls(),0);
});
test('no official site means honest blanks and a usable review link',async()=>{
  const {service}=setup({website:''}); const token=(await service.search('My Business')).places[0].token;
  const data=await service.import(token); assert.ok(data.profile.google); assert.equal(data.profile.logo,undefined); assert.equal(data.profile.instagram,undefined); assert.ok(data.warnings.length);
});
test('unreachable website keeps partial results and names the limitation',async()=>{
  const {service}=setup({readWebsite:async()=>{throw new Error('timeout');}}); const token=(await service.search('My Business')).places[0].token;
  const data=await service.import(token); assert.equal(data.profile.website,'https://example.com/'); assert.ok(data.profile.google); assert.equal(data.profile.tagline,undefined); assert.match(data.warnings[0],/tidak dapat dibaca/);
});
test('social-only business website is used without scraping a social login',async()=>{
  let fetched=false; const {service}=setup({website:'https://www.instagram.com/example/',readWebsite:async()=>{fetched=true;}}); const token=(await service.search('Business')).places[0].token;
  const data=await service.import(token); assert.equal(fetched,false); assert.equal(data.profile.instagram,'https://www.instagram.com/example/'); assert.equal(data.profile.website,undefined);
});
test('upgrade legacy http business website links to HTTPS before a safe read',async()=>{
  let requested; const {service}=setup({website:'http://example.com/',readWebsite:async url=>{requested=url;return {url,html:'<meta name="description" content="Official text">'};}});
  const token=(await service.search('Business')).places[0].token;
  const data=await service.import(token); assert.equal(requested,'https://example.com/');assert.equal(data.profile.website,'https://example.com/');
});
test('missing API key fails closed without simulated provider success',async()=>{
  await assert.rejects(createGoogleProvider('').search('Business'),error=>error.status===503);
});
