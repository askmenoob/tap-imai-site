import test from 'node:test';
import assert from 'node:assert/strict';
import {malaysiaPhone,whatsappFromPhone,threadsProfile} from './contacts.mjs';
import {extractGoogleProfiles} from './google-web.mjs';
import {createImportService} from './service.mjs';

test('Malaysian phone formats produce the exact WhatsApp link requested',()=>{
  for(const phone of ['012-2258950','012 225 8950','+60 12-225 8950','0060122258950','60122258950','tel:0122258950']) {
    assert.equal(malaysiaPhone(phone),'60122258950');assert.equal(whatsappFromPhone(phone),'https://wa.me/60122258950');
  }
  for(const phone of ['+441234567890','+6512345678','0122258950 ext 3','abc','012','https://wa.me/60122258950']) assert.equal(whatsappFromPhone(phone),null);
});
test('Threads allows profile pages on both current and legacy domains',()=>{
  assert.ok(threadsProfile('https://www.threads.com/@loffeecoffee.official'));
  assert.ok(threadsProfile('https://www.threads.net/@loffeecoffee.official'));
  for(const url of ['https://threads.com/@name/post/abc','https://threads.com.evil.example/@name','javascript:alert(1)','https://user:pass@threads.com/@name']) assert.equal(threadsProfile(url),null);
});
const response=profiles=>({candidates:[{content:{parts:[{text:JSON.stringify({profiles})}]},groundingMetadata:{webSearchQueries:['Loffee Coffee Jalan Kebun Instagram'],groundingChunks:profiles.filter(p=>p.cited!==false).map(p=>({web:{uri:p.url}})),searchEntryPoint:{renderedContent:'<div>Google suggestions</div>'}}}]});
test('web enrichment requires real citations and rejects invented profiles and reviewers',async()=>{
  const raw=response([
    {url:'https://www.instagram.com/loffeecoffee.official/',ownedByBusiness:true},
    {url:'https://www.tiktok.com/@reviewer',ownedByBusiness:true},
    {url:'https://www.facebook.com/loffeecoffee',ownedByBusiness:false},
    {url:'https://www.threads.com/@loffeecoffee',ownedByBusiness:true,cited:false},
  ]);
  const data=await extractGoogleProfiles(raw,'Loffee Coffee',{resolve:async x=>x});
  assert.deepEqual(data.candidates,{instagram:['https://instagram.com/loffeecoffee.official']});assert.equal(data.grounded,true);assert.match(data.searchSuggestionsHtml,/Google/);
  assert.equal((await extractGoogleProfiles({candidates:[{content:raw.candidates[0].content}]},'Loffee Coffee')).grounded,false);
});
test('Google phone and cited social are imported even without a business website',async()=>{
  let identity;
  const service=createImportService({secret:'s'.repeat(32),google:{search:async()=>[{id:'ChIJLoffee12345',name:'Loffee Coffee',address:'Jalan Kebun'}],details:async id=>({id,phone:'+60 12-225 8950'})},webSearch:{search:async value=>{identity=value;return {grounded:true,candidates:{instagram:['https://instagram.com/loffeecoffee.official']},searchSuggestionsHtml:'<div>Google</div>'};}}});
  const token=(await service.search('loffee coffee jalan kebun')).places[0].token;
  const result=await service.import(token);
  assert.equal(result.profile.phone,'60122258950');assert.equal(result.profile.whatsapp,'https://wa.me/60122258950');
  assert.equal(result.profile.instagram,'https://instagram.com/loffeecoffee.official');assert.equal(identity.address,'Jalan Kebun');
  assert.equal(result.searchSuggestionsHtml,'<div>Google</div>');assert.ok(result.warnings.some(w=>w.includes('berdaftar')));
});
test('web failure preserves selected business and phone; multiple accounts require a choice',async()=>{
  const base={secret:'s'.repeat(32),google:{search:async()=>[{id:'ChIJLoffee12345',name:'Loffee Coffee'}],details:async id=>({id,phone:'0122258950'})}};
  const failed=createImportService({...base,webSearch:{search:async()=>{throw new Error('quota');}}});
  const data=await failed.import((await failed.search('Loffee')).places[0].token);
  assert.equal(data.profile.whatsapp,'https://wa.me/60122258950');assert.ok(data.warnings.some(w=>w.includes('tidak memberikan')));
  const multiple=createImportService({...base,webSearch:{search:async()=>({grounded:true,candidates:{instagram:['https://instagram.com/loffeecoffee','https://instagram.com/loffeecoffee.official']}})}});
  const result=await multiple.import((await multiple.search('Loffee')).places[0].token);
  assert.equal(result.profile.instagram,undefined);assert.equal(result.candidates.instagram.length,2);
});

test('a grounded statement can cite a directory or tagged post for a business profile',async()=>{
  const text='Official Instagram: https://www.instagram.com/loffeecoffee.official';
  const data={candidates:[{content:{parts:[{text}]},groundingMetadata:{webSearchQueries:['Loffee Coffee Shah Alam'],groundingChunks:[{web:{uri:'https://example.com/loffee-coffee'}}],groundingSupports:[{segment:{text},groundingChunkIndices:[0]}]}}]};
  const found=await extractGoogleProfiles(data,'Loffee Coffee',{resolve:async x=>x});
  assert.deepEqual(found.candidates.instagram,['https://instagram.com/loffeecoffee.official']);
  assert.equal(found.sources['https://instagram.com/loffeecoffee.official'],'https://example.com/loffee-coffee');
  data.candidates[0].groundingMetadata.groundingSupports=[];
  assert.deepEqual((await extractGoogleProfiles(data,'Loffee Coffee',{resolve:async x=>x})).candidates,{});
});

test('citation attached to a handle explanation still supplies a clearly labelled platform suggestion',async()=>{
  const text='Official Instagram: https://www.instagram.com/loffeecoffee.official\nSource: patrons tag the business handle.\nOfficial Threads: https://threads.com/@loffeecoffee';
  const data={candidates:[{content:{parts:[{text}]},groundingMetadata:{webSearchQueries:['Loffee Coffee Shah Alam'],groundingChunks:[{web:{uri:'https://instagram.com/reel/example'}}],groundingSupports:[{segment:{text:'patrons tag the business handle'},groundingChunkIndices:[0]}]}}]};
  const found=await extractGoogleProfiles(data,'Loffee Coffee',{resolve:async x=>x});
  assert.deepEqual(found.candidates,{instagram:['https://instagram.com/loffeecoffee.official']});
});

test('Google citation provenance survives a redirect that cannot be resolved by the server',async()=>{
  const text='Official Instagram: https://www.instagram.com/loffeecoffee.official';
  const source='https://vertexaisearch.cloud.google.com/grounding-api-redirect/example';
  const raw={candidates:[{content:{parts:[{text}]},groundingMetadata:{webSearchQueries:['Loffee Coffee'],groundingChunks:[{web:{uri:source,domain:'instagram.com'}}],groundingSupports:[{segment:{text},groundingChunkIndices:[0]}]}}]};
  const found=await extractGoogleProfiles(raw,'Loffee Coffee',{resolve:async()=>{throw new Error('redirect unavailable');}});
  assert.deepEqual(found.candidates.instagram,['https://instagram.com/loffeecoffee.official']);assert.equal(found.sources['https://instagram.com/loffeecoffee.official'],source);
});
