import test from 'node:test';
import assert from 'node:assert/strict';
import {orderSupportLink} from '../src/order-support.mjs';
const item={profile:{name:'Kopi & Roti'},url:'https://tap.imai.my/?s=1234567890123456',manualState:'active',renewal:{id:'ST123',status:'approved',provider:'toyyibpay',reference:'TP123',items:[{id:'table_sticker',name:'NFC table sticker',quantity:20},{id:'extra_nfc',name:'Google Review NFC tambahan',quantity:2}]}};
test('one support draft includes confirmed order context without asking for a second delivery address',()=>{
 const result=orderSupportLink(item,{customer:true}),url=new URL(result.url),text=url.searchParams.get('text');
 assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/60103250032');
 for(const value of ['Kopi & Roti','ST123','TP123','NFC table sticker × 20','Google Review NFC tambahan × 2','Pertanyaan saya:'])assert.ok(text.includes(value),value);
 assert.ok(!text.includes('Alamat penghantaran:'));
 assert.ok(new URL(orderSupportLink(item,{customer:true,language:'en'}).url).searchParams.get('text').includes('My enquiry:'));
});
test('pending or failed customers can ask for help without unverified payment details',()=>{
 for(const status of ['pending','failed']){
  const text=new URL(orderSupportLink({...item,renewal:{...item.renewal,status}},{customer:true}).url).searchParams.get('text');
  for(const value of ['ST123','TP123','NFC table sticker','bayaran saya telah disahkan'])assert.ok(!text.includes(value),value);
 }
 const renewed=orderSupportLink({...item,renewal:{...item.renewal,items:[{id:'renew',quantity:1,name:'Renew halaman QR'}]}},{customer:true});
 assert.ok(!new URL(renewed.url).searchParams.get('text').includes('Alamat penghantaran:'));
 assert.equal(orderSupportLink(item,{customer:false}),null);assert.equal(orderSupportLink({...item,manualState:'deleted'},{customer:true}),null);
});
test('support includes the admin request and preserves a selected earlier order without mixing latest payment details',()=>{
 const requested={...item,adminMessage:{text:'Request Transaction Number',status:'open'}};
 const text=new URL(orderSupportLink(requested,{customer:true,orderId:'ST456'}).url).searchParams.get('text');
 assert.ok(text.includes('ST456'));assert.ok(text.includes('Request Transaction Number'));
 assert.ok(!text.includes('ST123'));assert.ok(!text.includes('TP123'));
 const closed=new URL(orderSupportLink({...requested,adminMessage:{...requested.adminMessage,status:'resolved'}},{customer:true}).url).searchParams.get('text');
 assert.ok(!closed.includes('Request Transaction Number'));
});
