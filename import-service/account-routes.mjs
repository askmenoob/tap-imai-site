// All identities come from the server's Google verifiers, never request fields.
export function createAccountRoutes({adminAuth,userAuth,admin,customers,clientId,adminConfigured,demo=false,reply,body}){
  return async(req,res,{path,origin})=>{
    const customer=path.startsWith('/api/user/');
    if(!customer&&!path.startsWith('/api/admin/'))return false;
    if((req.headers.origin&&!origin)||(!origin&&!['GET','HEAD'].includes(req.method))){reply(res,403,{error:'Akses tidak dibenarkan.'});return true;}
    if(req.method==='OPTIONS'){
      res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, PUT, POST','access-control-allow-headers':'Content-Type, Authorization',vary:'Origin'});res.end();return true;
    }
    const base=customer?'/api/user':'/api/admin';
    if(path===base+'/config'&&req.method==='GET'){reply(res,200,{clientId,configured:customer?!!clientId:adminConfigured,...(demo?{demo:true}:{})},origin);return true;}
    const actor=demo?{sub:'localhost-demo-only',email:customer?'preview.owner@gmail.com':'demo@localhost',role:customer?'user':'admin',expiresAt:Date.now()+3600000}:await (customer?userAuth:adminAuth)(req.headers.authorization);
    if(!admin||!customers){reply(res,503,{error:'Simpanan pautan belum tersedia.'},origin);return true;}
    if(path===base+'/self'&&req.method==='GET'){reply(res,200,actor,origin);return true;}
    const query=new URL(req.url,'http://localhost').searchParams;
    if(path===base+'/links'&&req.method==='GET'){
      reply(res,200,customer?await customers.list(actor,query.get('cursor')):await admin.list(query.get('cursor')),origin);return true;
    }
    const match=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})(/owner)?$').exec(path);
    if(match&&req.method==='GET'&&!match[2]){reply(res,200,customer?await customers.get(match[1],actor):await admin.get(match[1]),origin);return true;}
    if(['POST','PUT'].includes(req.method)){
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
      if(!customer&&path===base+'/register'&&req.method==='POST'){reply(res,200,await customers.register(await body(req,8192),actor),origin);return true;}
      if(match&&req.method==='PUT'){
        if(match[2]){
          if(customer){reply(res,403,{error:'Hanya super admin boleh mendaftarkan Gmail pemilik.'},origin);return true;}
          reply(res,200,await customers.assign(match[1],await body(req,2048),actor),origin);return true;
        }
        const data=await body(req,8192);
        reply(res,200,customer?await customers.update(match[1],data,actor):await admin.update(match[1],data,actor),origin);return true;
      }
    }
    reply(res,404,{error:'Tidak ditemui.'},origin);return true;
  };
}
