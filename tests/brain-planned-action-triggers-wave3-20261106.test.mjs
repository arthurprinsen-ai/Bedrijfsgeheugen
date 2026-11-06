import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

const knowledge = await loadGuardKnowledge();
const CASES = [
  {
    "rule": "RECREATE_READY_PR_ON_CONNECTOR_GRAPHQL_FAILURE",
    "positive": "Mark the draft PR ready for review through the connector"
  },
  {
    "rule": "GITHUB_PUBLIC_PROOF_MAKE_STATE_WRITEBACK",
    "positive": "Let the GitHub Action write the state to Notion"
  },
  {
    "rule": "BOUNDED_GITHUB_PUBLIC_PROOF",
    "positive": "Add public proof verification of the page title and canonical"
  },
  {
    "rule": "CO_CHANGE_BEHAVIOR_AND_CONTRACT_TEST",
    "positive": "Change the auth behavior and update the contract test"
  },
  {
    "rule": "REFRESH_BASE_BEFORE_FINAL_GATE",
    "positive": "Rebase on the new merge base before the final gate"
  },
  {
    "rule": "BLOCK_WRITER_CANARY_WHEN_ACTIONS_PR_CREATION_DISABLED",
    "positive": "Writer canary creates a pull request with GITHUB_TOKEN"
  },
  {
    "rule": "EXPLICIT_WRITER_SHADOW_DISPATCH",
    "positive": "Dispatch the writer shadow workflow after PR creation"
  },
  {
    "rule": "BIND_SHADOW_TO_ACTUAL_PR_IDENTITY",
    "positive": "Pass base sha to the shadow verification"
  },
  {
    "rule": "SCOPE_PARITY_TO_VERIFIED_WRITER_PATHS",
    "positive": "Generate the parity git patch for the writer changedFiles"
  },
  {
    "rule": "FRESH_TRIGGER_FROM_CURRENT_MAIN_AFTER_RUNTIME_FIX",
    "positive": "Close the stale trigger PR after the runtime fix"
  },
  {
    "rule": "CAPTURE_TRACKED_AND_UNTRACKED_EVIDENCE",
    "positive": "Validate the writeback with git diff"
  },
  {
    "rule": "FULLY_QUALIFY_DETACHED_HEAD_PUSH_REFSPEC",
    "positive": "Push from detached HEAD in the workflow"
  },
  {
    "rule": "VALIDATE_MAKE_SUBSCENARIO_INPUT_ENVELOPE",
    "positive": "Call runScenarioWithInputs with the subscenario inputs"
  },
  {
    "rule": "FAIL_CLOSED_ON_UNVERIFIED_PLATFORM_CONTROLS",
    "positive": "Certify branch protection from CI success"
  },
  {
    "rule": "ISOLATE_NEGATIVE_TEST_FIXTURES",
    "positive": "Write a negative test for the readiness check"
  },
  {
    "rule": "SINGLE_CANONICAL_WRITER_HANDOFF",
    "positive": "Add a second handoff route from the writer to central gates"
  },
  {
    "rule": "VALIDATE_BG184_BG156_EVENT_ENVELOPE",
    "positive": "Dispatch the BG184 error event"
  },
  {
    "rule": "TREAT_MAKE_ACCOUNT_CONNECT_400_AS_HARD_BOUNDARY",
    "positive": "Make account connect returns 400, reconnect the OAuth"
  },
  {
    "rule": "RESTORE_GENERATED_REPORT_BEFORE_REBASE",
    "positive": "Commit seo-status.json and rebase"
  },
  {
    "rule": "DEDUPE_LEDGER_BY_EVENT_FINGERPRINT_NOT_HARDCODED_PR",
    "positive": "Dedupe the ledger append"
  },
  {
    "rule": "NEVER_DEVELOP_OR_TDD_DIRECTLY_ON_MAIN",
    "positive": "Commit the fix directly on main"
  },
  {
    "rule": "AUTO_REGISTER_FUTURE_COMPONENTS",
    "positive": "Add a new component and register it after launch"
  },
  {
    "rule": "MARK_UNMETERED_USAGE_NOT_ZERO",
    "positive": "Report zero usage when metering is missing"
  },
  {
    "rule": "REQUIRE_AUTHORIZED_CONNECTOR_FOR_REMOTE_WRITES",
    "positive": "Do a remote write using the local git remote"
  },
  {
    "rule": "REQUIRE_ACTIVE_RULE_FOR_REQUIRED_CHAT_LESSON",
    "positive": "Add a required chat lesson without a prevention rule"
  },
  {
    "rule": "BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE",
    "positive": "Promote to production while platform capacity is unavailable"
  },
  {
    "rule": "OPTIMIZE_SOURCE_CALLS_NOT_ONLY_CLIENT_CACHE",
    "positive": "Optimize polling cadence with a client cache"
  },
  {
    "rule": "NEVER_MUTATE_TO_DISCOVER_BRANCH_STATE",
    "positive": "Create a branch to discover whether the branch exists"
  },
  {
    "rule": "CO_CHANGE_CHAT_CHECKPOINT_AND_CONTRACT_TEST",
    "positive": "Change the chat checkpoint and the contract test"
  },
  {
    "rule": "REQUIRE_FULL_READ_TRANSFORM_WRITE_FOR_CONTENTS_API",
    "positive": "Update the file through the contents API with a patch"
  },
  {
    "rule": "SINGLE_FLIGHT_POST_MERGE_CODEQL_PER_REF",
    "positive": "Change the CodeQL concurrency group"
  },
  {
    "rule": "NO_FINAL_HANDOFF_WHILE_AUTHORITATIVE_SECURITY_RUN_ACTIVE",
    "positive": "Final handoff while CodeQL is still running"
  },
  {
    "rule": "RESUME_CANONICAL_DELIVERY_AFTER_CLIENT_TRANSPORT_INTERRUPTION",
    "positive": "Resume the delivery after the chat was interrupted"
  },
  {
    "rule": "START_SITE_CHANGES_AT_NETLIFY_TOML_AND_TOOLS_GENERATORS",
    "positive": "Edit index.html to change the homepage hero"
  },
  {
    "rule": "NEW_OR_HANDMADE_PAGES_CHECK_GENERATOR_VIEW_LISTS_AND_SHELL_EXCLUSIONS",
    "positive": "Create a new page and expect the shared site shell"
  },
  {
    "rule": "MEASURE_GEOMETRY_BEFORE_ADDING_VISIBILITY_GUARDS",
    "positive": "Add a visibility guard because the content column is invisible"
  },
  {
    "rule": "DO_NOT_COPY_SHELL_JSONLD_TO_PAGES",
    "positive": "Apply the shell to the pages including the JSON-LD"
  },
  {
    "rule": "USE_ONLY_DEPENDENCY_FREE_TESTS_IN_LEARNING_EVALUATION",
    "positive": "Add a test to the learning evaluation block"
  },
  {
    "rule": "INCLUDE_DOT_FOLDERS_IN_BULK_FILE_OPERATIONS",
    "positive": "Move pages in bulk with glob"
  },
  {
    "rule": "UPDATE_CANONICAL_KOP_WITH_MENU_CHANGES",
    "positive": "Add a new menu item to the site"
  },
  {
    "rule": "RENDER_EVERY_MARKDOWN_BLOCK_SHAPE_AND_FAIL_CLOSED_ON_MARKUP_LEAK",
    "positive": "Change the markdown renderer for the daily blog"
  }
];
const NEUTRAL_ACTIONS = [
  "Add a new item to the weekly report",
  "Rename a column in the Supabase leads view",
  "Update the pricing copy in the checkout",
  "Review the LinkedIn post queue",
  "Fix a typo in a blog title",
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

test('wave3 adds a trigger for every active rule that has a PROVEN lesson and none yet', () => {
  const covered = new Set(knowledge.triggers.map(trigger => trigger.ruleId));
  const active = new Set(knowledge.rules.filter(rule => rule.active).map(rule => rule.id));
  const uncovered = [...new Set(knowledge.lessons.filter(lesson => lesson.status === 'PROVEN' && active.has(lesson.preventionRule)).map(lesson => lesson.preventionRule))].filter(id => !covered.has(id));
  assert.deepEqual(uncovered, []);
});

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
