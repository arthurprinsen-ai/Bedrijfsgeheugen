import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production pricing lifecycle proof uses deterministic positioning and a real mobile pointer click',()=>{
  assert.ok(source.includes(`page.locator('[data-bg-stage="loss"]')`),'loss lifecycle control must be targeted');
  assert.ok(source.includes('scrollIntoView({'),'proof must use deterministic DOM positioning');
  assert.ok(source.includes('getBoundingClientRect()'),'proof must validate actionable geometry');
  assert.ok(source.includes('getComputedStyle('),'proof must validate visual actionability');
  assert.doesNotMatch(source,/scrollIntoViewIfNeeded\(\)/);

  const realPointerClick = source.includes('lossButton.click(') || source.includes('page.mouse.click(');
  assert.equal(realPointerClick,true,'production proof must use Playwright pointer input');
  assert.doesNotMatch(source,/force:\s*true/);
  assert.doesNotMatch(source,/evaluate\([^)]*\.click\(/);
});
