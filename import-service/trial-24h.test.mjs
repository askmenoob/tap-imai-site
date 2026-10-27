import test from 'node:test';
import assert from 'node:assert/strict';
import {pageState,requirePublicPage} from './page-state.mjs';
const base=Date.parse('2026-10-27T12:00:00.000Z');
const trial={startedAt:new Date(base).toISOString(),expiresAt:new Date(base+86400000).toISOString()};
const pending={subscription:{plan:'annual',startsAt:null,expiresAt:null},trial};
test('trial expires at exactly 24 hours',()=>{
 assert.equal(pageState(pending,base),'active');
 assert.equal(pageState(pending,base+86399999),'active');
 assert.equal(pageState(pending,base+86400000),'expired');
 assert.throws(()=>requirePublicPage(pending,base+86400000),{status:403});
});
test('paid customer is not blocked by expired trial',()=>{
 assert.equal(pageState({...pending,subscription:{plan:'annual',expiresAt:new Date(base+365*86400000).toISOString(),lastPaymentId:'paid'}},base+2*86400000),'active');
});
test('disabled and deleted precedence',()=>{
 assert.equal(pageState({...pending,lifecycle:{state:'disabled'}},base),'disabled');
 assert.equal(pageState({...pending,lifecycle:{state:'deleted'}},base),'deleted');
});
test('historical pages unchanged',()=>{
 assert.equal(pageState({subscription:{plan:'annual',expiresAt:null}},base),'pending');
 assert.equal(pageState({},base),'active');
});
test('bad expiration fails closed',()=>assert.equal(pageState({...pending,trial:{expiresAt:'bad'}},base),'expired'));
