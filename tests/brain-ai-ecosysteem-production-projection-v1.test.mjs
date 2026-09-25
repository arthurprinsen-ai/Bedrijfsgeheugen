import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyAiEcosystemPropositionHtml } from '../tools/bouw-v18-ai-ecosysteem.mjs';

test('AI ecosystem projection survives canonical V18 rebuild and is idempotent', () => {
  const source='<!doctype html><html><head></head><body><header><a href="/systemen-koppelen">Systemen koppelen</a></header><main><section id="hero"><h1>Home</h1></section><section><p>Rest</p></section></main></body></html>';
  const once=applyAiEcosystemPropositionHtml(source);
  const twice=applyAiEcosystemPropositionHtml(once);
  assert.match(once,/data-section="ai-ecosysteem"/);
  assert.match(once,/href="\/ai-ecosysteem"/);
  assert.match(once,/POWERHOUSE — het bedrijfsbrein/);
  assert.equal((twice.match(/data-section="ai-ecosysteem"/g)||[]).length,1);
  assert.equal((twice.match(/id="bg-ai-ecosysteem-style"/g)||[]).length,1);
});

test('production builder explicitly reapplies AI ecosystem after pinned homepage restoration', async () => {
  const production=await readFile(new URL('../tools/bouw-v18-production.mjs',import.meta.url),'utf8');
  assert.match(production,/applyAiEcosystemProposition\('index\.html'\)/);
});
