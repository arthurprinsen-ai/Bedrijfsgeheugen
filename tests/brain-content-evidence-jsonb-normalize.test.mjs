import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261011111500_normalize_powerhouse_delivery_evidence_jsonb_v1.sql','utf8');
test('normalize both serialized JSON strings and accidental merged-array encoding',()=>{
  assert.match(sql,/jsonb_typeof\(v\) = 'string'/);
  assert.match(sql,/\(v #>> '\{\}'\)::jsonb/);
  assert.match(sql,/jsonb_array_length\(v\) = 2/);
  assert.match(sql,/\(\(v->>0\)::jsonb\) \|\| \(v->1\)/);
});
test('existing evidence is never silently discarded or marked as delivered',()=>{
  assert.match(sql,/POWERHOUSE_DELIVERY_EVIDENCE_NOT_OBJECT/);
  assert.doesNotMatch(sql,/UPDATE\s+public\.content_publication_obligations/i);
  assert.doesNotMatch(sql,/LIVE_PROVEN|provider_truth_verified\s*=\s*true/);
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|GRANT\s+EXECUTE/i);
});
test('normalizes at single original table, caller privileges, deterministic search path',()=>{
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/SET search_path TO public, pg_catalog/);
  assert.match(sql,/BEFORE INSERT OR UPDATE OF delivery_evidence/);
  assert.match(sql,/ON public\.powerhouse_channel_decisions/);
  assert.match(sql,/NEW\.delivery_evidence := v/);
});
test('historical records remain untouched and same-day replay is safe',()=>{
  assert.match(sql,/run_date = \(now\(\) AT TIME ZONE 'Europe\/Amsterdam'\)::date/);
  assert.match(sql,/jsonb_typeof\(delivery_evidence\) IN \('string', 'array'\)/);
});
