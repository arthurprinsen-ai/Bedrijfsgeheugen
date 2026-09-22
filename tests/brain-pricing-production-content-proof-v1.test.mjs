import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing promotion proves canonical live content', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/Prove pricing production content/);
  assert.match(workflow,/<h3>Build<\/h3>/);
  assert.match(workflow,/Wat moet het opleveren om zichzelf terug te verdienen\?/);
  assert.match(workflow,/<h3>Transform<\/h3>/);
  assert.match(workflow,/Per jaar/);
  assert.match(workflow,/2 maanden gratis/);
  assert.match(workflow,/PRICING_PRODUCTION_CONTENT_PROVEN/);
});
