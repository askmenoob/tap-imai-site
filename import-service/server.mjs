import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { createGoogleProvider } from './google.mjs';
import { createImportService } from './service.mjs';
import { createGoogleWebSearch, runtimeToken } from './google-web.mjs';
import { createShortLinks, createCloudLinkStore, createMemoryLinkStore } from './short-links.mjs';
import { createGoogleAdminAuth, createAdminService } from './admin.mjs';
import { createGoogleUserAuth } from './identity.mjs';
import { createCustomerService } from './customers.mjs';
import { createAccountRoutes } from './account-routes.mjs';
import {createManagementService} from './management.mjs';
import {paymentQR} from './payment-qr.mjs';

const preview = process.argv.includes('--preview');
const demo = preview && process.env.PREVIEW_DEMO === '1';
const paymentsEnabled=demo||process.env.PAYMENTS_ENABLED==='true';
const newSubscription=paymentsEnabled?{plan:'annual',startsAt:null,expiresAt:null}:null;
const port = Number(process.env.PORT || 8787);
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const key = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
const secret = (process.env.IMPORT_SIGNING_SECRET || (preview ? randomBytes(32).toString('hex') : '')).trim();
if (!preview && (!key || secret.length < 32)) throw new Error('Configure GOOGLE_PLACES_API_KEY and IMPORT_SIGNING_SECRET before starting.');
const origins = new Set((process.env.ALLOWED_ORIGINS || 'https://tap.imai.my').split(',').map(s => s.trim()));
if (preview) origins.add('http://127.0.0.1:' + port);
const linkStore=demo?createMemoryLinkStore():
  process.env.SHORT_LINK_BUCKET?createCloudLinkStore({bucket:process.env.SHORT_LINK_BUCKET,getToken:runtimeToken}):null;
const shortLinks=linkStore?createShortLinks({store:linkStore,secret,origin:preview?'http://127.0.0.1:'+port:'https://tap.imai.my',newSubscription}):null;
const adminClientId=(process.env.ADMIN_GOOGLE_CLIENT_ID||'').trim();
const adminEmails=(process.env.ADMIN_EMAILS||'').split(',');
const adminAuth=createGoogleAdminAuth({clientId:adminClientId,emails:adminEmails});
const userAuth=createGoogleUserAuth({clientId:adminClientId});
const admin=linkStore?createAdminService({store:linkStore,origin:preview?'http://127.0.0.1:'+port:'https://tap.imai.my'}):null;
const customers=linkStore?createCustomerService({store:linkStore,origin:preview?'http://127.0.0.1:'+port:'https://tap.imai.my',newSubscription}):null;
const management=linkStore?createManagementService({store:linkStore,origin:preview?'http://127.0.0.1:'+port:'https://tap.imai.my',enabled:paymentsEnabled,qrPayload:paymentQR}):null;
const accountRoutes=createAccountRoutes({adminAuth,userAuth,admin,customers,management,clientId:adminClientId,adminConfigured:!!adminClientId&&adminEmails.some(email=>email.trim()),demo,reply,body});
const demoLogo = 'https://placehold.co/160x160/173b33/ffffff.png?text=DEMO';
const fixture = {
  suggest:async query => query.toLowerCase().includes('tiada') ? [] : [
    {id:'DemoPlaceId1234',name:'Kopi Contoh Shah Alam (DEMO)',address:'Shah Alam, Selangor — data contoh',attributions:[]},
    {id:'DemoPlaceId5678',name:'Kopi Contoh Petaling Jaya (DEMO)',address:'Petaling Jaya, Selangor — data contoh',attributions:[]},
  ],
  search: async query => query.toLowerCase().includes('tiada') ? [] : [{ id:'DemoPlaceId1234', name:'Kopi Contoh (DEMO)', address:'Lokasi contoh — bukan hasil Google sebenar', attributions:[] }],
  details: async id => ({ id, website:'https://example.com/',phone:'012-2258950' }),
};
const service = createImportService({ google: demo ? fixture : createGoogleProvider(key), secret,
  ...(!demo && process.env.GOOGLE_SEARCH_ENABLED==='true' ? {webSearch:createGoogleWebSearch({project:process.env.GOOGLE_SEARCH_PROJECT,model:process.env.GOOGLE_SEARCH_MODEL || 'gemini-3.8-flash'})} : {}),
  ...(demo ? { readWebsite: async () => ({ url:'https://example.com/', html:`<script type="application/ld+json">${JSON.stringify({ '@type':'CafeOrCoffeeShop', name:'Kopi Contoh (DEMO)', description:'Kopi dan makanan untuk komuniti setempat. Data contoh untuk menguji aliran sahaja.', logo:demoLogo, sameAs:['https://www.instagram.com/example/','https://www.facebook.com/example/','https://www.tiktok.com/@example','https://wa.me/60123456789'] })}</script>` }) } : {}) });
