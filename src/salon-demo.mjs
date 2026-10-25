import {renderCard} from './public-card.mjs';

// Fictional, entirely static showcase. All business actions stay inside the
// demo; no customer, Place ID, booking, payment or external message is created.
const root='/demo/salon/',dialog=document.querySelector('#demo-dialog'),content=document.querySelector('#demo-dialog-content'),title=document.querySelector('#demo-dialog-title');
let language='ms',active='',opener,selectedService='';try{if(localStorage.getItem('smarttap.language')==='en')language='en';}catch{}
const L=(ms,en)=>language==='en'?en:ms;
const categories={cut:['Potongan','Haircuts'],colour:['Warna','Colour'],care:['Rawatan','Treatments'],style:['Penggayaan','Styling']};
const services=[
 {id:'cut',category:'cut',name:['Potong, cuci & blow','Cut, wash & blow-dry'],description:['Konsultasi gaya, cucian dan kemasan harian.','Style consultation, wash and everyday finish.'],price:55,duration:'60'},
 {id:'kids',category:'cut',name:['Potongan kanak-kanak','Children’s haircut'],description:['Potongan ringkas untuk kanak-kanak bawah 12 tahun.','A simple cut for children under 12.'],price:30,duration:'30'},
 {id:'colour',category:'colour',name:['Warna rambut','Hair colour'],description:['Pilihan tona selepas konsultasi. Harga mengikut panjang dan keadaan rambut.','Choose a tone after consultation. Price depends on hair length and condition.'],price:150,from:true,duration:'120–180'},
 {id:'keratin',category:'care',name:['Rawatan keratin','Keratin treatment'],description:['Rawatan untuk kemasan rambut yang lebih mudah diurus.','A treatment for a more manageable finish.'],price:280,from:true,duration:'120–180'},
 {id:'scalp',category:'care',name:['Penjagaan kulit kepala','Scalp care'],description:['Konsultasi, cucian dan penjagaan kulit kepala.','Consultation, cleansing and scalp care.'],price:120,duration:'60'},
 {id:'event',category:'style',name:['Gaya untuk acara','Event styling'],description:['Penggayaan mengikut acara dan pilihan anda. Bincang keperluan dengan stylist.','Styling for your occasion and preferences. Discuss your needs with the stylist.'],price:null,duration:null},
];
const end=new Date(Date.now()+30*86400000+8*3600000).toISOString().slice(0,10);
const text=(tag,value,cls)=>{const n=document.createElement(tag);if(value)n.textContent=value;if(cls)n.className=cls;return n;};
const copy=value=>language==='en'?value[1]:value[0];
const price=item=>item.price===null?L('Minta sebut harga','Request a quote'):(item.from?L('Bermula ','From '):'')+'RM'+item.price.toFixed(2);
function paragraph(value,cls){content.append(text('p',value,cls));}
function note(){paragraph(L('Ini ialah demo. Semua harga, alamat dan profil ialah contoh. Tiada tempahan, mesej, ulasan atau bayaran sebenar dihantar.','This is a demo. Prices, addresses and profiles are examples. No real booking, message, review or payment is submitted.'),'demo-note');}
function profile(){return {v:1,name:'Ruang Rambut',theme:'bright',accent:'#80503d',logo:root+'logo.svg',cover:root+'cover.webp',
 tagline:L('Gaya yang serasi. Ruang untuk diri sendiri.\nPotongan, warna dan penjagaan rambut dalam suasana santai.','A style that feels like you. A little time for yourself.\nHaircuts, colour and hair care in a relaxed setting.'),
 google:root+'#review',whatsapp:root+'#whatsapp',menu:root+'#services',menuLabel:L('Servis & harga','Services & prices'),directions:root+'#location',website:root+'#about',instagram:root+'#instagram',facebook:root+'#facebook',tiktok:root+'#tiktok',
 address:L('Lot Demo 8, Jalan Seri 2\nSeksyen 13, 40100 Shah Alam, Selangor\nAlamat contoh — bukan premis sebenar.','Demo Lot 8, Jalan Seri 2\nSection 13, 40100 Shah Alam, Selangor\nExample address — not a real business.'),
 hours:L('Selasa–Jumaat: 10:00–19:00\nSabtu–Ahad: 10:00–20:00\nIsnin: Tutup\nTemu janji disyorkan. Walk-in mengikut kekosongan.','Tuesday–Friday: 10:00–19:00\nSaturday–Sunday: 10:00–20:00\nMonday: Closed\nAppointments recommended. Walk-ins subject to availability.'),
 promoTitle:L('Hari untuk gaya baharu · RM49','A day for a fresh style · RM49'),promoText:L('Potong, cuci & blow untuk pelanggan baharu.\nSelasa–Khamis, 10 pagi hingga 3 petang.\nTawaran contoh sehingga ','Cut, wash & blow-dry for new customers.\nTuesday–Thursday, 10 am to 3 pm.\nExample offer until ')+new Date(end+'T12:00:00+08:00').toLocaleDateString(language==='en'?'en-MY':'ms-MY',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kuala_Lumpur'})+'.',promoURL:root+'#promotion',promoStart:'2026-01-01T00:00',promoEnd:end+'T23:59'};}
function render(){
 const p=profile(),page=renderCard(document,p);document.querySelector('#root').replaceChildren(page);
 for(const a of page.querySelectorAll('a')){const key=new URL(a.href,location.href).hash.slice(1);a.removeAttribute('target');a.addEventListener('click',event=>{event.preventDefault();selectedService='';show(key);});if(key==='whatsapp')a.querySelector('span').textContent=L('Tempah sesi melalui WhatsApp','Book a session on WhatsApp');}
 document.querySelector('.demo-banner strong').textContent=L('DEMO SALON','SALON DEMO');document.querySelector('.demo-banner span').textContent=L('Salon rekaan · Harga & maklumat contoh','Fictional salon · Sample prices & details');document.querySelector('#demo-home').textContent=L('Kembali ke SmartTap','Back to SmartTap');document.querySelector('#demo-close').setAttribute('aria-label',L('Tutup contoh','Close example'));document.title=L('Ruang Rambut — Demo Salon SmartTap','Ruang Rambut — SmartTap Salon Demo');
 if(dialog.open)show(active,true);
}
function show(key,refresh=false){
 if(!dialog.open)opener=document.activeElement;active=key;content.replaceChildren();
 const names={services:L('Servis & harga','Services & prices'),whatsapp:L('Tempahan salon','Salon appointments'),review:L('Ulasan Google','Google reviews'),location:L('Lokasi & waktu operasi','Location & opening hours'),promotion:L('Pakej gaya baharu RM49','Fresh style package RM49'),about:L('Tentang Ruang Rambut','About Ruang Rambut'),instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok'};
 title.textContent=names[key]||'Ruang Rambut';
 if(key==='services'){
  paragraph(L('Pilih servis yang sesuai dengan anda. Harga dan tempoh di bawah ialah contoh untuk demonstrasi.','Find a service that suits you. Prices and durations below are demonstration examples.'));
  const filter=text('select');filter.id='demo-menu-category';const label=text('label',L('Kategori servis','Service category'));label.htmlFor=filter.id;
  for(const [value,labels] of [['',['Semua servis','All services']],...Object.entries(categories)]){const o=text('option',copy(labels));o.value=value;filter.append(o);}content.append(label,filter);
  const list=text('div',null,'demo-menu-list');list.id='demo-services';content.append(list);
  function draw(){list.replaceChildren();for(const item of services){if(filter.value&&item.category!==filter.value)continue;const card=text('article',null,'demo-menu-item'),head=text('div',null,'demo-menu-heading');head.append(text('h3',copy(item.name)),text('strong',price(item)));card.append(head,text('p',copy(item.description)));if(item.duration)card.append(text('p',L('Anggaran ','Approx. ')+item.duration+L(' minit',' minutes'),'demo-service-meta'));const ask=text('button',L('Contoh pertanyaan ↗','Example enquiry ↗'),'demo-service-enquiry');ask.type='button';ask.onclick=()=>{selectedService=copy(item.name);show('whatsapp');};card.append(ask);list.append(card);}}
  filter.onchange=draw;draw();note();
 }else if(key==='whatsapp'||key==='promotion'){
  if(key==='promotion')paragraph(profile().promoText,'demo-preserve');
  paragraph(L('Contoh mesej yang disediakan untuk pelanggan:','Example message prepared for a customer:'));
  content.append(text('blockquote',L('Salam Ruang Rambut, saya ingin menempah ','Hello Ruang Rambut, I would like to book ')+(selectedService||(key==='promotion'?L('pakej RM49','the RM49 package'):L('sesi potong, cuci & blow','a cut, wash & blow-dry')))+L('. Adakah Sabtu jam 11 pagi masih tersedia? Nama saya: ____.','. Is Saturday at 11 am available? My name is: ____.')));
  paragraph(L('Pada halaman sebenar, pautan membuka WhatsApp salon. Pelanggan menyemak dan menghantar mesej sendiri; salon mengesahkan kekosongan.','On a real page, the link opens the salon’s WhatsApp. Customers review and send the message themselves; the salon confirms availability.'));note();
 }else if(key==='location'){
  paragraph(profile().address,'demo-preserve');paragraph(profile().hours,'demo-preserve');paragraph(L('Contoh kemudahan: parkir berdekatan, ruang menunggu selesa dan konsultasi gaya sebelum servis.','Example amenities: nearby parking, a comfortable waiting area and a style consultation before service.'));note();
 }else if(key==='review'){
  paragraph(L('Ceritakan pengalaman anda: gaya rambut baharu, layanan stylist dan suasana salon.','Share your experience: your new hairstyle, the stylist’s service and the salon atmosphere.'));paragraph(L('Halaman sebenar membuka borang ulasan Google bagi lokasi salon yang telah disambungkan. Demo ini tidak mempunyai penyenaraian Google sebenar.','A real page opens the Google review form for the connected salon location. This demo has no real Google listing.'));note();
 }else if(['instagram','facebook','tiktok'].includes(key)){
  content.append(text('strong','@ruangrambut.demo','demo-handle'));paragraph(L('Contoh kandungan salon: hasil potongan, inspirasi warna, tip penjagaan dan promosi bermusim.','Example salon content: haircut results, colour inspiration, care tips and seasonal promotions.'));paragraph(L('Nama profil ini ialah contoh sahaja.','This profile name is an example only.'));note();
 }else{
  paragraph(L('Ruang Rambut ialah salon rekaan yang mengutamakan gaya praktikal dan pengalaman yang santai.','Ruang Rambut is a fictional salon focused on practical styles and a relaxed experience.'));paragraph(L('Demo ini menunjukkan bagaimana satu halaman SmartTap menggabungkan cover, identiti salon, katalog servis, harga, promosi, lokasi dan media sosial.','This demo shows how one SmartTap page brings together a cover, salon identity, service catalogue, prices, promotions, location and social media.'));note();
 }
 if(!refresh&&!dialog.open)dialog.showModal();
}
document.querySelector('#demo-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('smarttap:language',event=>{language=event.detail.language==='en'?'en':'ms';render();});render();
