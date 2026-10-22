import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBranchHygiene, isVerificationArtifact, parseScopeMetadata, resolvePRScopeMergeBase } from '../tools/delivery-branch-hygiene-guard.mjs';

test('een test naast de wijziging vervuilt de scope niet', () => {
  const metadata = parseScopeMetadata('Change-Scope: tools/bouw-v18-production-core.mjs\nScope-Budget: 1');
  const result = evaluateBranchHygiene({
    changedPaths: [
      'tools/bouw-v18-production-core.mjs',
      'tests/v18-megamenu-regression-lock.test.mjs',
      '.github/workflows/v18-megamenu-production-readback.yml',
    ],
    metadata,
  });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'SCOPE_CLEAN');
  assert.equal(result.changedFileCount, 1);
  assert.equal(result.verificationPaths.length, 2);
});

test('echte broncode buiten de scope blokkeert nog steeds', () => {
  const metadata = parseScopeMetadata('Change-Scope: tools/bouw-v18-production-core.mjs\nScope-Budget: 1');
  const result = evaluateBranchHygiene({
    changedPaths: ['tools/bouw-v18-production-core.mjs', 'tools/v18-verrijking.mjs'],
    metadata,
  });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'SCOPE_CONTAMINATED');
  assert.deepEqual(result.unexpectedPaths, ['tools/v18-verrijking.mjs']);
});

test('verificatie-artefacten tellen niet mee in het Scope-Budget', () => {
  const metadata = parseScopeMetadata('Change-Scope: tools/**\nScope-Budget: 2');
  const result = evaluateBranchHygiene({
    changedPaths: ['tools/a.mjs', 'tools/b.mjs', 'tests/a.test.mjs', 'tests/b.test.mjs'],
    metadata,
  });
  assert.equal(result.ok, true);
  assert.equal(result.changedFileCount, 2);
});

test('verificatie-artefacten tellen ook niet mee in de harde delivery-cap', () => {
  const changedPaths = [
    ...Array.from({ length: 39 }, (_, i) => `tools/file-${i}.mjs`),
    ...Array.from({ length: 10 }, (_, i) => `tests/x${i}.test.mjs`),
  ];
  const result = evaluateBranchHygiene({ changedPaths, metadata: {} });
  assert.equal(result.ok, true);
  assert.equal(result.changedFileCount, 39);
  assert.equal(result.verificationPaths.length, 10);
});

test('herkenning van verificatie-artefacten', () => {
  assert.equal(isVerificationArtifact('tests/iets.test.mjs'), true);
  assert.equal(isVerificationArtifact('.github/workflows/v18-megamenu-production-readback.yml'), true);
  assert.equal(isVerificationArtifact('.github/workflows/lane-website.yml'), false);
  assert.equal(isVerificationArtifact('tools/bouw-v18-views.mjs'), false);
});


test('gecontroleerde Supabase recovery mag boven de harde cap zonder gewone PR-cap te verzwakken', () => {
  const metadata = parseScopeMetadata([
    'Obligation-ID: supabase-parity-recovery',
    'Delivery-Lane: backend',
    'Candidate-Type: recovery',
    'Base-SHA: 0123456789abcdef0123456789abcdef01234567',
    'Supersedes: none',
    'Change-Scope: supabase/migrations/**, docs/changes/recovery.md',
    'Scope-Budget: 61',
  ].join('\n'));
  const changedPaths = [
    ...Array.from({ length: 60 }, (_, i) => `supabase/migrations/20261005${String(i).padStart(6, '0')}_recovered.sql`),
    'docs/changes/recovery.md',
    'tests/recovery.test.mjs',
  ];
  const result = evaluateBranchHygiene({ changedPaths, metadata });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'SCOPE_CLEAN_BULK_RECOVERY');
  assert.equal(result.bulkRecoveryApproved, true);
});

test('bulk recovery uitzondering geldt niet zonder recovery-identiteit en Supabase migration scope', () => {
  const changedPaths = Array.from({ length: 45 }, (_, i) => `tools/file-${i}.mjs`);
  const result = evaluateBranchHygiene({
    changedPaths,
    metadata: {
      expectedPaths: ['tools/**'],
      maxFiles: 45,
      delivery: { candidateType: 'implementation' },
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'HARD_SCOPE_LIMIT_EXCEEDED');
});


test('diverged owner PR uses exact verified merge base, not newer unrelated main', () => {
  const baseSha = '903bf0ceecc339cd59df6c68e20245861f7f25fa';
  const headSha = 'fae5812fee571e26da284c4f1e5c27305b8699e9';
  const mergeBase = 'f627153ed569820917a2dc5787dd210613f0395e';
  const scope = resolvePRScopeMergeBase({
    eventName: 'pull_request',
    prNumber: 4630,
    baseSha,
    headSha,
    comparison: {
      status: 'diverged',
      base_commit: { sha: baseSha },
      head_commit: { sha: headSha },
      merge_base_commit: { sha: mergeBase },
    },
  });
  assert.equal(scope.sha, mergeBase);
  assert.equal(scope.source, 'github-compare-merge-base');

  const metadata = parseScopeMetadata([
    'Delivery-Lane: backend',
    'Candidate-Type: recovery',
    'Change-Scope: supabase/migrations/revenue.sql, docs/changes/revenue.md',
    'Scope-Budget: 2',
  ].join(String.fromCharCode(10)));
  const valid = evaluateBranchHygiene({
    changedPaths: ['supabase/migrations/revenue.sql', 'docs/changes/revenue.md', 'tests/revenue.test.mjs'],
    metadata,
  });
  assert.equal(valid.ok, true, 'only branch-owned code and verifier files pass');
  const contaminated = evaluateBranchHygiene({
    changedPaths: ['supabase/migrations/revenue.sql', 'tools/unauthorized-main-mutation.mjs'],
    metadata,
  });
  assert.equal(contaminated.ok, false, 'actual out-of-scope candidate mutation remains blocked');
  assert.equal(contaminated.state, 'SCOPE_CONTAMINATED');
});

test('PR merge base fails closed on absent or mismatched provider proof', () => {
  const baseSha = 'a'.repeat(40);
  const headSha = 'b'.repeat(40);
  const correct = {
    status: 'diverged',
    base_commit: { sha: baseSha },
    head_commit: { sha: headSha },
    merge_base_commit: { sha: 'c'.repeat(40) },
  };
  for (const comparison of [
    null,
    { ...correct, base_commit: { sha: 'd'.repeat(40) } },
    { ...correct, head_commit: { sha: 'd'.repeat(40) } },
    { ...correct, status: 'behind' },
    { ...correct, merge_base_commit: { sha: 'not-a-sha' } },
    { ...correct, merge_base_commit: { sha: headSha } },
  ]) {
    assert.throws(
      () => resolvePRScopeMergeBase({
        eventName: 'pull_request',
        prNumber: 4630,
        baseSha,
        headSha,
        comparison,
      }),
      /PR_MERGE_BASE_PROVIDER_PROOF_MISSING/,
    );
  }
  assert.equal(resolvePRScopeMergeBase({
    eventName: 'merge_group', baseSha, headSha, prNumber: '', comparison: null,
  }).sha, baseSha, 'merge-group retains its explicit event scope');
});
