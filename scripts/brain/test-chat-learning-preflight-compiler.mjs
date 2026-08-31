import fs from 'node:fs';
import assert from 'node:assert/strict';

const compilerPath = 'scripts/brain/chat-learning-preflight.mjs';

assert.ok(fs.existsSync(compilerPath), `${compilerPath} must exist`);

const { compileChatLearningPreflight } = await import('./chat-learning-preflight.mjs');
assert.equal(typeof compileChatLearningPreflight, 'function', 'compiler must export compileChatLearningPreflight');

const packet = compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 32, maxBytes: 256_000 });
assert.equal(packet.version, 'BRAIN-CHAT-LEARNING-PREFLIGHT-v1');
assert.equal(packet.status, 'READY');
assert.ok(packet.sources.length > 0, 'preflight packet must contain sources');
assert.equal(new Set(packet.sources.map(source => source.path)).size, packet.sources.length, 'sources must be deduplicated');
assert.ok(packet.sources.some(source => source.path === 'brain/learning/bg89-shadow-parity-runtime-lessons-2026-08-30.json'));
assert.ok(packet.sources.some(source => source.path === 'brain/learning/make-hard-pause-resume-state-2026-08-30.json'));
assert.ok(packet.sources.some(source => source.path === 'brain/learning/github-main-native-protection-gap-2026-08-30.json'));
assert.ok(Array.isArray(packet.fingerprints));
assert.ok(Array.isArray(packet.preventions));
assert.ok(Array.isArray(packet.blockers));
assert.ok(Array.isArray(packet.resume_contracts));
assert.ok(Number.isInteger(packet.sourceBytes) && packet.sourceBytes > 0, 'compiler must report total bytes scanned from canonical sources');
assert.ok(packet.sourceBytes > packet.totalBytes, 'canonical source corpus may exceed the compact execution packet');
assert.ok(packet.totalBytes <= 256_000, 'compiled execution packet must respect maxBytes');

assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 2, maxBytes: 256_000 }),
  /maxSources/,
  'source limit must fail closed'
);

assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 32, maxBytes: 100 }),
  /maxBytes/,
  'compiled packet byte limit must fail closed'
);

const again = compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 32, maxBytes: 256_000 });
assert.equal(JSON.stringify(packet), JSON.stringify(again), 'same repository state must compile deterministically');

const agentsContract = fs.readFileSync('AGENTS.md', 'utf8');
assert.match(
  agentsContract,
  /node scripts\/brain\/chat-learning-preflight\.mjs/,
  'AGENTS.md must require the deterministic chat-learning preflight command'
);
assert.match(
  agentsContract,
  /vóór (debuggen|materieel werk|ontwerpen|wijzigen|uitvoeren)/i,
  'AGENTS.md must require preflight before material execution'
);
assert.match(agentsContract, /status: READY/, 'AGENTS.md must require a READY preflight result');
assert.match(
  agentsContract,
  /CHAT_LEARNING_PREFLIGHT_FAILED/,
  'AGENTS.md must keep material execution fail-closed when preflight fails'
);

console.log(`PASS compact chat-learning preflight: ${packet.sources.length} sources, ${packet.sourceBytes} source bytes -> ${packet.totalBytes} packet bytes`);
