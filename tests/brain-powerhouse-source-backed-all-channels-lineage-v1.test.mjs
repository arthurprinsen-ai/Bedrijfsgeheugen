import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql','utf8');
test('all outbound channels share one source/outcome lineage',()=>{
  for(const s of ['linkedin_personal','linkedin_company','blog','instagram_company','linkedin_dm','email']) assert.ok(sql.includes(s));
  for(const s of ['powerhouse_content_recommendations','powerhouse_channel_decisions','powerhouse_sales_actions','powerhouse_email_reply_events','powerhouse_sales_outcomes','social_metric_snapshots']) assert.ok(sql.includes(s));
  assert.ok(sql.includes('powerhouse-source-backed-all-channels-v1'));
  assert.ok(sql.includes('powerhouse_refresh_outbound_source_lineage_v1'));
  const selection=fs.readFileSync('supabase/migrations/20260929214500_powerhouse_source_backed_channel_selection_v1.sql','utf8');
  const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.ok(selection.includes('powerhouse_materialize_source_backed_channel_candidates_v1'));
  assert.ok(selection.includes('powerhouse_sales_actions_source_gate_v1'));
  assert.ok(orchestrator.includes("row?.evidence?.source_backed === true"));
  assert.ok(orchestrator.includes('powerhouse_materialize_source_backed_channel_candidates_v1'));
  const loops=JSON.parse(fs.readFileSync('powerhouse/assurance/loop-registry.json','utf8'));
  const outbound=loops.loops.find(x=>x.loop_key==='source-backed-outbound');
  assert.ok(outbound);
  assert.equal(outbound.cron_jobname,'powerhouse-outbound-source-lineage-hourly-v1');
  assert.deepEqual(outbound.required_stages,['input','decision','action','readback','outcome','measurement','learning','guard']);
});

test('blog source and SEO keyword must be semantically coherent',()=>{
  const sql=fs.readFileSync('supabase/migrations/20260929223000_powerhouse_source_backed_blog_semantic_coherence_v1.sql','utf8');
  assert.ok(sql.includes('semantic_search_match'));
  assert.ok(sql.includes('shared_problem_token_len_gte_5'));
  assert.ok(sql.includes("regexp_split_to_table"));
  assert.ok(sql.includes("lower(z.zoekwoord) like"));
});
