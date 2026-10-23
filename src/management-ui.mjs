import QRCode from 'qrcode';
const money=cents=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(cents/100);
const date=value=>value?new Date(value).toLocaleDateString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'long',year:'numeric'}):'Belum bermula';
export const stateLabels={active:'Aktif',disabled:'Dinyahaktifkan',deleted:'Dipadam',pending:'Menunggu pengaktifan',expired:'Langganan tamat',nfc_only:'NFC sahaja · sekali bayar'};
export function createManagementUI({customer,api,onUpdate,onBusy}){
  const panel=document.createElement('section');panel.className='management-panel';
  panel.innerHTML=`<h3>Status halaman & pakej</h3><p id="page-state" class="notice"></p><p id="subscription-summary"></p><a href="/subscribe/" target="_blank" rel="noopener noreferrer">Lihat semua pakej ↗</a>
  <div id="lifecycle-actions" class="actions" ${customer?'hidden':''}><button type="button" id="state-toggle" class="secondary">Nyahaktif</button><button type="button" id="delete-open" class="danger">Padam halaman</button><button type="button" id="state-restore" class="secondary" hidden>Pulihkan sebagai nyahaktif</button></div>
  <form id="delete-form" class="notice" hidden><p>Halaman akan disembunyikan dan akses pelanggan ditarik balik. Super admin boleh memulihkannya. Salinan rekod dikekalkan.</p><label for="delete-name">Taip nama perniagaan untuk sahkan</label><input id="delete-name" required autocomplete="off"><button class="danger">Sahkan padam</button><button id="delete-cancel" type="button" class="secondary">Batal</button></form>
  <p id="management-status" role="status" aria-live="polite"></p>
  <div id="billing-section"><h3>Langganan & bayaran DuitNow</h3><p id="billing-availability"></p><p id="payment-summary"></p>
  <form id="payment-form" hidden><label for="payment-package">Pakej</label><select id="payment-package"></select><div class="quantity-grid"><div><label for="payment-nfc">NFC tambahan · RM30/unit</label><input id="payment-nfc" type="number" min="0" max="10" step="1" value="0"></div><div><label for="payment-stickers">NFC table sticker · kuantiti</label><input id="payment-stickers" type="number" min="0" max="200" step="1" value="0"></div></div><p class="help">Sticker: RM20/unit untuk 1–19 unit; RM15/unit untuk 20 unit atau lebih.</p><div id="payment-quote" role="status"></div><p class="help">Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.</p>
  <div id="payment-instructions" hidden><p>Bayar jumlah di atas menggunakan QR DuitNow ini. Semak nama penerima sebelum mengesahkan bayaran dalam aplikasi bank.</p><img id="payment-qr" alt="QR DuitNow bayaran kepada NIK AZFAR BIN NIK ZAINAL"><strong id="payment-payee"></strong><p><a id="payment-download" download="smarttap-duitnow.png">Muat turun QR bayaran</a></p></div>
  <p class="notice">Selepas membayar, hantar rujukan transaksi. Langganan dilanjutkan selepas super admin mengesahkan wang diterima. Jangan bayar semasa menggunakan demo tempatan.</p><label for="payment-reference">Rujukan transaksi bank</label><input id="payment-reference" required minlength="3" maxlength="80" autocomplete="off"><label for="payment-date">Tarikh bayaran</label><input id="payment-date" type="date" required><button id="payment-submit">Hantar untuk semakan bayaran</button></form>
  <form id="payment-review" hidden><h4>Semakan super admin</h4><p id="review-details"></p><label class="check-label"><input id="bank-confirm" type="checkbox"> Saya telah menyemak akaun bank dan wang benar-benar diterima untuk transaksi ini.</label><label for="review-note">Nota kepada pelanggan (pilihan)</label><input id="review-note" maxlength="200"><div class="actions"><button id="payment-approve">Sahkan bayaran</button><button type="button" id="payment-reject" class="secondary">Tolak permohonan</button></div></form></div>`;
  document.getElementById('edit-form').before(panel);
  const $=id=>panel.querySelector('#'+id);let current=null,config=null,quote=null,sequence=0,working=false;
  const today=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const options=()=>({package:$('payment-package').value,extraNfcQty:Number($('payment-nfc').value),stickerQty:Number($('payment-stickers').value)});
  function clear(){current=null;quote=null;sequence++;$('payment-reference').value='';$('review-note').value='';$('payment-qr').removeAttribute('src');$('payment-download').removeAttribute('href');$('delete-form').hidden=true;}
  async function cart(){
    quote=null;$('payment-submit').disabled=true;$('payment-instructions').hidden=true;const item=current,version=++sequence;if(!item||!config?.enabled)return;
    $('payment-quote').textContent='Mengira jumlah…';
    try{const result=await api('/links/'+item.id+'/quote',{method:'POST',body:options()});if(version!==sequence||current?.id!==item.id)return;quote=result;
      $('payment-quote').replaceChildren();for(const line of result.items){const row=document.createElement('p');row.textContent=line.name+' × '+line.quantity+' · '+money(line.totalCents);$('payment-quote').append(row);}const total=document.createElement('strong');total.textContent='Jumlah produk: '+money(result.amountCents);$('payment-quote').append(total);
      const image=await QRCode.toDataURL(config.qrPayload,{width:640,margin:4,errorCorrectionLevel:'M'});if(version!==sequence)return;$('payment-qr').src=image;$('payment-download').href=image;$('payment-payee').textContent=config.payee;$('payment-instructions').hidden=false;$('payment-submit').disabled=false;
    }catch(error){if(version===sequence)$('payment-quote').textContent=error.message;}
  }
  async function show(item){
    const changed=current?.id!==item.id,oldStatus=current?.renewal?.status;current=item;$('page-state').textContent=stateLabels[item.state]||item.state;
    $('subscription-summary').textContent=item.subscription?.plan==='annual'?'Halaman tahunan · tamat '+date(item.subscription.expiresAt):item.subscription?.plan==='nfc_only'?'NFC terus ke Google Review. Tiada langganan halaman QR.':'Rekod sedia ada. Pelan tahunan belum direkodkan; status asal dikekalkan.';
    $('state-toggle').textContent=item.manualState==='disabled'?'Aktifkan halaman':'Nyahaktifkan halaman';$('state-toggle').hidden=item.manualState==='deleted';$('delete-open').hidden=item.manualState==='deleted';$('state-restore').hidden=item.manualState!=='deleted';$('delete-form').hidden=true;
    if(changed){$('management-status').textContent='';$('payment-reference').value='';$('payment-date').value=today();$('payment-nfc').value='0';$('payment-stickers').value='0';}
    try{config=await api('/plan');if(current?.id!==item.id)return;}catch(error){$('billing-availability').textContent=error.message;return;}
    $('billing-availability').textContent=config.enabled?'Pakej halaman ditawarkan setahun sahaja. Bayaran disemak secara manual.':'Permohonan bayaran belum dibuka. Hubungi super admin untuk maklumat lanjut.';
    const pending=item.renewal?.status==='pending';$('payment-form').hidden=!config.enabled||pending||item.manualState==='deleted';$('payment-review').hidden=customer||!pending||!config.enabled||item.manualState==='deleted';
    const payment=item.renewal;$('payment-summary').textContent=payment?({pending:'Menunggu semakan bayaran',approved:'Bayaran disahkan',rejected:'Permohonan ditolak'}[payment.status]||payment.status)+' · '+money(payment.amountCents)+' · '+payment.reference+(payment.note?' · '+payment.note:''):'';
    $('review-details').textContent=payment?'Rujukan: '+payment.reference+' · '+payment.paidDate+' · '+money(payment.amountCents)+' · '+payment.items.map(x=>x.name+' × '+x.quantity).join(', '):'';
    $('bank-confirm').checked=false;$('review-note').value='';
    const selected=$('payment-package').value,annual=!!item.subscription?.lastPaymentId&&item.subscription.plan==='annual';$('payment-package').replaceChildren();
    for(const product of config.packages){if(product.id==='addons'&&!item.subscription?.lastPaymentId||product.id!=='addons'&&(annual&&product.id!=='renew'||!annual&&product.id==='renew'))continue;const option=document.createElement('option');option.value=product.id;option.textContent=product.name+(product.id==='addons'?'': ' · '+money(product.amountCents)+(product.months?' / '+product.months+' bulan':' · sekali bayar'));$('payment-package').append(option);}
    if(!changed&&selected&&[...$('payment-package').options].some(x=>x.value===selected))$('payment-package').value=selected;
    if(changed){const params=new URLSearchParams(location.search);const kind=params.get('package');if(kind&&[...$('payment-package').options].some(x=>x.value===kind))$('payment-package').value=kind;for(const [id,key,max] of [['payment-nfc','extraNfcQty',10],['payment-stickers','stickerQty',200]]){const n=Number(params.get(key)||0);if(Number.isInteger(n)&&n>=0&&n<=max)$(id).value=String(n);}}
    if(oldStatus==='pending'&&payment?.status==='approved'){$('payment-reference').value='';$('payment-nfc').value='0';$('payment-stickers').value='0';}if(!$('payment-form').hidden)await cart();
  }
  async function action(path,body,message){
    if(working||!current)return;working=true;onBusy(true);const id=current.id;$('management-status').textContent='Menyimpan…';for(const node of panel.querySelectorAll('button,input,select'))node.disabled=true;
    try{const updated=await api('/links/'+id+path,{method:'POST',body});if(current?.id!==id)return;onUpdate(updated);await show(updated);$('management-status').textContent=message;}
    catch(error){$('management-status').textContent=error.message;}
    finally{working=false;onBusy(false);for(const node of panel.querySelectorAll('button,input,select'))node.disabled=false;if(!quote)$('payment-submit').disabled=true;}
  }
  $('state-toggle').onclick=()=>action('/state',{state:current.manualState==='disabled'?'active':'disabled',revision:current.revision},'Status halaman dikemas kini. URL dan QR kekal sama.');
  $('state-restore').onclick=()=>action('/state',{state:'disabled',revision:current.revision},'Halaman dipulihkan sebagai nyahaktif. Semak langganan sebelum mengaktifkan.');
  $('delete-open').onclick=()=>{$('delete-form').hidden=false;$('delete-name').value='';$('delete-name').focus();};$('delete-cancel').onclick=()=>{$('delete-form').hidden=true;};
  $('delete-form').onsubmit=event=>{event.preventDefault();action('/state',{state:'deleted',confirmName:$('delete-name').value,revision:current.revision},'Halaman dipadam daripada paparan awam dan senarai pelanggan. Rekod boleh dipulihkan oleh super admin.');};
  for(const id of ['payment-package','payment-nfc','payment-stickers'])$(id).addEventListener('change',cart);
  $('payment-form').onsubmit=event=>{event.preventDefault();if(!quote)return;action('/renewal',{...options(),reference:$('payment-reference').value.trim(),paidDate:$('payment-date').value,amountCents:quote.amountCents,revision:current.revision},'Rujukan dihantar. Tunggu semakan bank oleh super admin.');};
  const decide=decision=>action('/decision',{requestId:current.renewal.id,decision,revision:current.revision,confirmBank:$('bank-confirm').checked,note:$('review-note').value},decision==='approve'?'Bayaran disahkan. Tempoh halaman dikemas kini jika pakej mengandungi langganan tahunan.':'Permohonan bayaran ditolak. Pelanggan boleh menghantar rujukan yang betul.');
  $('payment-review').onsubmit=event=>{event.preventDefault();decide('approve');};$('payment-reject').onclick=()=>decide('reject');
  return {show,clear};
}
