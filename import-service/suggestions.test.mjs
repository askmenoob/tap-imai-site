import test from 'node:test';
import assert from 'node:assert/strict';
import { createSuggestions } from '../src/business-suggestions.mjs';
import { createImportService } from './service.mjs';
import { createGoogleProvider } from './google.mjs';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
test('typing a full name makes one request after a pause, not one per key', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const requested=[]; const results=[];
  const suggestions=createSuggestions({request:async query=>{requested.push(query);return {places:[query]};},onResult:data=>results.push(data)});
  for(const value of ['l','lo','lof','loff','loffee']) {suggestions.update(value);t.mock.timers.tick(100);}
  assert.equal(requested.length,0);
  t.mock.timers.tick(600); await flush();
  assert.deepEqual(requested,['loffee']); assert.equal(results.length,1);
  suggestions.cancel();
});
test('an older response cannot replace suggestions for the current business name', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const pending=[]; const results=[];
  const suggestions=createSuggestions({request:(query,signal)=>new Promise(resolve=>pending.push({query,signal,resolve})),onResult:data=>results.push(data)});
  suggestions.update('loffee'); t.mock.timers.tick(600);
  suggestions.update('loffee coffee'); t.mock.timers.tick(600);
  assert.equal(pending[0].signal.aborted,true);
  pending[1].resolve({places:['current']}); await flush();
  pending[0].resolve({places:['old']}); await flush();
  assert.deepEqual(results,[{places:['current']}]); suggestions.cancel();
});
test('clearing or shortening the name cancels pending work and makes no request', async t => {
  t.mock.timers.enable({apis:['setTimeout']}); let calls=0;
  const suggestions=createSuggestions({request:async()=>{calls++;return {};},onResult:()=>{}});
  suggestions.update('coffee'); suggestions.update('co'); t.mock.timers.tick(2000); await flush();
  assert.equal(calls,0); suggestions.cancel();
});
test('repeat names use session cache and a new session discards it', async t => {
  t.mock.timers.enable({apis:['setTimeout']}); let calls=0;
  const suggestions=createSuggestions({request:async()=>{calls++;return {places:[]};},onResult:()=>{}});
  suggestions.update('Loffee');t.mock.timers.tick(600);await flush();
  suggestions.update('loffee');await flush();assert.equal(calls,1);
  suggestions.reset();suggestions.update('Loffee');t.mock.timers.tick(600);await flush();assert.equal(calls,2);suggestions.cancel();
});
test('selecting a prediction imports its exact place and closes the same Google session',async()=>{
  const session='11111111-2222-4333-8444-555555555555'; let imported;
  const service=createImportService({secret:'s'.repeat(32),google:{
    suggest:async(query,token)=>{assert.equal(query,'loffee');assert.equal(token,session);return [{id:'ChIJL91qoRStzTERuYqPvbxehnM',name:'Loffee Coffee',address:'Shah Alam'}];},
    details:async(id,token)=>{imported={id,token};return {id,website:''};},
  }});
  const predictions=await service.suggest('loffee',session);
  assert.equal(imported,undefined);
  const profile=await service.import(predictions.places[0].token);
  assert.deepEqual(imported,{id:'ChIJL91qoRStzTERuYqPvbxehnM',token:session});
  assert.equal(profile.profile.name,'Loffee Coffee');
  assert.equal(profile.profile.google,'https://search.google.com/local/writereview?placeid=ChIJL91qoRStzTERuYqPvbxehnM');
});
test('invalid suggestion query or session is rejected before a provider request',async()=>{
  let called=false;const service=createImportService({secret:'s'.repeat(32),google:{suggest:async()=>{called=true;return [];}}});
  await assert.rejects(service.suggest('lo','11111111-2222-4333-8444-555555555555'));
  await assert.rejects(service.suggest('loffee','not-a-session'));
  assert.equal(called,false);
});
test('Google autocomplete returns business names and addresses, excluding address-only results',async()=>{
  let request;
  const provider=createGoogleProvider('test-key',{fetcher:async(url,options)=>{
    request={url,body:JSON.parse(options.body)};
    return {ok:true,json:async()=>({suggestions:[
      {placePrediction:{placeId:'Business1234',types:['establishment'],structuredFormat:{mainText:{text:'Loffee Coffee'},secondaryText:{text:'Shah Alam, Selangor'}}}},
      {placePrediction:{placeId:'Address1234',types:['street_address'],text:{text:'A street address'}}},
    ]})};
  }});
  const places=await provider.suggest('loffee','11111111-2222-4333-8444-555555555555');
  assert.equal(request.url,'https://places.googleapis.com/v1/places:autocomplete');
  assert.equal(request.body.input,'loffee');assert.equal(request.body.sessionToken,'11111111-2222-4333-8444-555555555555');
  assert.deepEqual(places.map(p=>[p.id,p.name,p.address]),[['Business1234','Loffee Coffee','Shah Alam, Selangor']]);
});
test('Google details receives the selected autocomplete session token',async()=>{
  let actualURL;
  const provider=createGoogleProvider('test-key',{fetcher:async url=>{actualURL=url;return {ok:true,json:async()=>({id:'Business1234'})};}});
  await provider.details('Business1234','11111111-2222-4333-8444-555555555555');
  assert.equal(new URL(actualURL).searchParams.get('sessionToken'),'11111111-2222-4333-8444-555555555555');
});
