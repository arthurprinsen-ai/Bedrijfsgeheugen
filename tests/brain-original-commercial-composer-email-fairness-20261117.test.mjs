import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261117102500_original_composer_email_channel_fairness_v1.sql',import.meta.url),'utf8');

test('same original composer RPC and same status/quality filters, no alternate provider transport',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_message_candidates_v1\(/i);
  assert.match(sql,/RETURNS SETOF public\.powerhouse_commercial_message_plan_v1/i);
  assert.match(sql,/p_channels text\[\] DEFAULT NULL::text\[\]/i);
  assert.match(sql,/p_action_ids uuid\[\] DEFAULT NULL::uuid\[\]/i);
  assert.match(sql,/p\.status IN \('prepared','suggested','waiting'\)/i);
  assert.match(sql,/commercial_intelligence,composer,contract/);
  assert.match(sql,/commercial_intelligence,quality_passed/);
  assert.match(sql,/p\.action_id = ANY\(p_action_ids\)/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|create\s+table\s+|grant\s+execute|update\s+public\.powerhouse_sales_actions/i);
});

test('reserves one or two email slots, preserving other channel slots and bounded batches',()=>{
  assert.match(sql,/row_number\(\) OVER/i);
  assert.match(sql,/PARTITION BY CASE/i);
  assert.match(sql,/p\.channel_norm IN \('email','e-mail'\)/);
  assert.match(sql,/e\.lane_rank <= LEAST\(2,/);
  assert.match(sql,/CEIL\(GREATEST\(1,LEAST\(coalesce\(p_limit,10\),50\)\)::numeric \* 0\.4\)/);
  assert.match(sql,/ORDER BY[\s\S]*p\.priority DESC, p\.action_id[\s\S]*LIMIT GREATEST\(1,LEAST\(coalesce\(p_limit,10\),50\)\)/i);
});

test('with five slots a lower-scored prepared email is not starved by old high-score DMs',()=>{
  const candidates=[
    ...[1020,78.67,74.68,74.04,71.58,70.82,69.32].map((priority,i)=>({id:'dm'+i,channel:'linkedin_dm',status:'suggested',priority})),
    {id:'emailnew',channel:'email',status:'prepared',priority:66.38},
    {id:'emailold',channel:'email',status:'waiting',priority:64.98},
    {id:'emailhold',channel:'email',status:'prepared',priority:38.93}
  ];
  const emails=candidates.filter(x=>x.channel==='email').sort((a,b)=>
    (a.status==='prepared'?0:1)-(b.status==='prepared'?0:1)||b.priority-a.priority);
  const reserved=new Set(emails.slice(0,2).map(x=>x.id));
  const chosen=candidates.sort((a,b)=>(reserved.has(a.id)?0:1)-(reserved.has(b.id)?0:1)||b.priority-a.priority).slice(0,5);
  assert.deepEqual(chosen.filter(x=>x.channel==='email').map(x=>x.id),['emailnew','emailhold']);
  assert.equal(chosen.filter(x=>x.channel==='linkedin_dm').length,3);
  assert.ok(chosen.every(x=>x.channel==='email'||x.channel==='linkedin_dm'));
});

test('the user-approved candidate remains subject to original composer and Gmail gates',()=>{
  assert.doesNotMatch(sql,/insert\s+into\s+public\.powerhouse_sales_outcomes/i);
  assert.doesNotMatch(sql,/status\s*=\s*'done'/i);
  assert.doesNotMatch(sql,/provider_ack_verified.*true/i);
  assert.doesNotMatch(sql,/set\s+.+human_approved/i);
  assert.doesNotMatch(sql,/disable|alter\s+job|unschedule/i);
});

test('clean-room preview has explicit dependency-missing classification, while production executes unchanged source SQL',()=>{
  assert.match(sql,/to_regclass\('public\.powerhouse_commercial_message_plan_v1'\) IS NULL/);
  assert.match(sql,/ORIGINAL_COMPOSER_PREVIEW_DEPENDENCY_MISSING/);
  assert.match(sql,/ELSE[\s\S]*EXECUTE \$original_source\$[\s\S]*CREATE OR REPLACE FUNCTION/);
  assert.match(sql,/Original production SQL readback mandatory/);
});
