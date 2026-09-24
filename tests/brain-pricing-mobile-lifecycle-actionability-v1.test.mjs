import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../prijzen.html', import.meta.url),'utf8');
const verifier=fs.readFileSync(new URL('../tools/site-shell/verify-pricing-i18n-production.mjs', import.meta.url),'utf8');

test('mobile lifecycle tabs remain directly actionable without horizontal overflow dependency',()=>{
  assert.match(html,/@media\(max-width:760px\)\{\.bg-lifecycle-tabs\{flex-wrap:wrap;overflow-x:visible\}/);
  assert.match(html,/\.bg-lifecycle-tabs button\{flex:1 1 auto;min-width:max-content\}/);
  assert.match(verifier,/html\[data-bg-pricing-interactions="ready-v3"\]/);
  const preInteraction = verifier.slice(0, verifier.indexOf('// Lifecycle toggle must change the actual visible panel.'));
  assert.doesNotMatch(preInteraction,/page\.locator\('body'\)\.waitFor\(\{ state:'visible'/);
  assert.match(verifier,/const lossButton = page\.locator\('\[data-bg-stage="loss"\]'\)/);
  assert.match(verifier,/lossButton\.evaluate\(el => el\.scrollIntoView/);
  assert.doesNotMatch(verifier,/scrollIntoViewIfNeeded\(\)/);
  assert.match(verifier,/lossButton\.click\(\{ timeout:15_000 \}\)/);
  assert.doesNotMatch(verifier,/force:\s*true/);
  assert.doesNotMatch(verifier,/evaluate\([^)]*\.click\(/);
  assert.match(verifier,/lossButton\.click\(\{ timeout:15_000 \}\)/);
});
