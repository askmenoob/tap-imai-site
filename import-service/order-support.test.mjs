import test from 'node:test';
import assert from 'node:assert/strict';
import {orderSupportLink} from '../src/order-support.mjs';
const item={profile:{name:'Kopi & Roti'},url:'https://tap.imai.my/?s=1234567890123456',manualState:'active',renewal:{id:'ST123',status:'approved',provider:'toyyibpay',reference:'TP123',items:[{id:'table_sticker',name:'NFC table sticker',quantity:20},{id:'extra_nfc',name:'Google Review NFC tambahan',quantity:2}]}};
test('paid ToyyibPay physical orders include quantities and delivery template for the correct super admin',()=>{
 const result=orderSupportLink(item,{customer:true}),url=new URL(result.url),text=url.searchParams.get('text');
 assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/60103250032');assert.equal(result.shipping,true);
 for(const value of ['Kopi & Roti','ST123','TP123','NFC table sticker × 20','Google Review NFC tambahan × 2','Nama penerima:','Nombor telefon:','Alamat penghantaran:','Poskod:','Bandar:','Negeri:'])assert.ok(text.includes(value),value);
 assert.ok(orderSupportLink(item,{customer:true,language:'en'}).url.includes('Delivery+address'));
});
test('pending or failed payments never expose the confirmed delivery action, and renew-only keeps general support',()=>{
 for(const status of ['pending','failed'])assert.equal(orderSupportLink({...item,renewal:{...item.renewal,status}},{customer:true}),null);
 const renewed=orderSupportLink({...item,renewal:{...item.renewal,items:[{id:'renew',quantity:1,name:'Renew halaman QR'}]}},{customer:true});
 assert.equal(renewed.shipping,false);assert.ok(!new URL(renewed.url).searchParams.get('text').includes('Alamat penghantaran:'));
 assert.equal(orderSupportLink(item,{customer:false}),null);assert.equal(orderSupportLink({...item,manualState:'deleted'},{customer:true}),null);
});
