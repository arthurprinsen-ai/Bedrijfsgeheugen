import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileClosurePlan } from '../tools/delivery/integration-bundle-compiler.mjs';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

const workflow = readFileSync('.github/workflows/powerhouse-daily-blog.yml', 'utf8');
const policy = JSON.parse(readFileSync('config/powerhouse-integration-bundle-v1.json', 'utf8'));

function stepBody(name) {
  const start = workflow.indexOf(`- name: ${name}`);
  assert.ok(start >= 0, `step not found: ${name}`);
  const next = workflow.indexOf('\n      - name: ', start + 1);
  return workflow.slice(start, next === -1 ? workflow.length : next);
}

const PREPARE = '--prepare-cache="powerhouse-blog-$DATE-committed.json"';
const VALIDATE = '--validate-cache';

// Two key views exist: the production transform chain (prepare-i18n-cache in the
// build entry) and the committed HTML that BRAIN tests validate. Both must be complete.
for (const name of ['Create exactly one protected candidate', 'Persist English cache before protected CI']) {
  test(`step "${name}" prepares and validates the committed tree after the production pass`, () => {
    const body = stepBody(name);
    const production = body.indexOf('--prepare-i18n-cache=');
    const committed = body.indexOf(PREPARE);
    assert.ok(production >= 0, 'production prepare pass missing');
    assert.ok(committed > production, 'committed-tree pass must come after the production pass');
    const validateAfter = body.indexOf(VALIDATE, committed);
    assert.ok(validateAfter > committed, 'validation of the committed tree must follow the committed pass');
    assert.ok(/STATIC_I18N_NETWORK=1 node tools\/site-shell\/build-localized-routes\.mjs[^\n]*\\\n\s+--prepare-cache=/.test(body), 'committed pass must allow the provider network');
    assert.ok(/STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1[^\n]*\\\n\s+node tools\/site-shell\/build-localized-routes\.mjs --validate-cache/.test(body.slice(committed)), 'validation must stay fail-closed');
  });

  test(`step "${name}" starts the committed pass from a clean committed tree and stages its patch`, () => {
    const body = stepBody(name);
    const committed = body.indexOf(PREPARE);
    const before = body.slice(0, committed);
    const reset = before.lastIndexOf('git reset --hard HEAD');
    const clean = before.lastIndexOf('git clean -fd');
    assert.ok(reset >= 0 && clean > reset, 'tree must be reset and cleaned right before the committed pass');
    assert.ok(!before.slice(clean).includes('git checkout'), 'no checkout between clean and the committed pass');
    assert.ok(body.includes('patch2="config/bg-static-i18n-en.d/powerhouse-blog-$DATE-committed.json"'));
    assert.ok(body.includes('git add -- "$patch2"'));
  });
}

test('in the candidate step the committed patch is pushed together with the candidate', () => {
  const body = stepBody('Create exactly one protected candidate');
  assert.ok(body.indexOf(PREPARE) < body.indexOf('git push --force-with-lease origin "HEAD:$branch"'));
});

test('the committed-tree patch is a runtime closure path of the daily blog obligation', () => {
  const result = compileClosurePlan({
    changedPaths: ['blog/index.html', 'config/bg-static-i18n-en.d/powerhouse-blog-2026-11-08.json', 'config/bg-static-i18n-en.d/powerhouse-blog-2026-11-08-committed.json'],
    policy,
    obligationId: 'content-publication:2026-11-08:blog'
  });
  assert.equal(result.authority, 'canonical-runtime-obligation');
  assert.equal(result.ready, true);
});

const RULE = 'DAILY_BLOG_I18N_MUST_COVER_COMMITTED_TREE';

test('the planned-action guard blocks removing the committed-tree pass until acknowledged', async () => {
  const knowledge = await loadGuardKnowledge();
  const action = 'Remove the committed-tree prepare-cache pass from the daily blog i18n step';
  const result = matchPlannedAction({ action, ...knowledge });
  assert.ok(result.matches.some(match => match.ruleId === RULE), 'trigger did not fire');
  assert.equal(result.ok, false);
  const passed = matchPlannedAction({ action, ...knowledge, acknowledged: result.unacknowledged.map(match => match.ruleId) });
  assert.equal(passed.ok, true);
});

test('everyday blog and i18n wording does not fire the committed-tree rule', async () => {
  const knowledge = await loadGuardKnowledge();
  for (const action of [
    'Fix a typo in a blog title',
    'Update blog post copy for the new report',
    'Draft a LinkedIn post about the AI report',
    'Translate the pricing page to English',
    'Improve the process documentation for onboarding'
  ]) {
    const fired = matchPlannedAction({ action, ...knowledge }).matches.filter(match => match.ruleId === RULE);
    assert.deepEqual(fired, [], `false positive on: ${action}`);
  }
});
