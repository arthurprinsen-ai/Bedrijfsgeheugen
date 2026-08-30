import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCanonicalFooter, normalizeFooter } from '../tools/apply-canonical-footer.mjs';

const canonical = readFileSync('.github/canoniek/voet.html', 'utf8');
const count = html => (html.match(/<footer\b/gi) || []).length;
const extract = html => (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0];

test('injects exactly one canonical footer into governed page without footer', () => {
  const out = applyCanonicalFooter('<!doctype html><html><body><main>Hallo</main></body></html>', 'index.html');
  assert.equal(count(out), 1);
  assert.equal(normalizeFooter(extract(out)), normalizeFooter(canonical));
});

test('replaces one existing footer with canonical footer', () => {
  const out = applyCanonicalFooter('<html><body><main>Over</main><footer class="old">oud</footer></body></html>', 'over-ons.html');
  assert.equal(count(out), 1);
  assert.doesNotMatch(out, /class="old"/);
});

test('declared exception is unchanged', () => {
  const html = '<html><body><main>Portal</main></body></html>';
  assert.equal(applyCanonicalFooter(html, 'klantportaal.html'), html);
});

test('multiple existing footers fail closed', () => {
  assert.throws(() => applyCanonicalFooter('<body><footer>a</footer><footer>b</footer></body>', 'index.html'), /multiple footers/i);
});
