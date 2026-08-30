import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// RED trigger: the contract file and mandatory agent preflight do not exist yet on this candidate.
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
];

test('current chat learning is indexed and machine-readable before material agent work', async () => {
  const contract = JSON.parse(await readFile('config/brain-chat-learning-contract.json', 'utf8'));
  const agents = await readFile('AGENTS.md', 'utf8');

  assert.equal(contract.version, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(contract.preflightRequired, true);
  assert.equal(contract.newAgentsMustReadBeforeExecution, true);
  assert.ok(Array.isArray(contract.canonicalSources));
  for (const source of [
    'docs/learning/chat-learning-checkpoint-2026-08-30.md',
    'docs/brain/delivery-failure-lessons.json',
    'config/delivery-prevention-rules.json',
    'brain/learning/chat-continuity-2026-08-30.json',
  ]) assert.ok(contract.canonicalSources.includes(source), `missing canonical source ${source}`);

  const byId = new Map(contract.lessons.map((lesson) => [lesson.id, lesson]));
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
