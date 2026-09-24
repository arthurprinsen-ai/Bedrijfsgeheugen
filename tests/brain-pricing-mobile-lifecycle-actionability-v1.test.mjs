import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../prijzen.html', import.meta.url),'utf8');
const verifier=fs.readFileSync(new URL('../tools/site-shell/verify-pricing-i18n-production.mjs', import.meta.url),'utf8');

test('mobile lifecycle tabs remain directly actionable without horizontal overflow dependency',()=>{
  assert.match(html,/@media\(max-width:760px\)\{\.bg-lifecycle-tabs\{flex-wrap:wrap;overflow-x:visible\}/);
  assert.match(html,/\.bg-lifecycle-tabs button\{flex:1 1 auto;min-width:max-content\}/);
  assert.match(verifier,/ready-v3/);
  assert.match(verifier,/bgPricingInteractions/);
  assert.doesNotMatch(verifier,/lossButton\.waitFor\(/);
  assert.doesNotMatch(verifier,/lossButton\.evaluate\(/);
  assert.doesNotMatch(verifier,/scrollIntoViewIfNeeded\(\)/);
  assert.match(verifier,/page\.evaluate\(\(\) => \{/);
  assert.match(verifier,/document\.querySelector\('\[data-bg-stage="loss"\]'\)/);
  assert.match(verifier,/getComputedStyle\(element\)/);
  assert.match(verifier,/getBoundingClientRect\(\)/);
  assert.match(verifier,/page\.mouse\.click\(lossBox\.x \+ lossBox\.width \/ 2, lossBox\.y \+ lossBox\.height \/ 2\)/);
  assert.match(verifier,/loss stage aria-selected did not become true/);
  assert.doesNotMatch(verifier,/force:\s*true/);
});
