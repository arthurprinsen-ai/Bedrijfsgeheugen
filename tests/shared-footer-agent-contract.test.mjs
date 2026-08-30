import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('every current and future agent inherits the canonical SEO footer contract', () => {
  const agents = read('AGENTS.md');
  for (const marker of [
    'Canonical SEO Footer Contract',
    '.github/canoniek/voet.html',
    'site/footer-contract.json',
    'component:footer',
    'area:seo',
    'CONTRACT_CHANGE'
  ]) assert.ok(agents.includes(marker), `AGENTS.md missing ${marker}`);
  assert.match(agents, /footer[\s\S]{0,500}SEO[\s\S]{0,500}(rood|red)[\s\S]{0,500}(promot|productie)/i);
  assert.ok(existsSync('docs/canonical-seo-footer.md'));
  const doc = read('docs/canonical-seo-footer.md');
  assert.match(doc, /canonical-seo-footer-v1/);
  assert.match(doc, /structur.*auto|auto.*structur/i);
  assert.match(doc, /keyword.*owner|zoekwoord.*eigenaar/i);
});
