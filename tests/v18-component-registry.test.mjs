import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const registryPath = 'site/v18-component-registry.json';
const allowedSource = new Set(['source:v18-leading','source:production-preserved','source:new-v18-authored']);
const allowedStatus = new Set(['status:accepted','status:test-only','status:needs-review','status:production-approved']);

function loadRegistry(){
  assert.ok(fs.existsSync(registryPath), 'site/v18-component-registry.json ontbreekt');
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

test('V18 component registry has valid unique tagged route records', () => {
  const registry = loadRegistry();
  assert.equal(registry.baselineTag, 'baseline:v18-accepted');
  assert.ok(Array.isArray(registry.routes) && registry.routes.length > 0, 'registry.routes moet gevuld zijn');
  const seen = new Set();
  for (const entry of registry.routes) {
    assert.ok(entry.route?.startsWith('/'), `ongeldige route: ${entry.route}`);
    assert.ok(!seen.has(entry.route), `dubbele route: ${entry.route}`);
    seen.add(entry.route);
    assert.ok(entry.file && fs.existsSync(entry.file), `${entry.route} -> ${entry.file} ontbreekt`);
    assert.ok(allowedSource.has(entry.sourceTag), `${entry.route} heeft ongeldige sourceTag ${entry.sourceTag}`);
    assert.ok(allowedStatus.has(entry.statusTag), `${entry.route} heeft ongeldige statusTag ${entry.statusTag}`);
    assert.ok(Array.isArray(entry.areaTags) && entry.areaTags.length > 0 && entry.areaTags.every(v => v.startsWith('area:')), `${entry.route} mist areaTags`);
    assert.ok(Array.isArray(entry.componentTags) && entry.componentTags.length > 0 && entry.componentTags.every(v => v.startsWith('component:')), `${entry.route} mist componentTags`);
    assert.equal(entry.baselineTag, 'baseline:v18-accepted', `${entry.route} mist baseline tag`);
    assert.ok(typeof entry.reason === 'string' && entry.reason.trim().length >= 12, `${entry.route} mist duidelijke reason`);
  }
});

test('required visible V18 and preserved production routes are classified', () => {
  const registry = loadRegistry();
  const byRoute = new Map(registry.routes.map(r => [r.route, r]));
  const required = ['/','/meer','/over-ons','/hoe-het-werkt','/partners','/cases','/kennis','/blog/','/onderzoeken','/benchmark','/templates-tools','/security','/ai-act','/privacy','/juridisch','/helpcentrum','/changelog','/contact','/inloggen'];
  for (const route of required) assert.ok(byRoute.has(route), `verplichte route ontbreekt uit registry: ${route}`);
  assert.equal(byRoute.get('/blog/').sourceTag, 'source:production-preserved');
  assert.equal(byRoute.get('/meer').sourceTag, 'source:new-v18-authored');
});
