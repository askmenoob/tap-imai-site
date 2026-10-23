import {createHmac} from 'node:crypto';

const urlFields=['logo','google','instagram','facebook','tiktok','threads','whatsapp','website'];
const fields=new Set(['v','name','tagline','phone',...urlFields]);
const invalid=()=>Object.assign(new Error('Gunakan pautan halaman SmartTap yang telah dijana.'),{status:400});
export function validateSmartTapURL(value,origin='https://tap.imai.my') {
  try {
    if(typeof value!=='string'||value.length>4500) throw 0;
    const url=new URL(value);
    if(url.origin!==origin||url.username||url.password||url.pathname!=='/'||url.hash||[...url.searchParams.keys()].join()!=='p') throw 0;
    const encoded=url.searchParams.get('p');
    if(!encoded||encoded.length>4096||!/^[A-Za-z0-9_-]+$/.test(encoded)) throw 0;
    const bytes=Buffer.from(encoded,'base64url');
    if(bytes.toString('base64url')!==encoded) throw 0;
    const profile=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!profile||typeof profile!=='object'||Array.isArray(profile)||profile.v!==1||typeof profile.name!=='string'||!profile.name.trim()||[...profile.name].length>80) throw 0;
    for(const [key,field] of Object.entries(profile)) if(!fields.has(key)||(key!=='v'&&typeof field!=='string')) throw 0;
    if((profile.tagline||'').length>140||(profile.phone||'').length>30) throw 0;
    for(const key of urlFields) if(profile[key]) {
      const link=new URL(profile[key]);
      if(link.protocol!=='https:'||link.username||link.password||(link.port&&link.port!=='443')||link.href.length>500) throw 0;
    }
    const review=new URL(profile.google);const host=review.hostname;
    const google=(host==='google.com'||host.endsWith('.google.com')||host==='google.com.my'||host.endsWith('.google.com.my'))&&review.pathname.includes('/local/writereview')&&review.searchParams.get('placeid');
    const gpage=host==='g.page'&&/\/r\/[^/]+\/review\/?$/i.test(review.pathname);
    if(!google&&!gpage) throw 0;
    return url.href;
  } catch {throw invalid();}
}
export function createShortLinks({store,secret,origin='https://tap.imai.my',now=Date.now}) {
  if(!store||!secret||secret.length<32) throw new Error('Configure short link storage and signing secret.');
  return {
    async shorten(value) {
      const url=validateSmartTapURL(value,origin);
      for(let attempt=0;attempt<3;attempt++) {
        const id=createHmac('sha256',secret).update(`${attempt}:${url}`).digest('base64url').slice(0,16);
        if(await store.create(id,{v:1,url,createdAt:new Date(now()).toISOString()}) || (await store.get(id))?.url===url) {
          return {id,url:origin+'/?s='+id};
        }
      }
      throw new Error('Pautan pendek tidak dapat disimpan. Cuba lagi.');
    },
    async resolve(id) {
      if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(id)) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      const record=await store.get(id);
      if(!record) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      // Read the durable record so edits made by another instance take effect on the next scan.
      const url=validateSmartTapURL(record.url,origin);return {url};
    },
  };
}

export function createCloudLinkStore({bucket,getToken,fetcher=fetch}) {
  if(!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket||'')) throw new Error('Invalid short link bucket.');
  const object=id=>'links/'+id+'.json';
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
    get:read,
    async getVersion(id) {
      const metadata=await request(base+encodeURIComponent(object(id)));
      if(!metadata) return null;
      const record=await read(id,metadata.generation);
      if(!record) throw Object.assign(new Error('Rekod telah berubah. Muat semula senarai.'),{status:409});
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
        return {id,record,revision:item.generation};
      }));
      return {items,cursor:page.nextPageToken||null};
    },
    archive:(id,revision,record)=>write('history/'+id+'/'+revision+'.json',record),
    update:(id,record,revision)=>write(object(id),record,revision),
  };
}
