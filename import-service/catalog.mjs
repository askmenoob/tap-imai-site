import {hasEntitlement,hasAnnualEntitlement} from './page-state.mjs';
const fail=message=>Object.assign(new Error(message),{status:400});
export function createCatalog({stickerCents=2000,shippingCents=0}={}){
  for(const price of [stickerCents,shippingCents])if(price!==null&&(!Number.isSafeInteger(price)||price<0||price>100000))throw Error('Invalid product price');
  const packages=[{id:'bundle',name:'Google Review NFC + QR',amountCents:10000,months:12,description:'1 NFC terus ke Google Review dan halaman QR SmartTap untuk tahun pertama.'},{id:'nfc',name:'Google Review NFC sahaja',amountCents:7000,months:0,description:'1 NFC terus ke Google Review. Bayaran sekali; tiada halaman QR SmartTap.'},{id:'renew',name:'Renew halaman QR',amountCents:3000,months:12,description:'Sambungan halaman QR selama setahun selepas langganan pertama.'},{id:'addons',name:'Add-on sahaja',amountCents:0,months:0,description:'Tambahan NFC atau table sticker untuk pelanggan sedia ada.'}];
  return {
    config:{currency:'MYR',packages,extraNfcCents:3000,stickerCents,stickerBulkCents:1500,stickerBulkMinimum:20,shippingCents,shippingNote:'Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.'},
    quote(record,{package:kind,extraNfcQty=0,stickerQty=0}={}){
      if(!Number.isSafeInteger(extraNfcQty)||extraNfcQty<0||extraNfcQty>10||!Number.isSafeInteger(stickerQty)||stickerQty<0||stickerQty>200)throw fail('Kuantiti add-on tidak sah.');
      const hasAnnual=hasAnnualEntitlement(record);
      const product=packages.find(item=>item.id===kind);if(!product)throw fail('Pilih pakej yang sah.');
      if(kind==='renew'&&!hasAnnual)throw fail('Renew RM30 tersedia selepas langganan NFC + QR pertama.');
      if(kind==='bundle'&&hasAnnual)throw fail('Gunakan pakej renew RM30 untuk halaman yang sudah melanggan.');
      if(kind==='addons'&&(!hasEntitlement(record)||!extraNfcQty&&!stickerQty))throw fail('Add-on sahaja memerlukan langganan atau pembelian terdahulu dan sekurang-kurangnya satu item.');
      const items=[{id:kind,name:product.name,quantity:1,unitCents:product.amountCents,totalCents:product.amountCents}];
      if(extraNfcQty)items.push({id:'extra_nfc',name:'Google Review NFC tambahan',quantity:extraNfcQty,unitCents:3000,totalCents:extraNfcQty*3000});
      if(stickerQty){if(stickerCents===null)throw fail('Harga NFC table sticker belum ditetapkan.');const unitCents=stickerQty>=20?1500:stickerCents;items.push({id:'table_sticker',name:'NFC table sticker',quantity:stickerQty,unitCents,totalCents:stickerQty*unitCents});}
      const physical=['bundle','nfc'].includes(kind)||extraNfcQty>0||stickerQty>0;
      if(physical&&shippingCents===null)throw fail('Caj penghantaran belum ditetapkan. Hubungi super admin sebelum membayar.');
      const deliveryCents=physical?shippingCents:0;
      return {package:kind,extraNfcQty,stickerQty,items,shippingCents:deliveryCents,amountCents:items.reduce((sum,item)=>sum+item.totalCents,0)+deliveryCents,currency:'MYR',months:product.months,includesPhysical:physical};
    },
  };
}
