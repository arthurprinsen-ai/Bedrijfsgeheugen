import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

const knowledge = await loadGuardKnowledge();
const CASES = [
  {
    "rule": "RECOVER_DUE_SOCIAL_ZERO_CANDIDATES_FROM_RELEASE_STATE",
    "positive": "Recover social posts: zero candidates expected today on LinkedIn"
  },
  {
    "rule": "REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN",
    "positive": "Netlify production readback, then mark green"
  },
  {
    "rule": "RECONCILE_MAIN_TO_EXACT_PRODUCTION_SHA",
    "positive": "Reconcile main to the production sha on Netlify"
  },
  {
    "rule": "CLASSIFY_PRIVATE_AUTH_BEFORE_PUBLIC_SEO_SCANS",
    "positive": "Run an SEO scan on the portal login pages"
  },
  {
    "rule": "RECONCILE_CLOSED_FORCE_PUSHED_PR_AGAINST_CURRENT_MAIN",
    "positive": "Reopen closed PR #1592 after a force push"
  },
  {
    "rule": "REQUIRE_PERSISTENT_EVIDENCE_BEFORE_GREEN",
    "positive": "Write evidence and mark green"
  },
  {
    "rule": "REVERIFY_PR_IDENTITY_AFTER_READY_RECREATION",
    "positive": "Recreate the pull request as ready for review on the same head"
  },
  {
    "rule": "CLASSIFY_AND_EXECUTE_CHANGED_TEST_PATHS",
    "positive": "Change test selection so the lane executes changed test paths"
  },
  {
    "rule": "NETLIFY_DEPLOY_AUTHORITY_MUST_BE_VISIBLE",
    "positive": "Netlify deploy authority is not visible"
  },
  {
    "rule": "REFRESH_MAIN_IMMEDIATELY_BEFORE_PRODUCTION_PERSISTENCE",
    "positive": "Persist production state after reading current main"
  },
  {
    "rule": "REPREPARE_I18N_PATCH_FROM_FINAL_PUBLIC_TEXT_AFTER_ANY_TEXT_CHANGE",
    "positive": "Edit the blog text and update the i18n patch"
  },
  {
    "rule": "REQUIRE_EXECUTION_PROOF_AFTER_HTTP_ACK",
    "positive": "Treat the webhook 202 accepted as done"
  },
  {
    "rule": "REQUIRE_OUTCOME_EVIDENCE_BEFORE_GREEN",
    "positive": "Close the obligation and report green"
  },
  {
    "rule": "TESTS_ASSERT_OUTCOMES_NOT_LITERAL_COPY",
    "positive": "Write a test that asserts the marketing text"
  },
  {
    "rule": "TREAT_NETLIFY_NEUTRAL_AND_PREVIEW_RACE_AS_NON_BLOCKING_AFTER_PROOF",
    "positive": "Netlify pages changed is neutral, rerun the preview check"
  },
  {
    "rule": "VERIFY_GITHUB_PR_HEAD_EXISTS_BEFORE_CREATE",
    "positive": "Open a pull request for the new branch on GitHub"
  },
  {
    "rule": "SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE",
    "positive": "Add new lessons to delivery-failure-lessons.json"
  }
];
const NEUTRAL_ACTIONS = [
  "Fix typo in README",
  "Update blog post copy for the new report",
  "Add portal page for quarterly reports",
  "Bump a dependency in package.json",
  "Tune CSS spacing on the pricing page",
  "Write release notes for the checkout change",
  "Query Supabase for lead counts",
  "Draft a LinkedIn post about the AI report",
  "Run unit tests locally",
  "Read a file from raw.githubusercontent.com",
  "Improve the process documentation for onboarding"
];
const NEW_RULES = new Set(CASES.map(item => item.rule));

test('every new trigger points at an active rule with a PROVEN lesson', () => {
  const active = new Set(knowledge.rules.filter(rule => rule.active).map(rule => rule.id));
  for (const item of CASES) {
    assert.ok(active.has(item.rule), `inactive or unknown rule: ${item.rule}`);
    assert.ok(knowledge.lessons.some(lesson => lesson.status === 'PROVEN' && lesson.preventionRule === item.rule), `no PROVEN lesson: ${item.rule}`);
    assert.ok(knowledge.triggers.some(trigger => trigger.ruleId === item.rule), `no trigger: ${item.rule}`);
  }
});

test('each new trigger fires on its own planned action and is blocked until acknowledged', () => {
  for (const item of CASES) {
    const result = matchPlannedAction({ action: item.positive, ...knowledge });
    assert.ok(result.matches.some(match => match.ruleId === item.rule), `trigger did not fire: ${item.rule}`);
    assert.equal(result.ok, false);
    const passed = matchPlannedAction({ action: item.positive, ...knowledge, acknowledged: result.unacknowledged.map(match => match.ruleId) });
    assert.equal(passed.ok, true);
  }
});

test('neutral everyday actions do not fire any of the new triggers', () => {
  for (const action of NEUTRAL_ACTIONS) {
    const fired = matchPlannedAction({ action, ...knowledge }).matches.filter(match => NEW_RULES.has(match.ruleId)).map(match => match.ruleId);
    assert.deepEqual(fired, [], `false positive on: ${action}`);
  }
});
