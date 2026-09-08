import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHtmlInlineScripts } from '../tools/site-shell/website-static-syntax-preflight.mjs';

test('rejects an unterminated inline script before preview or browser CI', () => {
  const html = `<!doctype html><html><body><script>function consent(){ if (true) { return true; }</script></body></html>`;
  const result = validateHtmlInlineScripts({ html, filePath: 'contact.html' });
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /Unexpected end of input|Unexpected token/);
});

test('accepts syntactically valid inline scripts', () => {
  const html = `<!doctype html><html><body><script>function consent(){ if (true) { return true; } }</script></body></html>`;
  const result = validateHtmlInlineScripts({ html, filePath: 'contact.html' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('ignores non-JavaScript script payloads such as JSON-LD', () => {
  const html = `<!doctype html><html><body><script type="application/ld+json">{"name":"Bedrijfsgeheugen"}</script></body></html>`;
  const result = validateHtmlInlineScripts({ html, filePath: 'index.html' });
  assert.equal(result.ok, true);
});
