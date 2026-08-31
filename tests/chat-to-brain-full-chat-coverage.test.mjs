import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const coveragePath = 'brain/learning/full-chat-coverage-2026-08-31.json';
const checkpointPath = 'brain/learning/chat-completeness-checkpoint-2026-08-31.json';

test('full durable learning coverage from the active chat is canonical and preflight-visible', async () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const sources = new Set(packet.sources.map(source => source.path));
  assert.ok(sources.has(coveragePath), 'full-chat coverage manifest must be a mandatory preflight source');
  assert.ok(sources.has(checkpointPath), 'canonical chat completeness checkpoint must be preflight-visible');

  const checkpoint = JSON.parse(await readFile(path.join(rootDir, checkpointPath), 'utf8'));
  assert.equal(checkpoint.chatOnlyMaterialLearningRemaining, 0, 'canonical checkpoint still reports chat-only material learning');

  const coverage = JSON.parse(await readFile(path.join(rootDir, coveragePath), 'utf8'));
  assert.equal(coverage.status, 'ACTIVE');
  assert.equal(coverage.scope, 'FULL_DURABLE_CHAT_COVERAGE');
  assert.equal(coverage.canonicalCompletenessSource, checkpointPath);
  assert.deepEqual(coverage.missing, []);
  assert.equal(coverage.security?.containsSecrets, false);
  assert.equal(coverage.security?.containsCredentials, false);
  assert.equal(coverage.security?.containsPii, false);

  for (const item of coverage.coverage || []) {
    assert.equal(typeof item.fingerprint, 'string');
    assert.equal(typeof item.canonicalSource, 'string', `${item.fingerprint} missing canonicalSource`);
    assert.ok(sources.has(item.canonicalSource), `${item.fingerprint} canonical source is not in compiled preflight: ${item.canonicalSource}`);
    const sourceText = await readFile(path.join(rootDir, item.canonicalSource), 'utf8');
    assert.ok(sourceText.includes(item.fingerprint), `${item.fingerprint} not present in canonical source ${item.canonicalSource}`);
    assert.ok(packet.fingerprints.includes(item.fingerprint), `${item.fingerprint} not visible in compiled BRAIN preflight`);
  }
});
