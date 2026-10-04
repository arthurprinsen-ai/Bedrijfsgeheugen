import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-website-cross-browser-assurance-v1.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');
const runner=fs.readFileSync('tools/site-shell/website-cross-browser-assurance.mjs','utf8');

test('website assurance covers all public routes and critical screenshots',()=>{
  assert.equal(contract.version,'POWERHOUSE-WEBSITE-CROSS-BROWSER-ASSURANCE-v1');
  assert.deepEqual(contract.all_route_sweep.browsers,['chromium']);
  assert.deepEqual(contract.all_route_sweep.viewports,['mobile','desktop']);
  assert.ok(contract.screenshot_matrix.routes.length>=12);
  assert.deepEqual(contract.screenshot_matrix.browsers,['chromium','firefox','webkit']);
  assert.deepEqual(contract.screenshot_matrix.viewports,['mobile','tablet','desktop']);
  assert.ok(contract.rules.includes('all_sitemap_routes_must_be_swept'));
  assert.ok(contract.rules.includes('failure_screenshot_required'));
});

test('website assurance checks responsive failures instead of screenshot-only decoration',()=>{
  for(const marker of ['horizontal overflow','broken images','page errors','failed core requests','CLS','main missing/not visible','h1 missing/not visible']) assert.ok(runner.includes(marker),marker);
  assert.ok(runner.includes('page.screenshot'));
  assert.ok(runner.includes('sitemap.xml'));
  assert.ok(runner.includes('workerCount'));
  assert.ok(runner.includes('Promise.all'));
  assert.ok(runner.includes('ASSURANCE_WORKERS'));
});

test('website assurance exercises interactions',()=>{
  const ids=new Set(contract.interactions.map(item=>item.id));
  for(const id of ['mobile-menu','desktop-menu','language-switch'])assert.ok(ids.has(id),id);
  assert.ok(runner.includes('aria-expanded'));
  assert.ok(runner.includes('#v18MobileDrawer'));
});

test('website assurance is scheduled daily and keeps evidence',()=>{
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/cron: '20 6 \* \* \*'/);
  assert.match(workflow,/chromium firefox webkit/);
  assert.match(workflow,/retention-days: 30/);
  assert.match(workflow,/include-hidden-files: true/);
  assert.match(runner,/using production sitemap for route inventory only/);
});

test('website cross-browser assurance stays classified in website delivery lane',()=>{
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const website=policy.lanes.find(lane=>lane.id==='website');
  for(const path of [
    '.github/workflows/website-cross-browser-screenshot-assurance.yml',
    'config/powerhouse-website-cross-browser-assurance-v1.json',
    'tools/site-shell/website-cross-browser-assurance.mjs',
    'tests/brain-website-cross-browser-screenshot-assurance-v1.test.mjs'
  ]) assert.ok(website.paths.some(prefix=>path===prefix||path.startsWith(prefix)),path);
});

test('platform aliases resolve to canonical product routes',()=>{
  const netlify=fs.readFileSync('netlify.toml','utf8');
  assert.match(netlify,/from = "\/platform"[\s\S]*?to = "\/product"[\s\S]*?status = 301/);
  assert.match(netlify,/from = "\/en\/platform"[\s\S]*?to = "\/en\/product"[\s\S]*?status = 301/);
});


test('shared header reserves final i18n and mobile menu geometry before JavaScript',()=>{
  const header=fs.readFileSync('components/header/header.html','utf8');
  const css=fs.readFileSync('components/header/header.css','utf8');
  assert.match(header,/data-bg-language-switcher="desktop"/);
  assert.match(header,/id="bgkopKnop"[^>]*aria-controls="bgSharedMobileNav"/);
  assert.match(header,/bg-mobile-menu-label">Menu</);
  assert.match(header,/bg-mobile-menu-icon/);
  assert.match(css,/\.bgkop-knop\{[^}]*min-width:72px;[^}]*height:44px/);
});

test('critical screenshot matrix uses canonical product route and real controls',()=>{
  assert.ok(contract.screenshot_matrix.routes.includes('/product'));
  assert.ok(!contract.screenshot_matrix.routes.includes('/platform'));
  const byId=Object.fromEntries(contract.interactions.map(item=>[item.id,item]));
  assert.deepEqual(byId['mobile-menu'].selectorCandidates,['#mobileToggle']);
  assert.deepEqual(byId['desktop-menu'].selectorCandidates,['header.v17-header .navitem[data-mega] > .navbtn']);
  assert.deepEqual(byId['language-switch'].selectorCandidates,['button[data-bg-language-current]']);
  assert.ok(runner.includes('#v18MobileDrawer'));
  assert.ok(runner.includes('a[data-bg-language-option="en"]:visible'));
  assert.ok(runner.includes('clsEntries'));
});

test('pull requests test exact preview while schedule tests production',()=>{
  assert.match(workflow,/deploy-preview-\$\{PR_NUMBER\}--bedrijfsgeheugen\.netlify\.app/);
  assert.match(workflow,/github\.event_name == 'pull_request'/);
  assert.match(workflow,/https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(workflow,/Wait for exact candidate preview/);
  assert.match(workflow,/ASSURANCE_MODE:/);
  assert.deepEqual(contract.pr_all_route_viewports,['mobile']);
  assert.deepEqual(contract.daily_all_route_viewports,['mobile','desktop']);
  assert.ok(contract.rules.includes('pull_request_sweep_is_bounded'));
  assert.ok(contract.rules.includes('daily_production_sweep_covers_mobile_and_desktop'));
});


test('generated English pages receive final font fallback and tablet trustbar geometry is stable',()=>{
  const cta=fs.readFileSync('tools/site-shell/cta-conversie.mjs','utf8');
  const components=fs.readFileSync('tools/site-shell/components.mjs','utf8');
  assert.match(cta,/'en\/\*\*\/\*\.html'/);
  assert.match(cta,/'pages\/\*\*\/\*\.html'/);
  assert.match(components,/@media\(min-width:641px\) and \(max-width:1024px\)/);
  assert.match(components,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(runner,/navigationAbort=errorText==='net::ERR_ABORTED'\|\|errorText==='NS_ERROR_ABORT'/);
});

// Delivery metadata refresh: exact six-file website recovery scope.

test('cross-browser runner distinguishes navigation aborts from real asset failures',()=>{
  assert.match(runner,/NS_ERROR_ABORT/);
  assert.match(runner,/net::ERR_ABORTED/);
  assert.match(runner,/inspectSettled/);
  assert.match(runner,/Execution context was destroyed/);
});

test('critical Chromium screenshots follow the actual PR sweep viewports',()=>{
  assert.match(runner,/allRouteViewports\.includes\(viewportName\)/);
});

test('canonical V18 navigation exposes machine-readable open state',()=>{
  const core=fs.readFileSync('tools/bouw-v18-production-core.mjs','utf8');
  assert.match(core,/v18-navigation-state-contract/);
  assert.match(core,/aria-controls','v18MobileDrawer'/);
  assert.match(core,/aria-expanded',open\?'true':'false'/);
  assert.match(core,/\.v17-navitem\[data-mega\]/);
  assert.match(core,/button\.addEventListener\('click'/);
});
