import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deliveryRequired = new Map([
  ['delivery-failure|verification|shared|http-ack-without-execution-proof','REQUIRE_EXECUTION_PROOF_AFTER_HTTP_ACK'],
  ['delivery-failure|capacity|automation|make-quota-paused-production-handoff','BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE'],
  ['delivery-failure|cost|automation|client-cache-without-source-call-reduction','OPTIMIZE_SOURCE_CALLS_NOT_ONLY_CLIENT_CACHE'],
  ['delivery-failure|governance|shared|write-used-as-branch-existence-probe','NEVER_MUTATE_TO_DISCOVER_BRANCH_STATE'],
  ['delivery-failure|governance|shared|chat-checkpoint-test-landed-without-checkpoint','CO_CHANGE_CHAT_CHECKPOINT_AND_CONTRACT_TEST']
]);

const runtimeRequired = new Map([
  ['knowledge-preflight-context-compression-v1','PRESERVE_EXECUTABLE_KNOWN_FIX_IN_CONTEXT'],
  ['learning-router|bg168|central-fail-open|2026-08-30-v1','LEARNING_WRITEBACK_FAIL_OPEN_TO_PRIMARY_WORK']
]);

test('all validated chat-learning continuity and context-safety lessons survive current-main consolidation', async () => {
  const [deliveryRaw, runtimeRaw, rulesRaw, addendumRaw] = await Promise.all([
    readFile('docs/brain/delivery-failure-lessons.json','utf8'),
    readFile('brain/learning/current-execution-lessons-2026-08-30.json','utf8'),
    readFile('config/delivery-prevention-rules.json','utf8'),
    readFile('brain/learning/chat-completeness-addendum-2026-08-30.json','utf8')
  ]);
  const delivery = JSON.parse(deliveryRaw).lessons;
  const runtime = JSON.parse(runtimeRaw).lessons;
  const rules = JSON.parse(rulesRaw).rules;
  const active = new Set(rules.filter(rule => rule.active === true).map(rule => rule.id));

  for (const [fingerprint, preventionRule] of deliveryRequired) {
    const lesson = delivery.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `missing delivery learning ${fingerprint}`);
    assert.equal(lesson.status, 'PROVEN');
    assert.equal(lesson.preventionRule, preventionRule);
    assert.ok(active.has(preventionRule), `missing active prevention ${preventionRule}`);
  }

  for (const [fingerprint, preventionRule] of runtimeRequired) {
    const lesson = runtime.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `missing runtime learning ${fingerprint}`);
    assert.equal(lesson.preventionRule, preventionRule);
    for (const field of ['symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.ok(String(lesson[field] || '').trim(), `${fingerprint}.${field} missing`);
    }
    assert.ok(active.has(preventionRule), `missing active prevention ${preventionRule}`);
  }

  const addendum = JSON.parse(addendumRaw);
  assert.ok(addendum.failurePatterns.some(item => item.fingerprint === 'learning|canonical-artifact|reference-path-drift-v1'), 'current canonical artifact pointer-drift learning must be preserved');
  assert.ok(addendum.canonicalArtifacts.includes('brain/learning/incidents/connector-mutation-tool-routing-misfire-2026-08-30.json'));
});
