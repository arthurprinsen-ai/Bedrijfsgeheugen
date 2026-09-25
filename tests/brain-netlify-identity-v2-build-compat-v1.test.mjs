import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('auth builder does not require obsolete @netlify/identity v2 internal bundle', () => {
  const src = fs.readFileSync('tools/bouw-powerhouse-auth.mjs','utf8');
  assert.match(src, /skipping obsolete vendoring/);
  assert.match(src, /transformIdentityTokenFlow/);
  assert.match(src, /repairCustomerPortalAuth/);
});
