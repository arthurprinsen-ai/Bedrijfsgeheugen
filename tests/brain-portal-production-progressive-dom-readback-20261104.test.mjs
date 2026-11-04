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

test('phase 2: original server-raced overview panels move into accessible details in existing DOM order',async()=>{
 const [app,overview,parity]=await Promise.all([
  load('portal-v2/app.js'),load('portal-v2/modules/overview.js'),
  load('tests/integration/portal-v2-production-legacy-algorithm-parity.spec.js')
 ]);
 assert.match(app,/\[\.\.\.main\.children\]\.filter\(node=>sections\.some\(selector=>node\.matches\(selector\)\)\)/);
 for(const selector of ['[data-legacy-overview-insights]','.legacy-complete','[data-bedrijfslek-intelligence]','[data-business-journey-overview]','.dv-houder']){
  assert.ok(app.includes(selector),'pre-mounted original dashboard panel must be moved: '+selector);
 }
 assert.match(overview,/if\(insights\?\.parentElement\)insights\.after\(houder\)/);
 assert.match(overview,/else if\(lower\?\.parentElement\)lower\.after\(houder\)/);
 assert.match(parity,/NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED:legacy-parity-engine\.js:HTTP403/);
 assert.match(parity,/response\.status\(\),'the original public asset must be independently served, never a 403'\)\.toBe\(200\)/);
});

test('phase 2: original browser must use scoped has() selectors, not nested ancestor-qualified has locators',async()=>{
 const [csrd,standalone]=await Promise.all([
  load('tests/integration/portal-v2-production-csrd.spec.js'),
  load('tests/integration/portal-v2-production-standalone.spec.js'),
 ]);
 assert.match(csrd,/details\.portal-single-nav-group:has\(\[data-nav-target="csrd-impact"\]\)/);
 assert.match(standalone,/details\.portal-single-nav-group:has\(\[data-nav-target="\$\{pageId\}"\]\)/);
 assert.doesNotMatch(csrd,/filter\(\{has:csrdNav\}\)/);
 assert.doesNotMatch(standalone,/filter\(\{has:trigger\}\)/);
});
