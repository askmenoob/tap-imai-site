import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore,createCloudLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createAdminService} from './admin.mjs';
import {createManagementService} from './management.mjs';
import {createPageHistory} from './page-history.mjs';
const admin={role:'admin',email:'owner@gmail.com'},user={role:'user',email:'customer@gmail.com'};
const profile={v:1,name:'Permanent QR test',google:'https://search.google.com/local/writereview?placeid=TEST'};
const url='https://tap.imai.my/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url');
async function setup(){const store=createMemoryLinkStore(),customers=createCustomerService({store}),management=createManagementService({store});const page=await customers.register({url,email:user.email},admin);const deleted=await management.state(page.id,{state:'deleted',confirmName:profile.name,revision:page.revision},admin);return {store,customers,management,page:deleted,data:{revision:deleted.revision,confirmName:profile.name,confirmId:page.id,confirmPermanent:true}};}
test('permanent QR deletion removes the primary destination, denies restore and reserves the old ID forever',async()=>{
 const {store,customers,management,page,data}=await setup();
 const result=await management.purge(page.id,data,admin);assert.deepEqual(result,{id:page.id,permanentlyDeleted:true});
 const marker=store.records.get(page.id).record;assert.equal(marker.permanentlyDeleted,true);assert.equal(marker.url,undefined);assert.equal(marker.ownerEmail,undefined);
 assert.equal(await store.get(page.id),null);assert.equal(await store.getVersion(page.id),null);
 assert.equal((await createAdminService({store}).list()).items.length,0);assert.equal((await customers.list(user)).items.length,0);
 await assert.rejects(createShortLinks({store,secret:'s'.repeat(32)}).resolve(page.id),e=>e.status===404);
 await assert.rejects(management.state(page.id,{state:'disabled',revision:data.revision},admin),e=>e.status===404);
 await assert.rejects(createPageHistory({store}).list(page.id,admin),e=>e.status===404);
 assert.equal(await store.update(page.id,{v:1,url},data.revision),false);assert.equal(await store.create(page.id,{v:1,url}),false);
});
test('only the super admin can delete after soft deletion and all exact confirmations; stale editors fail closed',async()=>{
 const {store,management,page,data}=await setup();
 await assert.rejects(management.purge(page.id,data,user),e=>e.status===403);
 for(const change of [{confirmName:'wrong'},{confirmId:'wrong'},{confirmPermanent:false},{extra:true},{revision:'0'}])await assert.rejects(management.purge(page.id,{...data,...change},admin),e=>[400,409].includes(e.status));
 const updated=await management.state(page.id,{state:'disabled',revision:data.revision},admin);
 await assert.rejects(management.purge(page.id,{...data,revision:updated.revision},admin),e=>e.status===409);
 assert.ok(await store.get(page.id));
});
test('open financial actions and unfinished physical deliveries block deletion; completed order records survive',async()=>{
 for(const changes of [{paymentResolution:{orderId:'test'}},{renewal:{status:'pending'}},{checkout:{status:'review'}}]){
  const {store,management,page,data}=await setup(),old=await store.getVersion(page.id);await store.update(page.id,{...old.record,...changes},old.revision);data.revision=(await store.getVersion(page.id)).revision;
  await assert.rejects(management.purge(page.id,data,admin),e=>e.status===409);
 }
 const {store,management,page,data}=await setup(),id='ST'+'a'.repeat(24),old=await store.getVersion(page.id);
 await store.createGatewayOrder(id,{id,pageId:page.id,status:'paid',quote:{includesPhysical:true},fulfillment:{state:'shipped'}});
 await store.update(page.id,{...old.record,checkoutIds:[id]},old.revision);data.revision=(await store.getVersion(page.id)).revision;
 await assert.rejects(management.purge(page.id,data,admin),e=>e.status===409);
 const order=await store.getGatewayOrder(id);await store.updateGatewayOrder(id,{...order.record,fulfillment:{state:'completed'}},order.revision);
 await management.purge(page.id,data,admin);assert.equal((await store.getGatewayOrder(id)).record.status,'paid');
});
test('a concurrent page edit cannot be overwritten by permanent deletion',async()=>{
 const {store,management,page,data}=await setup(),purge=store.purge;
 store.purge=async(id,marker,revision)=>{await store.update(id,{...(await store.getVersion(id)).record,changedConcurrently:true},revision);return purge(id,marker,revision);};
 await assert.rejects(management.purge(page.id,data,admin),e=>e.status===409);assert.ok((await store.get(page.id)).changedConcurrently);
});
test('cloud tombstones remain occupied, disappear from app reads and lists, and use a generation guard',async()=>{
 const marker={v:1,permanentlyDeleted:true},calls=[];
 const responses=[marker,{generation:'9'},marker,{items:[{name:'links/abcdefghijklmnop.json',generation:'9'}],nextPageToken:'next'},marker,{},null];
 const store=createCloudLinkStore({bucket:'smarttap-test',getToken:async()=>'test',fetcher:async(url,options)=>{calls.push({url:new URL(url),options});const data=responses.shift();return new Response(JSON.stringify(data),{status:data===null?412:200});}});
 assert.equal(await store.get('abcdefghijklmnop'),null);assert.equal(await store.getVersion('abcdefghijklmnop'),null);
 assert.deepEqual(await store.list(),{items:[],cursor:'next'});
 assert.equal(await store.purge('abcdefghijklmnop',marker,'8'),true);assert.equal(calls[5].url.searchParams.get('ifGenerationMatch'),'8');
 assert.equal(await store.create('abcdefghijklmnop',{url}),false);
});
