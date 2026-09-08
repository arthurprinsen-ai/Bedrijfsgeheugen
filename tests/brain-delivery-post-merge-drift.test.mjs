import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBranchDrift } from '../tools/brain-delivery-system.mjs';

test('already-integrated feature head is never reclassified as moving-main overlap', () => {
  const result = evaluateBranchDrift({
    featurePaths:['portal-v2/index.html','portal-v2/csrd-impact.js'],
    mainDriftPaths:['portal-v2/index.html','portal-v2/csrd-impact.js'],
    featureContracts:['customer-portal-identity'],
    mainDriftContracts:['customer-portal-identity'],
    mergeable:true,
    headIntegrated:true
  });
  assert.deepEqual(result, {
    action:'KEEP_TESTED_FEATURE',
    reason:'head-already-integrated',
    overlap:[],
    contractOverlap:[]
  });
});
