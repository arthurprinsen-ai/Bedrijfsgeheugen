import fs from 'node:fs';
import assert from 'node:assert/strict';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const contract = readJson('config/brain-chat-learning-contract.json');
const continuityPath = 'brain/learning/chat-continuity-2026-08-30.json';

assert.equal(contract.preflightRequired, true, 'chat-learning preflight must stay required');
assert.equal(contract.newAgentsMustReadBeforeExecution, true, 'new agents must read chat learning before execution');
assert.ok(contract.canonicalSources.includes(continuityPath), 'canonicalSources must include the chat continuity learning set');

const continuity = readJson(continuityPath);
const requiredLinkedSources = [
  'brain/learning/bg89-shadow-parity-runtime-lessons-2026-08-30.json',
  'brain/learning/make-hard-pause-resume-state-2026-08-30.json',
  'brain/learning/github-main-native-protection-gap-2026-08-30.json'
];

assert.ok(Array.isArray(continuity.linked_learning_sources), 'continuity must declare linked_learning_sources');
assert.equal(new Set(continuity.linked_learning_sources).size, continuity.linked_learning_sources.length, 'linked learning sources must be unique');
for (const path of requiredLinkedSources) {
  assert.ok(continuity.linked_learning_sources.includes(path), `${path} must stay in the chat-learning preflight index`);
  assert.ok(fs.existsSync(path), `${path} must exist`);
  const source = readJson(path);
  assert.ok(source && typeof source === 'object', `${path} must contain parseable JSON`);
  assert.ok(source.type || source.fingerprint || source.version, `${path} must expose machine-readable learning/state identity`);
}

assert.match(
  continuity.agent_instruction,
  /linked_learning_sources/,
  'agent instruction must explicitly require reading linked learning sources'
);

console.log(`PASS chat-learning linked sources: ${requiredLinkedSources.length}`);
