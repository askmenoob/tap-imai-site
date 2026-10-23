(() => {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(error => console.warn('SmartTap offline fallback unavailable:', error.message));
  }
  const standalone = matchMedia('(display-mode: standalone)');
  const header = document.querySelector('header');
  if (!header || standalone.matches || navigator.standalone) return;

  let pendingInstall;
  const install = document.createElement('button');
  install.type = 'button'; install.className = 'pwa-install'; install.textContent = 'Pasang aplikasi';
  header.classList.add('pwa-header');
  (header.querySelector('nav') || header).append(install);

  const dialog = document.createElement('dialog');
  dialog.className = 'pwa-dialog'; dialog.setAttribute('aria-labelledby', 'pwa-heading');
  const heading = document.createElement('h2'); heading.id = 'pwa-heading'; heading.textContent = 'Pasang SmartTap';
  const intro = document.createElement('p'); intro.textContent = 'Simpan SmartTap pada skrin utama telefon anda untuk akses lebih cepat.';
  dialog.append(heading, intro);
  for (const [title, text] of [
    ['Android · Chrome', 'Buka tap.imai.my di Chrome. Tekan menu ⋮, kemudian pilih Pasang aplikasi atau Tambah pada skrin utama.'],
    ['iPhone · Safari', 'Buka tap.imai.my di Safari. Tekan Kongsi, pilih Tambah ke Skrin Utama (Add to Home Screen), aktifkan Open as Web App jika pilihan itu dipaparkan, kemudian tekan Tambah.'],
  ]) {
    const label = document.createElement('h3'); label.textContent = title;
    const description = document.createElement('p'); description.textContent = text;
    dialog.append(label, description);
  }
  const note = document.createElement('p'); note.className = 'pwa-note';
  note.textContent = 'Carian, login, bayaran dan maklumat semasa memerlukan internet.';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Faham';
  close.addEventListener('click', () => dialog.close()); dialog.append(note, close); document.body.append(dialog);

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); pendingInstall = event; });
  install.addEventListener('click', async () => {
    if (!pendingInstall) { dialog.showModal(); return; }
    const prompt = pendingInstall; pendingInstall = undefined;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') install.hidden = true;
    } catch { dialog.showModal(); }
  });
  const installed = () => { install.hidden = true; pendingInstall = undefined; if (dialog.open) dialog.close(); };
  window.addEventListener('appinstalled', installed);
  standalone.addEventListener('change', event => { if (event.matches) installed(); });
})();
