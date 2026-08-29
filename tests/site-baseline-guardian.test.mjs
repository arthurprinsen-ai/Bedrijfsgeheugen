import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const baseline = json('site/accepted-baseline.json');
const navigation = json('site/navigation-baseline.json');
const routeMap = new Map(baseline.routes.map(item => [item.route, item]));

const TEST_PRIMARY = [
  ['/problemen', 'problemen.html'],
  ['/oplossingen', 'oplossingen.html'],
  ['/bedrijfsgeheugen', 'bedrijfsgeheugen.html'],
  ['/prijzen', 'prijzen.html'],
  ['/cases', 'cases.html'],
  ['/kennis', 'kennis.html'],
  ['/over-ons', 'over-ons.html']
];
const TEST_ACCOUNT = [['/inloggen','inloggen.html'],['/aanmelden','aanmelden.html']];

test('accepted test prototype is the canonical website source', () => {
  assert.equal(baseline.version, 2);
  assert.equal(baseline.source?.type, 'netlify-test-prototype');
  assert.equal(baseline.source?.pr, 110);
  assert.equal(baseline.source?.sha, '5a8cc121691200231f9b7a00eed5fdcff9764678');
  assert.equal(baseline.source?.prototype, 'prototype-v18-6.html');
});

test('all protected website routes still exist', () => {
  assert.ok(baseline.routes.length >= 30, 'primary route catalog must remain comprehensive');
  for (const item of baseline.routes) {
    if (item.mode === 'runtime-generated') continue;
    assert.ok(existsSync(item.file), `${item.route} lost its source file ${item.file}`);
  }
});

test('all restored test prototype pages keep their accepted semantics', () => {
  for (const [route, file] of TEST_PRIMARY) {
    const item = routeMap.get(route);
    assert.ok(item, `${route} must be protected`);
    assert.equal(item.file, file);
    if (item.mode !== 'semantic') continue;
    const source = route === '/over-ons' ? read('site/accepted-pages/over-ons-main.html') : read(file);
    for (const anchor of item.required_anchors || []) assert.ok(source.includes(anchor), `${route} lost accepted test-prototype anchor: ${anchor}`);
  }
});

test('test account views are real protected routes, not dead prototype links', () => {
  const expectedLabels = ['Inloggen','Aanmelden'];
  assert.deepEqual(navigation.account.map(item => item.label), expectedLabels);
  assert.deepEqual(navigation.account.map(item => item.href), TEST_ACCOUNT.map(([route]) => route));
  for (const [route,file] of TEST_ACCOUNT) {
    const item = routeMap.get(route);
    assert.ok(item, `${route} must be protected because it existed in the accepted test prototype`);
    assert.equal(item.file, file);
    assert.ok(existsSync(file), `${route} is still a dead link`);
    const html = read(file);
    for (const anchor of item.required_anchors || []) assert.ok(html.includes(anchor), `${route} lost accepted test-prototype anchor: ${anchor}`);
  }
});

test('over-ons is pinned to the accepted test-prototype story', () => {
  const fragment = read('site/accepted-pages/over-ons-main.html');
  assert.match(fragment, /data-bg-accepted-baseline="over-ons-test-prototype-v2"/);
  assert.match(fragment, /Ons verhaal/);
  assert.match(fragment, /Onze missie/);
  assert.match(fragment, /Ons geloof/);
  assert.match(fragment, /Van chaos naar grip en controle\./);
  assert.match(fragment, /Samenhang/);
  assert.match(fragment, /Continuïteit/);
  assert.match(fragment, /Betrouwbare AI/);
  assert.doesNotMatch(fragment, /over-ons-brand-story-v1/);
});

