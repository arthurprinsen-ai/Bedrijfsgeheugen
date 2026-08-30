import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const RULE_ID = 'REQUIRE_READY_CHAT_LEARNING_AT_AGENT_EXECUTION_BOUNDARY';
const LESSON_SOURCE = 'brain/learning/agent-chat-learning-runtime-gate-2026-08-31.json';
const EXECUTION_SOURCE = 'brain/learning/current-execution-lessons-2026-08-30.json';
const FINGERPRINT = 'agent-fabric|chat-learning|policy-without-runtime-execution-gate';

test('runtime chat-learning gate failure is permanently mapped to an active prevention rule', () => {
  const rules = JSON.parse(readFileSync('config/delivery-prevention-rules.json', 'utf8'));
  const rule = (rules.rules ?? []).find((candidate) => candidate.id === RULE_ID);
  assert.ok(rule, `missing prevention rule ${RULE_ID}`);
  assert.equal(rule.active, true);
  assert.match(rule.enforcedBy, /agent-fabric/i);
});

test('runtime preflight transitively includes execution lessons and the execution-gate learning', () => {
  const packet = compileChatLearningPreflight();
  const paths = new Set(packet.sources.map((source) => source.path));
  assert.ok(paths.has(EXECUTION_SOURCE), `missing ${EXECUTION_SOURCE}`);
  assert.ok(paths.has(LESSON_SOURCE), `missing ${LESSON_SOURCE}`);
  assert.ok(packet.fingerprints.includes(FINGERPRINT), `missing reusable fingerprint ${FINGERPRINT}`);
});
