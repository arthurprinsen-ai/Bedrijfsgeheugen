import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

// Real public PR titles, independently traceable by number. These are action-intent
// proxies, NOT captured preflight --action telemetry, and NOT operational recall.
// Per-case nonapplicability was assessed from the rule's specific root cause.
const HISTORICAL_HARD_NEGATIVES = [
  { pr: 5509, action: 'fix(blog): repair Supabase Markdown at source and approved export', notRule: 'NEVER_SET_APPROVED_AT_DIRECTLY_USE_PUBLICATION_STATE_FUNCTION' },
  { pr: 5508, action: 'feat(preflight): planned-action guard reads chat lessons, 19 more rules can block', notRule: 'NO_PR_OR_CHECK_CLAIMS_WITHOUT_AUTHENTICATED_READ' },
  { pr: 5508, action: 'feat(preflight): planned-action guard reads chat lessons, 19 more rules can block', notRule: 'REQUIRE_ACTIVE_RULE_FOR_REQUIRED_CHAT_LESSON' },
  { pr: 5498, action: 'fix(mira): let original producer atomically claim virgin WAITING_ASSET', notRule: 'NO_PR_OR_CHECK_CLAIMS_WITHOUT_AUTHENTICATED_READ' },
  { pr: 5496, action: 'fix(brain): enforce 34 system and GitHub lessons in canonical action preflight', notRule: 'USE_FLAT_BRANCH_NAMES_AFTER_CHECKING_EXISTING_REFS' },
  { pr: 5490, action: 'GitHub-, CI- en tokenfouten als PROVEN lessen in de delivery-preflight', notRule: 'GITHUB_WORKFLOW_WRITE_NEEDS_CONTENTS_AND_WORKFLOWS_PERMISSION' },
  { pr: 5490, action: 'GitHub-, CI- en tokenfouten als PROVEN lessen in de delivery-preflight', notRule: 'NEVER_PASTE_OR_REPEAT_TOKENS_IN_CHAT' },
  { pr: 5501, action: 'fix(linkedin): independent public readback via original publisher on scope-limited GET', notRule: 'COMPOSIO_ACTIVE_STATUS_NOT_PROOF_READBACK_BEFORE_PUBLISH' },
];

// Concrete risky actions must continue to invoke the original guard and fail
// closed until acknowledged; this test does not equate acknowledgement with proof.
const RISKY_ACTIONS = [
  ['Set approved_at directly in Supabase table', 'NEVER_SET_APPROVED_AT_DIRECTLY_USE_PUBLICATION_STATE_FUNCTION'],
  ['Claim GitHub PR status without authenticated read', 'NO_PR_OR_CHECK_CLAIMS_WITHOUT_AUTHENTICATED_READ'],
  ['Add required chat lesson without prevention mapping', 'REQUIRE_ACTIVE_RULE_FOR_REQUIRED_CHAT_LESSON'],
  ['Create a github branch named nested/child resulting in 422', 'USE_FLAT_BRANCH_NAMES_AFTER_CHECKING_EXISTING_REFS'],
  ['Paste token into chat', 'NEVER_PASTE_OR_REPEAT_TOKENS_IN_CHAT'],
  ['Edit GitHub workflow file without Contents permission', 'GITHUB_WORKFLOW_WRITE_NEEDS_CONTENTS_AND_WORKFLOWS_PERMISSION'],
  ['Publiceer op LinkedIn via Composio, status ACTIVE', 'COMPOSIO_ACTIVE_STATUS_NOT_PROOF_READBACK_BEFORE_PUBLISH'],
];

const knowledge = await loadGuardKnowledge();

test('public historical PR intent must not summon unrelated prevention rules', () => {
  for (const sample of HISTORICAL_HARD_NEGATIVES) {
    const found = matchPlannedAction({ action: sample.action, ...knowledge });
    assert.ok(
      !found.matches.some(m => m.ruleId === sample.notRule),
      `PR #${sample.pr} falsely invokes ${sample.notRule}`,
    );
  }
});

test('targeted high-risk planned actions still fail closed under the same guard', () => {
  for (const [action, ruleId] of RISKY_ACTIONS) {
    const before = matchPlannedAction({ action, ...knowledge });
    assert.equal(before.ok, false, `unsafe action passed: ${ruleId}`);
    assert.ok(before.unacknowledged.some(m => m.ruleId === ruleId), `missing guard: ${ruleId}`);
    const after = matchPlannedAction({ action, ...knowledge, acknowledged: before.unacknowledged.map(m => m.ruleId) });
    assert.equal(after.ok, true);
  }
});

test('the evaluation remains explicitly a narrow historical proxy, not recall', () => {
  assert.equal(HISTORICAL_HARD_NEGATIVES.length, 8);
  assert.equal(RISKY_ACTIONS.length, 7);
  assert.ok(new Set(HISTORICAL_HARD_NEGATIVES.map(x => x.pr)).size >= 6);
});
