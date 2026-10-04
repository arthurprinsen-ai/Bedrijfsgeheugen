import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-website-cross-browser-assurance-v1.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');
const runner=fs.readFileSync('tools/site-shell/website-cross-browser-assurance.mjs','utf8');

test('website assurance covers all public routes and critical screenshots',()=>{
  assert.equal(contract.version,'POWERHOUSE-WEBSITE-CROSS-BROWSER-ASSURANCE-v1');
  assert.deepEqual(contract.all_route_sweep.browsers,['chromium']);
  assert.deepEqual(contract.all_route_sweep.viewports,['small-mobile','desktop']);
  assert.ok(contract.screenshot_matrix.routes.length>=12);
  assert.deepEqual(contract.screenshot_matrix.browsers,['chromium','firefox','webkit']);
  assert.deepEqual(contract.screenshot_matrix.viewports,['small-mobile','mobile','tablet','desktop','wide-desktop']);
  assert.ok(contract.rules.includes('all_sitemap_routes_must_be_swept'));
  assert.ok(contract.rules.includes('failure_screenshot_required'));
});

test('website assurance checks visual quality, not screenshot-only decoration',()=>{
  for(const marker of ['horizontal overflow','broken images','page errors','failed core requests','CLS','main missing/not visible','h1 missing/not visible','media outside viewport','cards outside viewport','truncated primary controls','navigation covers main heading']) assert.ok(runner.includes(marker),marker);
  assert.ok(runner.includes('page.screenshot'));
  assert.ok(runner.includes('sitemap.xml'));
  assert.ok(runner.includes('start+=25'));
  assert.ok(contract.visual_quality_assertions.length>=8);
  assert.ok(contract.rules.includes('visual_quality_is_a_release_requirement'));
  assert.ok(contract.rules.includes('visual_failures_must_be_fixed_not_hidden'));\n  assert.ok(contract.rules.includes('daily_gate_uses_bounded_full_sitemap_plus_deep_critical_matrix'));
});

test('website assurance exercises interactions',()=>{
  const ids=new Set(contract.interactions.map(item=>item.id));
  for(const id of ['mobile-menu','more-menu','language-switch'])assert.ok(ids.has(id),id);
  assert.ok(runner.includes('aria-expanded'));
  assert.ok(runner.includes('aria-controls'));
});

test('website assurance is scheduled daily and keeps evidence',()=>{
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/cron: '20 6 \* \* \*'/);
  assert.match(workflow,/chromium firefox webkit/);
  assert.match(workflow,/retention-days: 30/);
});
