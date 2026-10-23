import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentPrompt} from '../src/payment-prompt.mjs';
const now=Date.parse('2026-10-24T00:00:00+08:00');
const annual=remaining=>({state:'active',subscription:{plan:'annual',expiresAt:new Date(now+remaining).toISOString()}});
test('renewal reminder starts exactly 30 days before expiry and stays absent for long-valid pages',()=>{
  assert.equal(paymentPrompt(annual(30*86400000+1),now).message,'');
  assert.equal(paymentPrompt(annual(365*86400000),now).label,'Renew / beli add-on');
  for(const remaining of [30*86400000,86400000,1])assert.match(paymentPrompt(annual(remaining),now).message,/semakin hampir/);
});
test('expired pages get a renewal prompt while disabled and NFC-only pages do not get false expiry reminders',()=>{
  assert.match(paymentPrompt({state:'expired',subscription:{plan:'annual'}},now).message,/telah tamat/);
  assert.equal(paymentPrompt({...annual(86400000),state:'disabled'},now).message,'');
  assert.equal(paymentPrompt({state:'nfc_only',subscription:{plan:'nfc_only'}},now).message,'');
  assert.equal(paymentPrompt({state:'pending'},now).label,'Beli pakej / add-on');
});
