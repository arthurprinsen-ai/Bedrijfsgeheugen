import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
  'PLAINTEXT_SECRETS_REQUIRE_MANAGED_CONNECTIONS',
  'MAKE_CONFIG_ERRORS_SKIP_RESTART',
  'NOTION_EMPTY_SEARCH_BUNDLE_REQUIRES_ID_GATE',
  'NOTION_LONG_RICH_TEXT_REQUIRES_CHUNKED_READBACK',
  'MAKE_RATE_LIMIT_REQUIRES_COOLDOWN_AND_READBACK',
  'BOUNDED_CANARY_NO_MANUAL_RUN_STORM',
  'AI_CONTEXT_MUST_BE_PROJECTED_BEFORE_MODEL',
  'DETERMINISTIC_REDUCER_BEFORE_AI',
  'WATCHER_LOOKBACK_COVERS_SCHEDULE_INTERVAL',
  'APPROVED_COPY_IMMUTABLE_NO_GENERATIVE_REWRITE',
  'EXPENSIVE_MEDIA_TRANSPORT_BEFORE_GENERATION',
  'NOTION_QUERY_USAGE_LIMIT_USES_TARGETED_READ_FALLBACK',
  'BLOCKED_COMPONENT_REQUIRES_EXACT_RESUME_CONTRACT',
];

test('current chat learning is indexed and machine-readable before material agent work', async () => {
  const contract = JSON.parse(await readFile('config/brain-chat-learning-contract.json', 'utf8'));
  const continuity = JSON.parse(await readFile('brain/learning/chat-continuity-2026-08-30.json', 'utf8'));
  const agents = await readFile('AGENTS.md', 'utf8');

  assert.equal(contract.version, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(contract.preflightRequired, true);
  assert.equal(contract.newAgentsMustReadBeforeExecution, true);
  assert.ok(Array.isArray(contract.canonicalSources));
  for (const source of [
    'docs/learning/chat-learning-checkpoint-2026-08-30.md',
    'docs/powerhouse-chat-learning-checkpoint-2026-08-30.md',
    'docs/brain/delivery-failure-lessons.json',
    'config/delivery-prevention-rules.json',
    'brain/learning/chat-continuity-2026-08-30.json',
  ]) assert.ok(contract.canonicalSources.includes(source), `missing canonical source ${source}`);

  const lessons = [
    ...(Array.isArray(contract.lessons) ? contract.lessons : []),
    ...(Array.isArray(continuity.powerhouse_lessons) ? continuity.powerhouse_lessons : []),
  ];
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  for (const id of requiredLessonIds) {
    const lesson = byId.get(id);
    assert.ok(lesson, `missing reusable lesson ${id}`);
    for (const field of ['fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${id}.${field} must be a string`);
      assert.ok(lesson[field].trim(), `${id}.${field} must not be empty`);
    }
  }

  assert.match(agents, /config\/brain-chat-learning-contract\.json/);
  assert.match(agents, /BRAIN-CHAT-LEARNING-v1/);
  assert.match(agents, /fingerprint[^\n]{0,180}(vóór|voor|before)[^\n]{0,180}(uitvoering|execution)/i);
  assert.match(agents, /(bekende|known)[^\n]{0,180}(mislukte|failed)[^\n]{0,180}(nieuwe evidence|new evidence)/i);
});
