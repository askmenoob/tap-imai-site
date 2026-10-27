export const hasEntitlement=record=>!!(record.subscription?.lastPaymentId||record.subscription?.lastGrantId);
export const hasAnnualEntitlement=record=>record.subscription?.plan==='annual'&&hasEntitlement(record);
export function pageState(record,now=Date.now()){
  const state=record.lifecycle?.state||'active';
  if(state==='deleted'||state==='disabled')return state;
  if(record.subscription?.plan==='nfc_only')return 'nfc_only';
  if(record.trial && !hasEntitlement(record)){
    const end=Date.parse(record.trial.expiresAt||'');
    return Number.isFinite(end)&&end>now?'active':'expired';
  }
  if(record.subscription?.plan==='annual'){
    const end=Date.parse(record.subscription.expiresAt||'');
    if(!Number.isFinite(end))return 'pending';
    if(end<=now)return 'expired';
  }
  return 'active';
}
export function requirePublicPage(record,now=Date.now()){
  const state=pageState(record,now);if(state==='active')return;
  const error=Object.assign(new Error(state==='deleted'?'Halaman ini telah dipadam.':'Halaman ini tidak aktif buat sementara. Pemilik boleh login untuk menyemak status halaman.'),{status:state==='deleted'?410:403});throw error;
}
export function annualEnd(value){
  const start=new Date(value),year=start.getUTCFullYear()+1,month=start.getUTCMonth();
  const day=Math.min(start.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());
  return new Date(Date.UTC(year,month,day,start.getUTCHours(),start.getUTCMinutes(),start.getUTCSeconds(),start.getUTCMilliseconds())).toISOString();
}
