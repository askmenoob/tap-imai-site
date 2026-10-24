export function safeAppearanceURL(value) {
  try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null; } catch{return null;}
}
export function mapsAddressURL(address) {
  return address.trim()?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address.trim()):'';
}
export function malaysiaDateTime(now=Date.now()) {
  return new Date(now+8*3600000).toISOString().slice(0,16);
}
export function promotionRange(days,now=Date.now()) {
  return {promoStart:malaysiaDateTime(now),promoEnd:malaysiaDateTime(now+days*86400000)};
}
export function promotionState(profile,now=Date.now()) {
  if(!profile.promoTitle?.trim())return 'empty';
  const start=profile.promoStart?Date.parse(profile.promoStart+'+08:00'):-Infinity;
  const end=profile.promoEnd?Date.parse(profile.promoEnd+'+08:00'):Infinity;
  if(Number.isNaN(start)||Number.isNaN(end)||end<=start)return 'invalid';
  return now<start?'scheduled':now>=end?'expired':'active';
}
