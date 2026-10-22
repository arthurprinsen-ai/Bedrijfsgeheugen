import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261020125000_p0_4215_bounded_internal_research_economics.sql',import.meta.url),'utf8');
const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-10-20-bounded-internal-research-economics-p0-4215.json',import.meta.url),'utf8'));
test('existing economics backfill is bounded and idempotent, without dropping eligible history',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_backfill_internal_research_economics_v1/);
  assert.match(sql,/limit 50\s+loop/i);
  for(const term of ["a.status='done'","a.executed_at is not null","a.action_type='research_enrichment'","a.channel='internal'","human_approved","evidence_only","not exists","e.action_id=a.action_id"])assert.ok(sql.includes(term),term);
  assert.doesNotMatch(sql,/executed_at\s*>\s*now\(/i);
  assert.match(sql,/powerhouse_record_action_economics_v1/);
  assert.match(sql,/'economics:'\|\|r.action_id/);
});
test('cost truth and privileges unchanged',()=>{
  for(const term of ["SECURITY DEFINER","SET search_path TO 'public', 'pg_catalog'","'provider_cost_eur','UNOBSERVED'","'external_cost_eur','UNOBSERVED'","'no_zero_cost_claim',true","'human_minutes',0","r.executed_at"])assert.ok(sql.includes(term),term);
  assert.doesNotMatch(sql,/\b(?:DELETE|TRUNCATE|DROP|UNSCHEDULE)\b/i);
});
test('index is safely guarded for the exact producer without affecting cron',()=>{
  assert.match(sql,/SET LOCAL lock_timeout = '2s'/);
  assert.match(sql,/SET LOCAL statement_timeout = '20s'/);
  assert.match(sql,/CREATE INDEX IF NOT EXISTS powerhouse_sales_actions_internal_research_economics_candidates_p04215_idx/);
  assert.match(sql,/ON public\.powerhouse_sales_actions \(action_id\)/);
  assert.doesNotMatch(sql,/\bcron\./);
});
test('Brain learning contains replay, root cause and explicit non-green boundaries',()=>{
  assert.equal(learning.status,'CANDIDATE');
  assert.ok(learning.root_cause.includes('unbounded'));
  assert.ok(learning.prevention_rule.includes('50'));
  assert.ok(learning.evaluation.historical_replay.length>0);
  assert.equal(learning.production_verified,false);
});

test('SECURITY DEFINER is server-only and browser roles are explicitly denied direct EXECUTE',()=>{
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_backfill_internal_research_economics_v1\(timestamp with time zone\)[\s\S]*?FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_backfill_internal_research_economics_v1\(timestamp with time zone\)[\s\S]*?TO service_role/);
});
