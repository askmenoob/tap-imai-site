import {createAppearanceControls} from './appearance-controls-ui.mjs';
import {createBusinessDetails} from './business-details-ui.mjs';
import {createOrdersUI} from './orders-ui.mjs';
import {createPaymentAlerts} from './payment-alerts.mjs';
import {appearanceFields} from '../import-service/appearance.mjs';
import QRCode from 'qrcode';
import {malaysiaPhone,whatsappFromPhone} from '../import-service/contacts.mjs';
import {googleLogin} from './google-login.mjs';
import {createManagementUI,stateLabels} from './management-ui.mjs';
import {createGoogleListingTools} from './google-listing-tools.mjs';
import {createCustomerArea} from './customer-area.mjs';

const $=id=>document.getElementById(id);
const customer=document.body.dataset.role==='user',base=customer?'/api/user':'/api/admin';
const endpoint=location.hostname==='127.0.0.1'?location.origin:window.SMARTTAP_IMPORT_CONFIG?.endpoint;
const fields={name:'Nama perniagaan',logo:'URL logo',tagline:'Penerangan ringkas',google:'Google Review',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',threads:'Threads',phone:'Telefon perniagaan',whatsapp:'WhatsApp',website:'Laman web',...Object.fromEntries(Object.entries(appearanceFields).map(([key,spec])=>[key,spec.label]))};
let listingTools=null,businessDetails=null,appearanceControls=null;
let credential='',records=[],cursor=null,selected=null,expiryTimer,session=0,busy=false,saving=false,customerArea=null;
function lockControls(value){
  saving=value;for(const id of ['save','cancel','refresh','more','save-owner','owner-email'])if($(id))$(id).disabled=value||(id==='save'&&customer&&selected?.state!=='active');
  for(const field of Object.keys(fields))if($('field-'+field))$('field-'+field).disabled=value||(customer&&selected?.state!=='active');
  for(const id of ['cover-file','remove-cover'])if($(id))$(id).disabled=value||(customer&&selected?.state!=='active');listingTools?.lock(value);businessDetails?.lock(value||(customer&&selected?.state!=='active'));appearanceControls?.lock(value||(customer&&selected?.state!=='active'));
}
const management=createManagementUI({customer,api:(path,options)=>api(base+path,options),onBusy:lockControls,onUpdate:item=>{selected=item;records=records.map(record=>record.id===item.id?item:record);render();alerts?.refresh();customerArea?.update(item);ordersUI.show(item);$('edit-title').textContent=item.profile.name;if($('public-sharing'))$('public-sharing').hidden=item.state==='nfc_only'||item.state==='deleted';}});
const ordersUI=createOrdersUI({customer,api:(path,options)=>api(base+path,options)});$('edit-form').before(ordersUI.panel);
const alerts=customer?null:createPaymentAlerts({api,open:async id=>{if(saving)return;const current=session;const item=await api(base+'/links/'+id);if(current!==session||saving)return;await edit(item);},canOpen:()=>!saving});
function logout(message='Anda telah log keluar.'){
  coverPreview.hidden=true;coverStatus.textContent='';if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}credential='';records=[];cursor=null;selected=null;session++;clearTimeout(expiryTimer);
  listingTools?.invalidate();management.clear();ordersUI.clear();alerts?.stop();customerArea?.clear();
  $('dashboard').hidden=true;$('editor').hidden=true;$('login-panel').hidden=false;$('records').replaceChildren();
  for(const field of Object.keys(fields))$('field-'+field).value='';
  businessDetails?.set({});appearanceControls?.set();
  if($('owner-email'))$('owner-email').value='';
  $('share').value='';$('qr').removeAttribute('src');$('download').removeAttribute('href');$('open').removeAttribute('href');
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
    const meta=document.createElement('p');meta.textContent=(item.adminMessage&&item.adminMessage.status!=='resolved'?(customer?'Mesej daripada super admin':'Mesej pelanggan: '+(item.adminMessage.status==='replied'?'balasan diterima':'menunggu balasan'))+' · ':'')+(stateLabels[item.state]||'Aktif')+(item.profile.googleStatus==='pending'?' · Google Review belum tersedia':'')+(item.renewal?.status==='pending'?' · Bayaran menunggu semakan':'')+' · Dicipta '+date(item.createdAt)+' · Dikemas kini '+date(item.updatedAt)+(!customer?' · '+(item.ownerEmail||'Gmail pemilik belum didaftarkan'):'');
    const button=document.createElement('button');button.type='button';button.textContent='Urus halaman';button.setAttribute('aria-label','Urus '+item.profile.name);button.addEventListener('click',()=>edit(item));
    info.append(title,link,meta);row.append(info,button);$('records').append(row);
  }
  $('list-status').textContent=records.length+' halaman dimuatkan'+(query?' · '+shown.length+' padanan':'')+'.';
  if(!shown.length){const empty=document.createElement('p');empty.textContent=query?'Tiada padanan dalam senarai yang dimuatkan.':customer?'Tiada halaman didaftarkan untuk Gmail ini. Hubungi super admin untuk mendaftarkan Gmail yang betul.':'Belum ada pautan dijana.';$('records').append(empty);}
  $('more').hidden=!cursor;$('list-hint').textContent=cursor?'Ada rekod lain. Tekan Muatkan lagi untuk melihat dan mencari dalam rekod berikutnya.':'Semua rekod telah dimuatkan.';
  customerArea?.list(records);
}
async function load(reset=false){
  if(busy||saving)return;busy=true;const current=session;$('refresh').disabled=true;$('more').disabled=true;$('list-status').textContent='Memuatkan rekod…';
  try{
    const page=await api(base+'/links'+(!reset&&cursor?'?cursor='+encodeURIComponent(cursor):''));if(current!==session)return;
    records=reset?page.items:[...records,...page.items.filter(item=>!records.some(old=>old.id===item.id))];cursor=page.cursor;render();
    if(reset){selected=null;$('editor').hidden=true;
      const focus=new URLSearchParams(location.search).get(customer?'s':'page');
      if(focus&&/^[A-Za-z0-9_-]{16}$/.test(focus)){const item=await api(base+'/links/'+focus);if(current===session)await edit(item);}
      else if(customer&&records.length===1&&!cursor)await edit(records[0]);
    }
  }catch(error){$('list-status').textContent=error.message;}
  finally{busy=false;$('refresh').disabled=false;$('more').disabled=false;}
}
async function login(token){
  credential=token;const current=++session;$('login-status').textContent='Mengesahkan akaun Google…';
  try{
    const actor=await api(base+'/self');if(current!==session)return;
    clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>logout('Sesi tamat. Log masuk semula.'),Math.max(0,actor.expiresAt-Date.now()));
    $('identity').textContent=actor.email;$('login-panel').hidden=true;$('dashboard').hidden=false;alerts?.start();await load(true);
  }catch(error){credential='';$('login-status').textContent=error.message;}
}
async function edit(item){
  if(saving)return;
  coverPreview.hidden=!item.profile.cover;if(item.profile.cover)coverPreview.src=item.profile.cover;coverStatus.textContent='';selected=item;$('edit-title').textContent=item.profile.name;$('share').value=item.url;$('open').href=item.url;$('copy-status').textContent='';$('save-status').textContent='';
  if($('public-sharing'))$('public-sharing').hidden=item.state==='nfc_only'||item.state==='deleted';
  for(const field of Object.keys(fields))$('field-'+field).value=item.profile[field]||(field==='theme'?'classic':field==='accent'?'#20543e':'');
  businessDetails?.set(item.profile);appearanceControls?.set();listingTools?.set(item.profile);if(customer){$('field-google').required=item.profile.googleStatus!=='pending';$('field-google').readOnly=item.profile.googleStatus==='pending';$('google-pending-note').hidden=item.profile.googleStatus!=='pending';}
  if($('owner-email')){$('owner-email').value=item.ownerEmail||'';$('owner-status').textContent=item.ownerEmail?'Pemilik boleh login di tap.imai.my/edit dengan Gmail ini.':'Daftarkan Gmail supaya pelanggan boleh menyunting halaman ini.';}
  $('editor').hidden=false;$('download').removeAttribute('href');$('qr').removeAttribute('src');
  try{const png=await QRCode.toDataURL(item.url,{width:1024,margin:4,errorCorrectionLevel:'M',color:{dark:'#173b33',light:'#ffffff'}});if(selected?.id===item.id){$('qr').src=png;$('download').href=png;}}
  catch{$('copy-status').textContent='QR belum dapat disediakan. URL pelanggan masih sama.';}
  if(!customer)$('editor').scrollIntoView({behavior:'smooth',block:'start'});
  lockControls(false);await management.show(item);ordersUI.show(item);customerArea?.update(item);
}
for(const [key,text] of Object.entries(fields)){
  const label=document.createElement('label');label.htmlFor='field-'+key;label.textContent=text+(['name','google'].includes(key)?' *':'');
  const spec=appearanceFields[key];const multiline=['address','promoText'].includes(key);const input=document.createElement(spec?.options?'select':multiline?'textarea':'input');input.id='field-'+key;input.name=key;input.maxLength=spec?.max|| (key==='name'?80:key==='tagline'?140:key==='phone'?30:500);
  if(spec?.options)for(const [value,text] of Object.entries(spec.options)){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);}
  if(['name','google'].includes(key))input.required=true;
  if(!spec&&!['name','tagline','phone'].includes(key)){input.type='url';input.placeholder='https://';}
  if(multiline)input.rows=3;
  if(spec&&!spec.options&&!multiline){input.type=spec.type||'text';if(spec.type==='url')input.placeholder='https://';}
  if(key==='cover'){input.readOnly=true;input.type='hidden';label.hidden=true;}
  if(key==='phone'){input.type='tel';input.addEventListener('input',()=>{const link=whatsappFromPhone(input.value);if(link)$('field-whatsapp').value=link;});}
  if(key==='theme')input.addEventListener('change',()=>{$('field-accent').value=({classic:'#20543e',dark:'#91c8ad',bright:'#7040bb'})[input.value];});
  input.addEventListener('input',()=>{$('save-status').textContent='Ada perubahan yang belum disimpan.';});$('fields').append(label,input);
}
businessDetails=createBusinessDetails({addressInput:$('field-address'),hoursInput:$('field-hours'),onChange:()=>{$('save-status').textContent='Ada perubahan yang belum disimpan.';}});
if(!customer){listingTools=createGoogleListingTools({input:$('field-google'),name:()=>$('field-name').value,onChange:()=>{$('save-status').textContent='Ada perubahan yang belum disimpan.';},search:query=>api('/api/admin/search',{method:'POST',body:{query}}),lookup:token=>api('/api/admin/import',{method:'POST',body:{token}})});$('edit-form').prepend(listingTools.panel);}
else {const note=document.createElement('p');note.id='google-pending-note';note.className='notice';note.textContent='Google Review belum tersedia. Hubungi super admin untuk menyambungkan lokasi apabila tersedia di Google Maps.';note.hidden=true;$('field-google').after(note);}
const coverLabel=document.createElement('label');coverLabel.htmlFor='cover-file';coverLabel.textContent='Muat naik cover daripada peranti';
const coverFile=document.createElement('input');coverFile.id='cover-file';coverFile.type='file';coverFile.accept='image/jpeg,image/png,image/webp';
const coverHelp=document.createElement('p');coverHelp.className='help';coverHelp.textContent='JPG, PNG atau WebP. Had asal 5 MB / 25 megapiksel. Pelayan mengecilkan kepada maksimum 1600 piksel dan 500 KB. Cover disimpan terus; maklumat lain gunakan butang Simpan.';
const coverStatus=document.createElement('p');coverStatus.setAttribute('role','status');
const coverPreview=document.createElement('img');coverPreview.className='cover-upload-preview';coverPreview.alt='Pratonton cover pilihan';coverPreview.hidden=true;
const removeCover=document.createElement('button');removeCover.type='button';removeCover.id='remove-cover';removeCover.className='secondary';removeCover.textContent='Guna latar tema tanpa cover';removeCover.addEventListener('click',()=>{$('field-cover').value='';coverPreview.hidden=true;coverStatus.textContent='Tekan Simpan untuk membuang cover dan menggunakan latar tema.';appearanceControls?.coverSelected(null);$('save-status').textContent='Ada perubahan yang belum disimpan.';});
$('field-cover').after(coverLabel,coverFile,coverHelp,coverPreview,removeCover,coverStatus);
appearanceControls=createAppearanceControls({onChange:()=>{$('save-status').textContent='Ada perubahan yang belum disimpan.';}});
coverStatus.after(...appearanceControls.coverNodes);
let previewURL;
coverFile.addEventListener('change',async()=>{
  const file=coverFile.files[0];if(!file||!selected||saving)return;
  if(file.size>5*1024*1024){coverStatus.textContent='Gambar melebihi 5 MB. Pilih fail lebih kecil.';coverFile.value='';return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){coverStatus.textContent='Gunakan JPG, PNG atau WebP.';return;}
  const item=selected,current=session;lockControls(true);coverFile.disabled=true;coverStatus.textContent='Memproses dan menyimpan cover…';
  try{
    const response=await fetch(new URL(base+'/links/'+item.id+'/cover',endpoint),{method:'POST',headers:{Authorization:'Bearer '+credential,'Content-Type':file.type,'If-Match':item.revision},body:file,credentials:'omit',cache:'no-store'});
    const updated=await response.json();if(!response.ok)throw new Error(updated.error||'Cover belum dapat disimpan.');if(current!==session||selected?.id!==item.id)return;
    selected=updated;records=records.map(record=>record.id===updated.id?updated:record);render();$('field-cover').value=updated.profile.cover;
    if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(file);coverPreview.src=previewURL;coverPreview.hidden=false;
    coverStatus.textContent='Cover telah disimpan. URL pendek dan QR kekal sama.';appearanceControls?.coverSelected(file);
  }catch(error){coverStatus.textContent=error.message;}
  finally{lockControls(false);coverFile.value='';}
});
$('edit-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!selected)return;const item=selected,current=session;const profile={v:1};
  for(const key of Object.keys(fields))profile[key]=$('field-'+key).value.normalize('NFC').trim();
  listingTools?.apply(profile);if(customer&&item.profile.googleStatus==='pending'){profile.google='';profile.googleStatus='pending';}
  if(malaysiaPhone(profile.phone))profile.phone=malaysiaPhone(profile.phone);
  businessDetails?.lock(true);appearanceControls?.lock(true);listingTools?.lock(true);saving=true;$('save').disabled=true;$('cancel').disabled=true;$('refresh').disabled=true;$('more').disabled=true;if($('save-owner'))$('save-owner').disabled=true;
  for(const field of Object.keys(fields))$('field-'+field).disabled=true;
  $('save-status').textContent='Menyimpan pada URL yang sama…';
  try{
    const updated=await api(base+'/links/'+item.id,{method:'PUT',body:{profile,revision:item.revision}});if(current!==session)return;
    records=records.map(record=>record.id===updated.id?updated:record);selected=updated;render();customerArea?.update(updated);$('edit-title').textContent=updated.profile.name;
    for(const key of Object.keys(fields))$('field-'+key).value=updated.profile[key]||(key==='theme'?'classic':key==='accent'?'#20543e':'');
    businessDetails?.set(updated.profile);appearanceControls?.set();listingTools?.set(updated.profile);
    $('save-status').textContent='Berjaya disimpan. URL dan QR pelanggan kekal sama. Buka semula halaman untuk melihat perubahan.';
  }catch(error){$('save-status').textContent=error.message+(error.status===409?' Salin perubahan anda sebelum memuat semula senarai.':'');}
  finally{saving=false;$('save').disabled=false;$('cancel').disabled=false;$('refresh').disabled=false;$('more').disabled=false;if($('save-owner'))$('save-owner').disabled=false;for(const field of Object.keys(fields))$('field-'+field).disabled=false;listingTools?.lock(false);businessDetails?.lock(customer&&selected?.state!=='active');appearanceControls?.lock(customer&&selected?.state!=='active');}
});
$('owner-form')?.addEventListener('submit',async event=>{
  event.preventDefault();if(!selected||saving)return;const item=selected,current=session;const email=$('owner-email').value.trim().toLowerCase();
  saving=true;for(const id of ['save','cancel','refresh','more','save-owner','owner-email'])$(id).disabled=true;
  $('owner-status').textContent='Mendaftarkan Gmail pemilik…';
  try{const updated=await api(base+'/links/'+item.id+'/owner',{method:'PUT',body:{email,revision:item.revision}});if(current!==session)return;
    selected=updated;records=records.map(record=>record.id===updated.id?updated:record);render();$('owner-email').value=updated.ownerEmail;
    $('owner-status').textContent='Gmail didaftarkan. Pemilik boleh login di tap.imai.my/edit. URL dan QR kekal sama.';
  }catch(error){$('owner-status').textContent=error.message;}
  finally{saving=false;for(const id of ['save','cancel','refresh','more','save-owner','owner-email'])$(id).disabled=false;}
});
$('filter').addEventListener('input',render);$('refresh').addEventListener('click',()=>{load(true);alerts?.refresh();});$('more').addEventListener('click',()=>load());
$('cancel').addEventListener('click',()=>{if(customerArea){customerArea.open('my');return;}selected=null;$('editor').hidden=true;});$('logout').addEventListener('click',()=>logout());
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share').value);$('copy-status').textContent='Pautan disalin.';}catch{$('share').focus();$('share').select();$('copy-status').textContent='Pilih dan salin pautan secara manual.';}});
if(customer)customerArea=createCustomerArea({detailsNodes:{...businessDetails.nodes,...appearanceControls.nodes},coverNodes:[coverLabel,coverFile,coverHelp,coverPreview,removeCover,coverStatus,...appearanceControls.coverNodes],onSelect:async id=>{if(saving)return;try{await edit(await api(base+'/links/'+id));}catch(error){$('list-status').textContent=error.message;}}});
try{
  const config=await api(base+'/config',{authenticated:false});
  if(config.demo&&location.hostname==='127.0.0.1'){
    $('demo').hidden=false;$('demo-login').hidden=false;$('login-status').textContent='Demo hanya pada komputer ini.';$('demo-login').addEventListener('click',()=>login('localhost-demo'));
  }else if(!config.configured||!config.clientId){$('login-status').textContent='Login Google belum diaktifkan oleh pemilik SmartTap. Rekod kekal dilindungi.';}
  else{
    $('login-status').textContent=customer?'Log masuk menggunakan Gmail yang didaftarkan oleh super admin.':'Pilih akaun Google super admin untuk teruskan.';
    googleLogin({clientId:config.clientId,container:$('google-login'),onCredential:login,onError:message=>$('login-status').textContent=message,prompt:customer});
  }
}catch(error){$('login-status').textContent=error.message;}
