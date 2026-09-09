import test from 'node:test';
import assert from 'node:assert/strict';
import { blogContentId, instrumentBlogHtml } from '../tools/content-growth/content-id.mjs';

test('blog content id is stable from slug', () => assert.equal(blogContentId('foo-bar'), 'blog:foo-bar'));
test('instrumentation adds one body content id', () => {
  const html = instrumentBlogHtml('<html><body><h1>x</h1></body></html>', 'foo');
  assert.match(html, /<body data-content-id="blog:foo">/);
});
