import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260918181638_powerhouse_policy_canonicalization_guard_v1.sql';

test('promotion guard reuses existing policy and learning authorities', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/on public\.powerhouse_policy_versions/i);
  assert.match(sql,/public\.powerhouse_learning_compiler_v1/);
  assert.doesNotMatch(sql,/create\s+table/i);
});

test('promotion is fail-closed without green evaluation identity evidence', async()=>{
  const sql=await readFile(path,'utf8');
  for(const token of [
    'POLICY_PROMOTION_EVALUATION_NOT_GREEN',
    'POLICY_PROMOTION_COMPILER_CONTRACT_MISSING',
    'POLICY_PROMOTION_CANDIDATE_IDENTITY_MISMATCH',
    'POLICY_PROMOTION_EVALUATED_AT_MISSING',
    'POLICY_PROMOTION_EFFECT_SNAPSHOT_REQUIRED'
  ]) assert.match(sql,new RegExp(token));
});

test('compiler-selected replay shadow and canary requirements are enforced', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/HISTORICAL_REPLAY/);
  assert.match(sql,/POLICY_PROMOTION_HISTORICAL_REPLAY_REQUIRED/);
  assert.match(sql,/POLICY_PROMOTION_SHADOW_REQUIRED/);
  assert.match(sql,/POLICY_PROMOTION_CANARY_REQUIRED/);
  assert.match(sql,/POLICY_PROMOTION_SHADOW_AND_CANARY_REQUIRED/);
});

test('canonicalization contract drift itself fails closed', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/LEARNING_COMPILER_CANONICAL_ELIGIBILITY_CONTRACT_DRIFT/);
  assert.match(sql,/LEARNING_COMPILER_CANONICALIZATION_CONTRACT_DRIFT/);
  assert.match(sql,/evaluation_evidence_required/);
});

test('canonicalization proof is written into existing policy evidence', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/powerhouse-policy-canonicalization-guard-v1/);
  assert.match(sql,/canonicalized_at/);
  assert.match(sql,/evaluation_status','GREEN'/);
});
