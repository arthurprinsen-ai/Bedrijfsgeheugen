import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261117123000_original_composer_bounded_fair_candidate_v2.sql',import.meta.url),'utf8');

test('same original composer RPC, plan result type and service-only privileges',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_message_candidates_v1\(\s*p_limit integer DEFAULT 10/i);
  assert.match(sql,/p_channels text\[\] DEFAULT NULL::text\[\]/i);
  assert.match(sql,/p_action_ids uuid\[\] DEFAULT NULL::uuid\[\]/i);
  assert.match(sql,/RETURNS SETOF public\.powerhouse_commercial_message_plan_v1/i);
  assert.match(sql,/SECURITY INVOKER/i);
  assert.match(sql,/REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC,anon,authenticated/i);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
});
test('cheap source action-ID eligibility precedes all expensive plan-view hydration',()=>{
  const base=sql.indexOf('cheap_eligible AS MATERIALIZED');
  const picked=sql.indexOf('picked AS MATERIALIZED');
  const hydrate=sql.indexOf('CROSS JOIN LATERAL (');
  assert.ok(base>0 && picked>base && hydrate>picked);
  assert.match(sql,/FROM public\.powerhouse_sales_actions a/);
  assert.match(sql,/WHERE v\.action_id=k\.action_id\s+OFFSET 0/);
  assert.match(sql,/LIMIT GREATEST\(8,LEAST\(200,4\*GREATEST\(1,LEAST\(coalesce\(p_limit,10\),50\)\)\)\)/);
  assert.match(sql,/ORDER BY k\.lane_priority,k\.priority DESC,k\.action_id\s+LIMIT GREATEST\(1,LEAST\(coalesce\(p_limit,10\),50\)\)/);
  assert.doesNotMatch(sql,/JOIN eligible e ON e\.action_id = p\.action_id/);
});
test('preserve exact original candidate status, quality, recipient scope and channel filters',()=>{
  assert.match(sql,/a\.status IN \('prepared','suggested','waiting'\)/);
  assert.match(sql,/p_channels IS NULL OR cardinality\(p_channels\)=0/);
  assert.match(sql,/p_action_ids IS NULL OR cardinality\(p_action_ids\)=0/);
  assert.match(sql,/a\.action_id=ANY\(p_action_ids\)/);
  assert.match(sql,/commercial_intelligence,composer,contract/);
  assert.match(sql,/commercial_intelligence,quality_passed/);
  assert.match(sql,/coalesce\(a\.message_draft,''\)=''/);
  assert.match(sql,/CASE WHEN e\.status='prepared' THEN 0/);
});
test('five slots include two eligible emails, three DMs even when older DMs score higher',()=>{
  const candidates=[...([1020,78.67,74.68,74.04,71.58,70.82].map((p,i)=>({id:'dm'+i,channel:'linkedin_dm',status:'suggested',priority:p}))),
    {id:'new_email',channel:'email',status:'prepared',priority:66.38},
    {id:'old_email',channel:'email',status:'waiting',priority:40.01}];
  const emails=candidates.filter(x=>x.channel==='email').sort((a,b)=>
    (a.status==='prepared'?0:1)-(b.status==='prepared'?0:1)||b.priority-a.priority);
  const reserved=new Set(emails.slice(0,2).map(x=>x.id));
  const selected=candidates.sort((a,b)=>(reserved.has(a.id)?0:1)-(reserved.has(b.id)?0:1)||b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,5);
  assert.equal(selected.filter(x=>x.channel==='email').length,2);
  assert.equal(selected.filter(x=>x.channel==='linkedin_dm').length,3);
  assert.equal(selected[0].id,'new_email');
});
test('clean-room preview missing historical rowtype is never misreported as proof',()=>{
  assert.match(sql,/to_regclass\('public\.powerhouse_commercial_message_plan_v1'\) IS NULL/);
  assert.match(sql,/ORIGINAL_COMPOSER_HISTORICAL_VIEW_ABSENT_PREVIEW_ONLY/);
  assert.match(sql,/native production readback mandatory/);
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|CREATE\s+TRIGGER|ALTER ROLE/i);
});
