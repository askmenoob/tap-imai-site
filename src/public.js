import {renderCard} from './public-card.mjs';
import {decodeProfilePayload} from './public-profile.mjs';
import {threadsProfile} from '../import-service/contacts.mjs';

const root=document.getElementById('root');
const params=new URLSearchParams(location.search);
function element(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
function status(message,error=false) {
  const box=element('p','',message);box.setAttribute('role',error?'alert':'status');box.style.cssText='margin:15vh auto;padding:24px;max-width:640px;text-align:center;font:16px/1.7 system-ui';
  if(error)box.style.cssText+=';color:#b42318;font-weight:750;background:#fff0ee;border:1px solid #efc2bd;border-radius:12px';
  if(error){const id=params.get('s'),owned=/^[A-Za-z0-9_-]{16}$/.test(id||'');const link=element('a','',owned?'Login pemilik halaman':'Buka SmartTap');link.href=owned?'/edit/?s='+encodeURIComponent(id):'./setup.html';link.style.display='block';box.append(link);}
  root.replaceChildren(box);
}
function render(profile) {root.replaceChildren(renderCard(document,profile));document.title=profile.name+' — SmartTap';}
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
