import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const applied=lock.applied.map(({version,name})=>({version:String(version),name:String(name)}));
const local=readdirSync(new URL('../supabase/migrations/',import.meta.url))
 .filter(x=>/^\d{14}_[a-z0-9_]+\.sql$/.test(x))
 .map(x=>({version:x.slice(0,14),name:x.slice(15,-4)}));
const keyed=rows=>new Map(rows.map(x=>[x.version,x.name]));

test('original historical provider migration 841 is recorded exactly once after unchanged 840 prefix',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=841,'applied history never frozen at 840');
 assert.deepEqual(applied[839],{version:'20261113062500',name:'original_no_publish_terminal_handoff_ack_v1'});
 assert.deepEqual(applied[840],{version:'20261113071500',name:'original_content_handoff_source_revision_receipt_v1'});
 assert.equal(new Set(applied.map(x=>x.version)).size,applied.length,'immutable applied versions must be unique');
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T07:48:12.734Z'));
});

test('all source migrations match original provider-lock identity without fabricated or orphaned scripts',()=>{
 assert.equal(local.length,applied.length,'every source migration must be provider-attested');
 assert.deepEqual(keyed(local),keyed(applied),'same version+name identities; do not substitute count parity');
 assert.equal(new Set(local.map(x=>x.version)).size,local.length,'no duplicate executable versions');
 assert.equal(keyed(local).get('20261113071500'),'original_content_handoff_source_revision_receipt_v1');
});

test('original 841st migration has only already-proven source-only ACK and protected service-role gates',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261113071500_original_content_handoff_source_revision_receipt_v1.sql',import.meta.url),'utf8');
 for(const s of ['NO_PUBLISH_POLICY_ACK','OVERDUE_PROVIDER_READBACK','ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME',
  "'source_revision'","'source_correlation_id'","'consumer_ack'","SECURITY DEFINER",
  'FROM PUBLIC,anon,authenticated','TO service_role;'])
  assert.ok(sql.includes(s),'missing original source or security contract: '+s);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bnet\.http_post\s*\(/i);
});

test('841st provider history lock never claims that commercial or portal loops are all green',()=>{
 const lesson=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-provider-841-source-lock-v1.json',import.meta.url),'utf8'));
 assert.equal(lesson.fingerprint,'supabase|migration-history|original-content-ack-provider-841-source-lock|20261113-v1');
 assert.equal(lesson.provider_applied_verified,true);
 assert.equal(lesson.all_loops_green,false);
 assert.equal(lesson.proven_customer_revenue_eur,0);
 assert.equal(lesson.provider_publication_inferred,false);
 assert.equal(lesson.second_migration_executor_created,false);
});
