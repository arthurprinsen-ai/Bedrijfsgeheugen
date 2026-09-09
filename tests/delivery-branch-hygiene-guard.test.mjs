import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBranchHygiene, isVerificationArtifact, parseScopeMetadata } from '../tools/delivery-branch-hygiene-guard.mjs';

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

test('de harde bovengrens blijft over alle bestanden gelden', () => {
  const changedPaths = Array.from({ length: 45 }, (_, i) => `tests/x${i}.test.mjs`);
  const result = evaluateBranchHygiene({ changedPaths, metadata: {} });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'HARD_SCOPE_LIMIT_EXCEEDED');
});

test('herkenning van verificatie-artefacten', () => {
  assert.equal(isVerificationArtifact('tests/iets.test.mjs'), true);
  assert.equal(isVerificationArtifact('.github/workflows/v18-megamenu-production-readback.yml'), true);
  assert.equal(isVerificationArtifact('.github/workflows/lane-website.yml'), false);
  assert.equal(isVerificationArtifact('tools/bouw-v18-views.mjs'), false);
});
