import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createManagementService} from './management.mjs';

const admin={role:'admin',email:'admin@gmail.com'};
const profile={v:1,name:'Kedai Semakan',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
const now=()=>Date.parse('2026-10-25T08:00:00Z');
async function setup(extra={}){
  const store=createMemoryLinkStore(),customers=createCustomerService({store,now}),management=createManagementService({store,now,enabled:true,manualEnabled:true,qrPayload:'test-payment-qr'});
  const page=await customers.register({url,email:'alice@gmail.com'},admin);
  const old=await store.getVersion(page.id);
  await store.update(page.id,{...old.record,...extra,paymentResolution:{orderId:'ST'+'a'.repeat(24),token:'durable-resolution-test',action:'apply',targetOwnerKey:'current-owner'}},old.revision);
  return {store,customers,management,id:page.id};
}

test('payment resolution protects owner, lifecycle and entitlement until the lock is cleared',async()=>{
  const operations=[
    ['owner',(c,revision)=>c.customers.assign(c.id,{email:'bob@gmail.com',revision},admin),record=>assert.equal(record.ownerEmail,'bob@gmail.com')],
    ['disable',(c,revision)=>c.management.state(c.id,{state:'disabled',revision},admin),record=>assert.equal(record.lifecycle.state,'disabled')],
    ['delete',(c,revision)=>c.management.state(c.id,{state:'deleted',confirmName:profile.name,revision},admin),record=>assert.equal(record.lifecycle.state,'deleted')],
    ['subscription',(c,revision)=>c.management.subscription(c.id,{action:'extend',note:'Approved complimentary year',revision},admin),record=>assert.equal(record.subscription.expiresAt,'2027-10-25T08:00:00.000Z')],
  ];
  for(const [label,operation,verify] of operations){
    const c=await setup(),locked=await c.store.getVersion(c.id);
    await assert.rejects(operation(c,locked.revision),error=>error.status===409&&/bayaran/i.test(error.message),label+' must reject during resolution');
    assert.deepEqual(await c.store.getVersion(c.id),locked,label+' must not change the page');
    await c.store.update(c.id,{...locked.record,paymentResolution:null},locked.revision);
    const unlocked=await c.store.getVersion(c.id);
    await operation(c,unlocked.revision);
    verify(await c.store.get(c.id));
  }
});

test('legacy manual payment submissions and decisions cannot mutate entitlement during resolution',async()=>{
  const c=await setup(),locked=await c.store.getVersion(c.id);
  const request=revision=>c.management.request(c.id,{package:'bundle',reference:'BANK-LOCK-TEST',paidDate:'2026-10-25',amountCents:10000,revision},admin);
  await assert.rejects(request(locked.revision),error=>error.status===409&&/bayaran/i.test(error.message));
  assert.deepEqual(await c.store.getVersion(c.id),locked);
  await c.store.update(c.id,{...locked.record,paymentResolution:null},locked.revision);
  assert.equal((await request((await c.store.getVersion(c.id)).revision)).renewal.status,'pending');
  for(const decision of ['approve','reject']){
    const ctx=await setup({renewal:{id:'legacy-manual',status:'pending',months:12,paidDate:'2026-10-25',reference:'BANK-OLD',amountCents:10000}}),before=await ctx.store.getVersion(ctx.id);
    const decide=revision=>ctx.management.decide(ctx.id,{requestId:'legacy-manual',decision,confirmBank:true,revision},admin);
    await assert.rejects(decide(before.revision),error=>error.status===409&&/bayaran/i.test(error.message));
    assert.deepEqual(await ctx.store.getVersion(ctx.id),before);
    await ctx.store.update(ctx.id,{...before.record,paymentResolution:null},before.revision);
    assert.equal((await decide((await ctx.store.getVersion(ctx.id)).revision)).renewal.status,decision==='approve'?'approved':'rejected');
  }
});
