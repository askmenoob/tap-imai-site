import sharp from 'sharp';
import {readFile} from 'node:fs/promises';

// Reuse the owner's selected transparent artwork; sizing never redraws the logo.
const original=readFile(new URL('./smarttap-selected.png',import.meta.url));
const mark=original.then(bytes=>sharp(bytes).trim({threshold:20}).png().toBuffer());
export async function createBrandMark(){
  return sharp(await mark).resize(256,256,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
}
export async function createAppIcon(size,{maskable=false}={}){
  if(![16,32,180,192,512].includes(size))throw new Error('Unsupported app icon size.');
  // A 56% square lies wholly inside the standard maskable safe circle (r=40%).
  const fraction=maskable?0.56:size<=32?0.88:0.76;
  const edge=Math.round(size*fraction);
  const image=await sharp(await mark).resize(edge,edge,{fit:'inside'}).png().toBuffer();
  return sharp({create:{width:size,height:size,channels:4,background:'#fffaf4'}}).composite([{input:image,gravity:'centre'}]).png().toBuffer();
}
export async function createFavicon(){
  const images=await Promise.all([16,32].map(size=>createAppIcon(size)));
  const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);
  let offset=header.length;
  images.forEach((bytes,index)=>{
    const pos=6+16*index,size=[16,32][index];header[pos]=size;header[pos+1]=size;
    header.writeUInt16LE(1,pos+4);header.writeUInt16LE(32,pos+6);header.writeUInt32LE(bytes.length,pos+8);header.writeUInt32LE(offset,pos+12);offset+=bytes.length;
  });
  return Buffer.concat([header,...images]);
}
