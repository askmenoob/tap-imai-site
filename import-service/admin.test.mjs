import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT} from 'jose';
import {createGoogleAdminAuth, createAdminService} from './admin.mjs';
import {createShortLinks} from './short-links.mjs';

const profile={v:1,name:'Kopi Ujian',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const encode=p=>'https://tap.imai.my/?p='+Buffer.from(JSON.stringify(p)).toString('base64url');
const clientId='1234567890-test.apps.googleusercontent.com';
const email='admin@example.com';
const pair=await generateKeyPair('RS256');
const token=async(overrides={},key=pair.privateKey)=>new SignJWT({email,email_verified:true,...overrides})
  .setProtectedHeader({alg:'RS256',kid:'test'})
  .setSubject('google-user-123').setAudience(clientId).setIssuer('https://accounts.google.com')
  .setIssuedAt().setExpirationTime('5m').sign(key);
const auth=()=>createGoogleAdminAuth({clientId,emails:[email],keySet:pair.publicKey});
function storage(){
  const records=new Map();const history=new Map();let generation=0;
  return {records,history,
    create:async(id,record)=>{if(records.has(id))return false;records.set(id,{record:structuredClone(record),revision:String(++generation)});return true;},
    get:async id=>structuredClone(records.get(id)?.record||null),
    getVersion:async id=>structuredClone(records.get(id)||null),
    list:async cursor=>({items:[...records].slice(Number(cursor||0),Number(cursor||0)+1).map(([id,value])=>({id,...structuredClone(value)})),cursor:records.size>Number(cursor||0)+1?String(Number(cursor||0)+1):null}),
    archive:async(id,revision,record)=>{history.set(id+'/'+revision,structuredClone(record));},
    update:async(id,record,revision)=>{if(records.get(id)?.revision!==revision)return false;records.set(id,{record:structuredClone(record),revision:String(++generation)});return true;},
  };
}
test('Google admin requires a signed Google token, correct client, verified email and exact allowlist',async()=>{
  const verify=auth();const result=await verify('Bearer '+await token());assert.equal(result.email,email);assert.equal(result.sub,'google-user-123');
  for(const authorization of ['', 'Bearer fake', 'Bearer '+await token({email:'other@example.com'}),'Bearer '+await token({email_verified:false})]) await assert.rejects(verify(authorization),e=>[401,403].includes(e.status));
  const wrongAud=await new SignJWT({email,email_verified:true}).setProtectedHeader({alg:'RS256'}).setAudience('other-client').setIssuer('https://accounts.google.com').setSubject('id').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
  await assert.rejects(verify('Bearer '+wrongAud),e=>e.status===401);
  const other=await generateKeyPair('RS256');await assert.rejects(verify('Bearer '+await token({},other.privateKey)),e=>e.status===401);
});
test('expired and unsigned tokens fail, and missing configuration never enables admin',async()=>{
  const expired=await new SignJWT({email,email_verified:true}).setProtectedHeader({alg:'RS256'}).setAudience(clientId).setIssuer('https://accounts.google.com').setSubject('id').setIssuedAt(Math.floor(Date.now()/1000)-7200).setExpirationTime(Math.floor(Date.now()/1000)-3600).sign(pair.privateKey);
  await assert.rejects(auth()('Bearer '+expired),e=>e.status===401);
  await assert.rejects(createGoogleAdminAuth({clientId:'',emails:[]})('Bearer anything'),e=>e.status===503);
});
test('admin enumerates existing records with pagination and edits in place while preserving printed URL',async()=>{
  const store=storage();const publicLinks=createShortLinks({store,secret:'s'.repeat(32)});
  const first=await publicLinks.shorten(encode(profile));await publicLinks.shorten(encode({...profile,name:'Kedai Kedua'}));
  await publicLinks.resolve(first.id); // Warm the public instance before the separate admin edits.
  const admin=createAdminService({store});const page=await admin.list();assert.equal(page.items[0].profile.name,'Kopi Ujian');assert.ok(page.cursor);assert.equal((await admin.list(page.cursor)).items.length,1);
  const edited=await admin.update(first.id,{profile:{...profile,name:'Kopi Baharu',phone:'012-2258950'},revision:page.items[0].revision},{email});
  assert.equal(edited.url,first.url);assert.equal(edited.profile.phone,'60122258950');assert.equal(edited.profile.whatsapp,'https://wa.me/60122258950');
  assert.equal(JSON.parse(Buffer.from(new URL((await publicLinks.resolve(first.id)).url).searchParams.get('p'),'base64url')).name,'Kopi Baharu');
  assert.equal(store.history.size,1);assert.equal([...store.history.values()][0].url,encode(profile));
  const fresh=createShortLinks({store,secret:'s'.repeat(32)});assert.equal((await fresh.resolve(first.id)).url,(await publicLinks.resolve(first.id)).url);
  const recreated=await publicLinks.shorten(encode(profile));assert.notEqual(recreated.id,first.id);assert.equal((await publicLinks.resolve(first.id)).url,encode(edited.profile));
});
test('stale admin editors cannot overwrite a more recent edit, and invalid edits write nothing',async()=>{
  const store=storage();const links=createShortLinks({store,secret:'s'.repeat(32)});const link=await links.shorten(encode(profile));const admin=createAdminService({store});
  const old=(await admin.list()).items[0];await admin.update(link.id,{profile:{...profile,name:'Penyunting Pertama'},revision:old.revision},{email});
  await assert.rejects(admin.update(link.id,{profile:{...profile,name:'Penyunting Kedua'},revision:old.revision},{email}),e=>e.status===409);
  const current=(await admin.list()).items[0];const size=store.history.size;
  for(const bad of [{...profile,website:'javascript:alert(1)'},{...profile,name:''},{...profile,extra:'untrusted'}, {...profile,phone:'invalid'}]) await assert.rejects(admin.update(link.id,{profile:bad,revision:current.revision},{email}),e=>e.status===400);
  assert.equal(store.history.size,size);assert.equal((await admin.list()).items[0].profile.name,'Penyunting Pertama');
  await assert.rejects(admin.update('../wrong',{profile,revision:'1'},{email}),e=>e.status===404);
});
