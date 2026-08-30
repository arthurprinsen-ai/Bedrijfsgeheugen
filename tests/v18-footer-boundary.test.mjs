import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCanonicalFooter, normalizeFooter } from '../tools/apply-canonical-footer.mjs';

const canonical = readFileSync('.github/canoniek/voet.html', 'utf8');
const stripFooter = html => html.replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
const extractFooter = html => (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0];

test('canonical footer replacement cannot alter V18 body outside footer', () => {
  const before = '<html><body><main id="view-home"><h1>V18</h1></main><footer class="legacy">oud</footer></body></html>';
  const after = applyCanonicalFooter(before, 'index.html');
  assert.equal(stripFooter(after), stripFooter(before));
  assert.equal(normalizeFooter(extractFooter(after)), normalizeFooter(canonical));
});

test('boundary proof detects deliberate non-footer body drift', () => {
  const before = '<html><body><main id="view-home">V18</main><footer>oud</footer></body></html>';
  const after = applyCanonicalFooter(before.replace('V18', 'V18 drift'), 'index.html');
  assert.notEqual(stripFooter(after), stripFooter(before));
});

test('production build order keeps footer after historical core, SEO and auth', () => {
  const build = readFileSync('tools/bouw-v18-production.mjs', 'utf8');
  const core = build.indexOf("bouw-v18-production-core.mjs");
  const seo = build.indexOf("apply-v18-seo.mjs");
  const auth = build.indexOf('applyCustomerPortalAuth');
  const footer = build.indexOf('applyCanonicalFootersToSite');
  assert.ok(core >= 0 && seo > core && auth >= 0 && footer > seo);
});
