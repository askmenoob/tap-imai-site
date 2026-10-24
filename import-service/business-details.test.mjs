import test from 'node:test';
import assert from 'node:assert/strict';
import {formatHours,readHours,formatAddress,readAddress,defaultSchedule,timeSlots} from '../src/business-details-values.mjs';
import {validateSmartTapURL} from './short-links.mjs';
import {decodeProfilePayload} from '../src/public-profile.mjs';
test('address dropdown output preserves multiple address lines through existing server and public profile formats',()=>{
 const data={line1:'12, Jalan Ujian',line2:'Taman Contoh',postcode:'40460',city:'Shah Alam',state:'Selangor'};
 const address=formatAddress(data);assert.deepEqual(readAddress(address),data);
 const profile={v:1,name:'Kedai Ujian',google:'https://search.google.com/local/writereview?placeid=ChIJTest1234',address,hours:'Setiap hari: 08:00–22:00'};
 const payload=Buffer.from(JSON.stringify(profile)).toString('base64url');assert.equal(validateSmartTapURL('https://tap.imai.my/?p='+payload),'https://tap.imai.my/?p='+payload);assert.equal(decodeProfilePayload(payload).address,address);
 for(const changes of [{postcode:'123'},{state:'Wrong'},{city:''},{line1:'x'.repeat(241)}])assert.throws(()=>formatAddress({...data,...changes}));
});
test('day groups and weekly schedules round trip open, closed, 24-hour and overnight periods within the stored limit',()=>{
 const schedule=defaultSchedule();schedule[0]={state:'open',open:'22:00',close:'02:00'};schedule[1]={state:'closed'};schedule[2]={state:'all'};
 for(const mode of ['daily','weekdays','weekends','weekly']){const value=formatHours(mode,schedule);assert.ok(value.length<=240);const parsed=readHours(value);assert.equal(parsed.mode,mode);assert.equal(formatHours(parsed.mode,parsed.schedule),value);}
 assert.equal(formatHours('daily',schedule),'Setiap hari: 22:00–02:00');assert.match(formatHours('weekly',schedule),/Selasa: Tutup; Rabu: 24 jam/);
});
test('ambiguous equal times and invalid time values cannot generate a misleading schedule',()=>{
 for(const value of [{state:'open',open:'08:00',close:'08:00'},{state:'open',open:'25:00',close:'10:00'},{state:'wrong'}]){const schedule=defaultSchedule();schedule[0]=value;assert.throws(()=>formatHours('daily',schedule));}
 assert.equal(timeSlots.length,48);assert.equal(timeSlots[0],'00:00');assert.equal(timeSlots.at(-1),'23:30');
 assert.equal(readHours('Setiap hari: 08:15–22:45').schedule[0].open,'08:15');
});
test('legacy and empty business details stay custom rather than being guessed or silently replaced',()=>{
 for(const value of ['', '8am to 10pm','Isnin–Sabtu: 9 pagi–6 petang'])assert.equal(readHours(value),null);
 for(const value of ['', 'tesd','No. 10 Jalan Contoh, Selangor'])assert.equal(readAddress(value),null);
});
