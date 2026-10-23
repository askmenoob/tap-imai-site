import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleProvider} from './google.mjs';

test('Places provider uses a short-lived OAuth token and quota project without an API key',async()=>{
  const calls=[];
  const provider=createGoogleProvider({getToken:async()=> 'oauth-token',quotaProject:'test-project'},{fetcher:async(url,options)=>{
    calls.push({url,options});return new Response(JSON.stringify({places:[]}),{status:200,headers:{'content-type':'application/json'}});
  }});
  await provider.search('Loffee Coffee');
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.headers.Authorization,'Bearer oauth-token');
  assert.equal(calls[0].options.headers['X-Goog-User-Project'],'test-project');
  assert.equal(calls[0].options.headers['X-Goog-Api-Key'],undefined);
});

test('Places provider retains API-key support for explicit local operation',async()=>{
  const calls=[];
  const provider=createGoogleProvider('test-key',{fetcher:async(url,options)=>{
    calls.push({url,options});return new Response(JSON.stringify({places:[]}),{status:200,headers:{'content-type':'application/json'}});
  }});
  await provider.search('Loffee Coffee');
  assert.equal(calls[0].options.headers['X-Goog-Api-Key'],'test-key');
  assert.equal(calls[0].options.headers.Authorization,undefined);
});
