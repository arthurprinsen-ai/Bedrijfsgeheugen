import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSiblingHashes } from '../tools/verify-component-hashes.mjs';

test('hero-video change detects altered protected header sibling', () => {
  const result = compareSiblingHashes({
    targetComponent: 'hero-video',
    baseHashes: { header: 'aaa', 'hero-video': 'old', footer: 'fff' },
    headHashes: { header: 'bbb', 'hero-video': 'new', footer: 'fff' }
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.changedSiblings, ['header']);
});

test('hero-video change passes when protected siblings are byte-identical', () => {
  const result = compareSiblingHashes({
    targetComponent: 'hero-video',
    baseHashes: { header: 'aaa', 'hero-video': 'old', footer: 'fff' },
    headHashes: { header: 'aaa', 'hero-video': 'new', footer: 'fff' }
  });
  assert.deepEqual(result, { ok: true, changedSiblings: [] });
});
