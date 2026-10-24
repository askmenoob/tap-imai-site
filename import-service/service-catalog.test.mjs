import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import http from 'node:http';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createGoogleAdminAuth} from './admin.mjs';
import {createGoogleUserAuth} from './identity.mjs';
import {createCatalogRoutes} from './service-catalog-routes.mjs';
import {createAccountRoutes} from './account-routes.mjs';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createAdminService} from './admin.mjs';
import {createServiceCatalog} from './service-catalog.mjs';
import {catalogTemplates,validateServiceCatalog} from './service-catalog-schema.mjs';
const admin={role:'admin',email:'admin@gmail.com'},alice={role:'user',email:'alice@gmail.com'},bob={role:'user',email:'bob@gmail.com'};
const origin='https://tap.imai.my',mediaOrigin='https://media.example.com';
const profile={v:1,name:'Bengkel Contoh',google:'https://search.google.com/local/writereview?placeid=ChIJTest123'};
const item=(changes={})=>({id:'a'.repeat(16),name:'Alignment & balancing',category:'Servis kenderaan',description:'Pemeriksaan dan pelarasan roda.',priceMode:'from',priceCents:8000,unit:'',status:'available',photo:'',...changes});
const draft=(changes={})=>({v:1,enabled:true,kind:'automotive',items:[item()],...changes});
async function setup(){const store=createMemoryLinkStore(),media=new Map(),mediaStore={put:async(name,bytes)=>media.set(name,bytes),get:async name=>media.get(name)},customers=createCustomerService({store,origin,mediaOrigin}),catalog=createServiceCatalog({store,mediaStore,origin,mediaOrigin}),admins=createAdminService({store,origin,mediaOrigin});const page=await customers.register({url:origin+'/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url'),email:alice.email},admin);return {store,media,mediaStore,customers,catalog,admins,page};}

