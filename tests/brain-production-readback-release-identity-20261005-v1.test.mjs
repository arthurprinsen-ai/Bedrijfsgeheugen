import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('release identity repair remains website-classified, lane-registered and caller-scoped', () => {
  const focused = read('tests/site-shell-production-readback-release-identity-v1.test.mjs');
  const lane = read('.github/workflows/lane-website.yml');
  const workflow = read('.github/workflows/production-release-readback.yml');
  const checker = read('tools/site-shell/check-live-production.mjs');
  const contract = read('tools/site-shell/live-contract.mjs');

  assert.match(focused, /verifyPricingSemantics:\s*false/);
  assert.match(focused, /pricing-navigatie ontbreekt/i);
  assert.ok(lane.includes('tests/site-shell-production-readback-release-identity-v1.test.mjs'));

  assert.ok(workflow.includes('BROWSER_REQUIRED: $' + '{{ steps.scope.outputs.browser_required }}'));
  assert.ok(workflow.includes('if [[ "$BROWSER_REQUIRED" == "true" ]]; then readback_args=(--identity-only); fi'));
  assert.ok(workflow.includes("steps.routes.outcome == 'success' && steps.pricing.outcome == 'success'"));

  assert.match(checker, /UNKNOWN_READBACK_MODE/);
  assert.match(checker, /verifyPricingSemantics:\s*!identityOnly/);
  assert.match(contract, /verifyPricingSemantics\s*=\s*true/);
  assert.match(contract, /pricing\s*&&\s*verifyPricingSemantics\s*!==\s*false/);
});
