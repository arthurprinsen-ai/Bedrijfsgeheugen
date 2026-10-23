// Run-local facts from the existing Recovery Supervisor, not another scheduler or truth register.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const TYPES=['CIRCUIT_OPEN','DRIFT_DETECTED','LEASE_DENIED','REPEATED_DRIFT','BUDGET_EXHAUSTED','CAS_REQUEST','CAS_ACCEPTED','CAS_ASYNC_PENDING','CAS_PROVEN','CAS_REJECTED','SYNC_TIMEOUT','SYNC_RACE','SYNC_RECONCILED'];
const KNOWN=new Set(TYPES);
export function summarizeRecoveryEvents(raw,{runId=null,headSha=null,exitCode=0,observedAt=null}={}){
  if(typeof raw!=='string')throw new Error('RECOVERY_METRICS_INPUT_INVALID');
  const rows=raw.split(/\r?\n/u).filter(Boolean);
  if(rows.length>10000)throw new Error('RECOVERY_METRICS_TOO_MANY_ROWS');
  const counts=Object.fromEntries(TYPES.map(x=>[x,0]));
  const drift=new Set(),repeated=new Set(),perPr=new Map();
  for(const row of rows){
    const f=row.split('\t');
    if(f.length!==3||!/^(0|[1-9][0-9]{0,9})$/u.test(f[0])||!KNOWN.has(f[1])||!/^(0|[1-9][0-9]{0,5})$/u.test(f[2]))throw new Error('RECOVERY_METRICS_EVENT_INVALID');
    const pr=Number(f[0]),type=f[1],attempt=Number(f[2]);
    if((type==='CIRCUIT_OPEN')!==(pr===0))throw new Error('RECOVERY_METRICS_PR_INVALID');
    counts[type]++;
    if(type==='DRIFT_DETECTED')drift.add(pr);
    if(type==='REPEATED_DRIFT')repeated.add(pr);
    if(pr>0){if(!perPr.has(pr))perPr.set(pr,{pr,events:[],max_attempt:0});
      const item=perPr.get(pr);item.events.push(type);item.max_attempt=Math.max(item.max_attempt,attempt);}
  }
  const code=Number(exitCode);
  if(!Number.isSafeInteger(code)||code<0||code>255)throw new Error('RECOVERY_METRICS_EXIT_INVALID');
  const sample=[...perPr.values()].sort((a,b)=>a.pr-b.pr).slice(0,50);
  return {schema:'POWERHOUSE_RECOVERY_DRIFT_EVIDENCE-v1',authority:'EXISTING_RECOVERY_SUPERVISOR',
    proof_level:'PROVIDER_RUN_SOURCE_ONLY',run_id:runId,head_sha:headSha,observed_at:observedAt,
    exit_code:code,supervisor_step_succeeded:code===0,
    // A successful job can stop at its recovery budget: zero observed drift is not zero repository drift.
    // No eligible-PR denominator or end-of-scan proof is present in this run-local event stream.
    source_snapshot_complete:false,
    coverage_state:'PARTIAL_OR_UNPROVEN',
    eligible_pr_denominator:null,
    classified_pr_denominator:null,
    zero_drift_global_claim_allowed:false,
    event_rows:rows.length,counts,distinct_drift_prs:drift.size,repeated_drift_prs:repeated.size,
    sampled_prs:sample,sample_truncated:perPr.size>50,time_to_green_ms:null,
    customer_outcome_verified:false,release_authorized:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const input=process.env.RECOVERY_METRICS_TSV;
  if(!input)throw new Error('RECOVERY_METRICS_INPUT_MISSING');
  const result=summarizeRecoveryEvents(fs.readFileSync(input,'utf8'),{
    runId:process.env.GITHUB_RUN_ID||null,headSha:process.env.GITHUB_SHA||null,
    exitCode:process.env.RECOVERY_METRICS_EXIT_CODE||0,observedAt:new Date().toISOString()});
  fs.mkdirSync('.artifacts',{recursive:true});
  fs.writeFileSync('.artifacts/powerhouse-recovery-drift-evidence.json',JSON.stringify(result,null,2)+'\n');
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,[
    '### Recovery Supervisor — observed drift evidence',
    'Distinct drift PRs: '+result.distinct_drift_prs+'; repeated drift PRs: '+result.repeated_drift_prs,
    'CAS requested / accepted / proven / rejected: '+[result.counts.CAS_REQUEST,result.counts.CAS_ACCEPTED,result.counts.CAS_PROVEN,result.counts.CAS_REJECTED].join(' / '),
    'Lease denied: '+result.counts.LEASE_DENIED+'; budget exhausted: '+result.counts.BUDGET_EXHAUSTED,
    'Coverage: PARTIAL_OR_UNPROVEN; zero observed events do not prove zero open PR drift.',
    'Observation only, never proof of protected merge or customer outcome.'].join('\n')+'\n');
  process.stdout.write(JSON.stringify({status:'RECOVERY_METRICS_RECORDED',event_rows:result.event_rows,counts:result.counts})+'\n');
}
