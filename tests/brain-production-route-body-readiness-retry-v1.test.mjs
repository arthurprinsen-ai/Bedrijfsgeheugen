import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-targeted-website-routes.mjs','utf8');

test('production route verifier retries transient navigation/body readiness timeouts with a fresh page',()=>{
  assert.match(source,/async function observeRouteAttempt/);
  assert.match(source,/async function observeRoute\(browser, baseUrl, route, viewport, \{ attempts = 2 \} = \{\}\)/);
  assert.match(source,/error\?\.name !== 'TimeoutError'/);
  assert.match(source,/setTimeout\(resolve, 1_000 \* attempt\)/);
});

test('route verifier remains fail closed for non-timeout errors and after bounded retries',()=>{
  assert.match(source,/if \(attempt >= attempts \|\| error\?\.name !== 'TimeoutError'\) throw error/);
  assert.match(source,/throw lastError/);
});
