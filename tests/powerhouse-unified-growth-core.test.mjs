import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeUrl=new URL('../supabase/functions/powerhouse-runtime/index.ts',import.meta.url);
const migrationUrl=new URL('../supabase/migrations/20260909103000_powerhouse_unified_growth_core.sql',import.meta.url);
const readRuntime=()=>readFile(runtimeUrl,'utf8');
const readMigration=()=>readFile(migrationUrl,'utf8');

test('revenue-first outcome hierarchy is explicit and monotonic',async()=>{
  const code=await readRuntime();
  const match=code.match(/const OUTCOME_WEIGHTS=Object\.freeze\((\{[^;]+\})\);/s);
  assert.ok(match,'OUTCOME_WEIGHTS must exist');
  const w=Function(`return (${match[1]})`)();
  assert.ok(w.revenue>w.order && w.order>w.offer && w.offer>w.meeting && w.meeting>w.reply && w.reply>w.lead && w.lead>w.engagement && w.engagement>w.impression);
});

test('shared learning can be resolved by subject, topic and channel',async()=>{
  const code=await readRuntime();
  assert.match(code,/async function learnedAdjustment\(subject:string,topic:string,channel:string\)/);
  assert.match(code,/topic_key=eq\./);
  assert.match(code,/channel=eq\./);
  assert.match(code,/sample_size/);
});

test('canonical growth identities are persisted across event action outcome and learning records',async()=>{
  const sql=await readMigration();
  for(const column of ['content_key','topic_key','campaign_key','opportunity_key']) assert.match(sql,new RegExp(`add column if not exists ${column}`,'i'));
  assert.match(sql,/create table if not exists public\.powerhouse_content_recommendations/i);
  assert.match(sql,/create table if not exists public\.powerhouse_daily_runs/i);
});

test('new unified runtime tables remain private by default',async()=>{
  const sql=await readMigration();
  for(const table of ['powerhouse_content_recommendations','powerhouse_daily_runs']){
    assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
    assert.match(sql,new RegExp(`revoke all on public\\.${table} from anon, authenticated`,'i'));
    assert.match(sql,new RegExp(`grant all on public\\.${table} to service_role`,'i'));
  }
});

test('unified runtime declares social blog seo website and sales evidence as one core',async()=>{
  const code=await readRuntime();
  for(const event of ['social_metric_observed','blog_published','seo_metric_observed','website_conversion','lead_created','order_won','revenue_observed']) assert.ok(code.includes(event),`missing ${event}`);
  assert.match(code,/unifiedCore:true/);
  assert.match(code,/makeCriticalPath:false/);
});
