import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../prijzen.html', import.meta.url),'utf8');
const verifier=fs.readFileSync(new URL('../tools/site-shell/verify-pricing-i18n-production.mjs', import.meta.url),'utf8');

test('mobile lifecycle tabs remain directly actionable without horizontal overflow dependency',()=>{
  assert.match(html,/@media\(max-width:760px\)\{\.bg-lifecycle-tabs\{flex-wrap:wrap;overflow-x:visible\}/);
  assert.match(html,/\.bg-lifecycle-tabs button\{flex:1 1 auto;min-width:max-content\}/);
  assert.match(verifier,/html\[data-bg-pricing-interactions="ready-v3"\]/);
  const readyIndex=verifier.indexOf('html[data-bg-pricing-interactions="ready-v3"]');
  assert.ok(readyIndex>0);
  assert.doesNotMatch(verifier.slice(0,readyIndex),/page\.locator\('body'\)\.waitFor\(\{ state:'visible'/);
  assert.match(verifier,/const lossButton = page\.locator\('\[data-bg-stage="loss"\]'\)/);
  assert.match(verifier,/lossButton\.evaluate\([^=]+=> [^\n]*scrollIntoView/);
  assert.doesNotMatch(verifier,/scrollIntoViewIfNeeded\(\)/);
  assert.match(verifier,/page\.mouse\.click\(lossBox\.x \+ lossBox\.width \/ 2, lossBox\.y \+ lossBox\.height \/ 2\)/);
  assert.doesNotMatch(verifier,/force:\s*true/);
  assert.doesNotMatch(verifier,/evaluate\([^)]*\.click\(/);
});
