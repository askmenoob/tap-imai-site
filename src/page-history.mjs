// Super-admin controls; the server separately authorizes every history request.
export function createPageHistoryUI({api,onUpdated=()=>{},canMutate=()=>true}){
  const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
  const panel=el('section');panel.className='card page-history';panel.hidden=true;
  const title=el('h3','Sejarah & pemulihan kandungan');
  const help=el('p','Pulihkan maklumat perniagaan, paparan dan katalog daripada versi terdahulu. URL dan QR kekal sama. Gmail pemilik, langganan, bayaran, pesanan dan status halaman tidak dipulihkan.');help.className='help';
  const toggle=el('button','Lihat sejarah');toggle.type='button';toggle.className='secondary';toggle.setAttribute('aria-expanded','false');
  const body=el('div');body.hidden=true;
  const actions=el('div');actions.className='actions';const refresh=el('button','Muat semula sejarah'),more=el('button','Versi lain');for(const button of [refresh,more]){button.type='button';button.className='secondary';}more.hidden=true;actions.append(refresh,more);
  const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const form=el('form');form.noValidate=true;
  const picker=el('select');picker.id='page-history-source';const pickerLabel=el('label','Versi untuk dipulihkan');pickerLabel.htmlFor=picker.id;
  const details=el('p');details.className='help';details.dataset.noI18n='';
  const warning=el('p','Pemulihan menggantikan kandungan semasa, termasuk suntingan yang belum disimpan. Semak versi dan nama perniagaan sebelum meneruskan.');warning.className='notice';
  const name=el('input');name.id='page-history-confirm-name';name.maxLength=80;name.autocomplete='off';name.required=true;const nameLabel=el('label','Taip nama perniagaan semasa untuk mengesahkan');nameLabel.htmlFor=name.id;
  const note=el('textarea');note.id='page-history-note';note.maxLength=200;note.rows=2;note.required=true;const noteLabel=el('label','Sebab pemulihan (maksimum 200 aksara)');noteLabel.htmlFor=note.id;
  const confirmation=el('input');confirmation.id='page-history-confirm';confirmation.type='checkbox';const confirmationLabel=el('label');confirmationLabel.htmlFor=confirmation.id;confirmationLabel.append(confirmation,document.createTextNode(' Saya telah menyemak versi dan mahu menggantikan kandungan semasa.'));
  const restore=el('button','Pulihkan versi dipilih');restore.type='submit';
  form.append(pickerLabel,picker,details,warning,nameLabel,name,noteLabel,note,confirmationLabel,restore);body.append(actions,status,form);panel.append(title,help,toggle,body);
  let page=null,items=[],cursor=null,working=false,locked=false,sequence=0;
  const allowed=()=>!!page&&!working&&!locked&&canMutate()&&page.manualState!=='deleted'&&page.state!=='deleted';
  const path=()=>'/api/admin/links/'+encodeURIComponent(page.id)+'/history';
  const date=value=>value?new Date(value).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}):'Tarikh tidak tersedia';
  function controls(){toggle.disabled=!page||working||locked;refresh.disabled=working||locked;more.disabled=working||locked;picker.disabled=working||locked||!items.length;for(const input of [name,note,confirmation])input.disabled=!allowed();restore.disabled=!allowed()||!items.find(item=>item.revision===picker.value)?.restorable;form.hidden=!items.length;}
  function selected(){
    const item=items.find(item=>item.revision===picker.value);details.textContent=item?'Versi '+item.revision+' · '+date(item.archivedAt||item.updatedAt)+(item.changedBy?' · '+item.changedBy:'')+(item.restorable?'':' · Versi ini tidak sah dan tidak boleh dipulihkan.'):'Pilih versi dahulu.';
    confirmation.checked=false;controls();
  }
  async function load(append=false){
    if(!page||working||locked)return;const current=sequence;working=true;controls();status.textContent='Memuatkan sejarah…';
    try{
      const result=await api(path()+(append&&cursor?'?cursor='+encodeURIComponent(cursor):''));if(current!==sequence)return;
      if(result.revision!==page.revision){status.textContent='Halaman telah berubah. Muat semula halaman sebelum memulihkan kandungan.';items=[];picker.replaceChildren();more.hidden=true;return;}
      items=append?[...items,...result.items.filter(item=>!items.some(old=>old.revision===item.revision))]:result.items;cursor=result.cursor;more.hidden=!cursor;
      const previous=picker.value;picker.replaceChildren();for(const item of items){const option=el('option',date(item.archivedAt||item.updatedAt)+' · '+item.name+' · #'+item.revision+(item.restorable?'':' · Tidak sah'));option.value=item.revision;option.disabled=!item.restorable;picker.append(option);}
      picker.value=items.some(item=>item.revision===previous&&item.restorable)?previous:(items.find(item=>item.restorable)?.revision||'');
      selected();status.textContent=items.length?'Sejarah dimuatkan. Pilih versi dan lengkapkan pengesahan untuk memulihkan kandungan.':'Belum ada versi terdahulu untuk halaman ini.';
    }catch(error){if(current===sequence)status.textContent=error.message||'Sejarah belum dapat dimuatkan.';}
    finally{if(current===sequence){working=false;controls();}}
  }
  toggle.onclick=()=>{body.hidden=!body.hidden;toggle.setAttribute('aria-expanded',String(!body.hidden));toggle.textContent=body.hidden?'Lihat sejarah':'Tutup sejarah';if(!body.hidden&&!items.length)load();};
  refresh.onclick=()=>load();more.onclick=()=>load(true);picker.onchange=selected;
  form.onsubmit=async event=>{
    event.preventDefault();if(!allowed())return;
    const chosen=items.find(item=>item.revision===picker.value);if(!chosen?.restorable){status.textContent='Pilih versi yang sah dahulu.';return;}
    if(name.value!==page.profile.name){status.textContent='Nama perniagaan mesti sama tepat dengan nama semasa.';name.focus();return;}
    const reason=note.value.trim();if(!reason||reason.length>200||/[\u0000-\u001f]/.test(reason)){status.textContent='Masukkan sebab pemulihan yang sah, maksimum 200 aksara.';note.focus();return;}
    if(!confirmation.checked){status.textContent='Tandakan pengesahan sebelum memulihkan kandungan.';confirmation.focus();return;}
    const current=sequence;working=true;controls();status.textContent='Memulihkan kandungan…';
    try{
      const result=await api(path()+'/restore',{method:'POST',body:{sourceRevision:chosen.revision,revision:page.revision,note:reason}});if(current!==sequence)return;
      page=result;items=[];cursor=null;picker.replaceChildren();name.value='';note.value='';confirmation.checked=false;more.hidden=true;status.textContent='Kandungan berjaya dipulihkan. URL, QR dan maklumat langganan kekal.';
      await onUpdated(result);
    }catch(error){if(current===sequence)status.textContent=error.status===409?'Halaman telah berubah atau belum boleh dipulihkan. Muat semula halaman dan semak sebelum mencuba lagi.':error.message||'Kandungan belum dapat dipulihkan.';}
    finally{if(current===sequence){working=false;controls();}}
  };
  return {panel,show(item){if(page?.id===item.id&&page.revision===item.revision){page=item;controls();return;}sequence++;page=item;items=[];cursor=null;working=false;panel.hidden=false;body.hidden=true;toggle.textContent='Lihat sejarah';toggle.setAttribute('aria-expanded','false');picker.replaceChildren();details.textContent='';name.value='';note.value='';confirmation.checked=false;status.textContent='';more.hidden=true;controls();},clear(){sequence++;page=null;items=[];cursor=null;working=false;panel.hidden=true;body.hidden=true;picker.replaceChildren();details.textContent='';name.value='';note.value='';confirmation.checked=false;status.textContent='';controls();},lock(value){locked=!!value;controls();}};
}
