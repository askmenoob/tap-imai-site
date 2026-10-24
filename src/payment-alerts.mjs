// Private in-app alerts. Never persist payment information or request browser notification permissions.
export function createPaymentAlerts({api,open,canOpen}){
  const $=id=>document.getElementById(id),bell=$('payment-bell'),panel=$('payment-alerts'),count=$('payment-count'),status=$('payment-alert-status'),list=$('payment-alert-list'),refreshButton=$('payment-alert-refresh');
  let active=false,generation=0,timer,flight=null,lastCount=null;
  const schedule=()=>{clearTimeout(timer);if(active)timer=setTimeout(()=>{if(document.hidden)schedule();else refresh();},60000);};
  async function refresh(){
    if(!active)return;
    if(flight)return flight;
    const current=generation;
    refreshButton.disabled=true;
    const work=(async()=>{
      try{
        const data=await api('/api/admin/pending-payments');
        if(!active||current!==generation)return;
        count.textContent=String(data.count);lastCount=data.count;bell.classList.toggle('has-pending',data.count>0);
        status.textContent=data.count?'Pilih perniagaan untuk semak bayaran.':'Tiada bayaran menunggu semakan.';
        list.replaceChildren();
        for(const item of data.items){
          const button=document.createElement('button');button.type='button';button.className='payment-alert-item secondary';
          const name=document.createElement('strong');name.textContent=item.name;name.dataset.noI18n='';
          const detail=document.createElement('span');detail.dataset.noI18n='';
          detail.textContent=new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(item.amountCents/100)+' · '+new Date(item.submittedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'});
          button.append(name,detail);
          button.addEventListener('click',async()=>{
            if(!canOpen())return;button.disabled=true;
            try{await open(item.id);}catch{if(active&&current===generation)status.textContent='Bayaran belum dapat dibuka. Cuba lagi.';}
            finally{button.disabled=false;}
          });list.append(button);
        }
      }catch{
        if(!active||current!==generation)return;
        count.textContent=lastCount===null?'!':String(lastCount);
        status.textContent='Semakan bayaran belum dapat dikemas kini. Muat semula bayaran.';
      }finally{if(active&&current===generation){refreshButton.disabled=false;schedule();}}
    })();
    flight=work;try{await work;}finally{if(flight===work)flight=null;}
  }
  bell.addEventListener('click',()=>{panel.hidden=!panel.hidden;bell.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)refresh();});
  refreshButton.addEventListener('click',refresh);
  document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)refresh();});
  return {refresh,start(){this.stop();active=true;refresh();},stop(){active=false;generation++;clearTimeout(timer);flight=null;lastCount=null;count.textContent='…';bell.classList.remove('has-pending');bell.setAttribute('aria-expanded','false');panel.hidden=true;list.replaceChildren();status.textContent='';}};
}
