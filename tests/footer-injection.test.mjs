import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCanonicalFooter, normalizeFooter } from '../tools/apply-canonical-footer.mjs';

const canonical = readFileSync('.github/canoniek/voet.html', 'utf8');
const count = html => (html.match(/<footer\b/gi) || []).length;
const extract = html => (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0];

test('injects exactly one canonical footer when missing', () => {
  const out = applyCanonicalFooter('<html><body><main>x</main></body></html>', 'index.html');
  assert.equal(count(out), 1);
  assert.equal(normalizeFooter(extract(out)), normalizeFooter(canonical));
});

test('replaces an existing footer with canonical footer', () => {
  const out = applyCanonicalFooter('<html><body><main>x</main><footer class="old">old</footer></body></html>', 'over-ons.html');
  assert.equal(count(out), 1);
  assert.equal(normalizeFooter(extract(out)), normalizeFooter(canonical));
});

test('declared application exceptions stay unchanged', () => {
  const html = '<html><body><main>portal</main></body></html>';
  assert.equal(applyCanonicalFooter(html, 'klantportaal.html'), html);
});

test('multiple footers are rejected instead of silently repaired', () => {
  assert.throws(() => applyCanonicalFooter('<html><body><footer>a</footer><footer>b</footer></body></html>', 'over-ons.html'), /multiple footers/i);
});
