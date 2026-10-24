import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {ownerKey} from './identity.mjs';
import {validId,pageView,savePage} from './admin.mjs';
import {createCatalog} from './catalog.mjs';
import {annualEnd} from './page-state.mjs';
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
export function createToyyibCheckout({store,provider,secretKey='',categoryCode='',enabled=false,accountVerified=false,duitNowQR=false,origin='https://tap.imai.my',apiOrigin='https://tap-business-import-262870839474.asia-southeast1.run.app',now=Date.now,newId=()=> 'ST'+randomBytes(12).toString('hex')}){
  const catalog=createCatalog(),flights=new Map(),lastChecks=new Map();
  const configured=!!(secretKey&&categoryCode&&provider),operational=!!(configured&&enabled&&(provider.mode==='sandbox'||accountVerified));
  const ready=()=>{if(!operational)throw fail(503,'Pembayaran ToyyibPay belum dibuka. Gunakan bayaran manual atau hubungi super admin.');};
  const view=(id,item,actor)=>pageView({id,...item},origin,actor.role==='admin',now());
  async function owned(id,actor){
    validId(id);const page=await store.getVersion(id);if(!page||page.record.lifecycle?.state==='deleted')throw fail(404,'Halaman tidak tersedia.');
    if(actor?.role!=='admin'){
      let owns=false;try{owns=actor?.role==='user'&&ownerKey(page.record.ownerEmail)===ownerKey(actor.email);}catch{}
      if(!owns)throw fail(404,'Halaman tidak tersedia untuk akaun Gmail anda.');
    }
    return page;
  }
  const checkoutView=order=>({id:order.id,pageId:order.pageId,status:order.status,amountCents:order.quote.amountCents,currency:'MYR',mode:order.mode,billCode:order.billCode||null,paymentUrl:order.billCode&&!['paid','cancelled','review'].includes(order.status)?provider.host+'/'+order.billCode:null,invoice:order.invoice||null,createdAt:order.createdAt,verifiedAt:order.verifiedAt||null});
  async function saveOrder(id,changes){for(let retry=0;retry<6;retry++){const item=await store.getGatewayOrder(id);if(!item)throw fail(404,'Pesanan tidak ditemui.');if(item.record.status==='paid'&&changes.status&&changes.status!=='paid')return item.record;const next={...item.record,...changes};if(await store.updateGatewayOrder(id,next,item.revision))return next;}throw fail(409,'Pesanan sedang dikemas kini. Cuba semula.');}
  async function updatePage(order,changes){
    for(let retry=0;retry<6;retry++){
      const item=await store.getVersion(order.pageId);if(!item)throw fail(404,'Halaman tidak ditemui.');
      if(item.record.checkout?.id!==order.id||item.record.checkout.status==='paid'&&changes.status!=='paid')return item;
      try{return await savePage({store,id:order.pageId,previous:item,revision:item.revision,changes:{checkout:{...item.record.checkout,...changes}},actor:{email:'toyyibpay'},now});}catch(error){if(error.status!==409)throw error;}
    }throw fail(409,'Halaman sedang dikemas kini. Cuba semula.');
  }
  async function fulfill(order,tx){
    const invoice=tx.billpaymentInvoiceNo;
    if(typeof invoice!=='string'||!/^[-A-Za-z0-9_]{1,100}$/.test(invoice))throw fail(502,'Rujukan ToyyibPay tidak sah.');
    const claim={provider:'toyyibpay',mode:order.mode,orderId:order.id,pageId:order.pageId,invoice};
    const key=digest('toyyibpay|'+order.mode+'|'+invoice);
    if(!await store.claimPayment(key,claim)){const existing=await store.getPayment(key);if(existing?.orderId!==order.id||existing?.pageId!==order.pageId)throw fail(409,'Transaksi ini telah digunakan untuk pesanan lain.');}
    for(let retry=0;retry<6;retry++){
      const previous=await store.getVersion(order.pageId);if(!previous)throw fail(404,'Halaman tidak ditemui.');
      if(previous.record.gatewayApplied?.[order.id])return saveOrder(order.id,{status:'paid',invoice,verifiedAt:new Date(now()).toISOString()});
      let recipient=false;try{recipient=ownerKey(previous.record.ownerEmail)===order.ownerKey;}catch{}
      if(!recipient||previous.record.lifecycle?.state==='deleted'||order.status==='cancelled')return saveOrder(order.id,{status:'review',invoice,verifiedAt:new Date(now()).toISOString()});
      const old=previous.record.subscription,changes={gatewayApplied:{...previous.record.gatewayApplied,[order.id]:invoice},renewal:{id:order.id,status:'approved',provider:'toyyibpay',reference:invoice,paidDate:new Date(now()).toISOString().slice(0,10),...order.quote,submittedAt:order.createdAt,decidedAt:new Date(now()).toISOString(),decidedBy:'toyyibpay'}};
      if(order.quote.months===12){const expiry=Date.parse(old?.expiresAt||'');const start=Math.max(Number.isFinite(expiry)?expiry:0,now());changes.subscription={plan:'annual',currency:'MYR',lastOrderCents:order.quote.amountCents,renewalCents:3000,startsAt:old?.startsAt||new Date(now()).toISOString(),expiresAt:annualEnd(start),lastPaymentId:order.id};}
      else if(old?.plan!=='annual'||!old.lastPaymentId)changes.subscription={plan:'nfc_only',currency:'MYR',lastPaymentId:order.id};
      if(previous.record.checkout?.id===order.id)changes.checkout={...previous.record.checkout,status:'paid',invoice};
      try{await savePage({store,id:order.pageId,previous,revision:previous.revision,changes,actor:{email:'toyyibpay'},now});return saveOrder(order.id,{status:'paid',invoice,verifiedAt:new Date(now()).toISOString()});}catch(error){if(error.status!==409)throw error;}
    }throw fail(409,'Bayaran diterima tetapi pengaktifan sedang dikemas kini. Semak semula status.');
  }
  async function reconcile(id,force=false){
    if(flights.has(id))return flights.get(id);
    const work=(async()=>{
      const saved=await store.getGatewayOrder(id);if(!saved)throw fail(404,'Pesanan tidak ditemui.');const order=saved.record;
      if(order.mode!==provider.mode)throw fail(409,'Persekitaran pembayaran tidak sepadan.');
      if(['paid','review'].includes(order.status)||!order.billCode)return order;
      if(!force&&now()-(lastChecks.get(id)||0)<10000)return order;
      lastChecks.set(id,now());if(lastChecks.size>1000)lastChecks.delete(lastChecks.keys().next().value);
      const transactions=await provider.transactions(order.billCode);
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
    config(){return {enabled:operational,configured,mode:provider?.mode||'live',duitNowQR:operational&&duitNowQR,reason:operational?'ready':configured&&!accountVerified&&provider?.mode==='live'?'awaiting_verification':'not_enabled'};},
    async create(id,data={},actor){
      ready();if(Object.keys(data).some(key=>!['package','extraNfcQty','stickerQty','revision','expectedAmountCents'].includes(key)))throw fail(400,'Maklumat pesanan tidak sah.');
      const previous=await owned(id,actor);if(!previous.record.ownerEmail)throw fail(409,'Daftarkan Gmail pemilik dahulu.');
      const old=previous.record.checkout;
      if(old&&!['paid','cancelled','creation_failed'].includes(old.status)){
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
      await savePage({store,id,previous,revision:data.revision,changes:{checkout:{id:idOrder,status:'creating',mode:provider.mode,amountCents:quote.amountCents,createdAt:order.createdAt,recipientKey:order.ownerKey}},actor,now});
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
      const checked=await reconcile(id,true);if(['paid','review'].includes(checked.status))throw fail(409,'Bayaran telah diterima; pesanan tidak boleh dibatalkan.');
      if(!checked.billCode)throw fail(409,'Bil belum dapat dibatalkan. Hubungi super admin.');
      await owned(checked.pageId,actor);await provider.cancel(checked.billCode);const after=await reconcile(id,true);if(['paid','review'].includes(after.status))throw fail(409,'Bayaran telah diterima; pesanan tidak boleh dibatalkan.');const result=await saveOrder(id,{status:'cancelled'});await updatePage(result,{status:result.status});return {checkout:checkoutView(result),page:view(result.pageId,await owned(result.pageId,actor),actor)};
    },
    async callback(data){
      ready();verifyToyyibCallback(data,secretKey);const item=await store.getGatewayOrder(data.order_id);
      if(!item||item.record.billCode!==data.billcode||item.record.mode!==provider.mode||amountCents(data.amount)!==item.record.quote.amountCents)throw fail(403,'Notifikasi tidak sepadan dengan pesanan.');
      await reconcile(data.order_id,true);return {received:true};
    },
  };
}
