import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261024224500_growth_bounded_research_inside_existing_heartbeat.sql',import.meta.url),'utf8');
const memory=JSON.parse(readFileSync(new URL('../brain/learning/2026-10-24-growth-zero-eligible-research-v1.json',import.meta.url),'utf8'));
test('no second scheduler or external sends; existing growth selector preserved',()=>{
 for(const x of ["public.powerhouse_autonomous_growth_revenue_cycle(date)","anchor_step","select public.powerhouse_growth_bounded_research_v1(p_run_date) into v_research_tasks","CANONICAL_GROWTH_FUNCTION_DRIFT_ABORT"])assert.ok(sql.includes(x));
 assert.doesNotMatch(sql,/\bcron\.schedule|\bnet\.http_post|\bINSERT INTO public\.content_publication_obligations/i);
 assert.match(sql,/internal_research_tasks_materialized'','v_research_tasks|internal_research_tasks_materialized'',v_research_tasks/);
});
test('bounded idempotent internal source investigation does not invent buyer intent',()=>{
 for(const x of ["DISTINCT ON (o.topic_key)","LIMIT 3","interval '72 hours'","o.confidence>=0.70","o.stage='signal'","o.topic_key LIKE 'mkb-trigger:%'","ON CONFLICT (dedupe_key) DO NOTHING","'research_enrichment','internal'","'provider_contact_authorized',false","'publication_authorized',false","'commercial_outcome_verified',false","'expected_revenue_status','UNKNOWN_NOT_REVENUE_EVIDENCE'"])assert.ok(sql.includes(x),x);
 assert.match(sql,/'','suggested',now\(\),r.topic_key,r.opportunity_key,0/);
});
test('backend-only privilege and existing proof registry enforce safe delivery',()=>{
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_growth_bounded_research_v1\(date\)[\s\S]*FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/SECURITY DEFINER[\s\S]*SET search_path TO 'public', 'pg_catalog', 'pg_temp'/);
 assert.match(sql,/SET LOCAL lock_timeout = '2s'/);
 assert.equal(memory.status,'CANDIDATE');
 assert.equal(memory.production_verified,false);
 assert.ok(memory.evaluation.historical_replay[0].includes('brain-growth-zero-eligible-research-v1.test.mjs'));
});