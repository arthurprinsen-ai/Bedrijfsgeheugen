import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredLessonIds = [
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

test('all material lessons from the current Powerhouse execution chat are reusable before execution', async () => {
  const contract = JSON.parse(await readFile('config/brain-chat-learning-contract.json', 'utf8'));
  const prevention = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));
  const agents = await readFile('AGENTS.md', 'utf8');

  const byId = new Map(contract.lessons.map((lesson) => [lesson.id, lesson]));
  for (const id of requiredLessonIds) {
    const lesson = byId.get(id);
    assert.ok(lesson, `missing current-chat reusable lesson ${id}`);
    for (const field of ['fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${id}.${field} must be a string`);
      assert.ok(lesson[field].trim(), `${id}.${field} must not be empty`);
    }
  }

  const activeRules = new Set(prevention.rules.filter((rule) => rule.active).map((rule) => rule.id));
  for (const id of requiredPreventionRules) assert.ok(activeRules.has(id), `missing active prevention rule ${id}`);

  assert.match(agents, /BRAIN-CHAT-LEARNING-v1/);
  assert.match(agents, /fingerprint[^\n]{0,180}(vóór|voor|before)[^\n]{0,180}(uitvoering|execution)/i);
});
