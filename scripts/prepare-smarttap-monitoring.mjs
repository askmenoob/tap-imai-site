import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const split=value.indexOf('=');if(split<3||!value.startsWith('--'))throw new Error('Use --output=DIR, --channel=RESOURCE and optional --checkIds=ID,ID');return [value.slice(2,split),value.slice(split+1)];}));
if(Object.keys(args).some(key=>!['output','channel','checkIds'].includes(key)))throw new Error('Unknown option.');
if(!args.output)throw new Error('Choose a local output directory with --output=DIR.');
if(args.channel&&!/^projects\/cedar-kiln-502614-h5\/notificationChannels\/[0-9]+$/.test(args.channel))throw new Error('Invalid notification channel resource.');
const directory=resolve(args.output);await mkdir(directory,{recursive:true});
const checks=[['frontend','tap.imai.my','/subscribe/'],['backend','tap-business-import-262870839474.asia-southeast1.run.app','/health']];
for(const [name,host,path] of checks){
  const config={displayName:'SmartTap '+name+' HTTPS',monitoredResource:{type:'uptime_url',labels:{project_id:'cedar-kiln-502614-h5',host}},httpCheck:{path,port:443,useSsl:true,validateSsl:true,requestMethod:'GET',acceptedResponseStatusCodes:[{statusValue:200}]},period:'300s',timeout:'10s',selectedRegions:['ASIA_PACIFIC','EUROPE','USA']};
  if(name==='backend')config.contentMatchers=[{content:'"shortLinks":true',matcher:'CONTAINS_STRING'}];
  await writeFile(resolve(directory,'uptime-'+name+'.json'),JSON.stringify(config,null,2)+'\n');
}
if(args.checkIds){
  const ids=args.checkIds.split(',');if(ids.length!==2||ids.some(id=>!/^[-a-zA-Z0-9_]{1,128}$/.test(id)))throw new Error('Supply exactly the two created check IDs.');
  if(!args.channel)throw new Error('A verified notification channel is required before preparing an enabled alert.');
  const filter='metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.type="uptime_url" AND ('+ids.map(id=>'metric.label.check_id="'+id+'"').join(' OR ')+')';
  const alert={displayName:'SmartTap HTTPS unavailable',enabled:true,combiner:'OR',notificationChannels:[args.channel],documentation:{mimeType:'text/markdown',content:'Check frontend/backend uptime and Cloud Run revision logs. This check does not verify Google login or a real ToyyibPay payment. Follow OPERATIONS.md; never replay payment callbacks without provider verification.'},conditions:[{displayName:'At least two uptime locations failed for five minutes',conditionThreshold:{filter,comparison:'COMPARISON_GT',thresholdValue:1,duration:'300s',aggregations:[{alignmentPeriod:'300s',perSeriesAligner:'ALIGN_NEXT_OLDER',crossSeriesReducer:'REDUCE_COUNT_FALSE',groupByFields:['metric.label.check_id']}],trigger:{count:1}}}]};
  await writeFile(resolve(directory,'alert-uptime.json'),JSON.stringify(alert,null,2)+'\n');
}
console.log(JSON.stringify({prepared:true,directory,checks:2,alertPrepared:!!args.checkIds,applied:false}));
