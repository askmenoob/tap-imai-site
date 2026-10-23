import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createManagementService} from './management.mjs';
import {createCatalog} from './catalog.mjs';
import {annualEnd} from './page-state.mjs';
const profile={v:1,name:'Kopi Ujian Tahunan',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
const admin={role:'admin',email:'admin@gmail.com'},alice={role:'user',email:'alice@gmail.com'},bob={role:'user',email:'bob@gmail.com'};
function setup(){let time=Date.parse('2026-10-23T08:00:00Z');const now=()=>time,store=createMemoryLinkStore(),customers=createCustomerService({store,now});const management=createManagementService({store,now,enabled:true,qrPayload:'test-payment-qr'});return {store,customers,management,now,setTime:value=>time=Date.parse(value)};}
test('catalog uses exact approved packages and whole-order sticker bulk price',()=>{
  const catalog=createCatalog();const record={};
  assert.equal(catalog.quote(record,{package:'bundle'}).amountCents,10000);assert.equal(catalog.quote(record,{package:'nfc'}).amountCents,7000);
  assert.equal(catalog.quote(record,{package:'bundle',extraNfcQty:1,stickerQty:19}).amountCents,51000);
  assert.equal(catalog.quote(record,{package:'bundle',extraNfcQty:1,stickerQty:20}).amountCents,43000);
  assert.equal(catalog.quote(record,{package:'nfc',stickerQty:21}).items[1].unitCents,1500);
  assert.throws(()=>catalog.quote(record,{package:'renew'}));assert.throws(()=>catalog.quote(record,{package:'bundle',stickerQty:-1}));
  assert.equal(catalog.quote({subscription:{plan:'annual',lastPaymentId:'paid'}},{package:'renew'}).amountCents,3000);
});
test('only admin controls disable, soft delete and restore; public and customer access follow state',async()=>{
  const {store,customers,management}=setup(),page=await customers.register({url,email:alice.email},admin),links=createShortLinks({store,secret:'s'.repeat(32)});
  await assert.rejects(management.state(page.id,{state:'disabled',revision:page.revision},alice),e=>e.status===403);
  let current=await management.state(page.id,{state:'disabled',revision:page.revision},admin);
  await assert.rejects(links.resolve(page.id),e=>e.status===403);await assert.rejects(customers.update(page.id,{profile,revision:current.revision},alice),e=>e.status===403);
  await assert.rejects(management.state(page.id,{state:'deleted',revision:current.revision,confirmName:'wrong'},admin),e=>e.status===400);
  current=await management.state(page.id,{state:'deleted',revision:current.revision,confirmName:profile.name},admin);
  assert.equal((await customers.list(alice)).items.length,0);await assert.rejects(customers.get(page.id,alice),e=>e.status===404);await assert.rejects(links.resolve(page.id),e=>e.status===410);
  await assert.rejects(management.state(page.id,{state:'active',revision:current.revision},admin),e=>e.status===400);
  current=await management.state(page.id,{state:'disabled',revision:current.revision},admin);current=await management.state(page.id,{state:'active',revision:current.revision},admin);assert.equal((await links.resolve(page.id)).url,url);
  assert.equal((await store.get(page.id)).ownerEmail,alice.email);assert.equal(current.url,page.url);
});
async function request(ctx,page,kind='bundle',ref='BANK-123'){
  const quote=await ctx.management.quote(page.id,{package:kind},alice);
  return ctx.management.request(page.id,{package:kind,reference:ref,paidDate:'2026-10-23',amountCents:quote.amountCents,revision:page.revision},alice);
}
test('reported payment never activates a page; verified admin approval grants exactly 12 months once',async()=>{
  const ctx=setup();const customers=createCustomerService({store:ctx.store,now:ctx.now,newSubscription:{plan:'annual',expiresAt:null}});
  let page=await customers.register({url,email:alice.email},admin),links=createShortLinks({store:ctx.store,secret:'s'.repeat(32),now:ctx.now});
  await assert.rejects(links.resolve(page.id),e=>e.status===403);
  page=await request(ctx,page);assert.equal(page.state,'pending');assert.equal(page.renewal.status,'pending');assert.equal('submittedBy' in page.renewal,false);
  const body={requestId:page.renewal.id,decision:'approve',revision:page.revision};
  await assert.rejects(ctx.management.decide(page.id,body,alice),e=>e.status===403);await assert.rejects(ctx.management.decide(page.id,body,admin),e=>e.status===400);
  page=await ctx.management.decide(page.id,{...body,confirmBank:true},admin);assert.equal(page.subscription.expiresAt,'2027-10-23T08:00:00.000Z');
  const repeat=await ctx.management.decide(page.id,{...body,confirmBank:true},admin);assert.equal(repeat.subscription.expiresAt,page.subscription.expiresAt);assert.equal(repeat.revision,page.revision);
  assert.equal((await links.resolve(page.id)).url,url);
  page=await request(ctx,page,'renew','BANK-RENEW');const saved=await ctx.management.decide(page.id,{requestId:page.renewal.id,decision:'approve',revision:page.revision,confirmBank:true},admin);assert.equal(saved.subscription.expiresAt,'2028-10-23T08:00:00.000Z');
});
test('NFC-only is one-time and does not unlock a hosted annual QR page',async()=>{
  const ctx=setup();let page=await ctx.customers.register({url,email:alice.email},admin);page=await request(ctx,page,'nfc');
  page=await ctx.management.decide(page.id,{requestId:page.renewal.id,decision:'approve',revision:page.revision,confirmBank:true},admin);
  assert.equal(page.subscription.plan,'nfc_only');assert.equal(page.subscription.expiresAt,undefined);await assert.rejects(createShortLinks({store:ctx.store,secret:'s'.repeat(32)}).resolve(page.id),e=>e.status===403);
});
test('cross-customer payment access, price tampering, duplicate references and stale approvals fail closed',async()=>{
  const ctx=setup();let first=await ctx.customers.register({url,email:alice.email},admin),second=await ctx.customers.register({url,email:bob.email},admin);
  await assert.rejects(ctx.management.quote(first.id,{package:'bundle'},bob),e=>e.status===404);
  await assert.rejects(ctx.management.request(first.id,{package:'bundle',reference:'BANK-X',paidDate:'2026-10-23',amountCents:1,revision:first.revision},alice),e=>e.status===409);
  first=await request(ctx,first);const body={requestId:first.renewal.id,decision:'approve',revision:first.revision,confirmBank:true};first=await ctx.management.decide(first.id,body,admin);
  const quote=await ctx.management.quote(second.id,{package:'bundle'},bob);second=await ctx.management.request(second.id,{package:'bundle',reference:'BANK-123',paidDate:'2026-10-23',amountCents:quote.amountCents,revision:second.revision},bob);
  await assert.rejects(ctx.management.decide(second.id,{requestId:second.renewal.id,decision:'approve',revision:second.revision,confirmBank:true},admin),e=>e.status===409);assert.equal((await ctx.store.get(second.id)).subscription,undefined);
  let pending=await request(ctx,first,'renew','BANK-RACE');await ctx.management.state(first.id,{state:'disabled',revision:pending.revision},admin);
  await assert.rejects(ctx.management.decide(first.id,{requestId:pending.renewal.id,decision:'approve',revision:pending.revision,confirmBank:true},admin),e=>e.status===409);
});
test('expiry is enforced without a scheduler, renewal keeps disabled pages disabled, and leap years are clamped',async()=>{
  const ctx=setup();let page=await ctx.customers.register({url,email:alice.email},admin);page=await request(ctx,page);page=await ctx.management.decide(page.id,{requestId:page.renewal.id,decision:'approve',revision:page.revision,confirmBank:true},admin);
  ctx.setTime('2027-11-01T00:00:00Z');await assert.rejects(createShortLinks({store:ctx.store,secret:'s'.repeat(32),now:ctx.now}).resolve(page.id),e=>e.status===403);
  page=await ctx.management.state(page.id,{state:'disabled',revision:page.revision},admin);page=await request(ctx,page,'renew','BANK-LATE');page=await ctx.management.decide(page.id,{requestId:page.renewal.id,decision:'approve',revision:page.revision,confirmBank:true},admin);
  assert.equal(page.subscription.expiresAt,'2028-11-01T00:00:00.000Z');assert.equal(page.state,'disabled');assert.equal(annualEnd('2028-02-29T10:20:30.000Z'),'2029-02-28T10:20:30.000Z');
});
