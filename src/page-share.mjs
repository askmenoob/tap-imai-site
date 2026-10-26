export function canonicalShareURL(value){
 try{const url=new URL(value);const id=url.searchParams.get('s');if(!/^[A-Za-z0-9_-]{16}$/.test(id||'')||url.pathname!=='/'||url.username||url.password||!(url.origin==='https://tap.imai.my'||url.hostname==='127.0.0.1'&&url.protocol==='http:'))return null;return url.origin+'/?s='+id;}catch{return null;}
}
export function shareDestinations(url,name){
 const safe=canonicalShareURL(url);if(!safe)throw Error('Invalid SmartTap share URL');const text=String(name||'SmartTap').slice(0,80)+' — '+safe;
 return {whatsapp:'https://wa.me/?text='+encodeURIComponent(text),facebook:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(safe),x:'https://x.com/intent/tweet?text='+encodeURIComponent(String(name||'SmartTap').slice(0,80))+'&url='+encodeURIComponent(safe),linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(safe),telegram:'https://t.me/share/url?url='+encodeURIComponent(safe)+'&text='+encodeURIComponent(String(name||'SmartTap').slice(0,80))};
}
export function attachPageShare(document,main,profile,value){
 const url=canonicalShareURL(value);if(!url)return;
 const en=()=>document.documentElement.lang==='en',L=(ms,english)=>en()?english:ms;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const trigger=el('button','business-share-trigger');trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-label',L('Kongsi halaman SmartTap','Share SmartTap page'));trigger.title=L('Kongsi','Share');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8');svg.append(path);trigger.append(svg);main.querySelector('.business-cover').append(trigger);
 const dialog=el('dialog','business-share-dialog');dialog.setAttribute('aria-labelledby','smarttap-share-title');
 const top=el('div','share-heading'),title=el('h2'),close=el('button','share-close','×');title.id='smarttap-share-title';close.type='button';close.setAttribute('aria-label',L('Tutup','Close'));top.append(title,close);
 const preview=el('div','share-preview');if(profile.logo){const img=el('img');img.src=profile.logo;img.referrerPolicy='no-referrer';img.alt='';img.onerror=()=>img.remove();preview.append(img);}const name=el('strong','',profile.name),short=el('span','',url.replace('https://',''));preview.append(name,short);
 const field=el('input','share-url');field.readOnly=true;field.value=url;field.setAttribute('aria-label',L('URL pendek SmartTap','SmartTap short URL'));field.addEventListener('focus',()=>field.select());
 const actions=el('div','share-options'),copy=el('button','share-copy'),native=el('button','share-native');copy.type=native.type='button';
 const status=el('p','share-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(url);status.textContent=L('Pautan disalin.','Link copied.');}catch{field.focus();field.select();status.textContent=L('Pilih dan salin pautan di atas.','Select and copy the link above.');}};
 const destinations=shareDestinations(url,profile.name),labels={whatsapp:'WhatsApp',facebook:'Facebook',x:'X',linkedin:'LinkedIn',telegram:'Telegram'};
 actions.append(copy);for(const [key,href] of Object.entries(destinations)){const a=el('a','share-platform',labels[key]);a.href=href;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
 native.hidden=typeof navigator.share!=='function';native.onclick=async()=>{try{await navigator.share({title:profile.name,text:profile.name,url});}catch(error){if(error.name!=='AbortError')status.textContent=L('Pilih aplikasi di atas atau salin pautan.','Choose an app above or copy the link.');}};
 dialog.append(top,preview,field,actions,native,status);main.append(dialog);
 const updateLabels=()=>{trigger.setAttribute('aria-label',L('Kongsi halaman SmartTap','Share SmartTap page'));trigger.title=L('Kongsi','Share');field.setAttribute('aria-label',L('URL pendek SmartTap','SmartTap short URL'));};document.defaultView?.addEventListener('smarttap:language',updateLabels);
 trigger.onclick=()=>{title.textContent=L('Kongsi SmartTap','Share SmartTap');copy.textContent=L('Salin pautan','Copy link');native.textContent=L('Kongsi melalui aplikasi lain','Share with another app');close.setAttribute('aria-label',L('Tutup','Close'));status.textContent='';dialog.showModal();};
 close.onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>trigger.focus());
}
