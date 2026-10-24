export const catalogTemplates={
 food:{ms:'Restoran / kafe',en:'Restaurant / cafe',categories:['Hidangan utama','Minuman','Pencuci mulut'],english:['Main dishes','Drinks','Desserts'],button:['Lihat menu','View menu']},
 automotive:{ms:'Kedai tayar / bengkel',en:'Tyre shop / workshop',categories:['Tayar','Servis kenderaan','Baik pulih','Aksesori'],english:['Tyres','Vehicle service','Repairs','Accessories'],button:['Lihat servis','View services']},
 legal:{ms:'Firma guaman',en:'Law firm',categories:['Hartanah','Korporat','Keluarga','Perundingan'],english:['Property','Corporate','Family','Consultation'],button:['Perkhidmatan guaman','Legal services']},
 salon:{ms:'Salon / kecantikan',en:'Salon / beauty',categories:['Rambut','Rawatan','Pakej'],english:['Hair','Treatments','Packages'],button:['Lihat rawatan','View treatments']},
 cleaning:{ms:'Servis pembersihan',en:'Cleaning services',categories:['Rumah','Pejabat','Cucian khusus'],english:['Home','Office','Specialist cleaning'],button:['Lihat servis','View services']},
 contractor:{ms:'Kontraktor / penyelenggaraan',en:'Contractor / maintenance',categories:['Renovasi','Elektrik','Paip','Pembaikan'],english:['Renovation','Electrical','Plumbing','Repairs'],button:['Lihat perkhidmatan','View services']},
 education:{ms:'Kelas / tuisyen',en:'Classes / tuition',categories:['Kelas','Subjek','Pakej'],english:['Classes','Subjects','Packages'],button:['Lihat kelas','View classes']},
 retail:{ms:'Kedai / produk',en:'Shop / products',categories:['Produk','Koleksi','Aksesori'],english:['Products','Collections','Accessories'],button:['Lihat katalog','View catalogue']},
 professional:{ms:'Perkhidmatan profesional',en:'Professional services',categories:['Perakaunan','Reka bentuk','Perundingan'],english:['Accounting','Design','Consultation'],button:['Lihat perkhidmatan','View services']},
 clinic:{ms:'Klinik / pergigian',en:'Clinic / dental',categories:['Pemeriksaan','Perkhidmatan','Temujanji'],english:['Check-ups','Services','Appointments'],button:['Lihat perkhidmatan','View services']},
 property:{ms:'Hartanah / penginapan',en:'Property / accommodation',categories:['Sewaan','Penginapan','Pakej'],english:['Rentals','Accommodation','Packages'],button:['Lihat pilihan','View options']},
 events:{ms:'Fotografi / acara',en:'Photography / events',categories:['Fotografi','Videografi','Pakej acara'],english:['Photography','Videography','Event packages'],button:['Lihat pakej','View packages']},
 custom:{ms:'Tersuai / lain-lain',en:'Custom / other',categories:['Produk','Perkhidmatan','Pakej'],english:['Products','Services','Packages'],button:['Lihat katalog','View catalogue']},
};
export const catalogUnits={'':['Sekali / tanpa unit','One-off / no unit'],unit:['Seunit','Per unit'],hour:['Sejam','Per hour'],session:['Sesi','Per session'],day:['Sehari','Per day'],night:['Semalam','Per night'],month:['Sebulan','Per month'],project:['Projek','Per project']};
export const MAX_CATALOG_ITEMS=50;
export const catalogURL=(origin,id)=>origin+'/menu/?s='+id;
const fail=text=>Object.assign(new Error(text),{status:400});
function text(value,max,required=false){if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw fail('Teks katalog tidak sah.');const result=value.normalize('NFC').trim();if(result.length>max||(required&&!result))throw fail('Lengkapkan nama dan kategori item.');return result;}
export function validateServiceCatalog(value,{id,mediaOrigin}){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!['v','enabled','kind','items'].includes(key))||value.v!==1||typeof value.enabled!=='boolean'||!Object.hasOwn(catalogTemplates,value.kind)||!Array.isArray(value.items)||value.items.length>MAX_CATALOG_ITEMS)throw fail('Katalog tidak sah. Had maksimum 50 item.');
 if(value.enabled&&!value.items.length)throw fail('Tambah sekurang-kurangnya satu item untuk menerbitkan katalog.');
 const ids=new Set(),items=value.items.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(key=>!['id','name','category','description','priceMode','priceCents','unit','status','photo'].includes(key))||!/^\b[a-f0-9]{16}$/.test(item.id||'')||ids.has(item.id))throw fail('Item katalog tidak sah atau berulang.');ids.add(item.id);
  if(!['fixed','from','quote','free'].includes(item.priceMode)||!['available','unavailable','hidden'].includes(item.status)||!Object.hasOwn(catalogUnits,item.unit))throw fail('Pilihan harga atau status tidak sah.');
  const priced=['fixed','from'].includes(item.priceMode);if(priced?(!Number.isSafeInteger(item.priceCents)||item.priceCents<0||item.priceCents>100000000):(item.priceCents!==null||item.unit!==''))throw fail('Harga katalog tidak sah.');
  const photo=text(item.photo,500);if(photo){const expected=mediaOrigin+'/api/catalog-media/'+id+'/';if(!photo.startsWith(expected)||!new RegExp('^[a-f0-9]{24}\\.webp$').test(photo.slice(expected.length)))throw fail('Gambar mesti dimuat naik untuk halaman ini.');}
  return {id:item.id,name:text(item.name,80,true),category:text(item.category,40,true),description:text(item.description,300),priceMode:item.priceMode,priceCents:item.priceCents,unit:item.unit,status:item.status,photo};
 });
 const catalog={v:1,enabled:value.enabled,kind:value.kind,items};if(new TextEncoder().encode(JSON.stringify(catalog)).length>65000)throw fail('Katalog terlalu besar. Ringkaskan maklumat item.');return catalog;
}
export function applyServiceCatalog(profile,value,{id,origin,mediaOrigin}){
 if(value===undefined)return {profile};
 const catalog=validateServiceCatalog(value,{id,mediaOrigin}),next={...profile};
 if(catalog.enabled)next.menu=catalogURL(origin,id);else if(next.menu===catalogURL(origin,id))next.menu='';
 return {profile:next,catalog};
}
export function catalogPrice(item,language='ms'){
 const en=language==='en';if(item.priceMode==='quote')return en?'Request a quote':'Minta sebut harga';if(item.priceMode==='free')return en?'Free':'Percuma';
 const money='RM'+(item.priceCents/100).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
 const suffix={unit:en?'unit':'unit',hour:en?'hour':'jam',session:en?'session':'sesi',day:en?'day':'hari',night:en?'night':'malam',month:en?'month':'bulan',project:en?'project':'projek'}[item.unit];
 return (item.priceMode==='from'?(en?'From ':'Bermula '):'')+money+(suffix?' / '+suffix:'');
}
export function parseCatalogPrice(value){if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(String(value)))throw fail('Masukkan harga yang sah, maksimum dua tempat perpuluhan.');const [whole,decimal='']=String(value).split('.');const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));if(cents>100000000)throw fail('Harga melebihi had katalog.');return cents;}
