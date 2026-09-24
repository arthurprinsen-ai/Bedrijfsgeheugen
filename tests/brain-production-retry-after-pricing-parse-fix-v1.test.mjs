import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production retry after pricing parse fix preserves terminal gates',()=>{
  assert.match(workflow,/after-pricing-parse-fix-v1/);
  assert.match(workflow,/Verify exact source identity/);
  assert.match(workflow,/Fail fast on Netlify provider build error/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
});
