import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('recovery supervisor does not run on every feature-branch push',()=>{
  const wf=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(wf,/push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(wf,/cron:\s*['"]\*\/5 \* \* \* \*['"]/);
  assert.match(wf,/workflow_dispatch:/);
});

test('LinkedIn revenue cockpit watches only migrations it owns',()=>{
  const wf=readFileSync('.github/workflows/linkedin-revenue-cockpit-tests.yml','utf8');
  assert.doesNotMatch(wf,/supabase\/migrations\/\*\*['"]/);
  assert.match(wf,/powerhouse_revenue_command_center/);
  assert.match(wf,/linkedin_engagement/);
});

test('Revenue Learning no longer fans out on every Supabase migration',()=>{
  const wf=readFileSync('.github/workflows/revenue-learning.yml','utf8');
  assert.doesNotMatch(wf,/supabase\/migrations\/\*\*['"]/);
  assert.match(wf,/supabase\/migrations\/\*revenue_learning\*\.sql/);
});

test('generic migration-history proof belongs to Supabase preview',()=>{
  const wf=readFileSync('.github/workflows/supabase-pr-preview.yml','utf8');
  assert.match(wf,/tests\/supabase-migration-history-integrity\.test\.mjs/);
  assert.match(wf,/tests\/notion-synced-posts-migration-reproducibility\.test\.mjs/);
});
