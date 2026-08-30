import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lessons = JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json','utf8')).lessons;
const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8')).rules;

const required = [
  ['delivery-failure|verification|shared|http-ack-without-execution-proof','REQUIRE_EXECUTION_PROOF_AFTER_HTTP_ACK'],
  ['delivery-failure|capacity|automation|make-quota-paused-production-handoff','BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE'],
  ['delivery-failure|cost|automation|client-cache-without-source-call-reduction','OPTIMIZE_SOURCE_CALLS_NOT_ONLY_CLIENT_CACHE'],
  ['delivery-failure|governance|shared|write-used-as-branch-existence-probe','NEVER_MUTATE_TO_DISCOVER_BRANCH_STATE'],
  ['delivery-failure|governance|shared|chat-checkpoint-test-landed-without-checkpoint','CO_CHANGE_CHAT_CHECKPOINT_AND_CONTRACT_TEST']
];

test('chat incident continuity survives moving-main consolidation', () => {
  for (const [fingerprint, preventionRule] of required) {
    const lesson = lessons.find(item => item.fingerprint === fingerprint);
    assert.ok(lesson, `missing canonical chat learning ${fingerprint}`);
    assert.equal(lesson.status, 'PROVEN');
    assert.equal(lesson.preventionRule, preventionRule);
    const rule = rules.find(item => item.id === preventionRule);
    assert.ok(rule, `missing prevention rule ${preventionRule}`);
    assert.equal(rule.active, true);
    assert.ok(String(rule.enforcedBy || '').trim(), `${preventionRule} missing enforcement owner`);
  }
});
