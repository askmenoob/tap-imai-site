export const malaysiaStates=['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'];
export const days=['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'];
export const hourModes={daily:'Setiap hari',weekdays:'Isnin–Jumaat',weekends:'Sabtu–Ahad',weekly:'Mengikut hari',custom:'Teks sedia ada / tersuai'};
export const timeSlots=Array.from({length:48},(_,i)=>String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00'));
const validTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');
export function defaultSchedule(){return days.map(()=>({state:'open',open:'09:00',close:'18:00'}));}
function period(value){if(value.state==='closed')return 'Tutup';if(value.state==='all')return '24 jam';if(value.state!=='open'||!validTime(value.open)||!validTime(value.close)||value.open===value.close)throw Error('Semak waktu buka dan tutup. Pilih 24 jam jika dibuka sepanjang hari.');return value.open+'–'+value.close;}
export function formatHours(mode,schedule){
 let result;if(mode==='weekly')result=days.map((day,i)=>day+': '+period(schedule[i])).join('; ');
 else {if(!['daily','weekdays','weekends'].includes(mode))throw Error('Pilih jadual operasi.');result=hourModes[mode]+': '+period(schedule[0]);if(mode==='weekdays')result+='; Sabtu–Ahad: Tutup';if(mode==='weekends')result+='; Isnin–Jumaat: Tutup';}
 if(result.length>240)throw Error('Waktu operasi melebihi 240 aksara.');return result;
}
function readPeriod(value){if(value==='Tutup')return {state:'closed',open:'09:00',close:'18:00'};if(value==='24 jam')return {state:'all',open:'09:00',close:'18:00'};const match=/^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(value);return match&&validTime(match[1])&&validTime(match[2])&&match[1]!==match[2]?{state:'open',open:match[1],close:match[2]}:null;}
export function readHours(raw){
 for(const mode of ['daily','weekdays','weekends']){const prefix=hourModes[mode]+': ';if(!raw.startsWith(prefix))continue;const suffix=mode==='weekdays'?'; Sabtu–Ahad: Tutup':mode==='weekends'?'; Isnin–Jumaat: Tutup':'';if(suffix&&!raw.endsWith(suffix))continue;const value=readPeriod(raw.slice(prefix.length,suffix?-suffix.length:undefined));if(value)return {mode,schedule:days.map(()=>({...value}))};}
 const parts=raw.split('; ');if(parts.length!==7)return null;const schedule=parts.map((part,i)=>part.startsWith(days[i]+': ')?readPeriod(part.slice(days[i].length+2)):null);return schedule.every(Boolean)?{mode:'weekly',schedule}:null;
}
export function formatAddress({line1,line2='',postcode,city,state}){
 const clean=value=>typeof value==='string'?value.normalize('NFC').trim():'';line1=clean(line1);line2=clean(line2);city=clean(city);
 if(!line1||!/^\d{5}$/.test(postcode)||!city||!malaysiaStates.includes(state))throw Error('Lengkapkan alamat, poskod 5 digit, bandar dan negeri.');
 const result=[line1,line2,postcode+' '+city,state].filter(Boolean).join('\n');if(result.length>240)throw Error('Alamat terlalu panjang. Gunakan maksimum 240 aksara.');return result;
}
export function readAddress(raw){const lines=raw.split('\n');if(lines.length<3||lines.length>4||!malaysiaStates.includes(lines.at(-1)))return null;const match=/^(\d{5}) (.+)$/.exec(lines.at(-2));if(!match||!lines[0])return null;return {line1:lines[0],line2:lines.length===4?lines[1]:'',postcode:match[1],city:match[2],state:lines.at(-1)};}
