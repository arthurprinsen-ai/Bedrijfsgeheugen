import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
const names=new Map(lock.applied.map(r=>[String(r.version),String(r.name)]));
const expected=new Map([
 ['20261029122836','sales_cycle_execution_truth_guard_20261029'],
 ['20261029125100','sales_cycle_negative_terminal_reconcile_v1'],
 ['20261029125607','powerhouse_cycle_writer_provenance_20261029'],
 ['20261029174600','growth_cta_alias_truth_and_idempotent_backfill'],
 ['20261029174700','cro_observed_experiment_and_lead_order_evidence_v1']
]);

test('five exact production-applied versions are pinned without fictitious identities',()=>{
 for(const [version,name] of expected){
  assert.equal(names.get(version),name);
  assert.ok(readdirSync('supabase/migrations').includes(version+'_'+name+'.sql'));
 }
});
test('lock has no duplicate migrations, no unverified local-only executable scripts',()=>{
 const actualFiles=readdirSync('supabase/migrations').filter(x=>/^\d{14}_.+\.sql$/.test(x));
 const versionSet=new Set(lock.applied.map(r=>r.version));
 assert.equal(versionSet.size,lock.applied.length,'duplicate migration version in lock');
 const unmapped=actualFiles.filter(f=>!versionSet.has(f.slice(0,14)));
 assert.deepEqual(unmapped,[],'all local executable SQL must be justified by provider-readback lock');
});
test('migration repair does not forge a customer conversion or production runtime outcome',()=>{
 const learning=JSON.parse(readFileSync('brain/learning/2026-10-29-cro-production-migration-lock-reconciled.json','utf8'));
 assert.equal(learning.production_provider_history_verified,true);
 assert.equal(learning.customer_revenue_proven,false);
 assert.equal(learning.new_natural_website_conversion_proven,false);
});

test('latest five actual production migrations are present in same original source lock',()=>{
 const latest=new Map([
  ['20261029180000','bg_cro_event_uid_v1'],
  ['20261029181000','bg_cro_behavior_daily_v1'],
  ['20261029182000','bg_cro_allowlisted_event_types_v1'],
  ['20261029183000','instagram_media_ensure_claim_monotonicity_v1'],
  ['20261029185000','bg_cro_validate_event_types_v1'],
 ]);
 for(const [version,name] of latest){
  assert.equal(names.get(version),name,'missing actual production migration '+version);
  assert.ok(readdirSync('supabase/migrations').includes(version+'_'+name+'.sql'));
 }
 const files=readdirSync('supabase/migrations').filter(x=>/^\d{14}_.+\.sql$/.test(x));
 assert.equal(new Set(files.map(x=>x.slice(0,14))).size,files.length,'no duplicate executable migration versions');
 assert.equal(lock.applied.length,files.length,'entire source lock must cover executable migration manifest');
 assert.ok(lock.applied.length>=784,'all 784 independently observed production applied migrations must remain present');
});

test('learning replay reference satisfies canonical Brain admission, while general integrity test remains supported',()=>{
 const record=JSON.parse(readFileSync('brain/learning/2026-10-29-cro-production-migration-lock-reconciled.json','utf8'));
 assert.ok(Array.isArray(record.evaluation.historical_replay) && record.evaluation.historical_replay.length>0);
 for(const filename of record.evaluation.historical_replay){
  assert.match(filename,/^tests\/brain-[a-z0-9._/-]+\.test\.mjs$/i);
  assert.ok(readdirSync('tests').includes(filename.slice('tests/'.length)));
 }
 assert.ok(record.tests.includes('tests/supabase-migration-history-integrity.test.mjs'));
});
