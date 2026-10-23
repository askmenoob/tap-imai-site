import QRCode from 'qrcode';

const $ = id => document.getElementById(id);
const fieldNames = {name:'Nama perniagaan',logo:'URL logo',tagline:'Penerangan ringkas',google:'Google Review',instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',whatsapp:'WhatsApp',website:'Laman web'};
let activeSearch; let sequence = 0; let resultSequence = 0; let sources = {};
const config = window.SMARTTAP_IMPORT_CONFIG || {};
const endpoint = location.hostname === '127.0.0.1' ? location.origin : (config.endpoint || '');
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
function invalidate() { resultSequence++; $('result').hidden=true; $('form-status').textContent=''; }
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
  if (!['name','tagline'].includes(key)) input.inputMode='url';
  const help=document.createElement('p'); help.id='source-'+key; help.className='source';
  const error=document.createElement('p'); error.id='error-'+key; error.className='field-error';
  input.setAttribute('aria-describedby',help.id+' '+error.id);
  input.addEventListener('input',()=>{invalidate(); sourceLine(key,'Disunting oleh anda'); if(key==='logo') previewLogo();});
  wrapper.append(caption,input,help,error); $('fields').append(wrapper); sourceLine(key,'');
}
$('logo-preview').onload=()=>{$('logo-preview').hidden=false; $('logo-fallback').hidden=true;};
$('logo-preview').onerror=()=>{$('logo-preview').hidden=true; $('logo-fallback').hidden=false;};

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
function cancelSearch() {
  activeSearch?.abort(); sequence++; $('choices').replaceChildren(); $('google-attribution').hidden=true;
  $('search-button').disabled=false; $('search-status').textContent='';
}
$('query').addEventListener('input',cancelSearch);
$('search-form').addEventListener('submit', async event => {
  event.preventDefault(); cancelSearch(); const current=++sequence;
  activeSearch=new AbortController(); $('search-button').disabled=true; $('search-status').textContent='Mencari perniagaan…';
  try {
    const data=await api('/api/search',{query:$('query').value.trim()},activeSearch.signal);
    if (current!==sequence) return;
    $('google-attribution').hidden=!!data.demo;
    $('search-status').textContent=data.places.length?'Pilih perniagaan dan lokasi yang betul.':'Tiada padanan ditemui. Cuba tambah bandar atau gunakan borang manual.';
    const thirdParty=$('third-party-attribution'); thirdParty.replaceChildren();
    const attributions=new Map();
    for (const place of data.places) {
      for (const attribution of place.attributions || []) if (attribution.provider) attributions.set(attribution.provider,attribution.providerUri);
      const button=document.createElement('button'); button.type='button'; button.className='choice';
      const name=document.createElement('strong'); name.textContent=place.name+(place.closed?' · Ditutup kekal':'');
      const address=document.createElement('span'); address.textContent=place.address;
      button.append(name,address); button.addEventListener('click',()=>choose(place,current)); $('choices').append(button);
    }
    for (const [provider,uri] of attributions) {
      const el=document.createElement(httpsURL(uri)?'a':'span'); el.textContent=provider;
      if (el.tagName==='A') { el.href=uri; el.target='_blank'; el.rel='noopener noreferrer'; }
      thirdParty.append(el,' ');
    }
  } catch(error) { if(error.name!=='AbortError' && current===sequence) $('search-status').textContent=error.message; }
  finally { if(current===sequence) $('search-button').disabled=false; }
});
async function choose(place,current) {
  if(current!==sequence) return;
  $('choices').querySelectorAll('button').forEach(b=>b.disabled=true);
  $('search-status').textContent='Membaca maklumat perniagaan dan laman rasmi…';
  try {
    const data=await api('/api/import',{token:place.token},activeSearch.signal);
    if(current!==sequence) return;
    invalidate(); sources=data.sources || {};
    $('editor').hidden=false;
    $('fields').querySelectorAll('select').forEach(select=>select.remove());
    for (const key of Object.keys(fieldNames)) {
      $('field-'+key).value=data.profile[key] || ''; $('field-'+key).removeAttribute('aria-invalid'); $('error-'+key).textContent=''; sourceLine(key,sources[key]);
      if((data.candidates?.[key]?.length || 0)>1) {
        const select=document.createElement('select'); select.setAttribute('aria-label','Pilih pautan '+fieldNames[key]);
        const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Pilih pautan '+fieldNames[key]+' yang betul'; select.append(placeholder);
        for(const url of data.candidates[key]) if(httpsURL(url)) {const option=document.createElement('option');option.value=url;option.textContent=url;select.append(option);}
        select.addEventListener('change',()=>{if(select.value){$('field-'+key).value=select.value;sourceLine(key,sources.website || 'Dipilih oleh anda');invalidate();}});
        $('field-'+key).after(select);
      }
    }
    previewLogo();
    $('warnings').textContent=(data.warnings || []).join(' '); $('warnings').hidden=!data.warnings?.length;
    $('search-status').textContent='Maklumat sedia disemak. Semua medan di bawah boleh diedit.';
    $('editor').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error) { if(error.name!=='AbortError' && current===sequence) $('search-status').textContent=error.message; }
  finally { if(current===sequence) $('choices').querySelectorAll('button').forEach(b=>b.disabled=false); }
}
function validate(profile) {
  const errors={};
  if(!profile.name) errors.name='Masukkan nama perniagaan.';
  else if([...profile.name].length>80) errors.name='Gunakan 80 aksara atau kurang.';
  if(profile.tagline.length>140) errors.tagline='Gunakan 140 aksara atau kurang.';
  for(const key of Object.keys(fieldNames).filter(k=>!['name','tagline'].includes(k))) if(profile[key] && (!httpsURL(profile[key]) || profile[key].length>500)) errors[key]='Gunakan URL https:// penuh, maksimum 500 aksara.';
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
  const errors=validate(profile);
  for(const key of Object.keys(fieldNames)){$('error-'+key).textContent=errors[key]||'';$('field-'+key).setAttribute('aria-invalid',errors[key]?'true':'false');}
  if(Object.keys(errors).length){$('form-status').textContent='Semak medan yang ditandakan.';$('field-'+Object.keys(errors)[0]).focus();return;}
  $('generate').disabled=true;
  try {
    const data=JSON.stringify(profile); const bytes=new TextEncoder().encode(data);
    const encoded=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
    const url=new URL('./',location.href); url.search='?p='+encoded; url.hash='';
    if(encoded.length>4096) throw new Error('Maklumat terlalu panjang. Pendekkan penerangan atau pautan.');
    let png;
    try { png=await QRCode.toDataURL(url.href,{width:1024,margin:3,errorCorrectionLevel:'M',color:{dark:'#173b33',light:'#ffffff'}}); }
    catch {throw new Error('Pautan terlalu panjang untuk QR. Pendekkan URL atau penerangan dan cuba lagi.');}
    if(current!==resultSequence) return;
    $('share').value=url.href; $('qr').src=png; $('open').href=url.href; $('download').href=png;
    $('result').hidden=false; $('form-status').textContent='Halaman dan QR anda sedia.';
    $('result').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error){$('form-status').textContent=error.message;}
  finally {$('generate').disabled=false;}
});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share').value);$('copy-status').textContent='Pautan disalin.';}catch{$('share').focus();$('share').select();$('copy-status').textContent='Pilih dan salin pautan di atas secara manual.';}});
