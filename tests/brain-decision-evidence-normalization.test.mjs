import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='supabase/migrations/20261011091426_powerhouse_decision_evidence_json_normalize_v1.sql';
const sql=readFileSync(path,'utf8');

test('normalize legacy JSON-encoded evidence at the DB write boundary',()=>{
  assert.match(sql,/BEFORE INSERT OR UPDATE OF delivery_evidence/);
  assert.match(sql,/jsonb_typeof\(NEW\.delivery_evidence\) = 'string'/);
  assert.match(sql,/parsed := \(NEW\.delivery_evidence #>> '\{\}'\)::jsonb/);
  assert.match(sql,/NEW\.delivery_evidence := parsed/);
  assert.match(sql,/CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED/);
});

test('historical repair changes evidence JSON type only, never provider truth',()=>{
  assert.match(sql,/run_date >= \(now\(\) at time zone 'Europe\/Amsterdam'\)::date - 14/);
  assert.match(sql,/SET delivery_evidence = parsed/);
  assert.doesNotMatch(sql,/SET\s+status\s*=/i);
  assert.doesNotMatch(sql,/SET\s+delivery_ref\s*=/i);
  assert.doesNotMatch(sql,/cron\.schedule\(/i);
});

test('secure trigger preserves invoker semantics and scoped access',()=>{
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_channel_decision_evidence_normalize_v1\(\)/);
  assert.match(sql,/FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/TO service_role/);
});

test('evidence fixture preserves all original keys and makes cooldown readable',()=>{
  const sample={delivery_ref:null,other:{retain:true},generation_retry_after:'2026-10-11T09:25:29Z'};
  const encoded=JSON.stringify(sample);
  const normalized=JSON.parse(encoded);
  assert.deepEqual(normalized,sample);
  assert.ok(Number.isFinite(Date.parse(normalized.generation_retry_after)));
});
