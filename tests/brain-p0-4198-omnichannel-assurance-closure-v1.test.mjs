import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root='supabase/migrations/';
const assurance=fs.readFileSync(root+'20261012090639_powerhouse_daily_omnichannel_existing_assurance_tick_v1.sql','utf8');
const isolation=fs.readFileSync(root+'20261012091700_powerhouse_existing_hourly_assurance_stage_isolation_v1.sql','utf8');
const sales=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');

test('one existing assurance owner, advisory lock, bounded enrichment repair',()=>{
 assert.match(assurance,/powerhouse_daily_omnichannel_assurance_v1/);
 assert.match(assurance,/pg_try_advisory_xact_lock/);
 assert.match(assurance,/powerhouse_connection_daily_pulse_v1\(v_day,500\)/);
 assert.doesNotMatch(assurance,/cron\.schedule\s*\(/);
});

test('hourly stage isolation keeps the same named cron and bounded stages',()=>{
 assert.match(isolation,/cron\.schedule\('powerhouse-autonomous-outreach-assurance-hourly-v1','52 \* \* \* \*'/);
 assert.equal((isolation.match(/powerhouse_runtime_mux_task_v1\s*\(/g)||[]).length,3);
 for(const stage of ['autonomous-outreach-assurance','loop-assurance','omnichannel-daily-proof']) assert.ok(isolation.includes("'"+stage+"'"),stage);
 assert.ok((isolation.match(/15000\);/g)||[]).length>=3);
 assert.match(isolation,/hourly_assurance_stage_failure/);
 assert.doesNotMatch(isolation,/cron\.unschedule\s*\(/);
});

test('no false-green publication, manufactured revenue, or mass consent',()=>{
 assert.match(assurance,/LIVE_PROVEN/);
 assert.match(assurance,/live_proven_at is not null/);
 assert.match(assurance,/NO_MASS_APPROVAL_NO_UNSOLICITED_AUTO_SEND/);
 assert.match(assurance,/realized_revenue_eur_today/);
 assert.match(assurance,/revenue_not_guaranteed_by_technical_health/);
 assert.match(assurance,/no_fabricated_delivery_or_revenue/);
 assert.doesNotMatch(assurance,/SALESROBOT_SEND_MESSAGE|GMAIL_SEND_EMAIL|gmail\.users/);
});

test('healthy SalesRobot account does not imply recipient or delivery evidence',()=>{
 assert.match(sales,/dmCapability='CONFIG_REQUIRED'/);
 assert.match(sales,/recipient_authority_unverified:true/);
 assert.match(sales,/provider_inbox_readback_required:true/);
 assert.match(sales,/requires_exact_provider_readback:true/);
});

test('release Brain learning is machine-readable and customer outcome unproven',()=>{
 const learning=JSON.parse(fs.readFileSync('brain/learning/2026-10-12-p0-4198-omnichannel-closure-v1.json','utf8'));
 assert.match(learning.fingerprint,/2026-10-12/);
 assert.ok(learning.evaluation.historical_replay.includes('tests/brain-p0-4198-omnichannel-assurance-closure-v1.test.mjs'));
 assert.equal(learning.outcome.customer_decision_execution_result_loop_unproven,true);
});
