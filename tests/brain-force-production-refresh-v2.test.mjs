import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('forced production refresh preserves terminal production proof', () => {
  assert.match(workflow,/Prove exact production identity/);
  assert.match(workflow,/Prove pricing production content/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
});
