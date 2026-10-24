import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createToyyibCheckout,createToyyibProvider,amountCents} from './toyyibpay.mjs';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createManagementService} from './management.mjs';
const admin={role:'admin',email:'admin@gmail.com'},alice={role:'user',email:'alice@gmail.com'},bob={role:'user',email:'bob@gmail.com'};
const secret='test-server-secret',category='testcat',now=()=>Date.parse('2026-10-24T08:00:00Z');
const profile={v:1,name:'Test checkout',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
async function setup(){
  const store=createMemoryLinkStore(),customers=createCustomerService({store,now,newSubscription:{plan:'annual',expiresAt:null}}),bills=new Map();let calls=0;
  const provider={mode:'live',host:'https://toyyibpay.com',async create(order){const code='bill'+String(bills.size+1).padStart(5,'0');bills.set(code,{order,transactions:[]});return code;},async transactions(code){calls++;return bills.get(code).transactions;},async cancel(){}};
  const gateway=createToyyibCheckout({store,provider,secretKey:secret,categoryCode:category,enabled:true,accountVerified:true,now});
  const page=await customers.register({url,email:alice.email},admin);
  return {store,customers,bills,provider,gateway,page,calls:()=>calls};
}
const begin=ctx=>ctx.gateway.create(ctx.page.id,{package:'bundle',revision:ctx.page.revision},alice);
function paid(ctx,checkout,overrides={}){const b=ctx.bills.get(checkout.billCode);b.transactions=[{billpaymentStatus:'1',billExternalReferenceNo:checkout.id,billpaymentAmount:(checkout.amountCents/100).toFixed(2),billpaymentInvoiceNo:'TP'+checkout.id,...overrides}];}
function callback(order,overrides={}){const data={order_id:order.id,billcode:order.billCode,amount:(order.amountCents/100).toFixed(2),status:'1',refno:'TP'+order.id,...overrides};data.hash=createHash('md5').update(secret+data.status+data.order_id+data.refno+'ok').digest('hex');return data;}

test('ToyyibPay stays closed until configured, explicitly enabled and live account verified',async()=>{
  const ctx=await setup();for(const options of [{enabled:false,accountVerified:true},{enabled:true,accountVerified:false}]){
    const service=createToyyibCheckout({store:ctx.store,provider:ctx.provider,secretKey:secret,categoryCode:category,...options});
    assert.equal(service.config().enabled,false);assert.ok(!JSON.stringify(service.config()).includes(secret));
    await assert.rejects(service.create(ctx.page.id,{package:'bundle',revision:ctx.page.revision},alice),e=>e.status===503);
    await assert.rejects(service.callback({}),e=>e.status===503);
  }
  assert.equal(ctx.bills.size,0);assert.equal((await ctx.store.get(ctx.page.id)).checkout,undefined);
});

test('provider creates fixed-price bills, merchant-paid fees, exact trusted URLs and no payer private details',async()=>{
  const requests=[];const provider=createToyyibProvider({secretKey:secret,categoryCode:category,fetcher:async(url,options)=>{requests.push({url,fields:Object.fromEntries(options.body)});return new Response(JSON.stringify([{BillCode:'abcd1234'}]));}});
  const code=await provider.create({id:'ST'+'a'.repeat(24),quote:{package:'bundle',amountCents:40000}},{callbackURL:'https://api.example/callback',returnURL:'https://tap.imai.my/edit/',duitNowQR:true});
  assert.equal(code,'abcd1234');const request=requests[0];assert.equal(request.url,'https://toyyibpay.com/index.php/api/createBill');
  assert.equal(request.fields.billAmount,'40000');assert.equal(request.fields.billPriceSetting,'1');assert.equal(request.fields.chargeDuitNowQR,'0');assert.equal(request.fields.billChargeToCustomer,'');assert.equal(request.fields.billPayorInfo,'0');assert.equal('billEmail' in request.fields,false);
  for(const data of [{status:'error',msg:'bad parameter'},'[KEY-DID-NOT-EXIST]',[]]){
    const bad=createToyyibProvider({secretKey:secret,categoryCode:category,fetcher:async()=>new Response(JSON.stringify(data))});
    await assert.rejects(bad.create({id:'x',quote:{package:'nfc',amountCents:7000}},{}),e=>e.status===502);
  }
  const bad=createToyyibProvider({secretKey:secret,categoryCode:category,fetcher:async()=>new Response('not JSON',{status:403})});await assert.rejects(bad.transactions('abcd1234'),e=>e.status===502);
  for(const bad of ['1e2','-10','1.001','NaN',''])assert.throws(()=>amountCents(bad));assert.equal(amountCents('100.00'),10000);
});

test('checkout uses server package prices, owner authorization, durable order and a single pending bill',async()=>{
  const ctx=await setup();await assert.rejects(ctx.gateway.create(ctx.page.id,{package:'bundle',revision:ctx.page.revision},bob),e=>e.status===404);
  await assert.rejects(ctx.gateway.create(ctx.page.id,{package:'bundle',amountCents:1,revision:ctx.page.revision},alice),e=>e.status===400);
  await assert.rejects(ctx.gateway.create(ctx.page.id,{package:'bundle',stickerQty:20,expectedAmountCents:10000,revision:ctx.page.revision},alice),e=>e.status===409);assert.equal(ctx.bills.size,0);
  const checkout=await ctx.gateway.create(ctx.page.id,{package:'bundle',stickerQty:20,expectedAmountCents:40000,revision:ctx.page.revision},alice);assert.equal(checkout.amountCents,40000);assert.equal(checkout.paymentUrl,'https://toyyibpay.com/'+checkout.billCode);
  assert.equal((await ctx.store.getGatewayOrder(checkout.id)).record.ownerKey.length,43);
  assert.equal((await ctx.gateway.create(ctx.page.id,{package:'bundle',stickerQty:20,revision:'stale'},alice)).id,checkout.id);assert.equal(ctx.bills.size,1);
  await assert.rejects(ctx.gateway.create(ctx.page.id,{package:'nfc',revision:'stale'},alice),e=>e.status===409);
  const manual=createManagementService({store:ctx.store,enabled:true,qrPayload:'test',now});const current=await ctx.customers.get(ctx.page.id,alice);
  await assert.rejects(manual.request(ctx.page.id,{package:'bundle',paidDate:'2026-10-24',reference:'BANK123',amountCents:10000,revision:current.revision},alice),e=>e.status===409);
  await assert.rejects(ctx.gateway.status(checkout.id,bob),e=>e.status===404);
});

test('signed callback still requires independently verified matching amount and order; URL status never grants access',async()=>{
  const ctx=await setup(),checkout=await begin(ctx);
  await assert.rejects(ctx.gateway.callback({...callback(checkout),hash:'0'.repeat(32)}),e=>e.status===403);assert.equal(ctx.calls(),0);
  await assert.rejects(ctx.gateway.callback(callback(checkout,{billcode:'other123'})),e=>e.status===403);
  await assert.rejects(ctx.gateway.callback(callback(checkout,{amount:'1.00'})),e=>e.status===403);
  await ctx.gateway.callback(callback(checkout));assert.equal((await ctx.customers.get(ctx.page.id,alice)).state,'pending');
  paid(ctx,checkout,{billpaymentAmount:'1.00'});await assert.rejects(ctx.gateway.callback(callback(checkout)),e=>e.status===409);
  paid(ctx,checkout,{billExternalReferenceNo:'another-order'});await assert.rejects(ctx.gateway.callback(callback(checkout)),e=>e.status===409);
  assert.equal((await ctx.store.get(ctx.page.id)).subscription.expiresAt,null);
});

test('concurrent callbacks and retries activate annual QR exactly once, including replay after another renew',async()=>{
  const ctx=await setup(),checkout=await begin(ctx);paid(ctx,checkout);
  await Promise.all([ctx.gateway.callback(callback(checkout)),ctx.gateway.callback(callback(checkout))]);
  let page=await ctx.customers.get(ctx.page.id,alice);assert.equal(page.subscription.expiresAt,'2027-10-24T08:00:00.000Z');assert.equal(page.renewal.provider,'toyyibpay');assert.equal(page.url,ctx.page.url);
  const renew=await ctx.gateway.create(page.id,{package:'renew',revision:page.revision},alice);paid(ctx,renew);await ctx.gateway.callback(callback(renew));
  await ctx.gateway.callback(callback(checkout));page=await ctx.customers.get(ctx.page.id,alice);assert.equal(page.subscription.expiresAt,'2028-10-24T08:00:00.000Z');assert.equal(Object.keys((await ctx.store.get(page.id)).gatewayApplied).length,2);
  const publicPage=await createShortLinks({store:ctx.store,secret:'s'.repeat(32),now}).resolve(page.id);assert.deepEqual(Object.keys(publicPage),['url']);assert.ok(!JSON.stringify(publicPage).includes(checkout.id));
});

test('crash after granting the subscription but before saving order success never grants a second year',async()=>{
  const ctx=await setup(),checkout=await begin(ctx);paid(ctx,checkout);
  const update=ctx.store.updateGatewayOrder;let failOnce=true;ctx.store.updateGatewayOrder=async(id,record,revision)=>{if(record.status==='paid'&&failOnce){failOnce=false;throw Error('simulated storage failure');}return update(id,record,revision);};
  await assert.rejects(ctx.gateway.callback(callback(checkout)),/simulated storage failure/);await ctx.gateway.callback(callback(checkout));
  assert.equal((await ctx.customers.get(ctx.page.id,alice)).subscription.expiresAt,'2027-10-24T08:00:00.000Z');
});

test('reassignment or deleted page leaves a paid order for review instead of activating or leaking to another owner',async()=>{
  for(const scenario of ['reassign','delete']){
    const ctx=await setup(),checkout=await begin(ctx);let page=await ctx.customers.get(ctx.page.id,alice);
    if(scenario==='reassign'){await ctx.customers.assign(page.id,{email:bob.email,revision:page.revision},admin);assert.equal((await ctx.customers.get(page.id,bob)).checkout,null);await assert.rejects(ctx.gateway.create(page.id,{package:'bundle',revision:page.revision},bob),e=>e.status===409);await assert.rejects(ctx.gateway.status(checkout.id,bob),e=>e.status===404);}
    else await createManagementService({store:ctx.store,now}).state(page.id,{state:'deleted',confirmName:profile.name,revision:page.revision},admin);
    paid(ctx,checkout);await ctx.gateway.callback(callback(checkout));assert.equal((await ctx.store.getGatewayOrder(checkout.id)).record.status,'review');assert.equal((await ctx.store.get(page.id)).subscription.expiresAt,null);
  }
});

test('NFC-only does not grant hosted QR access, and disable remains effective after automatic payment',async()=>{
  const ctx=await setup();const checkout=await ctx.gateway.create(ctx.page.id,{package:'nfc',revision:ctx.page.revision},alice);paid(ctx,checkout);await ctx.gateway.callback(callback(checkout));
  const page=await ctx.customers.get(ctx.page.id,alice);assert.equal(page.subscription.plan,'nfc_only');assert.equal(page.state,'nfc_only');
  const other=await setup(),bill=await begin(other);const current=await other.customers.get(other.page.id,alice);await createManagementService({store:other.store,now}).state(current.id,{state:'disabled',revision:current.revision},admin);paid(other,bill);await other.gateway.callback(callback(bill));assert.equal((await other.customers.get(current.id,alice)).state,'disabled');
});

test('cancel verifies provider state; creation errors permit safe retry without charging or activating',async()=>{
  const ctx=await setup(),checkout=await begin(ctx);ctx.provider.cancel=async()=>{throw Object.assign(Error('bank pending'),{status:409});};
  await assert.rejects(ctx.gateway.cancel(checkout.id,alice),e=>e.status===409);assert.notEqual((await ctx.store.getGatewayOrder(checkout.id)).record.status,'cancelled');
  ctx.provider.cancel=async()=>{};await ctx.gateway.cancel(checkout.id,alice);assert.equal((await ctx.store.getGatewayOrder(checkout.id)).record.status,'cancelled');
  paid(ctx,checkout);await ctx.gateway.callback(callback(checkout));assert.equal((await ctx.store.getGatewayOrder(checkout.id)).record.status,'review');assert.equal((await ctx.store.get(ctx.page.id)).subscription.expiresAt,null);
  const other=await setup();other.provider.create=async()=>{throw Error('provider failure');};await assert.rejects(begin(other),/provider failure/);assert.equal((await other.store.get(other.page.id)).checkout.status,'creation_failed');
});


test('owner reassignment during provider bill creation does not return checkout to a revoked owner',async()=>{
  const ctx=await setup();ctx.provider.create=async()=>{const current=await ctx.store.getVersion(ctx.page.id);await ctx.customers.assign(ctx.page.id,{email:bob.email,revision:current.revision},admin);return 'OLDOWNERBILL';};
  await assert.rejects(begin(ctx),e=>e.status===404);
  const current=await ctx.customers.get(ctx.page.id,bob);assert.equal(current.checkout,null);
});


test('explicit settlement-hold acceptance permits live checkout without falsely marking the merchant verified',async()=>{
  const ctx=await setup();const service=createToyyibCheckout({store:ctx.store,provider:ctx.provider,secretKey:secret,categoryCode:category,enabled:true,accountVerified:false,settlementHoldAccepted:true,now});
  assert.equal(service.config().enabled,true);assert.equal(service.config().settlementHold,true);
  const checkout=await service.create(ctx.page.id,{package:'bundle',revision:ctx.page.revision,expectedAmountCents:10000},alice);
  assert.equal(checkout.paymentUrl,'https://toyyibpay.com/'+checkout.billCode);assert.equal(checkout.amountCents,10000);
});
