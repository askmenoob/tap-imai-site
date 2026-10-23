const payload = new URLSearchParams(location.search).get('p');
if (!payload) document.getElementById('auto-import-entry').hidden = false;
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
