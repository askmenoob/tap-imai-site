import QRCode from 'qrcode';
import { createSuggestions } from './business-suggestions.mjs';
import { malaysiaPhone, whatsappFromPhone, threadsProfile } from '../import-service/contacts.mjs';
import { generateShortPage } from './short-page.mjs';

const $ = id => document.getElementById(id);
const fieldNames = {name:'Nama perniagaan',logo:'URL logo',tagline:'Penerangan ringkas',google:'Google Review',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',threads:'Threads',phone:'Telefon perniagaan',whatsapp:'WhatsApp',website:'Laman web'};
let activeSearch; let sequence = 0; let resultSequence = 0; let sources = {};
let activeGeneration;
let sessionToken = crypto.randomUUID();
let places = []; let activePlace = -1; let placesFromDemo = false;
const config = window.SMARTTAP_IMPORT_CONFIG || {};
const endpoint = location.hostname === '127.0.0.1' ? location.origin : (config.endpoint || '');
// Remove the earlier optional controls if an older HTML response was cached.
$('shorten')?.remove();$('short-status')?.remove();$('share').rows=1;
$('result').querySelector('.notice').textContent='Simpan URL pendek ini. Super admin boleh mengemas kini maklumat pada URL dan QR yang sama. Menjana semula melalui borang ini menghasilkan pautan baharu.';
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
  const caption=document.createElement('label'); caption.htmlFor='field-'+key; caption.textContent=label+(['name','google'].includes(key)?' *':'');
  const input=document.createElement('input'); input.id='field-'+key; input.name=key;
  input.maxLength=key==='name'?90:key==='tagline'?150:500; input.autocomplete=key==='name'?'organization':'off';
  if (!['name','tagline','phone'].includes(key)) input.inputMode='url';
  if(key==='phone') {input.type='tel';input.placeholder='Contoh: 012-2258950';}
  const help=document.createElement('p'); help.id='source-'+key; help.className='source';
  const error=document.createElement('p'); error.id='error-'+key; error.className='field-error';
  input.setAttribute('aria-describedby',help.id+' '+error.id);
  input.addEventListener('input',()=>{invalidate(); sourceLine(key,'Disunting oleh anda'); if(key==='logo') previewLogo();if(key==='phone'){const link=whatsappFromPhone(input.value);if(link){$('field-whatsapp').value=link;sourceLine('whatsapp','Dijana daripada telefon — semak akaun WhatsApp');}}});
  if(key==='phone') input.addEventListener('blur',()=>{const number=malaysiaPhone(input.value);if(number) input.value=number;});
  wrapper.append(caption,input,help,error); $('fields').append(wrapper); sourceLine(key,'');
}
$('logo-preview').onload=()=>{$('logo-preview').hidden=false; $('logo-fallback').hidden=true;};
$('logo-preview').onerror=()=>{$('logo-preview').hidden=true; $('logo-fallback').hidden=false;};
if(new URLSearchParams(location.search).get('manual')==='1') {
  $('editor').hidden=false;$('warnings').hidden=true;$('field-name').focus({preventScroll:true});$('editor').scrollIntoView({block:'start'});
}

