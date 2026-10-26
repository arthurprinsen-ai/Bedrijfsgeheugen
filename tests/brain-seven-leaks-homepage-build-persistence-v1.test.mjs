import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ensureHomeFreeWorkbook } from '../tools/site-shell/apply-money-page-order-conversion.mjs';

const source=readFileSync(new URL('../tools/site-shell/apply-money-page-order-conversion.mjs',import.meta.url),'utf8');
const build=readFileSync(new URL('../tools/prijzen-uit-de-homepage.mjs',import.meta.url),'utf8');
const fixture='<html><main><div class="page active" id="view-home"><div class="hero-video-actions"><a data-money-primary href="/zelfscan">Doe de scan</a><a data-money-secondary href="/portal-v2/">Portal</a><p data-money-risk-reversal="true"><strong>Geen formulier. Geen e-mail. Geen verplichting. Meteen resultaat.</strong></p></div></div></main></html>';
const href='href="/assets/downloads/7-verborgen-bedrijfslekken.pdf"';

test('historical replay: reconstructed V18 homepage receives a real ungated PDF link',()=>{
  const actual=ensureHomeFreeWorkbook(fixture);
  assert.match(actual,/data-bg-free-seven-leaks-v1/);
  assert.ok(actual.includes(href));
  assert.match(actual,/download="7-verborgen-bedrijfslekken.pdf"/);
  assert.match(actual,/Download gratis het werkboek: 7 verborgen bedrijfslekken/);
  assert.ok(actual.indexOf(href)>actual.indexOf('data-money-risk-reversal'));
});

test('shadow: repeated final build projection remains single-flight and does not alter primary actions',()=>{
  const first=ensureHomeFreeWorkbook(fixture);
  assert.equal(ensureHomeFreeWorkbook(first),first);
  assert.equal(first.split('data-bg-free-seven-leaks-v1').length-1,1);
  assert.match(first,/data-money-primary href="\/zelfscan"/);
  assert.match(first,/data-money-secondary href="\/portal-v2\/"/);
  assert.doesNotMatch(first,/<form\b/);
});

test('canary: missing page or corrupted offer fails closed',()=>{
  assert.throws(()=>ensureHomeFreeWorkbook('<main></main>'),/homepage view not found/);
  assert.throws(()=>ensureHomeFreeWorkbook('<main><div id="view-home"></div></main>'),/risk reversal missing/);
  const corrupt=fixture.replace('data-money-risk-reversal="true"','data-money-risk-reversal="true" data-bg-free-seven-leaks-v1');
  assert.throws(()=>ensureHomeFreeWorkbook(corrupt),/existing marker has no valid download asset/);
});

test('invariant: protected regenerated home uses canonical money-page build step',()=>{
  assert.match(source,/ensureHomeFreeWorkbook\(transformHome\(html\)\)/);
  assert.match(build,/applyMoneyPageOrderConversion\(\)/);
  assert.doesNotMatch(source,/PDF[_-]DOWNLOAD[_-]AS[_-]REVENUE|fake_conversion/i);
});
