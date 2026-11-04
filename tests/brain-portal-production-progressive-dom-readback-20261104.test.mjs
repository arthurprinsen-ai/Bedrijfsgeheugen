import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const load=path=>readFile(new URL(path,root),'utf8');

test('historical production failure: original overview renderers insert under the actual direct DOM parent',async()=>{
 const [overview,legacy]=await Promise.all([
  load('portal-v2/modules/overview.js'),
  load('portal-v2/modules/legacy-overview-complete.js')
 ]);
 assert.equal((overview.match(/\(anchor\?\.parentElement\|\|main\)\.insertBefore\(section,anchor\|\|null\)/g)||[]).length,2);
 assert.equal((legacy.match(/\(anchor\?\.parentElement\|\|main\)\.insertBefore\(section,anchor\|\|null\)/g)||[]).length,1);
 assert.doesNotMatch(overview,/main\.insertBefore\(section,anchor\|\|null\)/);
 assert.doesNotMatch(legacy,/main\.insertBefore\(section,anchor\|\|null\)/);
 assert.match(overview,/section\.dataset\.legacyOverviewInsights='true'/);
 assert.match(overview,/Stand van je bedrijf/);
 assert.match(overview,/Adoptiecurve/);
 assert.match(legacy,/renderLegacyOverviewComplete/);
});

test('real production browser probes open the original canonical details and 44px mobile More',async()=>{
 const [csrd,standalone,global,overview]=await Promise.all([
  load('tests/integration/portal-v2-production-csrd.spec.js'),
  load('tests/integration/portal-v2-production-standalone.spec.js'),
  load('tests/integration/portal-v2-production-full-parity.spec.js'),
  load('tests/integration/portal-v2-production-overview-navigation.spec.js'),
 ]);
 assert.match(csrd,/csrdGroup\.locator\('summary'\)\.click\(\)/);
 assert.match(csrd,/csrdNav\)\.toBeVisible/);
 assert.match(standalone,/group\.locator\('summary'\)\.click\(\)/);
 assert.match(standalone,/trigger\.click\(\)/);
 assert.match(global,/data-mobile-primary-target="hub:portal"/);
 assert.match(global,/mobile More touch target/);
 assert.match(global,/data-mobile-global-actions/);
 assert.match(overview,/more\.locator\('summary'\)\.click\(\)/);
 assert.match(overview,/data-legacy-overview-insights/);
 assert.match(overview,/Adoptiecurve/);
 assert.match(overview,/CMMI/);
});
