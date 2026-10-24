import {renderCard} from './public-card.mjs';

// A standalone fictional showcase; it never registers a customer, resolves a
// Google Place ID, calls a paid API or sends a real message/order.
const root='/demo/restaurant/';
const end=new Date(Date.now()+30*86400000+8*3600000).toISOString().slice(0,10);
const endLabel=new Date(end+'T12:00:00+08:00').toLocaleDateString('ms-MY',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kuala_Lumpur'});
const profile={v:1,name:'Dapur Senja',theme:'classic',accent:'#20543e',logo:root+'logo.svg',cover:root+'cover.webp',
 tagline:'Rasa kampung, sentuhan moden.\nHidangan Melayu segar untuk makan bersama yang tersayang.',
 google:root+'#review',whatsapp:root+'#whatsapp',menu:root+'#menu',directions:root+'#location',website:root+'#website',
 instagram:root+'#instagram',facebook:root+'#facebook',tiktok:root+'#tiktok',threads:'https://www.threads.net/@dapursenja.demo',
 address:'Lot Demo 12, Jalan Senja\nSeksyen 13, 40100 Shah Alam, Selangor\nAlamat contoh — bukan premis sebenar.',
 hours:'Isnin–Jumaat: 11:00–22:00\nSabtu–Ahad: 09:00–23:00\nTempahan terakhir 30 minit sebelum tutup.',
 promoTitle:'Set Tengah Hari · RM21.90',promoText:'Nasi Kerabu Ayam Bakar + Air Limau Ais.\nIsnin–Jumaat, 12 tengah hari hingga 3 petang.\nContoh tawaran hingga '+endLabel+'.',promoURL:root+'#promotion',promoStart:'2026-01-01T00:00',promoEnd:end+'T23:59'};
const page=renderCard(document,profile);document.querySelector('#root').append(page);
// Every showcase action stays in this demo, including Threads. No fabricated
// account, telephone recipient or Google listing is used as a real destination.
for(const a of page.querySelectorAll('a')){const key=a.getAttribute('aria-label')==='threads'?'threads':new URL(a.href,location.href).hash.slice(1);a.href=root+'#'+key;a.removeAttribute('target');a.addEventListener('click',event=>{event.preventDefault();show(key);});}
const dialog=document.querySelector('#demo-dialog'),content=document.querySelector('#demo-dialog-content'),title=document.querySelector('#demo-dialog-title');
let opener;
function localizeDemo(language){const en=language==='en';document.querySelector('.demo-banner strong').textContent=en?'RESTAURANT DEMO':'DEMO RESTORAN';document.querySelector('.demo-banner span').textContent=en?'Fictional restaurant · Sample details':'Restoran rekaan · Maklumat contoh';document.querySelector('#demo-close').setAttribute('aria-label',en?'Close example':'Tutup contoh');}
let initialLanguage='ms';try{if(localStorage.getItem('smarttap.language')==='en')initialLanguage='en';}catch{}
localizeDemo(initialLanguage);window.addEventListener('smarttap:language',event=>localizeDemo(event.detail.language));
document.querySelector('#demo-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>opener?.focus());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
function el(tag,text,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;}
function paragraph(text,cls){content.append(el('p',text,cls));}
function note(){paragraph('Ini ialah demonstrasi. Tiada pesanan, mesej, ulasan atau bayaran sebenar dihantar.','demo-note');}
const menu=[
 ['Hidangan utama','Nasi Kerabu Ayam Bakar','Nasi biru bunga telang, ayam bakar, ulam segar dan sambal.',18.90],
 ['Hidangan utama','Nasi Rendang Daging','Daging dimasak perlahan dengan rempah, nasi panas dan acar.',22.90],
 ['Hidangan utama','Laksa Utara','Kuah ikan pekat, mi laksa, timun, bawang dan limau.',14.90],
 ['Hidangan utama','Ayam Percik Kelantan','Ayam panggang bersalut kuah percik, nasi dan sayur.',19.90],
 ['Minuman','Air Limau Ais','Limau segar, ais dan kemanisan pilihan.',5.90],
 ['Minuman','Teh Tarik','Teh susu ditarik dan disediakan panas.',4.90],
 ['Minuman','Kopi Kampung','Kopi tradisional; pilih panas atau ais.',5.50],
 ['Pencuci mulut','Sagu Gula Melaka','Sagu sejuk, santan dan sirap gula Melaka.',7.90],
];
function show(key){
 opener=document.activeElement;content.replaceChildren();
 const names={review:'Ulasan Google',whatsapp:'Tempahan & pertanyaan',menu:'Menu Dapur Senja',location:'Lokasi & waktu operasi',website:'Tentang Dapur Senja',promotion:'Set Tengah Hari RM21.90',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',threads:'Threads'};
 title.textContent=names[key]||'Dapur Senja';
 if(key==='menu'){
  paragraph('Masakan Melayu segar, disediakan dengan penuh rasa. Semua harga di bawah ialah harga contoh.');
  const label=el('label','Kategori menu'),filter=el('select');filter.id='demo-menu-category';label.htmlFor=filter.id;
  for(const category of ['Semua','Hidangan utama','Minuman','Pencuci mulut']){const o=el('option',category);o.value=category;filter.append(o);}content.append(label,filter);
  const list=el('div',null,'demo-menu-list');content.append(list);
  function draw(){list.replaceChildren();for(const [category,name,description,price] of menu){if(filter.value!=='Semua'&&filter.value!==category)continue;const item=el('article',null,'demo-menu-item'),heading=el('div',null,'demo-menu-heading');heading.append(el('h3',name),el('strong','RM'+price.toFixed(2)));item.append(heading,el('p',description));list.append(item);}}
  filter.onchange=draw;draw();note();
 }else if(key==='location'){
  paragraph(profile.address,'demo-preserve');paragraph(profile.hours,'demo-preserve');paragraph('Parkir dan kemudahan: ruang parkir berdekatan, tempat duduk keluarga dan ruang makan berhawa dingin. Maklumat ini ialah contoh.');note();
 }else if(key==='whatsapp'||key==='promotion'){
  if(key==='promotion')paragraph(profile.promoText,'demo-preserve');
  paragraph('Contoh mesej pelanggan:');const draft=el('blockquote',key==='promotion'?'Salam Dapur Senja, saya berminat dengan Set Tengah Hari RM21.90. Boleh saya tempah untuk 2 orang?':'Salam Dapur Senja, saya ingin menempah meja untuk 4 orang pada jam 7.30 malam. Masih ada tempat?');content.append(draft);
  paragraph('Dalam halaman pelanggan sebenar, butang ini membuka WhatsApp perniagaan yang telah didaftarkan.');note();
 }else if(key==='review'){
  content.append(el('div','★★★★★','demo-stars'));paragraph('Kongsikan pengalaman makan anda: hidangan kegemaran, suasana restoran dan layanan yang diterima.');paragraph('Dalam halaman sebenar, pelanggan dibawa ke borang ulasan Google bagi perniagaan yang disambungkan oleh super admin. Demo ini tidak mencipta Place ID atau ulasan palsu.');note();
 }else if(['instagram','facebook','tiktok','threads'].includes(key)){
  content.append(el('strong','@dapursenja.demo','demo-handle'));paragraph('Contoh kandungan: menu harian, video dapur, promosi makan tengah hari dan perkongsian komuniti.');paragraph('Ini ialah nama profil contoh. Halaman sebenar menggunakan pautan akaun rasmi perniagaan anda.');note();
 }else{
  paragraph('Dapur Senja ialah konsep restoran demo masakan Melayu moden: rasa kampung dalam suasana yang selesa dan mesra keluarga.');paragraph('Pilihan hidangan: nasi kerabu, rendang daging, ayam percik dan pencuci mulut tempatan.');paragraph('Halaman ini menunjukkan hasil lengkap SmartTap dengan cover, identiti jenama, menu, lokasi, promosi dan media sosial.');note();
 }
 content.dataset.noI18n='';dialog.showModal();
}
