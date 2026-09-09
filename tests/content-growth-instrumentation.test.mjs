import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');

test('approved blog publisher emits a stable blog content id marker', () => {
  assert.match(publisher, /data-content-id/);
  assert.match(publisher, /blog:/);
});
