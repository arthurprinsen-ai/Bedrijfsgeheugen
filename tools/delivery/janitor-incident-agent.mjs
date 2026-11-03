import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Canonical existing Janitor owner: read-only lineage verification and same-run incident evidence.
export const FINGERPRINT='github|janitor-terminal-lease|bounded-successor-history|http422-sigpipe|20261101-v1';
export const INCIDENT_NUMBER=5320;
export const HISTORY_DEBT_FINGERPRINT='github|janitor|history-deferral-without-incident-readback|20261103-v1';
export const EVIDENCE_MISSING_FINGERPRINT='github|janitor|native-cleanup-artifact-missing|20261103-v1';
export const ARCHIVE_INCIDENT_NUMBER=5333;
export const ARCHIVE_RATE_INCIDENT_NUMBER=5341;
export const ARCHIVE_RATE_FINGERPRINT='github|janitor-archive-sweep|installation-rate-limit-uncaught-after-tag403|20261103-v1';
export const ARCHIVE_PROVIDER_FINGERPRINT='github|janitor-archive-sweep|tag-ref-create-403-masked-as-success|20261102-v1';
export const ARCHIVE_EVIDENCE_FINGERPRINT='github|janitor-archive-sweep|missing-runtime-incident-proof|20261103-v1';
export const ARCHIVE_STEP_FINGERPRINT='github|janitor-archive-sweep|native-step-failure-separate-from-permission|20261103-v1';
const SHA=/^[0-9a-f]{40}$/i;
const repoOk=x=>/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(x||'');
const numberOk=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<1_000_000_000;
const runIdOk=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
// Provider namespaces differ: GitHub Actions run IDs exceed 1,000,000,000.
// PR-number constraints must NEVER be reused for run IDs.
export function assertNativeJanitorIdentity(env={}){
 if(!repoOk(env.GITHUB_REPOSITORY)||!runIdOk(env.GITHUB_RUN_ID))
   throw Error('RUN_IDENTITY_INVALID');
 return {repository:env.GITHUB_REPOSITORY,run_id:Number(env.GITHUB_RUN_ID)};
}
const clean=x=>String(x??'').replace(/[\x00-\x1f]/g,' ').slice(0,180);
const metadata=(text,key)=>String(text||'').split(/\r?\n/).find(line=>line.startsWith(key+': '))?.slice(key.length+2).trim()||null;
export function mergedSuccessorIsProven(pr,{predecessor,obligation}={}){
 return numberOk(pr?.number)&&Number(pr.number)>Number(predecessor)&&pr.state==='closed'&&
 pr.merged===true&&typeof pr.merged_at==='string'&&pr.merged_at.length>0&&
 metadata(pr.body,'Obligation-ID')===obligation&&
 metadata(pr.body,'Supersedes')?.replace(/^#/,'')===String(Number(predecessor));
}
// Positive-only transitive proof. A final merged PR may supersede several retired
// candidates. Every edge must be read directly from GitHub with exact obligation
// and a strictly decreasing PR number; a search miss NEVER authorizes a reopen.
export async function traceMergedSuccessor({seed,predecessor,obligation,readPr}={}){
 const target=Number(predecessor),visited=new Set(),chain=[];
 let current=seed;
 for(let depth=0;depth<32;depth++){
   const id=Number(current?.number);
   if(!numberOk(id)||id<=target||visited.has(id)||
      metadata(current?.body,'Obligation-ID')!==obligation)return null;
   if(depth===0){
     if(current.state!=='closed'||current.merged!==true||
       typeof current.merged_at!=='string'||!current.merged_at)return null;
   }else{
     // Open intermediates are admissible ONLY when explicitly retired; never
     // interpret one as an active writer or permission to close/reopen it.
     const retired=/^RETIRED\b/i.test(current.title||'')||
       metadata(current.body,'Retirement-State')==='RETIRED_DO_NOT_MERGE';
     if(current.state!=='closed'&&
       !(current.state==='open'&&current.merged===false&&retired))return null;
   }
   visited.add(id);chain.push(id);
   const parentRaw=metadata(current.body,'Supersedes');
   if(!/^#?[1-9][0-9]*$/.test(parentRaw||''))return null;
   const parent=Number(parentRaw.replace(/^#/,''));
   if(!numberOk(parent)||parent>=id||visited.has(parent))return null;
   if(parent===target)return {
     status:'PROVEN_MERGED_SUCCESSOR',proven:true,safe_to_reopen:false,
     predecessor_number:target,successor_number:chain[0],
     successor_merged_at:seed.merged_at,chain:[...chain,target],
     evidence:chain.length===1?'GITHUB_SEARCH_POSITIVE_PLUS_DIRECT_MERGED_PR_READBACK':
       'GITHUB_SEARCH_POSITIVE_PLUS_TRANSITIVE_DIRECT_PR_READBACK'};
   const next=await readPr(parent);
   if(Number(next?.number)!==parent)return null;
   current=next;
 }
 return null; // Too long, cyclic, missing, or ambiguous lineage: fail closed.
}
export async function verifyMergedSuccessor({repo,predecessor,obligation,search,readPr}={}){
 if(!repoOk(repo)||!numberOk(predecessor)||!/^[-a-z0-9_|:.]{5,180}$/i.test(obligation||''))
   return {status:'INVALID_INPUT_FAIL_CLOSED',proven:false,safe_to_reopen:false};
 try{
   const query='repo:'+repo+' is:pr is:merged "'+obligation+'"';
   const candidates=await search(query);
   if(!Array.isArray(candidates?.items))throw Error('SEARCH_RESULT_INVALID');
   // Search is a candidate locator, not proof. The authoritative evidence is
   // the merged tip plus EVERY explicit Supersedes edge read from GitHub.
   const ids=[...new Set(candidates.items.map(x=>Number(x.number)).filter(numberOk))].slice(0,20);
   for(const id of ids){
     const pr=await readPr(id);
     if(Number(pr?.number)!==id)continue;
     const proof=await traceMergedSuccessor({seed:pr,predecessor,obligation,readPr});
     if(proof)return proof;
   }
   return {status:'HISTORY_UNPROVEN_DEFER',proven:false,safe_to_reopen:false,
     predecessor_number:Number(predecessor),searched_candidates:ids.length,
     search_incomplete:candidates.incomplete_results===true};
 }catch{return {status:'PROVIDER_READ_UNAVAILABLE_DEFER',proven:false,
   predecessor_number:Number(predecessor),safe_to_reopen:false,
   reason:'SEARCH_OR_DIRECT_PR_READ_FAILED'};}
}
export function classifyCurrentJanitor({cleanupOutcome,readbackOutcome,actions=[],runId,mainSha,evidenceAvailable=true}={}){
 const allowed=['success','failure','skipped','cancelled'];
 const cleanup=allowed.includes(cleanupOutcome)?cleanupOutcome:'unknown';
 const readback=allowed.includes(readbackOutcome)?readbackOutcome:'unknown';
 const failed=[['cleanup',cleanup],['readback',readback]].filter(x=>x[1]==='failure').map(x=>x[0]);
 const verified=actions.filter(x=>x?.type==='TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR'&&
   numberOk(x.successor_number)).map(x=>({predecessor:x.pr_number,successor:x.successor_number,
     evidence:x.evidence||'BOUNDED_POSITIVE'}));
 const deferred=actions.filter(x=>x?.type==='TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN')
   .map(x=>({pr_number:x.pr_number,reason:x.reason||'HISTORY_UNPROVEN'}));
 const missingArtifact=cleanup==='success'&&readback==='success'&&evidenceAvailable!==true;
 const status=failed.length?'INCIDENT_OPEN_STEP_FAILURE':
   missingArtifact?'INCIDENT_OPEN_EVIDENCE_MISSING':
   deferred.length?'INCIDENT_OPEN_HISTORY_UNPROVEN':
   cleanup==='success'&&readback==='success'?'JANITOR_STEPS_VERIFIED_SAME_RUN':
   cleanup==='skipped'&&readback==='skipped'?'DRY_RUN_NO_MUTATION':'INCOMPLETE_PROOF';
 const reportRequired=failed.length>0||missingArtifact||deferred.length>0;
 return {schema:'janitor-incident-agent-v1',fingerprint:FINGERPRINT,observed_at:new Date().toISOString(),
   run_id:runIdOk(runId)?Number(runId):null,main_sha:SHA.test(mainSha||'')?mainSha:null,
   cleanup_outcome:cleanup,readback_outcome:readback,failed_steps:failed,
   verified_merged_successors:verified,deferred_history:deferred,status,
   evidence_available:evidenceAvailable===true,report_required:reportRequired,
   reporting_readback_verified:false,
   global_green:false,independent_runtime_repair_proven:status==='JANITOR_STEPS_VERIFIED_SAME_RUN',
   owner:'existing-powerhouse-github-delivery-janitor',
   next_action:failed.length?'EXISTING_OWNER_ROOT_CAUSE_AND_PROTECTED_REPAIR':
     missingArtifact?'REBUILD_MISSING_NATIVE_ACTION_ARTIFACT_AND_OBSERVER_READBACK':
     deferred.length?'FULL_LINEAGE_OWNER_RECONCILIATION':
     status==='JANITOR_STEPS_VERIFIED_SAME_RUN'?'INDEPENDENT_PORTAL_AND_MAIN_READBACK':
       'WAIT_FOR_NEXT_ELIGIBLE_NATIVE_RUN'};
}
const api=args=>execFileSync('gh',['api',...args],{
  encoding:'utf8',timeout:15000,maxBuffer:3_000_000,stdio:['ignore','pipe','pipe']
});
// Existing original Janitor/Brain incident writer is reused by both native jobs;
// no parallel registry or scheduler is introduced.
export function classifyNativeArchive({sweepOutcome,artifact,runId,mainSha,rateLimited=false}={}){
 const runOk=runIdOk(runId),mainOk=SHA.test(mainSha||'');
 const count=artifact?.counts,fields=['seen','skipped','deleted','archived','drift','failed'];
 const bounded=artifact?.status==='BOUNDED_WINDOW_VERIFIED_NOT_FULL_SWEEP';
 const boundedOk=!bounded||(artifact.scan_scope_full===false&&
  Number.isSafeInteger(artifact.branch_inventory_total)&&
  Number.isSafeInteger(artifact.branch_window_size)&&
  artifact.branch_inventory_total>artifact.branch_window_size&&
  artifact.branch_window_size>=0);
 const reportOk=runOk&&mainOk&&artifact?.schema==='janitor-branch-archive-sweep-v2'&&
  artifact.applied===true&&['COMPLETE','PARTIAL_FAILURE','BOUNDED_WINDOW_VERIFIED_NOT_FULL_SWEEP'].includes(artifact.status)&&
  boundedOk&&
  Number(artifact.source_run_id)===Number(runId)&&artifact.source_sha===mainSha&&
  count&&fields.every(key=>Number.isSafeInteger(count[key])&&count[key]>=0);
 const providerFailure=reportOk&&(count.failed>0||artifact.status==='PARTIAL_FAILURE');
 const badStep=sweepOutcome!=='success';
 const status=rateLimited?'INCIDENT_OPEN_ARCHIVE_RATE_LIMIT_FAILURE':
  !reportOk?'INCIDENT_OPEN_ARCHIVE_EVIDENCE_MISSING':
  providerFailure?'INCIDENT_OPEN_ARCHIVE_PROVIDER_FAILURE':
  badStep?'INCIDENT_OPEN_ARCHIVE_STEP_FAILURE':
  bounded?'JANITOR_ARCHIVE_BOUNDED_WINDOW_VERIFIED_SAME_RUN':
  'JANITOR_ARCHIVE_STEPS_VERIFIED_SAME_RUN';
 return {schema:'janitor-archive-incident-observer-v1',status,run_id:runOk?Number(runId):null,
  main_sha:mainOk?mainSha:null,cleanup_outcome:sweepOutcome||'unknown',
  readback_outcome:reportOk?'PROVIDER_ARTIFACT_READ':'UNVERIFIED',
  failed_steps:badStep?['archive']:[],report_required:status.startsWith('INCIDENT_OPEN_'),
  observer_scope:'branch_archive_sweep',signal_kind:status.replace('INCIDENT_OPEN_',''),
  evidence_available:!!reportOk,
  archive_counts:reportOk?Object.fromEntries(fields.map(k=>[k,count[k]])):null,
  archive_status:reportOk?artifact.status:'MISSING_OR_INVALID',
  scan_scope_full:reportOk?artifact.scan_scope_full===true:false,
  archive_reason:rateLimited?'PROVIDER_RATE_LIMIT_EXCEEDED':'UNKNOWN_OR_OTHER',
  incident_number:rateLimited?ARCHIVE_RATE_INCIDENT_NUMBER:ARCHIVE_INCIDENT_NUMBER,
  owner:'existing-powerhouse-github-delivery-janitor',global_green:false,
  safe_to_delete_unarchived_unique_branch:false,
  next_action:rateLimited?'EXCLUSIVE_OWNER_GITHUB_INSTALLATION_QUOTA_RECOVERY_AND_EVIDENCE_RECOVERY':
    !reportOk?'RECOVER_ORIGINAL_ARCHIVE_EVIDENCE':
    providerFailure?'EXCLUSIVE_OWNER_PROVIDER_PERMISSION_OR_TAG_READBACK_RECOVERY':
    badStep?'EXCLUSIVE_OWNER_ORIGINAL_JOB_FAILURE_DIAGNOSIS':
    bounded?'CONTINUE_ORIGINAL_HOURLY_BOUNDED_ARCHIVE_WINDOW':'INDEPENDENT_NATIVE_AND_BRAIN_READBACK'};
}
export async function writeBrainOccurrence({env,report,fetchImpl=globalThis.fetch}={}){
 if(!report?.report_required&&!report?.failed_steps?.length)return {status:'NO_FAILURE_TO_RECORD'};
 const url=String(env?.BG_PORTAL_EU_SUPABASE_URL||env?.SUPABASE_URL||'').trim().replace(/\/$/,'');
 const key=String(env?.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY||env?.SUPABASE_SERVICE_ROLE_KEY||'').trim();
 if(!url||!key)return {status:'BRAIN_RPC_AUTHORITY_UNAVAILABLE',verified:false};
 let endpoint;
 try{endpoint=new URL(url);}catch{return {status:'BRAIN_RPC_URL_INVALID',verified:false};}
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||
   !/^[a-z0-9-]+\.supabase\.co$/i.test(endpoint.hostname)||
   endpoint.pathname!=='/'&&endpoint.pathname!==''){
   return {status:'BRAIN_RPC_URL_UNTRUSTED',verified:false};
 }
 const attempt=String(env.GITHUB_RUN_ATTEMPT||'1');
 const archive=report.observer_scope==='branch_archive_sweep';
 const kind=archive?report.signal_kind:report.failed_steps?.length?'STEP_FAILURE':
   report.status==='INCIDENT_OPEN_EVIDENCE_MISSING'?'EVIDENCE_MISSING':'HISTORY_UNPROVEN';
 const fingerprint=archive?(kind==='ARCHIVE_EVIDENCE_MISSING'?ARCHIVE_EVIDENCE_FINGERPRINT:
   kind==='ARCHIVE_RATE_LIMIT_FAILURE'?ARCHIVE_RATE_FINGERPRINT:
   kind==='ARCHIVE_STEP_FAILURE'?ARCHIVE_STEP_FINGERPRINT:ARCHIVE_PROVIDER_FINGERPRINT):
   kind==='STEP_FAILURE'?FINGERPRINT:
   kind==='EVIDENCE_MISSING'?EVIDENCE_MISSING_FINGERPRINT:HISTORY_DEBT_FINGERPRINT;
 const occurrenceId='github-actions:'+(archive?'janitor-archive':'janitor')+':run:'+report.run_id+':attempt:'+attempt+
   ':signal:'+kind.toLowerCase()+(kind==='STEP_FAILURE'?':'+report.failed_steps.join('-'):'');
 const evidence={source:'GITHUB_NATIVE_JANITOR_AGENT',source_url:report.source_url,
   incident_url:report.incident_url,run_id:report.run_id,run_attempt:attempt,
   main_sha:report.main_sha,cleanup_outcome:report.cleanup_outcome,
   readback_outcome:report.readback_outcome,failed_steps:report.failed_steps,
   signal_kind:kind,history_deferred_count:report.deferred_history?.length||0,
   history_deferred_prs:(report.deferred_history||[]).map(x=>x.pr_number).slice(0,100),
   native_artifact_available:report.evidence_available===true,
   observer_scope:report.observer_scope||'janitor',
   archive_status:archive?report.archive_status:null,
   archive_counts:archive?report.archive_counts:null,
   archive_reason:archive?report.archive_reason:null,
   archive_scan_scope_full:archive?report.scan_scope_full:null,
   root_cause:'UNVERIFIED_REQUIRE_ORIGINAL_JOB_LOG_AND_COMPLETE_SOURCE_HISTORY',owner:report.owner,
   safe_repair:'EXCLUSIVE_EXISTING_JANITOR_OWNER_PROTECTED_RELEASE',
   regression:archive?'tests/brain-janitor-archive-incident-readback-20261103.test.mjs':
     'tests/brain-janitor-agent-self-recovery-20261102.test.mjs',
   prevention_rule:'NO_BLIND_REOPEN_AND_NO_FALSE_GREEN_NO_UNREPORTED_OPEN_DEBT',
   status:report.status};
 const hash=createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
 const headers={apikey:key,authorization:'Bearer '+key,'content-type':'application/json'};
 const observed=await fetchImpl(endpoint.origin+'/rest/v1/rpc/brain_observe_failure',{
   method:'POST',headers,body:JSON.stringify({p_occurrence_id:occurrenceId,
     p_fingerprint:fingerprint,p_payload_sha256:hash,p_evidence:evidence}),
   signal:AbortSignal.timeout(10000)});
 if(!observed.ok)throw Error('BRAIN_RPC_FAILURE_HTTP_'+observed.status);
 const read=await fetchImpl(endpoint.origin+'/rest/v1/brain_failure_occurrences?select=occurrence_id,fingerprint,payload_sha256&occurrence_id=eq.'+encodeURIComponent(occurrenceId),{
   method:'GET',headers,signal:AbortSignal.timeout(10000)});
 if(!read.ok)throw Error('BRAIN_RPC_READBACK_HTTP_'+read.status);
 const rows=await read.json();
 if(!Array.isArray(rows)||rows.length!==1||rows[0].occurrence_id!==occurrenceId||
   rows[0].fingerprint!==fingerprint||rows[0].payload_sha256!==hash){
   throw Error('BRAIN_RPC_READBACK_MISMATCH');
 }
 return {status:'BRAIN_OCCURRENCE_READBACK_CONFIRMED',verified:true,occurrence_id:occurrenceId,
   fingerprint,payload_sha256:hash};
}
async function observe(env=process.env,provider=api){
 assertNativeJanitorIdentity(env);
 await mkdir('.artifacts',{recursive:true});
 let actions=[],evidenceAvailable=false;
 try{const data=JSON.parse(await readFile('.artifacts/janitor-runtime-actions.json','utf8'));
   if(Array.isArray(data)){actions=data;evidenceAvailable=true;}}
 catch{} // Missing/broken source is an INCIDENT, not a silently empty-success array.
 const report=classifyCurrentJanitor({cleanupOutcome:env.JANITOR_CLEANUP_OUTCOME,
   readbackOutcome:env.JANITOR_READBACK_OUTCOME,actions,runId:env.GITHUB_RUN_ID,
   mainSha:env.GITHUB_SHA,evidenceAvailable});
 report.source_url='https://github.com/'+env.GITHUB_REPOSITORY+'/actions/runs/'+env.GITHUB_RUN_ID;
 report.incident_url='https://github.com/'+env.GITHUB_REPOSITORY+'/issues/'+INCIDENT_NUMBER;
 await writeFile('.artifacts/janitor-agent-incident.json',JSON.stringify(report,null,2)+'\n');
 if(report.report_required){
   const repo=env.GITHUB_REPOSITORY;
   const marker='<!-- janitor-agent-run:'+env.GITHUB_RUN_ID+':'+(env.GITHUB_RUN_ATTEMPT||1)+':'+report.status+' -->';
   const issue=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER]));
   const page=Math.max(1,Math.ceil(Math.max(1,Number(issue.comments)||1)/100));
   const comments=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER+'/comments?per_page=100&page='+page]));
   if(!Array.isArray(comments))throw Error('INCIDENT_READBACK_UNAVAILABLE');
   if(!comments.some(x=>String(x?.body||'').includes(marker))){
     const body=marker+'\nAutonomous Janitor observer: **INCIDENT_OPEN**. Run '+
       env.GITHUB_RUN_ID+' attempt '+clean(env.GITHUB_RUN_ATTEMPT||'1')+
       ', exact SHA '+clean(env.GITHUB_SHA)+', observer: '+clean(report.status)+
       ', failed steps: '+(report.failed_steps.join(', ')||'none')+
       ', unproven history count: '+report.deferred_history.length+
       ', native evidence available: '+report.evidence_available+
       '. Direct provider error and actual root cause must be independently read back. '+
       'Owner: original Powerhouse GitHub delivery/Janitor. Same-lineage protected repair, no blind retries. '+
       report.source_url;
     provider(['-X','POST','repos/'+repo+'/issues/'+INCIDENT_NUMBER+'/comments','-f','body='+body]);
     const updated=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER]));
     if(Number(updated.comments)<=Number(issue.comments))throw Error('INCIDENT_WRITEBACK_UNVERIFIED');
   }
   report.issue_writeback='PROVIDER_READBACK_CONFIRMED';
   const brain=await writeBrainOccurrence({env,report});
   report.brain_writeback=brain;
   report.reporting_readback_verified=brain.verified===true&&report.issue_writeback==='PROVIDER_READBACK_CONFIRMED';
   await writeFile('.artifacts/janitor-agent-incident.json',JSON.stringify(report,null,2)+'\n');
   if(brain.verified!==true)throw Error('BRAIN_INCIDENT_WRITEBACK_UNVERIFIED:'+brain.status);
 }
 console.log('JANITOR_AGENT:'+report.status+':'+report.run_id);
}
// Independent best-effort channels: a GitHub installation rate limit must not
// prevent the original ONE BRAIN incident observation (and vice versa).
export async function settleIncidentWritebacks({brainWrite,issueWrite}={}){
 const results=await Promise.allSettled([brainWrite(),issueWrite()]);
 const [brain,issue]=results;
 const brainReceipt=brain.status==='fulfilled'?brain.value:
  {verified:false,status:'BRAIN_WRITE_FAILED',reason:clean(brain.reason?.message)};
 const issueReceipt=issue.status==='fulfilled'?issue.value:null;
 const failures=[];
 if(brainReceipt?.verified!==true)failures.push('BRAIN_'+clean(brainReceipt?.status||'UNVERIFIED'));
 if(issueReceipt!=='PROVIDER_READBACK_CONFIRMED')
  failures.push('ISSUE_'+(issue.status==='rejected'?clean(issue.reason?.message):'READBACK_UNVERIFIED'));
 return {brain:brainReceipt,issue:issueReceipt,failures,
  verified:failures.length===0};
}
// Same original hourly workflow, separate existing branch_archive_sweep job.
// A failure is independently written to original issue #5333 and the
// canonical Brain RPC, with an idempotent run/attempt marker and readback.
export async function observeArchive(env=process.env,provider=api,fetchImpl=globalThis.fetch){
 assertNativeJanitorIdentity(env);
 await mkdir('.artifacts',{recursive:true});
 let artifact=null,rateLimited=false;
 try{artifact=JSON.parse(await readFile('.artifacts/branch-archive-sweep.json','utf8'));}catch{}
 try{
  const log=await readFile('.artifacts/branch-archive-actions.ndjson','utf8');
  rateLimited=log.slice(0,512000).split('\n').some(line=>{
   try{const event=JSON.parse(line);return event?.reason==='PROVIDER_RATE_LIMIT_EXCEEDED'&&
    event?.type==='BRANCH_ARCHIVE_PARTIAL_FAILURE';}catch{return false;}
  });
 }catch{} // Report still independently evaluated if original action log is missing.
 const report=classifyNativeArchive({sweepOutcome:env.JANITOR_ARCHIVE_SWEEP_OUTCOME,
  artifact,rateLimited,runId:env.GITHUB_RUN_ID,mainSha:env.GITHUB_SHA});
 report.source_url='https://github.com/'+env.GITHUB_REPOSITORY+'/actions/runs/'+env.GITHUB_RUN_ID;
 report.incident_url='https://github.com/'+env.GITHUB_REPOSITORY+'/issues/'+report.incident_number;
 const output='.artifacts/janitor-archive-observer.json';
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 if(report.report_required){
  const issueWrite=async()=>{
   const repo=env.GITHUB_REPOSITORY,attempt=env.GITHUB_RUN_ATTEMPT||'1';
   const marker='<!-- janitor-archive-observer:'+env.GITHUB_RUN_ID+':'+attempt+':'+report.status+' -->';
   const issue=JSON.parse(provider(['repos/'+repo+'/issues/'+report.incident_number]));
   const page=Math.max(1,Math.ceil(Math.max(1,Number(issue.comments)||1)/100));
   const comments=JSON.parse(provider(['repos/'+repo+'/issues/'+report.incident_number+
    '/comments?per_page=100&page='+page]));
   if(!Array.isArray(comments))throw Error('ARCHIVE_INCIDENT_READBACK_UNAVAILABLE');
   if(!comments.some(x=>String(x?.body||'').includes(marker))){
    const body=marker+'\nNative Janitor archive observer **INCIDENT_OPEN**: run '+
     clean(env.GITHUB_RUN_ID)+' attempt '+clean(attempt)+' SHA '+clean(env.GITHUB_SHA)+
     ', source status '+clean(report.status)+', original step '+clean(report.cleanup_outcome)+
     ', failed count '+(report.archive_counts?.failed??'UNKNOWN')+
     '. Actual provider failure/authorization must be diagnosed by original owner. No unarchived unique branch deletion; no fake green. '+
     report.source_url;
    const written=JSON.parse(provider(['-X','POST','repos/'+repo+'/issues/'+report.incident_number+
     '/comments','-f','body='+body]));
    if(!runIdOk(written.id)||!String(written.body||'').includes(marker))
     throw Error('ARCHIVE_ISSUE_WRITEBACK_UNVERIFIED');
    const check=JSON.parse(provider(['repos/'+repo+'/issues/comments/'+written.id]));
    if(check.id!==written.id||!String(check.body||'').includes(marker))
     throw Error('ARCHIVE_ISSUE_READBACK_MISMATCH');
   }
   return 'PROVIDER_READBACK_CONFIRMED';
  };
  const settled=await settleIncidentWritebacks({
   brainWrite:()=>writeBrainOccurrence({env,report,fetchImpl}),issueWrite
  });
  report.brain_writeback=settled.brain;
  report.issue_writeback=settled.issue;
  report.reporting_failure_codes=settled.failures;
  report.reporting_readback_verified=settled.verified;
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  if(!settled.verified)
   throw Error('ARCHIVE_BRAIN_INCIDENT_WRITEBACK_UNVERIFIED_OR_ISSUE_READBACK_FAILED:'+
    settled.failures.join('|'));
 }
 console.log('JANITOR_ARCHIVE_OBSERVER:'+report.status+':'+report.run_id);
 return report;
}
async function main(argv){
 if(argv[0]==='--verify-successor'){
   const [predecessor,obligation]=argv.slice(1),repo=process.env.GITHUB_REPOSITORY;
   const outcome=await verifyMergedSuccessor({repo,predecessor,obligation,
     search:q=>JSON.parse(api(['-X','GET','search/issues','-f','q='+q,'-f','per_page=20'])),
     readPr:id=>JSON.parse(api(['repos/'+repo+'/pulls/'+id]))});
   process.stdout.write(JSON.stringify(outcome)+'\n');return;
 }
 if(argv[0]==='--observe')return observe();
 if(argv[0]==='--observe-archive')return observeArchive();
 throw Error('JANITOR_AGENT_MODE_INVALID');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main(process.argv.slice(2)).catch(error=>{
   console.error('JANITOR_AGENT_WRITEBACK_OR_SOURCE_FAILED:'+clean(error.message));
   process.exitCode=78;
 });
