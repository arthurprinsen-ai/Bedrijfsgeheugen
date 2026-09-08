import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const website = await readFile('.github/workflows/lane-website.yml','utf8');

for (const token of [
  'tests/homepage-pricing-boundary-readback.test.mjs',
  '.github/scripts/paginacontrole.py',
  '.github/scripts/seocontrole.py',
  'tools/site-shell/test-live-contract.mjs',
  'tests/seo-order-live-readback.test.mjs',
  'tools/bouw-powerhouse-auth.mjs',
  'tools/bouw-kennisindex.mjs',
  'tools/bouw-v18-production.mjs',
  'tools/apply-tabbladen.mjs',
  'tools/bouw-v18-views.mjs',
  'tools/bouw-v18-chrome-alles.mjs',
  'tools/site-shell/diagnose-shell-gate.mjs',
  'tools/bouw-release-evidence.mjs',
]) {
  test(`website lane owns ${token}`, () => assert.match(website, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))));
}

test('expensive website jobs depend on cheap prerequisites', () => {
  assert.match(website, /shell-build:\n\s+needs:\s*\[?classify,?\s*baseline\]?/);
  assert.match(website, /full-regression:\n\s+needs:\s*\[?classify,?\s*baseline\]?/);
  assert.match(website, /targeted-browser:\n\s+needs:\s*\[[^\]]*baseline[^\]]*preview-ready[^\]]*\]/);
  assert.match(website, /public-visibility:\n\s+needs:\s*\[[^\]]*baseline[^\]]*preview-ready[^\]]*\]/);
  assert.match(website, /broad-browser:\n\s+needs:\s*\[[^\]]*baseline[^\]]*preview-ready[^\]]*\]/);
});

test('duplicate website PR entrypoints are removed', async () => {
  for (const file of ['paginacontrole.yml','paginacontrole-debug.yml','homepage-pricing-boundary-regression.yml','canonical-brand-shell-full-build.yml','canonical-brand-shell-live-readback.yml']) {
    const text = await readFile(`.github/workflows/${file}`,'utf8');
    assert.doesNotMatch(text, /(^|\n)\s{0,2}pull_request\s*:/m, `${file} must not own pull_request`);
  }
});