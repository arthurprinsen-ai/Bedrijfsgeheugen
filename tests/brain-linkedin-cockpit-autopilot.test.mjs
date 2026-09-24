import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');

test('LinkedIn cockpit autopilot executes only supported evidence-backed post replies',()=>{
  assert.match(source,/async function runLinkedInCockpitAutopilot\(db:any\)/);
  assert.match(source,/type!==['"]reply_post['"]/);
  assert.match(source,/LINKEDIN_CREATE_COMMENT_ON_POST/);
  assert.match(source,/CONCRETE_POST_CONTEXT_REQUIRED/);
});

test('LinkedIn cockpit autopilot is single-writer and writes provider/outcome evidence',()=>{
  assert.match(source,/status:['"]dispatching['"]/);
  assert.match(source,/\.eq\(['"]status['"],['"]suggested['"]\)/);
  assert.match(source,/provider_ack_verified:true/);
  assert.match(source,/powerhouse_record_outcome/);
});

test('unsupported LinkedIn DM and connection actions remain capability exceptions',()=>{
  assert.match(source,/reply_dm/);
  assert.match(source,/activate_connection/);
  assert.match(source,/LINKEDIN_CAPABILITY_NOT_AVAILABLE/);
});
