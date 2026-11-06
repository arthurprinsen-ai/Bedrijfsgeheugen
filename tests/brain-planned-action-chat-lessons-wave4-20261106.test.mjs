import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

// Wave 4: 19 active rules have their PROVEN lesson in a chat-learning shard, not in
// docs/brain/delivery-failure-lessons.json. The guard now reads both, so these rules can block.
const knowledge = await loadGuardKnowledge();
const CASES = [
  {
    "rule": "POST_PUSH_CI_IS_DETECTION_NOT_PREVENTION",
    "positive": "Push the change directly to main without a branch"
  },
  {
    "rule": "STRIP_SQL_COMMENTS_BEFORE_SEMANTIC_ASSERTIONS",
    "positive": "Add a regex assertion to the SQL regression test for auth.uid()"
  },
  {
    "rule": "DO_NOT_AUTO_FIX_PERFORMANCE_INFO",
    "positive": "Fix the unindexed foreign key advisor finding by creating an index"
  },
  {
    "rule": "REVOKE_ALL_BEFORE_LEAST_PRIVILEGE_GRANT",
    "positive": "Revoke update and delete on the append-only table for service_role"
  },
  {
    "rule": "READ_LIVE_SCHEMA_BEFORE_EVIDENCE_WRITE",
    "positive": "Insert evidence rows into the evidence table"
  },
  {
    "rule": "REQUIRE_OBSERVED_SCHEDULER_RUN_BEFORE_AUTONOMY_CLAIM",
    "positive": "Claim the cron job is autonomous and mark it live"
  },
  {
    "rule": "NO_NOOP_MIGRATION_FOR_TRIGGER_PROOF",
    "positive": "Create a no-op migration to prove the event trigger"
  },
  {
    "rule": "USE_EXACT_SHA_EVENT_FINGERPRINTS",
    "positive": "Replay the push event and dedupe it by event fingerprint"
  },
  {
    "rule": "CLASSIFY_NEW_RUNTIME_TOOL_PATHS",
    "positive": "Add a new tool path under tools/ and classify it to a delivery lane"
  },
  {
    "rule": "NETLIFY_DEPLOY_INSTRUCTION_IS_NOT_EXECUTION",
    "positive": "Trigger a deploy to production on Netlify"
  },
  {
    "rule": "RUNTIME_DNS_FAILURE_IS_INFRA_BOUNDARY",
    "positive": "Retry after the DNS failure could not resolve github.com"
  },
  {
    "rule": "PRODUCTION_PARITY_MISMATCH_REQUIRES_RECOVERY",
    "positive": "Netlify production runs an older commit than main, parity mismatch"
  },
  {
    "rule": "DISCOVER_CONNECTOR_CAPABILITY_BEFORE_UNAVAILABLE_CLAIM",
    "positive": "Tell the user the OpenArt connector is not available"
  },
  {
    "rule": "REQUIRE_CANDIDATE_BRANCH_FOR_MANUAL_REPO_WRITES",
    "positive": "Do a manual repo write with the connector write tool"
  },
  {
    "rule": "USE_GITHUB_SEARCH_ACTION_FOR_CODE_SEARCH",
    "positive": "Fetch the GitHub REST search/code URL for a code search"
  },
  {
    "rule": "USE_GITHUB_READY_FOR_REVIEW_ACTION",
    "positive": "Call update_pull_request with draft=false to mark the draft PR ready"
  },
  {
    "rule": "SCOPE_EXPENSIVE_WORKFLOWS_TO_OWNED_PATHS",
    "positive": "Change the workflow paths: filter so the trigger is scoped"
  },
  {
    "rule": "PRESERVE_EXECUTABLE_KNOWN_FIX_IN_CONTEXT",
    "positive": "Shorten the shared context to a compact pointer"
  },
  {
    "rule": "LEARNING_WRITEBACK_FAIL_OPEN_TO_PRIMARY_WORK",
    "positive": "Fail the run when the learning writeback is rate limited"
  }
];
const NEW_RULES = new Set(CASES.map(item => item.rule));
const NEUTRAL_ACTIONS = [
  'Query Supabase for lead counts',
  'Draft a LinkedIn post about the AI report',
  'Run unit tests locally',
  'Read a file from raw.githubusercontent.com',
  'Improve the process documentation for onboarding',
  'Update the pricing page copy',
  'Summarize the weekly report for the team',
  'Rename a column header in the spreadsheet'
];

test('each of the 19 rules is active, has a chat lesson with root cause and fix, and has a trigger', () => {
  const active = new Set(knowledge.rules.filter(rule => rule.active).map(rule => rule.id));
  for (const item of CASES) {
    assert.ok(active.has(item.rule), `inactive or unknown rule: ${item.rule}`);
    const lesson = knowledge.lessons.find(entry => entry.status === 'PROVEN' && entry.preventionRule === item.rule);
    assert.ok(lesson, `no PROVEN lesson visible to the guard: ${item.rule}`);
    assert.ok(lesson.rootCause && lesson.fix && lesson.fingerprint, `incomplete lesson: ${item.rule}`);
    assert.ok(knowledge.triggers.some(trigger => trigger.ruleId === item.rule), `no trigger: ${item.rule}`);
  }
});

test('each trigger fires through the real guard and is blocked until acknowledged', () => {
  for (const item of CASES) {
    const result = matchPlannedAction({ action: item.positive, ...knowledge });
    assert.ok(result.matches.some(match => match.ruleId === item.rule), `trigger did not fire: ${item.rule}`);
    assert.equal(result.ok, false);
    const passed = matchPlannedAction({ action: item.positive, ...knowledge, acknowledged: result.unacknowledged.map(match => match.ruleId) });
    assert.equal(passed.ok, true);
  }
});

test('the canonical preflight blocks the same planned actions and passes once they are acknowledged', async () => {
  for (const item of CASES.slice(0, 5)) {
    await assert.rejects(() => loadDeliveryPreflight({ plannedAction: item.positive }), new RegExp('PLANNED_ACTION_PREVENTION_REQUIRED.*' + item.rule));
    const acknowledged = matchPlannedAction({ action: item.positive, ...knowledge }).unacknowledged.map(match => match.ruleId);
    const decision = await loadDeliveryPreflight({ plannedAction: item.positive, acknowledgedPreventionRules: acknowledged });
    assert.equal(decision.plannedActionGuard.ok, true);
  }
});

test('a rule that already has a delivery lesson keeps that lesson, chat lessons never override it', () => {
  const delivery = knowledge.lessons.filter(lesson => lesson.source !== 'chat-learning' && lesson.status === 'PROVEN' && lesson.preventionRule);
  assert.ok(delivery.length > 0);
  for (const lesson of delivery.slice(0, 20)) {
    const first = knowledge.lessons.find(entry => entry.status === 'PROVEN' && entry.preventionRule === lesson.preventionRule);
    assert.equal(first.fingerprint, lesson.fingerprint);
  }
});

test('neutral everyday actions do not fire any of the 19 new triggers', () => {
  for (const action of NEUTRAL_ACTIONS) {
    const fired = matchPlannedAction({ action, ...knowledge }).matches.filter(match => NEW_RULES.has(match.ruleId)).map(match => match.ruleId);
    assert.deepEqual(fired, [], `false positive on: ${action}`);
  }
});
