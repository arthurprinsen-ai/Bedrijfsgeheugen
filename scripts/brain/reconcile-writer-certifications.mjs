import fs from 'node:fs';
import path from 'node:path';

const write=process.argv.includes('--write');
const evidenceDir='brain/evidence/writer-canary';
const migrationPath='config/repository-writer-migration.json';
const migration=JSON.parse(fs.readFileSync(migrationPath,'utf8'));
const writers=new Map(migration.writers.map(writer=>[writer.name,writer]));

const files=fs.readdirSync(evidenceDir).filter(name=>name.endsWith('.json')).sort();
let changed=false;
for(const file of files){
  const full=path.join(evidenceDir,file);
  let evidence;
  try { evidence=JSON.parse(fs.readFileSync(full,'utf8')); } catch { continue; }
  if(evidence.contract!=='BRAIN-DELIVERY-v2') continue;
  if(evidence.truth_status!=='VERIFIED'||evidence.status!=='COMPLETED') continue;
  if(evidence.proof!=='operational-candidate-shadow-flow') continue;
  if(evidence.outcome_router!=='BG168'||evidence.current_state_projection!=='BG167') continue;
  const writer=writers.get(evidence.writer);
  if(!writer) throw new Error(`UNKNOWN_CERTIFIED_WRITER:${evidence.writer}`);
  const required=['verification_pr','candidate_pr','candidate_branch','candidate_base_sha','candidate_head_sha','shadow_run_id','shadow_artifact'];
  for(const key of required) if(evidence[key]===undefined||evidence[key]===null||evidence[key]==='') throw new Error(`INCOMPLETE_CERTIFICATION:${evidence.writer}:${key}`);

  const nextEvidence={
    verificationPullRequest:evidence.verification_pr,
    writerPullRequest:evidence.candidate_pr,
    shadowRunId:Number(evidence.shadow_run_id),
    baseSha:evidence.candidate_base_sha,
    headSha:evidence.candidate_head_sha,
    candidateBranch:evidence.candidate_branch,
    changedFiles:evidence.shadow_checks?.changed_files||[],
    pathPolicyVerified:evidence.shadow_checks?.path_policy_verified===true,
    exactHeadVerified:evidence.shadow_checks?.exact_head_verified===true,
    certificationEvidence:full,
    idempotencyKey:evidence.idempotency_key,
  };
  if(evidence.shadow_job_id!==undefined) nextEvidence.shadowJobId=Number(evidence.shadow_job_id);
  if(evidence.artifact_id!==undefined) nextEvidence.artifactId=Number(evidence.artifact_id);
  if(evidence.artifact_digest) nextEvidence.artifactDigest=evidence.artifact_digest;

  const before=JSON.stringify({candidateMode:writer.candidateMode,operationalCandidateVerified:writer.operationalCandidateVerified,operationalEvidence:writer.operationalEvidence});
  writer.candidateMode='operational_verified';
  writer.operationalCandidateVerified=true;
  writer.operationalEvidence={...(writer.operationalEvidence||{}),...nextEvidence};
  const after=JSON.stringify({candidateMode:writer.candidateMode,operationalCandidateVerified:writer.operationalCandidateVerified,operationalEvidence:writer.operationalEvidence});
  if(before!==after) changed=true;
}

migration.mainProtectionReady=migration.writers.every(writer=>writer.structuralContractVerified===true&&writer.operationalCandidateVerified===true&&writer.parityVerified===true&&writer.rollbackVerified===true);
const output=JSON.stringify(migration,null,2)+'\n';
if(write&&changed) fs.writeFileSync(migrationPath,output);
else if(write&&!changed) fs.writeFileSync(migrationPath,output);
process.stdout.write(JSON.stringify({changed,mainProtectionReady:migration.mainProtectionReady,certified:migration.writers.filter(w=>w.operationalCandidateVerified).map(w=>w.name)})+'\n');
