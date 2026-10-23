const payload = new URLSearchParams(location.search).get('p');
if (!payload) document.getElementById('auto-import-entry').hidden = false;
else if (payload.length <= 4096 && /^[A-Za-z0-9_-]+$/.test(payload)) {
  try {
    const bytes = Uint8Array.from(atob(payload.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
    const profile = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    const logo = typeof profile.logo === 'string' ? new URL(profile.logo) : null;
    if (profile.v === 1 && logo && logo.protocol === 'https:' && !logo.username && !logo.password && logo.href.length <= 500) {
      const apply = () => {
        const avatar = document.querySelector('.public-card .avatar');
        if (!avatar) return false;
        const image = document.createElement('img'); image.src = logo.href;
        image.alt = 'Logo ' + String(profile.name || 'perniagaan'); image.referrerPolicy = 'no-referrer';
        image.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:inherit;background:white';
        image.onload = () => avatar.replaceChildren(image);
        return true;
      };
      if (!apply()) { const observer = new MutationObserver(() => { if (apply()) observer.disconnect(); }); observer.observe(document.getElementById('root'),{childList:true,subtree:true}); }
    }
  } catch { /* The existing app displays the invalid-profile message. */ }
}
