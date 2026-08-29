import test from 'node:test';
import assert from 'node:assert/strict';
import { validateComponentSource } from '../tools/verify-component-boundaries.mjs';

test('hero-video rejects CSS that targets header internals', () => {
  const result = validateComponentSource({
    componentId: 'hero-video',
    css: '[data-bg-component="hero-video"] .frame{display:block}\n[data-bg-component="header"] .menu{display:none}',
    js: ''
  });
  assert.equal(result.ok, false);
  assert.ok(result.violations.some(v => v.includes('header')));
});

test('component accepts CSS scoped only to its own root', () => {
  const result = validateComponentSource({
    componentId: 'hero-video',
    css: '[data-bg-component="hero-video"] .frame{display:block}',
    js: 'const root = document.querySelector(\'[data-bg-component="hero-video"]\'); root?.querySelector(\'.frame\');'
  });
  assert.deepEqual(result, { ok: true, violations: [] });
});
