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
assert.ok(packet.totalBytes <= 256_000, 'packet must respect maxBytes');

assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 2, maxBytes: 256_000 }),
  /maxSources/,
  'source limit must fail closed'
);

assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 32, maxBytes: 100 }),
  /maxBytes/,
  'byte limit must fail closed'
);

const again = compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 32, maxBytes: 256_000 });
assert.equal(JSON.stringify(packet), JSON.stringify(again), 'same repository state must compile deterministically');

console.log(`PASS chat-learning preflight compiler: ${packet.sources.length} sources, ${packet.totalBytes} bytes`);
