import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_RISK_CLASS,
  ACTION_STATES,
  normalizeEvidenceEnvelope,
  assertTenantScoped,
  valueKind,
  canAutoExecute
} from '../portal-v2/operating-system/contracts.js';

test('normalizes a complete tenant-scoped evidence envelope',()=>{
  const out=normalizeEvidenceEnvelope({
    id:'x1',tenant_id:'t1',entity_type:'signal',source_refs:['s1'],provenance:'supabase',
    freshness_at:'2026-09-16T18:00:00Z',confidence:.8,model_or_formula_version:'v1',
    observed_at:'2026-09-16T17:59:00Z',updated_at:'2026-09-16T18:00:00Z'
  },'t1');
  assert.equal(out.tenant_id,'t1');
  assert.equal(out.confidence,.8);
  assert.deepEqual(out.source_refs,['s1']);
  assert.throws(()=>{out.source_refs.push('s2')});
});

test('fails closed on tenant mismatch and incomplete evidence',()=>{
  assert.throws(()=>assertTenantScoped({tenant_id:'other'},'t1'),/TENANT_SCOPE_MISMATCH/);
  assert.throws(()=>normalizeEvidenceEnvelope({id:'x',tenant_id:'t1'},'t1'),/EVIDENCE_ENVELOPE_INCOMPLETE/);
});

test('keeps value kinds explicit',()=>{
  assert.equal(valueKind({kind:'estimated',amount:10}),'estimated');
  assert.equal(valueKind({kind:'forecast',amount:10}),'forecast');
  assert.equal(valueKind({kind:'realized',amount:10}),'realized');
  assert.throws(()=>valueKind({amount:10}),/VALUE_KIND_REQUIRED/);
});

test('class 3 never auto-executes and class 1 requires all safety gates',()=>{
  assert.equal(ACTION_RISK_CLASS.EXTERNAL,3);
  assert.ok(ACTION_STATES.includes('APPROVAL_REQUIRED'));
  assert.equal(canAutoExecute({risk_class:3,approved:true,tenant_id:'t1',provenance:'x',identity_verified:true}),false);
  assert.equal(canAutoExecute({risk_class:1,tenant_id:'t1',provenance:'x',identity_verified:true,permission_verified:true}),true);
  assert.equal(canAutoExecute({risk_class:1,tenant_id:'t1',identity_verified:true,permission_verified:true}),false);
});
