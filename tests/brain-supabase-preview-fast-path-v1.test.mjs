import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-pr-preview.yml','utf8');

test('Supabase preview is scoped only to Supabase source changes', () => {
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/- 'supabase\/\*\*'/);
  assert.match(workflow,/- '\.github\/workflows\/supabase-pr-preview\.yml'/);
  for (const forbidden of ["portal/**","portal-next/**","portal-v2/**","netlify/functions/**"]) {
    assert.equal(workflow.includes(`- '${forbidden}'`), false, `${forbidden} must not allocate a Supabase preview flight`);
  }
});

test('Supabase preview stays latest-head-wins and does not duplicate a local Docker stack', () => {
  assert.match(workflow,/group:\s*supabase-pr-preview-\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(workflow,/cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow,/supabase\s+start|docker\s+compose|supabase\s+db\s+reset/i);
  assert.match(workflow,/Supabase changes only/);
});
