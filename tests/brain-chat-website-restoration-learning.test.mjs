import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

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

test('website restoration failures from the chat are durable Brain lessons with active prevention and preflight reuse', async () => {
  const [shard, rules, ledger, preflight] = await Promise.all([
    readFile('brain/learning/website-restoration-chat-2026-08-30.json', 'utf8').then(JSON.parse),
    readFile('config/delivery-prevention-rules.json', 'utf8').then(JSON.parse),
    readFile('docs/development-ledger-events/2026-08-30-website-restoration-chat-learning.md', 'utf8'),
    loadDeliveryPreflight({ component: 'website' }),
  ]);
  const lessons = new Map((shard.lessons || []).map((lesson) => [lesson.id, lesson]));
  const activeRules = new Set((rules.rules || []).filter((rule) => rule.active).map((rule) => rule.id));
  const reused = new Set(preflight.reusedLessons || []);

  assert.equal(shard.appendOnly, true);
  assert.equal(preflight.ok, true);
  for (const [lessonId, ruleId] of REQUIRED) {
    const lesson = lessons.get(lessonId);
    assert.ok(lesson, `missing website restoration lesson ${lessonId}`);
    assert.equal(lesson.preventionRule, ruleId, `${lessonId} must map to ${ruleId}`);
    for (const field of ['fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${lessonId}.${field} must be a string`);
      assert.ok(lesson[field].trim(), `${lessonId}.${field} must not be empty`);
    }
    assert.ok(activeRules.has(ruleId), `inactive/missing prevention rule ${ruleId}`);
    assert.ok(reused.has(lesson.fingerprint), `delivery preflight did not reuse ${lessonId}`);
  }

  assert.match(ledger, /DOMContentLoaded/);
  assert.match(ledger, /no-op commit/i);
  assert.match(ledger, /orphan/i);
  assert.match(ledger, /exact SHA/i);
  assert.match(ledger, /canonical owner/i);
});
