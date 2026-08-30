import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED = new Map([
  ['SHARED_SHELL_READY_BEFORE_DOMCONTENTLOADED','REQUIRE_SHARED_SHELL_BEFORE_DOMCONTENTLOADED'],
  ['SOURCE_CRAWLERS_MATERIALIZE_CANONICAL_SHELL','MATERIALIZE_CANONICAL_SHELL_BEFORE_SOURCE_SCAN'],
  ['REGRESSION_ASSERTIONS_FOLLOW_CANONICAL_OWNER','ASSERT_CANONICAL_OWNER_NOT_DUPLICATE_IMPLEMENTATION'],
  ['RESTORED_ROUTE_CLUSTER_HAS_NO_ORPHANS','REQUIRE_CONTEXT_LINK_FOR_RESTORED_ROUTES'],
  ['METADATA_ONLY_CHANGES_MUST_NOT_CREATE_NOOP_COMMITS','FORBID_NOOP_SOURCE_COMMITS_FOR_METADATA'],
  ['ACCEPTED_CONTENT_AND_MODERN_TECHNICAL_SHELL_STAY_SEPARATE','PRESERVE_ACCEPTED_CONTENT_WITH_MODERN_SHELL'],
  ['RELEASE_EVIDENCE_STAYS_ON_ONE_EXACT_SHA','REQUIRE_ONE_EXACT_SHA_FOR_RELEASE_GATES'],
  ['STABLE_CANDIDATE_RUNS_INDEPENDENT_GATES_IN_PARALLEL','PARALLELIZE_INDEPENDENT_GATES_AFTER_STABILIZATION'],
]);

test('website restoration failures from the chat are durable Brain lessons with active prevention', async () => {
  const [shard, rules, contract, agents, ledger] = await Promise.all([
    readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8').then(JSON.parse),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
    readFile('config/brain-chat-learning-contract.json', 'utf8').then(JSON.parse),
    readFile('AGENTS.md', 'utf8'),
    readFile('docs/development-ledger-events/2026-08-30-website-restoration-chat-learning.md', 'utf8'),
  ]);
  const lessons = new Map((shard.lessons || []).map((lesson) => [lesson.id, lesson]));
  const activeRules = new Set((rules.rules || []).filter((rule) => rule.active).map((rule) => rule.id));
  const fingerprints = new Set(contract.mandatory_shared_memory_fingerprints || []);

  for (const [lessonId, ruleId] of REQUIRED) {
    const lesson = lessons.get(lessonId);
    assert.ok(lesson, `missing website restoration lesson ${lessonId}`);
    assert.equal(lesson.preventionRule, ruleId, `${lessonId} must map to ${ruleId}`);
    for (const field of ['fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${lessonId}.${field} must be a string`);
      assert.ok(lesson[field].trim(), `${lessonId}.${field} must not be empty`);
    }
    assert.ok(activeRules.has(ruleId), `inactive/missing prevention rule ${ruleId}`);
    assert.ok(fingerprints.has(lesson.fingerprint), `Brain contract does not require fingerprint ${lesson.fingerprint}`);
  }

  assert.match(agents, /metadata[^\n]{0,120}no-?op|no-?op[^\n]{0,120}metadata/i);
  assert.match(agents, /canonical[^\n]{0,160}owner|owner[^\n]{0,160}canonical/i);
  assert.match(ledger, /DOMContentLoaded/);
  assert.match(ledger, /no-op commit/i);
  assert.match(ledger, /orphan/i);
  assert.match(ledger, /exact SHA/i);
});
