import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

const knowledge = await loadGuardKnowledge();
const guardPath = fileURLToPath(new URL('../scripts/brain/planned-action-guard.mjs', import.meta.url));

test('every trigger points at an active rule with a PROVEN lesson', () => {
  const active = new Set(knowledge.rules.filter(rule => rule.active).map(rule => rule.id));
  assert.ok(knowledge.triggers.length >= 19);
  for (const trigger of knowledge.triggers) {
    assert.ok(active.has(trigger.ruleId), `inactive or unknown rule: ${trigger.ruleId}`);
    assert.ok(knowledge.lessons.some(lesson => lesson.status === 'PROVEN' && lesson.preventionRule === trigger.ruleId), `no PROVEN lesson: ${trigger.ruleId}`);
    assert.ok(trigger.systems.length > 0 && trigger.actions.length > 0, trigger.ruleId);
  }
  assert.equal(new Set(knowledge.triggers.map(trigger => trigger.ruleId)).size, knowledge.triggers.length, 'duplicate trigger');
});

test('a planned action that fits a lesson is blocked until the rule is acknowledged', () => {
  const action = 'Apply a Supabase migration directly in production';
  const blocked = matchPlannedAction({ action, ...knowledge });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.unacknowledged.some(item => item.ruleId === 'MIGRATION_AND_LOCK_IN_SAME_CHANGE_WITH_PROVIDER_READBACK'));
  assert.ok(blocked.unacknowledged.every(item => item.fix.length > 20 && item.rootCause.length > 20));
  const passed = matchPlannedAction({ action, ...knowledge, acknowledged: blocked.unacknowledged.map(item => item.ruleId) });
  assert.equal(passed.ok, true);
});

test('known failure plans are caught across systems', () => {
  const cases = [
    ['Retry Buffer post after 429', 'RESPECT_RETRY_AFTER_NO_FALLBACK_PUBLISHING_ROUTE'],
    ['Publiceer op LinkedIn via Composio, status ACTIVE', 'COMPOSIO_ACTIVE_STATUS_NOT_PROOF_READBACK_BEFORE_PUBLISH'],
    ['Windsor sync ophalen en status ok melden', 'OK_WITH_FALLBACK_IS_NOT_A_FRESH_MEASUREMENT'],
    ['Tavily search run, 432 als leeg wegschrijven', 'PROVIDER_ERROR_NEVER_WRITTEN_AS_EMPTY_RESULT'],
    ['DataForSEO task 40101 als fout behandelen', 'DATAFORSEO_ONLY_40101_40102_ARE_EMPTY'],
    ['LinkedIn post gemist, opnieuw publiceren', 'CHECK_EXTERNAL_EFFECT_BEFORE_REPUBLISH'],
  ];
  for (const [action, ruleId] of cases) {
    assert.ok(matchPlannedAction({ action, ...knowledge }).matches.some(item => item.ruleId === ruleId), `${action} -> ${ruleId}`);
  }
});

test('an unrelated action passes and an unknown acknowledgement is rejected', () => {
  assert.equal(matchPlannedAction({ action: 'Fix a typo in the README', ...knowledge }).ok, true);
  assert.throws(() => matchPlannedAction({ action: 'anything', ...knowledge, acknowledged: ['NOT_A_RULE'] }), /not an active prevention rule/);
  assert.throws(() => matchPlannedAction({ action: '  ', ...knowledge }), /required/);
});

test('the command line exits 1 when blocked and 0 once acknowledged', () => {
  const action = 'Apply a Supabase migration directly in production';
  const blocked = spawnSync(process.execPath, [guardPath, '--action', action], { encoding: 'utf8' });
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /BLOCKED/);
  const ruleIds = JSON.parse(blocked.stdout).unacknowledged.map(item => item.ruleId).join(',');
  const passed = spawnSync(process.execPath, [guardPath, '--action', action, '--ack', ruleIds], { encoding: 'utf8' });
  assert.equal(passed.status, 0);
});

// PR #5490 lessons are part of the SAME action guard as the PR #5493 lessons.
test('all 15 GitHub error rules have live planned-action triggers', () => {
  const githubRuleIds = [
    'GITHUB_WORKFLOW_WRITE_NEEDS_CONTENTS_AND_WORKFLOWS_PERMISSION',
    'NEVER_PASTE_OR_REPEAT_TOKENS_IN_CHAT',
    'NEVER_SWALLOW_AUTH_ERRORS_AND_ALERT_BEFORE_TOKEN_EXPIRY',
    'READ_VIA_RAW_VERIFY_VIA_AUTHENTICATED_CONTENTS_API',
    'UPDATE_BRANCH_AND_WAIT_FOR_CHECK_BEFORE_MERGE_RETRY',
    'VERIFY_AUTO_MERGE_ENABLED_BEFORE_RELYING_ON_IT',
    'USE_GIT_DATA_API_OR_MULTI_FILE_COMMIT_ON_CONTENDED_REPO',
    'USE_FLAT_BRANCH_NAMES_AFTER_CHECKING_EXISTING_REFS',
    'CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES',
    'QUERY_CHECK_RUNS_BY_FULL_HEAD_SHA',
    'RETRIGGER_REQUIRED_CHECK_AFTER_PR_BODY_CHANGE',
    'REGISTER_NEW_TESTS_AND_PATHS_IN_LANE_CONFIG',
    'USE_EXACT_GIT_BRANCH_NAME_FOR_SUPABASE_PREVIEW',
    'NO_PR_OR_CHECK_CLAIMS_WITHOUT_AUTHENTICATED_READ',
    'INSTALL_CHROMIUM_ONLY_VIA_SHARED_CI_SCRIPT'
  ];
  const ids = new Set(knowledge.triggers.map(trigger => trigger.ruleId));
  assert.ok(knowledge.triggers.length >= 34, 'at least the 19 original and 15 GitHub triggers must stay');
  for (const id of githubRuleIds) assert.ok(ids.has(id), 'trigger missing for ' + id);
});

test('canonical delivery preflight blocks unsafe planned work before change', async () => {
  const plannedAction = 'GitHub merge pull request branch behind main';
  await assert.rejects(loadDeliveryPreflight({ component: 'shared', plannedAction }), /PLANNED_ACTION_PREVENTION_REQUIRED/);
  const blocked = matchPlannedAction({ action: plannedAction, ...knowledge });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.matches.some(item => item.ruleId === 'UPDATE_BRANCH_AND_WAIT_FOR_CHECK_BEFORE_MERGE_RETRY'));
  const result = await loadDeliveryPreflight({
    component: 'shared',
    plannedAction,
    acknowledgedPreventionRules: blocked.unacknowledged.map(item => item.ruleId),
  });
  assert.equal(result.plannedActionGuard?.ok, true);
  assert.equal(result.plannedActionGuard?.matches.length, blocked.matches.length);
});
