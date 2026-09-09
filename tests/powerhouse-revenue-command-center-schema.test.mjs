import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const migrationUrl = new URL('../supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql', import.meta.url);
const source = () => readFile(migrationUrl, 'utf8');
test('command center opportunity projection is private and bounded', async () => {
 const sql=await source();
 assert.match(sql,/create table if not exists public\.powerhouse_opportunities/i);
 assert.match(sql,/create table if not exists public\.powerhouse_opportunity_stage_events/i);
 assert.match(sql,/alter table public\.powerhouse_opportunities enable row level security/i);
 assert.match(sql,/grant all on public\.powerhouse_opportunities to service_role/i);
 assert.match(sql,/powerhouse_command_center_snapshot\(p_limit integer default 15\)/i);
 assert.match(sql,/least\(coalesce\(p_limit,15\),50\)/i);
});
test('opportunity lifecycle and expected-value evidence are explicit', async () => {
 const sql=await source();
 for (const stage of ['signal','opportunity','lead','meeting','offer','order','revenue','lost']) assert.match(sql,new RegExp(stage,'i'));
 for (const field of ['expected_order_value_eur','order_probability','probability_confidence','expected_revenue_eur','last_evidence_at','next_action_at']) assert.match(sql,new RegExp(field,'i'));
});
