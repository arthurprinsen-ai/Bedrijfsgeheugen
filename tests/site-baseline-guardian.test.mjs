import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));

const baseline = json('site/accepted-baseline.json');
const navigation = json('site/navigation-baseline.json');

const routeMap = new Map(baseline.routes.map(item => [item.route, item]));

test('all protected website routes still exist', () => {
  assert.ok(baseline.routes.length >= 30, 'primary route catalog must remain comprehensive');
  for (const item of baseline.routes) {
    if (item.mode === 'runtime-generated') continue;
    assert.ok(existsSync(item.file), `${item.route} lost its source file ${item.file}`);
  }
});

test('over-ons accepted story cannot silently become the doelgroep replacement again', () => {
  const overOns = routeMap.get('/over-ons');
  assert.ok(overOns, '/over-ons must be protected');
  assert.equal(overOns.mode, 'semantic');
  const fragment = read('site/accepted-pages/over-ons-main.html');
  for (const anchor of overOns.required_anchors) {
    assert.ok(fragment.includes(anchor), `accepted /over-ons anchor missing: ${anchor}`);
  }
  for (const forbidden of overOns.forbidden_anchors || []) {
    assert.ok(!fragment.includes(forbidden), `forbidden /over-ons replacement returned: ${forbidden}`);
  }
  assert.match(fragment, /data-bg-accepted-baseline="over-ons-brand-story-v1"/);
});

test('restored historical V18 stays untouched while protected production routes remain available', () => {
  const wrapper = read('tools/bouw-v18-production.mjs');
  const core = read('tools/bouw-v18-production-core.mjs');
  assert.match(wrapper, /bouw-v18-production-core\.mjs/);
  assert.doesNotMatch(wrapper, /apply-site-baseline\.mjs/, 'historical V18 homepage must not be post-mutated by later semantic overlay');
  assert.match(core, /be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b/);
  assert.match(core, /https:\/\/adhjwmvyoixzjtmiroln\.supabase\.co\/storage\/v1\/object\/public\/media\/hero\/shanghai-v2\.mp4/, 'accepted V18 presentation layer must use the approved 10-second Supabase hero asset');
  assert.match(core, /writeFile\('index\.html'/);
});

test('new mobile UX preserves the old route catalog under the same groups plus Meer', () => {
  const menu = read('assets/js/menu.js');
  assert.match(menu, /meer\s*:\s*['"]Meer['"]/);
  assert.match(menu, /volgorde\s*=\s*\[[^\]]*['"]meer['"]/s);
  assert.match(menu, /groepen\.meer\s*=\s*\[\]/);
  assert.match(menu, /bron\.querySelectorAll\(['"]:scope > a\[href\]['"]\)/);

  const baselineRoutes = new Set(baseline.routes.map(item => item.route));
  for (const group of navigation.groups) {
    for (const item of group.items) {
      assert.ok(baselineRoutes.has(item.route), `navigation points outside accepted route catalog: ${item.route}`);
    }
  }

  const apply = read('tools/apply-site-baseline.mjs');
  assert.match(apply, /data-bg-mobile-target=\"meer\"/);
  assert.match(apply, /data-bg-mobile-view=\"meer\"/);
  assert.match(apply, /href=\"\/expertises\"/);
  assert.match(apply, /href=\"\/over-ons\"/);
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
  assert.match(selfHealing, /semantic content drift/i);
  assert.match(selfHealing, /last-known-good/i);
  assert.match(agents, /accepted website baseline/i);
  assert.match(agents, /explicit scope/i);
});
