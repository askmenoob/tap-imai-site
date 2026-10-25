// Creating a public draft does not assign an owner or activate a subscription.
// Keep the result and the WhatsApp hand-off explicit about that boundary.
export function onboardingResult({url,name='',registering=false,language='ms'}) {
  const page=new URL(url);
  const local=page.protocol==='http:'&&page.hostname==='127.0.0.1';
  if((!local&&(page.protocol!=='https:'||page.hostname!=='tap.imai.my'||page.port))||page.username||page.password||page.pathname!=='/'||page.hash||[...page.searchParams.keys()].join()!=='s'||!/^[A-Za-z0-9_-]{16}$/.test(page.searchParams.get('s')||''))throw new Error('URL pendek tidak sah.');
  const L=(ms,en)=>language==='en'?en:ms;
  const common={
    openLabel:L('Lihat status halaman ↗','View page status ↗'),
    showContact:!registering,
  };
  if(registering)return {...common,
    eyebrow:L('PENDAFTARAN GMAIL SELESAI','GMAIL REGISTRATION COMPLETE'),
    title:L('Pautan SmartTap pelanggan','Customer SmartTap link'),
    status:L('Pendaftaran Gmail selesai. Semak status pakej sebelum berkongsi.','Gmail registration complete. Check the package status before sharing.'),
    notice:L('Pendaftaran Gmail selesai. Pelanggan boleh login di tap.imai.my/edit untuk menyemak pakej, membayar melalui ToyyibPay dan menyunting halaman selepas diaktifkan. URL pendek dan QR kekal sama.','Gmail registration is complete. The customer can sign in at tap.imai.my/edit to check their package, pay through ToyyibPay and edit their page after activation. The short URL and QR stay the same.'),
    contactLabel:'',contactHelp:'',contactURL:'',
  };
  const contact=new URL('https://wa.me/60103250032');
  contact.searchParams.set('text',[
    L('Salam SmartTap, saya mahu mendaftar dan mengaktifkan draf halaman ini.','Hello SmartTap, I would like to register and activate this page draft.'),
    L('Perniagaan: ','Business: ')+String(name).trim().slice(0,100),
    L('Rujukan draf: ','Draft reference: ')+page.searchParams.get('s'),
    L('Pautan: ','Link: ')+page.href,
  ].join('\n'));
  return {...common,
    eyebrow:L('DRAF SIAP','DRAFT SAVED'),
    title:L('Draf SmartTap anda','Your SmartTap draft'),
    status:L('Draf siap — menunggu pendaftaran dan pengaktifan.','Draft saved — awaiting registration and activation.'),
    notice:L('Halaman ini belum aktif dan belum didaftarkan kepada pemilik. Hubungi super admin untuk mendaftarkan Gmail dan mengaktifkan pakej sebelum berkongsi atau mencetak QR. Simpan pautan ini; URL dan QR kekal sama selepas pengaktifan dan renew.','This page is not active and has no registered owner yet. Contact the super admin to register the owner’s Gmail and activate a package before sharing or printing the QR. Keep this link; the URL and QR stay the same after activation and renewal.'),
    contactLabel:L('Hubungi admin untuk daftar ↗','Contact admin to register ↗'),
    contactHelp:L('Draf mesej mengandungi nama perniagaan dan rujukan draf. Semak dan hantar sendiri melalui WhatsApp.','The message draft includes your business name and draft reference. Review and send it yourself in WhatsApp.'),
    contactURL:contact.href,
  };
}
