import {createHash,randomUUID} from 'node:crypto';
import {ownerKey} from './identity.mjs';
import {validId,pageView,savePage} from './admin.mjs';
import {annualEnd} from './page-state.mjs';
import {createCatalog} from './catalog.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const admin=actor=>{if(actor?.role!=='admin')throw fail(403,'Hanya super admin boleh mengurus status dan mengesahkan bayaran.');};
const hash=value=>createHash('sha256').update(value).digest('base64url');
export function createManagementService({store,origin='https://tap.imai.my',now=Date.now,enabled=false,manualEnabled=true,qrPayload='',payee='NIK AZFAR BIN NIK ZAINAL',stickerCents=2000,shippingCents=0}){
  const catalog=createCatalog({stickerCents,shippingCents});
  const view=(id,item,actor)=>pageView({id,...item},origin,actor.role==='admin',now());
  const ready=()=>{if(!enabled)throw fail(503,'Pembaharuan bayaran belum dibuka. Hubungi super admin.');};
  async function load(id,actor){
    validId(id);const item=await store.getVersion(id);if(!item)throw fail(404,'Halaman tidak ditemui.');
    if(actor?.role==='admin')return item;
    let owns=false;try{owns=actor?.role==='user'&&ownerKey(item.record.ownerEmail)===ownerKey(actor.email);}catch{}
    if(!owns||item.record.lifecycle?.state==='deleted')throw fail(404,'Halaman ini tidak tersedia untuk akaun Gmail anda.');return item;
  }
  return {
    async message(id,data={},actor){
      admin(actor);
      if(Object.keys(data).some(key=>!['text','revision','action','messageId'].includes(key)))throw fail(400,'Maklumat mesej tidak sah.');
      const previous=await load(id,actor);
      if(previous.record.lifecycle?.state==='deleted'||!previous.record.ownerEmail)throw fail(409,'Daftarkan Gmail pemilik pada halaman yang tersedia dahulu.');
      let adminMessage;
      if(data.action==='send'){
        const text=typeof data.text==='string'?data.text.normalize('NFC').trim():'';
        if(!text||text.length>1000)throw fail(400,'Masukkan mesej, maksimum 1000 aksara.');
        adminMessage={id:randomUUID(),text,status:'open',sentAt:new Date(now()).toISOString(),sentBy:actor.email,recipientKey:ownerKey(previous.record.ownerEmail)};
      }else if(data.action==='resolve'){
        const old=previous.record.adminMessage;
        if(!old||old.id!==data.messageId)throw fail(409,'Mesej telah berubah. Muat semula halaman.');
        adminMessage={...old,status:'resolved',resolvedAt:new Date(now()).toISOString(),resolvedBy:actor.email};
      }else throw fail(400,'Tindakan mesej tidak sah.');
      const saved=await savePage({store,id,previous,revision:data.revision,changes:{adminMessage},actor,now});return view(id,saved,actor);
    },
    async replyMessage(id,data={},actor){
      if(actor?.role!=='user')throw fail(403,'Hanya pelanggan boleh membalas mesej ini.');
      if(Object.keys(data).some(key=>!['text','revision','messageId'].includes(key)))throw fail(400,'Maklumat balasan tidak sah.');
      const previous=await load(id,actor),old=previous.record.adminMessage;
      if(!old||old.id!==data.messageId||old.recipientKey!==ownerKey(actor.email)||old.status!=='open')throw fail(409,'Mesej ini tidak lagi menunggu balasan.');
      const text=typeof data.text==='string'?data.text.normalize('NFC').trim():'';
      if(!text||text.length>500)throw fail(400,'Masukkan balasan, maksimum 500 aksara.');
      const adminMessage={...old,status:'replied',reply:{text,sentAt:new Date(now()).toISOString(),sentBy:actor.email}};
      await savePage({store,id,previous,revision:data.revision,changes:{adminMessage},actor,now});
      return view(id,await load(id,actor),actor);
    },
    config(){return {enabled,manualEnabled,...catalog.config,...(manualEnabled?{payee,...(enabled?{qrPayload}:{})}:{})};},
    async quote(id,options,actor){ready();const item=await load(id,actor);return catalog.quote(item.record,options);},
    async state(id,{state,revision,confirmName}={},actor){
      admin(actor);if(!['active','disabled','deleted'].includes(state))throw fail(400,'Status halaman tidak sah.');
      const previous=await load(id,actor);const name=JSON.parse(Buffer.from(new URL(previous.record.url).searchParams.get('p'),'base64url')).name;
      if(state==='deleted'&&confirmName!==name)throw fail(400,'Taip nama perniagaan yang tepat untuk memadam halaman.');
      if(previous.record.lifecycle?.state==='deleted'&&state==='active')throw fail(400,'Pulihkan sebagai nyahaktif dahulu, kemudian aktifkan halaman.');
      const saved=await savePage({store,id,previous,revision,changes:{lifecycle:{state,changedAt:new Date(now()).toISOString(),changedBy:actor.email}},actor,now});return view(id,saved,actor);
    },
    async request(id,data={},actor){
      if(!manualEnabled)throw fail(410,'Bayaran manual telah ditutup. Gunakan ToyyibPay.');if(!qrPayload)throw fail(503,'Bayaran manual belum dikonfigurasi.');
      ready();const previous=await load(id,actor);if(previous.record.lifecycle?.state==='deleted')throw fail(409,'Halaman telah dipadam.');
      if(!previous.record.ownerEmail)throw fail(400,'Daftarkan Gmail pelanggan sebelum merekod bayaran.');
      if(Object.keys(data).some(key=>!['reference','paidDate','amountCents','revision','package','extraNfcQty','stickerQty'].includes(key)))throw fail(400,'Maklumat bayaran tidak sah.');
      const quote=catalog.quote(previous.record,{package:data.package,extraNfcQty:data.extraNfcQty,stickerQty:data.stickerQty});
      const reference=typeof data.reference==='string'?data.reference.normalize('NFC').trim():'';
      if(reference.length<3||reference.length>80||!/^[-\p{L}\p{N} ./_]+$/u.test(reference))throw fail(400,'Masukkan rujukan transaksi bank, 3 hingga 80 aksara.');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(data.paidDate||'')||!Number.isFinite(Date.parse(data.paidDate))||new Date(data.paidDate).toISOString().slice(0,10)!==data.paidDate||Date.parse(data.paidDate)>now()+86400000)throw fail(400,'Tarikh bayaran tidak sah.');
      if(data.amountCents!==quote.amountCents)throw fail(409,'Harga pakej telah berubah. Muat semula sebelum menghantar.');
      if(previous.record.checkout&&!['paid','cancelled','creation_failed'].includes(previous.record.checkout.status))throw fail(409,'Selesaikan atau batalkan bil ToyyibPay sebelum menghantar bayaran manual.');
      const old=previous.record.renewal;
      if(old?.status==='pending'){
        if(old.reference===reference&&old.paidDate===data.paidDate&&old.amountCents===quote.amountCents&&old.package===quote.package&&old.extraNfcQty===quote.extraNfcQty&&old.stickerQty===quote.stickerQty)return view(id,previous,actor);
        throw fail(409,'Permohonan bayaran sedang menunggu semakan super admin.');
      }
      const renewal={id:randomUUID(),status:'pending',reference,paidDate:data.paidDate,...quote,submittedAt:new Date(now()).toISOString(),submittedBy:actor.email};
      const saved=await savePage({store,id,previous,revision:data.revision,changes:{renewal},actor,now});return view(id,saved,actor);
    },
    async decide(id,{requestId,decision,revision,confirmBank=false,note=''}={},actor){
      admin(actor);ready();if(!['approve','reject'].includes(decision)||typeof note!=='string'||note.length>200)throw fail(400,'Keputusan semakan tidak sah.');
      const previous=await load(id,actor);if(previous.record.lifecycle?.state==='deleted')throw fail(409,'Halaman telah dipadam.');
      const renewal=previous.record.renewal;if(!renewal||renewal.id!==requestId)throw fail(409,'Permohonan telah berubah. Muat semula.');
      const target=decision==='approve'?'approved':'rejected';
      if(renewal.status===target)return view(id,previous,actor);
      if(renewal.status!=='pending'||previous.revision!==revision)throw fail(409,'Permohonan telah disemak atau rekod berubah. Muat semula.');
      const changes={renewal:{...renewal,status:target,note:note.trim(),decidedAt:new Date(now()).toISOString(),decidedBy:actor.email}};
      if(decision==='approve'){
        if(confirmBank!==true)throw fail(400,'Sahkan wang benar-benar diterima dalam akaun bank sebelum meluluskan.');
        const key=hash(renewal.paidDate+'|'+renewal.reference.toUpperCase().replaceAll(/\s/g,''));
        const claim={pageId:id,requestId:renewal.id,amountCents:renewal.amountCents,claimedAt:new Date(now()).toISOString(),claimedBy:actor.email};
        if(!await store.claimPayment(key,claim)){
          const existing=await store.getPayment(key);if(existing?.pageId!==id||existing?.requestId!==renewal.id)throw fail(409,'Rujukan bayaran ini sudah digunakan. Semak transaksi bank.');
        }
        const old=previous.record.subscription;
        if(renewal.months===12){
          const expiry=Date.parse(old?.expiresAt||''),start=Math.max(Number.isFinite(expiry)?expiry:0,now());
          changes.subscription={plan:'annual',currency:'MYR',lastOrderCents:renewal.amountCents,renewalCents:3000,startsAt:old?.startsAt||new Date(now()).toISOString(),expiresAt:annualEnd(start),lastPaymentId:renewal.id};
        }else if(old?.plan!=='annual'||!old.lastPaymentId){changes.subscription={plan:'nfc_only',currency:'MYR',lastPaymentId:renewal.id};}
      }
      const saved=await savePage({store,id,previous,revision,changes,actor,now});return view(id,saved,actor);
    },
  };
}
