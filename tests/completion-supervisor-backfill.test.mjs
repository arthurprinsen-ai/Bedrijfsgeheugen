import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyBackfillRecord,
  buildBackfillPlan,
  applyBackfillPlan,
} from '../tools/completion-supervisor-backfill.mjs';

test('partial and failed historical results reopen the same obligation lineage', () => {
  for (const record of [
    { idempotencyKey:'K1', obligationId:'O1', status:'DEELS LIVE' },
    { idempotencyKey:'K2', obligationId:'O2', status:'NOT_CLAIMED' },
    { idempotencyKey:'K3', obligationId:'O3', conclusion:'failure' },
    { idempotencyKey:'K4', obligationId:'O4', conclusion:'cancelled' },
    { idempotencyKey:'K5', obligationId:'O5', conclusion:'skipped' },
  ]) {
    const result = classifyBackfillRecord(record);
    assert.equal(result.action, 'REOPEN_ACTIVE');
    assert.equal(result.idempotencyKey, record.idempotencyKey);
  }
});

test('wrongly resolved hard-boundary work becomes waiting work, never success', () => {
  const result = classifyBackfillRecord({ idempotencyKey:'K1', obligationId:'O1', status:'Resolved', hardBoundary:{ proven:true } });
  assert.equal(result.action, 'REOPEN_WAITING');
  assert.equal(result.success, false);
});

test('valid LIVE_VERIFIED evidence remains closed', () => {
  const result = classifyBackfillRecord({ idempotencyKey:'K1', obligationId:'O1', status:'LIVE_VERIFIED', liveVerifiedEvidence:true });
  assert.equal(result.action, 'KEEP_CLOSED');
  assert.equal(result.success, true);
});

test('backfill plan deduplicates repeated snapshots by durable idempotency key', () => {
  const plan = buildBackfillPlan([
    { idempotencyKey:'K1', obligationId:'O1', status:'DEELS LIVE' },
    { idempotencyKey:'K1', obligationId:'O1', status:'MISSED_OBLIGATION' },
  ]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].idempotencyKey, 'K1');
  assert.equal(plan[0].action, 'REOPEN_ACTIVE');
});

test('apply writes one idempotent reconciliation event to the existing evidence lineage', async () => {
  const rows = [];
  const evidenceStore = {
    async putIfAbsent(record) {
      const existing = rows.find(row => row.idempotencyKey === record.idempotencyKey && row.ref === record.ref);
      if (existing) return { created:false, record:existing };
      rows.push(record);
      return { created:true, record };
    },
  };
  const plan = buildBackfillPlan([{ idempotencyKey:'K1', obligationId:'O1', status:'DEELS LIVE', candidateIdentity:'C1' }]);
  const first = await applyBackfillPlan(plan, { evidenceStore });
  const second = await applyBackfillPlan(plan, { evidenceStore });
  assert.equal(rows.length, 1);
  assert.equal(first[0].created, true);
  assert.equal(second[0].created, false);
  assert.equal(rows[0].type, 'BACKFILL_RECONCILIATION');
  assert.equal(rows[0].idempotencyKey, 'K1');
});
