import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const schedule = fs.readFileSync(new URL('../supabase/migrations/20261011112500_powerhouse_daily_connection_coverage_v1.sql',import.meta.url),'utf8');
const writeThrough = fs.readFileSync(new URL('../supabase/migrations/20261011114000_powerhouse_daily_decision_write_through_v1.sql',import.meta.url),'utf8');

const assess = ({latestExternalAt,linkedinEvents=0,signals=0,news=0,completeness=1,now}) => {
  const recent = latestExternalAt && Date.parse(latestExternalAt) >= Date.parse(now) - 14*86400000;
  if (recent && (linkedinEvents>0 || signals>0 || news>0)) return 'EVALUATE_IN_CANONICAL_NBA';
  if (completeness < .6) return 'RESEARCH_IF_COMMERCIAL_PRIORITY';
  return 'NO_NEW_RELEVANT_EVIDENCE';
};

test('signal decisions only trigger canonical NBA review on recent linked evidence',()=>{
  const now='2026-10-11T11:00:00Z';
  assert.equal(assess({latestExternalAt:'2026-10-10T10:00:00Z',linkedinEvents:1,now}),'EVALUATE_IN_CANONICAL_NBA');
  assert.equal(assess({latestExternalAt:'2026-09-01T10:00:00Z',signals:4,now}),'NO_NEW_RELEVANT_EVIDENCE');
  assert.equal(assess({completeness:.4,now}),'RESEARCH_IF_COMMERCIAL_PRIORITY');
  assert.equal(assess({now}),'NO_NEW_RELEVANT_EVIDENCE');
});
test('keep one existing scheduler and company news job; separate data from provider sends',()=>{
  assert.match(schedule,/powerhouse-identity-graph-v1/);
  assert.match(schedule,/powerhouse_sync_identity_graph_batch_v1\(100\)/);
  assert.match(schedule,/powerhouse_refresh_connection_enrichment_batch_v1\(v_date,500\)/);
  assert.match(schedule,/powerhouse_commercial_intelligence_heartbeat_v1/);
  assert.match(schedule,/bg-bedrijfsnieuws-werkdagen/);
  assert.match(schedule,/cron\.alter_job/);
  assert.doesNotMatch(schedule,/cron\.schedule\s*\(/);
  assert.match(schedule,/automated_outreach_authorized',false/);
});
test('both existing refresh functions write source-backed daily triage atomically',()=>{
  assert.match(writeThrough,/powerhouse_refresh_connection_enrichment_batch_v1/);
  assert.match(writeThrough,/powerhouse_refresh_all_connection_enrichment_v1/);
  assert.match(writeThrough,/pg_get_functiondef/);
  assert.match(writeThrough,/powerhouse-daily-decision-write-through-v1/);
  assert.match(writeThrough,/CANONICAL_REFRESH_WRITE_THROUGH_TARGET_NOT_FOUND/);
  assert.match(writeThrough,/automated_outreach_authorized',false/);
  assert.doesNotMatch(writeThrough,/insert\s+into\s+public\.powerhouse_sales_actions/i);
});
