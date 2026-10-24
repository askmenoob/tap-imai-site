import QRCode from 'qrcode';
import {createGoogleListingTools} from './google-listing-tools.mjs';
import { createSuggestions } from './business-suggestions.mjs';
import { malaysiaPhone, whatsappFromPhone, threadsProfile } from '../import-service/contacts.mjs';
import { generateShortPage } from './short-page.mjs';
import {googleLogin} from './google-login.mjs';

const $ = id => document.getElementById(id);
const registering=new URLSearchParams(location.search).get('register')==='1';
const fieldNames = {name:'Nama perniagaan',logo:'URL logo',tagline:'Penerangan ringkas',google:'Google Review',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',threads:'Threads',phone:'Telefon perniagaan',whatsapp:'WhatsApp',website:'Laman web'};
if(!registering)delete fieldNames.google;else Object.assign(fieldNames,{address:'Alamat perniagaan',directions:'Pautan lokasi / pin Google Maps'});
let listingTools=null,pendingStart=null;
let publicDraftToken='';
let activeSearch; let sequence = 0; let resultSequence = 0; let sources = {};
let activeGeneration;
let sessionToken = crypto.randomUUID();
let places = []; let activePlace = -1; let placesFromDemo = false;
const config = window.SMARTTAP_IMPORT_CONFIG || {};
const endpoint = location.hostname === '127.0.0.1' ? location.origin : (config.endpoint || '');
let adminCredential='',adminExpiry=0,registrationTimer;
async function registrationAPI(path,{method='GET',body,signal}={}){
  const response=await fetch(new URL('/api/admin/'+path,endpoint),{method,headers:{...(adminCredential?{Authorization:'Bearer '+adminCredential}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Pendaftaran tidak berjaya.');return data;
}
function searchAccess(allowed){
  if(!registering)return;
  listingTools?.lock(!allowed);if(pendingStart)pendingStart.disabled=!allowed;
  $('query').disabled=!allowed;$('search-button').disabled=!allowed;$('generate').disabled=!allowed;
  const field=$('field-google');if(field){field.closest('[data-review-only]').hidden=!allowed;if(!allowed){field.value='';$('source-google').textContent='';}}
  if(!allowed){activeSearch?.abort();sequence++;invalidate();$('editor').hidden=true;}
}
if(registering){
  searchAccess(false);
  $('registration').hidden=false;$('generate').disabled=true;
  const login=async token=>{searchAccess(false);adminCredential=token;$('register-status').textContent='Mengesahkan super admin…';
    try{const actor=await registrationAPI('self');adminExpiry=actor.expiresAt;$('register-status').textContent='Super admin: '+actor.email;$('register-email').disabled=false;searchAccess(true);
      clearTimeout(registrationTimer);registrationTimer=setTimeout(()=>{adminCredential='';adminExpiry=0;$('register-email').disabled=true;searchAccess(false);$('register-status').textContent='Sesi tamat. Log masuk semula.';},Math.max(0,adminExpiry-Date.now()));
    }catch(error){adminCredential='';adminExpiry=0;$('register-status').textContent=error.message;searchAccess(false);}
  };
  registrationAPI('config').then(settings=>{
    if(settings.demo&&location.hostname==='127.0.0.1'){$('register-demo-login').hidden=false;$('register-demo-login').onclick=()=>login('localhost-demo');}
    else if(settings.configured)googleLogin({clientId:settings.clientId,container:$('register-google-login'),onCredential:login,onError:message=>$('register-status').textContent=message});
    else $('register-status').textContent='Login super admin belum tersedia.';
  }).catch(error=>$('register-status').textContent=error.message);
  $('register-email').addEventListener('input',invalidate);
}
// Remove the earlier optional controls if an older HTML response was cached.
$('shorten')?.remove();$('short-status')?.remove();$('share').rows=1;
$('result').querySelector('.notice').textContent='Simpan URL pendek ini. Daftarkan Gmail pemilik dengan super admin dan semak status pakej sebelum berkongsi. Halaman yang menunggu pengaktifan boleh diurus melalui ruang pelanggan. URL dan QR kekal sama selepas renew.';
function httpsURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') ? u.href : null; }
  catch { return null; }
}
function sourceLine(key, value) {
  const line = $('source-' + key); line.replaceChildren();
  if (!value) { line.textContent = 'Belum ditemui — boleh isi sendiri.'; return; }
  if (httpsURL(value)) {
    line.append('Sumber: '); const link = document.createElement('a'); link.href = value;
    link.textContent = new URL(value).hostname; link.target='_blank'; link.rel='noopener noreferrer'; line.append(link);
  } else line.textContent = 'Sumber: ' + value;
}
function invalidate() { resultSequence++;activeGeneration?.abort(); $('result').hidden=true; $('form-status').textContent='';$('copy-status').textContent=''; }
function previewLogo() {
  const value = httpsURL($('field-logo').value.trim());
  $('logo-preview').hidden = true; $('logo-fallback').hidden = false;
  if (value) $('logo-preview').src = value;
}
for (const [key,label] of Object.entries(fieldNames)) {
  const wrapper = document.createElement('div');
  if(key==='google'){wrapper.dataset.reviewOnly='true';wrapper.hidden=true;}
  const caption=document.createElement('label'); caption.htmlFor='field-'+key; caption.textContent=label+(['name','google'].includes(key)?' *':'');
  const input=document.createElement('input'); input.id='field-'+key; input.name=key;
  input.maxLength=key==='name'?90:key==='tagline'?150:500; input.autocomplete=key==='name'?'organization':'off';
  if (!['name','tagline','phone','address'].includes(key)) input.inputMode='url';
  if(key==='phone') {input.type='tel';input.placeholder='Contoh: 012-2258950';}
  const help=document.createElement('p'); help.id='source-'+key; help.className='source';
  const error=document.createElement('p'); error.id='error-'+key; error.className='field-error';
  input.setAttribute('aria-describedby',help.id+' '+error.id);
  input.addEventListener('input',()=>{invalidate(); sourceLine(key,'Disunting oleh anda'); if(key==='logo') previewLogo();if(key==='phone'){const link=whatsappFromPhone(input.value);if(link){$('field-whatsapp').value=link;sourceLine('whatsapp','Dijana daripada telefon — semak akaun WhatsApp');}}});
  if(key==='phone') input.addEventListener('blur',()=>{const number=malaysiaPhone(input.value);if(number) input.value=number;});
  wrapper.append(caption,input,help,error); $('fields').append(wrapper); sourceLine(key,'');
}
if(registering){
 listingTools=createGoogleListingTools({input:$('field-google'),name:()=>$('field-name').value,onChange:invalidate,search:query=>api('/api/search',{query}),lookup:token=>api('/api/import',{token})});
 $('profile-form').prepend(listingTools.panel);listingTools.lock(true);
 pendingStart=document.createElement('button');pendingStart.type='button';pendingStart.className='secondary';pendingStart.disabled=true;pendingStart.textContent='Daftar perniagaan yang belum ada di Google Maps';$('registration').append(pendingStart);
 pendingStart.onclick=()=>{if(!adminCredential||adminExpiry<=Date.now())return;cancelSearch();sequence++;listingTools.invalidate();invalidate();selectedBusiness.hidden=true;searchSuggestions.hidden=true;$('warnings').hidden=true;$('fields').querySelectorAll('select').forEach(node=>node.remove());for(const key of Object.keys(fieldNames)){$('field-'+key).value='';$('error-'+key).textContent='';sourceLine(key,'');}listingTools.set({name:$('query').value.trim(),googleStatus:'pending'});$('field-name').value=$('query').value.trim();previewLogo();$('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});};
}
$('logo-preview').onload=()=>{$('logo-preview').hidden=false; $('logo-fallback').hidden=true;};
$('logo-preview').onerror=()=>{$('logo-preview').hidden=true; $('logo-fallback').hidden=false;};
async function api(path, body, signal) {
  if (!endpoint) throw new Error('Carian automatik belum tersedia. Cuba lagi kemudian atau hubungi pentadbir.');
  const base = new URL(endpoint);
  if (base.protocol!=='https:' && !(base.protocol==='http:' && base.hostname==='127.0.0.1')) throw new Error('Sambungan carian tidak sah.');
  if(registering&&(!adminCredential||adminExpiry<=Date.now()))throw new Error('Log masuk sebagai super admin untuk mencari Google Review Place ID.');
  const route=registering?path.replace('/api/','/api/admin/'):path;
  const response = await fetch(new URL(route,base),{method:'POST',headers:{'Content-Type':'application/json',...(registering?{Authorization:'Bearer '+adminCredential}:{})},body:JSON.stringify(body),signal});
  const data=await response.json();
  if (data.demo) $('demo').hidden=false;
  if(!response.ok){if(registering&&[401,403].includes(response.status)){adminCredential='';adminExpiry=0;searchAccess(false);}throw new Error(data.error||'Carian tidak tersedia sekarang.');}
  return data;
}
// Set these here as well so a cached copy of the previous HTML remains usable.
$('query').setAttribute('role','combobox');
$('query').setAttribute('aria-autocomplete','list');
$('query').setAttribute('aria-controls','choices');
$('query').setAttribute('autocomplete','off');
$('choices').setAttribute('role','listbox');
$('choices').setAttribute('aria-label','Cadangan perniagaan');
if(!$('search-form').contains($('choices'))) $('search-form').append($('search-status'),$('choices'));
const selectedBusiness=document.createElement('p'); selectedBusiness.className='selection-summary'; selectedBusiness.hidden=true;
$('search-form').append(selectedBusiness);
const searchSuggestions=document.createElement('iframe');searchSuggestions.title='Cadangan carian Google';searchSuggestions.className='google-search-suggestions';searchSuggestions.hidden=true;
searchSuggestions.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');searchSuggestions.referrerPolicy='no-referrer';
$('warnings').after(searchSuggestions);
if(!registering){const note=document.createElement('p');note.className='notice';note.id='review-access';note.textContent='Pautan Google Review diurus oleh super admin dan dipasang secara automatik pada halaman anda.';$('warnings').before(note);}
function activeOption(index) {
  activePlace=index;
  $('choices').querySelectorAll('[role="option"]').forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));
  if(index<0) $('query').removeAttribute('aria-activedescendant');
  else {
    const option=$('choice-'+index); $('query').setAttribute('aria-activedescendant',option.id);
    option.scrollIntoView({block:'nearest'});
  }
}
function closeChoices(clear=false) {
  activeOption(-1); $('choices').hidden=true; $('query').setAttribute('aria-expanded','false'); $('google-attribution').hidden=selectedBusiness.hidden||placesFromDemo;
  if(clear) { places=[]; $('choices').replaceChildren(); }
}
function showChoices() {
  if(!places.length) return;
  $('choices').hidden=false; $('query').setAttribute('aria-expanded','true'); $('google-attribution').hidden=placesFromDemo;
}
function cancelSearch() {
  activeSearch?.abort(); sequence++; closeChoices(true); $('query').setAttribute('aria-busy','false');
  $('search-button').disabled=registering&&(!adminCredential||adminExpiry<=Date.now()); $('search-status').textContent='';
}
function renderPlaces(data,current) {
  closeChoices(true); places=data.places || []; placesFromDemo=!!data.demo;
  $('query').setAttribute('aria-busy','false');
  $('search-status').textContent=places.length?'Pilih nama dan alamat perniagaan yang betul.':'Tiada cadangan ditemui. Tambahkan bandar atau tekan Cari perniagaan.';
  const thirdParty=$('third-party-attribution'); thirdParty.replaceChildren();
  const attributions=new Map();
  places.forEach((place,index)=>{
    for(const attribution of place.attributions || []) if(attribution.provider) attributions.set(attribution.provider,attribution.providerUri);
    const button=document.createElement('button'); button.type='button'; button.className='choice'; button.id='choice-'+index;
    button.setAttribute('role','option'); button.setAttribute('aria-selected','false'); button.tabIndex=-1;
    const name=document.createElement('strong'); name.textContent=place.name+(place.closed?' · Ditutup kekal':'');
    const address=document.createElement('span'); address.textContent=place.address;
    button.append(name,address); button.addEventListener('click',()=>choose(place,current)); $('choices').append(button);
  });
  for(const [provider,uri] of attributions) {
    const el=document.createElement(httpsURL(uri)?'a':'span'); el.textContent=provider;
    if(el.tagName==='A') {el.href=uri;el.target='_blank';el.rel='noopener noreferrer';}
    thirdParty.append(el,' ');
  }
  showChoices();
}
const suggestions=createSuggestions({
  request:(query,signal)=>api('/api/suggest',{query,sessionToken},signal),
  onResult:data=>renderPlaces(data,sequence),
  onState:(state,error)=>{
    $('query').setAttribute('aria-busy',String(state==='loading'));
    $('search-status').textContent=state==='loading'?'Mencari cadangan perniagaan…':state==='error'?error.message:state==='idle'&&$('query').value?'Taip sekurang-kurangnya 3 aksara untuk cadangan.':'';
  },
});
function queryChanged(event) {
  publicDraftToken='';cancelSearch(); selectedBusiness.hidden=true; $('google-attribution').hidden=true; $('editor').hidden=true; invalidate();
  if(event?.isComposing) {suggestions.cancel();return;}
  suggestions.update($('query').value);
}
$('query').addEventListener('input',queryChanged);
$('query').addEventListener('compositionend',queryChanged);
$('query').addEventListener('focus',showChoices);
$('query').addEventListener('keydown',event=>{
  if(event.isComposing) return;
  if((event.key==='ArrowDown'||event.key==='ArrowUp')&&places.length) {
    event.preventDefault(); showChoices();
    activeOption(event.key==='ArrowDown'?(activePlace+1)%places.length:activePlace<0?places.length-1:(activePlace-1+places.length)%places.length);
  } else if(event.key==='Enter'&&activePlace>=0&&!$('choices').hidden) {
    event.preventDefault(); choose(places[activePlace],sequence);
  } else if(event.key==='Escape') {
    event.preventDefault(); suggestions.cancel(); cancelSearch();
  }
});
$('search-form').addEventListener('focusout',event=>{if(!$('search-form').contains(event.relatedTarget)) closeChoices();});
document.addEventListener('pointerdown',event=>{if(!$('search-form').contains(event.target)) closeChoices();});
$('search-form').addEventListener('submit', async event => {
  event.preventDefault(); suggestions.reset(); sessionToken=crypto.randomUUID(); cancelSearch(); const current=++sequence;
  selectedBusiness.hidden=true; $('google-attribution').hidden=true; $('editor').hidden=true; invalidate();
  activeSearch=new AbortController(); $('search-button').disabled=true; $('search-status').textContent='Mencari perniagaan…';
  try {
    const data=await api('/api/search',{query:$('query').value.trim()},activeSearch.signal);
    if(current===sequence) renderPlaces(data,current);
  } catch(error) {if(error.name!=='AbortError'&&current===sequence) $('search-status').textContent=error.message;}
  finally {if(current===sequence) $('search-button').disabled=registering&&(!adminCredential||adminExpiry<=Date.now());}
});
async function choose(place,current) {
  if(current!==sequence) return;
  suggestions.reset(); sessionToken=crypto.randomUUID(); closeChoices(true);
  activeSearch?.abort(); activeSearch=new AbortController();
  $('query').value=place.name; $('query').setAttribute('aria-busy','false');
  selectedBusiness.textContent=place.name+(place.address?' — '+place.address:''); selectedBusiness.hidden=false;
  $('google-attribution').hidden=placesFromDemo;
  $('search-button').disabled=true;
  $('search-status').textContent='Mencari telefon dan profil sosial melalui Google serta laman rasmi…';
  try {
    const data=await api('/api/import',{token:place.token},activeSearch.signal);
    if(current!==sequence) return;
    invalidate();publicDraftToken=data.draftToken||''; sources=data.sources || {};
    searchSuggestions.hidden=!data.searchSuggestionsHtml;searchSuggestions.srcdoc=data.searchSuggestionsHtml ? '<base target="_blank"><meta name="referrer" content="no-referrer">'+data.searchSuggestionsHtml : '';
    $('editor').hidden=false;
    $('fields').querySelectorAll('select').forEach(select=>select.remove());
    for (const key of Object.keys(fieldNames)) {
      $('field-'+key).value=data.profile[key] || ''; $('field-'+key).removeAttribute('aria-invalid'); $('error-'+key).textContent=''; sourceLine(key,sources[key]);
      if((data.candidates?.[key]?.length || 0)>1) {
        const select=document.createElement('select'); select.setAttribute('aria-label','Pilih pautan '+fieldNames[key]);
        const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Pilih pautan '+fieldNames[key]+' yang betul'; select.append(placeholder);
        for(const url of data.candidates[key]) if(httpsURL(url)) {const option=document.createElement('option');option.value=url;option.textContent=url;select.append(option);}
        select.addEventListener('change',()=>{if(select.value){$('field-'+key).value=select.value;sourceLine(key,select.value);invalidate();}});
        $('field-'+key).after(select);
      }
    }
    listingTools?.set(data.profile);previewLogo();
    $('warnings').textContent=(data.warnings || []).join(' '); $('warnings').hidden=!data.warnings?.length;
    $('search-status').textContent='Maklumat sedia disemak. Semua medan di bawah boleh diedit.';
    $('field-name').focus({preventScroll:true});
    $('editor').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error) { if(error.name!=='AbortError' && current===sequence) $('search-status').textContent=error.message; }
  finally { if(current===sequence) $('search-button').disabled=registering&&(!adminCredential||adminExpiry<=Date.now()); }
}
function validate(profile) {
  const errors={};
  if(!profile.name) errors.name='Masukkan nama perniagaan.';
  else if([...profile.name].length>80) errors.name='Gunakan 80 aksara atau kurang.';
  if((profile.address||'').length>300)errors.address='Gunakan 300 aksara atau kurang.';
  if(profile.tagline.length>140) errors.tagline='Gunakan 140 aksara atau kurang.';
  for(const key of Object.keys(fieldNames).filter(k=>!['name','tagline','phone','address'].includes(k))) if(profile[key] && (!httpsURL(profile[key]) || profile[key].length>500)) errors[key]='Gunakan URL https:// penuh, maksimum 500 aksara.';
  if(profile.phone && !malaysiaPhone(profile.phone)) errors.phone='Gunakan nombor Malaysia seperti 012-2258950 atau +60 12-225 8950.';
  if(profile.threads && !threadsProfile(profile.threads)) errors.threads='Gunakan pautan profil https://www.threads.com/@nama atau threads.net/@nama.';
  if(registering&&profile.googleStatus!=='pending')try {
    const review=new URL(profile.google); const host=review.hostname.toLowerCase();
    const valid=((host==='google.com'||host.endsWith('.google.com')||host==='google.com.my'||host.endsWith('.google.com.my'))&&review.pathname.includes('/local/writereview')&&review.searchParams.get('placeid')) || (host==='g.page'&&/\/r\/[^/]+\/review\/?$/i.test(review.pathname));
    if(!httpsURL(profile.google)||!valid) errors.google='Masukkan pautan Google Review terus dengan Place ID atau pautan g.page review.';
  } catch {errors.google='Pautan Google Review diperlukan.';}
  return errors;
}
$('profile-form').addEventListener('submit',async event=>{
  event.preventDefault(); invalidate(); const current=++resultSequence;
  if(registering){
    if(!adminCredential||adminExpiry<=Date.now()){$('form-status').textContent='Log masuk sebagai super admin sebelum mendaftarkan pelanggan.';return;}
    const email=$('register-email').value.trim().toLowerCase();
    if(!/^[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?@gmail\.com$/.test(email)||email.includes('..')){$('form-status').textContent='Masukkan Gmail utama pelanggan @gmail.com, tanpa +alias.';$('register-email').focus();return;}
  }
  if(!registering&&!publicDraftToken){$('form-status').textContent='Cari dan pilih perniagaan semula sebelum menjana halaman.';return;}
  const profile={v:1}; for(const key of Object.keys(fieldNames)) profile[key]=$('field-'+key).value.normalize('NFC').trim();
  listingTools?.apply(profile);
  if(malaysiaPhone(profile.phone)) profile.phone=malaysiaPhone(profile.phone);
  const errors=validate(profile);
  for(const key of Object.keys(fieldNames)){$('error-'+key).textContent=errors[key]||'';$('field-'+key).setAttribute('aria-invalid',errors[key]?'true':'false');}
  if(Object.keys(errors).length){$('form-status').textContent='Semak medan yang ditandakan.';$('field-'+Object.keys(errors)[0]).focus();return;}
  $('generate').disabled=true;activeGeneration=new AbortController();
  $('form-status').textContent='Menjana URL pendek dan QR…';
  try {
    const page=await generateShortPage(profile,{origin:location.origin,signal:activeGeneration.signal,
      shorten:(url,signal)=>registering?registrationAPI('register',{method:'POST',body:{url,email:$('register-email').value.trim().toLowerCase()},signal}):api('/api/create',{profile,draftToken:publicDraftToken},signal),
      qr:url=>QRCode.toDataURL(url,{width:1024,margin:4,errorCorrectionLevel:'M',color:{dark:'#173b33',light:'#ffffff'}}),
    });
    if(current!==resultSequence) return;
    showShareURL(page.url,page.png);
    $('manage-registration').href='/admin.html?page='+new URL(page.url).searchParams.get('s');$('manage-registration').hidden=!registering;
    if(registering)$('result').querySelector('.notice').textContent='Pendaftaran Gmail selesai. Pelanggan boleh login di tap.imai.my/edit untuk menyemak pakej, menghantar rujukan bayaran dan menyunting halaman selepas diaktifkan. URL pendek dan QR kekal sama.';
    $('result').hidden=false; $('form-status').textContent='URL pendek dan QR anda sedia.';
    $('result').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error){if(error.name!=='AbortError'&&current===resultSequence)$('form-status').textContent='URL pendek dan QR belum dapat dijana. Cuba lagi sebentar. '+error.message;}
  finally {$('generate').disabled=registering&&(!adminCredential||adminExpiry<=Date.now());}
});
function showShareURL(url,png) {
  $('share').value=url;$('qr').src=png;$('open').href=url;$('download').href=png;$('copy-status').textContent='';
}
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share').value);$('copy-status').textContent='Pautan disalin.';}catch{$('share').focus();$('share').select();$('copy-status').textContent='Pilih dan salin pautan di atas secara manual.';}});
