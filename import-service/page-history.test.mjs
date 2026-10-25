import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLinkStore} from './short-links.mjs';
import {profileURL} from './admin.mjs';
import {createPageHistory} from './page-history.mjs';

const id='HistoryPage1234_',other='AnotherPage1234_';
const origin='https://tap.imai.my',mediaOrigin='https://media.example.com';
const admin={role:'admin',email:'admin@gmail.com'},user={role:'user',email:'owner@gmail.com'};
const profile={v:1,name:'Kopi sekarang',google:'https://search.google.com/local/writereview?placeid=ChIJHistory'};
const archived={v:1,url:profileURL({...profile,name:'Kopi dahulu'}),createdAt:'2026-01-01T00:00:00Z',archivedAt:'2026-10-01T00:00:00Z',archivedBy:admin.email,ownerEmail:'old-owner@gmail.com',subscription:{plan:'nfc_only'},renewal:{reference:'PRIVATE-OLD-PAYMENT'},adminMessage:{text:'PRIVATE-OLD-MESSAGE'}};
const catalog={v:1,enabled:true,kind:'salon',items:[{id:'1234567890abcdef',name:' Potong rambut ',category:' Rambut ',description:' Servis biasa ',priceMode:'fixed',priceCents:3000,unit:'session',status:'available',photo:mediaOrigin+'/api/catalog-media/'+id+'/0123456789abcdef01234567.webp'}]};
async function setup(history=archived){
  const store=createMemoryLinkStore();
  await store.create(id,{v:1,url:profileURL(profile),createdAt:'2026-09-01T00:00:00Z',ownerEmail:user.email,ownerKey:'PRIVATE-CURRENT-KEY',subscription:{plan:'annual',expiresAt:'2028-10-25T00:00:00Z'},lifecycle:{state:'disabled'},renewal:{status:'approved',amountCents:10000},checkout:{id:'ST0123456789abcdef01234567',status:'paid'},adminMessage:{text:'Keep current'},coverUploads:{day:'2026-10-25',count:4},catalogUploads:{day:'2026-10-25',count:7},subscriptionAdjustment:{note:'Keep current adjustment'}});
  await store.archive(id,'99',structuredClone(history));
  return {store,service:createPageHistory({store,origin,mediaOrigin,now:()=>Date.parse('2026-10-25T00:00:00Z')}),current:await store.getVersion(id)};
}

test('history is super-admin only and list exposes summaries rather than private snapshots',async()=>{
  const {store,service,current}=await setup();
  for(const actor of [undefined,user,{email:admin.email},{role:'admin'}]){
    await assert.rejects(service.list(id,actor),e=>e.status===403);
    await assert.rejects(service.restore(id,{sourceRevision:'99',revision:current.revision,note:'Undo'},actor),e=>e.status===403);
  }
  await store.archive(id,'100',{...archived,url:'malformed',ownerEmail:'private-person@gmail.com'});
  for(let index=101;index<125;index++)await store.archive(id,String(index),archived);
  const result=await service.list(id,admin);
  assert.equal(result.items[0].name,'Kopi dahulu');assert.equal(result.items[0].restorable,true);assert.equal(result.cursor,'25');assert.equal(result.revision,current.revision);
  assert.deepEqual(Object.keys(result.items[0]).sort(),['archivedAt','changedBy','name','restorable','revision','updatedAt'].sort());
  for(const secret of ['old-owner@gmail.com','PRIVATE-OLD-PAYMENT','PRIVATE-OLD-MESSAGE','PRIVATE-CURRENT-KEY','checkout'])assert.equal(JSON.stringify(result).includes(secret),false);
  assert.equal(result.items[1].restorable,false);assert.equal(result.items[1].name,'Versi tidak sah');
  const next=await service.list(id,admin,result.cursor);assert.equal(next.items.length,1);assert.equal(next.cursor,null);
  await assert.rejects(service.list(id,admin,'!bad'),e=>e.status===400);
  await assert.rejects(service.list('wrong',admin),e=>e.status===404);
});

