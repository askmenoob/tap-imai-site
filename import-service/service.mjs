import { createHmac, timingSafeEqual } from 'node:crypto';
import { extractMetadata, socialType } from './metadata.mjs';
import { fetchHTML, safeWebURL } from './safe-fetch.mjs';

export function createImportService({ google, secret, readWebsite = fetchHTML, now = Date.now }) {
  if (!secret || secret.length < 32) throw new Error('A signing secret of at least 32 characters is required.');
  const sign = data => createHmac('sha256', secret).update(data).digest('base64url');
  function ticket(data) {
    const encoded = Buffer.from(JSON.stringify({ ...data, expires: now() + 15 * 60 * 1000 })).toString('base64url');
    return encoded + '.' + sign(encoded);
  }
  function decode(value) {
    try {
      if (typeof value !== 'string' || value.length > 2000) throw 0;
      const [data, signature, extra] = value.split('.');
      if (extra || !data || !signature || !/^[A-Za-z0-9_-]+$/.test(signature)) throw 0;
      const actual = Buffer.from(signature); const expected = Buffer.from(sign(data));
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw 0;
      const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (parsed.expires < now() || parsed.expires > now() + 16 * 60 * 1000 || !/^[A-Za-z0-9_-]{8,200}$/.test(parsed.id)) throw 0;
      return parsed;
    } catch { throw Object.assign(new Error('Hasil carian telah luput. Cari perniagaan semula.'), { status: 400 }); }
  }
  return {
    async search(raw) {
      const query = typeof raw === 'string' ? raw.normalize('NFC').trim() : '';
      if (query.length < 2 || query.length > 160) throw Object.assign(new Error('Masukkan nama perniagaan, 2 hingga 160 aksara.'), { status: 400 });
      const places = await google.search(query);
      return { places: places.map(p => ({ ...p, token: ticket({ id: p.id, query }) })) };
    },
    async import(token) {
      const choice = decode(token);
      const place = await google.details(choice.id);
      if (place.id !== choice.id) throw new Error('Perniagaan tidak sepadan dengan pilihan.');
      const result = { profile: {
        name: choice.query.slice(0, 80), google: 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(place.id),
      }, sources: { name: 'Nama yang anda masukkan', google: 'Google Place ID: ' + place.id }, candidates: {}, warnings: [] };
      let websiteValue = place.website;
      try { const candidate=new URL(websiteValue); if(candidate.protocol==='http:' && !candidate.port) {candidate.protocol='https:';websiteValue=candidate.href;} } catch { /* Missing or invalid site. */ }
      const website = safeWebURL(websiteValue);
      if (!website) { result.warnings.push('Laman rasmi tidak ditemui. Logo, penerangan dan sosial boleh diisi sendiri.'); return result; }
      const social = socialType(website.href);
      if (social) {
        result.profile[social] = website.href; result.sources[social] = 'Pautan perniagaan daripada Google Maps';
        result.warnings.push('Perniagaan menggunakan halaman sosial sebagai laman utama. Logo dan penerangan perlu disemak sendiri.');
        return result;
      }
      result.profile.website = website.href; result.sources.website = 'Pautan perniagaan daripada Google Maps';
      try {
        const page = await readWebsite(website.href);
        const metadata = extractMetadata(page.html, page.url);
        Object.assign(result.profile, metadata.profile); Object.assign(result.sources, metadata.sources);
        result.candidates = metadata.candidates;
      } catch {
        result.warnings.push('Laman rasmi tidak dapat dibaca. Google Review dan laman web masih diisi; medan lain boleh diedit.');
      }
      for (const key of ['logo','tagline','instagram','facebook','tiktok','whatsapp']) {
        if (!result.profile[key]) result.warnings.push(`${key === 'tagline' ? 'Penerangan' : key}: ${result.candidates[key]?.length > 1 ? 'lebih daripada satu pautan ditemui; pilih pautan yang betul.' : 'belum ditemui daripada sumber rasmi.'}`);
      }
      return result;
    },
  };
}
