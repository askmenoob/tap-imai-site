import test from 'node:test';
import assert from 'node:assert/strict';
import {safeAppearanceURL,mapsAddressURL,promotionRange,promotionState} from '../src/appearance-controls-values.mjs';
import {promotionVisible,validateAppearance} from './appearance.mjs';

test('promotion schedule matches public visibility at Malaysia start/end boundaries',()=>{
 const p={promoTitle:'Offer',promoStart:'2026-10-25T09:00',promoEnd:'2026-10-26T09:00'};
 for(const [now,state,visible] of [['2026-10-25T00:59:59Z','scheduled',false],['2026-10-25T01:00:00Z','active',true],['2026-10-26T01:00:00Z','expired',false]]){
  assert.equal(promotionState(p,Date.parse(now)),state);assert.equal(promotionVisible(p,Date.parse(now)),visible);
 }
 assert.equal(promotionState({...p,promoEnd:p.promoStart}),'invalid');assert.equal(promotionState({...p,promoStart:'bad'}),'invalid');
 assert.equal(promotionState({promoTitle:''}),'empty');assert.equal(promotionState({promoTitle:'Always'}),'active');
 assert.equal(promotionState({promoTitle:'Start only',promoStart:'2026-10-25T09:00'},Date.parse('2026-10-25T01:00:00Z')),'active');
});
test('quick duration uses Malaysia wall time across month and year boundaries',()=>{
 const range=promotionRange(7,Date.parse('2026-12-31T18:35:27Z'));
 assert.deepEqual(range,{promoStart:'2027-01-01T02:35',promoEnd:'2027-01-08T02:35'});validateAppearance(range);
});
test('test links reject unsafe protocols and credentials; Maps directions safely encode full addresses',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,hello','http://example.com','https://user:pass@example.com',''])assert.equal(safeAppearanceURL(value),null);
 assert.equal(safeAppearanceURL('https://example.com/menu?a=1'),'https://example.com/menu?a=1');
 assert.equal(mapsAddressURL('  '),'');const url=new URL(mapsAddressURL('12, Jalan A & B\nShah Alam #3'));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('destination'),'12, Jalan A & B\nShah Alam #3');assert.equal(url.searchParams.get('api'),'1');
});
