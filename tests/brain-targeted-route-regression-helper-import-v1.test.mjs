import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('targeted website regression explicitly imports isHardAssetFailure', async () => {
  const source=await readFile('tests/targeted-website-route-regression.test.mjs','utf8');
  assert.match(source,/import\s*\{[^}]*\bisHardAssetFailure\b[^}]*\}\s*from\s*['"]\.\.\/tools\/site-shell\/verify-targeted-website-routes\.mjs['"]/s);
  assert.match(source,/isHardAssetFailure\s*\(/);
});
