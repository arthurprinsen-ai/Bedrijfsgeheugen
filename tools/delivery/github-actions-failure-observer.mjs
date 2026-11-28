import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';

// Read-only native Actions source; canonical Supabase brain_observe_failure remains the ONLY writer.
// This observer runs inside the existing hourly Powerhouse Repository Janitor: no new timer or workflow.
const BAD=new Set(['failure','timed_out','action_required','startup_failure','stale']);
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[0-9a-f]{40}$/i;
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
const clean=x=>String(x??'').replace(/[\x00-\x1f]/g,' ').slice(0,160);

const MAX_NATIVE_RUN_ATTEMPT = 51; // Initial attempt plus at most 50 GitHub reruns.
const MAX_OLDER_ATTEMPT_READS_PER_WINDOW = 100;
// GitHub's list-workflow-runs projects the CURRENT attempt. A later successful
// rerun must not erase an immutable earlier failure. Read native attempt history
// ONLY for rerun rows inside the same original hourly Janitor source scan.
export async function recoverEarlierNativeAttempts(run,{api,budget=MAX_OLDER_ATTEMPT_READS_PER_WINDOW}={}){
 const attempts=Number(run?.run_attempt);
 if(!Number.isSafeInteger(attempts)||attempts<1||
    attempts>MAX_NATIVE_RUN_ATTEMPT)throw Error('GITHUB_RUN_ATTEMPT_COUNT_UNVERIFIED');
 if(!Number.isSafeInteger(budget)||budget<0||attempts-1>budget)
   throw Error('GITHUB_RUN_ATTEMPT_HISTORY_BUDGET_EXCEEDED');
 if(attempts===1)return {inspected:0,failures:[]};
 if(typeof api!=='function')throw Error('GITHUB_RUN_ATTEMPT_SOURCE_REQUIRED');
 const failures=[];
 for(let n=1;n<attempts;n++){
  const prior=await api('repos/'+REPO+'/actions/runs/'+run.id+'/attempts/'+n);
  if(Number(prior?.id)!==Number(run.id)||
     Number(prior?.workflow_id)!==Number(run.workflow_id)||
     Number(prior?.run_attempt)!==n||
     prior?.head_sha!==run.head_sha||
     prior?.event!==run.event||
     prior?.status!=='completed')
   throw Error('GITHUB_PREVIOUS_ATTEMPT_PROVIDER_IDENTITY_INVALID');
  const item=classifyActionsRun(prior);
  if(item.state==='SOURCE_RUN_INVALID')
   throw Error('GITHUB_PREVIOUS_ATTEMPT_SOURCE_INVALID');
  if(item.state==='NATIVE_FAILURE')failures.push(item);
 }
 return {inspected:attempts-1,failures};
}

