import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const local=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(n=>/^\d{14}_[a-z0-9_]+\.sql$/.test(n)).sort().map(n=>({version:n.slice(0,14),name:n.slice(15,-4)}));
const expected=[
['20261103124000','bg_kansenradar_original_cron_authorization'],
['20261103141902','repair_experimentcyclus_regex_2201b_20261103'],
['20261103142201','repair_experimentcyclus_required_started_at_23502_20261103'],
['20261103143000','bg_experimentcyclus_regex_started_at_contract_v1'],
['20261103223001','one_brain_policy_promotion_failure_receipts_v1'],
['20261104051200','original_recovery_queue_outcome_proof_v1'],
['20261104052001','original_personal_reconciler_nested_builder_proof_v1'],
['20261104065001','original_recovery_control_plane_native_pgcron_v1'],
['20261104074100','original_heartbeat_single_recovery_owner_v1'],
];

test('original 800 production provider migration records equal executable Git source identity',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,800);
 assert.equal(local.length,800);
 assert.deepEqual(new Map(lock.applied.map(x=>[x.version,x.name])),new Map(local.map(x=>[x.version,x.name])));
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,800,'no colliding provider versions');
});
test('nine new exact source identities are independently recorded without dropping the prior 791',()=>{
 const m=new Map(lock.applied.map(x=>[x.version,x.name]));
 for(const [version,name] of expected)assert.equal(m.get(version),name,version+' provider identity');
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-04T07:43:05.326605Z'));
 assert.equal(lock.applied.at(-1).version,'20261104074100');
});
test('source snapshot is NOT a substitute for real live runtime, provider side-effect or paid outcome',()=>{
 assert.equal(lock.captured_at,'2026-11-04T07:43:05.326605Z');
 for(const secret of ['realized_revenue_eur','runtime_healthy','provider_publication_verified','provider_success_count','recovery_resolved'])assert.ok(!(secret in lock));
 assert.ok(!JSON.stringify(lock).includes('authorization: Bearer'),'never embed provider secrets');
});
