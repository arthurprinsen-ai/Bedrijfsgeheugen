import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateProducerRegistration,
  validateProducerRegistry,
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

  const uncovered = checkChangedProducerPaths(['unknown-runtime/new-publisher/flow.json'], registry);
  assert.equal(uncovered.ok, false);
  assert.deepEqual(uncovered.uncovered, ['unknown-runtime/new-publisher/flow.json']);
});

test('estate-wide registry covers current platforms and future integration namespaces', async () => {
  const doc = JSON.parse(await readFile('config/universal-event-producers.json', 'utf8'));
  assert.equal(validateProducerRegistry(doc.producers).ok, true);
  const paths = [
    'make/contracts/new-agent/flow.json',
    'automation/contracts/new-runner/contract.json',
    '.github/workflows/new-delivery.yml',
    'netlify/functions/new-runtime.mjs',
    'notion/contracts/new-writer.json',
    'supabase/migrations/20260901_new.sql',
    'dataforseo/contracts/new-query.json',
    'integrations/future-provider/adapter.mjs',
    'connectors/future-provider/contract.json',
    'apps/future-provider/runtime.mjs',
  ];
  const result = checkChangedProducerPaths(paths, doc.producers);
  assert.equal(result.ok, true, `uncovered: ${result.uncovered.join(', ')}`);
});

test('unknown runtime namespace remains fail-closed instead of silently bypassing the Brain', async () => {
  const doc = JSON.parse(await readFile('config/universal-event-producers.json', 'utf8'));
  const result = checkChangedProducerPaths(['unknown-runtime/provider/action.mjs'], doc.producers);
  assert.equal(result.ok, false);
  assert.deepEqual(result.uncovered, ['unknown-runtime/provider/action.mjs']);
});
