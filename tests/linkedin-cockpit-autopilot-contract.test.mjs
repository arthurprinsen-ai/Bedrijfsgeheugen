import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url),'utf8');

test('LinkedIn cockpit autopilot is part of the canonical social publisher',()=>{
  assert.match(source,/async function runLinkedInCockpitAutopilot\(db:any\)/);
  assert.match(source,/LINKEDIN_CREATE_COMMENT_ON_POST/);
  assert.match(source,/\.eq\('status','suggested'\)/);
  assert.match(source,/status:'dispatching'/);
  assert.match(source,/status:'executed'/);
  assert.match(source,/provider_ack_verified:true/);
  assert.match(source,/powerhouse_record_outcome/);
});

test('autopilot refuses unsupported LinkedIn DM and connection actions',()=>{
  assert.match(source,/\['reply_dm','activate_connection'\]\.includes\(type\)/);
  assert.match(source,/LINKEDIN_CAPABILITY_NOT_AVAILABLE/);
});

test('autopilot requires concrete LinkedIn post context and exact comment text',()=>{
  assert.match(source,/linkedin\\\.com/);
  assert.match(source,/CONCRETE_POST_CONTEXT_REQUIRED/);
  assert.match(source,/Comment text: \$\{message\}/);
});

test('publisher exposes a dedicated cockpit_autopilot mode and also runs it in normal delivery',()=>{
  assert.match(source,/mode === 'cockpit_autopilot'/);
  const calls=(source.match(/await runLinkedInCockpitAutopilot\(db\)/g)||[]).length;
  assert.ok(calls>=2);
});
