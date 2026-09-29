import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRouteScopedComponentHtml } from '../tools/site-shell/live-contract.mjs';

test('live shell hash ignores only route-scoped locale href differences', () => {
  const a = '<aside data-bg-component="mobile-menu"><a href="/prijzen" data-bg-language-option="nl">NL</a><a href="/en/prijzen" data-bg-language-option="en">EN</a><a href="/contact">Contact</a></aside>';
  const b = '<aside data-bg-component="mobile-menu"><a href="/over-ons" data-bg-language-option="nl">NL</a><a href="/en/over-ons" data-bg-language-option="en">EN</a><a href="/contact">Contact</a></aside>';
  assert.equal(normalizeRouteScopedComponentHtml(a,'mobile-menu'), normalizeRouteScopedComponentHtml(b,'mobile-menu'));
  assert.match(normalizeRouteScopedComponentHtml(a,'mobile-menu'), /href="\/contact"/);
  assert.equal(normalizeRouteScopedComponentHtml(a,'header'), a);
});
