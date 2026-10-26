import {xProfile} from './contacts.mjs';
import {createHmac} from 'node:crypto';
import {requirePublicPage} from './page-state.mjs';
import {appearanceFields,validateAppearance} from './appearance.mjs';

const urlFields=['logo','google','instagram','facebook','tiktok','threads','x','whatsapp','website','cover','menu','directions','promoURL'];
const fields=new Set(['v','name','tagline','phone','googleStatus',...urlFields,...Object.keys(appearanceFields)]);
const invalid=()=>Object.assign(new Error('Gunakan pautan halaman SmartTap yang telah dijana.'),{status:400});
export function validateSmartTapURL(value,origin='https://tap.imai.my') {
  try {
    if(typeof value!=='string'||value.length>17000) throw 0;
    const url=new URL(value);
    if(url.origin!==origin||url.username||url.password||url.pathname!=='/'||url.hash||[...url.searchParams.keys()].join()!=='p') throw 0;
    const encoded=url.searchParams.get('p');
    if(!encoded||encoded.length>16384||!/^[A-Za-z0-9_-]+$/.test(encoded)) throw 0;
    const bytes=Buffer.from(encoded,'base64url');
    if(bytes.toString('base64url')!==encoded) throw 0;
    const profile=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!profile||typeof profile!=='object'||Array.isArray(profile)||profile.v!==1||typeof profile.name!=='string'||!profile.name.trim()||[...profile.name].length>80) throw 0;
    for(const [key,field] of Object.entries(profile)) if(!fields.has(key)||(key!=='v'&&typeof field!=='string')) throw 0;
    if((profile.tagline||'').length>140||(profile.phone||'').length>30) throw 0;
    validateAppearance(profile);
    for(const key of urlFields) if(profile[key]) {
      const link=new URL(profile[key]);
      if((link.protocol!=='https:'&&!(['cover','menu'].includes(key)&&origin.startsWith('http://127.0.0.1:')&&link.origin===origin))||link.username||link.password||(link.port&&link.port!=='443'&&!(['cover','menu'].includes(key)&&origin.startsWith('http://127.0.0.1:')&&link.origin===origin))||link.href.length>500) throw 0;
    }
    if(profile.x&&!xProfile(profile.x))throw 0;
    if(profile.googleStatus!==undefined&&profile.googleStatus!=='pending')throw 0;
    if(profile.googleStatus==='pending'){if(profile.google)throw 0;return url.href;}
    const review=new URL(profile.google);const host=review.hostname;
    const google=(host==='google.com'||host.endsWith('.google.com')||host==='google.com.my'||host.endsWith('.google.com.my'))&&review.pathname.includes('/local/writereview')&&review.searchParams.get('placeid');
    const gpage=host==='g.page'&&/\/r\/[^/]+\/review\/?$/i.test(review.pathname);
    if(!google&&!gpage) throw 0;
    return url.href;
  } catch {throw invalid();}
}
export function createShortLinks({store,secret,origin='https://tap.imai.my',now=Date.now,newSubscription=null}) {
  if(!store||!secret||secret.length<32) throw new Error('Configure short link storage and signing secret.');
  return {
    async shorten(value) {
      const url=validateSmartTapURL(value,origin);
      if(JSON.parse(Buffer.from(new URL(url).searchParams.get('p'),'base64url')).googleStatus)throw invalid();
      for(let attempt=0;attempt<3;attempt++) {
        const id=createHmac('sha256',secret).update(`${attempt}:${url}`).digest('base64url').slice(0,16);
        const created=await store.create(id,{v:1,url,createdAt:new Date(now()).toISOString(),...(newSubscription?{subscription:structuredClone(newSubscription)}:{})});
        const existing=created?null:await store.get(id);
        if(created || (existing?.url===url&&existing.lifecycle?.state!=='deleted')) {
          return {id,url:origin+'/?s='+id};
        }
      }
      throw new Error('Pautan pendek tidak dapat disimpan. Cuba lagi.');
    },
    async resolve(id) {
      if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(id)) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      const record=await store.get(id);
      if(!record) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      requirePublicPage(record,now());
      // Read the durable record so edits made by another instance take effect on the next scan.
      const url=validateSmartTapURL(record.url,origin);return {url};
    },
  };
}

