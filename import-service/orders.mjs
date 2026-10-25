import {ownerKey} from './identity.mjs';
import {validId} from './admin.mjs';
import {malaysiaPhone} from './contacts.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const validOrder=id=>/^ST[a-f0-9]{24}$/.test(id||'');
export const deliveryStates=['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'];
const physical=order=>!!(order.quote.includesPhysical||order.quote.items?.some(item=>['bundle','nfc','extra_nfc','table_sticker'].includes(item.id)&&item.quantity>0));
const state=order=>order.status!=='paid'?'unpaid':!physical(order)?'completed':order.fulfillment?.state||'awaiting_address';
function text(value,max,required=true){
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/u.test(value))throw fail(400,'Maklumat penghantaran tidak sah.');
 const result=value.normalize('NFC').trim();if(required&&!result)throw fail(400,'Lengkapkan maklumat penghantaran.');return result;
}
function address(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!['name','phone','line1','line2','postcode','city','state','notes'].includes(key)))throw fail(400,'Maklumat alamat tidak sah.');
 const result={name:text(value.name,100),phone:malaysiaPhone(text(value.phone,30)),line1:text(value.line1,160),line2:text(value.line2||'',160,false),postcode:text(value.postcode,5),city:text(value.city,80),state:text(value.state,40),notes:text(value.notes||'',300,false),country:'MY'};
 if(!result.phone||!/^\d{5}$/.test(result.postcode)||!deliveryStates.includes(result.state))throw fail(400,'Semak telefon Malaysia, poskod 5 digit dan negeri.');return result;
}
function tracking(value){
 const courier=text(value.courier||'',80,false),number=text(value.trackingNumber||'',100,false),url=text(value.trackingURL||'',500,false);
 if(url){let parsed;try{parsed=new URL(url);}catch{throw fail(400,'Pautan tracking tidak sah.');}if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port&&parsed.port!=='443'||!parsed.hostname.includes('.'))throw fail(400,'Gunakan pautan tracking HTTPS yang sah.');}
 return {courier,trackingNumber:number,trackingURL:url};
}
export function createOrdersService({store,now=Date.now}){
 async function page(id,actor){
  validId(id);if(!actor?.email||!['admin','user'].includes(actor.role))throw fail(403,'Login diperlukan.');
  const result=await store.getVersion(id);if(!result||actor.role!=='admin'&&result.record.lifecycle?.state==='deleted')throw fail(404,'Pesanan tidak tersedia.');
  if(actor.role!=='admin'){let allowed=false;try{allowed=ownerKey(result.record.ownerEmail)===ownerKey(actor.email);}catch{}if(!allowed)throw fail(404,'Pesanan tidak tersedia.');}return result;
 }
 async function load(pageId,id,actor){
  await page(pageId,actor);if(!validOrder(id))throw fail(404,'Pesanan tidak ditemui.');const item=await store.getGatewayOrder(id);
  if(!item||item.record.pageId!==pageId||actor.role!=='admin'&&item.record.ownerKey!==ownerKey(actor.email))throw fail(404,'Pesanan tidak ditemui.');return item;
 }
 function summary(order){return {id:order.id,pageId:order.pageId,paymentStatus:order.status,mode:order.mode,amountCents:order.quote.amountCents,currency:'MYR',createdAt:order.createdAt,paidAt:order.status==='paid'?order.verifiedAt||null:null,invoice:order.invoice||null,includesPhysical:physical(order),fulfillmentState:state(order)};}
 function view(item,actor){const order=item.record;return {...summary(order),revision:item.revision,alertAcknowledgedAt:order.alertAcknowledgedAt||null,...(actor?.role==='admin'?{resolution:order.resolution||null}:{}),items:order.quote.items||[],shippingCents:order.quote.shippingCents||0,shipping:order.shipping||null,fulfillment:order.fulfillment?{state:order.fulfillment.state,courier:order.fulfillment.courier||'',trackingNumber:order.fulfillment.trackingNumber||'',trackingURL:order.fulfillment.trackingURL||'',updatedAt:order.fulfillment.updatedAt,timeline:(order.fulfillment.timeline||[]).map(({state,at})=>({state,at}))}:null};}
 async function write(pageId,id,data,actor,kind){
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>!['revision',...(kind==='address'?['address']:['state','courier','trackingNumber','trackingURL'])].includes(key)))throw fail(400,'Maklumat pesanan tidak sah.');
  if(kind==='fulfillment'&&actor?.role!=='admin')throw fail(403,'Hanya super admin boleh mengemas kini penghantaran.');
  const previous=await load(pageId,id,actor),order=previous.record;
  if(typeof data.revision!=='string'||data.revision!==previous.revision)throw fail(409,'Pesanan telah berubah. Muat semula sebelum menyimpan.');
  if(order.status!=='paid'||!physical(order))throw fail(409,'Alamat dan penghantaran hanya untuk pesanan fizikal yang telah dibayar.');
  const current=state(order),at=new Date(now()).toISOString();let next;
  if(kind==='address'){
   if(['shipped','completed'].includes(current))throw fail(409,'Pesanan sudah dihantar. Hubungi super admin untuk pembetulan alamat.');
   const nextState=current==='awaiting_address'?'received':current;
   next={...order,shipping:address(data.address),fulfillment:{...order.fulfillment,state:nextState,updatedAt:at,updatedBy:actor.email,timeline:[...(order.fulfillment?.timeline||[]),{state:nextState,at}].slice(-30)}};
  }else{
   const allowed={received:['preparing'],preparing:['preparing','shipped'],shipped:['shipped','completed'],completed:['completed']};
   if(!allowed[current]?.includes(data.state)||!order.shipping)throw fail(409,'Lengkapkan alamat dan ikut status penyediaan sebelum penghantaran.');
   const details=tracking(data);if(['shipped','completed'].includes(data.state)&&(!details.courier||!details.trackingNumber))throw fail(400,'Masukkan kurier dan nombor tracking.');
   next={...order,fulfillment:{...order.fulfillment,...details,state:data.state,updatedAt:at,updatedBy:actor.email,timeline:[...(order.fulfillment?.timeline||[]),{state:data.state,at}].slice(-30)}};
  }
  await page(pageId,actor);
  if(!await store.updateGatewayOrder(id,next,previous.revision))throw fail(409,'Pesanan sedang dikemas kini. Muat semula sebelum menyimpan.');
  // Recheck both current page ownership and the original paying owner before returning an address.
  return view(await load(pageId,id,actor),actor);
 }
 return {
  async list(pageId,actor,cursor){
   const item=await page(pageId,actor);if(cursor!==null&&cursor!==undefined&&!/^\d{1,7}$/.test(cursor))throw fail(400,'Halaman pesanan tidak sah.');
   const ids=[...new Set([...(item.record.checkoutIds||[]).slice().reverse(),item.record.checkout?.id,...Object.keys(item.record.gatewayApplied||{}).reverse()].filter(validOrder))];
   const offset=Number(cursor||0);const orders=await Promise.all(ids.slice(offset,offset+25).map(async id=>{const saved=await store.getGatewayOrder(id);return saved&&saved.record.pageId===pageId&&(actor.role==='admin'||saved.record.ownerKey===ownerKey(actor.email))?summary(saved.record):null;}));
   await page(pageId,actor);return {items:orders.filter(Boolean),cursor:offset+25<ids.length?String(offset+25):null};
  },
  async get(pageId,id,actor){const result=await load(pageId,id,actor);await page(pageId,actor);return view(result,actor);},
  async acknowledge(pageId,id,data={},actor){
   if(actor?.role!=='admin')throw fail(403,'Hanya super admin boleh menandakan pesanan dilihat.');
   if(!data||Object.keys(data).some(key=>key!=='revision'))throw fail(400,'Maklumat pesanan tidak sah.');
   const item=await load(pageId,id,actor);
   if(item.record.status!=='paid')throw fail(409,'Hanya pesanan yang dibayar boleh ditandakan dilihat.');
   if(item.record.alertAcknowledgedAt)return view(item,actor);
   if(data.revision!==item.revision)throw fail(409,'Pesanan telah berubah. Muat semula dahulu.');
   if(!await store.updateGatewayOrder(id,{...item.record,alertAcknowledgedAt:new Date(now()).toISOString(),alertAcknowledgedBy:actor.email},item.revision))throw fail(409,'Pesanan telah berubah. Muat semula dahulu.');
   return view(await load(pageId,id,actor),actor);
  },
  address:(pageId,id,data,actor)=>write(pageId,id,data,actor,'address'),
  fulfill:(pageId,id,data,actor)=>write(pageId,id,data,actor,'fulfillment'),
 };
}
