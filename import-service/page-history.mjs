import {validId,profileURL,savePage,pageView} from './admin.mjs';
import {validateSmartTapURL} from './short-links.mjs';
import {applyServiceCatalog,catalogURL} from './service-catalog-schema.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const revision=value=>typeof value==='string'&&/^\d{1,30}$/.test(value);
const admin=actor=>{if(actor?.role!=='admin'||typeof actor.email!=='string'||!actor.email.trim())throw fail(403,'Hanya super admin boleh melihat atau memulihkan sejarah halaman.');};
const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;
const actorLabel=value=>typeof value==='string'&&value.length<=254&&!/[\u0000-\u001f]/.test(value)?value:null;

export function createPageHistory({store,origin='https://tap.imai.my',mediaOrigin='https://tap-business-import-262870839474.asia-southeast1.run.app',now=Date.now}){
  async function load(id){validId(id);const item=await store.getVersion(id);if(!item)throw fail(404,'Halaman tidak ditemui.');return item;}
  function content(id,record){
    try{
      const url=validateSmartTapURL(record?.url,origin);
      const profile=JSON.parse(Buffer.from(new URL(url).searchParams.get('p'),'base64url').toString('utf8'));
      // A historical snapshot can restore content, never another page's uploaded media.
      for(const field of ['cover','logo'])if(profile[field]){
        const asset=new URL(profile[field]);
        if(asset.origin===new URL(mediaOrigin).origin&&/^\/api\/(?:media|catalog-media)(?:\/|$)/.test(asset.pathname)){
          const expected=mediaOrigin+'/api/media/'+id+'/';
          if(field!=='cover'||!profile[field].startsWith(expected)||!/^[a-f0-9]{24}\.webp$/.test(profile[field].slice(expected.length)))throw 0;
        }
      }
      if(profile.menu){const menu=new URL(profile.menu);if(menu.origin===origin&&/^\/menu\/?$/.test(menu.pathname)&&profile.menu!==catalogURL(origin,id))throw 0;}
      const catalog=record.catalog??{v:1,enabled:false,kind:'custom',items:[]};
      const applied=applyServiceCatalog(profile,catalog,{id,origin,mediaOrigin});
      return {url:profileURL(applied.profile,origin),catalog:applied.catalog,name:applied.profile.name};
    }catch{throw fail(400,'Versi sejarah tidak sah atau mengandungi media/katalog halaman lain. Versi ini tidak boleh dipulihkan.');}
  }
  return {
    async list(id,actor,cursor){
      admin(actor);const current=await load(id);
      if(cursor!==undefined&&cursor!==null&&(typeof cursor!=='string'||cursor.length>2048||!/^[-A-Za-z0-9_+/=]*$/.test(cursor)))throw fail(400,'Halaman sejarah tidak sah.');
      const history=await store.listHistory(id,cursor);
      const items=history.items.map(item=>{
        let name='Versi tidak sah',restorable=false;
        if(revision(item.revision)){try{name=content(id,item.record).name;restorable=true;}catch{}}
        return {revision:item.revision,name,archivedAt:date(item.record?.archivedAt),updatedAt:date(item.record?.updatedAt)||date(item.record?.createdAt),changedBy:actorLabel(item.record?.archivedBy),restorable};
      });
      return {items,cursor:history.cursor||null,revision:current.revision};
    },
    async restore(id,data,actor){
      admin(actor);
      if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>!['sourceRevision','revision','note'].includes(key))||!revision(data.sourceRevision)||!revision(data.revision))throw fail(400,'Maklumat pemulihan tidak sah.');
      const note=typeof data.note==='string'?data.note.normalize('NFC').trim():'';
      if(!note||note.length>200||/[\u0000-\u001f]/.test(note))throw fail(400,'Masukkan sebab pemulihan, maksimum 200 aksara.');
      const previous=await load(id);
      if(previous.record.lifecycle?.state==='deleted')throw fail(409,'Pulihkan halaman yang dipadam dahulu sebelum memulihkan kandungannya.');
      if(previous.revision!==data.revision)throw fail(409,'Halaman telah berubah. Muat semula sebelum memulihkan kandungan.');
      const historical=await store.getHistory(id,data.sourceRevision);
      if(!historical)throw fail(404,'Versi sejarah tidak ditemui.');
      const restored=content(id,historical);
      const contentRestoration={sourceRevision:data.sourceRevision,previousRevision:previous.revision,note,restoredAt:new Date(now()).toISOString(),restoredBy:actor.email};
      const saved=await savePage({store,id,previous,revision:data.revision,changes:{url:restored.url,catalog:restored.catalog,contentRestoration},actor,now});
      return pageView({id,...saved},origin,true,now());
    },
  };
}
