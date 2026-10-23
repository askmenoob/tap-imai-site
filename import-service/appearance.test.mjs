import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {decodeProfilePayload} from '../src/public-profile.mjs';
import {promotionVisible} from './appearance.mjs';
import {validateSmartTapURL,createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {createCustomerService} from './customers.mjs';
import {createCoverMedia,normalizeCover,MAX_COVER_INPUT,MAX_COVER_STORED} from './cover-media.mjs';
const origin='https://tap.imai.my',mediaOrigin='https://media.example.com';
const base={v:1,name:'Kedai Contoh',google:'https://search.google.com/local/writereview?placeid=ChIJTest123456'};
const encode=p=>Buffer.from(JSON.stringify(p)).toString('base64url');
const url=p=>origin+'/?p='+encode(p);
test('every theme survives persistence and public decoding; old QR profiles remain valid',()=>{
  assert.equal(decodeProfilePayload(encode(base)).name,base.name);
  for(const theme of ['classic','dark','bright']){
    const p={...base,theme,accent:'#efbb22',cover:'https://example.com/a.webp',menu:'https://example.com/menu',directions:'https://maps.google.com/',address:'Jalan Contoh',hours:'9 pagi–6 petang',promoTitle:'Tawaran',promoText:'Promosi contoh',promoURL:'https://example.com/promo',promoStart:'2026-10-01T00:00',promoEnd:'2026-11-01T00:00'};
    assert.equal(validateSmartTapURL(url(p)),url(p));assert.equal(decodeProfilePayload(encode(p)).theme,theme);assert.equal(decodeProfilePayload(encode(p)).cover,p.cover);
  }
  for(const change of [{theme:'<script>'},{accent:'red;display:none'},{cover:'javascript:alert(1)'},{promoStart:'2026-02-30T10:00'},{promoStart:'2026-10-02T00:00',promoEnd:'2026-10-01T00:00'}]){
    assert.throws(()=>validateSmartTapURL(url({...base,...change})));assert.throws(()=>decodeProfilePayload(encode({...base,...change})));
  }
});
test('promotion start/end use Malaysia time and hide at exact expiry',()=>{
  const p={promoTitle:'Promosi',promoStart:'2026-10-24T10:00',promoEnd:'2026-10-24T12:00'};
  assert.equal(promotionVisible(p,Date.parse('2026-10-24T01:59:59Z')),false);
  assert.equal(promotionVisible(p,Date.parse('2026-10-24T02:00:00Z')),true);
  assert.equal(promotionVisible(p,Date.parse('2026-10-24T04:00:00Z')),false);
});
test('cover decoder strips metadata, limits dimensions/bytes and rejects disguised files',async()=>{
  const original=await sharp({create:{width:2500,height:1800,channels:3,background:'#b99c65'}}).jpeg().withMetadata({orientation:6}).toBuffer();
  const bytes=await normalizeCover(original),info=await sharp(bytes).metadata();
  assert.equal(info.format,'webp');assert.ok(info.width<=1600&&info.height<=1600);assert.ok(bytes.length<=MAX_COVER_STORED);assert.equal(info.exif,undefined);
  for(const payload of [Buffer.from('<svg></svg>'),Buffer.from('malware'),Buffer.alloc(MAX_COVER_INPUT+1)])await assert.rejects(normalizeCover(payload),e=>[413,415].includes(e.status));
});
test('cover upload requires ownership, persists to same QR, limits uploads and blocks disabled public images',async()=>{
  const store=createMemoryLinkStore(),files=new Map(),mediaStore={put:async(n,b)=>files.set(n,b),get:async n=>files.get(n)};
  const customers=createCustomerService({store}),admin={role:'admin',email:'admin@gmail.com'},alice={role:'user',email:'alice@gmail.com'},bob={role:'user',email:'bob@gmail.com'};
  const item=await customers.register({url:url(base),email:alice.email},admin);
  const media=createCoverMedia({store,mediaStore,mediaOrigin});
  let reads=0;const read=async()=>{reads++;return sharp({create:{width:800,height:500,channels:3,background:'#123456'}}).png().toBuffer();};
  await assert.rejects(media.upload(item.id,bob,read,item.revision),e=>e.status===404);assert.equal(reads,0);assert.equal(files.size,0);
  await assert.rejects(media.upload(item.id,alice,read,'0'),e=>e.status===409);assert.equal(files.size,0);
  const saved=await media.upload(item.id,alice,read,(await store.getVersion(item.id)).revision);assert.equal(saved.url,item.url);assert.match(saved.profile.cover,/\.webp$/);assert.equal(saved.ownerEmail,undefined);
  const name=new URL(saved.profile.cover).pathname.slice('/api/media/'.length);assert.ok((await media.read(name)).length);
  assert.equal((await createShortLinks({store,secret:'x'.repeat(32)}).resolve(item.id)).url.includes(encode(saved.profile)),true);
  const old=await store.getVersion(item.id);await store.update(item.id,{...old.record,coverUploads:{day:new Date().toISOString().slice(0,10),count:20}},old.revision);
  await assert.rejects(media.upload(item.id,alice,read,(await store.getVersion(item.id)).revision),e=>e.status===429);
  const v=await store.getVersion(item.id);await store.update(item.id,{...v.record,lifecycle:{state:'disabled'}},v.revision);
  await assert.rejects(media.read(name),e=>e.status===403);await assert.rejects(media.upload(item.id,alice,read,(await store.getVersion(item.id)).revision),e=>e.status===403);
});
