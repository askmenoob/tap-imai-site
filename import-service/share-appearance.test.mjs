import test from 'node:test';
import assert from 'node:assert/strict';
import {extractMetadata} from './metadata.mjs';
import {brandColor} from './brand-appearance.mjs';
import {createImportService} from './service.mjs';
import {createMemoryLinkStore,createShortLinks} from './short-links.mjs';
import {decodeProfilePayload} from '../src/public-profile.mjs';
import {canonicalShareURL,shareDestinations} from '../src/page-share.mjs';
const website='https://restaurant.example/';
const html='<meta name="theme-color" content="#111111"><style>:root{--brand-color:rgb(214,141,22)}</style><meta property="og:image" content="/restaurant.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">';
test('website theme, accent and cover are sourced, bounded and survive a short QR round trip',async()=>{
 const service=createImportService({secret:'s'.repeat(32),google:{search:async()=>[{id:'ChIJTest123456',name:'Restaurant'}],details:async()=>({id:'ChIJTest123456',website})},readWebsite:async()=>({html,url:website})});
 const selected=await service.search('Restaurant'),draft=await service.import(selected.places[0].token);assert.equal(draft.profile.theme,'dark');assert.equal(draft.profile.accent,'#d68d16');assert.equal(draft.profile.cover,website+'restaurant.jpg');assert.equal(draft.sources.cover,website);
 const store=createMemoryLinkStore(),links=createShortLinks({store,secret:'s'.repeat(32)});const p={v:1,...draft.profile};const short=await links.shorten('https://tap.imai.my/?p='+Buffer.from(JSON.stringify(p)).toString('base64url'));const resolved=await links.resolve(short.id);assert.equal(decodeProfilePayload(new URL(resolved.url).searchParams.get('p')).cover,p.cover);
});
test('structured Linktree appearance reads only known public fields, never treats its avatar as a cover',()=>{
 const data={props:{pageProps:{account:{profilePictureUrl:'https://images.example/logo.jpg'},theme:{background:{color:'#000'},buttonStyle:{backgroundStyle:{color:'#70541d'}}}}}};
 const result=extractMetadata('<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(data)+'</script><meta property="og:image" content="https://images.example/logo.jpg">','https://linktr.ee/restaurant');assert.equal(result.profile.theme,'dark');assert.equal(result.profile.accent,'#70541d');assert.equal(result.profile.logo,'https://images.example/logo.jpg');assert.equal(result.profile.cover,undefined);
});
test('missing or malicious appearance signals remain blank and private image URLs are rejected',()=>{
 for(const value of ['url(javascript:alert(1))','var(--evil)','red; background:url(http://127.0.0.1)','rgba(1,2,3,0)','rgb(300,0,0)'])assert.equal(brandColor(value),null);
 assert.equal(brandColor('#ABC'),'#aabbcc');
 for(const image of ['javascript:alert(1)','http://127.0.0.1/test.jpg','https://169.254.169.254/test.jpg','https://user:pass@images.example/a.jpg','data:image/png;base64,abc'])assert.equal(extractMetadata('<meta property="og:image" content="'+image+'">',website).profile.cover,undefined);
 const empty=extractMetadata('<p>No branding supplied</p>',website);for(const key of ['theme','accent','cover'])assert.equal(empty.profile[key],undefined);
 const square=extractMetadata('<meta property="og:image" content="/logo.jpg"><meta property="og:image:width" content="200"><meta property="og:image:height" content="200">',website);assert.equal(square.profile.cover,undefined);
});
test('share destinations use only a canonical short page URL, dropping tracking and private query values',()=>{
 const safe='https://tap.imai.my/?s=abcdefghijklmnop';assert.equal(canonicalShareURL(safe+'&email=private@gmail.com#fragment'),safe);
 const links=shareDestinations(safe+'&email=private@gmail.com','Kopi & Roti');for(const link of Object.values(links)){assert.equal(new URL(link).protocol,'https:');assert.ok(!decodeURIComponent(link).includes('private@gmail.com'));assert.ok(decodeURIComponent(link).includes(safe));}
 assert.match(links.x,/intent\/tweet/);assert.match(links.facebook,/sharer/);assert.match(links.whatsapp,/wa.me/);
 for(const value of ['https://evil.example/?s=abcdefghijklmnop','https://tap.imai.my/?p=encoded','https://tap.imai.my/?s=bad','https://user:pass@tap.imai.my/?s=abcdefghijklmnop']){assert.equal(canonicalShareURL(value),null);assert.throws(()=>shareDestinations(value,'Kopi'));}
});
