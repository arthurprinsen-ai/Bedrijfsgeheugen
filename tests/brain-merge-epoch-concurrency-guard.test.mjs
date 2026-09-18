import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMergeEpoch } from '../brain/production/continuous-delivery-v2.mjs';

const sha = c => c.repeat(40);

test('merge epoch is green only for exact current main and held landing lease', () => {
  const head=sha('a');
  const main=sha('b');
  const result=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:main,
    current_main_sha:main,
    behind_by:0,
    mergeable:true,
    merge_conflict:false,
    landing_lease:{status:'HELD',candidate_head:head,main_sha:main}
  });
  assert.equal(result.ok,true);
  assert.equal(result.decision,'MERGE_EPOCH_GREEN');
});

test('moving main invalidates stale green landing proof', () => {
  const head=sha('a');
  const result=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:sha('b'),
    current_main_sha:sha('c'),
    behind_by:0,
    mergeable:true,
    landing_lease:{status:'HELD',candidate_head:head,main_sha:sha('b')}
  });
  assert.equal(result.ok,false);
  assert.equal(result.reason,'main_epoch_moved_after_gate');
  assert.equal(result.action,'RECONCILE_AND_REPROVE');
});

test('behind or conflicted candidate cannot enter protected landing', () => {
  const head=sha('a');
  const main=sha('b');
  const behind=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:main,
    current_main_sha:main,
    behind_by:10,
    mergeable:true,
    landing_lease:{status:'HELD',candidate_head:head,main_sha:main}
  });
  assert.equal(behind.ok,false);
  assert.equal(behind.reason,'candidate_behind_current_main');

  const conflict=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:main,
    current_main_sha:main,
    behind_by:0,
    mergeable:false,
    merge_conflict:true,
    landing_lease:{status:'HELD',candidate_head:head,main_sha:main}
  });
  assert.equal(conflict.ok,false);
  assert.equal(conflict.reason,'merge_conflict_reconcile_required');
});

test('stale or missing landing lease fails closed', () => {
  const head=sha('a');
  const main=sha('b');
  const missing=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:main,
    current_main_sha:main,
    behind_by:0,
    mergeable:true,
    landing_lease:{status:'FREE'}
  });
  assert.equal(missing.reason,'landing_lease_not_held');

  const stale=evaluateMergeEpoch({
    required:true,
    candidate_head:head,
    tested_head:head,
    gate_main_sha:main,
    current_main_sha:main,
    behind_by:0,
    mergeable:true,
    landing_lease:{status:'HELD',candidate_head:head,main_sha:sha('c')}
  });
  assert.equal(stale.reason,'landing_lease_identity_stale');
});
