import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('production snapshot is latest-main driven',()=>{
  assert.match(workflow,/push:\n\s+branches:\s*\[main\]/);
  assert.doesNotMatch(workflow,/paths:\s*\n\s+- '\.github\/workflows\/production-source-snapshot\.yml'/);
  assert.match(workflow,/concurrency:\s*\n\s+group:\s*production-source-snapshot-main\s*\n\s+cancel-in-progress:\s*true/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.match(workflow,/Prove exact production identity/);
});
