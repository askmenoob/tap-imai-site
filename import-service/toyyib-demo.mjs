// Localhost preview only. This is a simulation, never the ToyyibPay sandbox or live service.
export function createToyyibDemo(origin){
  const bills=new Map();let sequence=0;
  const provider={mode:'sandbox',host:origin+'/demo/toyyibpay',
    async create(order,{returnURL}){const code='demo'+String(++sequence).padStart(6,'0');bills.set(code,{order,returnURL,status:'2',inactive:false});return code;},
    async transactions(code){const item=bills.get(code);if(!item)return [];return [{billpaymentStatus:item.status,billExternalReferenceNo:item.order.id,billpaymentAmount:(item.order.quote.amountCents/100).toFixed(2),billpaymentInvoiceNo:'DEMO'+code}];},
    async cancel(code){const item=bills.get(code);if(item?.status==='1')throw Object.assign(new Error('Already paid'),{status:409});if(item)item.inactive=true;},
  };
  async function route(req,res,path){
    const match=/^\/demo\/toyyibpay\/(demo\d{6})$/.exec(path);if(!match)return false;const item=bills.get(match[1]);if(!item){res.writeHead(404);res.end();return true;}
    if(req.method==='POST'){
      if(req.headers.origin!==origin){res.writeHead(403);res.end();return true;}
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1000){res.writeHead(413);res.end();return true;}}
      if(item.inactive){res.writeHead(409);res.end('Bill cancelled');return true;}
      item.status=new URLSearchParams(raw).get('result')==='success'?'1':'3';res.writeHead(303,{location:item.returnURL});res.end();return true;
    }
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end('<!doctype html><html lang="ms"><title>Simulasi ToyyibPay SmartTap</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:32px;max-width:600px;margin:auto"><h1>Simulasi tempatan ToyyibPay</h1><p>Ini bukan laman ToyyibPay sebenar. Tiada wang dibayar.</p><p>Pesanan: '+item.order.id+'</p><h2>RM '+(item.order.quote.amountCents/100).toFixed(2)+'</h2><form method="post"><button name="result" value="success">Simulasi bayaran berjaya</button> <button name="result" value="fail">Simulasi bayaran gagal</button></form></body></html>');return true;
  }
  return {provider,route};
}
