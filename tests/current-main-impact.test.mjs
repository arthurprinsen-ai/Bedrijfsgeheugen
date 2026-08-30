import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImpactDecision, inferContractDomains } from '../tools/current-main-impact.mjs';

test('non-overlapping unrelated main movement stays green without rebuild', () => {
  const decision = buildImpactDecision({
    candidateFiles: ['portal/customer-login.html', 'tests/customer-login.test.mjs'],
    mainFiles: ['docs/brain/architecture.md', 'README.md'],
  });
  assert.equal(decision.safe, true);
  assert.equal(decision.requiresRefresh, false);
  assert.deepEqual(decision.fileOverlap, []);
  assert.deepEqual(decision.contractOverlap, []);
});

test('same changed file requires refresh', () => {
  const decision = buildImpactDecision({
    candidateFiles: ['portal/customer-login.html'],
    mainFiles: ['portal/customer-login.html'],
  });
  assert.equal(decision.safe, false);
  assert.deepEqual(decision.fileOverlap, ['portal/customer-login.html']);
});

test('different files in the same delivery contract require refresh', () => {
  const decision = buildImpactDecision({
    candidateFiles: ['tools/delivery-preflight.mjs'],
    mainFiles: ['config/delivery-prevention-rules.json'],
  });
  assert.equal(decision.safe, false);
  assert.deepEqual(decision.contractOverlap, ['delivery:brain']);
});

test('supabase schema changes collide at contract level even across different migrations', () => {
  const decision = buildImpactDecision({
    candidateFiles: ['supabase/migrations/20260830_add_roles.sql'],
    mainFiles: ['supabase/migrations/20260830_add_tenants.sql'],
  });
  assert.equal(decision.safe, false);
  assert.deepEqual(decision.contractOverlap, ['data:supabase-schema']);
});

test('contract inference covers external integration contract artifacts', () => {
  assert.deepEqual(inferContractDomains('integrations/dataforseo/client-contract.json'), ['integration:dataforseo']);
  assert.ok(inferContractDomains('notion/customer-mapping-schema.json').includes('integration:notion'));
  assert.ok(inferContractDomains('make/scenario-contract.json').includes('integration:make'));
});
