import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSPORT_STATUS,
  createDataAiPassport,
  deriveEvidenceStatus,
  passportCoverage,
  publicPassportView,
} from '../portal/data-ai-passport.mjs';

const evidence = (reference = 'EV-1') => ({
  type: 'runtime',
  source: 'Make',
  reference,
  checkedAt: '2026-09-01T20:00:00.000Z',
});

test('verified status is impossible without evidence', () => {
  assert.equal(deriveEvidenceStatus({ value: 'EU', requestedStatus: 'verified', evidence: [] }), PASSPORT_STATUS.NEEDS_EVIDENCE);
  assert.equal(deriveEvidenceStatus({ value: 'EU', requestedStatus: 'verified', evidence: [evidence()] }), PASSPORT_STATUS.VERIFIED);
});

test('configured values without runtime or contractual evidence stay configured', () => {
  assert.equal(deriveEvidenceStatus({ value: '30 dagen', requestedStatus: 'configured', evidence: [] }), PASSPORT_STATUS.CONFIGURED);
});

test('unknown values remain needs_evidence and are never converted to green claims', () => {
  assert.equal(deriveEvidenceStatus({ value: null, requestedStatus: 'verified', evidence: [evidence()] }), PASSPORT_STATUS.NEEDS_EVIDENCE);
});

test('passport records Make EU zone evidence but does not infer storage country or EU-only processing', () => {
  const passport = createDataAiPassport({
    tenantId: 'asteriq',
    tenantName: 'Asteriq Groep',
    ownership: { owner: 'Asteriq Groep', requestedStatus: 'configured' },
    automation: [{
      provider: 'Make',
      role: 'orchestrator',
      zone: 'eu1.make.com',
      state: 'paused',
      requestedStatus: 'verified',
      evidence: [evidence('MAKE-ENV-8354941-2138086')],
    }],
  });

  assert.equal(passport.automation[0].status, PASSPORT_STATUS.VERIFIED);
  assert.equal(passport.automation[0].zone, 'eu1.make.com');
  assert.equal(passport.storage.length, 0);
  assert.equal(passport.assertions.allDataWithinEer.status, PASSPORT_STATUS.NEEDS_EVIDENCE);
});

test('AI Act use cases are classified per use case, never as one generic platform compliance boolean', () => {
  const passport = createDataAiPassport({
    tenantId: 'asteriq',
    aiSystems: [{
      provider: 'Example provider',
      model: 'model-x',
      purpose: 'Samenvatten van interne procedures',
      aiAct: { role: 'deployer', riskClass: 'unclassified' },
    }],
  });

  assert.equal(passport.aiSystems[0].aiAct.status, PASSPORT_STATUS.NEEDS_EVIDENCE);
  assert.equal(Object.hasOwn(passport, 'euAiActCompliant'), false);
  assert.equal(Object.hasOwn(passport, 'complianceScore'), false);
});

test('coverage is evidence coverage, not a compliance score', () => {
  const passport = createDataAiPassport({
    tenantId: 'asteriq',
    ownership: { owner: 'Asteriq Groep', requestedStatus: 'verified', evidence: [evidence('OWN-1')] },
    storage: [{ provider: 'Cloud', country: null }],
  });
  const coverage = passportCoverage(passport);
  assert.equal(coverage.label, 'Bewijsdekking');
  assert.ok(coverage.verified < coverage.total);
  assert.equal(Object.hasOwn(coverage, 'compliance'), false);
});

test('public view strips internal scenario identifiers and raw evidence references', () => {
  const passport = createDataAiPassport({
    tenantId: 'asteriq',
    automation: [{
      provider: 'Make', role: 'orchestrator', zone: 'eu1.make.com', scenarioIds: [7065224],
      requestedStatus: 'verified', evidence: [evidence('MAKE-SCENARIO-7065224')],
    }],
  });
  const view = publicPassportView(passport);
  const json = JSON.stringify(view);
  assert.equal(json.includes('7065224'), false);
  assert.equal(json.includes('MAKE-SCENARIO-7065224'), false);
  assert.equal(view.automation[0].provider, 'Make');
});
