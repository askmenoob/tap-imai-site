import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
test('operations proposal isolates buckets and identities and defaults to unapproved/unapplied',async()=>{
  const plan=await load('./operations-plan.json');
  assert.equal(plan.status,'PROPOSED_LOCAL_ONLY_NOT_APPLIED');assert.equal(plan.approvalRequired,true);
  assert.notEqual(plan.buckets.backup.name,plan.verifiedInputs.sourceBucket);assert.notEqual(plan.buckets.restoreDrill.name,plan.buckets.backup.name);
  for(const binding of plan.identities.bindings)assert.ok(!binding.member.includes('tap-business-import@'));
  assert.deepEqual(plan.identities.backupWriterRole.includedPermissions.sort(),['storage.buckets.get','storage.objects.create','storage.objects.get','storage.objects.list'].sort());
  assert.ok(!plan.identities.sourceReaderRole.includedPermissions.some(permission=>/create|delete|update/.test(permission)));
  assert.equal(plan.monitoring.actualVerifiedChannelResource,null);assert.equal(plan.monitoring.actualCheckIds,null);
});
test('backup bucket locks no retention and lifecycle cannot touch live records',async()=>{
  const bucket=await load('./operations/backup-bucket.template.json');
  assert.equal(bucket.retentionPolicy.retentionPeriod,'2592000');assert.equal(bucket.retentionPolicy.isLocked,undefined);
  assert.equal(bucket.iamConfiguration.publicAccessPrevention,'enforced');assert.equal(bucket.iamConfiguration.uniformBucketLevelAccess.enabled,true);
  assert.deepEqual(bucket.lifecycle.rule,[{action:{type:'Delete'},condition:{age:35,matchesPrefix:['snapshots/']}}]);
});
test('job/scheduler use one isolated task, no secrets, UTC18:00 and OAuth invoker identity',async()=>{
  const job=await load('./operations/cloud-run-job.template.json'),schedule=await load('./operations/cloud-scheduler.template.json');
  assert.equal(job.template.parallelism,1);assert.equal(job.template.taskCount,1);assert.equal(job.template.template.maxRetries,0);
  const container=job.template.template.containers[0];assert.equal(container.env,undefined);assert.equal(container.args.includes('--execute'),true);assert.equal(container.args.some(arg=>arg.startsWith('--snapshot=')),false);
  assert.match(container.image,/REPLACE_WITH/);assert.equal(schedule.schedule,'0 18 * * *');assert.equal(schedule.timeZone,'Etc/UTC');
  assert.equal(schedule.httpTarget.oauthToken.serviceAccountEmail,'smarttap-backup-scheduler@cedar-kiln-502614-h5.iam.gserviceaccount.com');
  assert.deepEqual(JSON.parse(Buffer.from(schedule.httpTarget.body,'base64')),{});
});
test('alert templates remain disabled with honest placeholders, never invented resource IDs',async()=>{
  for(const file of ['uptime-alert.template.json','backup-failure-alert.template.json']){
    const alert=await load('./operations/'+file);assert.equal(alert.enabled,false);
    assert.match(alert.notificationChannels[0],/^REPLACE_WITH_APPROVED_VERIFIED/);
  }
});
test('backup image copies only the isolated tool and does not embed credentials',async()=>{
  const dockerfile=await readFile(new URL('./operations/backup.Dockerfile',import.meta.url),'utf8');
  assert.match(dockerfile,/COPY smarttap-backup\.py \/app\/smarttap-backup\.py/);
  assert.ok(!/^COPY\s+\.\s/m.test(dockerfile));assert.match(dockerfile,/USER 10001/);assert.ok(!/GOOGLE_APPLICATION_CREDENTIALS|TOYYIBPAY_SECRET_KEY/.test(dockerfile));
});
