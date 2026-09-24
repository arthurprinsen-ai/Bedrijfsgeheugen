import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const redirects = fs.readFileSync('_redirects','utf8');

test('nested localized public routes keep their wildcard rewrites', () => {
  assert.match(redirects,/^\/en\/\*\s+\/en\/:splat\.html\s+200$/m);
  assert.match(redirects,/^\/nl\/\*\s+\/nl\/:splat\.html\s+200$/m);
});
