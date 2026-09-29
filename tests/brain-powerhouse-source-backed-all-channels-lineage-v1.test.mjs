import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql','utf8');
test('all outbound channels share one source/outcome lineage',()=>{
  for(const s of ['linkedin_personal','linkedin_company','blog','instagram_company','linkedin_dm','email']) assert.ok(sql.includes(s));
  for(const s of ['powerhouse_content_recommendations','powerhouse_channel_decisions','powerhouse_sales_actions','powerhouse_email_reply_events','powerhouse_sales_outcomes','social_metric_snapshots']) assert.ok(sql.includes(s));
  assert.ok(sql.includes('powerhouse-source-backed-all-channels-v1'));
  assert.ok(sql.includes('powerhouse_refresh_outbound_source_lineage_v1'));
});
