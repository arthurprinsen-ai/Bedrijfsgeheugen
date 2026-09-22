import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveReleaseCommitRef } from '../tools/site-shell/release-source-identity.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

test('API source falls back to exact source marker when Netlify commit vars are absent', () => {
  assert.equal(resolveReleaseCommitRef({ env: {}, markerText: A }), A);
});

test('Netlify env identity must agree with source marker', () => {
  assert.equal(resolveReleaseCommitRef({ env: { COMMIT_REF: A }, markerText: A }), A);
  assert.throws(() => resolveReleaseCommitRef({ env: { COMMIT_REF: A }, markerText: B }), /RELEASE_SOURCE_IDENTITY_MISMATCH/);
});

test('invalid or missing identities fail closed', () => {
  assert.throws(() => resolveReleaseCommitRef({ env: {}, markerText: 'main' }), /RELEASE_SOURCE_IDENTITY_MISSING/);
});
