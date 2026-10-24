import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore,createShortLinks,validateSmartTapURL} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createAdminService} from './admin.mjs';
import {decodeProfilePayload} from '../src/public-profile.mjs';
const origin='https://tap.imai.my',admin={role:'admin',email:'admin@gmail.com'},owner={role:'user',email:'customer@gmail.com'};
const pending={v:1,name:'Kedai Belum Tersenarai',googleStatus:'pending',google:'',address:'Shah Alam',directions:'https://www.google.com/maps/search/?api=1&query=3.0,101.5',whatsapp:'https://wa.me/60103250032'};
const encode=p=>Buffer.from(JSON.stringify(p)).toString('base64url'),url=p=>origin+'/?p='+encode(p);
test('admin registers pending listing, owner edits other fields, admin connects review on same QR',async()=>{
 const store=createMemoryLinkStore(),customers=createCustomerService({store}),admins=createAdminService({store}),links=createShortLinks({store,secret:'s'.repeat(32)});
 let page=await customers.register({url:url(pending),email:owner.email},admin);
 assert.equal(page.profile.googleStatus,'pending');assert.equal(decodeProfilePayload(new URL((await links.resolve(page.id)).url).searchParams.get('p')).directions,pending.directions);
 page=await customers.update(page.id,{revision:page.revision,profile:{...pending,name:'Nama Dikemas Kini',googleStatus:undefined,google:'https://search.google.com/local/writereview?placeid=ChIJForged'}},owner);
 assert.equal(page.profile.google,'');assert.equal(page.profile.googleStatus,'pending');const short=page.url;
 page=await admins.update(page.id,{revision:page.revision,profile:{...pending,googleStatus:undefined,google:'https://search.google.com/local/writereview?placeid=ChIJActual123'}},admin);
 assert.equal(page.url,short);assert.equal(page.profile.googleStatus,undefined);assert.match(page.profile.google,/ChIJActual123/);
 assert.equal(decodeProfilePayload(new URL((await links.resolve(page.id)).url).searchParams.get('p')).google,page.profile.google);
 await assert.rejects(customers.update(page.id,{revision:page.revision,profile:pending},owner),e=>e.status===403);
});
test('pending requires consistent explicit status and cannot be created by public shortener',async()=>{
 const store=createMemoryLinkStore(),links=createShortLinks({store,secret:'s'.repeat(32)});
 assert.equal(validateSmartTapURL(url(pending)),url(pending));assert.equal(decodeProfilePayload(encode(pending)).googleStatus,'pending');
 await assert.rejects(links.shorten(url(pending)),e=>e.status===400);assert.equal(store.records.size,0);
 for(const p of [{...pending,googleStatus:undefined},{...pending,googleStatus:'approved'},{...pending,google:'https://evil.example/'},{...pending,google:'https://search.google.com/local/writereview?placeid=ChIJTest'}]){assert.throws(()=>validateSmartTapURL(url(p)));assert.throws(()=>decodeProfilePayload(encode(p)));}
 const customers=createCustomerService({store});await assert.rejects(customers.register({url:url(pending),email:owner.email},owner),e=>e.status===403);
});
