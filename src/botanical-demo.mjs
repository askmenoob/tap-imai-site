import QRCode from 'qrcode';
import {createCustomerHome} from './customer-home.mjs';
import {renderCard} from './public-card.mjs';

// Static, explicit fictional showcase using the same home/profile components.
// It has no backend calls, live identities, payment state or saved records.
const origin=location.origin,base='/demo/botanical/';
const profile={v:1,name:'Kafe Taman Kota',theme:'classic',accent:'#123d31',logo:'/assets/botanical-cafe-logo.svg',cover:'/assets/botanical-cafe.webp',tagline:'Kafe santai dengan kopi segar, hidangan ringan dan suasana hijau di tengah kota.',google:base+'#review',whatsapp:base+'#whatsapp',instagram:base+'#instagram'};
const item={id:'botanical-demo',profile,url:origin+base,state:'pending',subscription:{plan:'annual',expiresAt:null}};
const dialog=document.getElementById('demo-dialog'),title=document.getElementById('demo-title'),content=document.getElementById('demo-content');let opener;
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
function show(heading){opener=document.activeElement;title.textContent=heading;content.replaceChildren();if(!dialog.open)dialog.showModal();}
dialog.querySelector('.demo-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>opener?.focus());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
let home;
async function open(view){
 if(view==='home'){dialog.close();document.querySelector('.botanical-home')?.scrollIntoView({block:'start'});return;}
 if(view==='my'){
  show('NFC & QR perniagaan');content.append(el('p','QR demo ini membuka profil Kafe Taman Kota. Ia tidak mendaftarkan premis atau mengaktifkan langganan.'));
  const img=el('img');img.id='demo-qr';img.alt='QR profil Kafe Taman Kota demo';const data=await QRCode.toDataURL(item.url,{width:260,margin:2});if(!dialog.open)return;img.src=data;content.append(img);
  const link=el('a','Muat turun QR demo');link.href=data;link.download='smarttap-demo-qr.png';link.className='button';const publicLink=el('a','Lihat profil');publicLink.href=base;publicLink.className='button secondary';const actions=el('div');actions.className='actions';actions.append(link,publicLink);content.append(actions);return;
 }
 if(view==='business'){
  show('Pratonton maklumat premis');content.append(el('p','Cuba sunting nama dan penerangan. Perubahan hanya untuk demo ini dan hilang selepas muat semula.'));
  const form=el('form'),nameLabel=el('label','Nama perniagaan'),name=el('input');name.id='demo-name';nameLabel.htmlFor=name.id;name.value=profile.name;name.required=true;name.maxLength=80;
  const descriptionLabel=el('label','Penerangan ringkas'),description=el('input');description.id='demo-description';descriptionLabel.htmlFor=description.id;description.value=profile.tagline;description.maxLength=140;
  const save=el('button','Kemas kini pratonton');save.type='submit';form.append(nameLabel,name,descriptionLabel,description,save);form.onsubmit=event=>{event.preventDefault();profile.name=name.value.trim();profile.tagline=description.value.trim();home.panel.querySelector('select option').textContent=profile.name;home.update(item);dialog.close();};content.append(form);return;
 }
 if(view==='package'){
  show('Status langganan');content.append(el('p','Menunggu pengaktifan — contoh paparan. Tiada langganan atau percubaan diberikan oleh demo ini.'),el('p','NFC + QR RM100 tahun pertama · NFC sahaja RM70 · Renew QR RM30 setahun.'));
  const link=el('a','Lihat pakej sebenar');link.href='/subscribe/';link.className='button';content.append(link);return;
 }
 show('Analitik belum tersedia');content.append(el('p','Backend semasa belum membekalkan statistik lawatan, tap NFC atau ulasan. Dashboard memaparkan keadaan kosong supaya tiada angka rekaan dianggap sebagai prestasi sebenar.'));
}
if(document.body.dataset.botanicalDemo==='dashboard'){
 const picker=el('select');picker.id='customer-page-picker';picker.setAttribute('aria-label','Pilih premis demo');const option=el('option',profile.name);option.value=item.id;picker.append(option);
 home=createCustomerHome({document,picker,onOpen:open});document.getElementById('demo-stage').append(home.panel);home.update(item);
 const add=home.panel.querySelector('.home-hero-actions a');add.addEventListener('click',event=>{event.preventDefault();show('Tambah premis anda');content.append(el('p','Gunakan carian SmartTap untuk mencari dan menyemak maklumat perniagaan anda. Demo ini tidak mewujudkan rekod pelanggan.'));const link=el('a','Buka carian perniagaan');link.href='/setup.html';link.className='button';content.append(link);});
 for(const b of document.querySelectorAll('[data-demo-view]'))b.onclick=()=>open(b.dataset.demoView);
}else{
 const page=renderCard(document,profile);document.getElementById('root').append(page);
 for(const a of page.querySelectorAll('a')){a.removeAttribute('target');a.onclick=event=>{event.preventDefault();const key=new URL(a.href).hash.slice(1);show(key==='review'?'Ulasan Google':key==='whatsapp'?'WhatsApp Kami':'Instagram');content.append(el('p','Ini ialah contoh tindakan untuk Kafe Taman Kota, sebuah kafe rekaan. Tiada ulasan, mesej atau akaun luar dibuka.'));};}
}
