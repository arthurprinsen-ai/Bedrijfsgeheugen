import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
// Diagnostic extension of the canonical Janitor/CI telemetry and Recovery Supervisor.
// Never grants writer authority, weakens Required/CodeQL or promotes production.
const SHA=/^[0-9a-f]{40}$/;
const active=new Set(['queued','pending','waiting','requested','in_progress']);
const stamp=v=>{const n=Date.parse(v??'');return Number.isFinite(n)?n:null};
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const field=(body,name)=>{const x=[...String(body??'').matchAll(new RegExp('^'+name+': ([^\\r\\n]+)$','gm'))];return x.length===1?x[0][1].trim():null};
export function inspectRepeatExecutions(runs=[]){
 const ids=new Set(),groups=new Map();
 for(const r of runs){
  const id=Number(r?.id),workflow=Number(r?.workflow_id),head=r?.head_sha;
  if(!Number.isSafeInteger(id)||id<=0||ids.has(id)||!Number.isSafeInteger(workflow)||workflow<=0||
    !SHA.test(head??'')||stamp(r?.created_at)===null||r?.event!=='pull_request')continue;
  ids.add(id);const key=workflow+':'+head;const row=groups.get(key)??[];row.push(r);groups.set(key,row);
 }
 const repeat_groups=[...groups].filter(([,rows])=>rows.length>1).map(([key,rows])=>({
  workflow_id:Number(key.split(':')[0]),exact_head_sha:key.split(':')[1],
  observed_distinct_runs:rows.length,repeat_executions_lower_bound:rows.length-1,
  run_ids:rows.map(r=>r.id),active_run_ids:rows.filter(r=>active.has(r.status)).map(r=>r.id),
  verdict:'REPEATED_SAME_HEAD_OBSERVED_NOT_PROVEN_WASTE',
  suppression:'ONLY_EXISTING_EXACT_HEAD_ACTIVE_SINGLE_FLIGHT',
  required_or_security_gate_may_be_skipped:false
 })).sort((a,b)=>b.repeat_executions_lower_bound-a.repeat_executions_lower_bound||a.workflow_id-b.workflow_id);
 return {classification:'diagnostic_only',evidence:'bounded_actions_run_snapshot',runs_scanned:runs.length,repeat_groups,
  total_repeat_executions_lower_bound:repeat_groups.reduce((n,r)=>n+r.repeat_executions_lower_bound,0),
  can_waive_required_or_codeql:false};
}
export function locateMeasuredDelay(jobs=[],{minimumPairedJobs=10}={}){
 const paired=jobs.filter(j=>valid(j?.queue_seconds)&&valid(j?.execution_seconds));
 if(paired.length<minimumPairedJobs)return {status:'INSUFFICIENT_PAIRED_JOB_EVIDENCE',paired_jobs:paired.length,total_job_rows:jobs.length,bottleneck:null,queue_seconds:null,execution_seconds:null};
 const queue=paired.reduce((n,j)=>n+j.queue_seconds,0),execution=paired.reduce((n,j)=>n+j.execution_seconds,0);
 return {status:'MEASURED_IN_BOUNDED_SAMPLE',paired_jobs:paired.length,total_job_rows:jobs.length,
  bottleneck:queue>execution?'RUNNER_QUEUE_WAIT':execution>queue?'JOB_EXECUTION':'TIED',
  queue_seconds:queue,execution_seconds:execution,attribution:'observational_only_no_causal_claim',missing_rows_not_zero:true};
}
function activeHead(runs,number,head){
 return runs.some(r=>{
  if(!active.has(r?.status))return false;
  if(r.event==='pull_request'&&r.head_sha===head&&(r.name==='Powerhouse CodeQL'||/^Required test(?:$| PR #\d+\s)/.test(r.name??'')))return true;
  const match=/^Required test PR #(\d+) ([0-9a-f]{40})$/.exec(String(r?.display_title??''));
  return r.event==='workflow_dispatch'&&match&&Number(match[1])===number&&match[2]===head;
 });
}
export function rankRecoveryCandidates(prs=[],runs=[],{now=new Date().toISOString()}={}){
 if(!Array.isArray(prs)||!Array.isArray(runs))throw new TypeError('PRs and runs must be arrays');
 const at=stamp(now);if(at===null)throw new TypeError('invalid time');
 const counts=new Map();for(const p of prs){const o=field(p?.body,'Obligation-ID');if(o)counts.set(o,(counts.get(o)??0)+1)}
 const ev=prs.map((p,i)=>{
  const number=p?.number,head=p?.head?.sha,obligation=field(p?.body,'Obligation-ID'),blockers=[];
  if(p?.state!=='open'||!Number.isSafeInteger(number)||number<=0)blockers.push('NOT_OPEN_PR');
  if(p?.base?.ref!=='main'||!p?.base?.repo?.full_name||p?.head?.repo?.full_name!==p?.base?.repo?.full_name)blockers.push('NOT_SAME_REPO_MAIN');
  if(!SHA.test(head??'')||!SHA.test(p?.base?.sha??''))blockers.push('UNVERIFIED_SHA');
  if(field(p?.body,'Writer-Lease-State')!=='TERMINAL_DELIVERY'||!field(p?.body,'Writer-Lease-Owner')||
    !field(p?.body,'Writer-Lease-Obligation')||field(p?.body,'Writer-Lease-Head')!==head)blockers.push('NO_EXACT_TERMINAL_LEASE');
  if(!obligation||counts.get(obligation)!==1)blockers.push('OBLIGATION_DUPLICATE_OR_MISSING');
  const d=field(p?.body,'Writer-Lease-Drift-Refreshes');
  if(d!==null&&(!/^\d+$/.test(d)||Number(d)>=2))blockers.push('DRIFT_BUDGET_EXHAUSTED');
  const changed=stamp(p?.updated_at);if(changed===null||changed>at)blockers.push('INVALID_UPDATED_AT');
  const busy=activeHead(runs,number,head);
  const score=blockers.length?null:(busy?0:1000000)+Math.min(604800,Math.floor(Math.max(0,at-(changed??at))/1000));
  return {pr:p,index:i,pr_number:number,score,blockers,active_exact_head_ci:busy,
    status:blockers.length?'EXISTING_SUPERVISOR_EVALUATION_ONLY':busy?'WAIT_FOR_ACTIVE_EXACT_HEAD_CI':'PRIORITY_FOR_INDEPENDENT_PREFLIGHT'};
 });
 ev.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.index-b.index);
 return {ranked_prs:ev.map(x=>x.pr),advisory:ev.map(({pr,...x})=>x),verified_safe_to_sync:false,
  next_authority:'EXISTING_RECOVERY_SUPERVISOR_LIVE_COMPARE_LEASE_CAS_REQUIRED_CODEQL'};
}
// Independent baseline is necessary, never sufficient: original seven-stage agent
// admission, protected release and production readback remain authoritative.
export function assessTechniqueEvidence({baseline,candidate,evaluation,rollout}={}){
 const blockers=[];
 if(!baseline||!candidate||!evaluation||!rollout)blockers.push('INCOMPLETE_EVIDENCE');
 for(const [name,item] of [['baseline',baseline],['candidate',candidate]]){
  if(!item||!Number.isSafeInteger(item.samples)||item.samples<30||!valid(item.failure_rate)||item.failure_rate>1||
    !valid(item.latency_p95_ms)||!item.evidence_ref||!item.dataset_id)blockers.push(name.toUpperCase()+'_UNPROVEN');
 }
 if(!evaluation?.independent||!evaluation.evidence_ref||!evaluation.regressions_passed||!evaluation.security_passed||
    !evaluation.comparator_matched||!baseline?.dataset_id||baseline.dataset_id!==candidate?.dataset_id||
    !evaluation.evaluator||!candidate?.producer||evaluation.evaluator===candidate.producer)blockers.push('INDEPENDENT_MATCHED_EVALUATION_UNPROVEN');
 if(valid(baseline?.latency_p95_ms)&&valid(candidate?.latency_p95_ms)&&candidate.latency_p95_ms>baseline.latency_p95_ms*1.05)blockers.push('LATENCY_REGRESSION');
 if(valid(baseline?.failure_rate)&&valid(candidate?.failure_rate)&&candidate.failure_rate>baseline.failure_rate)blockers.push('FAILURE_RATE_REGRESSION');
 if(!rollout?.shadow_proven||!rollout?.canary_proven||!rollout?.rollback_tested||!rollout?.provider_readback||!rollout?.controlled_exposure_proven)blockers.push('CONTROLLED_ROLLOUT_UNPROVEN');
 const unique=[...new Set(blockers)];
 return {status:unique.length?'QUALITY_STEPS_HOLD':'ELIGIBLE_FOR_EXISTING_PROTECTED_RELEASE_GATES',
  blockers:unique,production_behavior_change_allowed:false,independently_verified_production_success:false,
  authority:'EXISTING_SEVEN_STAGE_AI_POLICY_AND_PROTECTED_DELIVERY'};
}
async function main(){
 const [mode,pfile,rfile]=process.argv.slice(2);
 if(mode!=='--rank'||!pfile||!rfile)throw new Error('Usage: --rank <prs.json> <runs.json>');
 const prs=JSON.parse(await readFile(pfile,'utf8')),payload=JSON.parse(await readFile(rfile,'utf8'));
 if(!Array.isArray(payload.workflow_runs))throw new TypeError('missing workflow_runs');
 const result=rankRecoveryCandidates(prs,payload.workflow_runs);
 process.stderr.write('CI_ADAPTIVE_PRIORITY '+JSON.stringify({prioritized:result.advisory.filter(x=>x.status==='PRIORITY_FOR_INDEPENDENT_PREFLIGHT').map(x=>x.pr_number),duplicates:inspectRepeatExecutions(payload.workflow_runs).total_repeat_executions_lower_bound,authority:result.next_authority})+'\n');
 process.stdout.write(JSON.stringify(result.ranked_prs)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
