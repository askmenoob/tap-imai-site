import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {ownerKey} from './identity.mjs';
import {validId,pageView,savePage} from './admin.mjs';
import {createCatalog} from './catalog.mjs';
import {annualEnd,hasAnnualEntitlement} from './page-state.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const orderId=id=>/^ST[a-f0-9]{24}$/.test(id||'');
const billCode=code=>/^[A-Za-z0-9]{4,40}$/.test(code||'');
const digest=value=>createHash('sha256').update(value).digest('base64url');
export function amountCents(value){
  const text=String(value??'');if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(text))throw fail(400,'Jumlah transaksi tidak sah.');
  const [rm,cents='']=text.split('.');return Number(rm)*100+Number(cents.padEnd(2,'0'));
}
export function verifyToyyibCallback(data,key){
  if(!key||!orderId(data.order_id)||!['1','2','3'].includes(data.status)||!/^[A-Za-z0-9_-]{1,100}$/.test(data.refno||'')||!billCode(data.billcode)||!/^([a-f0-9]{32})$/i.test(data.hash||''))throw fail(403,'Notifikasi pembayaran tidak sah.');
  const expected=createHash('md5').update(key+data.status+data.order_id+data.refno+'ok').digest();
  if(!timingSafeEqual(expected,Buffer.from(data.hash,'hex')))throw fail(403,'Notifikasi pembayaran tidak sah.');
}
export function createToyyibProvider({secretKey,categoryCode,mode='live',fetcher=fetch}){
  if(!['live','sandbox'].includes(mode))throw Error('Invalid ToyyibPay mode');
  const host=mode==='sandbox'?'https://dev.toyyibpay.com':'https://toyyibpay.com';
  async function call(method,fields){
    let response,data;
    try{
      response=await fetcher(host+'/index.php/api/'+method,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'SmartTap/1.0'},body:new URLSearchParams(fields),signal:AbortSignal.timeout(12000),redirect:'error'});
      if(!response.ok)throw Error('HTTP');data=await response.json();
    }catch{throw fail(502,'ToyyibPay belum dapat dihubungi. Cuba semula atau hubungi super admin.');}
    return data;
  }
  return {mode,host,
    async create(order,{callbackURL,returnURL,duitNowQR}){
      const data=await call('createBill',{userSecretKey:secretKey,categoryCode,billName:'SmartTap Order',billDescription:'SmartTap '+order.quote.package+' '+order.id,billPriceSetting:'1',billPayorInfo:'0',billAmount:String(order.quote.amountCents),billReturnUrl:returnURL,billCallbackUrl:callbackURL,billExternalReferenceNo:order.id,billPaymentChannel:'0',billChargeToCustomer:'',billExpiryDays:'1',...(duitNowQR?{enableDuitNowQR:'1',chargeDuitNowQR:'0'}:{})});
      const code=Array.isArray(data)&&data.length===1?data[0].BillCode:null;
      if(!billCode(code))throw fail(502,'Bil ToyyibPay belum dapat disediakan. Hubungi super admin sebelum mencuba lagi.');return code;
    },
    async transactions(code){
      if(!billCode(code))throw fail(400,'Bil tidak sah.');const data=await call('getBillTransactions',{userSecretKey:secretKey,billCode:code});
      if(!Array.isArray(data))throw fail(502,'Status ToyyibPay belum dapat disahkan.');return data;
    },
    async cancel(code){
      const data=await call('inactiveBill',{secretKey,billCode:code});
      if(data?.status!=='success'&&data?.result!=='Bill is inactive')throw fail(409,'Bil masih mempunyai transaksi dalam proses. Tunggu status bank sebelum membatalkan.');
    },
    async qrStatus(){const data=await call('checkDuitNowQRStatus',{userSecretKey:secretKey});if(data.status!=='success')throw fail(502,'Status DuitNow QR belum dapat disahkan.');return data.duitnowqr_activated===true;},
  };
}
export function createToyyibCheckout({store,provider,secretKey='',categoryCode='',enabled=false,accountVerified=false,settlementHoldAccepted=false,duitNowQR=false,origin='https://tap.imai.my',apiOrigin='https://tap-business-import-262870839474.asia-southeast1.run.app',now=Date.now,newId=()=> 'ST'+randomBytes(12).toString('hex')}){
  const catalog=createCatalog(),flights=new Map(),lastChecks=new Map();
  const configured=!!(secretKey&&categoryCode&&provider),operational=!!(configured&&enabled&&(provider.mode==='sandbox'||accountVerified||settlementHoldAccepted));
  const ready=()=>{if(!operational)throw fail(503,'Pembayaran ToyyibPay belum dibuka. Hubungi super admin.');};
  const view=(id,item,actor)=>pageView({id,...item},origin,actor.role==='admin',now());
  async function owned(id,actor){
    validId(id);const page=await store.getVersion(id);if(!page||page.record.lifecycle?.state==='deleted')throw fail(404,'Halaman tidak tersedia.');
    if(actor?.role!=='admin'){
      let owns=false;try{owns=actor?.role==='user'&&ownerKey(page.record.ownerEmail)===ownerKey(actor.email);}catch{}
      if(!owns)throw fail(404,'Halaman tidak tersedia untuk akaun Gmail anda.');
    }
    return page;
  }
  const checkoutView=order=>({id:order.id,pageId:order.pageId,status:order.status,amountCents:order.quote.amountCents,currency:'MYR',mode:order.mode,billCode:order.billCode||null,paymentUrl:order.billCode&&!['paid','cancelled','review','resolved'].includes(order.status)?provider.host+'/'+order.billCode:null,invoice:order.invoice||null,createdAt:order.createdAt,verifiedAt:order.verifiedAt||null});
  async function saveOrder(id,changes){for(let retry=0;retry<6;retry++){const item=await store.getGatewayOrder(id);if(!item)throw fail(404,'Pesanan tidak ditemui.');if(['paid','resolved'].includes(item.record.status)&&changes.status&&changes.status!==item.record.status)return item.record;const next={...item.record,...changes};if(await store.updateGatewayOrder(id,next,item.revision))return next;}throw fail(409,'Pesanan sedang dikemas kini. Cuba semula.');}
  async function updatePage(order,changes){
    for(let retry=0;retry<6;retry++){
      const item=await store.getVersion(order.pageId);if(!item)throw fail(404,'Halaman tidak ditemui.');
      if(item.record.checkout?.id!==order.id||['paid','resolved'].includes(item.record.checkout.status)&&changes.status!==item.record.checkout.status)return item;
      if(item.record.checkout.status==='review'&&['pending','failed','creating','cancelled'].includes(changes.status))return item;
      if(Object.entries(changes).every(([key,value])=>(item.record.checkout[key]??null)===(value??null)))return item;
      try{return await savePage({store,id:order.pageId,previous:item,revision:item.revision,changes:{checkout:{...item.record.checkout,...changes}},actor:{email:'toyyibpay'},now});}catch(error){if(error.status!==409)throw error;}
    }throw fail(409,'Halaman sedang dikemas kini. Cuba semula.');
  }
  async function clearResolution(order){
    for(let retry=0;retry<6;retry++){
      const item=await store.getVersion(order.pageId),lock=item?.record.paymentResolution;
      if(!lock||lock.orderId!==order.id||lock.token!==order.resolution?.token)return;
      try{await savePage({store,id:order.pageId,previous:item,revision:item.revision,changes:{paymentResolution:null},actor:{email:order.resolution.changedBy},now});return;}catch(error){if(error.status!==409)throw error;}
    }throw fail(409,'Keputusan disimpan. Muat semula untuk melengkapkan penyelesaian.');
  }
  async function fulfill(order,tx,resolution=null){
    const invoice=tx.billpaymentInvoiceNo;
    if(typeof invoice!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(invoice))throw fail(502,'Rujukan ToyyibPay tidak sah.');
    const claim={provider:'toyyibpay',mode:order.mode,orderId:order.id,pageId:order.pageId,invoice};
    const key=digest('toyyibpay|'+order.mode+'|'+invoice);
    if(!await store.claimPayment(key,claim)){const existing=await store.getPayment(key);if(existing?.orderId!==order.id||existing?.pageId!==order.pageId)throw fail(409,'Transaksi ini telah digunakan untuk pesanan lain.');}
    for(let retry=0;retry<6;retry++){
      const previous=await store.getVersion(order.pageId);if(!previous)throw fail(404,'Halaman tidak ditemui.');
      // Read durable order state AFTER the page snapshot. A resolution lock written
      // after this snapshot makes the subsequent page CAS fail, even across instances.
      const latest=await store.getGatewayOrder(order.id);if(!latest)throw fail(404,'Pesanan tidak ditemui.');order=latest.record;
      if(['paid','resolved'].includes(order.status))return order;
      const lock=previous.record.paymentResolution;
      if(lock&&(!resolution||lock.orderId!==order.id||lock.token!==resolution.token))return order;
      if(order.resolution&&(!resolution||order.resolution.token!==resolution.token))return order;
      if(previous.record.gatewayApplied?.[order.id])return saveOrder(order.id,{status:'paid',invoice,verifiedAt:new Date(now()).toISOString(),...(resolution?{ownerKey:resolution.targetOwnerKey,originalOwnerKey:order.originalOwnerKey||order.ownerKey,resolution:{...resolution,completedAt:new Date(now()).toISOString()}}:{})});
      let recipient=false;try{recipient=ownerKey(previous.record.ownerEmail)===(resolution?.targetOwnerKey||order.ownerKey);}catch{}
      if(!recipient||previous.record.lifecycle?.state==='deleted'||order.status==='cancelled'&&!resolution){
        const held=await saveOrder(order.id,{status:'review',invoice,verifiedAt:new Date(now()).toISOString()});
        await updatePage(held,{status:'review',invoice});return held;
      }
      const old=previous.record.subscription,changes={gatewayApplied:{...previous.record.gatewayApplied,[order.id]:invoice},renewal:{id:order.id,status:'approved',provider:'toyyibpay',reference:invoice,paidDate:new Date(now()).toISOString().slice(0,10),...order.quote,submittedAt:order.createdAt,decidedAt:new Date(now()).toISOString(),decidedBy:'toyyibpay'}};
      if(order.quote.months===12){const expiry=Date.parse(old?.expiresAt||'');const start=Math.max(Number.isFinite(expiry)?expiry:0,now());changes.subscription={plan:'annual',currency:'MYR',lastOrderCents:order.quote.amountCents,renewalCents:3000,startsAt:old?.startsAt||new Date(now()).toISOString(),expiresAt:annualEnd(start),lastPaymentId:order.id};}
      else if(!hasAnnualEntitlement(previous.record))changes.subscription={plan:'nfc_only',currency:'MYR',lastPaymentId:order.id};
      if(previous.record.checkout?.id===order.id)changes.checkout={...previous.record.checkout,status:'paid',invoice};
      try{await savePage({store,id:order.pageId,previous,revision:previous.revision,changes,actor:{email:resolution?.changedBy||'toyyibpay'},now});return saveOrder(order.id,{status:'paid',invoice,verifiedAt:new Date(now()).toISOString(),...(resolution?{ownerKey:resolution.targetOwnerKey,originalOwnerKey:order.originalOwnerKey||order.ownerKey,resolution:{...resolution,completedAt:new Date(now()).toISOString()}}:{})});}catch(error){if(error.status!==409)throw error;}
    }throw fail(409,'Bayaran diterima tetapi pengaktifan sedang dikemas kini. Semak semula status.');
  }
  async function reconcile(id,force=false){
    if(flights.has(id))return flights.get(id);
    const work=(async()=>{
      const saved=await store.getGatewayOrder(id);if(!saved)throw fail(404,'Pesanan tidak ditemui.');const order=saved.record;
      if(order.mode!==provider.mode)throw fail(409,'Persekitaran pembayaran tidak sepadan.');
      if(['paid','review','resolved'].includes(order.status)){await updatePage(order,{status:order.status,invoice:order.invoice||null});if(order.resolution?.completedAt)await clearResolution(order);return order;}
      if(!order.billCode)return order;
      if(!force&&now()-(lastChecks.get(id)||0)<10000)return order;
      lastChecks.set(id,now());if(lastChecks.size>1000)lastChecks.delete(lastChecks.keys().next().value);
      const transactions=await provider.transactions(order.billCode);
      const latest=await store.getGatewayOrder(id);
      if(['paid','resolved'].includes(latest?.record.status)||latest?.record.resolution){const result=latest.record;await updatePage(result,{status:result.status,invoice:result.invoice||null});return result;}
      const paid=transactions.filter(tx=>String(tx.billpaymentStatus)==='1');
      const match=paid.find(tx=>tx.billExternalReferenceNo===order.id&&amountCents(tx.billpaymentAmount)===order.quote.amountCents);
      if(match)return fulfill(order,match);
      if(paid.length)throw fail(409,'Jumlah atau rujukan bayaran tidak sepadan. Super admin perlu menyemak.');
      if(order.status==='cancelled'||order.status==='review')return order;
      const state=transactions.some(tx=>['2','4'].includes(String(tx.billpaymentStatus)))?'pending':transactions.length?'failed':'pending';
      await updatePage(order,{status:state});return saveOrder(id,{status:state,verifiedAt:new Date(now()).toISOString()});
    })();
    flights.set(id,work);try{return await work;}finally{if(flights.get(id)===work)flights.delete(id);}
  }
  return {
    config(){return {enabled:operational,configured,mode:provider?.mode||'live',duitNowQR:operational&&duitNowQR,settlementHold:operational&&provider?.mode==='live'&&!accountVerified,reason:operational?'ready':configured&&!accountVerified&&provider?.mode==='live'?'awaiting_verification':'not_enabled'};},
    async create(id,data={},actor){
      ready();if(Object.keys(data).some(key=>!['package','extraNfcQty','stickerQty','revision','expectedAmountCents'].includes(key)))throw fail(400,'Maklumat pesanan tidak sah.');
      const previous=await owned(id,actor);if(!previous.record.ownerEmail)throw fail(409,'Daftarkan Gmail pemilik dahulu.');
      if(previous.record.paymentResolution)throw fail(409,'Selesaikan semakan bayaran admin yang sedang diproses dahulu.');
      const old=previous.record.checkout;
      if(old&&!['paid','cancelled','creation_failed','resolved'].includes(old.status)){
        const pending=await store.getGatewayOrder(old.id);
        if(pending&&actor.role!=='admin'&&pending.record.ownerKey!==ownerKey(actor.email))throw fail(409,'Bil terdahulu memerlukan semakan super admin.');
        if(!pending||!pending.record.billCode)throw fail(409,'Bil sedang disediakan. Hubungi super admin jika status tidak berubah.');
        if(pending.record.quote.package!==data.package||pending.record.quote.extraNfcQty!==(data.extraNfcQty||0)||pending.record.quote.stickerQty!==(data.stickerQty||0))throw fail(409,'Selesaikan atau batalkan bil sedia ada sebelum menukar pesanan.');
        return checkoutView(pending.record);
      }
      if(previous.record.renewal?.status==='pending')throw fail(409,'Bayaran manual sedang menunggu semakan super admin.');
      const quote=catalog.quote(previous.record,data);if(data.expectedAmountCents!==undefined&&data.expectedAmountCents!==quote.amountCents)throw fail(409,'Jumlah pesanan berubah. Semak jumlah terkini sebelum membayar.');const idOrder=newId();if(!orderId(idOrder))throw Error('Invalid generated order ID');
      const order={id:idOrder,pageId:id,ownerKey:ownerKey(previous.record.ownerEmail),quote,mode:provider.mode,status:'creating',createdAt:new Date(now()).toISOString()};
      if(!await store.createGatewayOrder(idOrder,order))throw fail(409,'Pesanan belum dapat disediakan. Cuba semula.');
      await savePage({store,id,previous,revision:data.revision,changes:{checkoutIds:[...(previous.record.checkoutIds||[]),idOrder],checkout:{id:idOrder,status:'creating',mode:provider.mode,amountCents:quote.amountCents,createdAt:order.createdAt,recipientKey:order.ownerKey}},actor,now});
      let code;
      try{code=await provider.create(order,{callbackURL:apiOrigin+'/api/toyyibpay/callback',returnURL:origin+'/edit/?s='+id+'&payment='+idOrder,duitNowQR});}
      catch(error){await saveOrder(idOrder,{status:'creation_failed'});await updatePage(order,{status:'creation_failed'});throw error;}
      const saved=await saveOrder(idOrder,{billCode:code,status:'pending'});await updatePage(saved,{billCode:code,status:'pending'});await owned(id,actor);return checkoutView(saved);
    },
    async status(id,actor){
      ready();if(!orderId(id))throw fail(404,'Pesanan tidak ditemui.');const saved=await store.getGatewayOrder(id);if(!saved)throw fail(404,'Pesanan tidak ditemui.');await owned(saved.record.pageId,actor);
      if(actor.role!=='admin'&&saved.record.ownerKey!==ownerKey(actor.email))throw fail(404,'Pesanan tidak ditemui.');
      const result=await reconcile(id);return {checkout:checkoutView(result),page:view(result.pageId,await owned(result.pageId,actor),actor)};
    },
    async cancel(id,actor){
      ready();if(!orderId(id))throw fail(404,'Pesanan tidak ditemui.');const saved=await store.getGatewayOrder(id);if(!saved)throw fail(404,'Pesanan tidak ditemui.');await owned(saved.record.pageId,actor);
      if(actor.role!=='admin'&&saved.record.ownerKey!==ownerKey(actor.email))throw fail(404,'Pesanan tidak ditemui.');
      const checked=await reconcile(id,true);if(['paid','review','resolved'].includes(checked.status))throw fail(409,'Bayaran telah diterima; pesanan tidak boleh dibatalkan.');
      if(!checked.billCode)throw fail(409,'Bil belum dapat dibatalkan. Hubungi super admin.');
      await owned(checked.pageId,actor);await provider.cancel(checked.billCode);const after=await reconcile(id,true);if(['paid','review'].includes(after.status))throw fail(409,'Bayaran telah diterima; pesanan tidak boleh dibatalkan.');const result=await saveOrder(id,{status:'cancelled'});await updatePage(result,{status:result.status});return {checkout:checkoutView(result),page:view(result.pageId,await owned(result.pageId,actor),actor)};
    },
    async resolve(id,data={},actor){
      ready();if(actor?.role!=='admin'||!actor.email)throw fail(403,'Hanya super admin boleh menyelesaikan semakan bayaran.');
      if(!orderId(id))throw fail(404,'Pesanan tidak ditemui.');
      if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>!['action','revision','pageRevision','note','confirmEmail','reference','confirmRefund'].includes(key)))throw fail(400,'Maklumat penyelesaian tidak sah.');
      const note=typeof data.note==='string'?data.note.normalize('NFC').trim():'';
      if(!note||note.length>200||/[\u0000-\u001f]/.test(note)||!['apply','record-refund'].includes(data.action))throw fail(400,'Pilih tindakan dan masukkan nota semakan, maksimum 200 aksara.');
      let saved=await store.getGatewayOrder(id);if(!saved||saved.record.mode!==provider.mode)throw fail(404,'Pesanan tidak ditemui.');
      let order=saved.record;const page=await store.getVersion(order.pageId);if(!page)throw fail(404,'Halaman tidak ditemui.');
      if(order.resolution?.completedAt&&['paid','resolved'].includes(order.status)){
        if(order.resolution.action!==data.action)throw fail(409,'Pesanan sudah diselesaikan dengan tindakan lain.');
        await updatePage(order,{status:order.status,invoice:order.invoice});await clearResolution(order);return {checkout:checkoutView(order),page:view(order.pageId,await store.getVersion(order.pageId),actor)};
      }
      if(order.status!=='review'||data.revision!==saved.revision||data.pageRevision!==page.revision)throw fail(409,'Semakan atau halaman telah berubah. Muat semula sebelum meneruskan.');
      let targetOwnerKey=null,reference=null;
      if(data.action==='apply'){
        if(page.record.lifecycle?.state==='deleted'||!page.record.ownerEmail)throw fail(409,'Pulihkan halaman dan daftarkan Gmail pemilik dahulu.');
        try{targetOwnerKey=ownerKey(data.confirmEmail);if(targetOwnerKey!==ownerKey(page.record.ownerEmail))throw 0;}catch{throw fail(409,'Sahkan Gmail pemilik semasa sebelum mengaktifkan bayaran.');}
      }else{
        reference=typeof data.reference==='string'?data.reference.normalize('NFC').trim():'';
        if(data.confirmRefund!==true||!reference||reference.length>100||/[\u0000-\u001f]/.test(reference))throw fail(400,'Sahkan pemulangan wang di luar SmartTap dan masukkan rujukannya.');
        if(page.record.gatewayApplied?.[id])throw fail(409,'Langganan telah diaktifkan. Semak pembetulan langganan secara berasingan.');
      }
      // Provider proof is fresh, independently queried, and tied to this exact invoice.
      const transactions=await provider.transactions(order.billCode);
      const match=transactions.find(tx=>String(tx.billpaymentStatus)==='1'&&tx.billExternalReferenceNo===id&&amountCents(tx.billpaymentAmount)===order.quote.amountCents&&tx.billpaymentInvoiceNo===order.invoice);
      if(!match)throw fail(409,'Transaksi berjaya yang sepadan belum dapat disahkan dengan ToyyibPay.');
      const intended=page.record.paymentResolution||{orderId:id,token:randomBytes(12).toString('hex'),action:data.action,note,targetOwnerKey,reference,changedBy:actor.email,startedAt:new Date(now()).toISOString()};
      if(intended.orderId!==id||intended.action!==data.action||intended.targetOwnerKey!==targetOwnerKey||intended.reference!==reference)throw fail(409,'Penyelesaian terdahulu sedang diproses. Sambung tindakan yang sama.');
      if(!page.record.paymentResolution)await savePage({store,id:order.pageId,previous:page,revision:data.pageRevision,changes:{paymentResolution:intended},actor,now});
      if(order.resolution){
        if(order.resolution.token!==intended.token)throw fail(409,'Penyelesaian telah berubah. Muat semula dahulu.');
      }else{
        const next={...order,resolution:intended};
        if(!await store.updateGatewayOrder(id,next,saved.revision))throw fail(409,'Pesanan sedang dikemas kini. Muat semula sebelum meneruskan.');
        order=next;
      }
      const resolution=order.resolution;
      let result;
      if(data.action==='apply'){
        result=await fulfill(order,match,resolution);
        if(result.status!=='paid')throw fail(409,'Pemilik atau status halaman berubah. Semak dan sambung tindakan yang sama.');
      }else{
        // Records an operator-confirmed external refund only. No money is sent by this API.
        await updatePage(order,{status:'resolved',invoice:order.invoice});
        result=await saveOrder(id,{status:'resolved',resolution:{...resolution,completedAt:new Date(now()).toISOString()}});
      }
      await clearResolution(result);return {checkout:checkoutView(result),page:view(order.pageId,await store.getVersion(order.pageId),actor)};
    },
    async callback(data){
      ready();verifyToyyibCallback(data,secretKey);const item=await store.getGatewayOrder(data.order_id);
      if(!item||item.record.billCode!==data.billcode||item.record.mode!==provider.mode||amountCents(data.amount)!==item.record.quote.amountCents)throw fail(403,'Notifikasi tidak sepadan dengan pesanan.');
      await reconcile(data.order_id,true);return {received:true};
    },
  };
}
