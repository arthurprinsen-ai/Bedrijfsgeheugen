import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('every current and future agent inherits the canonical SEO footer contract', () => {
  assert.ok(existsSync('docs/canonical-seo-footer.md'));
  assert.ok(existsSync('brain/memory/chat-learning-registry.json'));
  const agents = read('AGENTS.md');
  const doc = read('docs/canonical-seo-footer.md');
  const memory = JSON.parse(read('brain/memory/chat-learning-registry.json'));

  assert.match(agents, /Eén team, één geheugen/);
  assert.match(agents, /Niet opnieuw ontdekken/);
  assert.match(agents, /CONTRACT_CHANGE/);
  assert.match(doc, /canonical-seo-footer-v1/);
  assert.match(doc, /\.github\/canoniek\/voet\.html/);
  assert.match(doc, /site\/footer-contract\.json/);
  assert.match(doc, /component:footer/);
  assert.match(doc, /area:seo/);
  assert.match(doc, /structur.*auto|auto.*structur/i);
  assert.match(doc, /keyword.*owner|zoekwoord.*eigenaar/i);
  for (const fingerprint of ['canonical-footer-single-source', 'seo-keyword-owner-cannibalization', 'v18-protected-boundary']) {
    assert.ok(memory.learnings.some(x => x.fingerprint === fingerprint), `shared memory missing ${fingerprint}`);
  }
});
