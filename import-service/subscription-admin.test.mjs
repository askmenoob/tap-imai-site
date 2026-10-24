import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createManagementService} from './management.mjs';
const actor={role:'admin',email:'owner@gmail.com'},user={role:'user',email:'user@gmail.com'};
const profile={v:1,name:'Langganan Ujian',google:'https://search.google.com/local/writereview?placeid=ChIJTest123'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
async function setup(){let time=Date.parse('2028-02-29T08:00:00Z');const now=()=>time,store=createMemoryLinkStore(),customers=createCustomerService({store,now,newSubscription:{plan:'annual',expiresAt:null}}),management=createManagementService({store,now,enabled:false,manualEnabled:false}),page=await customers.register({url,email:user.email},actor);return {store,customers,management,page,now,setTime:value=>time=Date.parse(value)};}
const grant=page=>({action:'extend',note:'Langganan ihsan diluluskan pemilik',revision:page.revision});

test('admin grants an annual page without payment, preserves QR, archives changes and keeps internal notes private',async()=>{
 const c=await setup();let page=await c.management.subscription(c.page.id,grant(c.page),actor);
 assert.equal(page.state,'active');assert.equal(page.subscription.expiresAt,'2029-02-28T08:00:00.000Z');assert.equal(page.subscription.source,'admin');assert.ok(page.subscription.lastGrantId);assert.equal(page.subscription.lastPaymentId,undefined);
 assert.equal(page.url,c.page.url);assert.equal(page.renewal,null);assert.equal(page.checkout,null);assert.equal(page.subscriptionAdjustment.changedBy,actor.email);
 const owner=await c.customers.get(page.id,user);assert.equal(owner.subscriptionAdjustment,undefined);assert.ok(!JSON.stringify(owner).includes('ihsan'));assert.ok(!JSON.stringify(owner).includes(actor.email));
 const links=createShortLinks({store:c.store,now:c.now,secret:'s'.repeat(32)});assert.equal((await links.resolve(page.id)).url,url);assert.ok(!JSON.stringify(await links.resolve(page.id)).includes('lastGrantId'));
 await assert.rejects(c.management.subscription(page.id,grant(c.page),actor),e=>e.status===409);
 page=await c.management.subscription(page.id,grant(page),actor);assert.equal(page.subscription.expiresAt,'2030-02-28T08:00:00.000Z');
 page=await c.management.subscription(page.id,{action:'set-date',expiresDate:'2030-06-30',note:'Pelarasan tarikh tamat',revision:page.revision},actor);assert.equal(page.subscription.expiresAt,'2030-06-30T15:59:59.999Z');
 assert.equal(page.subscriptionAdjustment.previousExpiresAt,'2030-02-28T08:00:00.000Z');c.setTime('2030-06-30T16:00:00Z');await assert.rejects(links.resolve(page.id),e=>e.status===403);
});

test('admin adjustments enforce roles, fields, real dates, current revision, ownership registration and deleted state',async()=>{
 const c=await setup(),p=c.page;
 await assert.rejects(c.management.subscription(p.id,grant(p),user),e=>e.status===403);
 for(const data of [{...grant(p),role:'admin'},{...grant(p),note:''},{...grant(p),note:'x'.repeat(201)},{...grant(p),action:'forever'},{...grant(p),expiresDate:'2029-02-28'},...['2029-02-29','2028-02-28','not-date'].map(expiresDate=>({action:'set-date',expiresDate,note:'Bad date',revision:p.revision}))])await assert.rejects(c.management.subscription(p.id,data,actor),e=>e.status===400);
 assert.equal((await c.store.getVersion(p.id)).revision,p.revision);
 const reassigned=await c.customers.assign(p.id,{email:'new@gmail.com',revision:p.revision},actor);await assert.rejects(c.management.subscription(p.id,grant(p),actor),e=>e.status===409);
 const disabled=await c.management.state(p.id,{state:'disabled',revision:reassigned.revision},actor),granted=await c.management.subscription(p.id,grant(disabled),actor);assert.equal(granted.state,'disabled');
 const deleted=await c.management.state(p.id,{state:'deleted',confirmName:profile.name,revision:granted.revision},actor);await assert.rejects(c.management.subscription(p.id,grant(deleted),actor),e=>e.status===409);
 const before=await c.store.getVersion(p.id);await c.store.update(p.id,{...before.record,lifecycle:{state:'active'},ownerEmail:null},before.revision);const unowned=await c.store.getVersion(p.id);await assert.rejects(c.management.subscription(p.id,{...grant(p),revision:unowned.revision},actor),e=>e.status===409);
});

test('open payment review or gateway bill blocks grants; cancelled bills allow them without editing payment state',async()=>{
 for(const extra of [{renewal:{status:'pending'}},...['creating','pending','failed','review'].map(status=>({checkout:{status}}))]){
  const c=await setup(),before=await c.store.getVersion(c.page.id);await c.store.update(c.page.id,{...before.record,...extra},before.revision);const current=await c.store.getVersion(c.page.id);await assert.rejects(c.management.subscription(c.page.id,{...grant(c.page),revision:current.revision},actor),e=>e.status===409);
 }
 const c=await setup(),before=await c.store.getVersion(c.page.id);await c.store.update(c.page.id,{...before.record,checkout:{id:'old',status:'cancelled'}},before.revision);const current=await c.store.getVersion(c.page.id);const granted=await c.management.subscription(c.page.id,{...grant(c.page),revision:current.revision},actor);assert.equal(granted.state,'active');assert.equal((await c.store.get(c.page.id)).checkout.status,'cancelled');
});