test('restore changes content only, preserves current owner and all entitlement/payment/lifecycle metadata, and archives current state',async()=>{
  const {store,service,current}=await setup({...archived,url:profileURL({...profile,name:' Kopi dahulu ',cover:mediaOrigin+'/api/media/'+id+'/0123456789abcdef01234567.webp'}),catalog});
  const result=await service.restore(id,{sourceRevision:'99',revision:current.revision,note:' Pulihkan menu yang betul '},admin);
  const saved=await store.getVersion(id),before=current.record;
  assert.equal(result.url,origin+'/?s='+id);assert.equal(result.profile.name,'Kopi dahulu');assert.equal(result.profile.menu,origin+'/menu/?s='+id);assert.equal(result.catalog.items[0].name,'Potong rambut');assert.equal(result.state,'disabled');
  for(const key of ['createdAt','ownerEmail','ownerKey','subscription','lifecycle','renewal','checkout','adminMessage','coverUploads','catalogUploads','subscriptionAdjustment'])assert.deepEqual(saved.record[key],before[key],key);
  assert.deepEqual(store.history.get(id+'/'+current.revision).subscription,before.subscription);
  assert.equal(store.history.get(id+'/'+current.revision).url,before.url);
  assert.deepEqual(saved.record.contentRestoration,{sourceRevision:'99',previousRevision:current.revision,note:'Pulihkan menu yang betul',restoredAt:'2026-10-25T00:00:00.000Z',restoredBy:admin.email});
  assert.notEqual(saved.revision,current.revision);assert.equal(saved.record.updatedBy,admin.email);
});

test('legacy history without catalogue cannot accidentally publish the current catalogue',async()=>{
  const {store,service,current}=await setup({...archived,url:profileURL({...profile,menu:origin+'/menu/?s='+id})});
  await store.update(id,{...current.record,catalog},current.revision);const latest=await store.getVersion(id);
  const result=await service.restore(id,{sourceRevision:'99',revision:latest.revision,note:'Kembali kepada kandungan lama'},admin);
  assert.equal(result.profile.menu,'');assert.deepEqual(result.catalog,{v:1,enabled:false,kind:'custom',items:[]});
});

test('invalid or other-page historic profile, cover, catalogue and catalogue image are refused without writes',async()=>{
  const candidates=[
    {...archived,url:'https://elsewhere.example/?p=bad'},
    {...archived,url:origin+'/?p='+Buffer.from(JSON.stringify({...profile,extraAdminField:'bad'})).toString('base64url')},
    {...archived,url:profileURL({...profile,cover:mediaOrigin+'/api/media/'+other+'/0123456789abcdef01234567.webp'})},
    {...archived,url:profileURL({...profile,cover:mediaOrigin+'/api/media/'+id+'/0123456789abcdef01234567.webp?bad=1'})},
    {...archived,url:profileURL({...profile,menu:origin+'/menu/?s='+other})},
    {...archived,catalog:{...catalog,items:[{...catalog.items[0],photo:mediaOrigin+'/api/catalog-media/'+other+'/0123456789abcdef01234567.webp'}]}},
    {...archived,catalog:{...catalog,items:[{...catalog.items[0],priceCents:-10}]}},
    {...archived,catalog:{...catalog,unexpected:'bad'}},
  ];
  for(const historical of candidates){
    const {store,service,current}=await setup(historical);
    await assert.rejects(service.restore(id,{sourceRevision:'99',revision:current.revision,note:'Restore'},admin),e=>e.status===400);
    assert.deepEqual(await store.getVersion(id),current);assert.equal(store.history.size,1);
  }
});

test('restore requires a reason, known revision and available page; stale and concurrent edits fail closed',async()=>{
  const {store,service,current}=await setup();const data={sourceRevision:'99',revision:current.revision,note:'Undo mistake'};
  for(const body of [null,[],{...data,note:''},{...data,note:'x'.repeat(201)},{...data,note:'bad\nreason'},{...data,sourceRevision:'../99'},{...data,ownerEmail:'attacker@gmail.com'}])await assert.rejects(service.restore(id,body,admin),e=>e.status===400);
  await assert.rejects(service.restore(id,{...data,revision:'999'},admin),e=>e.status===409);
  await assert.rejects(service.restore(id,{...data,sourceRevision:'100'},admin),e=>e.status===404);
  const update=store.update;store.update=async()=>false;
  await assert.rejects(service.restore(id,data,admin),e=>e.status===409);assert.deepEqual(await store.getVersion(id),current);store.update=update;
  await store.update(id,{...current.record,lifecycle:{state:'deleted'}},current.revision);
  const deleted=await store.getVersion(id);await assert.rejects(service.restore(id,{...data,revision:deleted.revision},admin),e=>e.status===409);assert.deepEqual(await store.getVersion(id),deleted);
});
