import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('footer contract is machine-readable and SEO governed', () => {
  assert.ok(existsSync('site/footer-contract.json'));
  const c = JSON.parse(read('site/footer-contract.json'));
  assert.equal(c.canonicalSource, '.github/canoniek/voet.html');
  assert.deepEqual(c.requiredScopes, ['component:footer', 'area:seo']);
  assert.equal(c.rules.exactlyOneFooter, true);
  assert.equal(c.rules.footerChangesRequireSeoGreen, true);
  assert.equal(c.rules.v18OnlyFooterMayChange, true);
  assert.ok(Array.isArray(c.exceptions));
  assert.ok(c.exceptions.every(x => x.file && x.reason));
  assert.ok(c.governedGlobs.includes('blog/index.html'), 'blog landing must be explicitly governed');
  assert.ok(c.strategicDestinations.includes('/bedrijfsgeheugen'));
  assert.ok(c.strategicDestinations.includes('/afas-koppeling'));
  assert.ok(c.strategicDestinations.includes('/ai-governance'));
});