export function createCloudLinkStore({bucket,getToken,fetcher=fetch}) {
  if(!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket||'')) throw new Error('Invalid short link bucket.');
  const object=id=>'links/'+id+'.json';
  function gatewayObject(id){if(!/^ST[a-f0-9]{24}$/.test(id||''))throw new Error('Invalid checkout ID.');return 'checkout/'+id+'.json';}
  function ownerPrefix(key){if(!/^[A-Za-z0-9_-]{43}$/.test(key||''))throw new Error('Invalid owner key.');return 'owners/'+key+'/';}
  const base='https://storage.googleapis.com/storage/v1/b/'+bucket+'/o/';
  async function request(url,options={}) {
    const response=await fetcher(url,{...options,headers:{Authorization:'Bearer '+await getToken(),...options.headers},signal:AbortSignal.timeout(10000)});
    if(response.status===404) return null;
    if(response.status===412) return false;
    if(!response.ok) throw new Error('Short link storage unavailable');
    return response.json();
  }
  async function read(id,generation) {
    const url=new URL(base+encodeURIComponent(object(id)));url.searchParams.set('alt','media');
    if(generation) url.searchParams.set('generation',generation);
    return request(url);
  }
  async function write(name,record,revision='0') {
    const endpoint=new URL('https://storage.googleapis.com/upload/storage/v1/b/'+bucket+'/o');
    endpoint.searchParams.set('uploadType','media');endpoint.searchParams.set('name',name);endpoint.searchParams.set('ifGenerationMatch',revision);
    const result=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});
    if(result===false)return false;
    if(!result)throw new Error('Short link storage unavailable');
    return true;
  }
  return {
    async create(id,record) {
      const endpoint=new URL('https://storage.googleapis.com/upload/storage/v1/b/'+bucket+'/o');
      endpoint.searchParams.set('uploadType','media');endpoint.searchParams.set('name',object(id));endpoint.searchParams.set('ifGenerationMatch','0');
      const response=await fetcher(endpoint,{method:'POST',headers:{Authorization:'Bearer '+await getToken(),'Content-Type':'application/json'},body:JSON.stringify(record),signal:AbortSignal.timeout(10000)});
      if(response.status===412) return false;
      if(!response.ok) throw new Error('Short link storage unavailable');
      return true;
    },
    async get(id){const record=await read(id);return record?.permanentlyDeleted?null:record;},
    async getVersion(id) {
      const metadata=await request(base+encodeURIComponent(object(id)));
      if(!metadata) return null;
      const record=await read(id,metadata.generation);
      if(!record) throw Object.assign(new Error('Rekod telah berubah. Muat semula senarai.'),{status:409});
      if(record.permanentlyDeleted)return null;
      return {record,revision:metadata.generation};
    },
    async list(cursor) {
      const url=new URL(base);url.searchParams.set('prefix','links/');url.searchParams.set('maxResults','25');
      url.searchParams.set('fields','items(name,generation),nextPageToken');
      if(cursor)url.searchParams.set('pageToken',cursor);
      const page=await request(url);
      const entries=(page.items||[]).filter(item=>/^links\/[A-Za-z0-9_-]{16}\.json$/.test(item.name));
      const items=await Promise.all(entries.map(async item=>{
        const id=item.name.slice(6,-5);const record=await read(id,item.generation);
        if(!record) throw Object.assign(new Error('Senarai telah berubah. Muat semula senarai.'),{status:409});
        if(record.permanentlyDeleted)return null;
        return {id,record,revision:item.generation};
      }));
      return {items:items.filter(Boolean),cursor:page.nextPageToken||null};
    },
    createGatewayOrder:(id,record)=>write(gatewayObject(id),record),
    async getGatewayOrder(id){
      const name=gatewayObject(id),metadata=await request(base+encodeURIComponent(name));if(!metadata)return null;
      const data=await request(base+encodeURIComponent(name)+'?alt=media&generation='+encodeURIComponent(metadata.generation));
      if(!data)throw Object.assign(new Error('Pesanan telah berubah.'),{status:409});
      return {record:data,revision:metadata.generation};
    },
    updateGatewayOrder:(id,record,revision)=>write(gatewayObject(id),record,revision),
    async listGatewayOrders(cursor){
      const url=new URL(base);url.searchParams.set('prefix','checkout/');url.searchParams.set('maxResults','25');url.searchParams.set('fields','items(name,generation),nextPageToken');
      if(cursor)url.searchParams.set('pageToken',cursor);
      const page=await request(url),items=[];
      for(const meta of page.items||[]){
        if(!/^checkout\/ST[a-f0-9]{24}\.json$/.test(meta.name))continue;
        const record=await request(base+encodeURIComponent(meta.name)+'?alt=media&generation='+encodeURIComponent(meta.generation));
        if(!record)throw Object.assign(new Error('Senarai pesanan berubah. Muat semula.'),{status:409});
        items.push({record,revision:meta.generation});
      }
      return {items,cursor:page.nextPageToken||null};
    },
    async listHistory(id,cursor){
      if(!/^[A-Za-z0-9_-]{16}$/.test(id||''))throw new Error('Invalid link ID.');
      const prefix='history/'+id+'/',url=new URL(base);url.searchParams.set('prefix',prefix);url.searchParams.set('maxResults','25');url.searchParams.set('fields','items(name,generation),nextPageToken');
      if(cursor)url.searchParams.set('pageToken',cursor);
      const page=await request(url),items=[];
      for(const meta of page.items||[]){
        const revision=meta.name.startsWith(prefix)?meta.name.slice(prefix.length).replace(/\.json$/,''):'';
        if(!/^\d{1,30}$/.test(revision)||meta.name!==prefix+revision+'.json')continue;
        const record=await request(base+encodeURIComponent(meta.name)+'?alt=media&generation='+encodeURIComponent(meta.generation));
        if(!record)throw Object.assign(new Error('Sejarah berubah. Muat semula.'),{status:409});items.push({revision,record});
      }
      return {items,cursor:page.nextPageToken||null};
    },
    getHistory(id,revision){
      if(!/^[A-Za-z0-9_-]{16}$/.test(id||'')||!/^\d{1,30}$/.test(revision||''))throw new Error('Invalid history reference.');
      return request(base+encodeURIComponent('history/'+id+'/'+revision+'.json')+'?alt=media');
    },
    archive:(id,revision,record)=>write('history/'+id+'/'+revision+'.json',record),
    update:(id,record,revision)=>write(object(id),record,revision),
    purge:(id,marker,revision)=>write(object(id),marker,revision),
    claimPayment:(key,record)=>write('payments/'+ownerPrefix(key).slice(7,-1)+'.json',record),
    getPayment:key=>request(base+encodeURIComponent('payments/'+ownerPrefix(key).slice(7,-1)+'.json')+'?alt=media'),
    grantOwner:(key,id)=>{
      if(!/^[A-Za-z0-9_-]{16}$/.test(id||''))throw new Error('Invalid link ID.');
      return write(ownerPrefix(key)+id+'.json',{v:1,id});
    },
    async listOwner(key,cursor){
      const prefix=ownerPrefix(key);const url=new URL(base);url.searchParams.set('prefix',prefix);url.searchParams.set('maxResults','25');url.searchParams.set('fields','items(name),nextPageToken');
      if(cursor)url.searchParams.set('pageToken',cursor);
      const page=await request(url);
      return {ids:(page.items||[]).map(item=>item.name.startsWith(prefix)?item.name.slice(prefix.length):'').filter(name=>/^[A-Za-z0-9_-]{16}\.json$/.test(name)).map(name=>name.slice(0,-5)),cursor:page.nextPageToken||null};
    },
  };
}

