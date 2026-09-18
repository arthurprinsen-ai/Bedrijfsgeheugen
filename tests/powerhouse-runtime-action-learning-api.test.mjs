import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/powerhouse-runtime/index.ts','utf8');

test('canonical powerhouse runtime exposes economics and feedback on the same core as actions and outcomes',()=>{
  assert.match(source,/actions:'actions'/);
  assert.match(source,/outcomes:'outcomes'/);
  assert.match(source,/economics:'learning'/);
  assert.match(source,/feedback:'learning'/);
  assert.match(source,/route==='economics'.*recordEconomics/s);
  assert.match(source,/route==='feedback'.*recordFeedback/s);
});

test('economics uses canonical idempotent RPC and never invents zero economics',()=>{
  assert.match(source,/rpc\/powerhouse_record_action_economics_v1/);
  assert.match(source,/p_dedupe_key:dedupeKey/);
  assert.match(source,/p_observed_at:observedAt\.toISOString\(\)/);
  assert.match(source,/OBSERVED_ECONOMICS_REQUIRED/);
  assert.match(source,/ECONOMICS_EVIDENCE_REQUIRED/);
  assert.doesNotMatch(source,/providerCostEur=0/);
  assert.doesNotMatch(source,/humanMinutes=0/);
});

test('feedback uses canonical idempotent RPC with explicit evidence and action lineage',()=>{
  assert.match(source,/rpc\/powerhouse_record_human_feedback_v1/);
  assert.match(source,/FEEDBACK_EVIDENCE_REQUIRED/);
  assert.match(source,/powerhouse_sales_actions\?action_id=eq\./);
  assert.match(source,/p_opportunity_key:action\.opportunity_key/);
  assert.match(source,/p_subject_key:action\.subject_key/);
  assert.match(source,/ACTUAL_VARIANT_REQUIRED/);
  assert.match(source,/ALTERNATIVE_ACTION_REQUIRED/);
});

test('action learning endpoints remain authenticated by device-token scope',()=>{
  assert.match(source,/economics:'learning'/);
  assert.match(source,/feedback:'learning'/);
  assert.match(source,/authorized\(req,scope\)/);
});
