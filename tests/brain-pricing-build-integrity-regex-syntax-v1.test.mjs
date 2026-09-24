import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('pricing build integrity script parses under Node', () => {
  const result = spawnSync(process.execPath, ['--check','tools/site-shell/pricing-build-integrity.mjs'], { encoding:'utf8' });
  assert.equal(result.status,0,result.stderr || result.stdout);
});

test('production snapshot is refreshed for pricing parse recovery', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/pricing-build-parse-production-redeploy-v1/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
});
