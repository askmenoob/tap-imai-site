import {decodeProfilePayload} from './public-profile.mjs';
import {threadsProfile} from '../import-service/contacts.mjs';

const root=document.getElementById('root');
const params=new URLSearchParams(location.search);
function element(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
function status(message,error=false) {
  const box=element('p','',message);box.setAttribute('role',error?'alert':'status');box.style.cssText='margin:15vh auto;padding:24px;max-width:640px;text-align:center;font:16px/1.7 system-ui';
  if(error){const link=element('a','','Buka SmartTap');link.href='./setup.html';link.style.display='block';box.append(link);}
  root.replaceChildren(box);
}
function render(profile) {
  const main=element('main','public-body');main.append(element('div','public-bg'));
  const card=element('section','public-card');const avatar=element('div','avatar',profile.name.charAt(0).toLocaleUpperCase());
  if(profile.logo) {
    const image=element('img');image.alt='Logo '+profile.name;image.referrerPolicy='no-referrer';image.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:inherit;background:white';image.onload=()=>avatar.replaceChildren(image);image.src=profile.logo;
  }
  card.append(avatar,element('div','eyebrow','WELCOME TO'),element('h1','',profile.name));
  if(profile.tagline)card.append(element('p','public-tagline',profile.tagline));
  const links=element('div','public-links');
  const platforms=[['google','Google Review','★'],['instagram','Instagram','◎'],['facebook','Facebook','f'],['tiktok','TikTok','♪'],['whatsapp','WhatsApp','↗'],['website','Website','⌁'],['threads','Threads','@']];
  for(const [key,label,mark] of platforms) {
    if(!profile[key]||(key==='threads'&&!threadsProfile(profile[key])))continue;
    const link=element('a','public-link'+(key==='google'?' primary':''));link.href=profile[key];link.target='_blank';link.rel='noopener noreferrer';
    link.append(element('span','link-icon',mark),element('span','',key==='google'?'Leave us a Google Review':'Follow us on '+label),element('span','link-arrow','↗'));links.append(link);
  }
  card.append(links,element('p','small-note','Every review and follow means the world to us. Thank you for your support.'));
  const footer=element('footer','public-footer');const brand=element('span','','POWERED BY ');brand.append(element('b','','SMARTTAP'));
  const create=element('a','','Create your own page ↗');create.href='./setup.html';footer.append(brand,create);main.append(card,footer);root.replaceChildren(main);document.title=profile.name+' — SmartTap';
}
async function openPage() {
  const id=params.get('s');const payload=params.get('p');
  if(id===null&&!payload){root.hidden=true;location.replace(new URL('./setup.html',location.href).href);return;}
  try {
    if(id===null)throw new Error('Gunakan URL pendek SmartTap untuk membuka halaman ini.');
    status('Sedang membuka halaman SmartTap…');
    if(!/^[A-Za-z0-9_-]{16}$/.test(id))throw new Error('Pautan pendek ini tidak sah.');
    const endpoint=location.hostname==='127.0.0.1'?location.origin:window.SMARTTAP_IMPORT_CONFIG?.endpoint;
    if(!endpoint)throw new Error('Perkhidmatan pautan pendek belum tersedia.');
    const response=await fetch(new URL('/api/links/'+id,endpoint),{signal:AbortSignal.timeout(15000)});const data=await response.json();
    if(!response.ok)throw new Error(data.error || 'Pautan pendek tidak dapat dibuka. Cuba lagi.');
    const target=new URL(data.url);
    if(target.origin!==location.origin||target.pathname!=='/'||target.hash||[...target.searchParams.keys()].join()!=='p')throw new Error('Destinasi pautan tidak sah.');
    render(decodeProfilePayload(target.searchParams.get('p')));
  }catch(error){status(error.name==='TimeoutError'?'Sambungan mengambil masa terlalu lama. Muat semula untuk mencuba lagi.':error.message,true);}
}
openPage();
