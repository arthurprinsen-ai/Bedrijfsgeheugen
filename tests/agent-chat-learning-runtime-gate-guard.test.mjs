import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';

const RULE_ID = 'REQUIRE_READY_CHAT_LEARNING_AT_AGENT_EXECUTION_BOUNDARY';
const PARITY_RULE_ID = 'REQUIRE_CANONICAL_LINKED_LEARNING_PARITY_ACROSS_PREFLIGHTS';
const LESSON_SOURCE = 'brain/learning/agent-chat-learning-runtime-gate-2026-08-31.json';
const EXECUTION_SOURCE = 'brain/learning/current-execution-lessons-2026-08-30.json';
const PARITY_SOURCE = 'brain/learning/preflight-consumer-linked-source-parity-2026-08-31.json';
const FINGERPRINT = 'agent-fabric|chat-learning|policy-without-runtime-execution-gate';
const PARITY_FINGERPRINT = 'brain-learning|preflight-consumer|linked-source-parity-gap';

test('runtime chat-learning gate failure is permanently mapped to an active prevention rule', () => {
  const rules = JSON.parse(readFileSync('config/delivery-prevention-rules.json', 'utf8'));
  const rule = (rules.rules ?? []).find((candidate) => candidate.id === RULE_ID);
  const parityRule = (rules.rules ?? []).find((candidate) => candidate.id === PARITY_RULE_ID);
  assert.ok(rule, `missing prevention rule ${RULE_ID}`);
  assert.equal(rule.active, true);
  assert.match(rule.enforcedBy, /agent-fabric/i);
  assert.ok(parityRule, `missing prevention rule ${PARITY_RULE_ID}`);
  assert.equal(parityRule.active, true);
});

test('runtime preflight transitively includes execution lessons and the execution-gate learning', () => {
  const packet = compileChatLearningPreflight();
  const paths = new Set(packet.sources.map((source) => source.path));
  assert.ok(paths.has(EXECUTION_SOURCE), `missing ${EXECUTION_SOURCE}`);
  assert.ok(paths.has(LESSON_SOURCE), `missing ${LESSON_SOURCE}`);
  assert.ok(paths.has(PARITY_SOURCE), `missing ${PARITY_SOURCE}`);
  assert.ok(packet.fingerprints.includes(FINGERPRINT), `missing reusable fingerprint ${FINGERPRINT}`);
  assert.ok(packet.fingerprints.includes(PARITY_FINGERPRINT), `missing reusable fingerprint ${PARITY_FINGERPRINT}`);
});

test('runtime chat-learning guard family remains classified in BRAIN delivery', () => {
  const policy = JSON.parse(readFileSync('config/brain-delivery-system.json', 'utf8'));
  const backend = (policy.lanes ?? []).find((lane) => lane.id === 'backend');
  assert.ok(backend, 'missing backend delivery lane');
  assert.ok((backend.paths ?? []).includes('tests/agent-chat-learning-'), 'runtime chat-learning guard family is unclassified');
});

test('runtime and delivery preflights reuse the same linked-source parity learning', async () => {
  const runtimePacket = compileChatLearningPreflight();
  const deliveryPacket = await loadDeliveryPreflight({ component:'shared' });
  assert.ok(runtimePacket.fingerprints.includes(PARITY_FINGERPRINT), 'runtime preflight missed parity learning');
  assert.ok(deliveryPacket.reusedLessons.includes(PARITY_FINGERPRINT), 'delivery preflight missed parity learning');
});
