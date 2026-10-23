import sharp from 'sharp';
import {randomBytes} from 'node:crypto';
import {ownerKey} from './identity.mjs';
import {validId,profileURL,savePage,pageView} from './admin.mjs';
import {requirePublicPage} from './page-state.mjs';

sharp.cache({memory:16,files:0,items:20});sharp.concurrency(1);
let processing=false;
export const MAX_COVER_INPUT=5*1024*1024,MAX_COVER_STORED=500*1024;
const fail=(status,message)=>Object.assign(new Error(message),{status});
export async function normalizeCover(bytes){
  if(!bytes.length||bytes.length>MAX_COVER_INPUT)throw fail(413,'Saiz gambar mesti 5 MB atau kurang.');
  if(processing)throw fail(429,'Satu gambar sedang diproses. Cuba lagi sebentar.');
  processing=true;
  try {
    const image=sharp(bytes,{limitInputPixels:25000000,animated:false,failOn:'warning'});
    const info=await image.metadata();
    if(!['jpeg','png','webp'].includes(info.format)||(info.pages||1)!==1)throw 0;
    const output=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:78,effort:4}).toBuffer();
    if(output.length>MAX_COVER_STORED)throw fail(413,'Gambar terlalu rumit. Cuba gambar dengan resolusi lebih kecil.');
    return output;
  } catch(error){if(error.status)throw error;throw fail(415,'Gunakan gambar JPG, PNG atau WebP yang sah, tanpa animasi, maksimum 25 megapiksel.');}finally{processing=false;}
}
export function createCoverMedia({store,mediaStore,mediaOrigin,origin='https://tap.imai.my',now=Date.now}){
  async function editable(id,actor){
    validId(id);const item=await store.getVersion(id);if(!item||item.record.lifecycle?.state==='deleted')throw fail(404,'Halaman tidak ditemui.');
    if(actor?.role!=='admin'){
      if(actor?.role!=='user'||!item.record.ownerEmail||ownerKey(item.record.ownerEmail)!==ownerKey(actor.email))throw fail(404,'Halaman tidak tersedia untuk Gmail anda.');
      requirePublicPage(item.record,now());
    }
    return item;
  }
  return {
    async upload(id,actor,read,revision){
      const previous=await editable(id,actor);
      if(previous.revision!==revision)throw fail(409,'Halaman telah berubah. Muat semula sebelum menukar cover.');
      const day=new Date(now()).toISOString().slice(0,10),counter=previous.record.coverUploads;
      if(counter?.day===day&&counter.count>=20)throw fail(429,'Had 20 pertukaran cover sehari telah dicapai.');
      const bytes=await normalizeCover(await read());
      const name=id+'/'+randomBytes(12).toString('hex')+'.webp';
      await mediaStore.put(name,bytes);
      const profile=JSON.parse(Buffer.from(new URL(previous.record.url).searchParams.get('p'),'base64url').toString());
      profile.cover=mediaOrigin+'/api/media/'+name;
      const saved=await savePage({store,id,previous,revision:previous.revision,changes:{url:profileURL(profile,origin),coverUploads:{day,count:counter?.day===day?counter.count+1:1}},actor,now});
      return pageView({id,...saved},origin,actor.role==='admin',now());
    },
    async read(name){
      if(!/^[A-Za-z0-9_-]{16}\/[a-f0-9]{24}\.webp$/.test(name))throw fail(404,'Gambar tidak ditemui.');
      const id=name.split('/')[0],item=await store.getVersion(id);if(!item)throw fail(404,'Gambar tidak ditemui.');
      requirePublicPage(item.record,now());
      const profile=JSON.parse(Buffer.from(new URL(item.record.url).searchParams.get('p'),'base64url').toString());
      if(profile.cover!==mediaOrigin+'/api/media/'+name)throw fail(404,'Gambar tidak ditemui.');
      const bytes=await mediaStore.get(name);if(!bytes)throw fail(404,'Gambar tidak ditemui.');return bytes;
    }
  };
}
export function createCloudMediaStore({bucket,getToken,fetcher=fetch}){
  if(!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket||''))throw new Error('Invalid cover bucket');
  const object=name=>{if(!/^[A-Za-z0-9_-]{16}\/[a-f0-9]{24}\.webp$/.test(name))throw new Error('Invalid cover name');return 'media/'+name;};
  return {
    async put(name,bytes){const url=new URL('https://storage.googleapis.com/upload/storage/v1/b/'+bucket+'/o');url.searchParams.set('uploadType','media');url.searchParams.set('name',object(name));url.searchParams.set('ifGenerationMatch','0');const r=await fetcher(url,{method:'POST',headers:{Authorization:'Bearer '+await getToken(),'Content-Type':'image/webp'},body:bytes,signal:AbortSignal.timeout(15000)});if(!r.ok)throw fail(503,'Gambar belum dapat disimpan. Cuba lagi.');},
    async get(name){const url='https://storage.googleapis.com/storage/v1/b/'+bucket+'/o/'+encodeURIComponent(object(name))+'?alt=media';const r=await fetcher(url,{headers:{Authorization:'Bearer '+await getToken()},signal:AbortSignal.timeout(10000)});if(r.status===404)return null;if(!r.ok)throw fail(503,'Gambar belum tersedia.');return Buffer.from(await r.arrayBuffer());}
  };
}
