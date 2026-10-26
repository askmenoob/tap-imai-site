import {createAdminSubscriptionUI} from './admin-subscription-ui.mjs';
import {hasEntitlement,hasAnnualEntitlement} from '../import-service/page-state.mjs';
import {paymentPrompt} from './payment-prompt.mjs';
import {orderSupportLink} from './order-support.mjs';
const money=cents=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(cents/100);
const date=value=>value?new Date(value).toLocaleDateString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'long',year:'numeric'}):'Belum bermula';
export const stateLabels={active:'Aktif',disabled:'Dinyahaktifkan',deleted:'Dipadam',pending:'Menunggu pengaktifan',expired:'Langganan tamat',nfc_only:'NFC sahaja · sekali bayar'};
export function createManagementUI({customer,api,onUpdate,onBusy,onPurge=()=>{}}){
  const panel=document.createElement('section');panel.className='management-panel';
  panel.innerHTML=`<section id="admin-message-box" class="admin-message-box" hidden aria-labelledby="admin-message-title"><h3 id="admin-message-title">Mesej daripada super admin</h3><p id="admin-message-text" data-no-i18n></p><p id="admin-message-time" class="help" data-no-i18n></p><p id="admin-message-state" role="status" aria-live="polite"></p><div id="admin-message-reply" hidden><strong>Balasan pelanggan</strong><p id="admin-message-reply-text" data-no-i18n></p></div><form id="message-reply-form" hidden><label for="message-reply-text">Nombor transaksi / balasan anda</label><textarea id="message-reply-text" required maxlength="500" rows="3"></textarea><button type="submit">Hantar balasan kepada super admin</button></form><button id="message-resolve" type="button" class="secondary" hidden>Tandakan selesai</button></section>
  <form id="admin-message-form" class="admin-message-compose" ${customer?'hidden':''}><h3>Hantar mesej kepada pelanggan</h3><label for="admin-message-input">Mesej / tindakan yang diperlukan</label><textarea id="admin-message-input" required maxlength="1000" rows="3" placeholder="Contoh: Sila berikan nombor transaksi bank untuk semakan bayaran."></textarea><p class="help">Mesej muncul pada halaman edit pelanggan. Mesej baharu menggantikan mesej semasa; rekod sebelumnya disimpan.</p><button type="submit">Hantar mesej</button></form><h3>Status halaman & pakej</h3><p id="page-state" class="notice"></p><p id="subscription-summary"></p><p id="google-listing-status" class="notice" hidden>Google Review belum tersedia. Super admin akan menyambungkan lokasi apabila tersedia di Google Maps.</p><p id="direct-review-wrap" hidden>Pautan untuk Google Review NFC: <a id="direct-review" target="_blank" rel="noopener noreferrer">Buka Google Review ↗</a></p><a href="/subscribe/" target="_blank" rel="noopener noreferrer">Lihat semua pakej ↗</a>
  <div id="lifecycle-actions" class="actions" ${customer?'hidden':''}><button type="button" id="state-toggle" class="secondary">Nyahaktif</button><button type="button" id="delete-open" class="danger">Padam halaman</button><button type="button" id="state-restore" class="secondary" hidden>Pulihkan sebagai nyahaktif</button><button type="button" id="purge-open" class="danger" hidden>Padam kekal QR</button></div>
  <form id="delete-form" class="notice" hidden><p>Halaman akan disembunyikan dan akses pelanggan ditarik balik. Super admin boleh memulihkannya. Salinan rekod dikekalkan.</p><label for="delete-name">Taip nama perniagaan untuk sahkan</label><input id="delete-name" required autocomplete="off"><button class="danger">Sahkan padam</button><button id="delete-cancel" type="button" class="secondary">Batal</button></form>
  <form id="purge-form" class="notice" hidden><h3>Padam kekal QR</h3><p>URL pendek dan QR ini tidak boleh dipulihkan melalui SmartTap. Rekod pesanan, audit dan backup dalam tempoh simpanan dikekalkan. Selesaikan bayaran dan penghantaran terbuka dahulu.</p><label for="purge-name">Taip nama perniagaan yang tepat</label><input id="purge-name" required autocomplete="off"><label for="purge-id">Taip kod QR untuk sahkan</label><p id="purge-code" data-no-i18n></p><input id="purge-id" required autocomplete="off" spellcheck="false"><label class="check-label"><input id="purge-confirm" type="checkbox" required> Saya faham URL dan QR lama akan dihentikan secara kekal.</label><div class="actions"><button class="danger">Sahkan padam kekal QR</button><button type="button" id="purge-cancel" class="secondary">Batal</button></div></form>
  <p id="management-status" role="status" aria-live="polite"></p>
  <div id="billing-section"><h3>Langganan & pembayaran</h3><p id="billing-availability"></p><p id="payment-summary"></p>
  <div id="order-support" class="notice" hidden><h4>Hubungi super admin</h4><p>Satu saluran WhatsApp untuk semua pertanyaan bayaran, pesanan dan penghantaran.</p><a id="order-whatsapp" class="button" target="_blank" rel="noopener noreferrer">Hubungi admin di WhatsApp ↗</a><p class="help">Nama perniagaan, ID pesanan jika tersedia dan mesej admin disertakan dalam draf. Semak dan hantar sendiri melalui WhatsApp.</p></div>
  <section id="gateway-panel" class="gateway-panel" hidden><h4>Pembayaran ToyyibPay</h4><p id="gateway-availability"></p><p id="gateway-order" data-no-i18n></p><p id="gateway-status" role="status" aria-live="polite"></p><div class="actions"><a id="gateway-continue" class="button" hidden>Teruskan pembayaran ↗</a><button type="button" id="gateway-check" class="secondary" hidden>Semak status bayaran</button><button type="button" id="gateway-cancel" class="secondary" hidden>Batalkan bil belum dibayar</button></div></section><p id="renewal-reminder" class="renewal-reminder" hidden></p><div id="payment-disclosure" class="actions" hidden><button id="payment-toggle" type="button" class="secondary" aria-controls="payment-form" aria-expanded="false">Renew / beli add-on</button><span class="help">Bayaran diproses melalui ToyyibPay.</span></div>
  <form id="payment-form" hidden><label for="payment-package">Pakej</label><select id="payment-package"></select><div class="quantity-grid"><div><label for="payment-nfc">NFC tambahan · RM30/unit</label><input id="payment-nfc" type="number" min="0" max="10" step="1" value="0"></div><div><label for="payment-stickers">NFC table sticker · kuantiti</label><input id="payment-stickers" type="number" min="0" max="200" step="1" value="0"></div></div><p class="help">Sticker: RM20/unit untuk 1–19 unit; RM15/unit untuk 20 unit atau lebih.</p><div id="payment-quote" role="status"></div><button id="gateway-pay" type="button" hidden>Bayar dengan ToyyibPay ↗</button><p id="gateway-pay-help" class="help" hidden>Jumlah pesanan ditetapkan oleh SmartTap. Status disahkan terus dengan ToyyibPay.</p><p class="help">Harga produk tidak termasuk penghantaran. Urus penghantaran dan cajnya secara berasingan dengan super admin.</p>
  <details id="manual-method" open><summary>Bayaran manual (QR DuitNow)</summary><div id="payment-instructions" hidden><p>Bayar jumlah di atas menggunakan QR DuitNow ini. Semak nama penerima sebelum mengesahkan bayaran dalam aplikasi bank.</p><img id="payment-qr" width="1118" height="1762" alt="Gambar penuh QR DuitNow asal — NIK AZFAR BIN NIK ZAINAL, MAE Maybank"><strong id="payment-payee"></strong><div class="actions"><a id="payment-open" class="button secondary" target="_blank" rel="noopener noreferrer">Lihat QR penuh ↗</a><a id="payment-download" class="button secondary" download="smarttap-duitnow-asal.jpeg">Muat turun gambar QR asal</a></div></div>
  <p class="notice">Selepas membayar, hantar rujukan transaksi. Langganan dilanjutkan selepas super admin mengesahkan wang diterima. Jangan bayar semasa menggunakan demo tempatan.</p><label for="payment-reference">Rujukan transaksi bank</label><input id="payment-reference" required minlength="3" maxlength="80" autocomplete="off"><label for="payment-date">Tarikh bayaran</label><input id="payment-date" type="date" required><button id="payment-submit">Hantar untuk semakan bayaran</button></details></form>
  <form id="payment-review" hidden><h4>Semakan super admin</h4><p id="review-details"></p><label class="check-label"><input id="bank-confirm" type="checkbox"> Saya telah menyemak akaun bank dan wang benar-benar diterima untuk transaksi ini.</label><label for="review-note">Nota kepada pelanggan (pilihan)</label><input id="review-note" maxlength="200"><div class="actions"><button id="payment-approve">Sahkan bayaran</button><button type="button" id="payment-reject" class="secondary">Tolak permohonan</button></div></form></div>`;
  document.getElementById('edit-form').before(panel);
  const $=id=>panel.querySelector('#'+id);let current=null,config=null,quote=null,sequence=0,messageSequence=0,gatewaySequence=0,gatewayReturnChecked=null,working=false,paymentOpen=!customer,paymentAvailable=false,supportOrderId=null;
  function paymentVisibility(open){
    paymentOpen=open;sequence++;quote=null;$('payment-form').hidden=!paymentAvailable||(customer&&!open);$('payment-instructions').hidden=true;
    $('payment-toggle').setAttribute('aria-expanded',String(customer&&open));$('payment-toggle').textContent=open?'Tutup borang bayaran':paymentPrompt(current||{}).label;
    $('payment-qr').removeAttribute('src');$('payment-download').removeAttribute('href');$('payment-open').removeAttribute('href');$('payment-submit').disabled=true;$('gateway-pay').disabled=true;
  }
  const subscriptionUI=createAdminSubscriptionUI({customer,onSubmit:data=>action('/subscription',{...data,revision:current.revision},'Langganan dikemas kini oleh super admin. URL dan QR kekal sama.')});$('lifecycle-actions').before(subscriptionUI.panel);
  const today=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const options=()=>({package:$('payment-package').value,extraNfcQty:Number($('payment-nfc').value),stickerQty:Number($('payment-stickers').value)});
  function clear(){$('purge-form').hidden=true;supportOrderId=null;subscriptionUI.clear();messageSequence++;current=null;$('admin-message-box').hidden=true;$('admin-message-text').textContent='';$('admin-message-reply-text').textContent='';$('message-reply-text').value='';$('admin-message-input').value='';gatewaySequence++;$('gateway-panel').hidden=true;$('gateway-order').textContent='';$('gateway-status').textContent='';$('gateway-continue').removeAttribute('href');paymentAvailable=false;paymentVisibility(!customer);$('payment-disclosure').hidden=true;$('renewal-reminder').hidden=true;$('payment-reference').value='';$('review-note').value='';$('delete-form').hidden=true;$('order-support').hidden=true;$('order-whatsapp').removeAttribute('href');}
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
  }
  function orderSupport(item){
    const support=orderSupportLink(item,{customer,language:document.documentElement.lang,orderId:supportOrderId});
    const visible=!!support;
    $('order-support').hidden=!visible;$('order-whatsapp').removeAttribute('href');if(!visible)return;
    $('order-whatsapp').href=support.url;
  }
  window.addEventListener('smarttap:language',()=>{if(current)orderSupport(current);});
  async function cart(){
    quote=null;$('gateway-pay').disabled=true;$('payment-submit').disabled=true;$('payment-instructions').hidden=true;const item=current,version=++sequence;if(!item||!config?.enabled||!paymentAvailable||(customer&&!paymentOpen))return;
    $('payment-quote').textContent='Mengira jumlah…';
    try{const result=await api('/links/'+item.id+'/quote',{method:'POST',body:options()});if(version!==sequence||current?.id!==item.id)return;quote=result;
      $('payment-quote').replaceChildren();for(const line of result.items){const row=document.createElement('p');row.textContent=line.name+' × '+line.quantity+' · '+money(line.totalCents);$('payment-quote').append(row);}const total=document.createElement('strong');total.textContent='Jumlah produk: '+money(result.amountCents);$('payment-quote').append(total);
      if(config.manualEnabled!==false){const image='/assets/duitnow-original.jpeg';$('payment-qr').src=image;$('payment-download').href=image;$('payment-open').href=image;$('payment-payee').textContent=config.payee;$('payment-instructions').hidden=false;$('payment-submit').disabled=false;}$('gateway-pay').disabled=!config.gateway?.enabled;
    }catch(error){if(version===sequence)$('payment-quote').textContent=error.message;}
  }
  function gatewayPanel(item){
    const settings=config?.gateway||{},checkout=item.checkout;
    $('gateway-panel').hidden=customer&&!settings.enabled&&!checkout;
    $('gateway-availability').textContent=settings.enabled?(location.hostname==='127.0.0.1'?'SIMULASI TEMPATAN — tiada wang dibayar.':settings.mode==='sandbox'?'Mod ujian ToyyibPay — bukan pembayaran sebenar.':'Bayar melalui ToyyibPay. Pengaktifan dibuat selepas transaksi disahkan.'):customer?'Pembayaran dalam talian belum dibuka. Hubungi super admin.':settings.reason==='awaiting_verification'?'ToyyibPay disediakan. Pembayaran sebenar ditutup sehingga akaun verified.':'ToyyibPay belum diaktifkan. Hubungi super admin.';
    $('gateway-pay').hidden=!settings.enabled;$('gateway-pay-help').hidden=!settings.enabled;
    if(changedGatewayId!==item.id){$('manual-method').open=!settings.enabled;changedGatewayId=item.id;}
    $('gateway-order').textContent=checkout?checkout.id+' · '+money(checkout.amountCents)+(checkout.invoice?' · '+checkout.invoice:''):'';
    $('gateway-status').textContent=checkout?({creating:'Sedang menyediakan bil. Muat semula sebentar lagi.',pending:'Bayaran belum disahkan. Teruskan pembayaran atau semak status.',failed:'Cubaan bayaran tidak berjaya. Anda boleh mencuba semula pada bil yang sama.',paid:'Bayaran ToyyibPay disahkan.',cancelled:'Bil belum dibayar telah dibatalkan.',creation_failed:'Bil belum dapat disediakan. Anda boleh cuba semula.',review:'Bayaran diterima dan memerlukan tindakan super admin.',resolved:'Semakan selesai. Pemulangan wang di luar SmartTap telah direkodkan.'}[checkout.status]||''):'';
    const reviewable=settings.enabled&&checkout&&!['paid','cancelled','creation_failed','resolved'].includes(checkout.status);
    $('gateway-check').hidden=!reviewable;$('gateway-cancel').hidden=!reviewable||checkout.status==='review';
    $('gateway-continue').hidden=true;$('gateway-continue').removeAttribute('href');
  }
  let changedGatewayId;
  function paymentURL(value){
    const url=new URL(value);const local=location.hostname==='127.0.0.1'&&url.origin===location.origin&&url.pathname.startsWith('/demo/toyyibpay/');
    if(!local&&(url.protocol!=='https:'||!['toyyibpay.com','dev.toyyibpay.com'].includes(url.hostname)||url.username||url.password||url.port))throw Error('Pautan pembayaran tidak sah.');return url.href;
  }
  async function gatewayAction(kind){
    if(working||!current||!config?.gateway?.enabled)return;if(kind==='create'&&!quote)return;
    working=true;subscriptionUI.busy(true);onBusy(true);const item=current,version=++gatewaySequence;
    $('gateway-status').textContent=kind==='create'?'Menyediakan bil ToyyibPay…':'Menyemak status ToyyibPay…';
    for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=true;
    try{
      const result=await api(kind==='create'?'/links/'+item.id+'/checkout':'/checkout/'+item.checkout.id+'/'+(kind==='cancel'?'cancel':'status'),{method:'POST',body:kind==='create'?{...options(),revision:item.revision,expectedAmountCents:quote.amountCents}:{}});
      if(current?.id!==item.id||version!==gatewaySequence)return;
      const checkout=result.checkout||result,updated=result.page||await api('/links/'+item.id);if(current?.id!==item.id||version!==gatewaySequence)return;
      onUpdate(updated);await show(updated);
      if(checkout.paymentUrl){const url=paymentURL(checkout.paymentUrl);$('gateway-continue').href=url;$('gateway-continue').hidden=false;if(kind==='create')location.assign(url);}
    }catch(error){if(current?.id===item.id&&version===gatewaySequence)$('gateway-status').textContent=error.message;}
    finally{working=false;onBusy(false);for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=false;$('gateway-pay').disabled=!quote||!config?.gateway?.enabled;if(!quote)$('payment-submit').disabled=true;subscriptionUI.busy(false);}
  }
  async function show(item){
    subscriptionUI.set(item);
    const changed=current?.id!==item.id,messageChanged=current?.adminMessage?.id!==item.adminMessage?.id,oldStatus=current?.renewal?.status;if(changed)supportOrderId=null;current=item;if(changed||messageChanged){$('message-reply-text').value='';$('management-status').textContent='';}showMessage(item);if(changed){messageSequence++;$('message-reply-text').value='';$('admin-message-input').value='';gatewaySequence++;$('gateway-panel').hidden=true;$('gateway-order').textContent='';$('gateway-status').textContent='';$('gateway-continue').removeAttribute('href');paymentAvailable=false;paymentVisibility(!customer);$('payment-disclosure').hidden=true;$('renewal-reminder').hidden=true;}orderSupport(item);$('page-state').textContent=stateLabels[item.state]||item.state;
    for(const id of ['page-state','subscription-summary'])$(id).dataset.state=item.state;
    $('subscription-summary').textContent=item.subscription?.plan==='annual'?'Halaman tahunan · tamat '+date(item.subscription.expiresAt):item.subscription?.plan==='nfc_only'?'NFC terus ke Google Review. Tiada langganan halaman QR.':'Rekod sedia ada. Pelan tahunan belum direkodkan; status asal dikekalkan.';
    $('google-listing-status').hidden=item.profile.googleStatus!=='pending';
    $('direct-review-wrap').hidden=item.subscription?.plan!=='nfc_only'||!item.profile.google;if(item.profile.google)$('direct-review').href=item.profile.google;else $('direct-review').removeAttribute('href');
    $('state-toggle').textContent=item.manualState==='disabled'?'Aktifkan halaman':'Nyahaktifkan halaman';$('state-toggle').hidden=item.manualState==='deleted';$('delete-open').hidden=item.manualState==='deleted';$('state-restore').hidden=item.manualState!=='deleted';$('purge-open').hidden=customer||item.manualState!=='deleted';$('purge-form').hidden=true;$('delete-form').hidden=true;
    if(changed){$('management-status').textContent='';$('payment-reference').value='';$('payment-date').value=today();$('payment-nfc').value='0';$('payment-stickers').value='0';}
    try{config=await api('/plan');if(current?.id!==item.id)return;}catch(error){$('billing-availability').textContent=error.message;return;}
    $('manual-method').hidden=config.manualEnabled===false;for(const id of ['payment-reference','payment-date']){$(id).required=config.manualEnabled!==false;$(id).disabled=config.manualEnabled===false;}
    gatewayPanel(item);$('billing-availability').textContent=config.enabled?(config.gateway?.enabled?config.manualEnabled===false?'Pakej halaman ditawarkan setahun sahaja. Bayar melalui ToyyibPay; status disahkan secara automatik.':'Pakej halaman ditawarkan setahun sahaja. Bayaran ToyyibPay disahkan secara automatik; bayaran manual disemak oleh super admin.':'Pakej halaman ditawarkan setahun sahaja. Bayaran disemak secara manual.'):'Permohonan bayaran belum dibuka. Hubungi super admin untuk maklumat lanjut.';
    const pending=item.renewal?.status==='pending';paymentAvailable=config.enabled&&!pending&&item.manualState!=='deleted';
    if(!paymentAvailable||(oldStatus!==item.renewal?.status&&item.renewal?.status==='approved'))paymentVisibility(!customer);
    $('payment-form').hidden=!paymentAvailable||(customer&&!paymentOpen);$('payment-review').hidden=customer||!pending||!config.enabled||item.manualState==='deleted';
    const prompt=paymentPrompt(item);$('renewal-reminder').textContent=prompt.message;$('renewal-reminder').hidden=!customer||!paymentAvailable||!prompt.message;
    $('payment-disclosure').hidden=!customer||!paymentAvailable;$('payment-toggle').textContent=paymentOpen?'Tutup borang bayaran':prompt.label;$('payment-toggle').setAttribute('aria-expanded',String(customer&&paymentOpen));
    const payment=item.renewal;$('payment-summary').textContent=payment?({pending:'Menunggu semakan bayaran',approved:'Bayaran disahkan',rejected:'Permohonan ditolak'}[payment.status]||payment.status)+' · '+money(payment.amountCents)+' · '+payment.reference+(payment.note?' · '+payment.note:''):'';
    $('review-details').textContent=payment?'Rujukan: '+payment.reference+' · '+payment.paidDate+' · '+money(payment.amountCents)+' · '+payment.items.map(x=>x.name+' × '+x.quantity).join(', '):'';
    $('bank-confirm').checked=false;$('review-note').value='';
    const selected=$('payment-package').value,annual=hasAnnualEntitlement(item);$('payment-package').replaceChildren();
    for(const product of config.packages){if(product.id==='addons'&&!hasEntitlement(item)||product.id!=='addons'&&(annual&&product.id!=='renew'||!annual&&product.id==='renew'))continue;const option=document.createElement('option');option.value=product.id;option.textContent=product.name+(product.id==='addons'?'': ' · '+money(product.amountCents)+(product.months?' / '+product.months+' bulan':' · sekali bayar'));$('payment-package').append(option);}
    if(!changed&&selected&&[...$('payment-package').options].some(x=>x.value===selected))$('payment-package').value=selected;
    if(changed){const params=new URLSearchParams(location.search);const kind=params.get('package');if(kind&&[...$('payment-package').options].some(x=>x.value===kind)){$('payment-package').value=kind;if(customer&&paymentAvailable)paymentVisibility(true);}for(const [id,key,max] of [['payment-nfc','extraNfcQty',10],['payment-stickers','stickerQty',200]]){const n=Number(params.get(key)||0);if(Number.isInteger(n)&&n>=0&&n<=max)$(id).value=String(n);}}
    const returning=new URLSearchParams(location.search).get('payment');if(customer&&config.gateway?.enabled&&returning===item.checkout?.id&&gatewayReturnChecked!==returning){gatewayReturnChecked=returning;queueMicrotask(()=>gatewayAction('status'));}
    if(oldStatus==='pending'&&payment?.status==='approved'){$('payment-reference').value='';$('payment-nfc').value='0';$('payment-stickers').value='0';}if(!$('payment-form').hidden)await cart();
  }
  async function action(path,body,message){
    if(working||!current)return;working=true;subscriptionUI.busy(true);onBusy(true);const id=current.id,version=messageSequence;$('management-status').textContent='Menyimpan…';for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=true;
    try{const updated=await api('/links/'+id+path,{method:'POST',body});if(current?.id!==id||version!==messageSequence)return;if(updated.permanentlyDeleted){clear();onPurge(id);return;}onUpdate(updated);await show(updated);if(path==='/message'&&body.action==='send')$('admin-message-input').value='';if(path==='/message-reply')$('message-reply-text').value='';$('management-status').textContent=message;}
    catch(error){$('management-status').textContent=error.message;}
    finally{working=false;onBusy(false);for(const node of panel.querySelectorAll('button,input,select,textarea'))node.disabled=false;if(!quote)$('payment-submit').disabled=true;subscriptionUI.busy(false);}
  }
  $('state-toggle').onclick=()=>action('/state',{state:current.manualState==='disabled'?'active':'disabled',revision:current.revision},'Status halaman dikemas kini. URL dan QR kekal sama.');
  $('state-restore').onclick=()=>action('/state',{state:'disabled',revision:current.revision},'Halaman dipulihkan sebagai nyahaktif. Semak langganan sebelum mengaktifkan.');
  $('delete-open').onclick=()=>{$('delete-form').hidden=false;$('delete-name').value='';$('delete-name').focus();};$('delete-cancel').onclick=()=>{$('delete-form').hidden=true;};
  $('delete-form').onsubmit=event=>{event.preventDefault();action('/state',{state:'deleted',confirmName:$('delete-name').value,revision:current.revision},'Halaman dipadam daripada paparan awam dan senarai pelanggan. Rekod boleh dipulihkan oleh super admin.');};
  $('purge-open').onclick=()=>{$('purge-form').hidden=false;$('purge-name').value='';$('purge-id').value='';$('purge-confirm').checked=false;$('purge-code').textContent=current.id;$('purge-name').focus();};
  $('purge-cancel').onclick=()=>{$('purge-form').hidden=true;};
  $('purge-form').onsubmit=event=>{event.preventDefault();if(customer||!$('purge-form').reportValidity())return;action('/purge',{revision:current.revision,confirmName:$('purge-name').value,confirmId:$('purge-id').value,confirmPermanent:$('purge-confirm').checked},'QR dipadam kekal.');};
  $('payment-package').addEventListener('change',cart);for(const id of ['payment-nfc','payment-stickers'])$(id).addEventListener('input',cart);
  $('payment-toggle').onclick=()=>{if(working||!paymentAvailable)return;paymentVisibility(!paymentOpen);if(paymentOpen)cart();};
  $('payment-form').onsubmit=event=>{event.preventDefault();if(config?.manualEnabled===false){gatewayAction('create');return;}if(!quote)return;action('/renewal',{...options(),reference:$('payment-reference').value.trim(),paidDate:$('payment-date').value,amountCents:quote.amountCents,revision:current.revision},'Rujukan dihantar. Tunggu semakan bank oleh super admin.');};
  const decide=decision=>action('/decision',{requestId:current.renewal.id,decision,revision:current.revision,confirmBank:$('bank-confirm').checked,note:$('review-note').value},decision==='approve'?'Bayaran disahkan. Tempoh halaman dikemas kini jika pakej mengandungi langganan tahunan.':'Permohonan bayaran ditolak. Pelanggan boleh menghantar rujukan yang betul.');
  $('payment-review').onsubmit=event=>{event.preventDefault();decide('approve');};$('payment-reject').onclick=()=>decide('reject');
  $('gateway-pay').onclick=()=>gatewayAction('create');$('gateway-check').onclick=()=>gatewayAction('status');$('gateway-cancel').onclick=()=>gatewayAction('cancel');
  $('admin-message-form').onsubmit=event=>{event.preventDefault();action('/message',{action:'send',text:$('admin-message-input').value,revision:current.revision},'Mesej telah dihantar kepada pelanggan.');};
  $('message-reply-form').onsubmit=event=>{event.preventDefault();action('/message-reply',{messageId:current.adminMessage.id,text:$('message-reply-text').value,revision:current.revision},'Balasan telah dihantar kepada super admin.');};
  $('message-resolve').onclick=()=>action('/message',{action:'resolve',messageId:current.adminMessage.id,revision:current.revision},'Mesej telah diselesaikan.');
  return {show,clear,contact(orderId=null){supportOrderId=orderId;if(current)orderSupport(current);}};
}
