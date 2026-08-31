import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='brain/learning/incidents/moving-main-pr-status-stale-readback-2026-08-31.json';

test('moving-main PR replacement learning is fail-closed and deduplicating', async () => {
  const incident=JSON.parse(await readFile(path,'utf8'));
  assert.equal(incident.fingerprint,'github|pr|moving-main|stale-merge-status-caused-duplicate-reconstruction-v1');
  assert.equal(incident.status,'PROVEN_AND_CONTAINED');
  assert.equal(incident.regressionContract.replacementRequiresFreshOriginalPrRead,true);
  assert.equal(incident.regressionContract.replacementRequiresFreshMainRead,true);
  assert.equal(incident.regressionContract.mergedOriginalBlocksReplacement,true);
  assert.equal(incident.regressionContract.equivalentContentAlreadyOnMainBlocksReplacement,true);
  assert.equal(incident.regressionContract.duplicateCandidateMustBeClosed,true);
  assert.ok(incident.preventionRules.includes('Never create a semantic replacement from mergeable=false alone.'));
  assert.ok(incident.relatedRules.includes('CONSOLIDATE_PARALLEL_IDENTICAL_CANDIDATES'));
  assert.ok(incident.relatedRules.includes('SINGLE_CANONICAL_REMEDIATION_OWNER_PER_ROOT_CAUSE'));
});
