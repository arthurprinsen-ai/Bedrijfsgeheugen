import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const policyPath = 'site/v18-scope-policy.json';
const checkerPath = 'tools/check-v18-scope.mjs';

async function loadChecker(){
  assert.ok(fs.existsSync(policyPath), 'site/v18-scope-policy.json ontbreekt');
  assert.ok(fs.existsSync(checkerPath), 'tools/check-v18-scope.mjs ontbreekt');
  return import('../tools/check-v18-scope.mjs');
}

test('mobile-menu scope may change menu files but not pricing content', async () => {
  const { checkScope } = await loadChecker();
  const allowed = checkScope({declaredTags:['component:mobile-menu','area:navigation'], changedFiles:['assets/js/menu.js']});
  assert.equal(allowed.ok, true, JSON.stringify(allowed));
  const denied = checkScope({declaredTags:['component:mobile-menu','area:navigation'], changedFiles:['prijzen.html']});
  assert.equal(denied.ok, false, 'mobile-menu scope mag prijzen.html niet wijzigen');
  assert.ok(denied.violations.includes('prijzen.html'));
});

test('pricing page-content scope can own prijzen.html without owning navigation', async () => {
  const { checkScope } = await loadChecker();
  const result = checkScope({declaredTags:['component:page-content','area:pricing'], changedFiles:['prijzen.html']});
  assert.equal(result.ok, true, JSON.stringify(result));
});

test('disjoint component scopes are recognized as parallel-safe while overlapping scopes are not', async () => {
  const { scopesOverlap } = await loadChecker();
  assert.equal(scopesOverlap(['component:mobile-menu','area:navigation'], ['component:blog','area:knowledge']), false);
  assert.equal(scopesOverlap(['component:mobile-menu','area:navigation'], ['component:header','area:navigation']), true);
});
