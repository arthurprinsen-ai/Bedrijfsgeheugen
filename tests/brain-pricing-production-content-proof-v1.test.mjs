import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production pricing promotion proves canonical live content', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/Prove pricing production content/);
  assert.match(workflow,/<h3>Build<\/h3>/);
  assert.match(workflow,/Wat moet het opleveren om zichzelf terug te verdienen\?/);
  assert.match(workflow,/data-bg-billing="monthly"/);
  assert.match(workflow,/data-bg-billing="yearly"/);
  assert.match(workflow,/data-bg-price-tab="start"/);
  assert.match(workflow,/data-bg-price-tab="run"/);
  for (const stage of ['grow','loss','crisis','buy','sell','portfolio']) {
    assert.match(workflow,new RegExp(`data-bg-stage="${stage}"`));
  }
  assert.match(workflow,/PRICING_PRODUCTION_CONTENT_PROVEN/);
});
