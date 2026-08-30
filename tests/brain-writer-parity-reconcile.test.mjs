import test from 'node:test';
import assert from 'node:assert/strict';
import { applyParityRollbackEvidence, computeMainProtectionReady } from '../scripts/brain/writer-certification-state.mjs';

const writer=()=>({name:'weekblog',candidateMode:'operational_verified',structuralContractVerified:true,operationalCandidateVerified:true,parityVerified:false,rollbackVerified:false,merged:true});
const evidence=()=>({contract:'BRAIN-DELIVERY-v2',truth_status:'VERIFIED',status:'COMPLETED',proof:'writer-parity-rollback',writer:'weekblog',parityVerified:true,rollbackVerified:true,outcome_router:'BG168',current_state_projection:'BG167',evidenceRef:'github-run:1'});

test('verified parity rollback evidence promotes only an already operational writer',()=>{
 const w=writer();
 assert.equal(applyParityRollbackEvidence(w,evidence()),true);
 assert.equal(w.parityVerified,true); assert.equal(w.rollbackVerified,true); assert.equal(w.candidateMode,'verified');
});

test('parity reconciliation fails closed on incomplete lineage or non-operational writer',()=>{
 const w=writer(); w.operationalCandidateVerified=false;
 assert.throws(()=>applyParityRollbackEvidence(w,evidence()),/OPERATIONAL_CANDIDATE_NOT_VERIFIED/);
 const e=evidence(); e.current_state_projection='wrong';
 assert.throws(()=>applyParityRollbackEvidence(writer(),e),/INVALID_PARITY_ROLLBACK_EVIDENCE/);
});

test('main protection readiness requires all writer proof dimensions',()=>{
 const a=writer(),b=writer();
 applyParityRollbackEvidence(a,evidence()); applyParityRollbackEvidence(b,{...evidence(),writer:'weekblog'});
 assert.equal(computeMainProtectionReady([a,b]),true);
 b.rollbackVerified=false; assert.equal(computeMainProtectionReady([a,b]),false);
});
