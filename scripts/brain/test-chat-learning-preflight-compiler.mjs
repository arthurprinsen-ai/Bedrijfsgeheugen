import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const compilerPath = 'scripts/brain/chat-learning-preflight.mjs';
assert.ok(fs.existsSync(compilerPath), `${compilerPath} must exist`);
const { compileChatLearningPreflight } = await import('./chat-learning-preflight.mjs');
assert.equal(typeof compileChatLearningPreflight, 'function');

// The default ceiling is a safety bound, not an exact mirror of today's canonical source count.
// Canonical learning may grow without requiring a code change for every additional linked source.
const packet = compileChatLearningPreflight({ rootDir: process.cwd(), maxBytes: 256_000 });
assert.equal(packet.version, 'BRAIN-CHAT-LEARNING-PREFLIGHT-v2');
assert.equal(packet.status, 'READY');
assert.equal(packet.universalIngress.version, 'POWERHOUSE-UNIVERSAL-INGRESS-v1');
assert.equal(packet.universalIngress.failClosed, true);
assert.equal(packet.fastExecution.fingerprint, 'powerhouse-fast-development-protocol-v2');
assert.equal(packet.legacyFastExecution.version, 'POWERHOUSE-FAST-EXECUTION-v1');
assert.equal(packet.execution_packet_v2.protocol_version, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
assert.equal(packet.execution_packet_v2.fallback.route, 'FULL_CANONICAL_PREFLIGHT');
assert.equal(new Set(packet.sources.map(source => source.path)).size, packet.sources.length);
assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-fast-development-protocol-v2.json'));
assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-engineering-os.json'));
assert.ok(packet.sources.some(source => source.path === 'docs/brain/learning-plane-authority-contract-v1.md'));
assert.ok(packet.fingerprints.includes('powerhouse-fast-development-protocol-v2'));
assert.ok(packet.fingerprints.includes('powerhouse-autonomy-controls-v1'));
assert.ok(packet.sources.length <= 64);
assert.ok(packet.totalBytes <= 256_000);
assert.equal(typeof packet.telemetry.context_load_ms, 'number');
assert.equal(packet.telemetry.reasoning_ms, null);

// Fail closed remains explicit: a caller can set a stricter source ceiling and it must block.
const strictMaxSources = packet.sources.length - 1;
assert.throws(
  () => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: strictMaxSources, maxBytes: 256_000 }),
  new RegExp(`maxSources exceeded: ${packet.sources.length} > ${strictMaxSources}`)
);
assert.throws(() => compileChatLearningPreflight({ rootDir: process.cwd(), maxSources: 64, maxBytes: 100 }), /maxBytes/);

// Runtime timings are intentionally observed, not deterministic. Canonical content must remain stable.
const again = compileChatLearningPreflight({ rootDir: process.cwd(), maxBytes: 256_000 });
assert.deepEqual(packet.fastExecution, again.fastExecution);
assert.deepEqual(packet.legacyFastExecution, again.legacyFastExecution);
assert.deepEqual(packet.execution_packet_v2, again.execution_packet_v2);
assert.deepEqual(packet.sources, again.sources);
assert.deepEqual(packet.fingerprints, again.fingerprints);
const agentsContract = fs.readFileSync('AGENTS.md', 'utf8');
assert.match(agentsContract, /node scripts\/brain\/chat-learning-preflight\.mjs/);
assert.match(agentsContract, /status: READY/);
assert.match(agentsContract, /CHAT_LEARNING_PREFLIGHT_FAILED/);
console.log(`PASS chat-learning preflight compiler v2: ${packet.sources.length} sources, ${packet.totalBytes} packet bytes, ${packet.sourceBytes} source bytes`);


test('preflight source budget leaves capacity for durable learning growth', () => {
  const source = fs.readFileSync(new URL('./chat-learning-preflight.mjs', import.meta.url), 'utf8');
  const match = source.match(/const DEFAULT_MAX_SOURCES = (\d+);/);
  assert.ok(match, 'DEFAULT_MAX_SOURCES missing');
  assert.ok(Number(match[1]) >= 96, 'source budget must leave headroom for durable learning growth');
});
