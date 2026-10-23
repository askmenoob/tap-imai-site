import test from 'node:test';
import assert from 'node:assert/strict';
import {createShortLinks,createCloudLinkStore,validateSmartTapURL} from './short-links.mjs';

const profile={v:1,name:'Kopi Contoh ☕',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456',whatsapp:'https://wa.me/60122258950'};
const encode=(value=profile)=>'https://tap.imai.my/?p='+Buffer.from(JSON.stringify(value)).toString('base64url');
function storage(){const records=new Map();return {records,create:async(id,value)=>{if(records.has(id))return false;records.set(id,value);return true;},get:async id=>records.get(id)||null};}
test('short URL resolves the original profile after a new service instance and secret change',async()=>{
  const store=storage();const links=createShortLinks({store,secret:'s'.repeat(32)});const original=encode();
  const short=await links.shorten(original);assert.match(short.url,/^https:\/\/tap\.imai\.my\/\?s=[A-Za-z0-9_-]{16}$/);assert.ok(short.url.length<original.length);
  assert.deepEqual(await links.shorten(original),short);assert.equal(store.records.size,1);
  const restarted=createShortLinks({store,secret:'t'.repeat(32)});assert.equal((await restarted.resolve(short.id)).url,original);
});
test('edited profiles get separate short URLs and leave the previous destination intact',async()=>{
  const store=storage();const links=createShortLinks({store,secret:'s'.repeat(32)});const original=encode();
  const first=await links.shorten(original);const second=await links.shorten(encode({...profile,name:'Kopi Disunting'}));
  assert.notEqual(first.id,second.id);assert.equal((await links.resolve(first.id)).url,original);assert.equal(store.records.size,2);
});
test('invalid destinations and nested redirects are rejected before any storage write',async()=>{
  let writes=0;const links=createShortLinks({store:{create:async()=>{writes++;}},secret:'s'.repeat(32)});
  for(const url of ['https://evil.example/?p=abc','http://tap.imai.my/?p=abc','https://tap.imai.my/?s=abcdefghijklmnop',encode()+'&next=https://evil.example',encode()+'#fragment',encode({v:1,name:'No review'}),encode({...profile,instagram:'javascript:alert(1)'}),encode({...profile,v:2}),encode({...profile,extra:'unsupported'}),'https://user:pass@tap.imai.my/?p=abc']) await assert.rejects(links.shorten(url),e=>e.status===400);
  assert.equal(writes,0);assert.equal(validateSmartTapURL(encode()),encode());
});
test('unknown IDs and invalid IDs fail clearly without returning arbitrary destinations',async()=>{
  let reads=0;const links=createShortLinks({store:{get:async()=>{reads++;return null;}},secret:'s'.repeat(32)});
  await assert.rejects(links.resolve('../secrets'),e=>e.status===404);assert.equal(reads,0);
  await assert.rejects(links.resolve('abcdefghijklmnop'),e=>e.status===404);assert.equal(reads,1);
});
test('storage failure is not reported as a successfully created short URL',async()=>{
  const links=createShortLinks({store:{create:async()=>{throw new Error('storage unavailable');}},secret:'s'.repeat(32)});
  await assert.rejects(links.shorten(encode()),/storage unavailable/);
});
test('a collision never overwrites an existing destination',async()=>{
  let creates=0;const store={create:async()=>++creates>1,get:async()=>({url:encode({...profile,name:'Another business'})})};
  const links=createShortLinks({store,secret:'s'.repeat(32)});const short=await links.shorten(encode());assert.ok(short.id);assert.equal(creates,2);
});
test('Cloud Storage adapter creates only new objects and reads durable JSON by exact key',async()=>{
  const calls=[];const fetcher=async(url,options)=>{calls.push({url:new URL(url),...options});return calls.length===1?new Response('{}',{status:412}):new Response(JSON.stringify({v:1,url:encode()}),{status:200});};
  const store=createCloudLinkStore({bucket:'smarttap-test-links',getToken:async()=>'test-token',fetcher});
  assert.equal(await store.create('abcdefghijklmnop',{url:encode()}),false);
  assert.equal(calls[0].url.searchParams.get('ifGenerationMatch'),'0');assert.equal(calls[0].url.searchParams.get('name'),'links/abcdefghijklmnop.json');
  assert.equal((await store.get('abcdefghijklmnop')).url,encode());assert.match(calls[1].url.pathname,/links%2Fabcdefghijklmnop\.json$/);
});

test('Cloud Storage admin reads pinned generations, lists only mappings and conditionally updates',async()=>{
  const calls=[];const replies=[{generation:'123'},profile,{items:[{name:'links/abcdefghijklmnop.json',generation:'123'},{name:'links/unrelated.txt',generation:'456'}],nextPageToken:'next-page'},profile,{},false];
  const fetcher=async(url,options)=>{calls.push({url:new URL(url),...options});const data=replies.shift();return new Response(JSON.stringify(data),{status:data===false?412:200});};
  const store=createCloudLinkStore({bucket:'smarttap-test-links',getToken:async()=>'test-token',fetcher});
  assert.equal((await store.getVersion('abcdefghijklmnop')).revision,'123');assert.equal(calls[1].url.searchParams.get('generation'),'123');
  const page=await store.list('previous');assert.equal(page.items.length,1);assert.equal(page.cursor,'next-page');assert.equal(calls[2].url.searchParams.get('prefix'),'links/');assert.equal(calls[2].url.searchParams.get('pageToken'),'previous');
  assert.equal(await store.archive('abcdefghijklmnop','123',{url:encode()}),true);assert.equal(calls[4].url.searchParams.get('name'),'history/abcdefghijklmnop/123.json');assert.equal(calls[4].url.searchParams.get('ifGenerationMatch'),'0');
  assert.equal(await store.update('abcdefghijklmnop',{url:encode()},'123'),false);assert.equal(calls[5].url.searchParams.get('ifGenerationMatch'),'123');
});

test('an archive storage failure prevents proceeding as though a backup was saved',async()=>{
  const store=createCloudLinkStore({bucket:'smarttap-test-links',getToken:async()=>'test-token',fetcher:async()=>new Response('{}',{status:404})});
  await assert.rejects(store.archive('abcdefghijklmnop','123',{url:encode()}),/unavailable/);
});
