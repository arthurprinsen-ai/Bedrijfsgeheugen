import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('static i18n discovery does not retain parse5 DOM trees for every route',()=>{
  const source=readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.doesNotMatch(source,/const parsed = new Map\(\)/);
  assert.doesNotMatch(source,/parsed\.set\(file,\{doc,refs\}\)/);
  assert.match(source,/const allStrings = new Set\(\)/);
  assert.match(source,/Do not retain parse5 document trees across routes/i);
});

test('Bedrijfslek growth copy is present in the production English cache',()=>{
  const patch=JSON.parse(readFileSync('config/bg-static-i18n-en.d/2026-09-29-bedrijfslek-growth.json','utf8'));
  assert.equal(patch['Daag mijn MT / collega uit →'],'Challenge my management team / colleague →');
  assert.equal(patch['Gratis Bedrijfsgeheugen Mini · 7 dagen'],'Free Bedrijfsgeheugen Mini · 7 days');
});
