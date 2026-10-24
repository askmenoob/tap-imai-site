import {paymentPrompt} from './payment-prompt.mjs';
const money=cents=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(cents/100);
const date=value=>value?new Date(value).toLocaleDateString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'long',year:'numeric'}):'Belum bermula';
export const stateLabels={active:'Aktif',disabled:'Dinyahaktifkan',deleted:'Dipadam',pending:'Menunggu pengaktifan',expired:'Langganan tamat',nfc_only:'NFC sahaja · sekali bayar'};
export function createManagementUI({customer,api,onUpdate,onBusy}){
  const panel=document.createElement('section');panel.className='management-panel';
  panel.innerHTML=`<section id="admin-message-box" class="admin-message-box" hidden aria-labelledby="admin-message-title"><h3 id="admin-message-title">Mesej daripada super admin</h3><p id="admin-message-text" data-no-i18n></p><p id="admin-message-time" class="help" data-no-i18n></p><p id="admin-message-state" role="status" aria-live="polite"></p><div id="admin-message-reply" hidden><strong>Balasan pelanggan</strong><p id="admin-message-reply-text" data-no-i18n></p></div><form id="message-reply-form" hidden><label for="message-reply-text">Nombor transaksi / balasan anda</label><textarea id="message-reply-text" required maxlength="500" rows="3"></textarea><button type="submit">Hantar balasan kepada super admin</button></form><button id="message-resolve" type="button" class="secondary" hidden>Tandakan selesai</button><a id="message-whatsapp" class="button secondary" href="https://wa.me/60103250032" target="_blank" rel="noopener noreferrer" hidden>Hubungi super admin di WhatsApp ↗</a></section>
  <form id="admin-message-form" class="admin-message-compose" ${customer?'hidden':''}><h3>Hantar mesej kepada pelanggan</h3><label for="admin-message-input">Mesej / tindakan yang diperlukan</label><textarea id="admin-message-input" required maxlength="1000" rows="3" placeholder="Contoh: Sila berikan nombor transaksi bank untuk semakan bayaran."></textarea><p class="help">Mesej muncul pada halaman edit pelanggan. Mesej baharu menggantikan mesej semasa; rekod sebelumnya disimpan.</p><button type="submit">Hantar mesej</button></form><h3>Status halaman & pakej</h3><p id="page-state" class="notice"></p><p id="subscription-summary"></p><p id="direct-review-wrap" hidden>Pautan untuk Google Review NFC: <a id="direct-review" target="_blank" rel="noopener noreferrer">Buka Google Review ↗</a></p><a href="/subscribe/" target="_blank" rel="noopener noreferrer">Lihat semua pakej ↗</a>
  <div id="lifecycle-actions" class="actions" ${customer?'hidden':''}><button type="button" id="state-toggle" class="secondary">Nyahaktif</button><button type="button" id="delete-open" class="danger">Padam halaman</button><button type="button" id="state-restore" class="secondary" hidden>Pulihkan sebagai nyahaktif</button></div>
  <form id="delete-form" class="notice" hidden><p>Halaman akan disembunyikan dan akses pelanggan ditarik balik. Super admin boleh memulihkannya. Salinan rekod dikekalkan.</p><label for="delete-name">Taip nama perniagaan untuk sahkan</label><input id="delete-name" required autocomplete="off"><button class="danger">Sahkan padam</button><button id="delete-cancel" type="button" class="secondary">Batal</button></form>
  <p id="management-status" role="status" aria-live="polite"></p>
  <div id="billing-section"><h3>Langganan & bayaran DuitNow</h3><p id="billing-availability"></p><p id="payment-summary"></p>
  <div id="order-support" class="notice" hidden><h4>Pertanyaan pesanan</h4><p>Hubungi super admin tentang pesanan yang telah disahkan, termasuk penyediaan NFC dan penghantaran.</p><a id="order-whatsapp" class="button" target="_blank" rel="noopener noreferrer">WhatsApp super admin tentang pesanan ↗</a><p class="help">Draf mesej disediakan dengan nama perniagaan dan ID pesanan. Semak dan hantar sendiri dalam WhatsApp.</p></div>
  <p id="renewal-reminder" class="renewal-reminder" hidden></p><div id="payment-disclosure" class="actions" hidden><button id="payment-toggle" type="button" class="secondary" aria-controls="payment-form" aria-expanded="false">Renew / beli add-on</button><span class="help">QR bayaran dipaparkan apabila diperlukan.</span></div>
  <form id="payment-form" hidden><label for="payment-package">Pakej</label><select id="payment-package"></select><div class="quantity-grid"><div><label for="payment-nfc">NFC tambahan · RM30/unit</label><input id="payment-nfc" type="number" min="0" max="10" step="1" value="0"></div><div><label for="payment-stickers">NFC table sticker · kuantiti</label><input id="payment-stickers" type="number" min="0" max="200" step="1" value="0"></div></div><p class="help">Sticker: RM20/unit untuk 1–19 unit; RM15/unit untuk 20 unit atau lebih.</p><div id="payment-quote" role="status"></div><p class="help">Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.</p>
  <div id="payment-instructions" hidden><p>Bayar jumlah di atas menggunakan QR DuitNow ini. Semak nama penerima sebelum mengesahkan bayaran dalam aplikasi bank.</p><img id="payment-qr" width="1118" height="1762" alt="Gambar penuh QR DuitNow asal — NIK AZFAR BIN NIK ZAINAL, MAE Maybank"><strong id="payment-payee"></strong><div class="actions"><a id="payment-open" class="button secondary" target="_blank" rel="noopener noreferrer">Lihat QR penuh ↗</a><a id="payment-download" class="button secondary" download="smarttap-duitnow-asal.jpeg">Muat turun gambar QR asal</a></div></div>
  <p class="notice">Selepas membayar, hantar rujukan transaksi. Langganan dilanjutkan selepas super admin mengesahkan wang diterima. Jangan bayar semasa menggunakan demo tempatan.</p><label for="payment-reference">Rujukan transaksi bank</label><input id="payment-reference" required minlength="3" maxlength="80" autocomplete="off"><label for="payment-date">Tarikh bayaran</label><input id="payment-date" type="date" required><button id="payment-submit">Hantar untuk semakan bayaran</button></form>
  <form id="payment-review" hidden><h4>Semakan super admin</h4><p id="review-details"></p><label class="check-label"><input id="bank-confirm" type="checkbox"> Saya telah menyemak akaun bank dan wang benar-benar diterima untuk transaksi ini.</label><label for="review-note">Nota kepada pelanggan (pilihan)</label><input id="review-note" maxlength="200"><div class="actions"><button id="payment-approve">Sahkan bayaran</button><button type="button" id="payment-reject" class="secondary">Tolak permohonan</button></div></form></div>`;
  document.getElementById('edit-form').before(panel);
  const $=id=>panel.querySelector('#'+id);let current=null,config=null,quote=null,sequence=0,messageSequence=0,working=false,paymentOpen=!customer,paymentAvailable=false;
  function paymentVisibility(open){
    paymentOpen=open;sequence++;quote=null;$('payment-form').hidden=!paymentAvailable||(customer&&!open);$('payment-instructions').hidden=true;
    $('payment-toggle').setAttribute('aria-expanded',String(customer&&open));$('payment-toggle').textContent=open?'Tutup borang bayaran':paymentPrompt(current||{}).label;
    $('payment-qr').removeAttribute('src');$('payment-download').removeAttribute('href');$('payment-open').removeAttribute('href');$('payment-submit').disabled=true;
  }
  const today=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const options=()=>({package:$('payment-package').value,extraNfcQty:Number($('payment-nfc').value),stickerQty:Number($('payment-stickers').value)});
  function clear(){messageSequence++;current=null;$('admin-message-box').hidden=true;$('admin-message-text').textContent='';$('admin-message-reply-text').textContent='';$('message-reply-text').value='';$('admin-message-input').value='';paymentAvailable=false;paymentVisibility(!customer);$('payment-disclosure').hidden=true;$('renewal-reminder').hidden=true;$('payment-reference').value='';$('review-note').value='';$('delete-form').hidden=true;$('order-support').hidden=true;$('order-whatsapp').removeAttribute('href');}
  function showMessage(item){
    const message=item.adminMessage,note=!message?item.renewal?.note:'';
    const visible=!!(message&&(!customer||message.status!=='resolved')||note);
    $('admin-message-box').hidden=!visible;
    $('admin-message-form').hidden=customer||item.manualState==='deleted'||!item.ownerEmail;
    $('admin-message-text').textContent=message?.text||note||'';
    $('admin-message-time').textContent=message?.sentAt?new Date(message.sentAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}):'';
    $('admin-message-state').textContent=message?.status==='replied'?'Balasan telah dihantar. Menunggu tindakan super admin.':message?.status==='resolved'?'Mesej telah diselesaikan.':message?(customer?'Tindakan anda diperlukan.':'Menunggu tindakan pelanggan.'):'Nota semakan bayaran daripada super admin.';
    $('admin-message-box').dataset.status=message?.status||'open';
    $('admin-message-reply').hidden=!message?.reply;$('admin-message-reply-text').textContent=message?.reply?.text||'';
    $('message-reply-form').hidden=!customer||message?.status!=='open';
    $('message-resolve').hidden=customer||!message||message.status==='resolved';
    $('message-whatsapp').hidden=!customer||!!message;
  }
  function orderSupport(item){
    const approved=item.renewal?.status==='approved'?item.renewal:null,orderId=approved?.id||item.subscription?.lastPaymentId;
    const visible=customer&&typeof orderId==='string'&&!!orderId&&item.manualState!=='deleted';
    $('order-support').hidden=!visible;$('order-whatsapp').removeAttribute('href');if(!visible)return;
    const lines=['Salam super admin SmartTap, saya ingin bertanya tentang pesanan yang telah disahkan.','Perniagaan: '+item.profile.name,'ID pesanan: '+orderId];
    if(approved?.items?.length)lines.push('Pesanan: '+approved.items.map(line=>line.name+' × '+line.quantity).join(', '));
    lines.push('Pautan halaman: '+item.url);
    const link=new URL('https://wa.me/60103250032');link.searchParams.set('text',lines.join('\n'));$('order-whatsapp').href=link.href;
  }
  async function cart(){
    quote=null;$('payment-submit').disabled=true;$('payment-instructions').hidden=true;const item=current,version=++sequence;if(!item||!config?.enabled||!paymentAvailable||(customer&&!paymentOpen))return;
    $('payment-quote').textContent='Mengira jumlah…';
    try{const result=await api('/links/'+item.id+'/quote',{method:'POST',body:options()});if(version!==sequence||current?.id!==item.id)return;quote=result;
      $('payment-quote').replaceChildren();for(const line of result.items){const row=document.createElement('p');row.textContent=line.name+' × '+line.quantity+' · '+money(line.totalCents);$('payment-quote').append(row);}const total=document.createElement('strong');total.textContent='Jumlah produk: '+money(result.amountCents);$('payment-quote').append(total);
      const image='/assets/duitnow-original.jpeg';$('payment-qr').src=image;$('payment-download').href=image;$('payment-open').href=image;$('payment-payee').textContent=config.payee;$('payment-instructions').hidden=false;$('payment-submit').disabled=false;
    }catch(error){if(version===sequence)$('payment-quote').textContent=error.message;}
  }
  async function show(item){
    const changed=current?.id!==item.id,messageChanged=current?.adminMessage?.id!==item.adminMessage?.id,oldStatus=current?.renewal?.status;current=item;if(changed||messageChanged){$('message-reply-text').value='';$('management-status').textContent='';}showMessage(item);if(changed){messageSequence++;$('message-reply-text').value='';$('admin-message-input').value='';paymentAvailable=false;paymentVisibility(!customer);$('payment-disclosure').hidden=true;$('renewal-reminder').hidden=true;}orderSupport(item);$('page-state').textContent=stateLabels[item.state]||item.state;
    for(const id of ['page-state','subscription-summary'])$(id).dataset.state=item.state;
    $('subscription-summary').textContent=item.subscription?.plan==='annual'?'Halaman tahunan · tamat '+date(item.subscription.expiresAt):item.subscription?.plan==='nfc_only'?'NFC terus ke Google Review. Tiada langganan halaman QR.':'Rekod sedia ada. Pelan tahunan belum direkodkan; status asal dikekalkan.';
    $('direct-review-wrap').hidden=item.subscription?.plan!=='nfc_only';$('direct-review').href=item.profile.google;
    $('state-toggle').textContent=item.manualState==='disabled'?'Aktifkan halaman':'Nyahaktifkan halaman';$('state-toggle').hidden=item.manualState==='deleted';$('delete-open').hidden=item.manualState==='deleted';$('state-restore').hidden=item.manualState!=='deleted';$('delete-form').hidden=true;
    if(changed){$('management-status').textContent='';$('payment-reference').value='';$('payment-date').value=today();$('payment-nfc').value='0';$('payment-stickers').value='0';}
    try{config=await api('/plan');if(current?.id!==item.id)return;}catch(error){$('billing-availability').textContent=error.message;return;}
    $('billing-availability').textContent=config.enabled?'Pakej halaman ditawarkan setahun sahaja. Bayaran disemak secara manual.':'Permohonan bayaran belum dibuka. Hubungi super admin untuk maklumat lanjut.';
    const pending=item.renewal?.status==='pending';paymentAvailable=config.enabled&&!pending&&item.manualState!=='deleted';
    if(!paymentAvailable||(oldStatus!==item.renewal?.status&&item.renewal?.status==='approved'))paymentVisibility(!customer);
    $('payment-form').hidden=!paymentAvailable||(customer&&!paymentOpen);$('payment-review').hidden=customer||!pending||!config.enabled||item.manualState==='deleted';
    const prompt=paymentPrompt(item);$('renewal-reminder').textContent=prompt.message;$('renewal-reminder').hidden=!customer||!paymentAvailable||!prompt.message;
    $('payment-disclosure').hidden=!customer||!paymentAvailable;$('payment-toggle').textContent=paymentOpen?'Tutup borang bayaran':prompt.label;$('payment-toggle').setAttribute('aria-expanded',String(customer&&paymentOpen));
    const payment=item.renewal;$('payment-summary').textContent=payment?({pending:'Menunggu semakan bayaran',approved:'Bayaran disahkan',rejected:'Permohonan ditolak'}[payment.status]||payment.status)+' · '+money(payment.amountCents)+' · '+payment.reference+(payment.note?' · '+payment.note:''):'';
    $('review-details').textContent=payment?'Rujukan: '+payment.reference+' · '+payment.paidDate+' · '+money(payment.amountCents)+' · '+payment.items.map(x=>x.name+' × '+x.quantity).join(', '):'';
    $('bank-confirm').checked=false;$('review-note').value='';
    const selected=$('payment-package').value,annual=!!item.subscription?.lastPaymentId&&item.subscription.plan==='annual';$('payment-package').replaceChildren();
    for(const product of config.packages){if(product.id==='addons'&&!item.subscription?.lastPaymentId||product.id!=='addons'&&(annual&&product.id!=='renew'||!annual&&product.id==='renew'))continue;const option=document.createElement('option');option.value=product.id;option.textContent=product.name+(product.id==='addons'?'': ' · '+money(product.amountCents)+(product.months?' / '+product.months+' bulan':' · sekali bayar'));$('payment-package').append(option);}
    if(!changed&&selected&&[...$('payment-package').options].some(x=>x.value===selected))$('payment-package').value=selected;
    if(changed){const params=new URLSearchParams(location.search);const kind=params.get('package');if(kind&&[...$('payment-package').options].some(x=>x.value===kind)){$('payment-package').value=kind;if(customer&&paymentAvailable)paymentVisibility(true);}for(const [id,key,max] of [['payment-nfc','extraNfcQty',10],['payment-stickers','stickerQty',200]]){const n=Number(params.get(key)||0);if(Number.isInteger(n)&&n>=0&&n<=max)$(id).value=String(n);}}
    if(oldStatus==='pending'&&payment?.status==='approved'){$('payment-reference').value='';$('payment-nfc').value='0';$('payment-stickers').value='0';}if(!$('payment-form').hidden)await cart();
  }
  async function action(path,body,message){
    if(working||!current)return;working=true;onBusy(true);const id=current.id,version=messageSequence;$('management-status').textContent='Menyimpan…';for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=true;
    try{const updated=await api('/links/'+id+path,{method:'POST',body});if(current?.id!==id||version!==messageSequence)return;onUpdate(updated);await show(updated);if(path==='/message'&&body.action==='send')$('admin-message-input').value='';if(path==='/message-reply')$('message-reply-text').value='';$('management-status').textContent=message;}
    catch(error){$('management-status').textContent=error.message;}
    finally{working=false;onBusy(false);for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=false;if(!quote)$('payment-submit').disabled=true;}
  }
  $('state-toggle').onclick=()=>action('/state',{state:current.manualState==='disabled'?'active':'disabled',revision:current.revision},'Status halaman dikemas kini. URL dan QR kekal sama.');
  $('state-restore').onclick=()=>action('/state',{state:'disabled',revision:current.revision},'Halaman dipulihkan sebagai nyahaktif. Semak langganan sebelum mengaktifkan.');
  $('delete-open').onclick=()=>{$('delete-form').hidden=false;$('delete-name').value='';$('delete-name').focus();};$('delete-cancel').onclick=()=>{$('delete-form').hidden=true;};
  $('delete-form').onsubmit=event=>{event.preventDefault();action('/state',{state:'deleted',confirmName:$('delete-name').value,revision:current.revision},'Halaman dipadam daripada paparan awam dan senarai pelanggan. Rekod boleh dipulihkan oleh super admin.');};
  for(const id of ['payment-package','payment-nfc','payment-stickers'])$(id).addEventListener('change',cart);
  $('payment-toggle').onclick=()=>{if(working||!paymentAvailable)return;paymentVisibility(!paymentOpen);if(paymentOpen)cart();};
  $('payment-form').onsubmit=event=>{event.preventDefault();if(!quote)return;action('/renewal',{...options(),reference:$('payment-reference').value.trim(),paidDate:$('payment-date').value,amountCents:quote.amountCents,revision:current.revision},'Rujukan dihantar. Tunggu semakan bank oleh super admin.');};
  const decide=decision=>action('/decision',{requestId:current.renewal.id,decision,revision:current.revision,confirmBank:$('bank-confirm').checked,note:$('review-note').value},decision==='approve'?'Bayaran disahkan. Tempoh halaman dikemas kini jika pakej mengandungi langganan tahunan.':'Permohonan bayaran ditolak. Pelanggan boleh menghantar rujukan yang betul.');
  $('payment-review').onsubmit=event=>{event.preventDefault();decide('approve');};$('payment-reject').onclick=()=>decide('reject');
  $('admin-message-form').onsubmit=event=>{event.preventDefault();action('/message',{action:'send',text:$('admin-message-input').value,revision:current.revision},'Mesej telah dihantar kepada pelanggan.');};
  $('message-reply-form').onsubmit=event=>{event.preventDefault();action('/message-reply',{messageId:current.adminMessage.id,text:$('message-reply-text').value,revision:current.revision},'Balasan telah dihantar kepada super admin.');};
  $('message-resolve').onclick=()=>action('/message',{action:'resolve',messageId:current.adminMessage.id,revision:current.revision},'Mesej telah diselesaikan.');
  return {show,clear};
}
