import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('exact production artifact refresh preserves terminal delivery contract',()=>{
  assert.match(workflow,/Operational artifact refresh: 2026-09-24 exact-current-main-v1/);
  assert.match(workflow,/Verify exact source identity/);
  assert.match(workflow,/Stamp exact API-source identity/);
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
});
