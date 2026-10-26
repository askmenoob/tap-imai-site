import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { extractMetadata, socialType } from './metadata.mjs';
import { fetchHTML, safeWebURL } from './safe-fetch.mjs';
import { malaysiaPhone, whatsappFromPhone } from './contacts.mjs';

export function createImportService({ google, secret, webSearch, readWebsite = fetchHTML, now = Date.now }) {
  if (!secret || secret.length < 32) throw new Error('A signing secret of at least 32 characters is required.');
  const ticketKey=createHash('sha256').update('smarttap-discovery-v1\0'+secret).digest();
  function ticket(data) {
    const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',ticketKey,iv);
    const encrypted=Buffer.concat([cipher.update(JSON.stringify({purpose:'choice',...data,expires:now()+15*60*1000}),'utf8'),cipher.final()]);
    return 'v1.'+Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
  }
  function decode(value,purpose='choice') {
    try {
      if(typeof value!=='string'||value.length>4000||!/^v1\.[A-Za-z0-9_-]+$/.test(value))throw 0;
      const bytes=Buffer.from(value.slice(3),'base64url');if(bytes.length<29||bytes.toString('base64url')!==value.slice(3))throw 0;
      const decipher=createDecipheriv('aes-256-gcm',ticketKey,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));
      const parsed=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8'));
      if(parsed.purpose!==purpose||!Number.isFinite(parsed.expires)||parsed.expires<now()||parsed.expires>now()+16*60*1000||!/^[A-Za-z0-9_-]{8,200}$/.test(parsed.id))throw 0;
      return parsed;
    } catch {throw Object.assign(new Error('Hasil carian telah luput. Cari perniagaan semula.'),{status:400});}
  }
  return {
    reviewFromDraft(token){const choice=decode(token,'draft');return 'https://search.google.com/local/writereview?placeid='+encodeURIComponent(choice.id);},
    async suggest(raw, session) {
      const query = typeof raw === 'string' ? raw.normalize('NFC').trim() : '';
      if ([...query].length < 3 || query.length > 160) throw Object.assign(new Error('Taip sekurang-kurangnya 3 aksara untuk cadangan.'), { status:400 });
      if (typeof session !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session))
        throw Object.assign(new Error('Sesi carian tidak sah. Muat semula halaman.'), { status:400 });
      const places = await google.suggest(query, session);
      return { places:places.map(p => ({ ...p, token:ticket({id:p.id, name:p.name, address:p.address, query, session}) })) };
    },
    async search(raw) {
      const query = typeof raw === 'string' ? raw.normalize('NFC').trim() : '';
      if (query.length < 2 || query.length > 160) throw Object.assign(new Error('Masukkan nama perniagaan, 2 hingga 160 aksara.'), { status: 400 });
      const places = await google.search(query);
      return { places: places.map(p => ({ ...p, token: ticket({ id: p.id, name:p.name, address:p.address, query }) })) };
    },
    async import(token) {
      const choice = decode(token);
      const place = await google.details(choice.id, choice.session);
      if (place.id !== choice.id) throw new Error('Perniagaan tidak sepadan dengan pilihan.');
      const result = { profile: {
        name: [...(place.name || choice.name || choice.query)].slice(0,80).join(''), google: 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(place.id),
      }, sources: { name: choice.name ? 'Pilihan perniagaan anda' : 'Nama yang anda masukkan', google: 'Google Place ID: ' + place.id }, candidates: {}, warnings: [] };
      const web = webSearch ? webSearch.search({id:place.id,name:result.profile.name,address:place.address || choice.address || '',query:choice.query}).catch(()=>null) : Promise.resolve(undefined);
      let websiteValue = place.website;
      try { const candidate=new URL(websiteValue); if(candidate.protocol==='http:' && !candidate.port) {candidate.protocol='https:';websiteValue=candidate.href;} } catch { /* Missing or invalid site. */ }
      const website = safeWebURL(websiteValue);
      if (!website) result.warnings.push('Laman rasmi tidak ditemui. Logo dan penerangan boleh diisi sendiri.');
      const social = website && socialType(website.href);
      if (social) {
        result.profile[social] = website.href; result.sources[social] = 'Pautan perniagaan daripada Google Maps';
        result.warnings.push('Perniagaan menggunakan halaman sosial sebagai laman utama. Logo dan penerangan perlu disemak sendiri.');
      } else if (website) {
      result.profile.website = website.href; result.sources.website = 'Pautan perniagaan daripada Google Maps';
      try {
        const page = await readWebsite(website.href);
        const metadata = extractMetadata(page.html, page.url);
        // Keep the chosen branch name instead of replacing it with a company-wide site title.
        delete metadata.profile.name; delete metadata.sources.name;
        Object.assign(result.profile, metadata.profile); Object.assign(result.sources, metadata.sources);
        result.candidates = metadata.candidates;
      } catch {
        result.warnings.push('Laman rasmi tidak dapat dibaca. Google Review dan laman web masih diisi; medan lain boleh diedit.');
      }
      }
      // Places phone belongs to the selected branch; a corporate homepage may list another branch.
      const phone=malaysiaPhone(place.phone) || result.profile.phone;
      if(phone) {
        result.profile.phone=phone; if(malaysiaPhone(place.phone)) result.sources.phone='Telefon perniagaan daripada Google Maps';
        if(!result.profile.whatsapp) {
          result.profile.whatsapp=whatsappFromPhone(phone);
          result.sources.whatsapp='Dijana daripada telefon perniagaan — semak akaun WhatsApp';
          result.warnings.push('Pautan WhatsApp dijana daripada nombor telefon. Sahkan nombor ini berdaftar dengan WhatsApp.');
        }
      }
      const found=await web;
      result.searchSuggestionsHtml=found?.searchSuggestionsHtml || '';
      if(webSearch && !found?.grounded) result.warnings.push('Carian profil Google tidak memberikan sumber yang dapat disahkan. Pautan masih boleh diisi sendiri.');
      if(found?.grounded) {
        result.searchSuggestionsHtml=found.searchSuggestionsHtml || '';
        for(const [kind,values] of Object.entries(found.candidates)) {
          if(result.profile[kind]) continue;
          const all=[...(result.candidates[kind] || []),...values];
          const unique=[...new Map(all.map(url=>[url.replace(/^https:\/\/www\./,'https://').replace(/\/$/,''),url])).values()];
          result.candidates[kind]=unique;
          if(unique.length===1) {result.profile[kind]=unique[0];result.sources[kind]=found.sources?.[unique[0]] || unique[0];}
        }
        result.warnings.push('Profil sosial daripada Google ialah cadangan. Semak nama, lokasi dan pemilikan akaun sebelum berkongsi.');
      }
      for (const key of ['logo','tagline','instagram','facebook','tiktok','threads','x','whatsapp']) {
        if (!result.profile[key]) result.warnings.push(`${key === 'tagline' ? 'Penerangan' : key}: ${result.candidates[key]?.length > 1 ? 'lebih daripada satu pautan ditemui; pilih pautan yang betul.' : 'belum ditemui daripada sumber rasmi.'}`);
      }
      result.draftToken=ticket({id:choice.id,purpose:'draft'});
      return result;
    },
  };
}
