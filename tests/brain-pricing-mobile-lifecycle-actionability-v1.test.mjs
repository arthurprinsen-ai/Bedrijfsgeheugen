import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../prijzen.html', import.meta.url),'utf8');
const verifier=fs.readFileSync(new URL('../tools/site-shell/verify-pricing-i18n-production.mjs', import.meta.url),'utf8');

test('mobile lifecycle tabs remain directly actionable without horizontal overflow dependency',()=>{
  assert.match(html,/@media\(max-width:760px\)\{\.bg-lifecycle-tabs\{flex-wrap:wrap;overflow-x:visible\}/);
  assert.match(html,/\.bg-lifecycle-tabs button\{flex:1 1 auto;min-width:max-content\}/);

  const readyMarker='html[data-bg-pricing-interactions="ready-v3"]';
  assert.ok(verifier.includes(readyMarker),'pricing runtime ready-v3 marker must be the initial readiness authority');
  const readyIndex=verifier.indexOf(readyMarker);
  assert.ok(readyIndex>0);
  assert.doesNotMatch(verifier.slice(0,readyIndex),/page\.locator\('body'\)\.waitFor\(\{ state:'visible'/);

  assert.ok(verifier.includes(`page.locator('[data-bg-stage="loss"]')`),'loss lifecycle control must be targeted');
  assert.ok(verifier.includes('scrollIntoView({'),'loss control must be deterministically positioned');
  assert.ok(verifier.includes('getBoundingClientRect()'),'pointer geometry must be validated');
  assert.ok(verifier.includes('getComputedStyle('),'control visibility must be validated');
  assert.doesNotMatch(verifier,/scrollIntoViewIfNeeded\(\)/);

  const realPointerClick = verifier.includes('lossButton.click(') || verifier.includes('page.mouse.click(');
  assert.equal(realPointerClick,true,'production proof must perform a real Playwright pointer click');
  assert.doesNotMatch(verifier,/force:\s*true/);
  assert.doesNotMatch(verifier,/evaluate\([^)]*\.click\(/);
});
