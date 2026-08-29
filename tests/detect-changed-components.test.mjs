import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChangedComponents } from '../tools/detect-changed-components.mjs';

test('detects independent changed components without duplicates', async () => {
  const components = await detectChangedComponents([
    'components/header/header.css',
    'components/hero-video/media.json',
    'components/header/header.html',
    'README.md'
  ]);
  assert.deepEqual(components, ['header', 'hero-video']);
});

test('hero asset path maps to hero-video ownership', async () => {
  const components = await detectChangedComponents(['assets/hero/hero-v3.mp4']);
  assert.deepEqual(components, ['hero-video']);
});

test('unowned foundation changes do not create fake component work', async () => {
  const components = await detectChangedComponents(['config/change-classes.json']);
  assert.deepEqual(components, []);
});
