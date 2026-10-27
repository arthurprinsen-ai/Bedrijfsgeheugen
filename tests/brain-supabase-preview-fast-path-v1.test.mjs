import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/supabase-pr-preview.yml','utf8');

const required = await readFile('.github/workflows/required-test.yml','utf8');

test('Supabase preview is scoped only to Supabase source changes', () => {
  // The contract is a reusable workflow that Required calls only when Supabase database sources changed.
  assert.match(workflow,/workflow_call:/);
  assert.doesNotMatch(workflow,/^\s*(push|pull_request):/m);
  assert.match(required,/path\.startsWith\('supabase\/'\) &&/);
  assert.match(required,/supabase_source_contract:[\s\S]*?if: needs\.preflight\.outputs\.supabase_preview_required == 'true'[\s\S]*?uses: \.\/\.github\/workflows\/supabase-pr-preview\.yml/);
  for (const forbidden of ["portal/**","portal-next/**","portal-v2/**","netlify/functions/**"]) {
    assert.equal(workflow.includes(`- '${forbidden}'`), false, `${forbidden} must not allocate a Supabase preview flight`);
  }
});

test('Supabase preview stays latest-head-wins and does not duplicate a local Docker stack', () => {
  assert.match(workflow,/group:\s*supabase-pr-preview-\$\{\{ inputs\.head_sha \}\}/);
  assert.match(workflow,/cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow,/supabase\s+start|docker\s+compose|supabase\s+db\s+reset/i);
  assert.match(workflow,/Supabase changes only/);
});
