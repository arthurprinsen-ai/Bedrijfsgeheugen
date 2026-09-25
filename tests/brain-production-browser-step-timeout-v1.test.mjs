import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production browser steps have process-level timeout below job cap', async () => {
  const release = await readFile('.github/workflows/production-release-readback.yml','utf8');
  const shell = await readFile('.github/workflows/canonical-brand-shell-live-readback.yml','utf8');

  assert.match(release,/timeout --signal=TERM --kill-after=30s 10m node tools\/site-shell\/verify-pricing-i18n-production\.mjs/);
  assert.match(shell,/timeout --signal=TERM --kill-after=30s 10m node tools\/site-shell\/standalone-visibility-check\.mjs/);
  assert.match(release,/timeout-minutes:\s*25/);
  assert.match(shell,/timeout-minutes:\s*25/);
});
