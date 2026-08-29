import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChangedPaths } from '../tools/verify-change-scope.mjs';

test('hero-video-media rejects header changes', async () => {
  const result = await validateChangedPaths({
    paths: ['components/hero-video/media.json', 'components/header/header.css'],
    changeClass: 'hero-video-media'
  });
  assert.equal(result.ok, false);
  assert.ok(result.violations.some(v => v.includes('components/header/header.css')));
});

test('hero-video-media accepts only video manifest and versioned assets', async () => {
  const result = await validateChangedPaths({
    paths: ['components/hero-video/media.json', 'assets/hero/hero-v2.mp4'],
    changeClass: 'hero-video-media'
  });
  assert.deepEqual(result, { ok: true, violations: [] });
});
