import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  shouldRepairOriginalGrowthSource,
  verifyOriginalGrowthSourceRecovery
} from '../supabase/functions/_shared/original-growth-source-revision-recovery.mjs';

const runDate='2026-11-15';
const sha='a'.repeat(64);
const drift={
  contract:'original-daily-growth-source-one-loop-v1',source_day:runDate,
  source_rows:28,consumer_accepted:false,
  next_safe_cro_action:'SOURCE_REVISION_MISMATCH_OR_PRODUCER_MISSING_RETRY_ORIGINAL_175'
};
const capture={
  contract:'growth-source-daily-v1',status:'MEASUREMENTS_CURRENT',
  seo_website_ai_cro_source_manifest:{
    contract:'original-daily-growth-source-one-loop-v1',
    tenant_id:'bedrijfsgeheugen',source_day:runDate,
    source_count:28,source_revision:sha,producer_state:'SOURCE_PERSISTED_WAIT_CONSUMER'
  }
};
const consumer={
  contract:'original-daily-growth-source-one-loop-v1',tenant_id:'bedrijfsgeheugen',
  source_day:runDate,source_rows:28,consumer_accepted:true,consumer_source_revision:sha
};
const heartbeat={
  contract:'powerhouse-commercial-intelligence-heartbeat-v5',
  daily_source_brain_ack_verified:true,
  daily_source_current_raw_manifest_sha256:sha,
  daily_source_brain_stage:'ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME',
  original_site_to_cro_handoff:{accepted:false}
};

test('only exact current-day original #175/#140 source revision mismatch is eligible for safe replay',()=>{
  assert.equal(shouldRepairOriginalGrowthSource(drift,runDate,runDate),true);
  assert.equal(shouldRepairOriginalGrowthSource({...drift,consumer_accepted:true},runDate,runDate),false);
  assert.equal(shouldRepairOriginalGrowthSource({...drift,contract:'untrusted'},runDate,runDate),false);
  assert.equal(shouldRepairOriginalGrowthSource({...drift,source_day:'2026-11-14'},runDate,runDate),false);
  assert.equal(shouldRepairOriginalGrowthSource(drift,runDate,'2026-11-16'),false);
  assert.equal(shouldRepairOriginalGrowthSource({...drift,next_safe_cro_action:'SEND_EMAIL'},runDate,runDate),false);
  assert.equal(shouldRepairOriginalGrowthSource(null,runDate,runDate),false);
});

test('original producer, original receiver and original Heartbeat must acknowledge same immutable revision',()=>{
  const valid=verifyOriginalGrowthSourceRecovery({capture,consume:consumer,heartbeat,runDate});
  assert.equal(valid.ok,true);
  assert.equal(valid.sourceRevision,sha);
  assert.equal(valid.sourceCount,28);
  assert.equal(valid.businessEffectProven,false);
  assert.equal(valid.croExperimentExecuted,false);
  assert.equal(verifyOriginalGrowthSourceRecovery({
    capture,consume:{...consumer,consumer_source_revision:'b'.repeat(64)},heartbeat,runDate
  }).reason,'ORIGINAL_140_CONSUMER_EXACT_ACK_MISSING');
  assert.equal(verifyOriginalGrowthSourceRecovery({
    capture,consume:consumer,heartbeat:{...heartbeat,daily_source_brain_ack_verified:false},runDate
  }).reason,'ORIGINAL_HEARTBEAT_EXACT_READBACK_MISSING');
  assert.equal(verifyOriginalGrowthSourceRecovery({
    capture,consume:consumer,heartbeat:{...heartbeat,daily_source_current_raw_manifest_sha256:'c'.repeat(64)},runDate
  }).ok,false);
  assert.equal(verifyOriginalGrowthSourceRecovery({
    capture:{...capture,seo_website_ai_cro_source_manifest:{...capture.seo_website_ai_cro_source_manifest,source_revision:'forged'}},
    consume:consumer,heartbeat,runDate
  }).reason,'ORIGINAL_175_PRODUCER_PROOF_MISSING');
  assert.equal(verifyOriginalGrowthSourceRecovery({
    capture,consume:{...consumer,source_rows:27},heartbeat,runDate
  }).ok,false);
});

test('original source handoff can be proven while real site action, experiment and money stay unproven',()=>{
 const accepted=verifyOriginalGrowthSourceRecovery({capture,consume:consumer,heartbeat,runDate});
 assert.equal(accepted.ok,true);
 assert.equal(accepted.businessEffectProven,false);
 assert.equal(heartbeat.original_site_to_cro_handoff.accepted,false);
});

test('original content orchestrator is the only existing scheduler-guarded caller; no provider send in this recovery',()=>{
 const edge=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 const start=edge.indexOf("    // Original #140 hourly lease, NOT a new producer/scheduler/owner.");
 const end=edge.indexOf("    const first = await db.rpc('powerhouse_reconcile_content_outcomes_v1'",start);
 assert.ok(start>=0 && end>start);
 const path=edge.slice(start,end);
 assert.match(path,/shouldRepairOriginalGrowthSource/);
 assert.match(path,/powerhouse_capture_growth_source_daily_v1/);
 assert.match(path,/powerhouse_daily_source_consume_v1/);
 assert.match(path,/powerhouse_commercial_intelligence_heartbeat_v1/);
 assert.match(path,/verifyOriginalGrowthSourceRecovery/);
 assert.doesNotMatch(path,/\bfetch\s*\(|\bcron\.schedule\s*\(|\bprovider\.send\b|\bpublishPost\s*\(/);
 assert.match(edge,/const DIRECT_RPCS=new Set\(\[[^\n]*powerhouse_capture_growth_source_daily_v1[^\n]*powerhouse_daily_source_consume_v1[^\n]*powerhouse_commercial_intelligence_heartbeat_v1/);
});
