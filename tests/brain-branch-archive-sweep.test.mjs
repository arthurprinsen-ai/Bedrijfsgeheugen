import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexPullRequests, classifyBranch, decide, archiveTagName, archiveProviderFailure } from '../tools/ci/branch-archive-sweep.mjs';

const repo = 'acme/home';
const pr = (over) => ({ state: 'closed', merged_at: null, head: { ref: 'b', sha: 's1', repo: { full_name: 'acme/home' } }, ...over });
const idx = (prs) => indexPullRequests(prs, repo);

test('reserved, protected and open-PR branches are never candidates', () => {
  assert.equal(classifyBranch({ name: 'main', sha: 's1' }, idx([])).skip, 'RESERVED');
  for (const name of ['archive/x', 'release/1', 'hotfix/y']) assert.equal(classifyBranch({ name, sha: 's1' }, idx([])).skip, 'RESERVED');
  assert.equal(classifyBranch({ name: 'b', sha: 's1', protected: true }, idx([])).skip, 'PROTECTED');
  assert.equal(classifyBranch({ name: 'b', sha: 's1' }, idx([pr({ state: 'open' })])).skip, 'OPEN_PR');
});

test('foreign-repository PR heads never count as evidence', () => {
  const foreign = pr({ merged_at: 'x', head: { ref: 'b', sha: 's1', repo: { full_name: 'other/repo' } } });
  assert.equal(classifyBranch({ name: 'b', sha: 's1' }, idx([foreign])).kind, 'UNIQUE_OR_CONTAINED');
});

test('exact merged head and exact closed head delete without a tag', () => {
  const merged = classifyBranch({ name: 'b', sha: 's1' }, idx([pr({ merged_at: 'x' })]));
  assert.deepEqual(decide(merged, {}), { action: 'DELETE', reason: 'MERGED_EXACT_HEAD' });
  const closed = classifyBranch({ name: 'b', sha: 's1' }, idx([pr()]));
  assert.equal(decide(closed, { ageDays: 2 }).action, 'DELETE');
  assert.equal(decide(closed, { ageDays: 0.1 }).reason, 'TOO_YOUNG');
});

test('moved heads and branches without PR keep their work via archive tag', () => {
  const moved = classifyBranch({ name: 'b', sha: 's2' }, idx([pr({ merged_at: 'x' })]));
  assert.equal(decide(moved, { aheadBy: 4, ageDays: 10 }).action, 'ARCHIVE_THEN_DELETE');
  assert.equal(decide(moved, { aheadBy: 0, ageDays: 0 }).reason, 'CONTAINED_IN_MAIN');
  assert.equal(decide(moved, { aheadBy: 4, ageDays: 1 }).reason, 'TOO_YOUNG');
  assert.equal(decide(moved, { aheadBy: undefined, ageDays: 99 }).reason, 'AHEAD_UNPROVEN');
});

test('archive tag never overwrites a different sha', () => {
  assert.equal(archiveTagName('feat/x', 'abcdef1234', null), 'archive/feat/x');
  assert.equal(archiveTagName('feat/x', 'abcdef1234', 'abcdef1234'), 'archive/feat/x');
  assert.equal(archiveTagName('feat/x', 'abcdef1234', 'ffffff'), 'archive/feat/x-abcdef1');
});

test('janitor runs the sweep with a cap and only against its own repository', () => {
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml', 'utf8');
  assert.match(wf, /node tools\/ci\/branch-archive-sweep\.mjs --apply --cap 150/);
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs', 'utf8');
  assert.ok(!/--repo|-R /.test(src));
});

test('sweep has a time budget, a circuit breaker and a hard timeout in the janitor', () => {
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs', 'utf8');
  assert.match(src, /SWEEP_BUDGET_SECONDS/);
  assert.match(src, /consecutiveArchiveFailures >= 3/);
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml', 'utf8');
  assert.match(wf, /branch_archive_sweep:[\s\S]*timeout-minutes: 20[\s\S]*timeout 1000 node tools\/ci\/branch-archive-sweep\.mjs/);
});


test('original Janitor preserves per-branch HTTP403 with exact action/run evidence', () => {
  const error = { stderr: '{"message":"Resource not accessible by integration","status":"403"} gh: Resource not accessible by integration (HTTP 403)' };
  const event = archiveProviderFailure(error, {
    phase:'CREATE_ARCHIVE_TAG',branch:'automation/example',sha:'abc',
    runId:'41546047078',runAttempt:'1',sourceSha:'c591882884f7fb4a1b4d0b679df08c0291bb66dc'
  });
  assert.equal(event.status, 'PARTIAL_FAILURE');
  assert.equal(event.provider_http_status, 403);
  assert.equal(event.reason, 'PROVIDER_PERMISSION_DENIED');
  assert.equal(event.action, 'CREATE_ARCHIVE_TAG');
  assert.equal(event.run_id, 41546047078);
  assert.equal(event.branch_deleted, false);
  assert.equal(event.archive_verified, false);
  assert.equal(event.incident_number, 5333);
  assert.equal('stderr' in event, false, 'provider body/token must never be uploaded');
});

test('unknown provider error cannot be promoted to success', () => {
  const event = archiveProviderFailure(new Error('tag readback mismatch'), { phase:'VERIFY_ARCHIVE_TAG_READBACK' });
  assert.equal(event.status, 'PARTIAL_FAILURE');
  assert.equal(event.provider_http_status, null);
  assert.equal(event.branch_deleted, false);
});

test('original archive job fails on partial error and always preserves independent provider evidence', () => {
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  const job = wf.split('  branch_archive_sweep:\n')[1];
  assert.ok(job);
  assert.match(src,/if \(outcome\.failed > 0\) process\.exitCode = 78/);
  assert.match(src,/consecutiveArchiveFailures >= 3/);
  assert.match(src,/phase = 'CREATE_ARCHIVE_TAG'/);
  assert.match(src,/phase = 'VERIFY_ARCHIVE_TAG_READBACK'/);
  assert.match(src,/if \(readback !== branch\.sha\) throw/);
  assert.match(job,/timeout 1000 node tools\/ci\/branch-archive-sweep\.mjs --apply --cap 150/);
  assert.match(job,/--actions \.artifacts\/branch-archive-actions\.ndjson/);
  assert.match(job,/--report \.artifacts\/branch-archive-sweep\.json/);
  assert.doesNotMatch(job,/\|\|\s*echo.*JANITOR_ARCHIVE_SWEEP_INCOMPLETE/);
  assert.match(job,/- name: Upload original branch archive provider evidence\s+if: always\(\)/);
  assert.match(job,/if-no-files-found: warn/);
});
