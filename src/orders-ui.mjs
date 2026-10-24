const states=['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'];
const fulfillmentLabels={unpaid:'Menunggu bayaran',awaiting_address:'Bayaran diterima · perlukan alamat',received:'Alamat diterima',preparing:'Sedang disediakan',shipped:'Dihantar',completed:'Selesai'};
const paymentLabels={creating:'Bil sedang disediakan',pending:'Menunggu bayaran',failed:'Bayaran belum berjaya',creation_failed:'Bil belum dapat disediakan',cancelled:'Dibatalkan',paid:'Bayaran disahkan',review:'Bayaran memerlukan semakan admin'};
const money=value=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(value/100);
const date=value=>value?new Date(value).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'medium',timeStyle:'short'}):'—';
const addressFields={name:['Nama penerima',100],phone:['Telefon penerima',30],notes:['Nota penghantaran (pilihan)',300],line1:['Alamat baris 1',160],line2:['Alamat baris 2 (pilihan)',160],postcode:['Poskod',5],city:['Bandar',80],state:['Negeri',40]};
export function createOrdersUI({customer,api}){
 const panel=document.createElement('section');panel.id='orders-panel';panel.className='orders-panel';
 panel.innerHTML='<h2>Pesanan saya</h2><p class="help">Semak pembelian, alamat dan penghantaran untuk perniagaan ini. Status penghantaran dikemas kini oleh super admin.</p><label for="orders-picker">Pilih pesanan</label><div class="orders-selector"><select id="orders-picker"></select><button type="button" id="orders-refresh" class="secondary" aria-label="Muat semula pesanan"><span aria-hidden="true">↻</span><span class="orders-refresh-label">Muat semula pesanan</span></button><button type="button" id="orders-more" class="secondary" hidden>Pesanan terdahulu</button></div><p id="orders-status" role="status" aria-live="polite"></p><div id="order-body" hidden><nav class="customer-subnav orders-tabs" aria-label="Bahagian pesanan"></nav><section id="order-details"></section><form id="order-address-form" novalidate><div id="order-recipient"></div><div id="order-address"></div><p class="help">Penghantaran Malaysia sahaja. Alamat disimpan untuk pesanan ini dan hanya boleh dilihat oleh pemilik yang berhak serta super admin.</p><button type="submit" id="order-address-save">Simpan maklumat penghantaran</button><p id="order-address-lock" class="help" hidden>Pesanan sudah dihantar. Hubungi super admin untuk pembetulan alamat.</p></form><section id="order-tracking"><p id="order-tracking-state" class="notice"></p><div id="order-tracking-info"></div><ol id="order-timeline"></ol><form id="order-fulfillment-form"><label for="order-fulfillment-state">Status penyediaan / penghantaran</label><select id="order-fulfillment-state"></select><label for="order-courier">Nama kurier</label><input id="order-courier" maxlength="80" placeholder="Contoh: Pos Laju / J&T Express"><label for="order-tracking-number">Nombor tracking</label><input id="order-tracking-number" maxlength="100"><label for="order-tracking-url">Pautan tracking kurier (pilihan)</label><input id="order-tracking-url" type="url" maxlength="500" placeholder="https://"><button type="submit" id="order-fulfillment-save">Simpan status penghantaran</button></form></section><a id="order-contact" class="button secondary" target="_blank" rel="noopener noreferrer" hidden>WhatsApp tentang pesanan ↗</a><p class="help" id="order-contact-help" hidden>Draf mesej mengandungi nama perniagaan dan ID pesanan. Semak dan hantar sendiri melalui WhatsApp.</p></div>';
 if(!customer)panel.querySelector('h2').textContent='Pesanan pelanggan';
 const $=id=>panel.querySelector('#'+id),el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const inputs={};for(const [key,[caption,max]] of Object.entries(addressFields)){
  const unit=el('div');unit.className='order-field';unit.dataset.field=key;const label=el('label',caption);label.htmlFor='order-address-'+key;
  const input=el(key==='state'?'select':'input');input.id=label.htmlFor;input.name=key;inputs[key]=input;
  if(key==='state'){const option=el('option','Pilih negeri');option.value='';input.append(option);for(const state of states){const option=el('option',state);option.value=state;input.append(option);}}
  else {input.maxLength=max;input.type=key==='phone'?'tel':'text';if(key==='postcode'){input.inputMode='numeric';input.pattern='[0-9]{5}';}}
  input.required=!['line2','notes'].includes(key);input.autocomplete='off';unit.append(label,input);$(['name','phone','notes'].includes(key)?'order-recipient':'order-address').append(unit);
 }
 let page=null,order=null,items=[],cursor=null,tab='details',sequence=0,signature='',working=false;
 const tabs={details:'Butiran pesanan',recipient:'Penerima',address:'Alamat',tracking:'Tracking'};
 for(const [key,label] of Object.entries(tabs)){const button=el('button',label);button.type='button';button.dataset.tab=key;button.onclick=()=>{tab=key;renderTabs();};panel.querySelector('.orders-tabs').append(button);}
 function renderTabs(){
  panel.dataset.tab=tab;
  const physical=order?.paymentStatus==='paid'&&order.includesPhysical;
  if(!physical)tab='details';for(const b of panel.querySelector('.orders-tabs').children){b.hidden=b.dataset.tab!=='details'&&!physical;b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');}
  const contactVisible=order?.paymentStatus==='paid'&&['details','tracking'].includes(tab);$('order-contact').hidden=!contactVisible;$('order-contact-help').hidden=!contactVisible;
  $('order-details').hidden=tab!=='details';$('order-address-form').hidden=!['recipient','address'].includes(tab);$('order-recipient').hidden=tab!=='recipient';$('order-address').hidden=tab!=='address';$('order-tracking').hidden=tab!=='tracking';
 }
 function controls(){
  $('orders-picker').disabled=working||!items.length;$('orders-refresh').disabled=working;$('orders-more').disabled=working;
  const locked=['shipped','completed'].includes(order?.fulfillmentState);
  for(const input of Object.values(inputs))input.disabled=working||locked;
  $('order-address-save').disabled=working;$('order-address-save').hidden=locked;$('order-address-lock').hidden=!locked;
  for(const node of $('order-fulfillment-form').querySelectorAll('input,select,button'))node.disabled=working||!order?.shipping;
 }
 function render(){
  if(!order){$('order-body').hidden=true;for(const input of Object.values(inputs))input.value='';for(const id of ['order-details','order-tracking-info','order-timeline'])$(id).replaceChildren();for(const id of ['order-courier','order-tracking-number','order-tracking-url'])$(id).value='';$('order-contact').removeAttribute('href');return;}$('order-body').hidden=false;
  const details=$('order-details');details.replaceChildren();const badge=el('p',paymentLabels[order.paymentStatus]||order.paymentStatus);badge.className='notice';badge.dataset.payment=order.paymentStatus;details.append(badge);
  for(const [label,value] of [['ID pesanan',order.id],['Tarikh pesanan',date(order.createdAt)],['Rujukan bayaran',order.invoice||'—']]){const line=el('p');line.append(el('strong',label+': '),el('span',value));details.append(line);}
  const list=el('ul');list.className='order-items';for(const item of order.items)list.append(el('li',item.name+' × '+item.quantity+' · '+money(item.totalCents)));details.append(list,el('p',(order.paymentStatus==='paid'?'Jumlah dibayar: ':'Jumlah bil: ')+money(order.amountCents)));
  if(order.mode!=='live')details.append(el('p','DEMO / SANDBOX — bukan bayaran sebenar.'));
  if(order.includesPhysical)details.append(el('p',order.shippingCents?'Caj penghantaran dalam pesanan: '+money(order.shippingCents):'Caj penghantaran diurus secara berasingan dengan super admin.'));
  else if(order.paymentStatus==='paid')details.append(el('p','Pesanan digital sahaja. Alamat penghantaran tidak diperlukan.'));
  for(const [key,input] of Object.entries(inputs))input.value=order.shipping?.[key]||'';
  $('order-tracking-state').dataset.state=order.fulfillmentState;
  $('order-tracking-state').textContent=fulfillmentLabels[order.fulfillmentState]||order.fulfillmentState;
  const info=$('order-tracking-info');info.replaceChildren();if(order.fulfillment?.courier)info.append(el('p',order.fulfillment.courier+' · '+order.fulfillment.trackingNumber));
  if(order.fulfillment?.trackingURL){const a=el('a','Semak tracking kurier ↗');a.href=order.fulfillment.trackingURL;a.target='_blank';a.rel='noopener noreferrer';a.className='button secondary';info.append(a);}
  if(order.fulfillmentState==='awaiting_address')info.append(el('p','Simpan nama penerima dan alamat untuk meneruskan penyediaan pesanan.'));
  $('order-timeline').replaceChildren();for(const entry of order.fulfillment?.timeline||[])$('order-timeline').append(el('li',(fulfillmentLabels[entry.state]||entry.state)+' · '+date(entry.at)));
  const options={received:['preparing'],preparing:['preparing','shipped'],shipped:['shipped','completed'],completed:['completed']};const choose=$('order-fulfillment-state');choose.replaceChildren();for(const state of options[order.fulfillmentState]||[]){const option=el('option',fulfillmentLabels[state]);option.value=state;choose.append(option);}
  $('order-fulfillment-form').hidden=customer||!order.shipping;for(const [id,key] of [['order-courier','courier'],['order-tracking-number','trackingNumber'],['order-tracking-url','trackingURL']])$(id).value=order.fulfillment?.[key]||'';
  const paid=order.paymentStatus==='paid';$('order-contact').hidden=!paid;$('order-contact-help').hidden=!paid;
  if(paid){const link=new URL('https://wa.me/60103250032');link.searchParams.set('text','Salam SmartTap, saya ingin bertanya tentang pesanan.\nPerniagaan: '+page.profile.name+'\nID pesanan: '+order.id);$('order-contact').href=link.href;}else $('order-contact').removeAttribute('href');
  renderTabs();controls();
 }
 const path=()=>'/links/'+page.id+'/orders';
 async function select(id){const current=++sequence;working=true;controls();$('orders-status').textContent='Memuatkan pesanan…';
  try{const result=await api(path()+'/'+id);if(current!==sequence)return;order=result;tab='details';$('orders-status').textContent='';render();}catch(e){if(current===sequence){$('orders-status').textContent=e.message;order=null;render();}}finally{if(current===sequence){working=false;controls();}}
 }
 async function load(more=false){if(!page)return;const current=++sequence;working=true;controls();$('orders-status').textContent='Memuatkan pesanan…';
  try{const result=await api(path()+(more&&cursor?'?cursor='+encodeURIComponent(cursor):''));if(current!==sequence)return;
   items=more?[...items,...result.items.filter(item=>!items.some(old=>old.id===item.id))]:result.items;cursor=result.cursor;$('orders-more').hidden=!cursor;
   const previous=order?.id;$('orders-picker').replaceChildren();for(const item of items){const option=el('option',date(item.createdAt)+' · '+money(item.amountCents)+' · '+(item.paymentStatus==='paid'?fulfillmentLabels[item.fulfillmentState]:paymentLabels[item.paymentStatus])+' · '+item.id.slice(-8));option.value=item.id;$('orders-picker').append(option);}
   if(!items.length){order=null;render();$('orders-status').textContent='Belum ada pesanan ToyyibPay untuk perniagaan ini.';return;}
   const id=items.some(item=>item.id===previous)?previous:items[0].id;$('orders-picker').value=id;working=false;await select(id);
  }catch(e){if(current===sequence)$('orders-status').textContent=e.message;}finally{if(current===sequence){working=false;controls();}}
 }
 $('orders-picker').onchange=()=>select($('orders-picker').value);$('orders-refresh').onclick=()=>load();$('orders-more').onclick=()=>load(true);
 async function save(action,data){if(!order||working)return;const current=sequence;working=true;controls();$('orders-status').textContent='Menyimpan pesanan…';
  try{const result=await api(path()+'/'+order.id+'/'+action,{method:'PUT',body:{revision:order.revision,...data}});if(current!==sequence)return;order=result;render();$('orders-status').textContent='Maklumat pesanan berjaya disimpan.';}
  catch(e){if(current===sequence)$('orders-status').textContent=e.message;}finally{if(current===sequence){working=false;controls();}}
 }
 $('order-address-form').onsubmit=event=>{event.preventDefault();if(working)return;const invalid=Object.values(inputs).find(input=>!input.disabled&&!input.checkValidity());if(invalid){tab=['name','phone','notes'].includes(invalid.name)?'recipient':'address';renderTabs();invalid.focus();invalid.reportValidity();return;}save('address',{address:Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value.trim()]))});};
 $('order-fulfillment-form').onsubmit=event=>{event.preventDefault();save('fulfillment',{state:$('order-fulfillment-state').value,courier:$('order-courier').value.trim(),trackingNumber:$('order-tracking-number').value.trim(),trackingURL:$('order-tracking-url').value.trim()});};
 return {panel,show(item){const next=item.id+'|'+(item.checkout?.id||'')+'|'+(item.checkout?.status||'');const changed=page?.id!==item.id;page=item;if(next===signature)return;signature=next;if(changed){order=null;items=[];render();$('orders-picker').replaceChildren();}load();},clear(){sequence++;page=null;order=null;items=[];cursor=null;signature='';working=false;render();$('orders-picker').replaceChildren();$('orders-status').textContent='';}};
}
