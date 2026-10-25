export function orderSupportLink(item,{customer=false,language='ms',orderId=null}={}){
  const approved=item.renewal?.status==='approved'?item.renewal:null;
  const id=orderId||approved?.id||item.subscription?.lastPaymentId;
  if(!customer||item.manualState==='deleted')return null;
  const en=language==='en';
  const lines=[en?'Hello SmartTap super admin, I need assistance.':'Salam super admin SmartTap, saya perlukan bantuan.',(en?'Business: ':'Perniagaan: ')+item.profile.name];
  if(typeof id==='string'&&id)lines.push((en?'Order ID: ':'ID pesanan: ')+id);
  if(approved&&id===approved.id){
    if(approved.items?.length)lines.push((en?'Order: ':'Pesanan: ')+approved.items.map(line=>line.name+' × '+line.quantity).join(', '));
    if(approved.reference)lines.push((en?'Payment reference: ':'Rujukan bayaran: ')+approved.reference);
  }
  const note=item.adminMessage?.status!=='resolved'?item.adminMessage?.text: null;
  const message=note||(!item.adminMessage?item.renewal?.note:'');
  if(message)lines.push((en?'Admin message: ':'Mesej admin: ')+message);
  lines.push((en?'Page link: ':'Pautan halaman: ')+item.url);
  lines.push('',en?'My enquiry: ':'Pertanyaan saya: ');
  const url=new URL('https://wa.me/60103250032');url.searchParams.set('text',lines.join('\n'));
  return {url:url.href};
}
