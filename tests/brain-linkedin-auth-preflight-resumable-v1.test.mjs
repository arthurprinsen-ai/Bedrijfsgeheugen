import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn auth is proven before the single-writer publication claim', () => {
  const preflight = publisher.indexOf("if(row.channel==='linkedin_personal'||row.channel==='linkedin_company')");
  const claim = publisher.indexOf('// Single-writer idempotency barrier');
  assert.ok(preflight >= 0, 'LinkedIn provider preflight must exist');
  assert.ok(claim > preflight, 'provider preflight must execute before claim/capability side effects');
  assert.match(publisher,/await preflightLinkedInComposio\(db\)/);
  assert.match(publisher,/LINKEDIN_GET_MY_INFO/);
});

test('revoked or expired LinkedIn auth leaves the daily claim resumable without side effects', () => {
  assert.match(publisher,/LINKEDIN_REAUTH_REQUIRED/);
  assert.match(publisher,/state:'content_ready'/);
  assert.match(publisher,/provider_auth_required:true/);
  assert.match(publisher,/republish_forbidden:false/);
  assert.match(publisher,/possible_provider_side_effect:false/);
  assert.match(publisher,/status:'waiting_reauth'/);
  assert.match(publisher,/resumable:true/);
});

test('successful LinkedIn create still forbids replacement when readback is unavailable', () => {
  assert.match(publisher,/provider_create_success:true/);
  assert.match(publisher,/verification_pending:true/);
  assert.match(publisher,/republish_forbidden:true/);
});
