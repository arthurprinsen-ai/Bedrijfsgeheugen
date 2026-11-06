import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

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
