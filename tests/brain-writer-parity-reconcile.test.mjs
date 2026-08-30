import test from 'node:test';
import assert from 'node:assert/strict';
import { applyParityRollbackEvidence, computeMainProtectionReady, computeWriterMigrationReady } from '../scripts/brain/writer-certification-state.mjs';

const writer=(name='weekblog')=>({name,candidateMode:'operational_verified',structuralContractVerified:true,operationalCandidateVerified:true,parityVerified:false,rollbackVerified:false,merged:true});
const evidence=(name='weekblog')=>({contract:'BRAIN-DELIVERY-v2',truth_status:'VERIFIED',status:'COMPLETED',proof:'writer-parity-rollback',writer:name,parityVerified:true,rollbackVerified:true,outcome_router:'BG168',current_state_projection:'BG167',evidenceRef:`github-run:${name}`});
const CURRENT_MAIN_SHA='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REQUIRED_CHECKS=['Shared Agent Memory Tests','BRAIN delivery'];
const nativeProtection=(overrides={})=>({observed:true,protected:true,rulesetsCount:1,observedMainSha:CURRENT_MAIN_SHA,requiredChecks:[...REQUIRED_CHECKS],...overrides});
const options={currentMainSha:CURRENT_MAIN_SHA,requiredChecks:REQUIRED_CHECKS};

test('verified parity rollback evidence promotes only the two proof dimensions',()=>{
  const w=writer();
  assert.equal(applyParityRollbackEvidence(w,evidence()),true);
  assert.equal(w.parityVerified,true);
  assert.equal(w.rollbackVerified,true);
  assert.equal(w.candidateMode,'operational_verified');
  assert.equal(w.parityRollbackEvidence.evidenceRef,'github-run:weekblog');
});

test('parity reconciliation fails closed on incomplete lineage or non-operational writer',()=>{
  const w=writer(); w.operationalCandidateVerified=false;
  assert.throws(()=>applyParityRollbackEvidence(w,evidence()),/OPERATIONAL_CANDIDATE_NOT_VERIFIED/);
  const e=evidence(); e.current_state_projection='wrong';
  assert.throws(()=>applyParityRollbackEvidence(writer(),e),/INVALID_PARITY_ROLLBACK_EVIDENCE/);
});

test('writer migration readiness requires every writer proof dimension and remains distinct from fresh native main protection',()=>{
  const a=writer('a-writer'), b=writer('b-writer');
  applyParityRollbackEvidence(a,evidence('a-writer'));
  applyParityRollbackEvidence(b,evidence('b-writer'));
  assert.equal(computeWriterMigrationReady([a,b]),true);
  assert.equal(computeMainProtectionReady([a,b],undefined,options),false,
    'writer proof alone must never imply native GitHub main protection');
  assert.equal(computeMainProtectionReady([a,b],nativeProtection(),options),true);
  assert.equal(computeMainProtectionReady([a,b],nativeProtection({protected:false}),options),false);
  assert.equal(computeMainProtectionReady([a,b],nativeProtection({rulesetsCount:0}),options),false);
  assert.equal(computeMainProtectionReady([a,b],nativeProtection({observedMainSha:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'}),options),false);
  b.rollbackVerified=false;
  assert.equal(computeWriterMigrationReady([a,b]),false);
  assert.equal(computeMainProtectionReady([a,b],nativeProtection(),options),false);
  assert.equal(computeWriterMigrationReady([]),false);
  assert.equal(computeMainProtectionReady([],nativeProtection(),options),false);
});