async function api(path, body, signal) {
  if (!endpoint) throw new Error('Carian automatik belum diaktifkan. Gunakan borang manual sementara pentadbir melengkapkan sambungan.');
  const base = new URL(endpoint);
  if (base.protocol!=='https:' && !(base.protocol==='http:' && base.hostname==='127.0.0.1')) throw new Error('Sambungan carian tidak sah.');
  const response = await fetch(new URL(path,base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
  const data=await response.json();
  if (data.demo) $('demo').hidden=false;
  if (!response.ok) throw new Error(data.error || 'Carian tidak tersedia sekarang.');
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
  $('search-button').disabled=false; $('search-status').textContent='';
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
  cancelSearch(); selectedBusiness.hidden=true; $('google-attribution').hidden=true; $('editor').hidden=true; invalidate();
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
  finally {if(current===sequence) $('search-button').disabled=false;}
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
    invalidate(); sources=data.sources || {};
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
    previewLogo();
    $('warnings').textContent=(data.warnings || []).join(' '); $('warnings').hidden=!data.warnings?.length;
    $('search-status').textContent='Maklumat sedia disemak. Semua medan di bawah boleh diedit.';
    $('field-name').focus({preventScroll:true});
    $('editor').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error) { if(error.name!=='AbortError' && current===sequence) $('search-status').textContent=error.message; }
  finally { if(current===sequence) $('search-button').disabled=false; }
}
function validate(profile) {
  const errors={};
  if(!profile.name) errors.name='Masukkan nama perniagaan.';
  else if([...profile.name].length>80) errors.name='Gunakan 80 aksara atau kurang.';
  if(profile.tagline.length>140) errors.tagline='Gunakan 140 aksara atau kurang.';
  for(const key of Object.keys(fieldNames).filter(k=>!['name','tagline','phone'].includes(k))) if(profile[key] && (!httpsURL(profile[key]) || profile[key].length>500)) errors[key]='Gunakan URL https:// penuh, maksimum 500 aksara.';
  if(profile.phone && !malaysiaPhone(profile.phone)) errors.phone='Gunakan nombor Malaysia seperti 012-2258950 atau +60 12-225 8950.';
  if(profile.threads && !threadsProfile(profile.threads)) errors.threads='Gunakan pautan profil https://www.threads.com/@nama atau threads.net/@nama.';
  try {
    const review=new URL(profile.google); const host=review.hostname.toLowerCase();
    const valid=((host==='google.com'||host.endsWith('.google.com')||host==='google.com.my'||host.endsWith('.google.com.my'))&&review.pathname.includes('/local/writereview')&&review.searchParams.get('placeid')) || (host==='g.page'&&/\/r\/[^/]+\/review\/?$/i.test(review.pathname));
    if(!httpsURL(profile.google)||!valid) errors.google='Masukkan pautan Google Review terus dengan Place ID atau pautan g.page review.';
  } catch {errors.google='Pautan Google Review diperlukan.';}
  return errors;
}
$('profile-form').addEventListener('submit',async event=>{
  event.preventDefault(); invalidate(); const current=++resultSequence;
  const profile={v:1}; for(const key of Object.keys(fieldNames)) profile[key]=$('field-'+key).value.normalize('NFC').trim();
  if(malaysiaPhone(profile.phone)) profile.phone=malaysiaPhone(profile.phone);
  const errors=validate(profile);
  for(const key of Object.keys(fieldNames)){$('error-'+key).textContent=errors[key]||'';$('field-'+key).setAttribute('aria-invalid',errors[key]?'true':'false');}
  if(Object.keys(errors).length){$('form-status').textContent='Semak medan yang ditandakan.';$('field-'+Object.keys(errors)[0]).focus();return;}
  $('generate').disabled=true;activeGeneration=new AbortController();
  $('form-status').textContent='Menjana URL pendek dan QR…';
  try {
    const page=await generateShortPage(profile,{origin:location.origin,signal:activeGeneration.signal,
      shorten:(url,signal)=>api('/api/shorten',{url},signal),
      qr:url=>QRCode.toDataURL(url,{width:1024,margin:4,errorCorrectionLevel:'M',color:{dark:'#173b33',light:'#ffffff'}}),
    });
    if(current!==resultSequence) return;
    showShareURL(page.url,page.png);
    $('result').hidden=false; $('form-status').textContent='URL pendek dan QR anda sedia.';
    $('result').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error){if(error.name!=='AbortError'&&current===resultSequence)$('form-status').textContent='URL pendek dan QR belum dapat dijana. Cuba lagi sebentar. '+error.message;}
  finally {$('generate').disabled=false;}
});
function showShareURL(url,png) {
  $('share').value=url;$('qr').src=png;$('open').href=url;$('download').href=png;$('copy-status').textContent='';
}
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share').value);$('copy-status').textContent='Pautan disalin.';}catch{$('share').focus();$('share').select();$('copy-status').textContent='Pilih dan salin pautan di atas secara manual.';}});
