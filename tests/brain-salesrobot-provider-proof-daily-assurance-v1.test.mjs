import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261009160500_salesrobot_provider_proof_daily_assurance_v1.sql', import.meta.url), 'utf8');
test('canonical assurance only counts SalesRobot messages with independent provider inbox evidence', () => {
  for (const anchor of ["a.action_type='salesrobot_linkedin_dm'", "e.event_type='salesrobot_linkedin_dm_sent'", "e.source='salesrobot'", "e.evidence->>'provider_inbox_readback'='true'", "e.evidence->>'inbox_message_sent_by_me'='true'", "e.evidence->>'provider_step_status'='SENT'", "a.evidence->>'provider_message_id'=e.evidence->>'inbox_message_id'", "a.evidence->>'provider_campaign_uuid'=e.evidence->>'provider_campaign_uuid'", "a.person_key=e.person_key", "a.status='done'"]) assert.ok(sql.includes(anchor), 'Missing evidence condition: '+anchor);
});
test('assurance is additive and does not create a secondary sender or scheduler', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_output_assurance_v1/);
  assert.match(sql, /'provider_proven_salesrobot_dm',v_dm/);
  assert.match(sql, /v_proofs := v_proofs \|\| v_dm_proofs \|\| v_publication_proofs/);
  assert.match(sql, /v_social := v_social \+ v_dm/);
  assert.match(sql, /'provider_proven_email',v_email/);
  assert.match(sql, /'powerhouse-commercial-output-assurance-v3'/);
  assert.doesNotMatch(sql, /cron\.schedule|CREATE\s+TRIGGER|SALESROBOT_SEND_MESSAGE|GMAIL_SEND_EMAIL|http_post/i);
});
