import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createMemoryLinkStore,createCloudLinkStore} from './short-links.mjs';
import {createAdminService} from './admin.mjs';
import {createCustomerService} from './customers.mjs';
import {createOrdersService} from './orders.mjs';
import {createPageHistory} from './page-history.mjs';
import {createAccountRoutes} from './account-routes.mjs';
import {ownerKey} from './identity.mjs';
const admin={email:'admin@gmail.com',role:'admin'},alice={email:'alice@gmail.com',role:'user'};
const profile={v:1,name:'Business operations',google:'https://search.google.com/local/writereview?placeid=ChIJTestOperations'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
async function setup(){const store=createMemoryLinkStore(),customers=createCustomerService({store}),page=await customers.register({url,email:alice.email},admin);return {store,customers,page,service:createAdminService({store}),orders:createOrdersService({store})};}
const seed=(c,id,changes={})=>c.store.createGatewayOrder(id,{id,pageId:c.page.id,ownerKey:ownerKey(alice.email),status:'paid',mode:'live',quote:{amountCents:10000,includesPhysical:false,items:[]},createdAt:'2026-10-25T00:00:00Z',...changes});
test('global bell includes older gateway orders across pages, distinguishes work categories and removes acknowledged digital orders',async()=>{
 const c=await setup();
 for(let i=0;i<28;i++)await seed(c,'ST'+i.toString(16).padStart(24,'0'),i===27?{status:'review'}:{});
 const alerts=await c.service.pendingPayments();assert.equal(alerts.count,28);assert.equal(alerts.categories.payment_review,1);assert.equal(alerts.categories.new_order,27);
 assert.ok(!JSON.stringify(alerts).includes('ownerKey'));assert.ok(!JSON.stringify(alerts).includes(alice.email));
 const id='ST'+'0'.repeat(24),item=await c.orders.get(c.page.id,id,admin);
 await assert.rejects(c.orders.acknowledge(c.page.id,id,{revision:item.revision},alice),e=>e.status===403);
 await c.orders.acknowledge(c.page.id,id,{revision:item.revision},admin);c.service.invalidatePending();
 assert.equal((await c.service.pendingPayments()).count,27);
 const physical='ST'+'f'.repeat(24);await seed(c,physical,{quote:{amountCents:13000,includesPhysical:true,items:[]}});
 let order=await c.orders.get(c.page.id,physical,admin);await c.orders.acknowledge(c.page.id,physical,{revision:order.revision},admin);c.service.invalidatePending();
 assert.equal((await c.service.pendingPayments()).items.find(item=>item.orderId===physical).category,'awaiting_address');
 order=await c.orders.get(c.page.id,physical,admin);
 await c.orders.address(c.page.id,physical,{revision:order.revision,address:{name:'Owner',phone:'0122258950',line1:'Jalan Ujian',postcode:'40460',city:'Shah Alam',state:'Selangor'}},alice);c.service.invalidatePending();
 assert.equal((await c.service.pendingPayments()).items.find(item=>item.orderId===physical).category,'fulfillment');
});
test('private gateway/history cloud listing pins generations and retains cursor and namespace boundaries',async()=>{
 const calls=[],id='abcdefghijklmnop',order='ST'+'a'.repeat(24);
 const store=createCloudLinkStore({bucket:'test-private-bucket',getToken:async()=> 'test',fetcher:async(value,options)=>{
  const u=new URL(value);calls.push(u);let data;
  if(u.searchParams.get('prefix')==='checkout/')data={items:[{name:'checkout/'+order+'.json',generation:'71'},{name:'checkout/../../other.json',generation:'1'}],nextPageToken:'next'};
  else if(u.searchParams.get('prefix')==='history/'+id+'/')data={items:[{name:'history/'+id+'/42.json',generation:'72'},{name:'history/foreign/1.json',generation:'1'}]};
  else data={v:1,name:'private content'};
  return new Response(JSON.stringify(data));
 }});
 const page=await store.listGatewayOrders('prior');assert.equal(page.items.length,1);assert.equal(page.cursor,'next');assert.equal(calls[0].searchParams.get('pageToken'),'prior');assert.equal(calls[1].searchParams.get('generation'),'71');
 const history=await store.listHistory(id);assert.equal(history.items[0].revision,'42');assert.equal(calls.at(-1).searchParams.get('generation'),'72');
 await assert.rejects(async()=>store.getHistory('../bad','42'));await assert.rejects(async()=>store.getHistory(id,'../42'));
});
test('HTTP operations reject customers, anonymous callers and wrong origins before admin resolution/history writes',async t=>{
 const c=await setup(),id='ST'+'b'.repeat(24);await seed(c,id);
 let resolved=0;const auth=async value=>{const actor={admin,alice}[value?.replace('Bearer ','')];if(!actor)throw Object.assign(Error('Denied'),{status:401});return actor;};
 const reply=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data));};
 const routes=createAccountRoutes({adminAuth:auth,userAuth:auth,admin:c.service,customers:c.customers,orders:c.orders,history:createPageHistory({store:c.store}),gateway:{resolve:async()=>{resolved++;return {resolved:true};}},reply,body:async req=>{let s='';for await(const p of req)s+=p;return JSON.parse(s);}});
 const server=http.createServer(async(req,res)=>{try{await routes(req,res,{path:new URL(req.url,'https://tap.imai.my').pathname,origin:req.headers.origin==='https://tap.imai.my'?req.headers.origin:null});}catch(e){reply(res,e.status||500,{error:e.message});}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());
 const call=(path,actor,method='GET',data,origin='https://tap.imai.my')=>fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{Origin:origin,...(actor?{Authorization:'Bearer '+actor}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
 const path='/api/admin/checkout/'+id+'/resolve';
 assert.equal((await call(path,null,'POST',{})).status,401);
 // A real admin verifier rejects customer identities; route also prevents user namespace spoofing.
 assert.equal((await call(path.replace('/admin/','/user/'),'alice','POST',{})).status,403);
 assert.equal((await call(path,'admin','POST',{},'https://hostile.example')).status,403);assert.equal(resolved,0);
 assert.equal((await call(path,'admin','POST',{})).status,200);assert.equal(resolved,1);
 assert.equal((await call('/api/user/links/'+c.page.id+'/history','alice')).status,403);
 const history=await call('/api/admin/links/'+c.page.id+'/history','admin');assert.equal(history.status,200);
 const order=await c.orders.get(c.page.id,id,admin);
 assert.equal((await call('/api/user/links/'+c.page.id+'/orders/'+id+'/acknowledge','alice','PUT',{revision:order.revision})).status,403);
});