// Used only by the explicitly enabled localhost preview and isolated tests.
export function createMemoryLinkStore(){
  const records=new Map(),history=new Map(),memberships=new Map(),payments=new Map(),gatewayOrders=new Map();let generation=0;
  const clone=value=>structuredClone(value);
  return {records,history,memberships,payments,
    createGatewayOrder:async(id,record)=>{if(gatewayOrders.has(id))return false;gatewayOrders.set(id,{record:clone(record),revision:String(++generation)});return true;},
    getGatewayOrder:async id=>clone(gatewayOrders.get(id)||null),
    updateGatewayOrder:async(id,record,revision)=>{if(gatewayOrders.get(id)?.revision!==revision)return false;gatewayOrders.set(id,{record:clone(record),revision:String(++generation)});return true;},
    listGatewayOrders:async cursor=>{const offset=Number(cursor||0),all=[...gatewayOrders.values()].map(clone);return {items:all.slice(offset,offset+25),cursor:all.length>offset+25?String(offset+25):null};},
    listHistory:async(id,cursor)=>{const offset=Number(cursor||0),all=[...history].filter(([key])=>key.startsWith(id+'/')).map(([key,record])=>({revision:key.slice(id.length+1),record:clone(record)}));return {items:all.slice(offset,offset+25),cursor:all.length>offset+25?String(offset+25):null};},
    getHistory:async(id,revision)=>clone(history.get(id+'/'+revision)||null),
    claimPayment:async(key,record)=>{if(payments.has(key))return false;payments.set(key,clone(record));return true;},
    getPayment:async key=>clone(payments.get(key)||null),
    create:async(id,record)=>{if(records.has(id))return false;records.set(id,{record:clone(record),revision:String(++generation)});return true;},
    get:async id=>records.get(id)?.record.permanentlyDeleted?null:clone(records.get(id)?.record||null),
    getVersion:async id=>records.get(id)?.record.permanentlyDeleted?null:clone(records.get(id)||null),
    list:async cursor=>{const offset=Number(cursor||0),all=[...records].filter(([,item])=>!item.record.permanentlyDeleted).map(([id,item])=>({id,...clone(item)}));return {items:all.slice(offset,offset+25),cursor:all.length>offset+25?String(offset+25):null};},
    archive:async(id,revision,record)=>{const key=id+'/'+revision;if(history.has(key))return false;history.set(key,clone(record));return true;},
    update:async(id,record,revision)=>{if(records.get(id)?.revision!==revision)return false;records.set(id,{record:clone(record),revision:String(++generation)});return true;},
    purge:async(id,marker,revision)=>{if(records.get(id)?.revision!==revision||records.get(id)?.record.permanentlyDeleted)return false;records.set(id,{record:clone(marker),revision:String(++generation)});return true;},
    grantOwner:async(key,id)=>{if(!memberships.has(key))memberships.set(key,new Set());memberships.get(key).add(id);return true;},
    listOwner:async(key,cursor)=>{const offset=Number(cursor||0),all=[...(memberships.get(key)||[])];return {ids:all.slice(offset,offset+25),cursor:all.length>offset+25?String(offset+25):null};},
  };
}