test('business catalogs persist on the same QR with custom labels, service pricing and ordered visible items',async()=>{
 const c=await setup();let page=await c.customers.update(c.page.id,{revision:c.page.revision,profile:{...profile,menuLabel:'Lihat servis'},catalog:draft({items:[item(),item({id:'b'.repeat(16),name:'Servis tersembunyi',status:'hidden'}),item({id:'c'.repeat(16),name:'Tayar',status:'unavailable',priceMode:'fixed',priceCents:15000,unit:'unit'})]})},alice);
 assert.equal(page.url,c.page.url);assert.equal(page.profile.menu,origin+'/menu/?s='+page.id);assert.equal(page.catalog.items.length,3);
 const visible=await c.catalog.public(page.id);assert.deepEqual(visible.catalog.items.map(x=>x.name),['Alignment & balancing','Tayar']);assert.equal(visible.label,'Lihat servis');assert.equal(visible.catalog.items[1].unit,'unit');assert.ok(!JSON.stringify(visible).includes(alice.email));
 page=await c.customers.update(page.id,{revision:page.revision,profile:{...page.profile,tagline:'Updated'}},alice);assert.equal(page.catalog.items.length,3);
 const short=await createShortLinks({store:c.store,secret:'s'.repeat(32)}).resolve(page.id);assert.ok(!JSON.stringify(short).includes('Alignment & balancing'));
});
test('catalog editing and images enforce current ownership, revisions, expiry and publication mode',async()=>{
 const c=await setup();let page=await c.customers.update(c.page.id,{revision:c.page.revision,profile,catalog:draft()},alice);
 await assert.rejects(c.customers.update(page.id,{revision:page.revision,profile,catalog:draft()},bob),e=>e.status===404);
 await assert.rejects(c.customers.update(page.id,{revision:c.page.revision,profile,catalog:draft()},alice),e=>e.status===409);
 page=await c.customers.update(page.id,{revision:page.revision,profile:{...page.profile,menu:'https://example.com/menu'},catalog:draft({enabled:false})},alice);await assert.rejects(c.catalog.public(page.id),e=>e.status===404);
 assert.equal(page.catalog.items.length,1);
 const before=await c.store.getVersion(page.id);await c.store.update(page.id,{...before.record,subscription:{plan:'annual',expiresAt:'2020-01-01T00:00:00Z'}},before.revision);
 await assert.rejects(c.catalog.public(page.id),e=>e.status===403);await assert.rejects(c.customers.update(page.id,{revision:page.revision,profile,catalog:draft()},alice),e=>e.status===403);
});
test('catalog validation rejects forged fields, duplicate IDs, oversized data, prices and foreign media without writing',async()=>{
 const c=await setup();for(const bad of [draft({ownerEmail:bob.email}),draft({kind:'__proto__'}),draft({items:[item(),item()]}),draft({items:[item({priceCents:-1})]}),draft({items:[item({priceCents:1.1})]}),draft({items:[item({priceMode:'quote',priceCents:500})]}),draft({items:[item({name:'x'.repeat(81)})]}),draft({items:[item({photo:mediaOrigin+'/api/catalog-media/'+'B'.repeat(16)+'/'+'a'.repeat(24)+'.webp'})]}),draft({items:Array.from({length:51},(_,i)=>item({id:i.toString(16).padStart(16,'0')}))})]){
  await assert.rejects(c.customers.update(c.page.id,{revision:c.page.revision,profile,catalog:bad},alice),e=>e.status===400);
  assert.equal((await c.store.getVersion(c.page.id)).revision,c.page.revision);
 }
 for(const kind of Object.keys(catalogTemplates))assert.equal(validateServiceCatalog(draft({kind,items:[item({priceMode:'quote',priceCents:null})]}),{id:c.page.id,mediaOrigin}).kind,kind);
});
test('catalog photos are normalised, private until saved, revoked when hidden, and limited to the owning page',async()=>{
 const c=await setup(),bytes=await sharp({create:{width:1400,height:900,channels:3,background:'#884422'}}).png().toBuffer();
 await assert.rejects(c.catalog.upload(c.page.id,bob,async()=>bytes,c.page.revision),e=>e.status===404);
 const uploaded=await c.catalog.upload(c.page.id,alice,async()=>bytes,c.page.revision);const name=new URL(uploaded.url).pathname.slice('/api/catalog-media/'.length);
 const meta=await sharp(c.media.get(name)).metadata();assert.equal(meta.format,'webp');assert.ok(meta.width<=800);assert.ok(c.media.get(name).length<=200*1024);
 await assert.rejects(c.catalog.image(name),e=>e.status===404);
 assert.ok((await c.catalog.preview(c.page.id,name.split('/')[1],alice)).length);await assert.rejects(c.catalog.preview(c.page.id,name.split('/')[1],bob),e=>e.status===404);
 let page=await c.customers.update(c.page.id,{revision:uploaded.page.revision,profile,catalog:draft({items:[item({photo:uploaded.url})]})},alice);
 assert.ok((await c.catalog.image(name)).length>0);
 page=await c.customers.update(page.id,{revision:page.revision,profile:page.profile,catalog:draft({items:[item({photo:uploaded.url,status:'hidden'})]})},alice);await assert.rejects(c.catalog.image(name),e=>e.status===404);
 await assert.rejects(c.catalog.upload(page.id,alice,async()=>Buffer.alloc(2*1024*1024+1),page.revision),e=>e.status===413);
 await assert.rejects(c.catalog.upload(page.id,alice,async()=>Buffer.from('<svg/>'),page.revision),e=>e.status===415);
});

test('ownership reassignment during photo upload fails the conditional write and revokes private preview',async()=>{
 const c=await setup(),bytes=await sharp({create:{width:20,height:20,channels:3,background:'green'}}).png().toBuffer();
 await assert.rejects(c.catalog.upload(c.page.id,alice,async()=>{await c.customers.assign(c.page.id,{email:bob.email,revision:c.page.revision},admin);return bytes;},c.page.revision),e=>e.status===409);
 const record=await c.store.getVersion(c.page.id);assert.equal(record.record.ownerEmail,bob.email);assert.equal(record.record.catalogUploads,undefined);
 const name=[...c.media.keys()][0];await assert.rejects(c.catalog.preview(c.page.id,name.split('/')[1],alice),e=>e.status===404);await assert.rejects(c.catalog.image(name),e=>e.status===404);
});

