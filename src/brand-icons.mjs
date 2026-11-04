// Fixed vector artwork; never interpolate user input into SVG markup.
export function createBrandIcon(document,name){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const path=(d,colour)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill',colour);svg.append(p);};
 if(name==='google'){
  path('M22 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.6a4.8 4.8 0 0 1-2.1 3.2v2.6h3.4C21 18 22 15.4 22 12.2Z','#4285f4');
  path('M12 22c2.8 0 5.1-.9 6.9-2.4l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10.4 10.4 0 0 0 12 22Z','#34a853');
  path('M6.2 13.7a6 6 0 0 1 0-3.4V7.6H2.7a10.1 10.1 0 0 0 0 8.8Z','#fbbc05');
  path('M12 6c1.6 0 3 .6 4.1 1.6l3.1-3A10.3 10.3 0 0 0 12 2a10.4 10.4 0 0 0-9.3 5.6l3.5 2.7A6.1 6.1 0 0 1 12 6Z','#ea4335');
 }else{
  svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const p=document.createElementNS(ns,'path');p.setAttribute('d',name==='whatsapp'?'M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5a9 9 0 1 1 16.5-4.5ZM8 7c0 5 4 9 9 9l1-3-3-1-1 1-3-3 1-1-1-3Z':'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 7h.01');svg.append(p);
 }
 return svg;
}
