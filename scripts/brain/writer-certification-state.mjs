const REQUIRED_CONTRACT='BRAIN-DELIVERY-v2';

function validEvidence(evidence, writerName){
  return evidence &&
    evidence.contract===REQUIRED_CONTRACT &&
    evidence.truth_status==='VERIFIED' &&
    evidence.status==='COMPLETED' &&
    evidence.proof==='writer-parity-rollback' &&
    evidence.writer===writerName &&
    evidence.parityVerified===true &&
    evidence.rollbackVerified===true &&
    evidence.outcome_router==='BG168' &&
    evidence.current_state_projection==='BG167' &&
    typeof evidence.evidenceRef==='string' && evidence.evidenceRef.trim().length>0;
}

export function applyParityRollbackEvidence(writer,evidence){
  if(!writer || typeof writer!=='object' || !writer.name) throw new Error('INVALID_WRITER_STATE');
  if(writer.candidateMode!=='operational_verified' || writer.operationalCandidateVerified!==true) {
    throw new Error('OPERATIONAL_CANDIDATE_NOT_VERIFIED');
  }
  if(writer.structuralContractVerified!==true || writer.merged!==true) throw new Error('WRITER_MIGRATION_NOT_COMPLETE');
  if(!validEvidence(evidence,writer.name)) throw new Error('INVALID_PARITY_ROLLBACK_EVIDENCE');
  writer.parityVerified=true;
  writer.rollbackVerified=true;
  writer.parityRollbackEvidence={
    evidenceRef:evidence.evidenceRef,
    truth_status:evidence.truth_status,
    status:evidence.status,
    outcome_router:evidence.outcome_router,
    current_state_projection:evidence.current_state_projection
  };
  return true;
}

export function computeWriterProofReady(writer){
  return Boolean(writer &&
    writer.candidateMode==='operational_verified' &&
    writer.structuralContractVerified===true &&
    writer.operationalCandidateVerified===true &&
    writer.parityVerified===true &&
    writer.rollbackVerified===true &&
    writer.merged===true);
}

export function computeWriterMigrationReady(writers){
  return Array.isArray(writers) && writers.length>0 && writers.every(computeWriterProofReady);
}

export function computeMainProtectionReady(writers, nativeProtectionEvidence){
  const writerMigrationReady=computeWriterMigrationReady(writers);
  const nativeProtectionReady=Boolean(nativeProtectionEvidence &&
    nativeProtectionEvidence.observed===true &&
    nativeProtectionEvidence.protected===true);
  return writerMigrationReady && nativeProtectionReady;
}
