import {applyServiceCatalog} from './service-catalog-schema.mjs';
import {randomBytes} from 'node:crypto';
import {gmailAddress,ownerKey} from './identity.mjs';
import {validId,pageView,profileURL,savePage} from './admin.mjs';
import {validateSmartTapURL} from './short-links.mjs';
import {requirePublicPage} from './page-state.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const notFound=()=>fail(404,'Halaman ini tidak tersedia untuk akaun Gmail anda.');
function requireAdmin(actor){if(actor?.role!=='admin'||!actor.email)throw fail(403,'Hanya super admin boleh mendaftarkan Gmail pemilik.');}
function userKey(actor){if(actor?.role!=='user')throw fail(403,'Login Gmail diperlukan.');return ownerKey(actor.email);}
function owns(record,key){try{return !!record.ownerEmail&&ownerKey(record.ownerEmail)===key;}catch{return false;}}
function validCursor(cursor){if(cursor!==undefined&&cursor!==null&&(typeof cursor!=='string'||cursor.length>2048||!/^[-A-Za-z0-9_+/=]*$/.test(cursor)))throw fail(400,'Halaman senarai tidak sah.');}
export function createCustomerService({store,origin='https://tap.imai.my',mediaOrigin='https://tap-business-import-262870839474.asia-southeast1.run.app',now=Date.now,newId=()=>randomBytes(12).toString('base64url'),newSubscription=null,trialEnabled=false}){
  const view=(id,item,admin=false)=>pageView({id,...item},origin,admin,now());
  async function owned(id,actor){validId(id);const key=userKey(actor);const item=await store.getVersion(id);if(!item||item.record.lifecycle?.state==='deleted'||!owns(item.record,key))throw notFound();return item;}
  return {
    async register({url,email}={},actor){
      requireAdmin(actor);email=gmailAddress(email);url=validateSmartTapURL(url,origin);
      for(let attempt=0;attempt<3;attempt++){
        const id=newId();validId(id);
        // Membership is discoverability only; each read/write rechecks the primary record.
        await store.grantOwner(ownerKey(email),id);
        const createdAt=new Date(now()).toISOString();
        const trial=trialEnabled?{startedAt:createdAt,expiresAt:new Date(Date.parse(createdAt)+24*60*60*1000).toISOString()}:null;
        if(await store.create(id,{v:1,url,createdAt,ownerEmail:email,ownerRegisteredAt:createdAt,ownerRegisteredBy:actor.email,...(trial?{trial}:{}),...(newSubscription?{subscription:structuredClone(newSubscription)}:{})}))return view(id,await store.getVersion(id),true);
      }
      throw fail(503,'Pendaftaran belum dapat disimpan. Cuba lagi.');
    },
    async assign(id,{email,revision}={},actor){
      requireAdmin(actor);validId(id);email=gmailAddress(email);
      const previous=await store.getVersion(id);if(!previous)throw fail(404,'Pautan tidak ditemui.');
      if(previous.revision!==revision)throw fail(409,'Rekod telah berubah. Muat semula sebelum mendaftarkan Gmail.');
      if(previous.record.paymentResolution)throw fail(409,'Penyelesaian bayaran sedang diproses. Selesaikan semakan sebelum menukar Gmail pemilik.');
      await store.grantOwner(ownerKey(email),id);
      const saved=await savePage({store,id,previous,revision,changes:{ownerEmail:email,ownerRegisteredAt:new Date(now()).toISOString(),ownerRegisteredBy:actor.email},actor,now});
      return view(id,saved,true);
    },
    async list(actor,cursor){
      const key=userKey(actor);validCursor(cursor);const page=await store.listOwner(key,cursor);
      const items=await Promise.all(page.ids.map(async id=>{const item=await store.getVersion(id);return item&&item.record.lifecycle?.state!=='deleted'&&owns(item.record,key)?view(id,item):null;}));
      return {items:items.filter(Boolean),cursor:page.cursor};
    },
    async get(id,actor){return view(id,await owned(id,actor));},
    async update(id,data,actor){
      const previous=await owned(id,actor);
      requirePublicPage(previous.record,now());
      if(!data||Object.keys(data).some(key=>!['profile','revision','catalog'].includes(key)))throw fail(400,'Anda hanya boleh menyunting maklumat halaman sendiri.');
      const original=JSON.parse(Buffer.from(new URL(previous.record.url).searchParams.get('p'),'base64url'));
      if(data.profile?.googleStatus&&data.profile.googleStatus!==original.googleStatus)throw fail(403,'Hanya super admin boleh menukar status Google Review.');
      const profile={...data.profile};
      if(original.googleStatus==='pending'){profile.google='';profile.googleStatus='pending';}
      const applied=applyServiceCatalog(profile,data.catalog,{id,origin,mediaOrigin});
      const url=profileURL(applied.profile,origin);
      const saved=await savePage({store,id,previous,revision:data.revision,changes:{v:1,url,...(applied.catalog?{catalog:applied.catalog}:{})},actor,now});
      // A subsequent admin reassignment must never expose another owner's record in this reply.
      if(!owns(saved.record,userKey(actor)))throw notFound();
      return view(id,saved);
    },
  };
}
