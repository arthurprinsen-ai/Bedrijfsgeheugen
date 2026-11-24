import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPortalSignalStatusHandler} from '../platform/api/portal-signal-status-handler.mjs';
import {planOriginalHeartbeatScans} from '../supabase/functions/powerhouse-commercial-heartbeat-runner/portal-signal-heartbeat.mjs';

const data=(value=120)=>({portal:{metrics:{revenue:value},signalering:{rules:[
  {id:'r1',metricId:'revenue',operator:'below',threshold:150,monitoring:true,
    enabled:true,channels:{email:true,push:true}}
]}}});
const row=(tenant='user:tenant-1',revision='2026-11-21T12:00:00Z')=>({
  tenant_id:tenant,layer:'legacy-migration',source_updated_at:revision,updated_at:revision,
  payload:{data:data()}
});
const evidence={tenantId:'user:valid',contract:'portal-signal-tenant-readback-v1',
  lastOriginalHeartbeatAt:'2026-11-21T12:00:00Z',lastTenantScanAt:null,
  events:[],eventsTruncated:false};
const req=(url='https://www.bedrijfsgeheugen.nl/api/portal-signal-status')=>new Request(url,{method:'GET'});

test('only verified Netlify Identity subject may read an original server-derived tenant',async()=>{
  const calls=[];
  const handle=createPortalSignalStatusHandler({
    getUser:async()=>({id:'valid'}),
    storeFactory:()=>({getSignalObservations:async tenant=>{calls.push(tenant);return evidence;}})
  });
  const response=await handle(req('https://www.bedrijfsgeheugen.nl/api/portal-signal-status?tenantId=user:other'));
  assert.equal(response.status,200);
  assert.deepEqual(calls,['user:valid']);
  const data=await response.json();
  assert.equal(data.events.length,0);
  assert.equal(data.tenantId,undefined);
  assert.equal(data.alertsDelivered,0);
  assert.equal(data.autonomousActionsVerified,0);
  assert.equal(data.measurementFreshnessVerified,false);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.match(response.headers.get('vary'),/cookie/);
});
test('unauthenticated and principal mismatch fail closed, no store operations',async()=>{
  let touched=0;
  const denied=createPortalSignalStatusHandler({getUser:async()=>null,storeFactory:()=>{touched++;return{};}});
  assert.equal((await denied(req())).status,401);
  assert.equal(touched,0);
  const wrong=createPortalSignalStatusHandler({
    getUser:async()=>({id:'valid'}),
    storeFactory:()=>({getSignalObservations:async()=>({...evidence,tenantId:'user:other'})})
  });
  assert.equal((await wrong(req())).status,503);
  const badMethod=createPortalSignalStatusHandler({getUser:async()=>({id:'valid'}),storeFactory:()=>({})});
  assert.equal((await badMethod(new Request('https://www.bedrijfsgeheugen.nl/api/portal-signal-status',{method:'POST'}))).status,405);
});
test('tenant scan receives an hourly idempotent fingerprint even without triggers',async()=>{
  const r=row(), t='2026-11-21T14:02:00Z';
  const scans=await planOriginalHeartbeatScans([r],{now:t});
  assert.equal(scans.length,1);
  assert.equal(scans[0].eventType,'portal_user_signal_scan');
  assert.equal(scans[0].evidence.enabledRuleCount,1);
  assert.equal(scans[0].evidence.thresholdTriggersObserved,1);
  assert.equal(scans[0].evidence.sourceMeasurementFreshness,'UNKNOWN');
  assert.equal(scans[0].evidence.channelDeliveryVerified,false);
  assert.equal(scans[0].evidence.executedActionsVerified,false);
  assert.ok(!JSON.stringify(scans).includes('user:tenant-1'));
  const same=await planOriginalHeartbeatScans([r],{now:'2026-11-21T14:59:00Z'});
  assert.equal(same[0].dedupeKey,scans[0].dedupeKey);
  const hour=await planOriginalHeartbeatScans([r],{now:'2026-11-21T15:00:00Z'});
  assert.notEqual(hour[0].dedupeKey,scans[0].dedupeKey);
});
test('missing source, disabled monitoring and newer revocation cannot imply delivered signal',async()=>{
  const r=row();delete r.payload.data.portal.metrics.revenue;
  assert.equal((await planOriginalHeartbeatScans([r]))[0].evidence.missingSourceValues,1);
  r.payload.data.portal.signalering.rules[0].monitoring=false;
  assert.equal((await planOriginalHeartbeatScans([r])).length,0);
  const prior=row(),revoked={...row('user:tenant-1','2026-11-21T12:01:00Z'),layer:'canonical-brain',payload:{data:{portal:{signalering:{rules:[]}}}}};
  assert.equal((await planOriginalHeartbeatScans([prior,revoked])).length,0);
});
test('only the original runner and original EU service gateway deliver authenticated proof',async()=>{
  const runner=await readFile(new URL('../supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts',import.meta.url),'utf8');
  const eu=await readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
  const store=await readFile(new URL('../netlify/functions/_portal-supabase-store.mjs',import.meta.url),'utf8');
  const netlify=await readFile(new URL('../netlify/functions/portal-signal-status.mjs',import.meta.url),'utf8');
  for(const source of ['planOriginalHeartbeatScans','portal_user_signal_scan','on conflict(dedupe_key) do nothing']){
    assert.ok(runner.includes(source),source);
  }
  assert.match(eu,/if\(action==='signal_observations'\)/);
  assert.match(eu,/eq\('subject_key',key\)/);
  assert.match(eu,/sha256\(tenantId\)/);
  assert.match(eu,/portal_user_signal_scan/);
  assert.match(eu,/PORTAL_MONITORING_READ_FAILED/);
  assert.match(store,/PORTAL_MONITORING_TENANT_OR_CONTRACT_MISMATCH/);
  assert.match(netlify,/createPortalSignalStatusHandler/);
  assert.doesNotMatch(netlify,/service_role|SECRET_KEY|serviceToken/);
  assert.doesNotMatch(runner,/cron\.schedule\(/);
});
