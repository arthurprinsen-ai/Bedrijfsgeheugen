import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGrowthLearningEngine } from '../tools/growth-intelligence/learning-store.mjs';

const OUTCOME = { actionId: 'a', evidenceId: 'e', result: 'WIN' };
const ack = (status, scope, key, legacyKey, extra = {}) => ({ status, epoch: '4', scope, key, legacyKey, transactionVerified: true, ...extra });

function memoryStore() {
  const db = new Map();
  return {
    db,
    get: async key => db.get(key),
    insertIfAbsentWithCutoverFence: async ({ scope, legacyKey, key, record }) => {
      if (db.has(legacyKey)) return ack('LEGACY_EXISTS', scope, key, legacyKey);
      if (db.has(key)) return ack('V2_EXISTS', scope, key, legacyKey);
      db.set(key, record);
      return ack('INSERTED', scope, key, legacyKey);
    },
  };
}

test('een store zonder atomaire fence-transactie wordt geweigerd', () => {
  assert.throws(() => makeGrowthLearningEngine({ get: async () => undefined, put: async () => {} }), /ATOMIC_PERSISTENT_STORE_REQUIRED/);
});

test('twintig gelijktijdige schrijvers leveren precies één insert op', async () => {
  const store = memoryStore();
  const results = await Promise.all(Array.from({ length: 20 }, () => makeGrowthLearningEngine(store).recordOutcome(OUTCOME)));
  assert.equal(results.filter(r => r.status === 'RECORDED').length, 1);
  assert.equal(results.filter(r => r.status === 'DUPLICATE').length, 19);
  assert.equal(store.db.size, 1);
});

test('een bevestiging zonder transactionVerified of met verkeerde sleutel wordt geweigerd', async () => {
  const unverified = { get: async () => undefined, insertIfAbsentWithCutoverFence: async ({ scope, key, legacyKey }) => ({ status: 'INSERTED', epoch: '4', scope, key, legacyKey }) };
  await assert.rejects(() => makeGrowthLearningEngine(unverified).recordOutcome(OUTCOME), /ATOMIC_CUTOVER_ACK_REQUIRED/);
  const wrongKey = { get: async () => undefined, insertIfAbsentWithCutoverFence: async ({ scope, legacyKey }) => ack('INSERTED', scope, 'andere-sleutel', legacyKey) };
  await assert.rejects(() => makeGrowthLearningEngine(wrongKey).recordOutcome(OUTCOME), /ATOMIC_CUTOVER_ACK_REQUIRED/);
});

test('een duplicaat met afwijkende inhoud is een conflict, geen stil succes', async () => {
  const store = { get: async () => ({ ...OUTCOME, result: 'LOSE' }), insertIfAbsentWithCutoverFence: async ({ scope, key, legacyKey }) => ack('LEGACY_EXISTS', scope, key, legacyKey) };
  await assert.rejects(() => makeGrowthLearningEngine(store).recordOutcome(OUTCOME), /IDEMPOTENCY_KEY_CONFLICT_OR_UNREADABLE/);
});

test('betaalbewijs komt van de provider, niet van een vlag in de uitkomst', async () => {
  const paid = { actionId: 'a', evidenceId: 'e', result: 'VERIFIED_PAID', amount: 2900, paymentReference: 'pay_1', providerVerified: true };
  await assert.rejects(() => makeGrowthLearningEngine(memoryStore()).recordOutcome(paid), /INDEPENDENT_PAYMENT_PROOF_REQUIRED/);
  const verifyPayment = async p => ({ verified: true, ...p, providerEvidenceId: 'prov-1' });
  const store = memoryStore();
  const out = await makeGrowthLearningEngine(store, { verifyPayment }).recordOutcome(paid);
  assert.equal(out.status, 'RECORDED');
  const saved = [...store.db.values()][0];
  assert.equal(saved.verifiedPaymentEvidence.providerEvidenceId, 'prov-1');
  const mismatch = async p => ({ verified: true, ...p, amount: 1, providerEvidenceId: 'prov-1' });
  await assert.rejects(() => makeGrowthLearningEngine(memoryStore(), { verifyPayment: mismatch }).recordOutcome(paid), /INDEPENDENT_PAYMENT_PROOF_REQUIRED/);
});

test('v2-sleutels botsen niet wanneer ids een dubbele punt bevatten', async () => {
  const store = memoryStore();
  const engine = makeGrowthLearningEngine(store);
  await engine.recordOutcome({ actionId: 'a:b', evidenceId: 'c', result: 'WIN' });
  await engine.recordOutcome({ actionId: 'a', evidenceId: 'b:c', result: 'WIN' });
  assert.equal(store.db.size, 2);
});
