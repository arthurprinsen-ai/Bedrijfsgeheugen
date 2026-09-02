import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../klantportaal.html', import.meta.url), 'utf8');

test('recovery token opens recovery flow before portal state', () => {
  assert.match(html, /recovery_token/);
  assert.match(html, /netlifyIdentity\.on\(['"]recovery['"]/);
  assert.match(html, /netlifyIdentity\.open\(['"]recovery['"]\)/);
});

test('invite token opens signup flow before portal state', () => {
  assert.match(html, /invite_token/);
  assert.match(html, /netlifyIdentity\.on\(['"]invite['"]/);
  assert.match(html, /netlifyIdentity\.open\(['"]signup['"]\)/);
});
