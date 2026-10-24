import {annualEnd} from '../import-service/page-state.mjs';

export function createAdminSubscriptionUI({customer,onSubmit}){
 const panel=document.createElement('section');panel.id='subscription-management';panel.className='subscription-admin';panel.dataset.noI18n='';panel.hidden=true;
 let item=null,working=false,language='ms';try{language=localStorage.getItem('smarttap.language')||'ms';}catch{}
 const L=(ms,en)=>language==='en'?en:ms,copies=[];
 const node=(tag,ms,en)=>{const el=document.createElement(tag);if(ms){copies.push({el,ms,en});el.textContent=L(ms,en);}return el;};
 const source=node('p','Langganan ditetapkan oleh super admin.','Subscription set by the super admin.');source.className='notice';panel.append(source);
 const details=node('details'),summary=node('summary','Tetapkan langganan tanpa ToyyibPay','Set subscription without ToyyibPay');details.append(summary);panel.append(details);
 const form=node('form');form.id='admin-subscription-form';details.append(form);
 form.append(node('p','Aktifkan halaman tahunan secara terus. Ini tidak mencipta bil, resit bayaran atau pesanan NFC.','Activate an annual page directly. This does not create a bill, payment receipt or NFC order.'));
 function field(id,ms,en,input){input.id=id;const label=node('label',ms,en);label.htmlFor=id;form.append(label,input);return input;}
 const mode=field('subscription-action','Tindakan langganan','Subscription action',node('select'));
 for(const [value,ms,en] of [['extend','Aktifkan / lanjutkan 12 bulan','Activate / extend 12 months'],['set-date','Tetapkan tarikh tamat','Set expiry date']]){const o=node('option',ms,en);o.value=value;mode.append(o);}
 const date=field('subscription-expiry','Tarikh tamat (waktu Malaysia)','Expiry date (Malaysia time)',node('input'));date.type='date';
 const dateLabel=form.querySelector('label[for="subscription-expiry"]');
 const preview=node('p');preview.id='subscription-preview';preview.setAttribute('role','status');form.append(preview);
 const note=field('subscription-note','Sebab pelarasan (catatan dalaman)','Reason for adjustment (internal note)',node('input'));note.required=true;note.maxLength=200;note.autocomplete='off';
 const blocked=node('p');blocked.className='notice';blocked.id='subscription-blocked';form.append(blocked);
 const save=node('button','Simpan langganan','Save subscription');save.type='submit';save.id='subscription-save';form.append(save);
 const history=node('p');history.className='help';history.id='subscription-audit';details.append(history);
 function unavailable(){return item?.renewal?.status==='pending'||item?.checkout&&!['paid','cancelled','creation_failed'].includes(item.checkout.status);}
 function refresh(){
  const custom=mode.value==='set-date';date.hidden=dateLabel.hidden=!custom;date.required=custom;
  for(const input of form.querySelectorAll('input,select,button'))input.disabled=working||!!unavailable();date.disabled=working||!!unavailable()||!custom;
  const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);date.min=today;
  let end='';if(custom&&date.value)end=date.value+'T23:59:59.999+08:00';else if(!custom){const old=item?.subscription?.plan==='annual'?Date.parse(item.subscription.expiresAt||''):0;end=annualEnd(Math.max(Number.isFinite(old)?old:0,Date.now()));}
  preview.textContent=end?L('Tarikh tamat baharu: ','New expiry: ')+new Date(end).toLocaleDateString(language==='en'?'en-MY':'ms-MY',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'long',year:'numeric'})+(item?.manualState==='disabled'?L(' · Halaman kekal dinyahaktifkan.',' · Page remains disabled.'):''):'';
  blocked.hidden=!unavailable();blocked.textContent=L('Selesaikan atau batalkan bil/semakan bayaran yang masih terbuka dahulu.','Complete or cancel the open bill/payment review first.');
 }
 mode.onchange=refresh;date.oninput=refresh;
 form.onsubmit=event=>{event.preventDefault();if(working||unavailable()||!item)return;onSubmit({action:mode.value,note:note.value.trim(),...(mode.value==='set-date'?{expiresDate:date.value}:{})});};
 function renderHistory(){const audit=item?.subscriptionAdjustment;history.textContent=audit?L('Pelarasan terakhir: ','Last adjustment: ')+new Date(audit.changedAt).toLocaleString(language==='en'?'en-MY':'ms-MY',{timeZone:'Asia/Kuala_Lumpur'})+' · '+audit.changedBy+' · '+audit.note:'';}
 window.addEventListener('smarttap:language',event=>{language=event.detail.language==='en'?'en':'ms';for(const {el,ms,en} of copies)el.textContent=L(ms,en);renderHistory();refresh();});
 return {panel,set(value){const changed=item?.id!==value.id||item?.revision!==value.revision;item=value;panel.hidden=customer&&item.subscription?.source!=='admin';source.hidden=item.subscription?.source!=='admin';details.hidden=customer||item.manualState==='deleted';if(changed){details.open=false;mode.value='extend';date.value='';note.value='';}renderHistory();refresh();},busy(value){working=value;refresh();},clear(){item=null;details.open=false;note.value='';date.value='';history.textContent='';panel.hidden=true;}};
}
