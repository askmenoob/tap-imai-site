import {createRemoteJWKSet,jwtVerify} from 'jose';
import {validateSmartTapURL} from './short-links.mjs';
import {malaysiaPhone,whatsappFromPhone,threadsProfile} from './contacts.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:5000});
export function createGoogleAdminAuth({clientId,emails=[],keySet=googleKeys}) {
  const allowed=new Set(emails.map(email=>email.trim().toLowerCase()).filter(Boolean));
  return async authorization=>{
    if(!clientId||!allowed.size) throw fail(503,'Login super admin belum dikonfigurasi.');
    if(typeof authorization!=='string'||authorization.length>12000||!/^Bearer [A-Za-z0-9._-]+$/.test(authorization)) throw fail(401,'Log masuk dengan Google terlebih dahulu.');
    let payload;
    try {
      ({payload}=await jwtVerify(authorization.slice(7),keySet,{audience:clientId,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256'],requiredClaims:['sub','exp','iat'],maxTokenAge:'70m',clockTolerance:5}));
    } catch {throw fail(401,'Sesi Google tamat atau tidak sah. Log masuk semula.');}
    if(payload.email_verified!==true||typeof payload.email!=='string'||!allowed.has(payload.email.toLowerCase())) throw fail(403,'Akaun Google ini bukan super admin SmartTap.');
    return {sub:payload.sub,email:payload.email.toLowerCase(),expiresAt:payload.exp*1000};
  };
}
function validId(id){if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(id))throw fail(404,'Pautan tidak ditemui.');}
export function createAdminService({store,origin='https://tap.imai.my',now=Date.now}) {
  function view({id,record,revision}) {
    const url=validateSmartTapURL(record.url,origin);
    return {id,url:origin+'/?s='+id,profile:JSON.parse(Buffer.from(new URL(url).searchParams.get('p'),'base64url').toString('utf8')),
      revision,createdAt:record.createdAt||null,updatedAt:record.updatedAt||record.createdAt||null};
  }
  return {
    async list(cursor) {
      if(cursor!==undefined&&cursor!==null&&(typeof cursor!=='string'||cursor.length>2048||!/^[-A-Za-z0-9_+/=]*$/.test(cursor))) throw fail(400,'Halaman senarai tidak sah.');
      const page=await store.list(cursor);
      return {items:page.items.map(view),cursor:page.cursor};
    },
    async update(id,{profile,revision}={},actor) {
      validId(id);
      if(typeof revision!=='string'||!/^\d{1,30}$/.test(revision)||!profile||typeof profile!=='object'||Array.isArray(profile)) throw fail(400,'Maklumat suntingan tidak sah.');
      if(!actor?.email) throw fail(403,'Login super admin diperlukan.');
      profile={...profile};
      for(const [key,value] of Object.entries(profile)) if(key!=='v'&&typeof value==='string') profile[key]=value.normalize('NFC').trim();
      if(profile.phone) {
        const phone=malaysiaPhone(profile.phone);if(!phone)throw fail(400,'Nombor telefon Malaysia tidak sah.');
        profile.phone=phone;if(!profile.whatsapp)profile.whatsapp=whatsappFromPhone(phone);
      }
      if(profile.threads&&!threadsProfile(profile.threads))throw fail(400,'Gunakan pautan profil Threads yang sah.');
      const url=validateSmartTapURL(origin+'/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url'),origin);
      const previous=await store.getVersion(id);
      if(!previous)throw fail(404,'Pautan tidak ditemui.');
      if(previous.revision!==revision)throw fail(409,'Rekod ini telah disunting. Muat semula senarai sebelum menyimpan.');
      const updatedAt=new Date(now()).toISOString();
      // Preserve a private immutable copy before the conditional replacement.
      await store.archive(id,revision,{...previous.record,archivedAt:updatedAt,archivedBy:actor.email});
      const record={...previous.record,v:1,url,updatedAt,updatedBy:actor.email};
      if(!await store.update(id,record,revision))throw fail(409,'Rekod ini telah disunting. Muat semula senarai sebelum menyimpan.');
      const saved=await store.getVersion(id);
      return view({id,...saved});
    },
  };
}
