import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-heartbeat-cro-site-consumer-v1.json',import.meta.url),'utf8'));
const last={version:'20261113190000',name:'original_seo_heartbeat_cro_consumer_receipt_v1'};
const prior={version:'20261113174500',name:'original_social_learning_source_ack_v1'};
const sqlPath=new URL('../supabase/migrations/'+last.version+'_'+last.name+'.sql',import.meta.url);
const sql=readFileSync(sqlPath,'utf8');

test('original provider verified 851st append only, no duplicate migration identities',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
  assert.equal(lock.applied.length,851);
  assert.deepEqual(lock.applied[849],prior);
  assert.deepEqual(lock.applied[850],last);
  assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
  assert.ok(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version));
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T18:20:40.710020Z'));
});
test('actual provider-applied Heartbeat migration remains unchanged, service only',()=>{
  assert.equal(existsSync(sqlPath),true);
  assert.match(sql,/ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1/);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) TO service_role/);
  assert.doesNotMatch(sql,/\bcron\.schedule\b|\bnet\.http_post\b/i);
});
test('original CRO receiver production ACK is scoped, exact and not a fake order',()=>{
  assert.equal(learning.production_cro_receiver_receipt_verified,true);
  assert.equal(learning.production_site_handoff_verified,true);
  assert.equal(learning.production_success,false);
  const readback=learning.production_readback;
  assert.deepEqual(readback.applied_migration,{...last,provider_applied:true});
  assert.equal(readback.first_receiver_proven_count,2);
  assert.equal(readback.repeat_receiver_proven_count,2);
  assert.equal(readback.original_event_rows,1);
  assert.equal(readback.original_source_obligation_id,'40b62d82-dcd3-4a44-98d0-3f94071008a9');
  assert.equal(readback.original_source_revision,'937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb');
  assert.equal(readback.cro_treatment_executed,false);
  assert.equal(readback.causal_lift_verified,false);
  assert.equal(readback.paid_order_verified,false);
  assert.equal(readback.next_run_learning_verified,false);
  assert.equal(readback.original_source_obligation_still_open,true);
});
