import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');

test('pricing rescue observer cannot self-trigger from textContent updates',()=>{
  assert.match(source,/function nodeContainsPricingControl\(node\)/);
  assert.match(source,/Array\.from\(m\.addedNodes \|\| \[\]\)\.some\(nodeContainsPricingControl\)/);
  assert.match(source,/\[data-bg-stage\],\[data-bg-stage-panel\],\[data-bg-price-tab\],\[data-bg-group\],\[data-bg-billing\]/);
  assert.doesNotMatch(source,/mutations\.some\(\(m\) => m\.type === 'childList' && m\.addedNodes\.length\)/);
  assert.match(source,/queueMicrotask\(\(\) => \{/);
});
