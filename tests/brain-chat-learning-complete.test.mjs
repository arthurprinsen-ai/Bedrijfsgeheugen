import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

const requiredLessonIds = [
  'MAKE_DATASTORE_READ_LIST_NOT_SINGLE_KEY_GET',
  'READBACK_AFTER_AMBIGUOUS_MUTATION_ERROR',
  'EXPLICIT_OUTCOME_STATUS_OUTRANKS_TASK_KEYWORDS',
  'NO_ACTION_AND_CANARIES_MUST_NOT_POLLUTE_TEAM_MEMORY',
  'NEW_LEARNING_REFRESHES_SHARED_CONTEXT_EVENT_DRIVEN',
  'RECENT_TEAM_CONTEXT_NEVER_SUBSTITUTES_EXPLICIT_EVIDENCE',
  'GUARDIAN_VALIDATES_SEMANTIC_CONTRACTS_NOT_LINEAR_BLUEPRINT_ORDER',
  'GUARDIAN_COVERAGE_FOLLOWS_REGISTERED_TEAM_AND_CONTROL_PLANE',
  'LEARNING_DEDUP_PRECEDES_WRITE_AND_REFRESH',
  'MAKE_CAPACITY_LIMIT_IS_HARD_BOUNDARY',
  'ACTIVE_ERROR_VS_RETIRED_OR_HISTORICAL_ERROR',
  'STRUCTURAL_READINESS_IS_NOT_OPERATIONAL_PARITY',
  'EXTERNAL_PLATFORM_CONTROLS_REQUIRE_DIRECT_OBSERVATION',
  'ONE_SHARED_CONTEXT_BEFORE_SPECIALIST_WORK',
  'KEEP_ONE_TRUTH_AND_NO_SECOND_MEMORY',
  'NO_DIRECT_EXTERNAL_EXECUTION_FROM_AGENT_FABRIC',
  'MAKE_SCENARIO_SUCCESS_REQUIRES_MODULE_OUTCOME_EVIDENCE',
  'NOTION_ARRAY_IDS_MUST_BE_NORMALIZED_BEFORE_NATIVE_APIS',
  'LEGACY_BUFFER_IDS_REQUIRE_DETERMINISTIC_NATIVE_BACKFILL',
  'SOCIAL_PUBLISH_CREATE_VERIFY_COMMIT',
  'SINGLE_CANONICAL_PUBLISHER_PER_CHANNEL',
  'INSTAGRAM_INSIGHTS_WRAPPER_REQUIRES_RUNTIME_METRIC_PROOF',
  'NEVER_TDD_DIRECTLY_ON_MAIN',
  'SQL_SEMANTIC_TESTS_IGNORE_COMMENTS',
  'PERFORMANCE_INFO_REQUIRES_WORKLOAD_EVIDENCE',
  'SUPABASE_LEAST_PRIVILEGE_REVOKE_ALL_BEFORE_GRANT',
  'EVIDENCE_WRITES_FOLLOW_LIVE_SCHEMA_CONTRACT',
  'SCHEDULER_AUTONOMY_REQUIRES_OBSERVED_RUN',
  'NO_NOOP_MIGRATION_FOR_TRIGGER_PROOF',
  'EXACT_SHA_EVENT_FINGERPRINTS_FOR_REPLAYS',
  'NEW_RUNTIME_TOOL_PATH_REQUIRES_DELIVERY_CLASSIFICATION',
];

const requiredPreventionRules = [
  'NEVER_DEVELOP_OR_TDD_DIRECTLY_ON_MAIN',
  'STRIP_SQL_COMMENTS_BEFORE_SEMANTIC_ASSERTIONS',
  'DO_NOT_AUTO_FIX_PERFORMANCE_INFO',
  'REVOKE_ALL_BEFORE_LEAST_PRIVILEGE_GRANT',
  'READ_LIVE_SCHEMA_BEFORE_EVIDENCE_WRITE',
  'REQUIRE_OBSERVED_SCHEDULER_RUN_BEFORE_AUTONOMY_CLAIM',
  'NO_NOOP_MIGRATION_FOR_TRIGGER_PROOF',
  'USE_EXACT_SHA_EVENT_FINGERPRINTS',
  'CLASSIFY_NEW_RUNTIME_TOOL_PATHS',
];

test('current chat learning is indexed and machine-readable before material agent work', async () => {
  const [contract, executionShard, rules, agents] = await Promise.all([
    readFile('config/brain-chat-learning-contract.json', 'utf8').then(JSON.parse),
    readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8').then(JSON.parse),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
    readFile('AGENTS.md', 'utf8'),
  ]);

  assert.equal(contract.version, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(contract.preflightRequired, true);
  assert.equal(contract.newAgentsMustReadBeforeExecution, true);
  assert.equal(executionShard.version, contract.version);
  assert.equal(executionShard.appendOnly, true);
  assert.ok(Array.isArray(contract.canonicalSources));
  for (const source of [
    'docs/learning/chat-learning-checkpoint-2026-08-30.md',
    'docs/powerhouse-chat-learning-checkpoint-2026-08-30.md',
    'docs/brain/delivery-failure-lessons.json',
    'config/delivery-prevention-rules.json',
    'brain/learning/chat-continuity-2026-08-30.json',
  ]) assert.ok(contract.canonicalSources.includes(source), `missing canonical source ${source}`);

  const allLessons = [...contract.lessons, ...executionShard.lessons];
  const byId = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
  for (const id of requiredLessonIds) {
    const lesson = byId.get(id);
    assert.ok(lesson, `missing reusable lesson ${id}`);
    for (const field of ['fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${id}.${field} must be a string`);
      assert.ok(lesson[field].trim(), `${id}.${field} must not be empty`);
    }
  }

  const activeRules = new Set(rules.rules.filter((rule) => rule.active === true).map((rule) => rule.id));
  for (const id of requiredPreventionRules) assert.ok(activeRules.has(id), `missing active prevention rule ${id}`);

  assert.match(agents, /config\/brain-chat-learning-contract\.json/);
  assert.match(agents, /BRAIN-CHAT-LEARNING-v1/);
  assert.match(agents, /fingerprint[^\n]{0,180}(vóór|voor|before)[^\n]{0,180}(uitvoering|execution)/i);
  assert.match(agents, /(bekende|known)[^\n]{0,180}(mislukte|failed)[^\n]{0,180}(nieuwe evidence|new evidence)/i);
});

test('delivery preflight loads every canonical chat lesson and blocks missing prevention', async () => {
  const [contract, executionShard, preflightSource] = await Promise.all([
    readFile('config/brain-chat-learning-contract.json', 'utf8').then(JSON.parse),
    readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8').then(JSON.parse),
    readFile('tools/delivery-preflight.mjs', 'utf8'),
  ]);
  assert.match(preflightSource, /brain-chat-learning-contract\.json/);
  assert.match(preflightSource, /current-execution-lessons-2026-08-30\.json/);

  const decision = await loadDeliveryPreflight({ component: 'shared' });
  assert.equal(decision.ok, true);
  const reused = new Set(decision.reusedLessons);
  for (const lesson of [...contract.lessons, ...executionShard.lessons]) {
    assert.ok(reused.has(lesson.fingerprint), `delivery preflight did not reuse ${lesson.id}`);
  }
});
