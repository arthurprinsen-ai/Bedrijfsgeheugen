import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
const compat=fs.readFileSync('supabase/functions/powerhouse-human-sales-composer/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261005123000_powerhouse_human_commercial_persuasion_runtime_v1.sql','utf8');

test('canonical composer uses existing persuasion authority and quality gate',()=>{
  assert.match(composer,/powerhouse_persuasion_revenue_optimizer_v1/);
  assert.match(composer,/persuasion_authority/);
  assert.match(composer,/powerhouse_message_quality_v1/);
  assert.match(composer,/quality_passed/);
  assert.match(composer,/followup_evidence_match/);
  assert.match(composer,/canonical_persuasion/);
});

test('canonical number normalization removes every percent sign',()=>{
  assert.match(composer,/replace\(\/\%\/g,' '\)|replace\(\/\%\/g,''\)/);
});

test('compat composer delegates to canonical composer',()=>{
  assert.match(compat,/powerhouse-commercial-message-composer/);
  assert.match(compat,/quality_passed/);
});

test('migration persists one commercial runtime',()=>{
  assert.match(migration,/powerhouse_sales_playbook_v1/);
  assert.match(migration,/powerhouse_commercial_message_plan_v1/);
  assert.match(migration,/powerhouse_apply_message_plan_v1/);
  assert.match(migration,/powerhouse_persuasion_sales_performance_v1/);
  assert.match(migration,/powerhouse_human_commercial_end_to_end_health_v1/);
  assert.match(migration,/powerhouse_persuasion_revenue_optimizer_v1/);
});
