import {createGoogleIdentityAuth} from './identity.mjs';
import {validateSmartTapURL} from './short-links.mjs';
import {malaysiaPhone,whatsappFromPhone,threadsProfile} from './contacts.mjs';
import {pageState} from './page-state.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
export function createGoogleAdminAuth({clientId,emails=[],keySet}) {
  const allowed=new Set(emails.map(email=>email.trim().toLowerCase()).filter(Boolean));
  const verify=createGoogleIdentityAuth({clientId,keySet});
  return async authorization=>{
    if(!clientId||!allowed.size) throw fail(503,'Login super admin belum dikonfigurasi.');
    const actor=await verify(authorization);
    if(!allowed.has(actor.email))throw fail(403,'Akaun Google ini bukan super admin SmartTap.');
    return {...actor,role:'admin'};
  };
}
export function validId(id){if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(id))throw fail(404,'Pautan tidak ditemui.');}
export function pageView({id,record,revision},origin='https://tap.imai.my',includeOwner=false,now=Date.now()){
  const url=validateSmartTapURL(record.url,origin);
  return {id,url:origin+'/?s='+id,profile:JSON.parse(Buffer.from(new URL(url).searchParams.get('p'),'base64url').toString('utf8')),
    revision,createdAt:record.createdAt||null,updatedAt:record.updatedAt||record.createdAt||null,state:pageState(record,now),manualState:record.lifecycle?.state||'active',subscription:record.subscription||null,
    renewal:record.renewal?Object.fromEntries(Object.entries(record.renewal).filter(([key])=>includeOwner||!['submittedBy','decidedBy'].includes(key))):null,...(includeOwner?{ownerEmail:record.ownerEmail||''}:{})};
}
export function profileURL(value,origin='https://tap.imai.my'){
  if(!value||typeof value!=='object'||Array.isArray(value))throw fail(400,'Maklumat suntingan tidak sah.');
  const profile={...value};
  for(const [key,field] of Object.entries(profile))if(key!=='v'&&typeof field==='string')profile[key]=field.normalize('NFC').trim();
  if(profile.phone){const phone=malaysiaPhone(profile.phone);if(!phone)throw fail(400,'Nombor telefon Malaysia tidak sah.');profile.phone=phone;if(!profile.whatsapp)profile.whatsapp=whatsappFromPhone(phone);}
  if(profile.threads&&!threadsProfile(profile.threads))throw fail(400,'Gunakan pautan profil Threads yang sah.');
  return validateSmartTapURL(origin+'/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url'),origin);
}
export async function savePage({store,id,previous,revision,changes,actor,now=Date.now}){
  if(typeof revision!=='string'||!/^\d{1,30}$/.test(revision))throw fail(400,'Maklumat suntingan tidak sah.');
  if(previous.revision!==revision)throw fail(409,'Rekod ini telah disunting. Muat semula senarai sebelum menyimpan.');
  const updatedAt=new Date(now()).toISOString();
  await store.archive(id,revision,{...previous.record,archivedAt:updatedAt,archivedBy:actor.email});
  const record={...previous.record,...changes,updatedAt,updatedBy:actor.email};
  if(!await store.update(id,record,revision))throw fail(409,'Rekod ini telah disunting. Muat semula senarai sebelum menyimpan.');
  return store.getVersion(id);
}
export function createAdminService({store,origin='https://tap.imai.my',now=Date.now}) {
  const view=item=>pageView(item,origin,true,now());
  let pendingCache=null,pendingFlight=null,epoch=0;
  const invalidatePending=()=>{epoch++;pendingCache=null;pendingFlight=null;};
  async function pendingPayments(){
    if(pendingCache&&now()-pendingCache.at<60000)return pendingCache.result;
    if(pendingFlight)return pendingFlight;
    const version=epoch;
    const flight=(async()=>{
      const items=[];let cursor=null;const seen=new Set();
      do{
        const page=await store.list(cursor);
        for(const entry of page.items){
          const r=entry.record;
          if(r.renewal?.status!=='pending'||r.lifecycle?.state==='deleted')continue;
          const item=view(entry);
          items.push({id:item.id,name:item.profile.name,amountCents:item.renewal.amountCents,submittedAt:item.renewal.submittedAt});
        }
        cursor=page.cursor;
        if(cursor&&seen.has(cursor))throw fail(503,'Senarai bayaran belum dapat dimuatkan.');
        if(cursor)seen.add(cursor);
      }while(cursor);
      items.sort((a,b)=>(a.submittedAt||'').localeCompare(b.submittedAt||'')||a.id.localeCompare(b.id));
      const result={items,count:items.length,checkedAt:new Date(now()).toISOString()};
      if(version===epoch)pendingCache={at:now(),result};
      return result;
    })();
    pendingFlight=flight;
    try{return await flight;}finally{if(pendingFlight===flight)pendingFlight=null;}
  }
  return {
    pendingPayments,invalidatePending,
    async get(id){validId(id);const item=await store.getVersion(id);if(!item)throw fail(404,'Pautan tidak ditemui.');return view({id,...item});},
    async list(cursor) {
      if(cursor!==undefined&&cursor!==null&&(typeof cursor!=='string'||cursor.length>2048||!/^[-A-Za-z0-9_+/=]*$/.test(cursor))) throw fail(400,'Halaman senarai tidak sah.');
      const page=await store.list(cursor);
      return {items:page.items.map(view),cursor:page.cursor};
    },
    async update(id,{profile,revision}={},actor) {
      validId(id);
      if(typeof revision!=='string'||!/^\d{1,30}$/.test(revision)||!profile||typeof profile!=='object'||Array.isArray(profile)) throw fail(400,'Maklumat suntingan tidak sah.');
      if(!actor?.email) throw fail(403,'Login super admin diperlukan.');
      const url=profileURL(profile,origin);
      const previous=await store.getVersion(id);
      if(!previous)throw fail(404,'Pautan tidak ditemui.');
      const saved=await savePage({store,id,previous,revision,changes:{v:1,url},actor,now});
      return view({id,...saved});
    },
  };
}
