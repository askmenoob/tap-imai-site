export async function generateShortPage(profile,{origin,shorten,qr,signal}) {
  const bytes=new TextEncoder().encode(JSON.stringify(profile));
  const encoded=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  if(encoded.length>16384)throw new Error('Maklumat terlalu panjang. Pendekkan penerangan atau pautan.');
  const original=new URL('/?p='+encoded,origin);
  const shortened=await shorten(original.href,signal);signal?.throwIfAborted();
  const link=new URL(shortened.url);
  if(link.origin!==origin||link.pathname!=='/'||link.hash||!/^[A-Za-z0-9_-]{16}$/.test(link.searchParams.get('s')||'')||[...link.searchParams.keys()].join()!=='s')throw new Error('URL pendek tidak sah. Cuba jana semula.');
  const png=await qr(link.href);signal?.throwIfAborted();
  return {url:link.href,png};
}
