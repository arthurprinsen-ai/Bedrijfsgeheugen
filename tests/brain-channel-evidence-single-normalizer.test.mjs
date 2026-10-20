import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261011124000_consolidate_channel_evidence_normalizer_v1.sql','utf8');
test('uses pre-existing canonical trigger function and caller privileges',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_channel_decision_evidence_normalize_v1/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/);
  assert.match(sql,/REVOKE EXECUTE ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/TO service_role/);
});
test('handles legacy JSON string, repeated encoding and the known two-item array',()=>{
  assert.match(sql,/FOR iteration IN 1\.\.5 LOOP/);
  assert.match(sql,/parsed #>> '\{\}'/);
  assert.match(sql,/jsonb_array_length\(parsed\) = 2/);
  assert.match(sql,/\(\(parsed->>0\)::jsonb\) \|\| \(parsed->1\)/);
  assert.match(sql,/CHANNEL_DECISION_EVIDENCE_OBJECT_REQUIRED/);
});
test('removes the duplicate trigger without changing provider side effects',()=>{
  assert.match(sql,/DROP TRIGGER IF EXISTS powerhouse_normalize_delivery_evidence_jsonb_trg/);
  assert.doesNotMatch(sql,/CREATE TRIGGER|UPDATE public\.content_publication_obligations|net\.http_post|cron\.schedule/);
  assert.match(sql,/SET delivery_evidence = delivery_evidence/);
});
