import {safeAppearanceURL,mapsAddressURL,promotionRange,promotionState} from './appearance-controls-values.mjs';
import {whatsappFromPhone} from '../import-service/contacts.mjs';

// Enhance the existing stored fields. Every helper is rebuilt from the selected record;
// changing a tab never changes data, and saving still uses the same profile contract.
export function createAppearanceControls({onChange}) {
  const message=(ms,en)=>document.documentElement.lang==='en'?en:ms;
  const $=key=>document.getElementById('field-'+key),nodes={},controls=[];
  let locked=false;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  function wrap(key){const box=el('div','appearance-control');$(key).before(box);box.append($(key));nodes[key]=[box];return box;}
  function select(box,id,label,options){const l=el('label','',label),s=el('select');s.id=id;l.htmlFor=id;for(const [value,text] of options){const o=el('option','',text);o.value=value;s.append(o);}box.prepend(l,s);controls.push(s);return s;}
  function button(text,action,box,cls='secondary'){const b=el('button',cls,text);b.type='button';b.onclick=action;controls.push(b);box.append(b);return b;}
  function help(box,text){const p=el('p','help',text);box.append(p);return p;}
  function changed(){refresh();onChange();}
  const themeBox=wrap('theme'),accentBox=wrap('accent');
  const themeCards=el('div','appearance-theme-cards');themeBox.append(themeCards);
  const themeOptions=[['classic','Klasik','#20543e'],['dark','Gelap','#91c8ad'],['bright','Ceria','#7040bb']];
  for(const [value,text,color] of themeOptions){const b=button(text,()=>{$('theme').value=value;$('accent').value=color;changed();},themeCards,'appearance-theme-card');b.dataset.theme=value;b.dataset.choice=value;const sample=el('span','theme-card-sample');sample.setAttribute('aria-hidden','true');b.prepend(sample);}
  const colorLine=el('div','appearance-color-line');$('accent').before(colorLine);colorLine.append($('accent'));
  const hex=el('input');hex.id='appearance-hex';hex.type='text';hex.maxLength=7;hex.pattern='#[a-fA-F0-9]{6}';hex.setAttribute('aria-label','Kod warna HEX');hex.dataset.noI18n='';colorLine.append(hex);controls.push(hex);
  hex.oninput=()=>{if(/^#[a-fA-F0-9]{6}$/.test(hex.value)){$('accent').value=hex.value;changed();}};
  hex.onblur=()=>{if(!hex.checkValidity()){hex.value=$('accent').value;}};
  const swatches=el('div','appearance-swatches');accentBox.append(swatches);
  for(const color of ['#20543e','#193c70','#7040bb','#a33245','#a45c13','#111827']){const b=button(color,()=>{$('accent').value=color;changed();},swatches,'appearance-swatch');b.style.backgroundColor=color;b.setAttribute('aria-label',color);b.title=color;b.dataset.color=color;}
  help(accentBox,'Pilih palet atau masukkan kod HEX. Warna butang digunakan pada halaman anda.');
  const themePreview=el('div','appearance-theme-preview');themePreview.setAttribute('aria-label','Pratonton tema');themeBox.append(themePreview);
  const previewName=el('strong'),previewText=el('span'),previewButton=el('span','appearance-preview-button','Contoh butang');previewName.dataset.noI18n='';previewText.dataset.noI18n='';themePreview.append(previewName,previewText,previewButton);
  const resetters=[];
  function linkEditor(key,label,{address=false,whatsapp=false}={}){
    const box=wrap(key),input=$(key);let draft='';
    const options=[['none','Tidak dipaparkan'],['link','Pautan HTTPS']];if(key==='menu')options.push(['catalog','Bina menu / katalog']);if(address)options.push(['address','Guna alamat perniagaan']);if(whatsapp)options.push(['whatsapp','Nombor WhatsApp Malaysia']);
    const mode=select(box,'appearance-'+key+'-mode',label,options),phone=el('input');phone.type='tel';phone.placeholder='Contoh: 012-2258950';phone.setAttribute('aria-label','Nombor WhatsApp promosi');phone.hidden=true;box.append(phone);controls.push(phone);
    const open=el('a','appearance-test-link','Uji pautan ↗');open.target='_blank';open.rel='noopener noreferrer';box.append(open);
    const hint=help(box,address?'Pilih pautan Maps sendiri atau jana arah daripada alamat yang anda simpan.':'Kosongkan pautan untuk menyembunyikan butang ini.');
    function sync(){
      input.hidden=['none','whatsapp','catalog'].includes(mode.value);input.readOnly=['address','catalog'].includes(mode.value);phone.hidden=mode.value!=='whatsapp';phone.disabled=locked||phone.hidden;
      const url=safeAppearanceURL(input.value);open.hidden=!url||mode.value==='catalog';if(url)open.href=url;else open.removeAttribute('href');
      input.setCustomValidity(input.value&&!url?message('Gunakan pautan HTTPS yang sah.','Enter a valid HTTPS link.'):'');
      mode.setCustomValidity(mode.value==='address'&&!input.value?message('Isi alamat perniagaan dahulu.','Enter your business address first.'):'');
      phone.setCustomValidity(mode.value==='whatsapp'&&!whatsappFromPhone(phone.value)?message('Masukkan nombor telefon Malaysia yang sah.','Enter a valid Malaysian phone number.'):'');
      hint.hidden=['none','catalog'].includes(mode.value);
    }
    mode.onchange=()=>{if(mode.value==='none'){draft=input.value||draft;input.value='';}else if(mode.value==='address'){input.value=mapsAddressURL($('address').value);}else if(mode.value==='whatsapp'){input.value=whatsappFromPhone(phone.value)||'';}else input.value=draft;sync();changed();};
    phone.oninput=()=>{input.value=whatsappFromPhone(phone.value)||'';sync();changed();};
    input.addEventListener('input',()=>{draft=input.value;sync();});
    resetters.push(()=>{draft=input.value;let builtIn=false;try{const u=new URL(input.value);builtIn=key==='menu'&&u.origin===location.origin&&u.pathname==='/menu/'&&/^[A-Za-z0-9_-]{16}$/.test(u.searchParams.get('s')||'');}catch{}mode.value=builtIn?'catalog':input.value?'link':'none';phone.value='';sync();});
    return {sync};
  }
  const links=[linkEditor('menu','Jenis pautan menu / katalog'),linkEditor('directions','Pilihan lokasi',{address:true}),linkEditor('promoURL','Jenis pautan promosi',{whatsapp:true})];
  const promoTitleBox=wrap('promoTitle'),promoTextBox=wrap('promoText');
  const templates=select(promoTitleBox,'appearance-promo-template','Idea promosi',[['','Tulis promosi sendiri'],['offer','Tawaran istimewa'],['menu','Menu baharu'],['booking','Tempahan dibuka']]);
  const examples={offer:['Tawaran istimewa','Hubungi kami untuk maklumat tawaran terkini.'],menu:['Menu baharu','Singgah dan cuba pilihan menu baharu kami.'],booking:['Tempahan dibuka','Tempah awal untuk memastikan tempat anda.']};
  const englishExamples={offer:['Special offer','Contact us for details of our latest offer.'],menu:['New menu','Drop by and try our new menu choices.'],booking:['Bookings open','Book early to secure your place.']};
  templates.onchange=()=>{const example=(document.documentElement.lang==='en'?englishExamples:examples)[templates.value];if(example){[$('promoTitle').value,$('promoText').value]=example;changed();}};
  help(promoTitleBox,'Pilih idea sebagai permulaan, kemudian sunting mengikut tawaran anda. Kosongkan tajuk untuk menyembunyikan promosi.');
  const titleCount=help(promoTitleBox,''),textCount=help(promoTextBox,'');titleCount.dataset.noI18n='';textCount.dataset.noI18n='';
  const promoPreview=el('div','appearance-promo-preview');promoTextBox.append(promoPreview);const promoHeading=el('strong'),promoBody=el('p');promoHeading.dataset.noI18n='';promoBody.dataset.noI18n='';promoPreview.append(promoHeading,promoBody);
  const startBox=wrap('promoStart'),endBox=wrap('promoEnd');let dateDraft={start:'',end:''};
  const schedule=select(startBox,'appearance-schedule','Jadual promosi',[['always','Sepanjang masa'],['range','Tarikh mula & tamat'],['start','Bermula pada tarikh'],['end','Sehingga tarikh tamat']]);
  const quick=el('div','appearance-duration');startBox.append(quick);for(const days of [7,14,30])button(days+' hari',()=>{const range=promotionRange(days);$('promoStart').value=range.promoStart;$('promoEnd').value=range.promoEnd;dateDraft={start:range.promoStart,end:range.promoEnd};schedule.value='range';syncDates();changed();},quick);
  help(startBox,'Waktu Malaysia (UTC+8). Promosi dipaparkan mengikut jadual apabila halaman pelanggan dibuka.');
  const status=el('p','appearance-promotion-state');status.setAttribute('role','status');endBox.append(status);
  function syncDates(){const start=['range','start'].includes(schedule.value),end=['range','end'].includes(schedule.value);$('promoStart').hidden=!start;$('promoEnd').hidden=!end;for(const [key,show] of [['promoStart',start],['promoEnd',end]]){const label=document.querySelector('label[for="field-'+key+'"]');if(label)label.hidden=!show;}$('promoStart').required=start;$('promoEnd').required=end;$('promoEnd').setCustomValidity(start&&end&&$('promoStart').value&&$('promoEnd').value&&$('promoEnd').value<=$('promoStart').value?message('Tarikh tamat mesti selepas tarikh mula.','The end date must be after the start date.'):'');}
  schedule.onchange=()=>{if($('promoStart').value)dateDraft.start=$('promoStart').value;if($('promoEnd').value)dateDraft.end=$('promoEnd').value;$('promoStart').value=['range','start'].includes(schedule.value)?dateDraft.start:'';$('promoEnd').value=['range','end'].includes(schedule.value)?dateDraft.end:'';syncDates();changed();};
  for(const key of ['promoStart','promoEnd'])$(key).addEventListener('input',syncDates);
  resetters.push(()=>{templates.value='';dateDraft={start:$('promoStart').value,end:$('promoEnd').value};schedule.value=dateDraft.start?(dateDraft.end?'range':'start'):(dateDraft.end?'end':'always');syncDates();});
  const coverEmpty=el('div','appearance-cover-empty','Belum ada cover. Latar tema akan digunakan.');coverEmpty.id='appearance-cover-empty';
  const coverTip=el('p','help','Cadangan cover: gambar melintang 16:9. Pastikan subjek utama di tengah supaya sesuai pada telefon.');
  const coverMeta=el('p','help');coverMeta.id='appearance-cover-meta';coverMeta.dataset.noI18n='';
  function refresh(){
    hex.value=$('accent').value;for(const b of themeCards.children)b.setAttribute('aria-pressed',String(b.dataset.choice===$('theme').value));
    for(const b of swatches.children)b.setAttribute('aria-pressed',String(b.dataset.color===$('accent').value));
    const theme=$('theme').value;themePreview.dataset.theme=theme;themePreview.style.setProperty('--preview-accent',$('accent').value);previewName.textContent=$('name').value||'SmartTap';previewText.textContent=$('tagline').value;previewButton.style.color=contrast($('accent').value);
    titleCount.textContent=$('promoTitle').value.length+' / 70';textCount.textContent=$('promoText').value.length+' / 180';promoHeading.textContent=$('promoTitle').value;promoBody.textContent=$('promoText').value;promoPreview.hidden=!$('promoTitle').value;
    const state=promotionState({promoTitle:$('promoTitle').value,promoStart:$('promoStart').value,promoEnd:$('promoEnd').value});status.dataset.state=state;status.textContent=({empty:'Tiada promosi — isi tajuk pada tab Promosi.',active:'Promosi aktif',scheduled:'Promosi dijadualkan — belum bermula',expired:'Promosi tamat — tidak dipaparkan',invalid:'Semak tarikh mula dan tamat.'})[state];
    coverEmpty.hidden=!!$('cover').value;
  }
  // Input events include edits made by the address editor. Never regenerate a
  // saved directions URL merely because an unrelated field changed.
  for(const key of ['name','tagline','theme','accent','promoTitle','promoText','promoStart','promoEnd'])$(key).addEventListener('input',refresh);
  $('theme').addEventListener('change',refresh);
  window.addEventListener('smarttap:language',()=>{for(const link of links)link.sync();syncDates();});
  function lock(value){locked=value;for(const c of controls)c.disabled=value;for(const link of links)link.sync();}
  return {nodes,coverNodes:[coverEmpty,coverTip,coverMeta],refresh,lock,set(){for(const reset of resetters)reset();coverMeta.textContent='';refresh();},coverSelected(file){coverMeta.textContent=file?file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB':'';refresh();}};
}
function contrast(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'#14281f':'#ffffff';}
