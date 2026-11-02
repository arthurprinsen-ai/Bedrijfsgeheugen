import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Canonical existing Janitor owner: read-only lineage verification and same-run incident evidence.
export const FINGERPRINT='github|janitor-terminal-lease|bounded-successor-history|http422-sigpipe|20261101-v1';
export const INCIDENT_NUMBER=5320;
const SHA=/^[0-9a-f]{40}$/i;
const repoOk=x=>/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(x||'');
const numberOk=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<1_000_000_000;
const clean=x=>String(x??'').replace(/[\x00-\x1f]/g,' ').slice(0,180);
const metadata=(text,key)=>String(text||'').split(/\r?\n/).find(line=>line.startsWith(key+': '))?.slice(key.length+2).trim()||null;
export function mergedSuccessorIsProven(pr,{predecessor,obligation}={}){
 return numberOk(pr?.number)&&Number(pr.number)>Number(predecessor)&&pr.state==='closed'&&
 pr.merged===true&&typeof pr.merged_at==='string'&&pr.merged_at.length>0&&
 metadata(pr.body,'Obligation-ID')===obligation&&
 metadata(pr.body,'Supersedes')?.replace(/^#/,'')===String(Number(predecessor));
}
export async function verifyMergedSuccessor({repo,predecessor,obligation,search,readPr}={}){
 if(!repoOk(repo)||!numberOk(predecessor)||!/^[-a-z0-9_|:.]{5,180}$/i.test(obligation||''))
   return {status:'INVALID_INPUT_FAIL_CLOSED',proven:false,safe_to_reopen:false};
 try{
   const query='repo:'+repo+' is:pr is:merged "'+obligation+'"';
   const candidates=await search(query);
   if(!Array.isArray(candidates?.items))throw Error('SEARCH_RESULT_INVALID');
   // Only a positive direct PR readback is authoritative; absence in search proves nothing.
   const ids=[...new Set(candidates.items.map(x=>Number(x.number)).filter(numberOk))].slice(0,20);
   for(const id of ids){
     const pr=await readPr(id);
     if(mergedSuccessorIsProven(pr,{predecessor,obligation}))return {
       status:'PROVEN_MERGED_SUCCESSOR',proven:true,safe_to_reopen:false,
       predecessor_number:Number(predecessor),successor_number:id,
       successor_merged_at:pr.merged_at,
       evidence:'GITHUB_SEARCH_POSITIVE_PLUS_DIRECT_MERGED_PR_READBACK'};
   }
   return {status:'HISTORY_UNPROVEN_DEFER',proven:false,safe_to_reopen:false,
     predecessor_number:Number(predecessor),searched_candidates:ids.length,
     search_incomplete:candidates.incomplete_results===true};
 }catch{return {status:'PROVIDER_READ_UNAVAILABLE_DEFER',proven:false,
   predecessor_number:Number(predecessor),safe_to_reopen:false,
   reason:'SEARCH_OR_DIRECT_PR_READ_FAILED'};}
}
export function classifyCurrentJanitor({cleanupOutcome,readbackOutcome,actions=[],runId,mainSha}={}){
 const allowed=['success','failure','skipped','cancelled'];
 const cleanup=allowed.includes(cleanupOutcome)?cleanupOutcome:'unknown';
 const readback=allowed.includes(readbackOutcome)?readbackOutcome:'unknown';
 const failed=[['cleanup',cleanup],['readback',readback]].filter(x=>x[1]==='failure').map(x=>x[0]);
 const verified=actions.filter(x=>x?.type==='TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR'&&
   numberOk(x.successor_number)).map(x=>({predecessor:x.pr_number,successor:x.successor_number,
     evidence:x.evidence||'BOUNDED_POSITIVE'}));
 const deferred=actions.filter(x=>x?.type==='TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN')
   .map(x=>({pr_number:x.pr_number,reason:x.reason||'HISTORY_UNPROVEN'}));
 const status=failed.length?'INCIDENT_OPEN_STEP_FAILURE':
   cleanup==='success'&&readback==='success'?'JANITOR_STEPS_VERIFIED_SAME_RUN':
   cleanup==='skipped'&&readback==='skipped'?'DRY_RUN_NO_MUTATION':'INCOMPLETE_PROOF';
 return {schema:'janitor-incident-agent-v1',fingerprint:FINGERPRINT,observed_at:new Date().toISOString(),
   run_id:numberOk(runId)?Number(runId):null,main_sha:SHA.test(mainSha||'')?mainSha:null,
   cleanup_outcome:cleanup,readback_outcome:readback,failed_steps:failed,
   verified_merged_successors:verified,deferred_history:deferred,status,
   global_green:false,independent_runtime_repair_proven:status==='JANITOR_STEPS_VERIFIED_SAME_RUN',
   owner:'existing-powerhouse-github-delivery-janitor',
   next_action:failed.length?'EXISTING_OWNER_ROOT_CAUSE_AND_PROTECTED_REPAIR':
     deferred.length?'FULL_LINEAGE_OWNER_RECONCILIATION':
     status==='JANITOR_STEPS_VERIFIED_SAME_RUN'?'INDEPENDENT_PORTAL_AND_MAIN_READBACK':
       'WAIT_FOR_NEXT_ELIGIBLE_NATIVE_RUN'};
}
const api=args=>execFileSync('gh',['api',...args],{
  encoding:'utf8',timeout:15000,maxBuffer:3_000_000,stdio:['ignore','pipe','pipe']
});
export async function writeBrainOccurrence({env,report,fetchImpl=globalThis.fetch}={}){
 if(!report?.failed_steps?.length)return {status:'NO_FAILURE_TO_RECORD'};
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
 const occurrenceId='github-actions:janitor:run:'+report.run_id+':attempt:'+attempt+':failed:'+report.failed_steps.join('-');
 const evidence={source:'GITHUB_NATIVE_JANITOR_AGENT',source_url:report.source_url,
   incident_url:report.incident_url,run_id:report.run_id,run_attempt:attempt,
   main_sha:report.main_sha,cleanup_outcome:report.cleanup_outcome,
   readback_outcome:report.readback_outcome,failed_steps:report.failed_steps,
   root_cause:'UNVERIFIED_REQUIRE_ORIGINAL_JOB_LOG',owner:report.owner,
   safe_repair:'EXCLUSIVE_EXISTING_JANITOR_OWNER_PROTECTED_RELEASE',
   regression:'tests/brain-janitor-agent-self-recovery-20261102.test.mjs',
   prevention_rule:'NO_BLIND_REOPEN_AND_NO_FALSE_GREEN',
   status:'INCIDENT_OPEN_STEP_FAILURE'};
 const hash=createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
 const headers={apikey:key,authorization:'Bearer '+key,'content-type':'application/json'};
 const observed=await fetchImpl(endpoint.origin+'/rest/v1/rpc/brain_observe_failure',{
   method:'POST',headers,body:JSON.stringify({p_occurrence_id:occurrenceId,
     p_fingerprint:FINGERPRINT,p_payload_sha256:hash,p_evidence:evidence}),
   signal:AbortSignal.timeout(10000)});
 if(!observed.ok)throw Error('BRAIN_RPC_FAILURE_HTTP_'+observed.status);
 const read=await fetchImpl(endpoint.origin+'/rest/v1/brain_failure_occurrences?select=occurrence_id,fingerprint,payload_sha256&occurrence_id=eq.'+encodeURIComponent(occurrenceId),{
   method:'GET',headers,signal:AbortSignal.timeout(10000)});
 if(!read.ok)throw Error('BRAIN_RPC_READBACK_HTTP_'+read.status);
 const rows=await read.json();
 if(!Array.isArray(rows)||rows.length!==1||rows[0].occurrence_id!==occurrenceId||
   rows[0].fingerprint!==FINGERPRINT||rows[0].payload_sha256!==hash){
   throw Error('BRAIN_RPC_READBACK_MISMATCH');
 }
 return {status:'BRAIN_OCCURRENCE_READBACK_CONFIRMED',verified:true,occurrence_id:occurrenceId,
   fingerprint:FINGERPRINT,payload_sha256:hash};
}
async function observe(env=process.env,provider=api){
 if(!repoOk(env.GITHUB_REPOSITORY)||!numberOk(env.GITHUB_RUN_ID))throw Error('RUN_IDENTITY_INVALID');
 await mkdir('.artifacts',{recursive:true});
 let actions=[];
 try{let data=JSON.parse(await readFile('.artifacts/janitor-runtime-actions.json','utf8'));
   if(Array.isArray(data))actions=data;}catch{}
 const report=classifyCurrentJanitor({cleanupOutcome:env.JANITOR_CLEANUP_OUTCOME,
   readbackOutcome:env.JANITOR_READBACK_OUTCOME,actions,runId:env.GITHUB_RUN_ID,
   mainSha:env.GITHUB_SHA});
 report.source_url='https://github.com/'+env.GITHUB_REPOSITORY+'/actions/runs/'+env.GITHUB_RUN_ID;
 report.incident_url='https://github.com/'+env.GITHUB_REPOSITORY+'/issues/'+INCIDENT_NUMBER;
 await writeFile('.artifacts/janitor-agent-incident.json',JSON.stringify(report,null,2)+'\n');
 if(report.failed_steps.length){
   const repo=env.GITHUB_REPOSITORY;
   const marker='<!-- janitor-agent-run:'+env.GITHUB_RUN_ID+':'+(env.GITHUB_RUN_ATTEMPT||1)+' -->';
   const issue=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER]));
   const page=Math.max(1,Math.ceil(Math.max(1,Number(issue.comments)||1)/100));
   const comments=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER+'/comments?per_page=100&page='+page]));
   if(!Array.isArray(comments))throw Error('INCIDENT_READBACK_UNAVAILABLE');
   if(!comments.some(x=>String(x?.body||'').includes(marker))){
     const body=marker+'\nAutonomous Janitor observer: **INCIDENT_OPEN**. Run '+
       env.GITHUB_RUN_ID+' attempt '+clean(env.GITHUB_RUN_ATTEMPT||'1')+
       ', exact SHA '+clean(env.GITHUB_SHA)+', failed steps: '+report.failed_steps.join(', ')+
       '. Direct error signature/HTTP endpoint not independently proven by step result; inspect job logs. '+
       'Owner: original Powerhouse GitHub delivery/Janitor. Same-lineage protected repair, no blind retries. '+
       report.source_url;
     provider(['-X','POST','repos/'+repo+'/issues/'+INCIDENT_NUMBER+'/comments','-f','body='+body]);
     const updated=JSON.parse(provider(['repos/'+repo+'/issues/'+INCIDENT_NUMBER]));
     if(Number(updated.comments)<=Number(issue.comments))throw Error('INCIDENT_WRITEBACK_UNVERIFIED');
   }
   report.issue_writeback='PROVIDER_READBACK_CONFIRMED';
   const brain=await writeBrainOccurrence({env,report});
   report.brain_writeback=brain;
   await writeFile('.artifacts/janitor-agent-incident.json',JSON.stringify(report,null,2)+'\n');
   if(brain.verified!==true)throw Error('BRAIN_INCIDENT_WRITEBACK_UNVERIFIED:'+brain.status);
 }
 console.log('JANITOR_AGENT:'+report.status+':'+report.run_id);
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
 throw Error('JANITOR_AGENT_MODE_INVALID');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main(process.argv.slice(2)).catch(error=>{
   console.error('JANITOR_AGENT_WRITEBACK_OR_SOURCE_FAILED:'+clean(error.message));
   process.exitCode=78;
 });