test('build applies accepted test semantics after untouched V18 core', () => {
  const wrapper = read('tools/bouw-v18-production.mjs');
  const core = read('tools/bouw-v18-production-core.mjs');
  const apply = read('tools/apply-site-baseline.mjs');
  assert.match(wrapper, /bouw-v18-production-core\.mjs/);
  assert.match(wrapper, /apply-site-baseline\.mjs/);
  assert.match(core, /EXPECTED_HTML_SHA256/);
  assert.match(core, /openart-hero-iphone-safe-v1\.mp4/);
  assert.match(apply, /<main>\[\\s\\S\]\*\?<\\\/main>/);
  assert.match(apply, /test prototype anchor missing/);
  assert.match(apply, /technical\/navigation shell was lost/);
});

test('primary navigation is the accepted seven-view test catalog', () => {
  const expected = TEST_PRIMARY.map(([route]) => route);
  assert.deepEqual(navigation.primary.map(item => item.href), expected);
  assert.deepEqual(navigation.primary.map(item => item.label), ['Problemen','Oplossingen','Platform','Prijzen','Cases','Kennis','Over ons']);
  const baselineRoutes = new Set(baseline.routes.map(item => item.route));
  for (const item of navigation.primary) assert.ok(baselineRoutes.has(item.href), `primary navigation points outside accepted route catalog: ${item.href}`);
  assert.equal(navigation.cta.href, '/frisse-blik');
});

test('restored standalone pages share the canonical responsive shell and stay contextually connected', () => {
  const standalone = ['/problemen','/oplossingen','/prijzen','/cases','/kennis'];
  const standaloneSet = new Set(standalone);
  const incoming = new Map(standalone.map(route => [route, 0]));
  for (const route of standalone) {
    const file = routeMap.get(route)?.file;
    const html = read(file);
    assert.match(html, /\/assets\/test-prototype-pages\.css/);
    assert.match(html, /\/assets\/test-prototype-pages\.js/);
    assert.match(html, /data-bg-shared-shell="header"/);
    assert.match(html, /data-bg-shared-shell="footer"/);
    assert.match(html, /\/assets\/recovered-page-shell\.js/);
    const main = (html.match(/<main>[\s\S]*?<\/main>/) || [''])[0];
    for (const target of standalone) {
      if (target !== route && main.includes(`href="${target}"`)) incoming.set(target, incoming.get(target) + 1);
    }
  }
  for (const route of standaloneSet) assert.ok(incoming.get(route) > 0, `${route} became an orphan inside the restored page cluster`);

  const shell = read('assets/recovered-page-shell.js');
  assert.match(shell, /class="bgkop"/);
  assert.match(shell, /id="bgkopKnop"/);
  assert.match(shell, /aria-label="Menu openen"/);
  assert.match(shell, /class="bgvoet"/);

  const mobile = read('assets/test-prototype-pages.js');
  assert.match(mobile, /aria-expanded/);
  assert.match(mobile, /mobile-drawer/);
  assert.match(mobile, /Escape/);
  assert.match(mobile, /Sluit/);
  assert.match(mobile, /Menu/);
});

test('future protected content edits require an explicit machine-readable scope contract', () => {
  assert.ok(existsSync('site/change-scope.schema.json'), 'change-scope schema must exist');
  const schema = json('site/change-scope.schema.json');
  assert.deepEqual(schema.required, ['routes', 'change_class', 'preserve']);
  assert.ok(schema.properties.routes);
  assert.ok(schema.properties.change_class);
  assert.ok(schema.properties.preserve);
});

test('self-healing policy explicitly covers semantic content drift', () => {
  const selfHealing = read('docs/self-healing-agents.md');
  const agents = read('AGENTS.md');
  const incident = read('docs/development-ledger-events/2026-08-29-test-prototype-page-recovery.md');
  assert.match(selfHealing, /semantic content drift/i);
  assert.match(selfHealing, /last-known-good/i);
  assert.match(agents, /accepted website baseline/i);
  assert.match(agents, /explicit scope/i);
  assert.match(incident, /Accepted information architecture is a first-class release contract/i);
});
