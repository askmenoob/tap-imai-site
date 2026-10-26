import test from 'node:test';
import assert from 'node:assert/strict';
import {xProfile} from './contacts.mjs';
import {extractMetadata,socialType} from './metadata.mjs';
import {extractGoogleProfiles} from './google-web.mjs';
import {createMemoryLinkStore,createShortLinks,validateSmartTapURL} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {decodeProfilePayload} from '../src/public-profile.mjs';
const profile={v:1,name:'Rembayung',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const encoded=p=>Buffer.from(JSON.stringify(p)).toString('base64url');
const url=p=>'https://tap.imai.my/?p='+encoded(p);
test('X accepts current and legacy account links, rejecting non-profile or unsafe destinations',()=>{
 for(const value of ['https://x.com/rembayungmy','https://www.x.com/rembayungmy/','https://twitter.com/rembayungmy']){assert.equal(xProfile(value),value);assert.equal(socialType(value),'x');}
 for(const value of ['https://x.com/home','https://x.com/intent','https://x.com/i','https://x.com/share','https://x.com/rembayungmy/status/123','https://x.com/abcdefghijklmnop','https://x.com/bad-name','https://x.com.evil.example/rembayungmy','https://x.com@evil.example/rembayungmy','https://user:password@x.com/rembayungmy','http://x.com/rembayungmy','javascript:alert(1)','https://x.com/rembayungmy?next=evil','https://x.com/rembayungmy#fragment']){assert.equal(xProfile(value),null);assert.throws(()=>validateSmartTapURL(url({...profile,x:value})));assert.throws(()=>decodeProfilePayload(encoded({...profile,x:value})));}
});
test('X metadata comes from actual official links and does not choose ambiguous accounts',()=>{
 const result=extractMetadata('<a href="https://x.com/rembayungmy">X</a><a href="https://x.com/rembayungmy/status/123">Post</a>','https://restaurant.example/');
 assert.equal(result.profile.x,'https://x.com/rembayungmy');assert.equal(result.sources.x,'https://restaurant.example/');
 const ambiguous=extractMetadata('<a href="https://x.com/one">X</a><a href="https://twitter.com/two">X</a>','https://restaurant.example/');assert.equal(ambiguous.profile.x,undefined);assert.equal(ambiguous.candidates.x.length,2);
});
test('X suggestions require Google citation support and matching business identity',async()=>{
 const account='https://x.com/rembayungmy';const result=await extractGoogleProfiles({candidates:[{content:{parts:[{text:JSON.stringify({profiles:[{url:account,ownedByBusiness:true}]})}]},groundingMetadata:{webSearchQueries:['Rembayung official X'],groundingChunks:[{web:{uri:account}}]}}]},'Rembayung',{resolve:async x=>x});assert.deepEqual(result.candidates.x,[account]);
 const absent=await extractGoogleProfiles({candidates:[{content:{parts:[{text:'Official X '+account}]}}]},'Rembayung');assert.deepEqual(absent.candidates,{});
});
test('owners can edit or remove X on the same QR while ownership, subscription and history remain intact',async()=>{
 const store=createMemoryLinkStore(),admin={role:'admin',email:'admin@gmail.com'},owner={role:'user',email:'owner@gmail.com'},other={role:'user',email:'other@gmail.com'};
 const subscription={plan:'annual',expiresAt:'2099-01-01T00:00:00Z',lastGrantId:'demo'};
 const customers=createCustomerService({store,newSubscription:subscription});let page=await customers.register({url:url(profile),email:owner.email},admin);const shortURL=page.url;
 await assert.rejects(customers.update(page.id,{revision:page.revision,profile:{...profile,x:'https://x.com/rembayungmy'}},other),e=>e.status===404);
 page=await customers.update(page.id,{revision:page.revision,profile:{...profile,x:'https://x.com/rembayungmy'}},owner);
 const resolved=await createShortLinks({store,secret:'s'.repeat(32)}).resolve(page.id);assert.equal(decodeProfilePayload(new URL(resolved.url).searchParams.get('p')).x,'https://x.com/rembayungmy');assert.equal(page.url,shortURL);
 assert.equal((await store.get(page.id)).ownerEmail,owner.email);assert.deepEqual(page.subscription,subscription);assert.equal((await store.listHistory(page.id)).items.length,1);
 page=await customers.update(page.id,{revision:page.revision,profile:{...profile,x:''}},owner);assert.equal(page.profile.x,'');assert.equal(page.url,shortURL);
});
