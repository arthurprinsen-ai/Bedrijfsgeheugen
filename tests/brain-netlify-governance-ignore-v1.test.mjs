import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Netlify governance ignore includes website release-risk policy but not runtime artifacts', async () => {
  const source=await readFile('tools/ci/netlify-ignore-build.mjs','utf8');
  const required=await readFile('.github/workflows/required-test.yml','utf8');
  const risk=await readFile('site/website-release-risk.json','utf8');
  assert.match(source, /'site\/website-release-risk\.json'/);
  assert.match(source, /const runtimePaths = changed\.filter/);
  assert.match(source, /!governanceExact\.has\(path\)/);
  assert.doesNotMatch(source, /'netlify\.toml'/);
  assert.doesNotMatch(source, /'assets\/'/);
  assert.match(required, /netlifyGovernanceExact=new Set\(\['site\/website-release-risk\.json'\]\)/);
  assert.match(required, /!netlifyGovernanceExact\.has\(path\)/);
  assert.ok(JSON.parse(risk).nonArtifactPaths.includes('tools/ci/'));
});
