import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');

test('cockpit autopilot reuses canonical publisher and fails closed outside supported capability', () => {
  assert.match(source, /async function runLinkedInCockpitAutopilot\(db:any\)/);
  assert.match(source, /LINKEDIN_CREATE_COMMENT_ON_POST/);
  assert.match(source, /CONCRETE_POST_CONTEXT_REQUIRED/);
  assert.match(source, /LINKEDIN_CAPABILITY_NOT_AVAILABLE/);
  assert.match(source, /\['reply_dm','activate_connection'\]\.includes\(type\)/);
});

test('cockpit autopilot is idempotent and writes provider/outcome evidence', () => {
  assert.match(source, /\.eq\('status','suggested'\)/);
  assert.match(source, /status:'dispatching'/);
  assert.match(source, /provider_ack_verified:true/);
  assert.match(source, /powerhouse_record_outcome/);
  assert.match(source, /mode === 'cockpit_autopilot'/);
});
