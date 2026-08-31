import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const rootDir = process.cwd();
const learningDir = path.join(rootDir, 'brain/learning');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

test('every ACTIVE top-level chat learning is reachable directly or through a loaded bounded projection', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const loaded = new Set(packet.sources.map(source => source.path));
  const projectedCanonicalSources = new Set();

  for (const source of packet.sources) {
    if (!source.path.endsWith('.json')) continue;
    const parsed = readJson(source.path);
    if (typeof parsed.source === 'string' && parsed.source.startsWith('brain/learning/chat-')) {
      projectedCanonicalSources.add(parsed.source);
    }
  }

  const activeChatSources = fs.readdirSync(learningDir)
    .filter(name => /^chat-.*\.json$/.test(name))
    .map(name => `brain/learning/${name}`)
    .filter(relativePath => readJson(relativePath).status === 'ACTIVE');

  const unreachable = activeChatSources.filter(relativePath => {
    const parsed = readJson(relativePath);
    if (parsed.preflightExempt === true && typeof parsed.preflightExemptionReason === 'string' && parsed.preflightExemptionReason.trim()) return false;
    return !loaded.has(relativePath) && !projectedCanonicalSources.has(relativePath);
  });

  assert.deepEqual(unreachable, [], `ACTIVE chat learnings not reachable from BRAIN preflight: ${unreachable.join(', ')}`);
});
