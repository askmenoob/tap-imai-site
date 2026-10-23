const denied=()=>Object.assign(new Error('Log masuk sebagai super admin untuk mencari Google Review Place ID.'),{status:401});
function publicValue(value,placeId=''){
  if(typeof value==='string')return (placeId&&value.includes(placeId))||/place_?id[=:]|\/local\/writereview|g\.page\/r\/[^/]+\/review/i.test(value)?undefined:value;
  if(Array.isArray(value))return value.map(item=>publicValue(item,placeId)).filter(item=>item!==undefined);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!['id','placeId','place_id','google','searchSuggestionsHtml'].includes(key)).map(([key,item])=>[key,publicValue(item,placeId)]).filter(([,item])=>item!==undefined));
  return value;
}
export function publicDiscovery(data){
  const id=data.profile?.google?new URL(data.profile.google).searchParams.get('placeid')||'':'';
  const result=publicValue(data,id);
  if(result.warnings)result.warnings=result.warnings.map(text=>text.replace('Google Review dan laman web masih diisi;','Laman web masih diisi;'));
  return result;
}
export function createDiscoveryRoutes({service,adminAuth,shortLinks,originURL,demo=false,reply,body,allow}){
  return async(req,res,{path,origin})=>{
    const match=/^\/api\/(admin\/)?(suggest|search|import|create)$/.exec(path);if(!match)return false;
    const admin=!!match[1],action=match[2];
    if(!origin){reply(res,403,{error:'Akses tidak dibenarkan.'});return true;}
    if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'POST','access-control-allow-headers':'Content-Type, Authorization',vary:'Origin'});res.end();return true;}
    if(req.method!=='POST'){reply(res,405,{error:'Kaedah tidak dibenarkan.'},origin);return true;}
    if(admin){
      if(demo){if(req.headers.authorization!=='Bearer localhost-demo')throw denied();}
      else await adminAuth(req.headers.authorization);
    }
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
    if(!allow(req.socket.remoteAddress,action==='suggest')){reply(res,429,{error:'Had carian dicapai. Cuba sebentar lagi.'},origin);return true;}
    const data=await body(req,action==='create'?24576:4096);
    if(action==='create'){
      if(!shortLinks){reply(res,503,{error:'Pautan pendek belum tersedia.'},origin);return true;}
      if(!data.profile||typeof data.profile!=='object'||Array.isArray(data.profile)||Object.hasOwn(data.profile,'google')){reply(res,400,{error:'Maklumat perniagaan tidak sah.'},origin);return true;}
      const google=service.reviewFromDraft(data.draftToken);
      const profile={...data.profile,google};
      const url=new URL('/?p='+Buffer.from(JSON.stringify(profile)).toString('base64url'),originURL);
      reply(res,200,await shortLinks.shorten(url.href),origin);return true;
    }
    const result=action==='suggest'?await service.suggest(data.query,data.sessionToken):action==='search'?await service.search(data.query):await service.import(data.token);
    reply(res,200,admin?result:publicDiscovery(result),origin);return true;
  };
}
