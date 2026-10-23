import test from 'node:test';
import assert from 'node:assert/strict';
import {translateUI} from '../language-catalog.mjs';

test('language selection translates customer actions and annual status while retaining amounts',()=>{
  assert.equal(translateUI('Renew / beli add-on','en'),'Renew / buy add-ons');
  assert.equal(translateUI('Halaman tahunan · tamat 24 Oktober 2027','en'),'Annual page · expires 24 October 2027');
  assert.equal(translateUI('Jumlah produk: RM 30.00','en'),'Product total: RM 30.00');
});
test('customer names and transaction references inside generated labels remain literal',()=>{
  assert.equal(translateUI('Urus Aktif','en'),'Manage Aktif');
  assert.equal(translateUI('Gambar cover Pakej','en'),'Cover image for Pakej');
  assert.equal(translateUI('Bayaran disahkan · RM 100.00 · Aktif · Pakej','en'),'Payment confirmed · RM 100.00 · Aktif · Pakej');
});
test('Malay and unknown text remain unchanged without HTML interpretation',()=>{
  assert.equal(translateUI('Nama perniagaan','ms'),'Nama perniagaan');
  assert.equal(translateUI('<img src=x onerror=alert(1)>','en'),'<img src=x onerror=alert(1)>');
  assert.equal(translateUI('Loffee Coffee Jalan Kebun','en'),'Loffee Coffee Jalan Kebun');
});