test('signed HTTP catalog routes enforce identity, roles, origins and private/public image publication',async t=>{
 const c=await setup(),{publicKey,privateKey}=await generateKeyPair('RS256'),jwk=await exportJWK(publicKey),keySet=createLocalJWKSet({keys:[{...jwk,kid:'catalog-test',alg:'RS256'}]}),clientId='catalog-test-client';
 const sign=email=>new SignJWT({email,email_verified:true}).setProtectedHeader({alg:'RS256',kid:'catalog-test'}).setSubject(email).setAudience(clientId).setIssuer('https://accounts.google.com').setIssuedAt().setExpirationTime('10m').sign(privateKey);
 const tokens={alice:await sign(alice.email),bob:await sign(bob.email)},adminAuth=createGoogleAdminAuth({clientId,emails:[admin.email],keySet}),userAuth=createGoogleUserAuth({clientId,keySet});
 const reply=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
 const body=async(req,max)=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(new Error('Too large'),{status:413});chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks));};
 const catalogue=createCatalogRoutes({catalog:c.catalog,adminAuth,userAuth,reply}),accounts=createAccountRoutes({adminAuth,userAuth,admin:c.admins,customers:c.customers,reply,body,clientId,adminConfigured:true});
 const server=http.createServer(async(req,res)=>{try{const context={path:new URL(req.url,'http://localhost').pathname,origin:req.headers.origin===origin?origin:null};if(await catalogue(req,res,context)||await accounts(req,res,context))return;reply(res,404,{});}catch(error){reply(res,error.status||500,{error:error.message});}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());const base='http://127.0.0.1:'+server.address().port;
 const bytes=await sharp({create:{width:30,height:20,channels:3,background:'blue'}}).png().toBuffer(),path='/api/user/links/'+c.page.id+'/catalog-image';
 const request=(path,{actor='alice',method='GET',value,raw=false,requestOrigin=origin,...extra}={})=>fetch(base+path,{method,headers:{...(actor?{Authorization:'Bearer '+tokens[actor]}:{}),...(requestOrigin?{Origin:requestOrigin}:{}),...(value?{'Content-Type':raw?'image/png':'application/json'}:{}),...extra},body:value?(raw?value:JSON.stringify(value)):undefined});
 assert.equal((await request(path,{actor:null,method:'POST',value:bytes,raw:true,'If-Match':c.page.revision})).status,401);
 assert.equal((await request(path,{method:'POST',value:bytes,raw:true,requestOrigin:'https://evil.example','If-Match':c.page.revision})).status,403);
 assert.equal((await request(path.replace('/user/','/admin/'),{method:'POST',value:bytes,raw:true,'If-Match':c.page.revision})).status,403);
 assert.equal((await request(path,{actor:'bob',method:'POST',value:bytes,raw:true,'If-Match':c.page.revision})).status,404);
 const upload=await request(path,{method:'POST',value:bytes,raw:true,'If-Match':c.page.revision});assert.equal(upload.status,200);const result=await upload.json(),photoPath=new URL(result.url).pathname,file=photoPath.split('/').at(-1);
 assert.equal((await request(photoPath,{actor:null,requestOrigin:null})).status,404);assert.equal((await request(path+'/'+file)).status,200);assert.equal((await request(path+'/'+file,{actor:'bob'})).status,404);
 const data={revision:result.page.revision,profile:{...profile,menuLabel:'Perkhidmatan kami'},catalog:draft({items:[item({photo:result.url})]})},savePath='/api/user/links/'+c.page.id;
 assert.equal((await request(savePath,{actor:'bob',method:'PUT',value:data})).status,404);assert.equal((await request(savePath,{method:'PUT',value:data,requestOrigin:null})).status,403);
 const saved=await request(savePath,{method:'PUT',value:data});assert.equal(saved.status,200);assert.equal((await request(savePath,{method:'PUT',value:data})).status,409);
 const publicResult=await request('/api/catalog/'+c.page.id,{actor:null,requestOrigin:null});assert.equal(publicResult.status,200);assert.ok(!JSON.stringify(await publicResult.json()).includes(alice.email));
 const image=await request(photoPath,{actor:null,requestOrigin:null});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');assert.equal(image.headers.get('cache-control'),'no-store');
});
