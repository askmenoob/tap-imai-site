export const appearanceFields = {
  theme:{label:'Tema halaman',options:{classic:'Klasik · krim & hijau',dark:'Gelap · arang & putih',bright:'Ceria · putih & warna jenama'}},
  accent:{label:'Warna utama',type:'color'},
  cover:{label:'Cover tersimpan',type:'url',max:500},
  menuLabel:{label:'Nama butang menu / katalog',max:40},
  menu:{label:'Pautan menu / katalog',type:'url',max:500},
  directions:{label:'Pautan lokasi Google Maps',type:'url',max:500},
  address:{label:'Alamat perniagaan',max:240},
  hours:{label:'Waktu operasi',max:240},
  promoTitle:{label:'Tajuk promosi',max:70},
  promoText:{label:'Penerangan promosi',max:180},
  promoURL:{label:'Pautan promosi',type:'url',max:500},
  promoStart:{label:'Promosi bermula (waktu Malaysia)',type:'datetime-local'},
  promoEnd:{label:'Promosi tamat (waktu Malaysia)',type:'datetime-local'},
};
export function promotionVisible(profile,now=Date.now()) {
  if(!profile.promoTitle)return false;
  const start=profile.promoStart?Date.parse(profile.promoStart+'+08:00'):-Infinity;
  const end=profile.promoEnd?Date.parse(profile.promoEnd+'+08:00'):Infinity;
  return now>=start&&now<end;
}
export function validateAppearance(profile) {
  for(const [key,spec] of Object.entries(appearanceFields)) {
    const value=profile[key];if(value===undefined||value==='')continue;
    if(typeof value!=='string'||value.length>(spec.max||40))throw new Error('Medan paparan tidak sah: '+spec.label);
    if(spec.options&&!Object.hasOwn(spec.options,value))throw new Error('Tema tidak sah.');
    if(key==='accent'&&!/^#[a-fA-F0-9]{6}$/.test(value))throw new Error('Warna tidak sah.');
    if(spec.type==='datetime-local'&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'+08:00'))||new Date(Date.parse(value+'+08:00')+8*3600000).toISOString().slice(0,16)!==value))throw new Error('Tarikh promosi tidak sah.');
  }
  if(profile.promoStart&&profile.promoEnd&&profile.promoEnd<=profile.promoStart)throw new Error('Tarikh tamat mesti selepas tarikh mula.');
}
