import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiscoveryQuota,createMemoryQuotaStore,createCloudQuotaStore,quotaClient,quotaLimits} from './quota.mjs';
import {createDiscoveryRoutes} from './discovery-routes.mjs';
const secret='quota-test-secret-'.repeat(3),req={socket:{remoteAddress:'198.51.100.1'},headers:{}};
const limits=(total=100)=>({total,daily:{suggest:100,search:100,import:100,create:100,shorten:100},minute:{suggest:100,search:100,import:100,create:100,shorten:100}});
test('shared persisted quota survives replacement limiter instances and resets on a new UTC date',async()=>{
  const store=createMemoryQuotaStore();let now=Date.UTC(2026,9,25);
  const make=()=>createDiscoveryQuota({store,secret,now:()=>now,limits:limits(2)});
  assert.equal(await make()(req,'suggest'),true);assert.equal(await make()(req,'import'),true);
  assert.equal(await make()(req,'create'),false);now+=86400000;assert.equal(await make()(req,'create'),true);
  const saved=await store.read('2026-10-25');assert.equal(saved.record.total,2);
  assert.ok(!JSON.stringify(saved).includes('198.51.100.1'));
});
test('concurrent reservations from separate instances never exceed shared total',async()=>{
  const store=createMemoryQuotaStore();const results=await Promise.all(Array.from({length:20},()=>createDiscoveryQuota({store,secret,limits:limits(7)})(req,'search')));
  assert.equal(results.filter(Boolean).length,7);
});
test('action daily caps and client minute caps are independent but share total',async()=>{
  const store=createMemoryQuotaStore(),config=limits();config.daily.import=1;config.minute.search=1;
  let now=Date.UTC(2026,9,25);const allow=createDiscoveryQuota({store,secret,limits:config,now:()=>now});
  assert.equal(await allow(req,'search'),true);assert.equal(await allow(req,'search'),false);
  assert.equal(await allow({...req,socket:{remoteAddress:'198.51.100.2'}},'search'),true);
  assert.equal(await allow(req,'import'),true);assert.equal(await allow({...req,socket:{remoteAddress:'198.51.100.2'}},'import'),false);
  now+=60000;assert.equal(await allow(req,'search'),true);
});
test('quota storage outages, corrupt records and CAS exhaustion fail closed',async()=>{
  for(const store of [{read:async()=>{throw new Error('credentials');}},{read:async()=>({record:null,revision:'0'}),write:async()=>{throw new Error('down');}},{read:async()=>({record:{total:-1},revision:'1'})},{read:async()=>({record:null,revision:'0'}),write:async()=>false}]){
    await assert.rejects(createDiscoveryQuota({store,secret,limits:limits()})(req,'search'),error=>error.status===503&&!error.message.includes('credentials'));
  }
});
test('client identity ignores spoofed forwarding outside Cloud Run and uses only appended valid rightmost IP inside it',()=>{
  const forwarded={...req,headers:{'x-forwarded-for':'203.0.113.6, 198.51.100.7','cf-connecting-ip':'192.0.2.90'}};
  assert.equal(quotaClient(forwarded),'198.51.100.1');assert.equal(quotaClient(forwarded,{cloudRun:true}),'198.51.100.7');
  for(const value of ['203.0.113.6,','bad, 198.51.100.7','198.51.100.7:123','unknown','\r\n198.51.100.1',Array(34).fill('1.1.1.1').join(','),['1.1.1.1']]){
    assert.equal(quotaClient({...req,headers:{'x-forwarded-for':value}},{cloudRun:true}),'invalid-forwarded-client');
  }
  assert.equal(quotaClient({...req,headers:{'x-forwarded-for':'2001:db8::1'}},{cloudRun:true}),'2001:db8::1');
});
test('limit environment configuration fails startup on malformed, zero or excessive values',()=>{
  assert.equal(quotaLimits().total,300);
  for(const value of ['0','-1','Infinity','1.5','300abc','100001'])assert.throws(()=>quotaLimits({MAX_DAILY_REQUESTS:value}));
  assert.throws(()=>quotaLimits({QUOTA_MINUTE_SEARCH:'1001'}));
  assert.equal(quotaLimits({QUOTA_DAILY_IMPORT:'45'}).daily.import,45);
});
test('cloud quota store uses generation guards and encoded fixed quota namespace',async()=>{
  const calls=[];const store=createCloudQuotaStore({bucket:'test-store',getToken:async()=>'not-a-real-token',fetcher:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,status:200,json:async()=>calls.length===1?{generation:'42'}:calls.length===2?{v:1}:{generation:'43'}};}});
  assert.deepEqual(await store.read('2026-10-25'),{record:{v:1},revision:'42'});
  assert.equal(await store.write('2026-10-25',{v:1},'42'),true);
  assert.match(calls[1].url,/generation=42/);assert.match(calls[2].url,/ifGenerationMatch=42/);
  assert.equal(new URL(calls[2].url).searchParams.get('name'),'quotas/discovery/2026-10-25.json');
  await assert.rejects(store.read('../links/private'));
});
test('discovery awaits an async quota denial before invoking a provider',async()=>{
  let called=false,response,action;
  const route=createDiscoveryRoutes({service:{search:async()=>{called=true;}},allow:async(request,value)=>{action=value;await Promise.resolve();return false;},body:async()=>({query:'Business'}),reply:(res,status)=>{response=status;}});
  await route({...req,method:'POST',headers:{'content-type':'application/json'}},{},{path:'/api/search',origin:'https://tap.imai.my'});
  assert.equal(action,'search');assert.equal(response,429);assert.equal(called,false);
});
