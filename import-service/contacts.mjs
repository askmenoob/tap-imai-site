export function malaysiaPhone(value) {
  if(typeof value!=='string') return null;
  let number=value.trim().replace(/^tel:/i,'');
  if(!/^[+\d\s().-]+$/.test(number)) return null;
  number=number.replace(/[\s().-]/g,'');
  if(number.startsWith('0060')) number=number.slice(2);
  else if(number.startsWith('+60')) number=number.slice(1);
  else if(number.startsWith('0')) number='60'+number.slice(1);
  return /^60[1-9]\d{7,9}$/.test(number)?number:null;
}
export function whatsappFromPhone(value) {
  const number=malaysiaPhone(value); return number?'https://wa.me/'+number:null;
}
export function threadsProfile(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['threads.net','www.threads.net','threads.com','www.threads.com'].includes(url.hostname)&&/^\/@[\w.]+\/?$/.test(url.pathname)?url.href:null;}
  catch{return null;}
}

// Accept account profiles only, never posts, login/share routes or lookalike hosts.
export function xProfile(value) {
  try {
    const url=new URL(value);
    const reserved=new Set(['home','explore','search','notifications','messages','i','intent','share','login','logout','signup','settings','compose','hashtag','tos','privacy','about','help','jobs','download']);
    const handle=url.pathname.replace(/^\//,'').replace(/\/$/,'');
    return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&!url.search&&!url.hash&&['x.com','www.x.com','twitter.com','www.twitter.com'].includes(url.hostname)&&/^\/[A-Za-z0-9_]{1,15}\/?$/.test(url.pathname)&&!reserved.has(handle.toLowerCase())?url.href:null;
  }catch{return null;}
}
