import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const lock=JSON.parse(read('supabase/migration-history.lock.json'));
const sql=read('supabase/migrations/20261114101000_original_research_consumer_handoff_receipts_v1.sql');
test('the immutable original provider history preserves first 854 and appends independently applied 855',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,855);
 assert.deepEqual(lock.applied.at(-2),{version:'20261114091500',name:'original_outreach_source_research_cooldown_scope_v2'});
 assert.deepEqual(lock.applied.at(-1),{version:'20261114101000',name:'original_research_consumer_handoff_receipts_v1'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,855);
 assert.equal(lock.applied.every((x,i)=>i===0||x.version>lock.applied[i-1].version),true);
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-14T09:20:28Z'));
});
test('applied native source preserves original #116, exact research-owner receipts and no Gmail authorization',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_reconcile_relationship_research_handoff_v1/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_hourly_stage_v1/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_dispatch_relationship_public_research_v1/);
 assert.match(sql,/original-research-owner-handoff:/);
 assert.match(sql,/original_consumer_receipt/);
 assert.match(sql,/'gmail_provider_delivery_proven',false/);
 assert.match(sql,/c\.subject_key,null,null,'internal',v_now/);
 assert.match(sql,/and \(due_at is null or due_at<=now\(\)\)/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|\bcreate\s+table\b/i);
 // pg_net in the already-authorized original research dispatcher is retained, not a new sender.
 assert.match(sql,/powerhouse-relationship-public-research/);
});
