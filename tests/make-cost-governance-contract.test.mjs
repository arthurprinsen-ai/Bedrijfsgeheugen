import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync(new URL('../config/make-cost-governance-contract.json', import.meta.url)));

function validateProducer(meta) {
  const missing = contract.required_fields.filter((field) => meta[field] === undefined || meta[field] === null || meta[field] === '');
  return { ready: missing.length === 0, missing };
}

test('new Make producer fails closed without mandatory cost-governance metadata', () => {
  const r = validateProducer({
    criticality_class: 'STANDARD_OPERATIONAL',
    universal_event_ingest: 'BG211',
  });
  assert.equal(r.ready, false);
  assert.ok(r.missing.includes('data_transfer_budget'));
  assert.ok(r.missing.includes('dedupe_key'));
});

test('complete Make producer contract is production-ready', () => {
  const r = validateProducer({
    credit_budget: 100,
    data_transfer_budget: 5_000_000,
    max_payload_policy: 'references_only_over_256kb',
    page_batch_window_limit: 'page<=25,batch<=10,lookback<=24h',
    dedupe_key: 'scenario|event|object',
    criticality_class: 'CRITICAL_PUBLISHING',
    degradation_strategy: 'preserve_publish_shrink_payloads_first',
    outcome_proof_signal: 'native_post_id',
    universal_event_ingest: 'BG211',
  });
  assert.equal(r.ready, true);
  assert.deepEqual(r.missing, []);
});
