import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SIGNAL_METRICS,evaluateSignals} from '../portal-v2/signal-detection.js';
import {PORTAL_SIGNAL_HEARTBEAT_CONTRACT,monitoringRuleCandidates,
  planOriginalHeartbeatObservations,planNotificationSafety}
  from '../supabase/functions/powerhouse-commercial-heartbeat-runner/portal-signal-heartbeat.mjs';

const timestamp='2026-11-20T20:00:00.000Z';
const data=(value=100)=>({portal:{metrics:{revenue:value},signalering:{rules:[
  {id:'r1',metricId:'revenue',operator:'below',threshold:200,monitoring:true,
    enabled:true,channels:{email:true,push:true}}
]}}});
const row=(tenant='user:tenant-a',value=100)=>({tenant_id:tenant,layer:'legacy-migration',
  source_updated_at:timestamp,updated_at:timestamp,payload:{data:data(value)}});
test('runtime and browser use exactly the same allowlisted KPI source paths',async()=>{
  const source=await readFile(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/portal-signal-heartbeat.mjs',import.meta.url),'utf8');
  for(const metric of SIGNAL_METRICS){
    assert.ok(source.includes(metric.id+":" )||source.includes(metric.id+"'")||source.includes(metric.id+':')||source.includes(metric.id+' '),metric.id);
    assert.ok(source.includes(metric.path),metric.path);
  }
  assert.match(source,/sourceMeasurementFreshness:'UNKNOWN'/);
  assert.equal(PORTAL_SIGNAL_HEARTBEAT_CONTRACT,'portal-voice-alert-heartbeat-v1');
});
test('tenant isolation, explicit monitoring opt-in and no demo/unknown rules',async()=>{
  const planned=await planOriginalHeartbeatObservations([row(),row('user:tenant-b',300)]);
  assert.equal(planned.length,1);
  assert.equal(planned[0].evidence.sourcePath,'portal.metrics.revenue');
  assert.match(planned[0].dedupeKey,/^portal-signal-observation:[a-f0-9]{48}$/);
  assert.equal(planned[0].evidence.sourceMeasurementFreshness,'UNKNOWN');
  assert.equal(planned[0].evidence.notificationDeliveryVerified,false);
  assert.equal(planned[0].evidence.autonomousActionExecuted,false);
  assert.equal(planned[0].evidence.requestedChannels.email,true);
  assert.ok(!JSON.stringify(planned).includes('user:tenant-a'));
  const noConsent=row();noConsent.payload.data.portal.signalering.rules[0].monitoring=false;
  assert.deepEqual(await planOriginalHeartbeatObservations([noConsent]),[]);
  assert.deepEqual(await planOriginalHeartbeatObservations([{...row(),tenant_id:''}]),[]);
  assert.deepEqual(monitoringRuleCandidates([{...row(),layer:'unknown'}]),[]);
});
test('same source revision creates one stable idempotency key; new revision renews',async()=>{
  const one=await planOriginalHeartbeatObservations([row()]);
  const two=await planOriginalHeartbeatObservations([row()]);
  assert.equal(one[0].dedupeKey,two[0].dedupeKey);
  const next=await planOriginalHeartbeatObservations([{...row(),source_updated_at:'2026-11-21T20:00:00.000Z'}]);
  assert.notEqual(one[0].dedupeKey,next[0].dedupeKey);
});
test('unknown measurement, unexpected metric and false data never fake an anomaly',async()=>{
  const invalid=row();invalid.payload.data.portal.signalering.rules[0].metricId='serviceToken';
  assert.deepEqual(await planOriginalHeartbeatObservations([invalid]),[]);
  const noData=row();delete noData.payload.data.portal.metrics.revenue;
  assert.deepEqual(await planOriginalHeartbeatObservations([noData]),[]);
  const falseData=row();falseData.payload.data.portal.metrics.revenue=false;
  assert.deepEqual(await planOriginalHeartbeatObservations([falseData]),[]);
});
test('email, push and autonomous action always require original authorized provider and independent readback',async()=>{
  const [observation]=await planOriginalHeartbeatObservations([row()]);
  assert.equal(planNotificationSafety(observation).state,'MEASUREMENT_FRESHNESS_NOT_VERIFIED');
  assert.equal(planNotificationSafety(observation,{sourceFreshnessVerified:true}).state,'RECIPIENT_CONSENT_OR_SUPPRESSION_DUE');
  assert.equal(planNotificationSafety(observation,{sourceFreshnessVerified:true,recipientConsent:true,recipientAllowed:true}).state,'ORIGINAL_PROVIDER_READBACK_DUE');
  const permitted=planNotificationSafety(observation,{sourceFreshnessVerified:true,recipientConsent:true,recipientAllowed:true,providerVerified:true,providerId:'provider-verified'});
  assert.equal(permitted.maySend,false);
});
test('existing 5-minute runner owns the only observation and fails closed on delivery',async()=>{
  const runner=await readFile(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts',import.meta.url),'utf8');
  for(const fragment of ["observePortalSignals","planOriginalHeartbeatObservations",
    "portal_user_signal_observed","on conflict(dedupe_key) do nothing",
    "from public.portal_state_layers","technicalReadbackVerified","notificationsSent:0","actionsExecuted:0"]){
    assert.ok(runner.includes(fragment),fragment);
  }
  // Regression: constructing a patch with a literal dollar-apostrophe in
  // String.replace replacement text can inject the remainder of the source.
  assert.equal(runner.split('Deno.serve(async(req:Request)=>{').length,2);
  assert.ok(runner.includes("const placeholders=outcome.keys.map((_:string,i:number)=>'
  assert.doesNotMatch(runner,/cron\.schedule\(/);
  const browser=await readFile(new URL('../portal-v2/voice-signals.js',import.meta.url),'utf8');
  assert.match(browser,/name="monitoring"/);
  assert.match(browser,/name="email"/);
  assert.match(browser,/name="push"/);
  assert.match(browser,/parsePortalVoiceControl/);
  assert.match(browser,/stageVoiceFieldValue/);
});
+(i+1)).join(',');"));
  assert.ok(runner.includes('portal_signal_observation:portalSignalObservation'));
  assert.match(runner,/x-bg-service-token/);
  assert.doesNotMatch(runner,/cron\.schedule\(/);
  const browser=await readFile(new URL('../portal-v2/voice-signals.js',import.meta.url),'utf8');
  assert.match(browser,/name="monitoring"/);
  assert.match(browser,/name="email"/);
  assert.match(browser,/name="push"/);
  assert.match(browser,/parsePortalVoiceControl/);
  assert.match(browser,/stageVoiceFieldValue/);
});
