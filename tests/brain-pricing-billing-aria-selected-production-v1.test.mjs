import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing billing rescue publishes both pressed and selected semantics', () => {
  const source = fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');
  assert.match(source, /data-bg-billing/);
  assert.match(source, /setAttribute\('aria-pressed', String\(active\)\)/);
  assert.match(source, /setAttribute\('aria-selected', String\(active\)\)/);
  const billingIndex = source.indexOf("function setBilling");
  const selectedIndex = source.indexOf("setAttribute('aria-selected', String(active))", billingIndex);
  assert.ok(billingIndex >= 0 && selectedIndex > billingIndex, 'billing state must publish aria-selected inside setBilling');
});
