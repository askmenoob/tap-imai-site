import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export function publicIP(ip) {
  if (isIP(ip) === 4) {
    const [a,b,c] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && ((b === 0 && (c === 0 || c === 2)) || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(ip) === 6) {
    // Only global unicast; exclude mapped IPv4, local, multicast and documentation.
    return /^[23][0-9a-f]{3}:/i.test(ip) && !/^2001:(0:|0db8:|db8:|10:|20:)/i.test(ip) && !/^2002:/i.test(ip);
  }
  return false;
}

export function safeWebURL(value, base) {
  try {
    const u = new URL(value, base);
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') ||
        !u.hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/i.test(u.hostname) ||
        u.href.length > 2000) return null;
    if (isIP(u.hostname.replace(/^\[|\]$/g,'')) && !publicIP(u.hostname.replace(/^\[|\]$/g,''))) return null;
    return u;
  } catch { return null; }
}

export async function fetchHTML(value, redirects = 0) {
  const url = safeWebURL(value);
  if (!url || redirects > 3) throw new Error('Laman rasmi tidak dapat dibaca dengan selamat.');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => !publicIP(a.address))) throw new Error('Alamat laman tidak dibenarkan.');
  const pinned = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { 'user-agent': 'SmartTapBusinessImport/1.0', accept: 'text/html', 'accept-encoding': 'identity' },
      // Pin the validated address to prevent a second DNS lookup or DNS rebinding.
      lookup: (_host, options, callback) => options.all
        ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
    }, response => {
      if ([301,302,303,307,308].includes(response.statusCode)) {
        response.resume(); resolve({ redirect: response.headers.location }); return;
      }
      if (response.statusCode !== 200 || !/text\/html|application\/xhtml\+xml/i.test(response.headers['content-type'] || '')) {
        response.resume(); reject(new Error('Laman rasmi tidak membenarkan bacaan automatik.')); return;
      }
      let size = 0; const chunks = [];
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 1024 * 1024) request.destroy(new Error('Halaman terlalu besar.'));
        else chunks.push(chunk);
      });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), url: url.href }));
      response.on('error', reject);
    });
    const deadline = setTimeout(() => request.destroy(new Error('Laman rasmi mengambil masa terlalu lama.')), 8000);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', reject);
  });
  if (result.redirect) {
    const next = safeWebURL(result.redirect, url);
    if (!next) throw new Error('Pautan ubah hala tidak selamat.');
    return fetchHTML(next.href, redirects + 1);
  }
  if (!result.html) throw new Error('Laman rasmi tiada kandungan.');
  return result;
}
