import {malaysiaStates,days,hourModes,timeSlots,defaultSchedule,formatHours,readHours,formatAddress,readAddress} from './business-details-values.mjs';
export function createBusinessDetails({addressInput,hoursInput,onChange}){
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const select=(id,options)=>{const node=el('select');node.id=id;for(const [value,text] of Object.entries(options)){const option=el('option',text);option.value=value;node.append(option);}return node;};
 const field=(label,input)=>{const box=el('div');box.className='business-detail-field';const caption=el('label',label);caption.htmlFor=input.id;box.append(caption,input);return box;};
 const addressWrap=el('div');addressWrap.className='business-detail-editor';addressInput.before(addressWrap);
 const addressMode=select('business-address-mode',{custom:'Teks sedia ada / tersuai',structured:'Alamat Malaysia'}),addressFields=el('div');addressFields.className='business-address-fields';
 const addressParts={};for(const [key,label,max] of [['line1','Alamat baris 1',110],['line2','Alamat baris 2 (pilihan)',80],['postcode','Poskod',5],['city','Bandar',60],['state','Negeri',40]]){
  const input=key==='state'?select('business-address-state',Object.fromEntries([['','Pilih negeri'],...malaysiaStates.map(state=>[state,state])])):el('input');input.id='business-address-'+key;
  if(key!=='state'){input.type='text';input.maxLength=max;}if(key==='postcode'){input.pattern='[0-9]{5}';input.inputMode='numeric';}input.required=key!=='line2';input.autocomplete='off';addressParts[key]=input;
  const box=field(label,input);box.dataset.part=key;addressFields.append(box);
 }
 const addressHelp=el('p','Pilih negeri daripada senarai. Poskod dan bandar diisi mengikut alamat perniagaan. Maksimum 240 aksara untuk alamat penuh.');addressHelp.className='help';
 addressWrap.append(field('Format alamat',addressMode),addressInput,addressFields,addressHelp);
 const hoursWrap=el('div');hoursWrap.className='business-detail-editor';hoursInput.before(hoursWrap);
 const mode=select('business-hours-mode',hourModes),day=select('business-hours-day',Object.fromEntries(days.map((name,i)=>[i,name]))),state=select('business-hours-state',{open:'Dibuka',closed:'Tutup',all:'24 jam'});
 const open=select('business-hours-open',Object.fromEntries(timeSlots.map(time=>[time,time]))),close=select('business-hours-close',Object.fromEntries(timeSlots.map(time=>[time,time])));
 const hoursFields=el('div'),timeRow=el('div');hoursFields.className='business-hours-fields';timeRow.className='business-time-row';timeRow.append(field('Waktu buka',open),field('Waktu tutup',close));const dayBox=field('Pilih hari',day);hoursFields.append(dayBox,field('Status operasi',state),timeRow);
 const hint=el('p','Waktu Malaysia · format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu.');hint.className='help';
 const preview=el('details');preview.className='business-hours-preview';const previewText=el('p');previewText.dataset.noI18n='';preview.append(el('summary','Lihat jadual penuh'),previewText);
 hoursWrap.append(field('Jadual operasi',mode),hoursInput,hoursFields,hint,preview);
 let locked=false,schedule=defaultSchedule(),dayIndex=0,lastMode='custom';
 const timeValue=(input,value)=>{if(![...input.options].some(option=>option.value===value)){const option=el('option',value);option.value=value;input.append(option);}input.value=value;};
 function permissions(){
  addressMode.disabled=mode.disabled=locked;addressInput.disabled=hoursInput.disabled=locked;
  const structured=addressMode.value==='structured';addressInput.hidden=structured;addressFields.hidden=!structured;addressHelp.hidden=!structured;for(const input of Object.values(addressParts))input.disabled=locked||!structured;
  const custom=mode.value==='custom';hoursInput.hidden=!custom;hoursFields.hidden=custom;preview.hidden=custom;dayBox.hidden=mode.value!=='weekly';day.disabled=locked||mode.value!=='weekly';state.disabled=locked||custom;
  const timed=!custom&&state.value==='open';timeRow.hidden=!timed;open.disabled=close.disabled=locked||!timed;
 }
 function showDay(){const value=schedule[mode.value==='weekly'?dayIndex:0];state.value=value.state;timeValue(open,value.open);timeValue(close,value.close);hint.textContent=mode.value==='custom'?'Waktu Malaysia · format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu.':value.state==='open'&&value.close<value.open?'Waktu tutup adalah pada hari berikutnya.':'Waktu Malaysia · format 24 jam.';permissions();}
 function syncAddress(){addressParts.line1.setCustomValidity('');if(addressMode.value==='structured')try{addressInput.value=formatAddress(Object.fromEntries(Object.entries(addressParts).map(([key,input])=>[key,input.value])));}catch(error){if(Object.values(addressParts).every(input=>input.checkValidity()))addressParts.line1.setCustomValidity(error.message);}permissions();onChange();}
 function syncHours(){close.setCustomValidity('');schedule[mode.value==='weekly'?dayIndex:0]={state:state.value,open:open.value,close:close.value};
  if(mode.value!=='custom')try{hoursInput.value=formatHours(mode.value,schedule);previewText.textContent=hoursInput.value;hint.textContent=state.value==='open'&&close.value<open.value?'Waktu tutup adalah pada hari berikutnya.':'Waktu Malaysia · format 24 jam.';}catch(error){close.setCustomValidity(error.message);}permissions();onChange();
 }
 addressMode.onchange=()=>{if(addressMode.value==='structured'&&!addressParts.line1.value)addressParts.line1.value=addressInput.value;syncAddress();};for(const input of Object.values(addressParts))input.addEventListener('input',syncAddress);
 mode.onchange=()=>{if(mode.value==='weekly'&&lastMode!=='weekly'){const value={...schedule[0]};schedule=days.map((_,i)=>(lastMode==='weekdays'&&i>4||lastMode==='weekends'&&i<5)?{state:'closed',open:'09:00',close:'18:00'}:{...value});}lastMode=mode.value;dayIndex=0;day.value='0';close.setCustomValidity('');showDay();syncHours();};
 day.onchange=()=>{if(!close.checkValidity()){day.value=String(dayIndex);close.reportValidity();return;}dayIndex=Number(day.value);showDay();};for(const input of [state,open,close])input.onchange=syncHours;
 return {nodes:{address:[addressWrap],hours:[hoursWrap]},lock(value){locked=value;permissions();},set(profile){
  const address=readAddress(profile.address||'');addressMode.value=address?'structured':'custom';for(const [key,input] of Object.entries(addressParts)){input.value=address?.[key]||'';input.setCustomValidity('');}
  const parsed=readHours(profile.hours||'');mode.value=parsed?.mode||'custom';lastMode=mode.value;schedule=parsed?.schedule||defaultSchedule();dayIndex=0;day.value='0';close.setCustomValidity('');previewText.textContent=profile.hours||'';hint.textContent='Waktu Malaysia · format 24 jam. Pilih jadual dahulu untuk menggunakan dropdown waktu.';showDay();
 }};
}
