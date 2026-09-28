import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/migrations/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql','utf8');
const worker=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-relationship-revenue/SKILL.md','utf8');

test('autonomous relationship outreach is bounded and evidence gated',()=>{
  assert.match(migration,/relationship_status in \('in_gesprek','aangeboden','rust'\)/);
  assert.match(migration,/t\.confidence>=\.60/);
  assert.match(migration,/interval '30 days'/);
  assert.match(migration,/greatest\(0,5-/);
  assert.match(migration,/opt_out/);
  assert.match(migration,/autonomous_email/);
});

test('gmail executor is idempotent and provider acknowledged',()=>{
  assert.match(worker,/GMAIL_SEND_EMAIL/);
  assert.match(worker,/republish_forbidden:true/);
  assert.match(worker,/provider_ack_verified:true/);
  assert.match(worker,/eq\('status','prepared'\)/);
  assert.match(worker,/status:'waiting'/);
  assert.match(worker,/status:'done'/);
  assert.match(worker,/dry_run/);
});

test('skill authorizes bounded autonomous outbound without inventing linkedin dm capability',()=>{
  assert.match(skill,/autonome outbound/i);
  assert.match(skill,/LinkedIn DM/i);
  assert.match(skill,/maximaal 5/i);
  assert.match(skill,/30 dagen/i);
});
