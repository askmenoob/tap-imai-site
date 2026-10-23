import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { createGoogleProvider } from './google.mjs';
import { createImportService } from './service.mjs';

const preview = process.argv.includes('--preview');
const demo = preview && process.env.PREVIEW_DEMO === '1';
const port = Number(process.env.PORT || 8787);
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const key = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
const secret = (process.env.IMPORT_SIGNING_SECRET || (preview ? randomBytes(32).toString('hex') : '')).trim();
if (!preview && (!key || secret.length < 32)) throw new Error('Configure GOOGLE_PLACES_API_KEY and IMPORT_SIGNING_SECRET before starting.');
const origins = new Set((process.env.ALLOWED_ORIGINS || 'https://tap.imai.my').split(',').map(s => s.trim()));
if (preview) origins.add('http://127.0.0.1:' + port);
const demoLogo = 'https://placehold.co/160x160/173b33/ffffff.png?text=DEMO';
const fixture = {
  search: async query => query.toLowerCase().includes('tiada') ? [] : [{ id:'DemoPlaceId1234', name:'Kopi Contoh (DEMO)', address:'Lokasi contoh — bukan hasil Google sebenar', attributions:[] }],
  details: async id => ({ id, website:'https://example.com/' }),
};
const service = createImportService({ google: demo ? fixture : createGoogleProvider(key), secret,
  ...(demo ? { readWebsite: async () => ({ url:'https://example.com/', html:`<script type="application/ld+json">${JSON.stringify({ '@type':'CafeOrCoffeeShop', name:'Kopi Contoh (DEMO)', description:'Kopi dan makanan untuk komuniti setempat. Data contoh untuk menguji aliran sahaja.', logo:demoLogo, sameAs:['https://www.instagram.com/example/','https://www.facebook.com/example/','https://www.tiktok.com/@example','https://wa.me/60123456789'] })}</script>` }) } : {}) });
const windows = new Map();
let day = ''; let dayCount = 0;
function allow(remote) {
  const today = new Date().toISOString().slice(0,10);
  if (today !== day) { day = today; dayCount = 0; }
  const now = Date.now(); const previous = windows.get(remote);
  const state = !previous || now - previous.since >= 60000 ? { since:now, count:0 } : previous;
  windows.set(remote, state);
  if (windows.size > 10000) for (const [id, item] of windows) if (now - item.since > 60000) windows.delete(id);
  return ++state.count <= 12 && ++dayCount <= Number(process.env.MAX_DAILY_REQUESTS || 300);
}
function reply(res, status, data, origin) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store',
    'x-content-type-options':'nosniff', ...(origin ? { 'access-control-allow-origin':origin, vary:'Origin' } : {}) });
  res.end(JSON.stringify({ ...data, ...(demo ? { demo:true } : {}) }));
}
async function body(req) {
  let length = 0; const chunks = [];
  for await (const chunk of req) { length += chunk.length; if (length > 4096) throw Object.assign(new Error('Permintaan terlalu besar.'),{status:413}); chunks.push(chunk); }
  try { const value=JSON.parse(Buffer.concat(chunks).toString('utf8')); if(!value || typeof value!=='object' || Array.isArray(value)) throw 0; return value; }
  catch { throw Object.assign(new Error('Permintaan tidak sah.'),{status:400}); }
}
const server = http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const origin = origins.has(req.headers.origin) ? req.headers.origin : null;
  try {
    if (path === '/health') return reply(res, 200, { ready:!!key, demo }, origin);
    if (path.startsWith('/api/')) {
      if (!origin) return reply(res, 403, { error:'Akses tidak dibenarkan.' });
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin':origin, 'access-control-allow-methods':'POST', 'access-control-allow-headers':'Content-Type', vary:'Origin' }); res.end(); return; }
      if (req.method !== 'POST') return reply(res, 405, { error:'Kaedah tidak dibenarkan.' }, origin);
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(res, 415, { error:'Gunakan JSON.' }, origin);
      if (!allow(req.socket.remoteAddress)) return reply(res, 429, { error:'Had carian dicapai. Cuba sebentar lagi.' }, origin);
      const data = await body(req);
      if (path === '/api/search') return reply(res, 200, await service.search(data.query), origin);
      if (path === '/api/import') return reply(res, 200, await service.import(data.token), origin);
      return reply(res, 404, { error:'Tidak ditemui.' }, origin);
    }
    if (preview && ['GET','HEAD'].includes(req.method)) {
      const relative = decodeURIComponent(path === '/' ? '/index.html' : path).slice(1);
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep) || !/^(?:index\.html|setup\.html|privacy\.html|terms\.html|import-config\.js|business-(?:import|logo|entry)\.(?:js|css)|assets\/[\w.-]+)$/.test(relative)) return reply(res,404,{error:'Tidak ditemui.'});
      const bytes = await readFile(file);
      res.writeHead(200, { 'content-type':({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream', 'cache-control':'no-store' });
      res.end(req.method === 'HEAD' ? undefined : bytes); return;
    }
    reply(res,404,{error:'Tidak ditemui.'});
  } catch(error) {
    const status = Number(error.status) || 502;
    reply(res, status, { error: status < 500 || status === 503 ? error.message : 'Perkhidmatan tidak tersedia sekarang. Cuba lagi atau isi secara manual.' }, origin);
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, preview ? '127.0.0.1' : '0.0.0.0', () => console.log(JSON.stringify({ port, preview, demo, ready:!!key })));
