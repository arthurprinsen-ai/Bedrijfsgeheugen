import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(new URL('../supabase/migrations/20260915143100_powerhouse_revenue_acceleration_eligibility_v1.sql', import.meta.url), 'utf8');

test('eligibility uses observed commercial signals without fabricating economic value', () => {
  assert.match(sql, /opportunity_status[^\n]*in \('open','active','qualified','discovery','proposal'\)/i);
  assert.match(sql, /priority,0\)>=80/i);
  assert.match(sql, /buying_window_confidence,0\)>=0\.50/i);
  assert.match(sql, /action_confidence,0\)>=0\.25/i);
  assert.match(sql, /'economic_value_required',false/i);
  assert.match(sql, /'observed_expected_commercial_value_eur'/i);
  assert.doesNotMatch(sql, /expected_commercial_value_eur,0\)>0/i);
});

test('provider capability and all safety gates remain fail closed', () => {
  for (const gate of ['exact_destination_verified','eligibility_verified','contact_pressure_ok','identity_verified','truth_verified','provider_capability_verified']) {
    assert.match(sql, new RegExp(gate, 'i'));
  }
  assert.match(sql, /source,''\)\)='gmail'/i);
  assert.match(sql, /subject_key='linkedin-outbound'/i);
  assert.match(sql, /outbound_daily_limit',5/i);
  assert.match(sql, /'fail_closed',true/i);
  assert.match(sql, /no_fabricated_economic_value/i);
});
