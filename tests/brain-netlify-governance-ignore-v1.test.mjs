import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Netlify governance ignore includes website release-risk policy but not runtime artifacts', async () => {
  const source=await readFile('tools/ci/netlify-ignore-build.mjs','utf8');
  assert.match(source, /'site\/website-release-risk\.json'/);
  assert.match(source, /const runtimePaths = changed\.filter/);
  assert.match(source, /!governanceExact\.has\(path\)/);
  assert.doesNotMatch(source, /'netlify\.toml'/);
  assert.doesNotMatch(source, /'assets\/'/);
});
