import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolvePRScopeMergeBase, evaluateBranchHygiene, parseScopeMetadata } from '../tools/delivery-branch-hygiene-guard.mjs';

const baseSha = '903bf0ceecc339cd59df6c68e20245861f7f25fa';
const headSha = 'fae5812fee571e26da284c4f1e5c27305b8699e9';
const mergeBaseSha = 'f627153ed569820917a2dc5787dd210613f0395e';
const providerProof = {
  status: 'diverged',
  base_commit: { sha: baseSha },
  head_commit: { sha: headSha },
  merge_base_commit: { sha: mergeBaseSha },
};

test('P0 4215 diverged PR selects only provider-proven branch-owned files', () => {
  const result = resolvePRScopeMergeBase({
    eventName: 'pull_request', prNumber: 4630, baseSha, headSha,
    comparison: providerProof,
  });
  assert.equal(result.sha, mergeBaseSha);
  assert.equal(result.source, 'github-compare-merge-base');
  const metadata = parseScopeMetadata([
    'Candidate-Type: recovery',
    'Delivery-Lane: backend',
    'Change-Scope: supabase/migrations/revenue.sql, docs/changes/revenue.md',
    'Scope-Budget: 2',
  ].join('\n'));
  assert.equal(evaluateBranchHygiene({
    changedPaths: ['supabase/migrations/revenue.sql','docs/changes/revenue.md','tests/regression.test.mjs'],
    metadata,
  }).ok, true);
  const unsafe = evaluateBranchHygiene({
    changedPaths: ['supabase/migrations/revenue.sql','.github/workflows/silent-security-bypass.yml'],
    metadata,
  });
  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.state, 'SCOPE_CONTAMINATED');
});

test('unverified head/base/status and malformed merge base fail closed', () => {
  for (const proof of [
    null,
    { ...providerProof, status: 'behind' },
    { ...providerProof, base_commit: { sha: 'a'.repeat(40) } },
    { ...providerProof, head_commit: { sha: 'b'.repeat(40) } },
    { ...providerProof, merge_base_commit: { sha: 'not-a-sha' } },
    { ...providerProof, merge_base_commit: { sha: headSha } },
  ]) {
    assert.throws(() => resolvePRScopeMergeBase({
      eventName:'pull_request',prNumber:4630,baseSha,headSha,comparison:proof,
    }), /PR_MERGE_BASE_PROVIDER_PROOF_MISSING/);
  }
});

test('merge-group retains immutable event scope; pipeline enforces real hygiene', () => {
  assert.equal(resolvePRScopeMergeBase({
    eventName: 'merge_group', baseSha, headSha, prNumber: '',
  }).sha, baseSha);
  const workflow=readFileSync('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /resolvePRScopeMergeBase/);
  assert.match(workflow, /compare\/\$\{providerBaseSha\}\.\.\.\$\{context\.changeHeadSha\}/);
  assert.match(workflow, /git'\s*,\s*\['diff','--name-only',diffBaseSha,context\.changeHeadSha\]/);
  assert.match(workflow, /if\(!hygiene\.ok\) throw new Error/);
  assert.match(workflow, /base_sha=\$\{diffBaseSha\}/);
});
