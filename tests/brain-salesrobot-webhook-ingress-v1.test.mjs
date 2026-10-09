import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../supabase/functions/powerhouse-salesrobot-ingest/index.ts', import.meta.url), 'utf8');
test('SalesRobot callback is inbound-only, scoped and Vault authenticated', () => {
  for (const item of [
    'salesrobot_webhook_ingress_token',
    'constantEqual(secretInput, expected)',
    'UNAUTHORIZED',
    'UNSUPPORTED_EVENT',
    'WRONG_CAMPAIGN',
    'MAX_BYTES = 65536',
    'contact_replies',
    'inbound_only',
  ]) assert.ok(source.includes(item), 'Missing webhook contract: ' + item);
  assert.ok(source.includes('ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e'));
  assert.ok(source.includes('powerhouse_runtime_events'));
  assert.ok(source.includes('bg_connecties'));
  assert.ok(source.includes('onConflict: "dedupe_key", ignoreDuplicates: true'));
  assert.ok(source.includes('provider_message_id'));
  assert.ok(source.includes('delivery_claim: false'));
  assert.ok(source.includes('persisted: false, external_side_effects: false'));
  assert.ok(!source.includes('SALESROBOT_SEND_MESSAGE'), 'Incoming webhook must not dispatch outreach');
  assert.ok(!source.includes('.from("powerhouse_sales_outcomes")'), 'No unverified outcome creation');
});
