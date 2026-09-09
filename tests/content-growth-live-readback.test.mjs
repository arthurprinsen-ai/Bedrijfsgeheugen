import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLivePublication } from '../tools/content-growth/live-readback.mjs';

test('accepts exact 200 canonical and content id marker', () => {
  const html = '<html><head><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/foo/"><script type="application/ld+json">{"@type":"Article","headline":"Foo"}</script></head><body data-content-id="blog:foo"><h1>Foo</h1></body></html>';
  const proof = verifyLivePublication({ html, status: 200, url: 'https://www.bedrijfsgeheugen.nl/blog/foo/', contentId: 'blog:foo', slug: 'foo' });
  assert.equal(proof.ok, true);
});

test('rejects wrong canonical', () => {
  const html = '<link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/bar/"><body data-content-id="blog:foo"></body>';
  assert.throws(() => verifyLivePublication({ html, status: 200, url: 'https://www.bedrijfsgeheugen.nl/blog/foo/', contentId: 'blog:foo', slug: 'foo' }), /canonical/);
});

test('rejects stale content id marker', () => {
  const html = '<link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/foo/"><body data-content-id="blog:old"></body>';
  assert.throws(() => verifyLivePublication({ html, status: 200, url: 'https://www.bedrijfsgeheugen.nl/blog/foo/', contentId: 'blog:foo', slug: 'foo' }), /content_id/);
});
