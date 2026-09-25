import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pricing build oracle and entitlement regression use canonical multi-goal context semantics', async () => {
  const [pricing, build, entitlement] = await Promise.all([
    readFile('prijzen.html','utf8'),
    readFile('tools/site-shell/pricing-build-integrity.mjs','utf8'),
    readFile('tests/saas-pricing-entitlements.test.mjs','utf8'),
  ]);

  for (const source of [pricing, build, entitlement]) {
    assert.match(source, /Wat wil je bereiken\?/);
    assert.match(source, /Ondernemersdoelen/);
  }

  assert.doesNotMatch(build, /Belangrijkste doel nu/);
  assert.doesNotMatch(entitlement, /Belangrijkste doel nu/);
});
