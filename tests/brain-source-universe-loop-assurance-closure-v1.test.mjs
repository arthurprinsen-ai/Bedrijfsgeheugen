import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration='supabase/migrations/20261007221130_source_universe_loop_assurance_closure_v1.sql';
const learning='brain/learning/2026-10-07-source-universe-loop-assurance-closure-v1.json';
const read=()=>readFile(migration,'utf8');

test('Source Universe assurance closes action outcome learning with truthful no-op evidence',async()=>{
  const sql=await read();
  for(const stage of ["'action'","'outcome'","'learning'"])assert.ok(sql.includes(stage),stage);
  assert.match(sql,/NO_MATERIALIZATION_TRUTH_GATED/);
  assert.match(sql,/NO_VERIFIED_OUTCOME_OBSERVED/);
  assert.match(sql,/NO_NEW_VERIFIED_OUTCOME_TO_LEARN/);
  assert.match(sql,/business_action_fabricated',false/);
  assert.match(sql,/outcome_synthesized',false/);
  assert.match(sql,/learning_synthesized',false/);
  assert.match(sql,/fulfilled_obligation_is_business_outcome',false/);
});

test('guard receipt is emitted only when server-only and truth boundaries pass',async()=>{
  const sql=await read();
  assert.match(sql,/v_guard_ok:=v_table_guard_ok and v_function_guard_ok and v_truth_guard_ok/);
  assert.match(sql,/stage,'guard'/);
  assert.match(sql,/status','PASS'/);
  assert.match(sql,/delete from public\.powerhouse_loop_assurance_receipts_v1[\s\S]*stage='guard'/);
  assert.match(sql,/has_table_privilege\('anon'/);
  assert.match(sql,/has_table_privilege\('authenticated'/);
  assert.match(sql,/has_table_privilege\('service_role'/);
  assert.match(sql,/has_function_privilege\('anon'/);
  assert.match(sql,/has_function_privilege\('authenticated'/);
  assert.match(sql,/has_function_privilege\('service_role'/);
  assert.match(sql,/unknown_never_green/);
  assert.match(sql,/money_values_require_evidence/);
});

test('receipt closure is wired to the existing Source Universe runtime event without a parallel scheduler',async()=>{
  const sql=await read();
  assert.match(sql,/powerhouse_external_intelligence_assurance_receipt_v1/);
  assert.match(sql,/after insert or update on public\.powerhouse_runtime_events/i);
  assert.match(sql,/new\.source='powerhouse-external-intelligence-universe-v1'/);
  assert.match(sql,/new\.event_type='external_intelligence_universe_refresh'/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
});

test('receipt writer is server-only and search-path pinned',async()=>{
  const sql=await read();
  assert.match(sql,/security definer[\s\S]*set search_path to 'public','pg_catalog'/i);
  assert.match(sql,/revoke all on function public\.powerhouse_sync_external_intelligence_assurance_receipts_v1\(timestamptz\)[\s\S]*from public,anon,authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_sync_external_intelligence_assurance_receipts_v1\(timestamptz\)[\s\S]*to service_role/i);
  assert.match(sql,/revoke all on function public\.powerhouse_external_intelligence_assurance_receipt_trigger_v1\(\)[\s\S]*from public,anon,authenticated/i);
});

test('migration backfills from proven runtime state rather than fabricating new business data',async()=>{
  const sql=await read();
  assert.match(sql,/select public\.powerhouse_sync_external_intelligence_assurance_receipts_v1\(now\(\)\)/);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_intelligence_signal_projection_v1/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_intelligence_company_impact_v1/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_intelligence_action_candidate_v1/i);
});

test('security-sensitive learning declares replay shadow and canary evaluation evidence',async()=>{
  const record=JSON.parse(await readFile(learning,'utf8'));
  assert.equal(record.compiler.security_sensitive,true);
  const expected=['tests/brain-source-universe-loop-assurance-closure-v1.test.mjs'];
  assert.deepEqual(record.evaluation.historical_replay,expected);
  assert.deepEqual(record.evaluation.shadow,expected);
  assert.deepEqual(record.evaluation.canary,expected);
});
