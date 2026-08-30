const SHA40=/^[a-f0-9]{40}$/i;
const SHA256=/^[a-f0-9]{64}$/i;
const WRITER=/^[a-z0-9][a-z0-9-]{1,79}$/;

function req(value,re,code){const v=String(value||'').toLowerCase();if(!re.test(v))throw new Error(code);return v;}

export function certifyWriterParityRollback(input={}){
  const writer=String(input.writer||'').toLowerCase();
  if(!WRITER.test(writer)) throw new Error('INVALID_WRITER');
  const baseSha=req(input.baseSha,SHA40,'INVALID_BASE_SHA');
  const candidateHeadSha=req(input.candidateHeadSha,SHA40,'INVALID_CANDIDATE_HEAD_SHA');
  const rollbackSha=req(input.rollbackSha,SHA40,'INVALID_ROLLBACK_SHA');
  const directOutputSha256=req(input.directOutputSha256,SHA256,'INVALID_DIRECT_OUTPUT_SHA256');
  const candidateOutputSha256=req(input.candidateOutputSha256,SHA256,'INVALID_CANDIDATE_OUTPUT_SHA256');
  const rollbackOutputSha256=req(input.rollbackOutputSha256,SHA256,'INVALID_ROLLBACK_OUTPUT_SHA256');
  const baseOutputSha256=req(input.baseOutputSha256,SHA256,'INVALID_BASE_OUTPUT_SHA256');
  if(input.operationalCandidateVerified!==true) throw new Error('OPERATIONAL_CANDIDATE_NOT_VERIFIED');
  if(input.pathPolicyVerified!==true) throw new Error('PATH_POLICY_NOT_VERIFIED');
  if(input.exactHeadVerified!==true) throw new Error('EXACT_HEAD_NOT_VERIFIED');
  if(rollbackSha!==baseSha) throw new Error('ROLLBACK_SHA_NOT_BASE_SHA');
  if(directOutputSha256!==candidateOutputSha256) throw new Error('PARITY_MISMATCH');
  if(rollbackOutputSha256!==baseOutputSha256) throw new Error('ROLLBACK_OUTPUT_MISMATCH');
  if(String(input.outcomeRouter||'')!=='BG168') throw new Error('INVALID_OUTCOME_ROUTER');
  if(String(input.currentStateProjection||'')!=='BG167') throw new Error('INVALID_CURRENT_STATE_PROJECTION');
  const evidenceRef=String(input.evidenceRef||'').trim();
  if(!evidenceRef) throw new Error('MISSING_EVIDENCE_REF');
  return Object.freeze({
    contract:'BRAIN-DELIVERY-v2', truth_status:'VERIFIED', status:'COMPLETED', proof:'writer-parity-rollback',
    writer, baseSha, candidateHeadSha, rollbackSha, directOutputSha256, candidateOutputSha256,
    rollbackOutputSha256, baseOutputSha256, operationalCandidateVerified:true, pathPolicyVerified:true,
    exactHeadVerified:true, parityVerified:true, rollbackVerified:true, evidenceRef,
    outcome_router:'BG168', current_state_projection:'BG167'
  });
}
