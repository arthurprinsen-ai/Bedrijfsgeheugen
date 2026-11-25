import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPageAssurance, normalizeAnswerAssurance } from '../portal-v2/trusted-advisor-assurance.js';

test('Brain trusted-advisor assurance fails closed without evidence',()=>{
  const result=buildPageAssurance({pageId:'advies',state:{}});
  assert.equal(result.status,'insufficient_evidence');
  assert.ok(result.uncertainty.length>0);
});

test('Brain trusted-advisor assurance distinguishes grounded from independently verified claims',()=>{
  const state={portal:{runtime:{sources:{updatedAt:'2026-09-20T08:00:00Z',items:[{naam:'CRM',healthy:true}]},audit:{items:[{naam:'a1'}]}}}};
  const result=buildPageAssurance({pageId:'advies',state});
  assert.equal(result.status,'grounded');
  const answer=normalizeAnswerAssurance({status:'grounded',source:'tenant state'});
  assert.equal(answer.claimVerification,'not_independently_verified');
});

test('unknown source health never becomes green merely because it is not false',()=>{
  const state={portal:{runtime:{sources:{updatedAt:'2026-11-12T12:00:00Z',items:[{naam:'Onbekende bron'}]}}}};
  const result=buildPageAssurance({pageId:'advies',state});
  assert.equal(result.healthySourceCount,0);
  assert.equal(result.status,'insufficient_evidence');
});

test('generic ok status and a healthy flag never prove an independently verified outcome',()=>{
  const state={portal:{runtime:{outcomes:{items:[{status:'ok',healthy:true}]}}}};
  const result=buildPageAssurance({pageId:'outcomes-evidence',state});
  assert.notEqual(result.status,'verified');
  assert.ok(result.uncertainty.some(gap=>gap.includes('onafhankelijke verificatie')));
});

test('verified outcome state requires evidence for every displayed outcome',()=>{
  const proof={verificationState:'verified',evidenceRef:'provider:receipt-123'};
  const state={portal:{runtime:{outcomes:{items:[proof]}}}};
  assert.equal(buildPageAssurance({pageId:'outcomes-evidence',state}).status,'verified');
  state.portal.runtime.outcomes.items.push({status:'ok'});
  assert.notEqual(buildPageAssurance({pageId:'outcomes-evidence',state}).status,'verified');
});
