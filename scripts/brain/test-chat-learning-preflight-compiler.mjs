import fs from 'node:fs';
import assert from 'node:assert/strict';

const compilerPath = 'scripts/brain/chat-learning-preflight.mjs';
assert.ok(fs.existsSync(compilerPath), `${compilerPath} must exist`);
const { compileChatLearningPreflight } = await import('./chat-learning-preflight.mjs');
assert.equal(typeof compileChatLearningPreflight, 'function');

// The default ceiling is a safety bound, not an exact mirror of today's canonical source count.
// Canonical learning may grow without requiring a code change for every additional linked source.
const packet = compileChatLearningPreflight({ rootDir: process.cwd(), maxBytes: 256_000 });
assert.equal(packet.version, 'BRAIN-CHAT-LEARNING-PREFLIGHT-v1');
assert.equal(packet.status, 'READY');
assert.equal(new Set(packet.sources.map(source => source.path)).size, packet.sources.length);
assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-engineering-os.json'));
assert.ok(packet.sources.some(source => source.path === 'docs/brain/learning-plane-authority-contract-v1.md'));
assert.ok(packet.fingerprints.includes('powerhouse-autonomy-controls-v1'));
assert.ok(packet.sources.length <= 64);
assert.ok(packet.totalBytes <= 256_000);

// Fail closed remains explicit: a caller can set a stricter source ceiling and it must block.
const strictMaxSources = packet.sources.length - 1;
assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: strictMaxSources, maxBytes: 256_000 }),
  new RegExp(`maxSources exceeded: ${packet.sources.length} > ${strictMaxSources}`)
);
assert.throws(() => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 64, maxBytes: 100 }), /maxBytes/);

const again = compileChatLearningPreflight({ rootDir: process.cwd(), maxBytes: 256_000 });
assert.equal(JSON.stringify(packet), JSON.stringify(again));
const agentsContract = fs.readFileSync('AGENTS.md', 'utf8');
assert.match(agentsContract, /node scripts\/brain\/chat-learning-preflight\.mjs/);
assert.match(agentsContract, /status: READY/);
assert.match(agentsContract, /CHAT_LEARNING_PREFLIGHT_FAILED/);
console.log(`PASS chat-learning preflight compiler: ${packet.sources.length} sources, ${packet.totalBytes} packet bytes, ${packet.sourceBytes} source bytes`);
