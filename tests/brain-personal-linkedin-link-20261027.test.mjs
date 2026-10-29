import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts', 'utf8');
const block = src.slice(src.indexOf("action==='create_personal_link'"), src.indexOf("action==='create_link'"));
test('personal link action exists and is separate from the company link', () => {
  assert.ok(block.length > 200);
  assert.match(block, /r_member_social/);
  assert.match(block, /w_member_social/);
});
test('personal link never requests organization scopes', () => {
  const requested = block.match(/PERSONAL_OAUTH_SCOPES=\[([^\]]*)\]/)[1];
  assert.doesNotMatch(requested, /organization/);
});
test('personal link is bound to the canonical owner, not a test user', () => {
  assert.match(block, /user_id:USER_ID/);
  assert.doesNotMatch(block, /priorState\?\.user_id|proofUserId/);
});
