import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('original mobile browser remains bound to canonical four-tab owner router, never the obsolete hamburger',async()=>{
 const [runtime,probe]=await Promise.all([
  read('portal-v2/app.js'),read('tests/integration/portal-v2-mobile-shell.spec.js')
 ]);
 assert.match(runtime,/nav\.dataset\.portalMobilePrimary='v1'/);
 for(const label of ['Vandaag','Acties','Resultaat','Meer'])
  assert.ok(runtime.includes("'"+label+"'"),label+' must remain canonical shortcut');
 assert.match(probe,/\[data-portal-mobile-primary="v1"\]/);
 assert.match(probe,/\[data-mobile-primary-target="hub:portal"\]/);
 assert.match(probe,/dock\.locator\('button'\)\)\.toHaveCount\(4\)/);
 assert.match(probe,/canonical mobile Meer touch target/);
 assert.match(probe,/await more\.click\(\)/);
 assert.match(probe,/toHaveAttribute\('data-hub','portal'\)/);
 assert.match(probe,/toHaveAttribute\('aria-hidden','true'\)/);
 assert.match(probe,/\#portalFullMenuToggle'\)\)\.toBeHidden/);
 assert.doesNotMatch(probe,/\#portalFullMenuToggle'\)\)\.toBeVisible/);
});

test('original mobile proof keeps actual hydrated UX metrics and no uncaught runtime errors',async()=>{
 const probe=await read('tests/integration/portal-v2-mobile-shell.spec.js');
 assert.match(probe,/page\.waitForSelector\('\.app'\)/);
 assert.match(probe,/page\.screenshot\(/);
 assert.match(probe,/searchGeometry\)\.toHaveLength\(4\)/);
 assert.match(probe,/topbarHeight\)\.toBeLessThan\(260\)/);
 assert.match(probe,/actionGeometry\)\.toHaveLength\(1\)/);
 assert.match(probe,/overflow\)\.toBeLessThanOrEqual\(1\)/);
 assert.match(probe,/expect\(errors\)\.toEqual\(\[\]\)/);
});
