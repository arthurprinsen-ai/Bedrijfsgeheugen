import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('targeted route verifier retries only transient navigation timeouts', () => {
  const src=fs.readFileSync('tools/site-shell/verify-targeted-website-routes.mjs','utf8');
  assert.match(src,/async function navigateWithRetry/);
  assert.match(src,/attempts = 2/);
  assert.match(src,/error\?\.name !== 'TimeoutError'/);
  assert.match(src,/navigateWithRetry\(page, target\)/);
});
