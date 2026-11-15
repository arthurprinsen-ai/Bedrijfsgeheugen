import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure Brain gate matches executable workflow triggers', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const unified=await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.match(unified,/workflow_dispatch:/);
  assert.doesNotMatch(unified,/pull_request:/);
  assert.match(workflow,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.ok(workflow.includes('runs?branch=main&event=workflow_dispatch&created=${created_filter}&per_page=100'));
  assert.ok(workflow.includes('gh api --paginate --slurp "$query"'));
  assert.ok(workflow.includes('brain-verification-flight-index.mjs --title "$expected_title" --since "$since"'));
  const critical=workflow.split('name: Verify exact-head critical delivery gates before terminal claim')[1]
    ?.split('name: Require explicit Supabase Edge Function provider readback before terminal claim')[0];
  assert.ok(critical,'original final BRAIN gate must remain in terminal control plane');
  assert.doesNotMatch(critical,/runs\?branch=main&event=workflow_dispatch&per_page=100/);
  assert.ok(workflow.includes('BRAIN delivery PR #${PR_NUMBER} ${HEAD_SHA}'));
  assert.ok(workflow.includes('indexed_state="$(jq -r'));
  assert.ok(workflow.includes('/compare/${run_source_sha}...main'));
  assert.match(critical,/TERMINAL_BRAIN_HISTORY_INCOMPLETE/);
  assert.match(critical,/TERMINAL_CRITICAL_GATE_FAILED/);
  assert.match(workflow,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.doesNotMatch(workflow,/require_brain_evidence|TERMINAL_BRAIN_(FOUNDATION|DESCENDANT)_PROVEN/);
  assert.match(workflow,/TERMINAL_CRITICAL_GATE_NOT_TERMINAL/);
});
