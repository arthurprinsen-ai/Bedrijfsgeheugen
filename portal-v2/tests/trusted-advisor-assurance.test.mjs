import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPageAssurance,normalizeAnswerAssurance,TRUST_STATES} from '../trusted-advisor-assurance.js';

test('trust states are explicit without invented percentages',()=>{ assert.equal(JSON.stringify(TRUST_STATES).includes('%'),false); });
test('empty state fails closed',()=>{ const t=buildPageAssurance({pageId:'advies',state:{}}); assert.equal(t.status,'insufficient_evidence'); assert.ok(t.uncertainty.length); });
test('runtime evidence becomes source-bound',()=>{ const t=buildPageAssurance({pageId:'advies',state:{portal:{runtime:{sources:{updatedAt:'2026-09-20T08:00:00Z',items:[{naam:'CRM',healthy:true},{naam:'Finance',healthy:false}]},audit:{items:[{naam:'r1'}]}}}}}); assert.equal(t.status,'grounded'); assert.equal(t.sourceCount,2); assert.equal(t.healthySourceCount,1); });
test('verified outcomes require explicit independent provider proof',()=>{ const source={naam:'CRM',healthy:true}; const withoutProof=buildPageAssurance({pageId:'outcomes-evidence',state:{portal:{runtime:{sources:{items:[source]},outcomes:{items:[{naam:'x',healthy:true,status:'ok'}]}}}}}); assert.notEqual(withoutProof.status,'verified'); const withProof=buildPageAssurance({pageId:'outcomes-evidence',state:{portal:{runtime:{sources:{items:[source]},outcomes:{items:[{naam:'x',healthy:true,status:'ok',providerReadbackVerified:true,evidenceRef:'provider:readback-123'}]}}}}}); assert.equal(withProof.status,'verified'); });
test('answer assurance defaults to not independently verified',()=>{ const a=normalizeAnswerAssurance({status:'grounded',source:'tenant state'}); assert.equal(a.claimVerification,'not_independently_verified'); });

test('answer verification label fails closed without an evidence reference',()=>{
  const result=normalizeAnswerAssurance({status:'verified',source:'Tenantprojectie',claimVerification:'independently_verified'});
  assert.equal(result.status,'unverified');
  assert.equal(result.statusLabel,'Niet onafhankelijk geverifieerd');
  assert.ok(result.limitations.some(x=>x.includes('bewijsreferentie')));
});
test('answer verification label fails closed on contradictory verification flags',()=>{
  const result=normalizeAnswerAssurance({status:'verified',source:'Tenantprojectie',claimVerification:'not_independently_verified',evidenceRef:'provider:123'});
  assert.equal(result.status,'unverified');
});
test('answer verification label needs both explicit verification and traceable evidence',()=>{
  const result=normalizeAnswerAssurance({status:'verified',source:'Tenantprojectie',claimVerification:'independently_verified',evidenceRef:'provider:123'});
  assert.equal(result.status,'verified');
  assert.equal(result.evidenceRef,'provider:123');
});
test('source-bound answer requires a named source',()=>{
  const result=normalizeAnswerAssurance({status:'grounded'});
  assert.equal(result.status,'unverified');
  assert.equal(result.source,'Geen bron opgegeven');
});

test('verified answer fails closed without identifiable source',()=>{
  const result=normalizeAnswerAssurance({status:'verified',claimVerification:'independently_verified',evidenceRef:'provider:123'});
  assert.equal(result.status,'unverified');
});
