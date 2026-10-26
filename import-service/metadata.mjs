import { load } from 'cheerio';
import { safeWebURL } from './safe-fetch.mjs';
import { threadsProfile, xProfile, malaysiaPhone } from './contacts.mjs';

export function socialType(value) {
  const u = safeWebURL(value);
  if (!u) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'instagram.com' && /^\/[A-Za-z0-9._]{1,30}\/?$/.test(u.pathname) && !/^\/(?:p|reel|reels|stories|explore|accounts|about|legal|privacy)\/?$/i.test(u.pathname)) return 'instagram';
  if ((host === 'facebook.com' || host === 'fb.com') && u.pathname !== '/' && !/^\/(?:sharer|sharer.php|dialog|share.php|plugins|login|help|privacy|policies|reel|reels|watch|groups|share)(?:\/|$)/i.test(u.pathname)) return 'facebook';
  if (host === 'tiktok.com' && /^\/@[^/]+\/?$/.test(u.pathname)) return 'tiktok';
  if (xProfile(u.href)) return 'x';
  if (threadsProfile(u.href)) return 'threads';
  if (host === 'wa.me' && /^\/\d{7,15}\/?$/.test(u.pathname)) return 'whatsapp';
  if (host === 'api.whatsapp.com' && /^\/send\/?$/.test(u.pathname) && /^\+?\d{7,15}$/.test(u.searchParams.get('phone') || '')) return 'whatsapp';
  return null;
}

export function extractMetadata(html, website) {
  const $ = load(html);
  const text = value => String(value || '').replace(/\s+/g, ' ').trim();
  const meta = key => $('meta').toArray().find(el =>
    String($(el).attr('property') || $(el).attr('name') || '').toLowerCase() === key);
  const metaValue = key => text($(meta(key)).attr('content'));
  const schemas = [];
  function collect(node, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 8) return;
    if (Array.isArray(node)) { node.forEach(x => collect(x, depth + 1)); return; }
    const types = [node['@type']].flat().filter(Boolean);
    if (types.some(type => /Organization|LocalBusiness|Restaurant|CafeOrCoffeeShop|Store|Corporation|Hotel|ProfessionalService|FoodEstablishment/i.test(type))) schemas.push(node);
    if (node['@graph']) collect(node['@graph'], depth + 1);
    if (node.mainEntity) collect(node.mainEntity, depth + 1);
    if (node.publisher) collect(node.publisher, depth + 1);
  }
  $('script[type="application/ld+json"]').each((_i, el) => {
    try { collect(JSON.parse($(el).text())); } catch { /* Ignore malformed markup. */ }
  });
  const profile = { website: new URL(website).href };
  const sources = { website: website };
  const candidates = { instagram: [], facebook: [], tiktok: [], threads: [], x: [], whatsapp: [] };
  const addSocial = raw => {
    const u = safeWebURL(typeof raw === 'string' ? raw : '', website);
    const kind = u && socialType(u.href);
    if (!kind || u.href.length > 500) return;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (/^(?:utm_|fbclid|igsh)/i.test(key)) u.searchParams.delete(key);
    if (!candidates[kind].includes(u.href)) candidates[kind].push(u.href);
  };
  for (const schema of schemas) for (const url of [schema.sameAs].flat()) addSocial(url);
  $('a[href]').each((_i, el) => addSocial($(el).attr('href')));
  for (const [key, values] of Object.entries(candidates)) {
    if (values.length === 1) { profile[key] = values[0]; sources[key] = website; }
  }
  const schema = schemas.find(s => s.logo || s.sameAs || s.description) || schemas[0] || {};
  const phone = malaysiaPhone(schema.telephone);
  if (phone) {profile.phone=phone; sources.phone=website;}
  const name = text(schema.name || metaValue('og:site_name'));
  if (name && [...name].length <= 80) { profile.name = name; sources.name = website; }
  const description = text(schema.description || metaValue('description') || metaValue('og:description'));
  if (description) {
    profile.tagline = description.length > 140 ? description.slice(0, 137).replace(/\s+\S*$/, '') + '…' : description;
    sources.tagline = website;
  }
  // A storefront photo or category icon is not a business logo.
  const headerLogo=$('header img, a[rel="home"] img, [class*="logo"] img').toArray().find(el => {
    const mark=[$(el).attr('alt'),$(el).attr('class'),$(el).attr('src'),$(el).attr('data-src')].filter(Boolean).join(' ');
    return /logo|brand/i.test(mark) && !/facebook|instagram|tiktok|whatsapp|payment|mastercard|visa/i.test(mark);
  });
  const logoValue = (typeof schema.logo === 'string' ? schema.logo : schema.logo?.url || schema.logo?.contentUrl) ||
    $(headerLogo).attr('data-src') || $(headerLogo).attr('src');
  const logo = safeWebURL(logoValue || $('link[rel~="apple-touch-icon"]').first().attr('href') || '', website);
  if (logo && logo.href !== new URL(website).href && logo.href.length <= 500) { profile.logo = logo.href; sources.logo = website; }
  return { profile, sources, candidates };
}
