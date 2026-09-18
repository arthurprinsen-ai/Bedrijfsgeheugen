import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url), 'utf8');

test('scheduled janitor applies only deterministic safe cleanup', () => {
  assert.match(workflow, /if \[ \"\$EVENT_NAME\" = schedule \]; then mode=apply-safe; fi/);
  assert.match(workflow, /github\.event_name == 'schedule'/);
});

test('janitor has authority to cancel stale actions and delete safe refs', () => {
  assert.match(workflow, /permissions:\s*[\s\S]*?actions: write/);
  assert.match(workflow, /permissions:\s*[\s\S]*?contents: write/);
  assert.match(workflow, /actions\/runs\/\$\{run_id\}\/cancel/);
  assert.match(workflow, /git\/refs\/heads\/\$\{encoded_branch\}/);
});

test('janitor never cancels main or current open-PR head', () => {
  assert.match(workflow, /\[ \"\$branch\" != main \] \|\| continue/);
  assert.match(workflow, /\[ -n \"\$current_pr_head\" \] && \[ \"\$current_pr_head\" != \"\$run_sha\" \]/);
  assert.match(workflow, /STALE_PR_HEAD/);
});

test('branch deletion is fail-closed on protection, open PRs, containment and head drift', () => {
  assert.match(workflow, /open_pr_count/);
  assert.match(workflow, /\.protected \/\/ true/);
  assert.match(workflow, /compare\/main\.\.\.\$\{encoded_branch\}/);
  assert.match(workflow, /\[ \"\$ahead\" = 0 \] \|\| continue/);
  assert.match(workflow, /JANITOR_BRANCH_HEAD_DRIFT/);
});

test('janitor emits and reads back cleanup evidence', () => {
  assert.match(workflow, /janitor-runtime-actions\.ndjson/);
  assert.match(workflow, /janitor-runtime-actions\.json/);
  assert.match(workflow, /JANITOR_BRANCH_DELETE_READBACK_FAILED/);
});


test('janitor reopens closed unmerged terminal-delivery PRs and fails closed on ambiguous successors', () => {
  assert.match(workflow, /closed-prs-recent\.json/);
  assert.match(workflow, /Writer-Lease-State: TERMINAL_DELIVERY/);
  assert.match(workflow, /AUTO_REOPEN_TERMINAL_LEASE/);
  assert.match(workflow, /TERMINAL_LEASE_SUCCESSOR_AMBIGUOUS/);
  assert.match(workflow, /JANITOR_TERMINAL_LEASE_REOPEN_READBACK_FAILED/);
});
