import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createOrdersService} from './orders.mjs';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createAdminService} from './admin.mjs';
import {createToyyibCheckout} from './toyyibpay.mjs';
import {createAccountRoutes} from './account-routes.mjs';
import {ownerKey} from './identity.mjs';
const admin={role:'admin',email:'admin@gmail.com'},alice={role:'user',email:'alice@gmail.com'},bob={role:'user',email:'bob@gmail.com'};
const profile={v:1,name:'Kedai Ujian',google:'https://search.google.com/local/writereview?placeid=ChIJTest123'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
const address={name:'Penerima Ujian',phone:'012-2258950',line1:'No 1 Jalan Ujian',line2:'Taman Ujian',postcode:'40460',city:'Shah Alam',state:'Selangor',notes:'Telefon sebelum sampai'};
async function setup(){const store=createMemoryLinkStore(),customers=createCustomerService({store}),orders=createOrdersService({store});const page=await customers.register({url,email:alice.email},admin);return {store,customers,orders,page};}
async function seed(ctx,{status='paid',physical=true,id='ST'+ 'a'.repeat(24),legacy=false}={}){
 const record={id,pageId:ctx.page.id,ownerKey:ownerKey(alice.email),status,mode:'live',invoice:'TP123',createdAt:'2026-10-25T00:00:00Z',quote:{amountCents:physical?10000:3000,includesPhysical:physical,items:[{id:physical?'bundle':'renew',name:physical?'NFC + QR':'Renew QR',quantity:1,unitCents:physical?10000:3000,totalCents:physical?10000:3000}]}};
 await ctx.store.createGatewayOrder(id,record);const previous=await ctx.store.getVersion(ctx.page.id);await ctx.store.update(ctx.page.id,{...previous.record,...(legacy?{gatewayApplied:{[id]:'TP123'}}:{checkoutIds:[...(previous.record.checkoutIds||[]),id]})},previous.revision);return ctx.orders.get(ctx.page.id,id,alice);
}
test('paid physical orders accept address, admin progresses shipment, owner sees tracking and cannot change dispatched address',async()=>{
 const c=await setup();let order=await seed(c);assert.equal(order.fulfillmentState,'awaiting_address');
 order=await c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice);assert.equal(order.shipping.phone,'60122258950');assert.equal(order.fulfillmentState,'received');
 order=await c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'preparing'},admin);
 order=await c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'shipped',courier:'J&T Express',trackingNumber:'TEST123',trackingURL:'https://www.jtexpress.my/'},admin);
 assert.equal((await c.orders.get(c.page.id,order.id,alice)).fulfillment.trackingNumber,'TEST123');
 await assert.rejects(c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice),e=>e.status===409);
 await assert.rejects(c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'preparing'},admin),e=>e.status===409);
 order=await c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'completed',courier:'J&T Express',trackingNumber:'TEST123'},admin);assert.equal(order.fulfillmentState,'completed');assert.equal(order.fulfillment.timeline.length,4);
 const publicPage=await createShortLinks({store:c.store,secret:'x'.repeat(32)}).resolve(c.page.id);assert.ok(!JSON.stringify(publicPage).includes(address.line1));
});
test('unpaid and digital renewals never accept addresses; clients cannot forge payment or shipping state',async()=>{
 const c=await setup();for(const [i,opts] of [{status:'pending'},{status:'failed'},{physical:false}].entries()){
  const order=await seed(c,{...opts,id:'ST'+String(i).repeat(24)});await assert.rejects(c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice),e=>e.status===409);
 }
 let order=await seed(c);await assert.rejects(c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'completed'},alice),e=>e.status===403);
 await assert.rejects(c.orders.address(c.page.id,order.id,{revision:order.revision,address,status:'paid'},alice),e=>e.status===400);
 for(const changes of [{postcode:'123'},{phone:'bad'},{state:'Wrong'},{name:''},{country:'OTHER'}])await assert.rejects(c.orders.address(c.page.id,order.id,{revision:order.revision,address:{...address,...changes}},alice),e=>e.status===400);
 await assert.rejects(c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'shipped',courier:'X',trackingNumber:'1'},admin),e=>e.status===409);
 order=await c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice);order=await c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'preparing'},admin);
 for(const trackingURL of ['javascript:alert(1)','https://user:pass@example.com/','http://example.com/'])await assert.rejects(c.orders.fulfill(c.page.id,order.id,{revision:order.revision,state:'shipped',courier:'X',trackingNumber:'1',trackingURL},admin),e=>e.status===400);
});
test('known order IDs and ownership reassignment never disclose previous customer addresses',async()=>{
 const c=await setup();let order=await seed(c);order=await c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice);
 for(const action of [()=>c.orders.get(c.page.id,order.id,bob),()=>c.orders.list(c.page.id,bob),()=>c.orders.address(c.page.id,order.id,{revision:order.revision,address},bob)])await assert.rejects(action,e=>e.status===404);
 const page=await c.store.getVersion(c.page.id);await c.customers.assign(c.page.id,{email:bob.email,revision:page.revision},admin);
 assert.deepEqual((await c.orders.list(c.page.id,bob)).items,[]);await assert.rejects(c.orders.get(c.page.id,order.id,bob),e=>e.status===404);await assert.rejects(c.orders.get(c.page.id,order.id,alice),e=>e.status===404);
 assert.equal((await c.orders.get(c.page.id,order.id,admin)).shipping.line1,address.line1);
});
test('stale order revisions cannot overwrite a new address; legacy paid orders remain discoverable',async()=>{
 const c=await setup();const order=await seed(c,{legacy:true});assert.equal((await c.orders.list(c.page.id,alice)).items[0].id,order.id);
 const current=await c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice);
 await assert.rejects(c.orders.address(c.page.id,order.id,{revision:order.revision,address:{...address,name:'Stale'}},alice),e=>e.status===409);assert.equal((await c.orders.get(c.page.id,order.id,alice)).revision,current.revision);
 await assert.rejects(c.orders.list(c.page.id,alice,'../'),e=>e.status===400);
});
test('multiple ToyyibPay checkouts retain order history without duplicating or changing fulfillment on payment refresh',async()=>{
 const c=await setup();const bills=new Map();const provider={mode:'live',host:'https://toyyibpay.com',async create(order){const code='bill'+bills.size;bills.set(code,order);return code;},async transactions(code){const o=bills.get(code);return [{billpaymentStatus:'1',billExternalReferenceNo:o.id,billpaymentAmount:(o.quote.amountCents/100).toFixed(2),billpaymentInvoiceNo:'TP'+o.id}];}};
 const gateway=createToyyibCheckout({store:c.store,provider,secretKey:'test',categoryCode:'test',enabled:true,accountVerified:true});
 const first=await gateway.create(c.page.id,{package:'bundle',revision:c.page.revision},alice);await gateway.status(first.id,alice);
 let order=await c.orders.get(c.page.id,first.id,alice);order=await c.orders.address(c.page.id,order.id,{revision:order.revision,address},alice);
 const page=await c.store.getVersion(c.page.id);const second=await gateway.create(c.page.id,{package:'renew',revision:page.revision},alice);await gateway.status(second.id,alice);await gateway.status(first.id,alice);
 assert.deepEqual((await c.orders.list(c.page.id,alice)).items.map(x=>x.id),[second.id,first.id]);assert.equal((await c.orders.get(c.page.id,first.id,alice)).shipping.line1,address.line1);
});
test('order HTTP routes enforce role, ownership and JSON boundaries',async t=>{
 const c=await setup(),order=await seed(c);const reply=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data));};const auth=async h=>{const actor={admin,alice,bob}[h?.replace('Bearer ','')];if(!actor)throw Object.assign(Error('Denied'),{status:401});return actor;};
 const routes=createAccountRoutes({adminAuth:auth,userAuth:auth,admin:createAdminService({store:c.store}),customers:c.customers,orders:c.orders,reply,body:async req=>{let s='';for await(const part of req)s+=part;return JSON.parse(s);}});
 const server=http.createServer(async(req,res)=>{try{await routes(req,res,{path:new URL(req.url,'https://tap.imai.my').pathname,origin:'https://tap.imai.my'});}catch(e){reply(res,e.status||500,{error:e.message});}});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 const path='http://127.0.0.1:'+server.address().port+'/api/user/links/'+c.page.id+'/orders/'+order.id;
 assert.equal((await fetch(path)).status,401);assert.equal((await fetch(path,{headers:{Authorization:'Bearer bob'}})).status,404);
 assert.equal((await fetch(path+'/fulfillment',{method:'PUT',headers:{Authorization:'Bearer alice','Content-Type':'application/json'},body:'{}'})).status,403);
 const response=await fetch(path+'/address',{method:'PUT',headers:{Authorization:'Bearer alice','Content-Type':'application/json'},body:JSON.stringify({revision:order.revision,address})});assert.equal(response.status,200);assert.equal((await response.json()).shipping.name,address.name);
});
