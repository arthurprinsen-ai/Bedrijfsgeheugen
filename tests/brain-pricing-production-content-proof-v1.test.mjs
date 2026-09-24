import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing promotion uses browser behavior as the functional oracle', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.doesNotMatch(workflow,/Prove pricing production content/);
  assert.doesNotMatch(workflow,/PRICING_PRODUCTION_CONTENT_PROVEN/);
  assert.doesNotMatch(workflow,/grep -q 'data-bg-/);
  assert.match(workflow,/Install production interaction browser/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.match(workflow,/Prove exact production identity/);
});
