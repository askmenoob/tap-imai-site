import {randomBytes} from 'node:crypto';
import {ownerKey} from './identity.mjs';
import {validId,savePage,pageView} from './admin.mjs';
import {requirePublicPage} from './page-state.mjs';
import {normalizeCatalogImage} from './cover-media.mjs';
import {catalogURL} from './service-catalog-schema.mjs';
export const MAX_CATALOG_IMAGE=2*1024*1024;
const fail=(status,message)=>Object.assign(new Error(message),{status});
const owns=(record,actor)=>{try{return actor?.role==='admin'||(actor?.role==='user'&&record.ownerEmail&&ownerKey(record.ownerEmail)===ownerKey(actor.email));}catch{return false;}};
export function createServiceCatalog({store,mediaStore,origin='https://tap.imai.my',mediaOrigin='https://tap-business-import-262870839474.asia-southeast1.run.app',now=Date.now}){
 async function load(id){validId(id);const page=await store.getVersion(id);if(!page)throw fail(404,'Katalog tidak ditemui.');return page;}
 function published(id,record){requirePublicPage(record,now());const profile=JSON.parse(Buffer.from(new URL(record.url).searchParams.get('p'),'base64url'));if(!record.catalog?.enabled||profile.menu!==catalogURL(origin,id))throw fail(404,'Katalog tidak diterbitkan.');return profile;}
 return {
  async preview(id,file,actor){if(!/^[a-f0-9]{24}\.webp$/.test(file))throw fail(404,'Gambar tidak ditemui.');const {record}=await load(id);if(record.lifecycle?.state==='deleted'||!owns(record,actor))throw fail(404,'Halaman tidak tersedia untuk Gmail anda.');const bytes=await mediaStore.get(id+'/'+file);if(!bytes)throw fail(404,'Gambar tidak ditemui.');return bytes;},
  async public(id){const {record}=await load(id),profile=published(id,record);return {name:profile.name,label:profile.menuLabel||'Menu & katalog',theme:profile.theme||'classic',accent:profile.accent||'#20543e',logo:profile.logo||'',whatsapp:profile.whatsapp||'',pageURL:origin+'/?s='+id,catalog:{v:1,kind:record.catalog.kind,items:record.catalog.items.filter(item=>item.status!=='hidden')}};},
  async upload(id,actor,read,revision){const previous=await load(id);if(previous.record.lifecycle?.state==='deleted'||!owns(previous.record,actor))throw fail(404,'Halaman tidak tersedia untuk Gmail anda.');if(actor.role!=='admin')requirePublicPage(previous.record,now());if(revision!==previous.revision)throw fail(409,'Halaman telah berubah. Muat semula sebelum memuat naik gambar.');
   const day=new Date(now()).toISOString().slice(0,10),counter=previous.record.catalogUploads;if(counter?.day===day&&counter.count>=60)throw fail(429,'Had 60 gambar katalog sehari telah dicapai.');
   const bytes=await normalizeCatalogImage(await read()),name=id+'/'+randomBytes(12).toString('hex')+'.webp';await mediaStore.put(name,bytes);
   const saved=await savePage({store,id,previous,revision,changes:{catalogUploads:{day,count:counter?.day===day?counter.count+1:1}},actor,now});if(!owns(saved.record,actor))throw fail(404,'Halaman tidak tersedia untuk Gmail anda.');
   return {page:pageView({id,...saved},origin,actor.role==='admin',now()),url:mediaOrigin+'/api/catalog-media/'+name};
  },
  async image(name){if(!/^[A-Za-z0-9_-]{16}\/[a-f0-9]{24}\.webp$/.test(name))throw fail(404,'Gambar tidak ditemui.');const id=name.split('/')[0],{record}=await load(id);published(id,record);if(!record.catalog.items.some(item=>item.status!=='hidden'&&item.photo===mediaOrigin+'/api/catalog-media/'+name))throw fail(404,'Gambar tidak ditemui.');const bytes=await mediaStore.get(name);if(!bytes)throw fail(404,'Gambar tidak ditemui.');return bytes;},
 };
}
