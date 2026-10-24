import {MAX_CATALOG_IMAGE} from './service-catalog.mjs';
export function createCatalogRoutes({catalog,adminAuth,userAuth,demo=false,reply}){
 return async(req,res,{path,origin})=>{
  const upload=/^\/api\/(admin|user)\/links\/([A-Za-z0-9_-]{16})\/catalog-image(?:\/([a-f0-9]{24}\.webp))?$/.exec(path),publicPage=/^\/api\/catalog\/([^/]+)$/.exec(path),image=path.startsWith('/api/catalog-media/');
  if(!upload&&!publicPage&&!image)return false;
  if(upload&&req.method==='OPTIONS')return false; // Existing account router owns the CORS preflight.
  if(req.headers.origin&&!origin){reply(res,403,{error:'Akses tidak dibenarkan.'});return true;}
  if(!catalog){reply(res,503,{error:'Katalog belum tersedia.'},origin);return true;}
  if(upload){
   if(req.method!==(upload[3]?'GET':'POST')){reply(res,405,{error:'Kaedah tidak dibenarkan.'},origin);return true;}
   if(!origin&&!upload[3]){reply(res,403,{error:'Akses tidak dibenarkan.'});return true;}
   const actor=demo?{email:upload[1]==='admin'?'demo@localhost':'preview.owner@gmail.com',role:upload[1]==='admin'?'admin':'user'}:await(upload[1]==='admin'?adminAuth:userAuth)(req.headers.authorization);
   if(upload[3]){const bytes=await catalog.preview(upload[2],upload[3],actor);res.writeHead(200,{'content-type':'image/webp','content-length':bytes.length,'cache-control':'no-store','x-content-type-options':'nosniff',...(origin?{'access-control-allow-origin':origin,vary:'Origin'}:{})});res.end(bytes);return true;}
   if(!/^image\/(jpeg|png|webp)$/.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JPG, PNG atau WebP.'},origin);return true;}
   if(Number(req.headers['content-length'])>MAX_CATALOG_IMAGE){reply(res,413,{error:'Had gambar katalog ialah 2 MB.'},origin);return true;}
   const result=await catalog.upload(upload[2],actor,async()=>{let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>MAX_CATALOG_IMAGE)throw Object.assign(new Error('Had gambar katalog ialah 2 MB.'),{status:413});chunks.push(chunk);}return Buffer.concat(chunks);},req.headers['if-match']);reply(res,200,result,origin);return true;
  }
  if(!['GET','HEAD'].includes(req.method)){reply(res,405,{error:'Gunakan GET.'},origin);return true;}
  if(publicPage){const data=await catalog.public(publicPage[1]);reply(res,200,data,origin);return true;}
  const bytes=await catalog.image(path.slice('/api/catalog-media/'.length));res.writeHead(200,{'content-type':'image/webp','content-length':bytes.length,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'",...(origin?{'access-control-allow-origin':origin,vary:'Origin'}:{})});res.end(req.method==='HEAD'?undefined:bytes);return true;
 };
}
