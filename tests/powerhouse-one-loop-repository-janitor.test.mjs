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


test('janitor continuously recovers silent exact-head CI starts without dummy commits', () => {
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
  assert.match(workflow, /ZERO_EXACT_HEAD_RUNS/);
  assert.match(workflow, /workflow run required-test\.yml --ref "\$branch"/);
  assert.match(workflow, /workflow run unified-brain-delivery\.yml --ref "\$branch"/);
  assert.match(workflow, /-f pr_number="\$pr"/);
  assert.match(workflow, /-f base_sha="\$base"/);
  assert.match(workflow, /-f head_sha="\$head"/);
  assert.match(workflow, /-f candidate_branch="\$branch"/);
});

test('silent-start recovery is exact-head fail-closed and non-amplifying', () => {
  assert.match(workflow, /age_seconds.*120/s);
  assert.match(workflow, /required_count.*= 0/s);
  assert.match(workflow, /brain_count.*= 0/s);
  assert.match(workflow, /SKIP_HEAD_DRIFT/);
  assert.match(workflow, /DISPATCH_REJECTED_FAIL_CLOSED/);
  assert.doesNotMatch(workflow, /git commit.*silent|empty commit.*recover/i);
});
