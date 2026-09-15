import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const canon = JSON.parse(await readFile('brain/contracts/powerhouse-operating-canon-v1.json', 'utf8'));

const has = (list, value) => Array.isArray(list) && list.includes(value);

test('Powerhouse operating canon is explicit and fail-closed', () => {
  assert.equal(canon.contract_id, 'POWERHOUSE-OPERATING-CANON-v1');
  assert.equal(canon.status, 'canonical');
  assert.equal(canon.business_goal.system, 'growth-revenue-os-1m-2027-v1');
  assert.equal(canon.channel_identity.contract_id, 'channel-identity-hard-gate-v2');
  assert.equal(canon.channel_identity.mode, 'fail_closed');
});

test('closed learning loop cannot lose its causal stages', () => {
  for (const stage of ['detection','prioritization','execution','tests','production','readback','outcome','root_cause','regression','prevention','writeback']) {
    assert.ok(has(canon.closed_loop, stage), `missing closed-loop stage: ${stage}`);
  }
  for (const stage of ['prediction','action','outcome','revenue','calibration','next_decision']) {
    assert.ok(has(canon.decision_loop, stage), `missing decision-loop stage: ${stage}`);
  }
});

test('all canonical commercial channels and identities remain explicit', () => {
  for (const channel of ['email_newsletter','linkedin_personal','linkedin_company','linkedin_articles','instagram','website_blog']) {
    assert.ok(has(canon.content_channels, channel), `missing channel: ${channel}`);
  }
  assert.equal(canon.channel_identity.buffer_channels.linkedin_personal, '6a70381699afb44349f0fb35');
  assert.equal(canon.channel_identity.buffer_channels.linkedin_company, '6a70381699afb44349f0fb36');
  assert.equal(canon.channel_identity.buffer_channels.instagram_bedrijfsgeheugen, '6a70384d99afb44349f0fba9');
  assert.equal(canon.channel_identity.personal_instagram, 'blocked_until_exact_channel_is_connected');
});

test('existing Supabase revenue tables are the persisted learning spine', () => {
  for (const table of ['powerhouse_forecasts','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecast_calibration','growth_outcomes']) {
    assert.ok(has(canon.revenue_learning.existing_supabase_tables, table), `missing persisted revenue table: ${table}`);
  }
  assert.match(canon.revenue_learning.source_of_truth_rule, /No parallel datastore/i);
  for (const field of ['decision_id','prediction_id','source','evidence','confidence','dedupe_key','observed_at']) {
    assert.ok(has(canon.revenue_learning.required_lineage, field), `missing outcome lineage field: ${field}`);
  }
});

test('Make cannot return as production transport or new architecture', () => {
  assert.equal(canon.delivery.make, 'forbidden_for_production_transport_and_new_architecture');
  assert.equal(canon.delivery.production_transport, 'github_native_only');
  assert.equal(canon.delivery.production_authority, 'BG169');
  assert.ok(has(canon.anti_patterns, 'make_based_new_flows'));
  assert.ok(has(canon.anti_patterns, 'parallel_source_of_truth'));
});

test('completion claims require evidence and readback', () => {
  assert.match(canon.proof_of_completion.rule, /Never claim done\/live\/working without executable evidence and readback/i);
  for (const proof of ['tests_green','required_gates_green','exact_candidate_identity_verified','production_or_persistence_readback_where_applicable']) {
    assert.ok(has(canon.proof_of_completion.minimum, proof), `missing completion proof: ${proof}`);
  }
});
