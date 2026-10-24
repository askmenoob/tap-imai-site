export function orderSupportLink(item,{customer=false,language='ms'}={}){
  const approved=item.renewal?.status==='approved'?item.renewal:null;
  const id=approved?.id||item.subscription?.lastPaymentId;
  if(!customer||typeof id!=='string'||!id||item.manualState==='deleted')return null;
  const shipping=approved?.provider==='toyyibpay'&&!!(approved.includesPhysical||approved.items?.some(line=>['bundle','nfc','extra_nfc','table_sticker'].includes(line.id)&&line.quantity>0));
  const en=language==='en';
  const lines=[shipping?(en?'Hello SmartTap super admin, my payment is confirmed. Here are the delivery details for my NFC order.':'Salam super admin SmartTap, bayaran saya telah disahkan. Berikut maklumat penghantaran pesanan NFC saya.'):(en?'Hello SmartTap super admin, I would like to ask about my confirmed order.':'Salam super admin SmartTap, saya ingin bertanya tentang pesanan yang telah disahkan.'),(en?'Business: ':'Perniagaan: ')+item.profile.name,(en?'Order ID: ':'ID pesanan: ')+id];
  if(approved?.items?.length)lines.push((en?'Order: ':'Pesanan: ')+approved.items.map(line=>line.name+' × '+line.quantity).join(', '));
  if(shipping)lines.push((en?'Payment reference: ':'Rujukan bayaran: ')+approved.reference,'',...(en?['Recipient name: ','Contact number: ','Delivery address: ','Postcode: ','City: ','State: ','Delivery notes (optional): ']:['Nama penerima: ','Nombor telefon: ','Alamat penghantaran: ','Poskod: ','Bandar: ','Negeri: ','Nota penghantaran (pilihan): ']),'');
  lines.push((en?'Page link: ':'Pautan halaman: ')+item.url);
  const url=new URL('https://wa.me/60103250032');url.searchParams.set('text',lines.join('\n'));
  return {url:url.href,shipping};
}
