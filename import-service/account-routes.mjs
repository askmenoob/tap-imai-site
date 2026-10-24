// All identities come from the server's Google verifiers, never request fields.
export function createAccountRoutes({adminAuth,userAuth,admin,customers,management,clientId,adminConfigured,gateway,orders,demo=false,reply,body}){
  const checkoutWindows=new Map();
  return async(req,res,{path,origin})=>{
    const customer=path.startsWith('/api/user/');
    if(!customer&&!path.startsWith('/api/admin/'))return false;
    if((req.headers.origin&&!origin)||(!origin&&!['GET','HEAD'].includes(req.method))){reply(res,403,{error:'Akses tidak dibenarkan.'});return true;}
    if(req.method==='OPTIONS'){
      res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, PUT, POST','access-control-allow-headers':'Content-Type, Authorization, If-Match',vary:'Origin'});res.end();return true;
    }
    const base=customer?'/api/user':'/api/admin';
    if(path===base+'/config'&&req.method==='GET'){reply(res,200,{clientId,configured:customer?!!clientId:adminConfigured,...(demo?{demo:true}:{})},origin);return true;}
    const actor=demo?{sub:'localhost-demo-only',email:customer?'preview.owner@gmail.com':'demo@localhost',role:customer?'user':'admin',expiresAt:Date.now()+3600000}:await (customer?userAuth:adminAuth)(req.headers.authorization);
    if(!admin||!customers){reply(res,503,{error:'Simpanan pautan belum tersedia.'},origin);return true;}
    if(path===base+'/self'&&req.method==='GET'){reply(res,200,actor,origin);return true;}
    if(path===base+'/plan'&&req.method==='GET'&&management){reply(res,200,{...management.config(),gateway:gateway?.config()||{enabled:false,configured:false}},origin);return true;}
    if(!customer&&path===base+'/pending-payments'&&req.method==='GET'){reply(res,200,await admin.pendingPayments(),origin);return true;}
    const query=new URL(req.url,'http://localhost').searchParams;
    const orderRoute=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})/orders(?:/(ST[a-f0-9]{24})(?:/(address|fulfillment))?)?$').exec(path);
    if(orderRoute&&orders){
      const [,pageId,id,action]=orderRoute;
      if(req.method==='GET'&&!action){reply(res,200,id?await orders.get(pageId,id,actor):await orders.list(pageId,actor,query.get('cursor')),origin);return true;}
      if(req.method==='PUT'&&id&&action){
        if(customer&&action==='fulfillment'){reply(res,403,{error:'Hanya super admin boleh mengemas kini penghantaran.'},origin);return true;}
        if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
        const data=await body(req,4096);reply(res,200,action==='address'?await orders.address(pageId,id,data,actor):await orders.fulfill(pageId,id,data,actor),origin);return true;
      }
      reply(res,405,{error:'Kaedah tidak dibenarkan.'},origin);return true;
    }
    if(gateway&&req.method==='POST'){
      const start=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})/checkout$').exec(path);
      const order=new RegExp('^'+base+'/checkout/(ST[a-f0-9]{24})/(status|cancel)$').exec(path);
      if(start||order){
        const key=actor.sub||actor.email,time=Date.now();let window=checkoutWindows.get(key);
        if(!window||time-window.since>=60000){window={since:time,count:0};checkoutWindows.set(key,window);}
        if(checkoutWindows.size>10000)for(const [id,value] of checkoutWindows)if(time-value.since>=60000)checkoutWindows.delete(id);
        if(++window.count>30){reply(res,429,{error:'Terlalu banyak semakan pembayaran. Cuba semula sebentar lagi.'},origin);return true;}
        if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
        const data=await body(req,2048);
        const result=start?await gateway.create(start[1],data,actor):order[2]==='status'?await gateway.status(order[1],actor):await gateway.cancel(order[1],actor);
        admin.invalidatePending();reply(res,200,result,origin);return true;
      }
    }
    const messageMatch=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})/(message|message-reply)$').exec(path);
    if(messageMatch&&management&&req.method==='POST'){
      const [,id,action]=messageMatch;
      if((customer&&action!=='message-reply')||(!customer&&action!=='message')){reply(res,403,{error:'Tindakan mesej tidak dibenarkan.'},origin);return true;}
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
      const data=await body(req,8192);
      reply(res,200,action==='message'?await management.message(id,data,actor):await management.replyMessage(id,data,actor),origin);return true;
    }
    const operation=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})/(state|quote|renewal|decision|subscription)$').exec(path);
    if(operation&&management){
      const [,id,action]=operation;
      if(customer&&['state','decision','subscription'].includes(action)){reply(res,403,{error:'Hanya super admin boleh mengurus status dan langganan.'},origin);return true;}
      if(req.method==='POST'){
        if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
        const data=await body(req,4096);const result=action==='subscription'?await management.subscription(id,data,actor):action==='state'?await management.state(id,data,actor):action==='quote'?await management.quote(id,data,actor):action==='renewal'?await management.request(id,data,actor):await management.decide(id,data,actor);
        admin.invalidatePending();reply(res,200,result,origin);return true;
      }
    }
    if(path===base+'/links'&&req.method==='GET'){
      reply(res,200,customer?await customers.list(actor,query.get('cursor')):await admin.list(query.get('cursor')),origin);return true;
    }
    const match=new RegExp('^'+base+'/links/([A-Za-z0-9_-]{16})(/owner)?$').exec(path);
    if(match&&req.method==='GET'&&!match[2]){reply(res,200,customer?await customers.get(match[1],actor):await admin.get(match[1]),origin);return true;}
    if(['POST','PUT'].includes(req.method)){
      if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){reply(res,415,{error:'Gunakan JSON.'},origin);return true;}
      if(!customer&&path===base+'/register'&&req.method==='POST'){reply(res,200,await customers.register(await body(req,24576),actor),origin);return true;}
      if(match&&req.method==='PUT'){
        if(match[2]){
          if(customer){reply(res,403,{error:'Hanya super admin boleh mendaftarkan Gmail pemilik.'},origin);return true;}
          reply(res,200,await customers.assign(match[1],await body(req,2048),actor),origin);return true;
        }
        const data=await body(req,98304);
        reply(res,200,customer?await customers.update(match[1],data,actor):await admin.update(match[1],data,actor),origin);return true;
      }
    }
    reply(res,404,{error:'Tidak ditemui.'},origin);return true;
  };
}
