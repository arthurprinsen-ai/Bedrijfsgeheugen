import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/migrations/20261015194000_powerhouse_provider_verified_social_daily_status_v1.sql',import.meta.url),'utf8');

test('daily published-social metric uses provider-verified canonical social evidence, never legacy-only social_posts',()=>{
  const social=source.match(/\), s as \(([\s\S]*?)\)\nselect jsonb_build_object/);
  assert.ok(social,'canonical social counter CTE must exist');
  const sql=social[1];
  assert.match(sql,/from public\.powerhouse_channel_decisions/i);
  assert.match(sql,/count\(distinct btrim\(delivery_ref\)\)::int as published_social_count/i);
  assert.match(sql,/decision='publish'/);
  assert.match(sql,/channel in \('linkedin_personal','linkedin_company','instagram_company'\)/);
  assert.match(sql,/state in \('published','measured','learned'\)/);
  assert.match(sql,/nullif\(btrim\(delivery_ref\),'\'\) is not null/);
  assert.match(sql,/provider_truth_verified/);
  assert.match(sql,/coalesce\(\(delivery_evidence->>'provider_truth_verified'\)::boolean,false\)=true/);
  assert.match(sql,/delivery_ref ~ '\^urn:li:\(share\|ugcPost\):\[0-9\]\+\$'/);
  assert.doesNotMatch(sql,/from public\.social_posts/);
  assert.doesNotMatch(sql,/provider_status.*published/, 'state alone must not be provider proof');
});

test('unverified personal LinkedIn publication cannot be counted as independently verified',()=>{
  const receipts=[
    {channel:'linkedin_company',state:'published',provider_truth_verified:true,id:'urn:li:share:7516489347345334272'},
    {channel:'linkedin_personal',state:'published',provider_truth_verified:false,id:'urn:li:share:7516487392590217216'},
    {channel:'blog',state:'published',provider_truth_verified:true,id:'https://www.bedrijfsgeheugen.nl/blog/example/'},
    {channel:'linkedin_company',state:'published',provider_truth_verified:true,id:'urn:li:share:7516489347345334272'},
  ];
  const ids=new Set(receipts.filter(r=>['linkedin_company','linkedin_personal','instagram_company'].includes(r.channel)
    && ['published','measured','learned'].includes(r.state)
    && r.provider_truth_verified && r.id
    && (r.channel==='instagram_company'||/^urn:li:(share|ugcPost):[0-9]+$/.test(r.id)))
    .map(r=>r.id.trim()));
  assert.equal(ids.size,1,'deduplicate company provider ID and exclude unverified personal post and blog');
});

test('daily guard refreshes degraded evidence but never falsely upgrades missing proof to completed',()=>{
  assert.match(source,/elsif current_state in \('started','degraded'\) and not all_ok then/);
  assert.match(source,/'execution_status',combined/);
  assert.match(source,/if all_ok and current_state in \('started','degraded'\) then/);
  assert.match(source,/elsif current_state='completed' and not all_ok then/);
  const branch=source.split("elsif current_state in ('started','degraded') and not all_ok then")[1].split("end if;")[0];
  assert.doesNotMatch(branch,/state\s*=\s*'completed'/);
  assert.doesNotMatch(branch,/completed_at\s*=/);
  assert.match(source,/public\.powerhouse_publication_proof_health\(p_run_date\)/);
  assert.match(source,/public\.powerhouse_predictive_health\(p_run_date\)/);
  assert.match(source,/public\.powerhouse_autonomous_growth_revenue_cycle\(p_run_date\)/);
});
