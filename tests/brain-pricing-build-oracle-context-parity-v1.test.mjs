import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pricing build oracle and entitlement regression use canonical multi-goal context semantics', async () => {
  const [pricing, build, entitlement] = await Promise.all([
    readFile('prijzen.html','utf8'),
    readFile('tools/site-shell/pricing-build-integrity.mjs','utf8'),
    readFile('tests/saas-pricing-entitlements.test.mjs','utf8'),
  ]);

  assert.match(pricing, /Wat wil je bereiken\?/);
  assert.match(pricing, /Ondernemersdoelen/);

  assert.match(build, /Wat wil je bereiken\?/);
  assert.match(build, /Ondernemersdoelen/);

  // Test source may escape punctuation inside its own regex literal; bind semantics, not source-code escaping.
  assert.match(entitlement, /Wat wil je bereiken/);
  assert.match(entitlement, /Ondernemersdoelen/);

  assert.doesNotMatch(build, /Belangrijkste doel nu/);
  assert.doesNotMatch(entitlement, /Belangrijkste doel nu/);
});
