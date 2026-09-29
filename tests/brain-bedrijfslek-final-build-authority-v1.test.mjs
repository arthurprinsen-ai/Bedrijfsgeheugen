import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('historical V18 view generator cannot overwrite standalone Bedrijfslek',()=>{
  const views=read('tools/v18-views-lijst.mjs');
  assert.doesNotMatch(views,/view:\s*['"]selfscan['"]/);
  assert.match(views,/standalone[\s\S]*zelfscan\.html[\s\S]*canonical source/i);
});

test('homepage build transform validates the actual view-home scope',()=>{
  const source=read('tools/site-shell/apply-money-page-order-conversion.mjs');
  assert.match(source,/const homeStart = html\.indexOf\('id="view-home"'\)/);
  assert.match(source,/Plan gratis een Frisse Blik/);
  assert.match(source,/FINAL_BEDRIJFSLEK_HOME_ARTIFACT_MISSING/);
  assert.match(source,/FINAL_BEDRIJFSLEK_SCAN_ARTIFACT_MISSING/);
});
