import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const exact={version:'20261113164000',name:'original_seo_one_chain_outcome_assurance_v2'};
const previous={version:'20261113155800',name:'original_historic_handoff_source_revision_priority_v1'};
const path='../supabase/migrations/'+exact.version+'_'+exact.name+'.sql';

test('provider 849: 848 immutable original identities retained, only independently observed 849 appended',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=849);
 assert.deepEqual(lock.applied[847],previous);
 assert.deepEqual(lock.applied[848],exact);
 assert.equal(lock.applied.filter(x=>x.version===exact.version).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.ok(lock.applied.every((v,i)=>i===0||v.version>lock.applied[i-1].version));
 assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T17:08:05.767534Z'));
 assert.equal(existsSync(new URL(path,import.meta.url)),true);
});

test('original SEO production contract requires exact source and consumer ACK before action, measurement, outcome and learning',()=>{
 const sql=readFileSync(new URL(path,import.meta.url),'utf8');
 for(const token of [
  'CREATE OR REPLACE FUNCTION public.powerhouse_refresh_seo_assurance_v1(',
  'GROWTH_SOURCE_DAILY_HANDOFF',
  "'{consumer_ack,consumed_revision}'",
  "'original powerhouse-content-orchestrator-140'",
  "'LIVE_PROVEN'",
  "'{execution,production_readback,verified}'",
  "'{measurement,independent_source_verified}'",
  "'{learning,next_original_run_readback_verified}'",
  "AND v_original.state='FULFILLED'",
  "v_guard := coalesce(v_guard,false)",
  "PERFORM public.powerhouse_record_loop_stage_v1("
 ])assert.ok(sql.includes(token),'missing ORIGINAL chain-proof token '+token);
 assert.doesNotMatch(sql,/cron\.schedule|cron\.unschedule|net\.http_post|CREATE TABLE|CREATE TRIGGER|GRANT .*TO (anon|authenticated)/i);
});

test('preserve source-only migration idempotence and original ONE BRAIN terminal proof gate',()=>{
 const migration=readFileSync(new URL(path,import.meta.url),'utf8');
 const original=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 assert.match(migration,/CREATE OR REPLACE FUNCTION public\.powerhouse_refresh_seo_assurance_v1/);
 assert.match(migration,/WHEN NOT v_execution_proven THEN 'WAIT_PRODUCTION_ACTION'/);
 assert.match(migration,/WHEN NOT v_learning_proven THEN 'WAIT_LEARNING_NEXT_RUN'/);
 assert.match(original,/CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED/);
 assert.doesNotMatch(migration,/INSERT INTO public\.content_publication_obligations|UPDATE public\.content_publication_obligations/i);
});
