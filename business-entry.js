const payload = new URLSearchParams(location.search).get('p');
const shortID=new URLSearchParams(location.search).get('s');
if(shortID!==null) {
  document.getElementById('root').hidden=true;
  const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='margin:15vh auto;padding:24px;max-width:640px;text-align:center;font:16px/1.7 system-ui';status.textContent='Sedang membuka halaman SmartTap…';document.body.append(status);
  (async()=>{
    try {
      if(!/^[A-Za-z0-9_-]{16}$/.test(shortID))throw new Error('Pautan pendek ini tidak sah.');
      const endpoint=location.hostname==='127.0.0.1'?location.origin:window.SMARTTAP_IMPORT_CONFIG?.endpoint;
      if(!endpoint)throw new Error('Perkhidmatan pautan pendek belum tersedia.');
      const response=await fetch(new URL('/api/links/'+shortID,endpoint),{signal:AbortSignal.timeout(15000)});const data=await response.json();
      if(!response.ok)throw new Error(data.error || 'Pautan pendek tidak dapat dibuka. Cuba lagi.');
      const target=new URL(data.url);
      if(target.origin!==location.origin||target.pathname!=='/'||target.hash||[...target.searchParams.keys()].join()!=='p'||!/^[A-Za-z0-9_-]{1,4096}$/.test(target.searchParams.get('p')||''))throw new Error('Destinasi pautan tidak sah.');
      location.replace(target.href);
    } catch(error) {
      status.textContent=error.name==='TimeoutError'?'Sambungan mengambil masa terlalu lama. Muat semula untuk mencuba lagi.':error.message;
      status.setAttribute('role','alert');const back=document.createElement('a');back.href='./setup.html';back.textContent='Buka SmartTap';back.style.display='block';status.append(back);
    }
  })();
}
else if (!payload) document.getElementById('auto-import-entry').hidden = false;
else if (payload.length <= 4096 && /^[A-Za-z0-9_-]+$/.test(payload)) {
  try {
    const bytes = Uint8Array.from(atob(payload.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
    const profile = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    function url(value) {
      try { const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&u.href.length<=500?u:null; } catch { return null; }
    }
    const logo=url(profile.logo); const threads=url(profile.threads);
    const validThreads=threads&&['threads.com','www.threads.com','threads.net','www.threads.net'].includes(threads.hostname)&&/^\/@[\w.]+\/?$/.test(threads.pathname);
    if (profile.v === 1 && (logo || validThreads)) {
      const apply = () => {
        const card = document.querySelector('.public-card');
        if (!card) return false;
        const avatar=card.querySelector('.avatar');
        if(logo&&avatar&&!avatar.dataset.logoApplied) {
          avatar.dataset.logoApplied='true';
          const image=document.createElement('img'); image.src=logo.href;
          image.alt='Logo '+String(profile.name || 'perniagaan');image.referrerPolicy='no-referrer';
          image.style.cssText='width:100%;height:100%;object-fit:contain;border-radius:inherit;background:white';
          image.onload=()=>avatar.replaceChildren(image);
        }
        const links=card.querySelector('.public-links');
        if(validThreads&&links&&!links.querySelector('[data-threads]')) {
          const link=document.createElement('a');link.className='public-link';link.dataset.threads='true';link.href=threads.href;link.target='_blank';link.rel='noopener noreferrer';
          const icon=document.createElement('span');icon.className='link-icon';icon.textContent='@';
          const label=document.createElement('span');label.textContent='Threads';
          const arrow=document.createElement('span');arrow.textContent='↗';link.append(icon,label,arrow);links.append(link);
        }
        return !!links;
      };
      if (!apply()) { const observer = new MutationObserver(() => { if (apply()) observer.disconnect(); }); observer.observe(document.getElementById('root'),{childList:true,subtree:true}); }
    }
  } catch { /* The existing app displays the invalid-profile message. */ }
}
