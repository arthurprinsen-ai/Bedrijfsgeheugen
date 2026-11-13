import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sources=readdirSync(new URL('../supabase/migrations/',import.meta.url))
 .filter(n=>/^\d{14}_[a-z0-9_]+\.sql$/.test(n))
 .map(n=>({version:n.slice(0,14),name:n.slice(15,-4)}));

test('native provider-applied historical 842nd identity is appended exactly to original immutable history',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=842,'do not freeze future provider versions at 841');
 assert.deepEqual(lock.applied[840],{version:'20261113071500',name:'original_content_handoff_source_revision_receipt_v1'});
 assert.deepEqual(lock.applied[841],{version:'20261113082500',name:'original_cancelled_social_learning_source_ack_v1'});
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T08:43:00.785Z'));
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
});

test('every executable SQL file is in same single source lock with exact provider identity',()=>{
 assert.equal(lock.applied.length,sources.length);
 assert.deepEqual(new Map(lock.applied.map(x=>[x.version,x.name])),
   new Map(sources.map(x=>[x.version,x.name])));
 assert.equal(new Set(sources.map(x=>x.version)).size,sources.length);
});

test('recorded 842nd native function cannot create provider success or bypass restricted access',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261113082500_original_cancelled_social_learning_source_ack_v1.sql',import.meta.url),'utf8');
 for(const p of [
  "'stage','SOURCE_CANCELLED_INVALID_LEARNING_ACK'",
  "'source_cancel_reason',x.payload->>'cancel_reason'",
  "'accepted',true,'acceptance_scope','ORIGINAL_SOURCE_CANCELLATION_ONLY_NOT_PROVIDER_OR_LEARNING'",
  "REVOKE ALL ON FUNCTION public.powerhouse_content_handoff_receipts_v1(timestamptz)",
  "FROM PUBLIC,anon,authenticated",
  "TO service_role;",
  "'cancelled_learning_source_acks',v_cancelled_learning_source_acks",
 ]) assert.ok(sql.includes(p),'missing original protected source or authorization gate: '+p);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bnet\.http_post\s*\(/i);
});

test('original ONE BRAIN lesson explicitly keeps commercial/learning RED separate',()=>{
 const r=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-13-original-provider-842-cancelled-learning-source-lock-v1.json',import.meta.url),'utf8'));
 assert.equal(r.provider_applied_verified,true);
 assert.equal(r.all_loops_green,false);
 assert.equal(r.proven_customer_revenue_eur,0);
 assert.equal(r.new_provider_send_count,0);
 assert.equal(r.same_original_gitops_owner,true);
});

