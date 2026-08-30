import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCanonicalFooter, normalizeFooter } from '../tools/apply-canonical-footer.mjs';

const canonical = readFileSync('.github/canoniek/voet.html', 'utf8');
const stripFooter = html => html.replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
const extractFooter = html => (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0];

test('canonical footer replacement cannot alter body outside footer region', () => {
  const before = '<html><body><main id="view-home"><h1>old V18</h1></main><footer class="legacy">legacy</footer></body></html>';
  const after = applyCanonicalFooter(before, 'index.html');
  assert.equal(stripFooter(after), stripFooter(before));
  assert.equal(normalizeFooter(extractFooter(after)), normalizeFooter(canonical));
});

test('boundary assertion catches non-footer body drift', () => {
  const before = '<html><body><main id="view-home">accepted</main><footer>old</footer></body></html>';
  const drifted = '<html><body><main id="view-home">changed</main>' + canonical + '</body></html>';
  assert.notEqual(stripFooter(drifted), stripFooter(before));
});

test('production build order is historical core then SEO then canonical footer', () => {
  const build = readFileSync('tools/bouw-v18-production.mjs', 'utf8');
  const core = build.indexOf("bouw-v18-production-core.mjs");
  const seo = build.indexOf("apply-v18-seo.mjs");
  const footer = build.indexOf("apply-canonical-footer.mjs");
  assert.ok(core >= 0 && seo > core && footer > seo);
});
