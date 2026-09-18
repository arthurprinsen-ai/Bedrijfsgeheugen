import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertIsolatedRestoreTarget,
  validateOwnerMfa,
  validateDrProof,
  validateCredentialRotations,
  validateIamReview,
  validateEngineeringGates,
  buildSecurityOperationsReport,
} from '../scripts/brain/security-operations-proof.mjs';

const base = () => ({
  fingerprint: 'powerhouse-security-operations-closure-v1',
  database_hardening: {status:'LIVE & BEWEZEN', tables:121, deny_all:103, policy_tables:18, policy_required_missing:0, rls_disabled:0},
  owner_mfa: {status:'verified', mfa_enabled:true, evidence:'provider-readback', verified_at:'2026-09-16T20:00:00Z'},
  dr_restore: {status:'verified', isolated_target:true, target_environment:'dr-ephemeral', source_environment:'production', production_target:false, restore_completed:true, application_smoke:true, data_integrity:true, rto_seconds:600, rpo_seconds:90, evidence:'dr-run-1', verified_at:'2026-09-16T20:00:00Z'},
  credential_rotations: [{credential_id:'netlify-api',status:'verified',rotated:true,consumer_reconnected:true,old_credential_rejected:true,runtime_healthy:true,rollback_proven:true,evidence:'rotation-run-1',verified_at:'2026-09-16T20:00:00Z'}],
  iam_review: {status:'verified',reviewed_at:'2026-09-16T20:00:00Z',next_review_at:'2026-12-16T20:00:00Z',providers:[
    {provider:'GitHub',inventory_complete:true,access_levels_reviewed:true,service_accounts_reviewed:true,unused_access_reviewed:true,mfa_status:'verified',least_privilege:true,evidence:'github-iam'},
    {provider:'Netlify',inventory_complete:true,access_levels_reviewed:true,service_accounts_reviewed:true,unused_access_reviewed:true,mfa_status:'manual_attested',least_privilege:true,evidence:'netlify-iam'},
    {provider:'Notion',inventory_complete:true,access_levels_reviewed:true,service_accounts_reviewed:true,unused_access_reviewed:true,mfa_status:'manual_attested',least_privilege:true,evidence:'notion-iam'},
    {provider:'Buffer',inventory_complete:true,access_levels_reviewed:true,service_accounts_reviewed:true,unused_access_reviewed:true,mfa_status:'manual_attested',least_privilege:true,evidence:'buffer-iam'}]},
  engineering_gates: {
    auth_db_pool: {classification:'engineering_gate',current_mode:'fixed',current_value:10,scale_change_blocked_until_percentage_test:true,evidence_required:['load-test','connection-saturation','rollback']},
    unused_indexes: {classification:'engineering_gate',zero_scans_not_sufficient:true,drop_requires:['representative-workload','query-plan-before-after','rollback-plan']}
  }
});

test('owner management-plane MFA cannot be green without affirmative readback',()=>{
  const r=validateOwnerMfa({status:'verified',mfa_enabled:false,evidence:'dashboard'});
  assert.equal(r.ok,false); assert.match(r.obligations.join('\n'),/mfa_enabled=true/);
});

test('DR guard rejects production-like restore targets and the production project ref',()=>{
  for (const target of ['production','prod','https://abc.supabase.co']) assert.throws(()=>assertIsolatedRestoreTarget({targetEnvironment:target, productionProjectRef:'abc'}),/isolated non-production/i);
  assert.throws(()=>assertIsolatedRestoreTarget({targetEnvironment:'dr-ephemeral',targetProjectRef:'abc',productionProjectRef:'abc'}),/isolated non-production/i);
  assert.doesNotThrow(()=>assertIsolatedRestoreTarget({targetEnvironment:'dr-ephemeral-20260916',targetProjectRef:'xyz',productionProjectRef:'abc'}));
});

test('DR proof requires restore, app smoke, data integrity and measured RTO/RPO',()=>{
  const r=validateDrProof({...base().dr_restore,rto_seconds:null}); assert.equal(r.ok,false); assert.match(r.obligations.join('\n'),/RTO/i);
});

test('credential rotation proof requires old credential rejection and rollback proof',()=>{
  const r=validateCredentialRotations([{...base().credential_rotations[0],old_credential_rejected:false}]);
  assert.equal(r.ok,false); assert.match(r.obligations.join('\n'),/old credential/i);
});

test('IAM review covers required providers and never treats unknown MFA as verified',()=>{
  const iam=structuredClone(base().iam_review); iam.providers.find(x=>x.provider==='Buffer').mfa_status='unknown';
  const r=validateIamReview(iam); assert.equal(r.ok,false); assert.match(r.obligations.join('\n'),/Buffer.*MFA/i);
});

test('engineering safeguards classify pool/index work as gates rather than defects',()=>{
  const r=validateEngineeringGates(base().engineering_gates); assert.equal(r.ok,true); assert.deepEqual(r.gaps,[]);
});

test('database hardening stays proven while open operations evidence holds overall status',()=>{
  const input=base(); input.owner_mfa={status:'human_action_required',mfa_enabled:false,evidence:'management-plane MFA off'};
  const report=buildSecurityOperationsReport(input);
  assert.equal(report.database_hardening_status,'LIVE & BEWEZEN');
  assert.equal(report.status,'DEELS LIVE');
  assert.ok(report.open_obligations.some(x=>x.includes('Owner MFA')));
});

test('complete evidence yields deterministic LIVE & BEWEZEN operations closure',()=>{
  const report=buildSecurityOperationsReport(base());
  assert.equal(report.status,'LIVE & BEWEZEN'); assert.deepEqual(report.gaps,[]); assert.deepEqual(report.open_obligations,[]);
});
