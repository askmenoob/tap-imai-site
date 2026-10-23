import QRCode from 'qrcode';
import {malaysiaPhone,whatsappFromPhone} from '../import-service/contacts.mjs';

const $=id=>document.getElementById(id);
const endpoint=location.hostname==='127.0.0.1'?location.origin:window.SMARTTAP_IMPORT_CONFIG?.endpoint;
const fields={name:'Nama perniagaan',logo:'URL logo',tagline:'Penerangan ringkas',google:'Google Review',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',threads:'Threads',phone:'Telefon perniagaan',whatsapp:'WhatsApp',website:'Laman web'};
let credential='',records=[],cursor=null,selected=null,expiryTimer,session=0,busy=false,saving=false;
function logout(message='Anda telah log keluar.'){
  credential='';records=[];cursor=null;selected=null;session++;clearTimeout(expiryTimer);
  $('dashboard').hidden=true;$('editor').hidden=true;$('login-panel').hidden=false;$('records').replaceChildren();
  for(const field of Object.keys(fields))$('field-'+field).value='';
  $('login-status').textContent=message;window.google?.accounts?.id?.disableAutoSelect();
}
async function api(path,{method='GET',body,authenticated=true}={}){
  if(!endpoint)throw new Error('Sambungan SmartTap belum tersedia.');
  const response=await fetch(new URL(path,endpoint),{method,headers:{...(authenticated?{Authorization:'Bearer '+credential}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit'});
  const result=await response.json();
  if(!response.ok){if(response.status===401)logout('Sesi tamat. Log masuk semula.');throw Object.assign(new Error(result.error||'Permintaan tidak berjaya.'),{status:response.status});}
  return result;
}
const date=value=>value?new Date(value).toLocaleDateString('ms-MY',{day:'numeric',month:'short',year:'numeric'}):'—';
function render(){
  const query=$('filter').value.trim().toLowerCase();const shown=records.filter(item=>(item.profile.name+' '+item.url).toLowerCase().includes(query));
  $('records').replaceChildren();
  for(const item of shown){
    const row=document.createElement('article');row.className='record';const info=document.createElement('div');info.className='record-info';
    const title=document.createElement('h3');title.textContent=item.profile.name;
    const link=document.createElement('a');link.href=item.url;link.textContent=item.url;link.target='_blank';link.rel='noopener noreferrer';
    const meta=document.createElement('p');meta.textContent='Dicipta '+date(item.createdAt)+' · Dikemas kini '+date(item.updatedAt);
    const button=document.createElement('button');button.type='button';button.textContent='Urus halaman';button.setAttribute('aria-label','Urus '+item.profile.name);button.addEventListener('click',()=>edit(item));
    info.append(title,link,meta);row.append(info,button);$('records').append(row);
  }
  $('list-status').textContent=records.length+' halaman dimuatkan'+(query?' · '+shown.length+' padanan':'')+'.';
  if(!shown.length){const empty=document.createElement('p');empty.textContent=query?'Tiada padanan dalam senarai yang dimuatkan.':'Belum ada pautan dijana.';$('records').append(empty);}
  $('more').hidden=!cursor;$('list-hint').textContent=cursor?'Ada rekod lain. Tekan Muatkan lagi untuk melihat dan mencari dalam rekod berikutnya.':'Semua rekod telah dimuatkan.';
}
async function load(reset=false){
  if(busy||saving)return;busy=true;const current=session;$('refresh').disabled=true;$('more').disabled=true;$('list-status').textContent='Memuatkan rekod…';
  try{
    const page=await api('/api/admin/links'+(!reset&&cursor?'?cursor='+encodeURIComponent(cursor):''));if(current!==session)return;
    records=reset?page.items:[...records,...page.items.filter(item=>!records.some(old=>old.id===item.id))];cursor=page.cursor;render();
    if(reset){selected=null;$('editor').hidden=true;}
  }catch(error){$('list-status').textContent=error.message;}
  finally{busy=false;$('refresh').disabled=false;$('more').disabled=false;}
}
async function login(token){
  credential=token;const current=++session;$('login-status').textContent='Mengesahkan akaun Google…';
  try{
    const actor=await api('/api/admin/self');if(current!==session)return;
    clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>logout('Sesi tamat. Log masuk semula.'),Math.max(0,actor.expiresAt-Date.now()));
    $('identity').textContent=actor.email;$('login-panel').hidden=true;$('dashboard').hidden=false;await load(true);
  }catch(error){credential='';$('login-status').textContent=error.message;}
}
async function edit(item){
  if(saving)return;
  selected=item;$('edit-title').textContent=item.profile.name;$('share').value=item.url;$('open').href=item.url;$('copy-status').textContent='';$('save-status').textContent='';
  for(const field of Object.keys(fields))$('field-'+field).value=item.profile[field]||'';
  $('editor').hidden=false;$('download').removeAttribute('href');$('qr').removeAttribute('src');
  try{const png=await QRCode.toDataURL(item.url,{width:1024,margin:4,errorCorrectionLevel:'M',color:{dark:'#173b33',light:'#ffffff'}});if(selected?.id===item.id){$('qr').src=png;$('download').href=png;}}
  catch{$('copy-status').textContent='QR belum dapat disediakan. URL pelanggan masih sama.';}
  $('editor').scrollIntoView({behavior:'smooth',block:'start'});
}
for(const [key,text] of Object.entries(fields)){
  const label=document.createElement('label');label.htmlFor='field-'+key;label.textContent=text+(['name','google'].includes(key)?' *':'');
  const input=document.createElement('input');input.id='field-'+key;input.name=key;input.maxLength=key==='name'?80:key==='tagline'?140:key==='phone'?30:500;
  if(['name','google'].includes(key))input.required=true;
  if(!['name','tagline','phone'].includes(key)){input.type='url';input.placeholder='https://';}
  if(key==='phone'){input.type='tel';input.addEventListener('input',()=>{const link=whatsappFromPhone(input.value);if(link)$('field-whatsapp').value=link;});}
  input.addEventListener('input',()=>{$('save-status').textContent='Ada perubahan yang belum disimpan.';});$('fields').append(label,input);
}
$('edit-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!selected)return;const item=selected,current=session;const profile={v:1};
  for(const key of Object.keys(fields))profile[key]=$('field-'+key).value.normalize('NFC').trim();
  if(malaysiaPhone(profile.phone))profile.phone=malaysiaPhone(profile.phone);
  saving=true;$('save').disabled=true;$('cancel').disabled=true;$('refresh').disabled=true;$('more').disabled=true;
  for(const field of Object.keys(fields))$('field-'+field).disabled=true;
  $('save-status').textContent='Menyimpan pada URL yang sama…';
  try{
    const updated=await api('/api/admin/links/'+item.id,{method:'PUT',body:{profile,revision:item.revision}});if(current!==session)return;
    records=records.map(record=>record.id===updated.id?updated:record);selected=updated;render();$('edit-title').textContent=updated.profile.name;
    for(const key of Object.keys(fields))$('field-'+key).value=updated.profile[key]||'';
    $('save-status').textContent='Berjaya disimpan. URL dan QR pelanggan kekal sama. Buka semula halaman untuk melihat perubahan.';
  }catch(error){$('save-status').textContent=error.message+(error.status===409?' Salin perubahan anda sebelum memuat semula senarai.':'');}
  finally{saving=false;$('save').disabled=false;$('cancel').disabled=false;$('refresh').disabled=false;$('more').disabled=false;for(const field of Object.keys(fields))$('field-'+field).disabled=false;}
});
$('filter').addEventListener('input',render);$('refresh').addEventListener('click',()=>load(true));$('more').addEventListener('click',()=>load());
$('cancel').addEventListener('click',()=>{selected=null;$('editor').hidden=true;});$('logout').addEventListener('click',()=>logout());
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share').value);$('copy-status').textContent='Pautan disalin.';}catch{$('share').focus();$('share').select();$('copy-status').textContent='Pilih dan salin pautan secara manual.';}});
try{
  const config=await api('/api/admin/config',{authenticated:false});
  if(config.demo&&location.hostname==='127.0.0.1'){
    $('demo').hidden=false;$('demo-login').hidden=false;$('login-status').textContent='Demo hanya pada komputer ini.';$('demo-login').addEventListener('click',()=>login('localhost-demo'));
  }else if(!config.configured||!config.clientId){$('login-status').textContent='Login Google belum diaktifkan oleh pemilik SmartTap. Rekod kekal dilindungi.';}
  else{
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
    script.onload=()=>{window.google.accounts.id.initialize({client_id:config.clientId,callback:result=>login(result.credential),auto_select:false});window.google.accounts.id.renderButton($('google-login'),{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'rectangular'});$('login-status').textContent='Pilih akaun Google super admin untuk teruskan.';};
    script.onerror=()=>{$('login-status').textContent='Butang Google tidak dapat dimuatkan. Semak sambungan dan muat semula.';};document.head.append(script);
  }
}catch(error){$('login-status').textContent=error.message;}
