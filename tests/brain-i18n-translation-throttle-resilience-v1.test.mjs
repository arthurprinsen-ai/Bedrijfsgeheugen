import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('static translation defaults to a single provider stream',()=>{
  assert.match(source,/STATIC_I18N_CONCURRENCY \|\| 1/);
  assert.match(source,/Math\.min\(2,/);
  assert.match(source,/setTimeout\(r,750\)/);
});

test('static translation honors Retry-After and exponential backoff',()=>{
  assert.match(source,/retry-after/);
  assert.match(source,/retryAfterMs/);
  assert.match(source,/STATIC_I18N_RETRY/);
  assert.match(source,/\[429,500,502,503,504,529\]/);
  assert.match(source,/2 \*\* attempt/);
  assert.match(source,/max_attempts: 6/);
});

test('production snapshot reruns exact browser proof after resilience change',()=>{
  assert.match(workflow,/i18n-translation-throttle-resilience-v1/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
