import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const composer=fs.readFileSync('supabase/functions/powerhouse-human-sales-composer/index.ts','utf8');
const email=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const linkedin=fs.readFileSync('supabase/functions/powerhouse-linkedin-sales-machine/index.ts','utf8');

test('human sales composer owns strategy, ethical psychology and quality proof',()=>{
  assert.match(composer,/powerhouse-human-sales-composer-v1/);
  assert.match(composer,/message_strategy/);
  assert.match(composer,/quality_passed/);
  assert.match(composer,/smallest logical commitment/);
  assert.match(composer,/never manipulate/i);
  assert.match(composer,/generic_connected/);
  assert.match(composer,/UNIQUE_CONTEXT_REQUIRED/);
});

test('email cannot execute without composer quality proof',()=>{
  assert.match(email,/powerhouse-human-sales-composer/);
  assert.match(email,/quality_passed/);
  assert.match(email,/COPY_QUALITY_GATE_FAILED/);
});

test('linkedin dm cannot execute without composer quality proof',()=>{
  assert.match(linkedin,/powerhouse-human-sales-composer/);
  assert.match(linkedin,/quality_passed/);
  assert.match(linkedin,/COPY_QUALITY_GATE_FAILED/);
  assert.match(linkedin,/SALESROBOT_SEND_MESSAGE/);
});
