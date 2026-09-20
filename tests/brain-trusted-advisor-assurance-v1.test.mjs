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
