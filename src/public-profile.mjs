export function profileURL(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&url.href.length<=500?url.href:null;}catch{return null;}
}
export function decodeProfilePayload(payload) {
  try {
    if(typeof payload!=='string'||payload.length>4096||!/^[A-Za-z0-9_-]+$/.test(payload))throw 0;
    const bytes=Uint8Array.from(atob(payload.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
    const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(raw?.v!==1||typeof raw.name!=='string'||!raw.name.trim()||[...raw.name].length>80)throw 0;
    const profile={v:1,name:raw.name.trim(),tagline:typeof raw.tagline==='string'?raw.tagline.slice(0,140):''};
    for(const key of ['google','instagram','facebook','tiktok','whatsapp','website','logo','threads']) {
      if(raw[key]&&(!profileURL(raw[key])||typeof raw[key]!=='string'))throw 0;
      if(raw[key])profile[key]=profileURL(raw[key]);
    }
    const review=new URL(profile.google);const host=review.hostname;
    if(!(((host==='google.com'||host.endsWith('.google.com')||host==='google.com.my'||host.endsWith('.google.com.my'))&&review.pathname.includes('/local/writereview')&&review.searchParams.get('placeid'))||(host==='g.page'&&/\/r\/[^/]+\/review\/?$/i.test(review.pathname))))throw 0;
    return profile;
  } catch {throw new Error('Pautan profil ini tidak sah. Sila dapatkan pautan baharu daripada perniagaan.');}
}
