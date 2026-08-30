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

test('V18 PR template requires explicit scope tags and why', () => {
  const templatePath = '.github/pull_request_template.md';
  assert.ok(fs.existsSync(templatePath), 'V18 PR template ontbreekt');
  const template = fs.readFileSync(templatePath, 'utf8');
  assert.ok(template.includes('V18-SCOPE-TAGS:'), 'PR template mist V18-SCOPE-TAGS');
  assert.ok(template.includes('Waarom deze scope'), 'PR template mist uitleg waarom de scope nodig is');
  assert.ok(template.includes('Doelbranch: `v18-test`'), 'PR template maakt v18-test niet expliciet als integratiedoel');
});

test('governance scope owns the V18 PR template', async () => {
  const { checkScope } = await loadChecker();
  const result = checkScope({declaredTags:['scope:governance'], changedFiles:['.github/pull_request_template.md']});
  assert.equal(result.ok, true, JSON.stringify(result));
});
