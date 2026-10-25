import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';

const unavailable=()=>Object.assign(new Error('Kawalan had carian tidak tersedia. Cuba sebentar lagi.'),{status:503});
const actions=['suggest','search','import','create','shorten'];
function positive(value,fallback,max=100000){
  if(value===undefined||value==='')return fallback;
  if(!/^\d+$/.test(String(value))||!Number.isSafeInteger(Number(value))||Number(value)<1||Number(value)>max)throw new Error('Invalid discovery quota configuration.');
  return Number(value);
}
export function quotaLimits(env={}){
  return {total:positive(env.MAX_DAILY_REQUESTS,300),daily:Object.fromEntries(actions.map(action=>[action,positive(env['QUOTA_DAILY_'+action.toUpperCase()],action==='suggest'?180:action==='create'||action==='shorten'?100:60)])),minute:Object.fromEntries(actions.map(action=>[action,positive(env['QUOTA_MINUTE_'+action.toUpperCase()],action==='suggest'?30:12,1000)]))};
}
// Cloud Run appends the connecting client to XFF. Never use the caller-controlled
// leftmost entry or CF-Connecting-IP. Outside Cloud Run only the socket is trusted.
export function quotaClient(req,{cloudRun=false}={}){
  const socket=req.socket?.remoteAddress||'';
  if(cloudRun){
    const header=req.headers?.['x-forwarded-for'];
    if(header!==undefined){
      if(typeof header!=='string'||header.length>2048||/[\r\n\x00]/.test(header))return 'invalid-forwarded-client';
      const parts=header.split(',').map(part=>part.trim());
      if(parts.length>32||parts.some(part=>!isIP(part)))return 'invalid-forwarded-client';
      return parts.at(-1).toLowerCase();
    }
  }
  return isIP(socket)?socket.toLowerCase():'unknown-client';
}
export function createMemoryQuotaStore(){
  const values=new Map();let generation=0;
  return {async read(key){const value=values.get(key);return value?structuredClone(value):{record:null,revision:'0'};},async write(key,record,revision){if((values.get(key)?.revision||'0')!==revision)return false;values.set(key,{record:structuredClone(record),revision:String(++generation)});return true;}};
}
export function createCloudQuotaStore({bucket,getToken,fetcher=fetch}){
  if(!/^[a-z0-9][a-z0-9.-]{2,62}$/.test(bucket||''))throw new Error('Invalid quota bucket.');
  const object=key=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(key))throw unavailable();return 'quotas/discovery/'+key+'.json';};
  async function request(url,options={}){
    const response=await fetcher(url,{...options,headers:{Authorization:'Bearer '+await getToken(),...options.headers},signal:AbortSignal.timeout(10000)});
    if(response.status===404)return null;if(response.status===412)return false;
    if(!response.ok)throw unavailable();return response.json();
  }
  return {
    async read(key){
      const url='https://storage.googleapis.com/storage/v1/b/'+bucket+'/o/'+encodeURIComponent(object(key));
      const metadata=await request(url+'?fields=generation');if(metadata===null)return {record:null,revision:'0'};
      if(!metadata||!/^\d+$/.test(String(metadata.generation)))throw unavailable();
      const record=await request(url+'?alt=media&generation='+encodeURIComponent(metadata.generation));if(!record)throw unavailable();
      return {record,revision:metadata.generation};
    },
    async write(key,record,revision){
      const url=new URL('https://storage.googleapis.com/upload/storage/v1/b/'+bucket+'/o');
      url.searchParams.set('uploadType','media');url.searchParams.set('name',object(key));url.searchParams.set('ifGenerationMatch',revision);
      const result=await request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});
      if(result===false)return false;if(!result||!result.generation)throw unavailable();return true;
    },
  };
}
export function createDiscoveryQuota({store,secret,limits=quotaLimits(),now=Date.now,cloudRun=false}){
  if(!store||typeof secret!=='string'||secret.length<32)throw new Error('Configure durable discovery quota storage and signing secret.');
  return async(req,action='search')=>{
    if(!actions.includes(action))throw unavailable();
    const time=now(),day=new Date(time).toISOString().slice(0,10),minute=Math.floor(time/60000);
    const client=createHmac('sha256',secret).update('discovery-client:'+day+':'+quotaClient(req,{cloudRun})).digest('hex');
    try{
      for(let attempt=0;attempt<24;attempt++){
        const {record:saved,revision}=await store.read(day);
        if(saved&&(saved.v!==1||saved.day!==day||!Number.isSafeInteger(saved.total)||saved.total<0||!saved.actions||!saved.clients))throw unavailable();
        const record=saved||{v:1,day,total:0,actions:{},clients:{}};
        const entry=record.clients[client],window=entry?.minute===minute?entry:{minute,actions:{}};
        const daily=record.actions[action]||0,count=window.actions[action]||0;
        if(!Number.isSafeInteger(daily)||daily<0||!Number.isSafeInteger(count)||count<0)throw unavailable();
        if(record.total>=limits.total||daily>=limits.daily[action]||count>=limits.minute[action])return false;
        record.total++;record.actions[action]=daily+1;window.actions[action]=count+1;record.clients[client]=window;
        // One generation-guarded object atomically reserves the shared daily cap,
        // action cap and client minute slot across restarts and instances.
        if(await store.write(day,record,revision))return true;
      }
      throw unavailable();
    }catch{throw unavailable();}
  };
}
