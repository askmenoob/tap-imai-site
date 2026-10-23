import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {generateKeyPair,SignJWT} from 'jose';
import {createGoogleAdminAuth} from './admin.mjs';
import {createImportService} from './service.mjs';
import {createDiscoveryRoutes} from './discovery-routes.mjs';
import {createShortLinks,createMemoryLinkStore} from './short-links.mjs';
const id='ChIJPrivateSearch123456',origin='https://tap.imai.my',secret='s'.repeat(32);
function fixture(now){let calls=0;const google={suggest:async()=>[{id,name:'Test Business',address:'Shah Alam'}],search:async()=>[{id,name:'Test Business',address:'Shah Alam'}],details:async value=>{calls++;return {id:value,name:'Test Business',phone:'0122258950'};}};return {service:createImportService({google,secret,now}),calls:()=>calls};}

test('encrypted discovery grants resist decoding, tampering, expiry and cross-purpose reuse',async()=>{
  let now=100000;const {service,calls}=fixture(()=>now);
  const choice=(await service.search('Test Business')).places[0].token;
  assert.ok(!Buffer.from(choice.slice(3),'base64url').toString().includes(id));
  await assert.rejects(service.import(choice.slice(0,-1)+'!'));assert.equal(calls(),0);
  assert.throws(()=>service.reviewFromDraft(choice));
  const imported=await service.import(choice);assert.equal(calls(),1);
  await assert.rejects(service.import(imported.draftToken));assert.equal(calls(),1);
  assert.equal(fixture(()=>now).service.reviewFromDraft(imported.draftToken),'https://search.google.com/local/writereview?placeid='+id);
  now+=16*60*1000;assert.throws(()=>service.reviewFromDraft(imported.draftToken));await assert.rejects(service.import(choice));assert.equal(calls(),1);
});

test('HTTP discovery with signed identities exposes Place IDs only to verified super admins',async t=>{
  const pair=await generateKeyPair('RS256'),clientId='discovery-test.apps.googleusercontent.com';
  const signed=async email=>new SignJWT({email,email_verified:true,role:'admin'}).setProtectedHeader({alg:'RS256'}).setSubject(email).setIssuer('https://accounts.google.com').setAudience(clientId).setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
  const {service,calls}=fixture(),store=createMemoryLinkStore(),shortLinks=createShortLinks({store,secret,newSubscription:{plan:'annual',startsAt:null,expiresAt:null}});
  const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  const body=async req=>{const chunks=[];for await(const chunk of req)chunks.push(chunk);return JSON.parse(Buffer.concat(chunks));};
  const routes=createDiscoveryRoutes({service,shortLinks,originURL:origin,adminAuth:createGoogleAdminAuth({clientId,emails:['owner@gmail.com'],keySet:pair.publicKey}),reply,body,allow:()=>true});
  const server=http.createServer(async(req,res)=>{try{if(!await routes(req,res,{path:new URL(req.url,origin).pathname,origin:req.headers.origin===origin?origin:null}))reply(res,404,{});}catch(error){reply(res,error.status||500,{error:error.message});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  const call=async(path,data,credential,requestOrigin=origin)=>{const response=await fetch(base+path,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',...(credential?{Authorization:'Bearer '+credential}:{})},body:JSON.stringify(data)});return {status:response.status,data:await response.json()};};
  for(const path of ['search','suggest','import']){
    assert.equal((await call('/api/admin/'+path,{query:'Test Business',token:'fake'})).status,401);
    assert.equal((await call('/api/admin/'+path,{query:'Test Business',role:'admin'},'forged')).status,401);
    assert.equal((await call('/api/admin/'+path,{query:'Test Business',admin:true},await signed('customer@gmail.com'))).status,403);
  }
  assert.equal(calls(),0);
  const publicSearch=await call('/api/search',{query:'Test Business',role:'admin',includeReview:true});assert.equal(publicSearch.status,200);
  assert.equal(publicSearch.data.places[0].id,undefined);assert.ok(!JSON.stringify(publicSearch.data).includes(id));
  const suggestions=await call('/api/suggest',{query:'Test Business',sessionToken:'123e4567-e89b-42d3-a456-426614174000'});assert.equal(suggestions.status,200);assert.equal(suggestions.data.places[0].id,undefined);
  const imported=await call('/api/import',{token:publicSearch.data.places[0].token,role:'admin'});assert.equal(imported.status,200);
  assert.equal(imported.data.profile.google,undefined);assert.equal(imported.data.sources.google,undefined);assert.ok(!JSON.stringify(imported.data).includes(id));assert.ok(!JSON.stringify(imported.data).includes('placeid='));
  const owner=await signed('owner@gmail.com');
  const adminImport=await call('/api/admin/import',{token:publicSearch.data.places[0].token},owner);assert.equal(adminImport.status,200);assert.equal(adminImport.data.profile.google,'https://search.google.com/local/writereview?placeid='+id);
  const adminSearch=await call('/api/admin/search',{query:'Test Business'},owner);assert.equal(adminSearch.data.places[0].id,id);
  assert.equal((await call('/api/create',{profile:{v:1,name:'Test Business'},draftToken:publicSearch.data.places[0].token})).status,400);
  assert.equal((await call('/api/create',{profile:{v:1,name:'Test Business',google:'https://evil.example/'},draftToken:imported.data.draftToken})).status,400);
  const created=await call('/api/create',{profile:{v:1,...imported.data.profile},draftToken:imported.data.draftToken});assert.equal(created.status,200);assert.match(created.data.url,/\?s=[A-Za-z0-9_-]{16}$/);assert.ok(!JSON.stringify(created.data).includes(id));
  const saved=await store.get(created.data.id),profile=JSON.parse(Buffer.from(new URL(saved.url).searchParams.get('p'),'base64url'));
  assert.equal(profile.google,'https://search.google.com/local/writereview?placeid='+id);assert.equal(profile.whatsapp,'https://wa.me/60122258950');assert.equal(saved.subscription.expiresAt,null);
  assert.equal((await call('/api/import',{token:publicSearch.data.places[0].token},undefined,'https://evil.example')).status,403);
});
