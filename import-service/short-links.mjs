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
  const cache=new Map();
  const remember=(id,url)=>{
    cache.set(id,{url,expires:now()+300000});
    if(cache.size>1000) cache.delete(cache.keys().next().value);
  };
  return {
    async shorten(value) {
      const url=validateSmartTapURL(value,origin);
      for(let attempt=0;attempt<3;attempt++) {
        const id=createHmac('sha256',secret).update(`${attempt}:${url}`).digest('base64url').slice(0,16);
        if(cache.get(id)?.url===url || await store.create(id,{v:1,url,createdAt:new Date(now()).toISOString()}) || (await store.get(id))?.url===url) {
          remember(id,url);return {id,url:origin+'/?s='+id};
        }
      }
      throw new Error('Pautan pendek tidak dapat disimpan. Cuba lagi.');
    },
    async resolve(id) {
      if(typeof id!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(id)) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      if(cache.get(id)?.expires>now()) return {url:cache.get(id).url};
      const record=await store.get(id);
      if(!record) throw Object.assign(new Error('Pautan pendek tidak ditemui.'),{status:404});
      const url=validateSmartTapURL(record.url,origin);remember(id,url);return {url};
    },
  };
}

export function createCloudLinkStore({bucket,getToken,fetcher=fetch}) {
  if(!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket||'')) throw new Error('Invalid short link bucket.');
  const object=id=>'links/'+id+'.json';
  return {
    async create(id,record) {
      const endpoint=new URL('https://storage.googleapis.com/upload/storage/v1/b/'+bucket+'/o');
      endpoint.searchParams.set('uploadType','media');endpoint.searchParams.set('name',object(id));endpoint.searchParams.set('ifGenerationMatch','0');
      const response=await fetcher(endpoint,{method:'POST',headers:{Authorization:'Bearer '+await getToken(),'Content-Type':'application/json'},body:JSON.stringify(record),signal:AbortSignal.timeout(10000)});
      if(response.status===412) return false;
      if(!response.ok) throw new Error('Short link storage unavailable');
      return true;
    },
    async get(id) {
      const response=await fetcher('https://storage.googleapis.com/storage/v1/b/'+bucket+'/o/'+encodeURIComponent(object(id))+'?alt=media',{
        headers:{Authorization:'Bearer '+await getToken()},signal:AbortSignal.timeout(10000),
      });
      if(response.status===404) return null;
      if(!response.ok) throw new Error('Short link storage unavailable');
      return response.json();
    },
  };
}
