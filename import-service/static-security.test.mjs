import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Cloudflare Pages applies transport, CSP and anti-clickjacking headers to every page',async()=>{
  const headers=await readFile(new URL('../_headers',import.meta.url),'utf8');
  assert.match(headers,/^\/\*\r?\n/m);
  assert.match(headers,/Strict-Transport-Security: max-age=31536000/);
  assert.match(headers,/Content-Security-Policy: .*frame-ancestors 'none'/);
  assert.match(headers,/X-Frame-Options: DENY/);
  assert.match(headers,/X-Content-Type-Options: nosniff/);
  assert.match(headers,/Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\), usb=\(\)/);
  assert.doesNotMatch(headers,/script-src[^;\n]*'unsafe-inline'/);
});
