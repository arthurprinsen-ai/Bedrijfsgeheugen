// Pure read-only admission; this module never dispatches or grants write authority.
export function assessRecoveryEvent({event,native,pr,now,seenKeys}={}){
 const REPO=1303700955;
 const workflows={347590495:'.github/workflows/required-test.yml',359530627:'.github/workflows/codeql.yml'};
 const sha=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
 const positive=v=>Number.isSafeInteger(v)&&v>0;
 const answer=(state,details={})=>Object.freeze({contract:'ORIGINAL_SUPERVISOR_CI_EVENT_ADMISSION_V1',state,eligibleForReadOnlyReconciliation:false,mutationAuthority:false,dispatchAuthorized:false,...details});
 const e=event?.workflow_run;
 if(event?.action!=='completed'||event?.repository?.id!==REPO||!e||!native||!pr)return answer('UNTRUSTED_EVENT_CONTEXT');
 const path=workflows[e.workflow_id];
 if(!path||e.path!==path||native.path!==path)return answer('UNRECOGNIZED_WORKFLOW');
 if(!positive(e.id)||!positive(e.run_attempt)||!sha(e.head_sha)||typeof e.head_branch!=='string'||!e.head_branch||e.head_branch==='main'||e.event!=='pull_request')return answer('UNSUPPORTED_RUN_IDENTITY');
 for(const run of [e,native]){
  if(run.repository?.id!==REPO||run.head_repository?.id!==REPO||run.status!=='completed'||!['success','failure','cancelled','timed_out'].includes(run.conclusion))return answer('UNTRUSTED_NATIVE_RUN');
 }
 for(const key of ['id','workflow_id','run_attempt','head_sha','head_branch','event','status','conclusion','updated_at']){
  if(e[key]!==native[key])return answer('NATIVE_READBACK_MISMATCH');
 }
 const clock=Date.parse(now),completed=Date.parse(native.updated_at);
 if(!Number.isFinite(clock)||!Number.isFinite(completed)||completed>clock||clock-completed>15*60*1000)return answer('STALE_OR_INVALID_EVENT');
 for(const run of [e,native]){
  if(!Array.isArray(run.pull_requests)||run.pull_requests.length!==1)return answer('AMBIGUOUS_PR_ASSOCIATION');
  const a=run.pull_requests[0];
  if(!positive(a.number)||a.number!==pr.number||a.head?.sha!==e.head_sha||a.head?.ref!==e.head_branch||a.head?.repo?.id!==REPO||a.base?.repo?.id!==REPO||a.base?.ref!=='main')return answer('PR_ASSOCIATION_MISMATCH');
 }
 if(pr.state!=='open'||pr.draft!==false||pr.head?.sha!==e.head_sha||pr.head?.ref!==e.head_branch||pr.head?.repo?.id!==REPO||pr.base?.repo?.id!==REPO||pr.base?.ref!=='main')return answer('PR_HEAD_NOT_CURRENT_OR_NOT_ELIGIBLE');
 const key=`ci:${REPO}:${e.workflow_id}:${e.id}:${e.run_attempt}:${e.head_sha}`;
 if(!Array.isArray(seenKeys)||seenKeys.some(x=>typeof x!=='string'))return answer('REPLAY_INVENTORY_UNPROVEN');
 if(seenKeys.includes(key))return answer('REPLAY_SUPPRESSED',{eventKey:key});
 return answer('READ_ONLY_RECONCILIATION_ELIGIBLE',{eligibleForReadOnlyReconciliation:true,eventKey:key,prNumber:pr.number,head:e.head_sha,conclusion:e.conclusion});
}
