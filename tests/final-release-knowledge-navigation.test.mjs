import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('final release boundary re-applies the canonical Kennisbank navigation after all page transformers', async () => {
  const source = await readFile('tools/bouw-release-evidence.mjs', 'utf8');
  assert.match(source, /ensureKnowledgeNavigation/);
  assert.match(source, /verifyKnowledgeNavigation/);
  const knowledgeCall = source.indexOf('ensureKnowledgeNavigation');
  const evidenceWrite = source.indexOf("writeFile('release.json'");
  assert.ok(knowledgeCall >= 0 && evidenceWrite > knowledgeCall, 'Kennisbank navigation must be finalized before release evidence is written');
});
