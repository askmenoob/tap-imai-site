import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomerService} from './customers.mjs';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {gmailAddress,ownerKey} from './identity.mjs';

const profile={v:1,name:'Kedai Ujian',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const encode=value=>'https://tap.imai.my/?p='+Buffer.from(JSON.stringify(value)).toString('base64url');
const admin={email:'admin@gmail.com',role:'admin'};
const alice={email:'alice.owner@gmail.com',sub:'google-alice',role:'user'};
const bob={email:'bob.owner@gmail.com',sub:'google-bob',role:'user'};
function setup(){const store=createMemoryLinkStore();const customers=createCustomerService({store});return {store,customers};}

test('admin registration creates distinct QR records per customer and stores Gmail outside public profile',async()=>{
  const {store,customers}=setup();const a=await customers.register({url:encode(profile),email:alice.email},admin);const b=await customers.register({url:encode(profile),email:bob.email},admin);
  assert.notEqual(a.id,b.id);assert.match(a.id,/^[A-Za-z0-9_-]{16}$/);assert.equal(a.ownerEmail,alice.email);
  const publicLinks=createShortLinks({store,secret:'s'.repeat(32)});assert.deepEqual(await publicLinks.resolve(a.id),{url:encode(profile)});assert.ok(!JSON.stringify(await publicLinks.resolve(a.id)).includes('@gmail.com'));
  assert.equal((await store.get(a.id)).ownerEmail,alice.email);
});

test('each signed-in Gmail sees and edits only its own pages, including known IDs belonging to someone else',async()=>{
  const {store,customers}=setup();const a=await customers.register({url:encode(profile),email:alice.email},admin);const b=await customers.register({url:encode({...profile,name:'Kedai Bob'}),email:bob.email},admin);
  await customers.register({url:encode({...profile,name:'Cawangan Alice'}),email:alice.email},admin);
  assert.equal((await customers.list(alice)).items.length,2);assert.deepEqual((await customers.list(bob)).items.map(item=>item.id),[b.id]);
  const edited=await customers.update(a.id,{profile:{...profile,name:'Disunting Alice'},revision:a.revision},alice);assert.equal(edited.url,a.url);
  for(const id of [a.id,'abcdefghijklmnop']){
    await assert.rejects(customers.get(id,bob),e=>e.status===404);
    await assert.rejects(customers.update(id,{profile,revision:edited.revision},bob),e=>e.status===404);
  }
  assert.equal((await customers.get(a.id,alice)).profile.name,'Disunting Alice');assert.equal((await store.get(a.id)).ownerEmail,alice.email);
  for(const extra of [{ownerEmail:bob.email},{email:bob.email},{role:'admin'}]) await assert.rejects(customers.update(a.id,{profile,revision:edited.revision,...extra},alice),e=>e.status===400);
  await assert.rejects(customers.register({url:encode(profile),email:bob.email},alice),e=>e.status===403);
  await assert.rejects(customers.assign(a.id,{email:bob.email,revision:edited.revision},alice),e=>e.status===403);
});

test('only admin can register ownership of legacy pages; reassignment revokes the previous Gmail immediately',async()=>{
  const {store,customers}=setup();const links=createShortLinks({store,secret:'s'.repeat(32)});const legacy=await links.shorten(encode(profile));
  await assert.rejects(customers.get(legacy.id,alice),e=>e.status===404);assert.equal((await customers.list(alice)).items.length,0);
  const unowned=await store.getVersion(legacy.id);const assigned=await customers.assign(legacy.id,{email:alice.email,revision:unowned.revision},admin);
  assert.equal((await customers.get(legacy.id,alice)).id,legacy.id);
  const reassigned=await customers.assign(legacy.id,{email:bob.email,revision:assigned.revision},admin);assert.equal(reassigned.url,legacy.url);
  assert.equal((await customers.list(alice)).items.length,0);assert.deepEqual((await customers.list(bob)).items.map(item=>item.id),[legacy.id]);
  await assert.rejects(customers.update(legacy.id,{profile,revision:assigned.revision},alice),e=>e.status===404);
  assert.equal(store.history.size,2);assert.equal([...store.history.values()][1].ownerEmail,alice.email);
});

test('Gmail validation, primary addresses and Google dot aliases cannot create different ownership identities',async()=>{
  assert.equal(gmailAddress(' Alice.Owner@GMAIL.COM '),'alice.owner@gmail.com');assert.equal(ownerKey('alice.owner@gmail.com'),ownerKey('aliceowner@gmail.com'));
  for(const email of ['owner@example.com','owner@gmail.com.evil','owner@googlemail.com','owner+tag@gmail.com','..owner@gmail.com','owner..name@gmail.com','owner@gmail.com\nother@gmail.com'])assert.throws(()=>gmailAddress(email),e=>e.status===400);
  const {store,customers}=setup();await assert.rejects(customers.register({url:encode(profile),email:'owner@example.com'},admin),e=>e.status===400);assert.equal(store.records.size,0);
  const a=await customers.register({url:encode(profile),email:alice.email},admin);assert.equal((await customers.get(a.id,{...alice,email:'aliceowner@gmail.com'})).id,a.id);
});

test('a failed ownership write never grants access even when its private membership entry already exists',async()=>{
  const {store,customers}=setup();const a=await customers.register({url:encode(profile),email:alice.email},admin);
  const previousUpdate=store.update;store.update=async()=>false;
  await assert.rejects(customers.assign(a.id,{email:bob.email,revision:a.revision},admin),e=>e.status===409);store.update=previousUpdate;
  assert.equal((await customers.list(bob)).items.length,0);await assert.rejects(customers.get(a.id,bob),e=>e.status===404);assert.equal((await customers.get(a.id,alice)).id,a.id);
});

test('a user save racing with reassignment cannot restore its old ownership or overwrite the new owner',async()=>{
  const {store,customers}=setup();const a=await customers.register({url:encode(profile),email:alice.email},admin);const original=store.update;
  let reached,release;const paused=new Promise(resolve=>{reached=resolve;});const gate=new Promise(resolve=>{release=resolve;});let hold=true;
  store.update=async(...args)=>{if(hold){hold=false;reached();await gate;}return original(...args);};
  const pending=customers.update(a.id,{profile:{...profile,name:'Old owner edit'},revision:a.revision},alice);await paused;
  await customers.assign(a.id,{email:bob.email,revision:a.revision},admin);release();
  await assert.rejects(pending,e=>e.status===409);assert.equal((await customers.get(a.id,bob)).profile.name,profile.name);await assert.rejects(customers.get(a.id,alice),e=>e.status===404);
});
