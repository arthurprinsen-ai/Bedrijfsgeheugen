import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateNetlifyPreviewImpact } from '../tools/netlify-preview-impact.mjs';

const shaA = 'a'.repeat(40);
const shaB = 'b'.repeat(40);

test('governance-only deploy preview changes are safely skippable', () => {
  const result = evaluateNetlifyPreviewImpact({
    context: 'deploy-preview',
    cachedCommitRef: shaA,
    commitRef: shaB,
    changedPaths: [
      'brain/learning/example.json',
      'tests/branch-delivery-example.test.mjs',
      'config/delivery-prevention-rules.json',
    ],
  });
  assert.equal(result.action, 'SKIP_PREVIEW');
  assert.equal(result.exitCode, 0);
});

test('production always builds because release evidence is SHA-bound', () => {
  const result = evaluateNetlifyPreviewImpact({
    context: 'production',
    cachedCommitRef: shaA,
    commitRef: shaB,
    changedPaths: ['brain/learning/example.json'],
  });
  assert.equal(result.action, 'BUILD');
  assert.equal(result.exitCode, 1);
});

test('site, Netlify, function and build-tool changes always build', () => {
  for (const path of [
    'index.html',
    'assets/app.css',
    'netlify.toml',
    'netlify/functions/portal-state.mjs',
    'tools/bouw-release-evidence.mjs',
  ]) {
    const result = evaluateNetlifyPreviewImpact({
      context: 'deploy-preview',
      cachedCommitRef: shaA,
      commitRef: shaB,
      changedPaths: [path],
    });
    assert.equal(result.action, 'BUILD', path);
    assert.equal(result.exitCode, 1, path);
  }
});

test('unknown paths fail safe to BUILD', () => {
  const result = evaluateNetlifyPreviewImpact({
    context: 'deploy-preview',
    cachedCommitRef: shaA,
    commitRef: shaB,
    changedPaths: ['future/new-area/file.xyz'],
  });
  assert.equal(result.action, 'BUILD');
  assert.equal(result.reason, 'unknown_or_site_impact');
});

test('invalid or equal commit refs fail safe to BUILD', () => {
  for (const [cachedCommitRef, commitRef] of [['bad', shaB], [shaA, 'bad'], [shaA, shaA]]) {
    const result = evaluateNetlifyPreviewImpact({
      context: 'deploy-preview',
      cachedCommitRef,
      commitRef,
      changedPaths: ['brain/learning/example.json'],
    });
    assert.equal(result.action, 'BUILD');
    assert.equal(result.exitCode, 1);
  }
});

test('Netlify wiring and reusable prevention knowledge remain coupled', async () => {
  const [toml, guard, rules, lessons] = await Promise.all([
    readFile('netlify.toml', 'utf8'),
    readFile('config/netlify-preview-impact-guard.json', 'utf8').then(JSON.parse),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
    readFile('brain/learning/ci-efficiency-lessons-2026-08-30.json', 'utf8').then(JSON.parse),
  ]);
  assert.match(toml, /\[context\.deploy-preview\][\s\S]*ignore\s*=\s*"node \.\/tools\/netlify-preview-impact\.mjs"/);
  assert.equal(guard.failClosed, true);
  assert.equal(guard.knownFailure.fingerprint, 'netlify-preview-provider-scope-mismatch-v1');
  assert.equal(guard.knownFailure.regressionContract, 'tests/netlify-preview-impact-guard.test.mjs');
  assert.ok(rules.rules.some(rule => rule.id === 'SKIP_NETLIFY_PREVIEW_ONLY_FOR_PROVEN_NON_SITE_DIFFS' && rule.active === true));
  assert.ok(lessons.lessons.some(lesson => lesson.fingerprint === 'netlify-preview-provider-scope-mismatch-v1'));
});
