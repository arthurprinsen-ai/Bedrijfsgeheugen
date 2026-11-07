import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

// Real commit titles from this repo that contain the word "advisor" but have nothing to do with
// Supabase advisor findings. A first version of the DO_NOT_AUTO_FIX_PERFORMANCE_INFO trigger used
// the bare word "advisor" and fired on #5212. These stay pinned so that cannot come back.
const RULE = 'DO_NOT_AUTO_FIX_PERFORMANCE_INFO';
const REAL_HARD_NEGATIVES = [
  'feat(portal): bewezen Veiligheidskompas als trusted advisor voor ondernemers (#5316)',
  'feat(trust): Trusted Advisor customer-facing quality guard across original CMS and editorial council',
  'fix(portal): make nested strategic advisor navigation work after rerender (#5212)',
];
const REAL_POSITIVES = [
  'Fix the unindexed foreign key advisor finding by creating an index',
  'Drop the unused index reported by the Supabase advisor',
  'Resolve the performance advisor warning by adding an index',
];

const knowledge = await loadGuardKnowledge();
const fires = (action, triggers = knowledge.triggers) =>
  matchPlannedAction({ action, ...knowledge, triggers }).matches.some(match => match.ruleId === RULE);

test('real "advisor" commit titles unrelated to Supabase do not fire the performance-info rule', () => {
  for (const title of REAL_HARD_NEGATIVES) assert.equal(fires(title), false, `false positive on: ${title}`);
});

test('the rule still fires on genuine Supabase advisor actions', () => {
  for (const action of REAL_POSITIVES) assert.equal(fires(action), true, `missed: ${action}`);
});

test('mutation check: the original bare "advisor" trigger would have caught these titles wrongly', () => {
  const loose = knowledge.triggers.map(trigger => trigger.ruleId === RULE ? { ...trigger, systems: ['advisor'] } : trigger);
  assert.ok(REAL_HARD_NEGATIVES.some(title => fires(title, loose)), 'this test no longer guards against the bare-word trigger');
});
