import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProducerRegistration,
  checkChangedProducerPaths,
} from '../tools/universal-event-contract-check.mjs';

const valid = {
  producer_id: 'bg210',
  source_system: 'make',
  path_patterns: ['make/contracts/bg210/'],
  adapter_owner: 'BG211',
  retention_class: 'tiered-v1',
  idempotency_key: 'publish_command_id',
  outcome_evidence: 'BG164/BG194 public proof',
  brain_writeback: 'BG168/BG166',
  cost_guard: 'bounded scheduled guardian',
};

test('valid producer registration satisfies universal event contract', () => {
  assert.deepEqual(validateProducerRegistration(valid), { ok: true, missing: [] });
});

test('producer without retention or adapter ownership is rejected', () => {
  const result = validateProducerRegistration({ ...valid, retention_class: '', adapter_owner: '' });
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('retention_class'));
  assert.ok(result.missing.includes('adapter_owner'));
});

test('changed producer path must resolve to a registered native producer or legacy adapter owner', () => {
  const registry = [valid];
  const covered = checkChangedProducerPaths(['make/contracts/bg210/publisher.json'], registry);
  assert.equal(covered.ok, true);
  assert.deepEqual(covered.uncovered, []);

  const uncovered = checkChangedProducerPaths(['make/contracts/new-publisher/flow.json'], registry);
  assert.equal(uncovered.ok, false);
  assert.deepEqual(uncovered.uncovered, ['make/contracts/new-publisher/flow.json']);
});
