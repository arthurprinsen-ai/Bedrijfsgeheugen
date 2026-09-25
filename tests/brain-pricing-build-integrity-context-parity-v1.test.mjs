import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pricing build integrity follows canonical multi-goal Portal context', async () => {
  const [build,pricing] = await Promise.all([
    readFile('tools/site-shell/pricing-build-integrity.mjs','utf8'),
    readFile('prijzen.html','utf8'),
  ]);
  assert.match(pricing,/Wat wil je bereiken\?/i);
  assert.match(pricing,/aria-label="Ondernemersdoelen"/i);
  assert.match(build,/'Wat wil je bereiken\?'/);
  assert.match(build,/'aria-label="Ondernemersdoelen"'/);
  assert.doesNotMatch(build,/Belangrijkste doel nu/);
});