export function classifyActionsRun(run){
 if(!run||!id(run.id)||!id(run.workflow_id)||!id(run.run_attempt)||
    run.status!=='completed'||typeof run.conclusion!=='string')
    return {state:'SOURCE_RUN_INVALID'};
 if(!BAD.has(run.conclusion))return {state:'NO_NATIVE_FAILURE'};
 // Terminal errors require an exact SHA; benign cancelled/neutral runs do not.
 if(!SHA.test(run.head_sha||''))return {state:'SOURCE_RUN_INVALID'};
 const url='https://github.com/'+REPO+'/actions/runs/'+run.id;
 // The provider run+attempt is immutable; a rerun is a distinct occurrence.
 const fingerprint='github|actions|workflow-'+run.workflow_id+'|'+run.conclusion;
 const occurrenceId='github-actions:workflow:'+run.workflow_id+':run:'+run.id+
   ':attempt:'+run.run_attempt+':'+run.conclusion;
 const evidence={
  source:'GITHUB_NATIVE_ACTIONS_COMPLETED',source_url:url,
  repository:REPO,workflow_id:Number(run.workflow_id),run_id:Number(run.id),
  run_attempt:Number(run.run_attempt),head_sha:run.head_sha.toLowerCase(),
  conclusion:run.conclusion,workflow_name:clean(run.name),
  event:clean(run.event),created_at:run.created_at||null,
  completed_at:run.updated_at||null,
  root_cause:'UNKNOWN_PENDING_ORIGINAL_FAILED_JOB_LOG',
  owner:'original GitHub workflow and ONE BRAIN release owner',
  safe_repair:'EXACT_NATIVE_JOB_DIAGNOSIS_THEN_SAME_OWNER_PROTECTED_FIX',
  prevention_rule:'REPEAT_FAILURE_CLUSTERED_BY_WORKFLOW_AND_CONCLUSION_REQUIRES_PROVEN_REGRESSION',
  regression:'tests/brain-github-actions-failure-observer-20261104.test.mjs',
  independently_repaired:false,is_synthetic:false
 };
 const payloadSha256=createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
 return {state:'NATIVE_FAILURE',fingerprint,occurrenceId,payloadSha256,evidence};
}
export function resolveBrainAuthority(env){
 const url=String(env.BG_PORTAL_EU_SUPABASE_URL||env.SUPABASE_URL||'').trim().replace(/\/$/,'');
 const key=String(env.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY||env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
 let endpoint;try{endpoint=new URL(url);}catch{throw Error('BRAIN_AUTHORITY_URL_MISSING');}
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||
    !/^[a-z0-9-]+\.supabase\.co$/i.test(endpoint.hostname)||
    endpoint.pathname!=='/'&&endpoint.pathname!=='')throw Error('BRAIN_AUTHORITY_URL_UNTRUSTED');
 if(!key)throw Error('BRAIN_AUTHORITY_CREDENTIAL_MISSING');
 return {origin:endpoint.origin,headers:{apikey:key,authorization:'Bearer '+key,
    'content-type':'application/json'}};
}
export async function observeNativeFailure(item,{authority,fetchImpl=globalThis.fetch}={}){
 if(item?.state!=='NATIVE_FAILURE')throw Error('NATIVE_FAILURE_RECEIPT_REQUIRED');
 const path='/rest/v1/brain_failure_occurrences?select=occurrence_id,fingerprint,payload_sha256&occurrence_id=eq.'+
   encodeURIComponent(item.occurrenceId);
 const read=async()=>{
  const response=await fetchImpl(authority.origin+path,{
    headers:authority.headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('BRAIN_OCCURRENCE_READ_HTTP_'+response.status);
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length>1)throw Error('BRAIN_OCCURRENCE_CARDINALITY_INVALID');
  if(rows.length===0)return false;
  if(rows[0].occurrence_id!==item.occurrenceId||
     rows[0].fingerprint!==item.fingerprint||
     rows[0].payload_sha256!==item.payloadSha256)throw Error('BRAIN_OCCURRENCE_CONFLICT');
  return true;
 };
 if(await read())return 'ALREADY_VERIFIED';
 const response=await fetchImpl(authority.origin+'/rest/v1/rpc/brain_observe_failure',{
  method:'POST',headers:authority.headers,
  body:JSON.stringify({p_occurrence_id:item.occurrenceId,p_fingerprint:item.fingerprint,
    p_payload_sha256:item.payloadSha256,p_evidence:item.evidence}),
  signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('BRAIN_OBSERVE_FAILURE_HTTP_'+response.status);
 if(!await read())throw Error('BRAIN_OCCURRENCE_READBACK_MISSING');
 return 'RECORDED_AND_VERIFIED';
}
// Batch the canonical readback, not the writes. Each missing occurrence is still
// written by the existing original Brain RPC, never by direct table insert.
export async function observeNativeFailureBatch(items,{authority,fetchImpl=globalThis.fetch}={}){
 if(!Array.isArray(items)||items.length<1||items.length>40||
    items.some(x=>x?.state!=='NATIVE_FAILURE'))throw Error('NATIVE_FAILURE_BATCH_INVALID');
 const expected=new Map(items.map(x=>[x.occurrenceId,x]));
 if(expected.size!==items.length)throw Error('NATIVE_FAILURE_BATCH_DUPLICATE');
 const path='/rest/v1/brain_failure_occurrences?select=occurrence_id,fingerprint,payload_sha256'+
  '&occurrence_id=in.('+items.map(x=>encodeURIComponent(x.occurrenceId)).join(',')+')';
 const read=async()=>{
  const r=await fetchImpl(authority.origin+path,{
   headers:authority.headers,signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('BRAIN_BATCH_READ_HTTP_'+r.status);
  const rows=await r.json();
  if(!Array.isArray(rows)||rows.length>expected.size)throw Error('BRAIN_BATCH_CARDINALITY_INVALID');
  const found=new Set();
  for(const row of rows){
   const item=expected.get(row?.occurrence_id);
   if(!item||found.has(row.occurrence_id)||row.fingerprint!==item.fingerprint||
      row.payload_sha256!==item.payloadSha256)throw Error('BRAIN_BATCH_READBACK_CONFLICT');
   found.add(row.occurrence_id);
  }
  return found;
 };
 const before=await read();
 for(const item of items){
  if(before.has(item.occurrenceId))continue;
  const response=await fetchImpl(authority.origin+'/rest/v1/rpc/brain_observe_failure',{
   method:'POST',headers:authority.headers,
   body:JSON.stringify({p_occurrence_id:item.occurrenceId,
    p_fingerprint:item.fingerprint,p_payload_sha256:item.payloadSha256,
    p_evidence:item.evidence}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('BRAIN_BATCH_RPC_HTTP_'+response.status);
 }
 const after=await read();
 if(after.size!==items.length)throw Error('BRAIN_BATCH_READBACK_MISSING');
 return {recorded:items.length-before.size,already_verified:before.size};
}
export async function scanNativeFailures({env=process.env,api,now=new Date(),
 observe=observeNativeFailure,authority}={}){
 if(env.GITHUB_REPOSITORY!==REPO)throw Error('NATIVE_REPOSITORY_IDENTITY_MISMATCH');
 // Scan the older complete windows before the recent active window. A transient
 // failure in the newest source window must never erase older verified work.
 const earliest=now.getTime()-48*3600000;
 const unique=new Map();
 const result={schema:'github-actions-native-failure-observer-v1',
  window_start_date:new Date(earliest).toISOString(),windows:12,pages:0,scanned:0,
  failures:0,recorded:0,already_verified:0,completed_windows:0,
  previous_attempts_inspected:0,previous_attempt_failures:0,
  readback_complete:false,source:'original-hourly-janitor',global_green:false};
 let auth=authority;
 const observeWindow=async items=>{
  if(!items.length)return;
  auth=auth||resolveBrainAuthority(env);
  if(observe===observeNativeFailure){
   for(let start=0;start<items.length;start+=40){
    const batch=await observeNativeFailureBatch(items.slice(start,start+40),{authority:auth});
    result.recorded+=batch.recorded;
    result.already_verified+=batch.already_verified;
   }
  }else{
   for(const item of items){
    const state=await observe(item,{authority:auth});
    if(state==='RECORDED_AND_VERIFIED')result.recorded++;
    else if(state==='ALREADY_VERIFIED')result.already_verified++;
    else throw Error('BRAIN_FAILURE_RECEIPT_NOT_PROVEN');
   }
  }
 };
 try{
  // Every fully scanned window gets durable ORIGINAL BRAIN readback before
  // the next source API call; never defer all writes to the last 48h page.
  for(let slot=11;slot>=0;slot--){
   const endMs=now.getTime()-slot*4*3600000;
   const startMs=endMs-4*3600000;
   const range=encodeURIComponent(new Date(startMs).toISOString()+'..'+
     new Date(endMs-1).toISOString());
   let total=null,seen=0,complete=false;
   const windowFailures=new Map(),windowRunIds=new Set();
   let windowAttemptReads=0;
   for(let page=1;page<=10;page++){
    const path='repos/'+REPO+'/actions/runs?status=completed&per_page=100&page='+page+
      '&created='+range;
    const response=await api(path);
    const count=Number(response?.total_count);
    if(!Array.isArray(response?.workflow_runs)||!Number.isSafeInteger(count)||count<0)
     throw Error('GITHUB_RUNS_SOURCE_UNAVAILABLE');
    if(count>1000)throw Error('GITHUB_RUNS_WINDOW_OVERFLOW');
    if(total!==null&&total!==count)throw Error('GITHUB_RUNS_WINDOW_CHANGED_RETRY_REQUIRED');
    total=count;result.pages++;seen+=response.workflow_runs.length;
    result.scanned+=response.workflow_runs.length;
    for(const run of response.workflow_runs){
     const verdict=classifyActionsRun(run);
     if(verdict.state==='SOURCE_RUN_INVALID')throw Error('GITHUB_RUN_SOURCE_IDENTITY_UNVERIFIED');
     if(windowRunIds.has(run.id))throw Error('GITHUB_RUN_DUPLICATE_IN_SOURCE_WINDOW');
     windowRunIds.add(run.id);
     const history=await recoverEarlierNativeAttempts(run,{api,
       budget:MAX_OLDER_ATTEMPT_READS_PER_WINDOW-windowAttemptReads});
     windowAttemptReads+=history.inspected;
     result.previous_attempts_inspected+=history.inspected;
     result.previous_attempt_failures+=history.failures.length;
     for(const item of [verdict,...history.failures]){
      if(item.state!=='NATIVE_FAILURE')continue;
      const previous=windowFailures.get(item.occurrenceId);
      if(previous&&previous.payloadSha256!==item.payloadSha256)
       throw Error('GITHUB_RUN_SOURCE_EVIDENCE_CONFLICT');
      windowFailures.set(item.occurrenceId,item);
     }
    }
    if(response.workflow_runs.length<100){complete=true;break;}
   }
   if(!complete||seen!==total)throw Error('GITHUB_RUNS_PAGINATION_INCOMPLETE');
   const fresh=[];
   for(const item of windowFailures.values()){
    const previous=unique.get(item.occurrenceId);
    if(previous&&previous.payloadSha256!==item.payloadSha256)
     throw Error('GITHUB_RUN_CROSS_WINDOW_SOURCE_CONFLICT');
    if(!previous)fresh.push(item);
   }
   // Use the same source-verified idempotent brain_observe_failure RPC.
   // A source error later cannot roll back already proven occurrences.
   await observeWindow(fresh);
   for(const item of fresh)unique.set(item.occurrenceId,item);
   result.completed_windows++;
   result.failures=unique.size;
  }
  // Retain the original authority check even for an all-success empty scan.
  auth=auth||resolveBrainAuthority(env);
  result.readback_complete=true;
  return result;
 }catch(error){
  // Operator audit has the original bounded proof counters, never raw secrets
  // or a false full-coverage success on a failed source window.
  if(error&&typeof error==='object')error.partial_checkpoint=Object.freeze({
   completed_windows:result.completed_windows,scanned:result.scanned,
   pages:result.pages,verified_failures:result.failures,
   previous_attempts_inspected:result.previous_attempts_inspected,
   previous_attempt_failures:result.previous_attempt_failures,
   recorded:result.recorded,already_verified:result.already_verified,
   readback_complete:false,global_green:false
  });
  throw error;
 }
}

const api=path=>JSON.parse(execFileSync('gh',['api',path],{
 encoding:'utf8',timeout:20000,maxBuffer:10_000_000,stdio:['ignore','pipe','pipe']}));
if(process.argv[1]?.endsWith('github-actions-failure-observer.mjs')&&
   process.argv.includes('--observe')){
 try{
  await mkdir('.artifacts',{recursive:true});
  const result=await scanNativeFailures({api});
  await writeFile('.artifacts/github-actions-failure-observer.json',JSON.stringify(result,null,2)+'\n');
  console.log('GITHUB_ACTIONS_ONE_BRAIN_READBACK_CONFIRMED:'+result.failures);
 }catch(error){
  await mkdir('.artifacts',{recursive:true});
  await writeFile('.artifacts/github-actions-failure-observer.json',
    JSON.stringify({schema:'github-actions-native-failure-observer-v1',
      readback_complete:false,global_green:false,
      partial_checkpoint:error?.partial_checkpoint||null,
      error:clean(error?.message)},null,2)+'\n');
  console.error('GITHUB_ACTIONS_INCIDENT_COVERAGE_UNVERIFIED:'+clean(error?.message));
  process.exitCode=1;
 }
}