const windows = new Map();
let day = ''; let dayCount = 0;
function allow(remote, suggestions = false) {
  const today = new Date().toISOString().slice(0,10);
  if (today !== day) { day = today; dayCount = 0; }
  const bucket=remote+(suggestions?':suggest':':lookup');
  const now = Date.now(); const previous = windows.get(bucket);
  const state = !previous || now - previous.since >= 60000 ? { since:now, count:0 } : previous;
  windows.set(bucket, state);
  if (windows.size > 10000) for (const [id, item] of windows) if (now - item.since > 60000) windows.delete(id);
  return ++state.count <= (suggestions?30:12) && ++dayCount <= Number(process.env.MAX_DAILY_REQUESTS || 300);
}
function reply(res, status, data, origin) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store',
    'x-content-type-options':'nosniff', ...(origin ? { 'access-control-allow-origin':origin, vary:'Origin' } : {}) });
  res.end(JSON.stringify({ ...data, ...(demo ? { demo:true } : {}) }));
}
async function body(req,limit=4096) {
  let length = 0; const chunks = [];
  for await (const chunk of req) { length += chunk.length; if (length > limit) throw Object.assign(new Error('Permintaan terlalu besar.'),{status:413}); chunks.push(chunk); }
  try { const value=JSON.parse(Buffer.concat(chunks).toString('utf8')); if(!value || typeof value!=='object' || Array.isArray(value)) throw 0; return value; }
  catch { throw Object.assign(new Error('Permintaan tidak sah.'),{status:400}); }
}
const server = http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const origin = origins.has(req.headers.origin) ? req.headers.origin : null;
  try {
    if (path === '/health') return reply(res, 200, { ready:!!key, demo, shortLinks:!!shortLinks }, origin);
    if(await accountRoutes(req,res,{path,origin}))return;
    if(path.startsWith('/api/links/')&&req.method==='GET') {
      if(req.headers.origin&&!origin) return reply(res,403,{error:'Akses tidak dibenarkan.'});
      if(!shortLinks) return reply(res,503,{error:'Pautan pendek belum tersedia.'},origin);
      return reply(res,200,await shortLinks.resolve(path.slice('/api/links/'.length)),origin);
    }
    if (path.startsWith('/api/')) {
      if (!origin) return reply(res, 403, { error:'Akses tidak dibenarkan.' });
      if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin':origin, 'access-control-allow-methods':'POST', 'access-control-allow-headers':'Content-Type', vary:'Origin' }); res.end(); return; }
      if (req.method !== 'POST') return reply(res, 405, { error:'Kaedah tidak dibenarkan.' }, origin);
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(res, 415, { error:'Gunakan JSON.' }, origin);
      if (!allow(req.socket.remoteAddress, path === '/api/suggest')) return reply(res, 429, { error:'Had carian dicapai. Cuba sebentar lagi.' }, origin);
      const data = await body(req,path==='/api/shorten'?8192:4096);
      if(path==='/api/shorten') {
        if(!shortLinks) return reply(res,503,{error:'Pautan pendek belum tersedia. Cuba lagi sebentar.'},origin);
        return reply(res,200,await shortLinks.shorten(data.url),origin);
      }
      if (path === '/api/suggest') return reply(res, 200, await service.suggest(data.query, data.sessionToken), origin);
      if (path === '/api/search') return reply(res, 200, await service.search(data.query), origin);
      if (path === '/api/import') return reply(res, 200, await service.import(data.token), origin);
      return reply(res, 404, { error:'Tidak ditemui.' }, origin);
    }
    if (preview && ['GET','HEAD'].includes(req.method)) {
      if(path==='/edit'||path==='/subscribe'){res.writeHead(301,{location:path+'/'});res.end();return;}
      if(path==='/edit/')req.url='/edit/index.html';
      const relative = decodeURIComponent(path==='/'?'/index.html':path==='/edit/'?'/edit/index.html':path==='/subscribe/'?'/subscribe/index.html':path).slice(1);
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep) || !/^(?:index\.html|edit\/index\.html|subscribe\/index\.html|subscribe\.css|setup\.html|admin\.html|privacy\.html|terms\.html|import-config\.js|manifest\.webmanifest|pwa\.(?:js|css)|sw\.js|offline\.html|business-(?:import|logo|entry|admin|subscribe)\.(?:js|css)|assets\/[\w.-]+)$/.test(relative)) return reply(res,404,{error:'Tidak ditemui.'});
      const bytes = await readFile(file);
      res.writeHead(200, { 'content-type':({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.jpeg':'image/jpeg'})[extname(file)] || 'application/octet-stream', 'cache-control':'no-store' });
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
