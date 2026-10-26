import {safeWebURL} from './safe-fetch.mjs';
export function brandColor(value){
 if(typeof value!=='string')return null;const s=value.trim();let m=/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(s);if(m)return '#'+(m[1].length===3?[...m[1]].map(x=>x+x).join(''):m[1]).toLowerCase();
 m=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(s);if(m&&m.slice(1).every(n=>Number(n)<=255))return '#'+m.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join('');return null;
}
const light=color=>{const a=color.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];};
const property=(text,key)=>{const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[;{])\\s*'+escaped+'\\s*:\\s*([^;}!]+)','i').exec(text||'')?.[1]?.trim();};
export function extractBrandAppearance($,website,{logo=''}={}){
 const profile={},sources={};const meta=name=>$('meta').toArray().find(n=>String($(n).attr('name')||$(n).attr('property')||'').toLowerCase()===name);const content=name=>$(meta(name)).attr('content')||'';
 let background=brandColor(property($('body').attr('style'),'background-color')||property($('body').attr('style'),'background'));
 const styles=$('style').toArray().slice(0,20).map(n=>$(n).text()).join('\n').slice(0,100000);
 let accent=brandColor(property(styles,'--brand-color')||property(styles,'--primary-color')||property(styles,'--color-primary'));
 let linktree=null;
 if(new URL(website).hostname==='linktr.ee')try{linktree=JSON.parse($('#__NEXT_DATA__').text()).props?.pageProps;const theme=linktree?.theme||linktree?.account?.theme;background=brandColor(theme?.background?.color)||background;accent=brandColor(theme?.buttonStyle?.backgroundStyle?.color)||accent;}catch{}
 if(!background){const body=/body\s*\{([^}]{0,6000})\}/i.exec(styles)?.[1];background=brandColor(property(body,'background-color')||property(body,'background'));}
 const themeColor=brandColor(content('theme-color')||content('msapplication-TileColor'));background=background||themeColor;
 if(background){profile.theme=light(background)<.18?'dark':'bright';sources.theme=website;}
 if(!accent&&themeColor&&light(themeColor)>.025&&light(themeColor)<.8){const rgb=themeColor.slice(1).match(/../g).map(x=>parseInt(x,16));if(Math.max(...rgb)-Math.min(...rgb)>20)accent=themeColor;}
 if(accent){profile.accent=accent;sources.accent=website;}
 const avatar=linktree?.account?.profilePictureUrl;
 const avatarURL=avatar&&safeWebURL(avatar,website);if(avatarURL&&avatarURL.href.length<=500){profile.logo=avatarURL.href;sources.logo=website;}
 const banner=linktree?.account?.bannerImage;
 const hero=$('header img, .hero img, [class*="hero"] img, [class*="cover"] img').toArray().find(n=>{const mark=[$(n).attr('class'),$(n).attr('alt'),$(n).attr('src')].join(' ');return !/logo|avatar|icon|badge/i.test(mark)&&(/hero|cover|banner/i.test(mark)||Number($(n).attr('width'))>=600);});
 const candidates=[typeof banner==='string'?banner:banner?.url,content('og:image:secure_url'),content('og:image'),content('twitter:image'),$(hero).attr('src')];
 const width=Number(content('og:image:width')),height=Number(content('og:image:height'));
 for(const value of candidates){if(!value)continue;const u=safeWebURL(value,website);if(!u||u.href.length>500||u.href===logo||u.href===avatar||/\.svg(?:[?#]|$)/i.test(u.href))continue;if(value===content('og:image')&&width&&height&&width/height<1.2)continue;profile.cover=u.href;sources.cover=website;break;}
 return {profile,sources};
}
