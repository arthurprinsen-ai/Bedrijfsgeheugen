// Bounded, read-only PR ordering for the EXISTING Recovery Supervisor.
// Ranking cannot write, waive Required/CodeQL, or replace live CAS and lease checks.
import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const SHA=/^[0-9a-f]{40}$/i;
const ACTIVE=new Set(['queued','in_progress','pending','waiting','requested']);
const MAX_REFRESHES=2;
const LOOKBACK_MS=48*60*60*1000;
function field(body,label){
  const lines=String(body||'').split(/\r?\n/).filter(x=>x.startsWith(label+': '));
  return lines.length===1?lines[0].slice(label.length+2).trim():null;
}
function requiredFor(runs,pr,now){
  const seen=new Set(),head=pr?.head?.sha;
  return runs.filter(r=>{
    if(!Number.isSafeInteger(r?.id)||seen.has(r.id)||r.event!=='pull_request'||
       r.head_sha!==head||r.name!==`Required test PR #${pr.number} ${head}`)return false;
    const when=Date.parse(r.created_at??'');
    if(!Number.isFinite(when)||when>now||now-when>LOOKBACK_MS)return false;
    seen.add(r.id);return true;
  });
}
function getLease(pr,repo,mainSha){
  const b=pr?.body??'';
  const state=field(b,'Writer-Lease-State'),head=field(b,'Writer-Lease-Head');
  const epoch=field(b,'Writer-Lease-Main-Epoch'),base=field(b,'Base-SHA');
  const owner=field(b,'Writer-Lease-Owner'),obligation=field(b,'Writer-Lease-Obligation');
  const raw=field(b,'Writer-Lease-Drift-Refreshes');
  const count=raw===null?0:/^\d{1,2}$/.test(raw)?Number(raw):NaN;
  // Reconciliation of a pre-existing MAIN_SYNC at attempt two does not
  // authorize any additional update-branch write. Terminal leases still
  // must have remaining budget for a new CAS request.
  const withinBudget=Number.isInteger(count)&&count>=0&&
    (state==='MAIN_SYNC'?count<=MAX_REFRESHES:count<MAX_REFRESHES);
  const valid=pr?.state==='open'&&pr?.draft!==true&&
    pr?.head?.repo?.full_name===repo&&pr?.base?.repo?.full_name===repo&&
    SHA.test(pr?.head?.sha??'')&&head===pr.head.sha&&
    SHA.test(epoch??'')&&SHA.test(base??'')&&
    typeof owner==='string'&&owner.length>0&&
    typeof obligation==='string'&&obligation.length>0&&
    withinBudget;
  return {state,valid,count:Number.isInteger(count)?count:null,main_epoch_stale:epoch!==mainSha};
}
function duration(run){
  if(run.status!=='completed'||run.conclusion!=='success')return null;
  const a=Date.parse(run.created_at??''),b=Date.parse(run.updated_at??'');
  return Number.isFinite(a)&&Number.isFinite(b)&&b>=a&&b-a<=86400000
    ?Math.round((b-a)/1000):null;
}
function median(values){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2);
}
export function rankRecoveryCandidates({prs=[],requiredRuns=[],repo='',mainSha='',now=Date.now()}={}){
  if(!Array.isArray(prs)||!Array.isArray(requiredRuns)||!SHA.test(mainSha)||
    !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repo)||!Number.isFinite(now)||
    prs.some(p=>!Number.isSafeInteger(p?.number)||p.number<1)||
    new Set(prs.map(p=>p.number)).size!==prs.length)
    throw new TypeError('RECOVERY_PRIORITY_UNTRUSTED_SNAPSHOT');
  const records=prs.map((pr,index)=>{
    const lease=getLease(pr,repo,mainSha),runs=requiredFor(requiredRuns,pr,now);
    const active=runs.some(r=>ACTIVE.has(r.status));
    const completed=runs.filter(r=>r.status==='completed');
    const lengths=runs.map(duration).filter(Number.isFinite);
    const observedSuccess=runs.some(r=>r.status==='completed'&&r.conclusion==='success');
    const eligible=lease.valid&&(lease.state==='MAIN_SYNC'||lease.state==='TERMINAL_DELIVERY');
    const tier=eligible&&lease.state==='MAIN_SYNC'?0:
      eligible&&lease.main_epoch_stale&&!active&&observedSuccess?1:
      eligible&&lease.main_epoch_stale&&!active?2:
      eligible&&lease.main_epoch_stale?3:4;
    const updated=Date.parse(pr.updated_at??'');
    return {pr,index,lease,tier,active,observedSuccess,repeats:Math.max(0,completed.length-1),
      successes:lengths.length,median:median(lengths),
      updated:Number.isFinite(updated)?updated:0};
  });
  // Exact-head positive evidence is a priority signal, never a gate result.
  // Missing observations in a bounded provider sample remain unknown, not failed.
  records.sort((a,b)=>a.tier-b.tier||
    (a.tier===4?a.index-b.index:
      (a.lease.count??MAX_REFRESHES)-(b.lease.count??MAX_REFRESHES)||
      b.updated-a.updated||a.pr.number-b.pr.number));
  return {
    schema:'recovery-supervisor-priority-v1',
    sample:'BOUNDED_GITHUB_REQUIRED_RUNS_NOT_FULL_CI_HISTORY',
    safety:{mutation_authority:false,skip_required_or_codeql:false,
      cas_and_lease_preflight_required:true,max_drift_refreshes:MAX_REFRESHES,
      can_claim_duplicate_runner_savings:false},
    observed_required_runs:requiredRuns.length,
    potential_same_head_repeats:records.reduce((s,r)=>s+r.repeats,0),
    prior_drift_refreshes:records.reduce((s,r)=>s+(r.lease.count??0),0),
    ordered_prs:records.map(r=>r.pr),
    rankings:records.map((r,i)=>({rank:i+1,number:r.pr.number,
      advisory_stage:r.tier===0?'RECONCILE_EXISTING_MAIN_SYNC':
        r.tier<=2?'PREFLIGHT_STALE_TERMINAL_LEASE':
        r.tier===3?'OBSERVE_ACTIVE_EXACT_HEAD':'UNCHANGED_OTHER_RECOVERY',
      lease_valid:r.lease.valid,prior_drift_refreshes:r.lease.count,
      observed_active_required:r.active,
      observed_completed_exact_head_required_success:r.observedSuccess,
      potential_same_head_repeats:r.repeats,
      required_success_median_seconds:r.successes>=2?r.median:null,
      causal_speedup_proven:false}))
  };
}
async function main(){
  const [prFile,runFile,mainSha,outFile]=process.argv.slice(2);
  if(!prFile||!runFile||!mainSha||!outFile)throw new TypeError('RECOVERY_PRIORITY_INPUTS_MISSING');
  const prs=JSON.parse(await readFile(prFile,'utf8'));
  const payload=JSON.parse(await readFile(runFile,'utf8'));
  if(!Array.isArray(payload.workflow_runs)||!Number.isSafeInteger(payload.total_count)||
     payload.total_count<payload.workflow_runs.length)
    throw new TypeError('RECOVERY_PRIORITY_PROVIDER_SAMPLE_INVALID');
  const result=rankRecoveryCandidates({prs,requiredRuns:payload.workflow_runs,
    repo:process.env.GITHUB_REPOSITORY,mainSha});
  await writeFile(outFile,JSON.stringify(result.ordered_prs)+'\n');
  console.log('RECOVERY_PRIORITY_EVIDENCE:'+JSON.stringify({
    top:result.rankings.slice(0,5),potential_repeats_not_proven_waste:result.potential_same_head_repeats,
    prior_drift_refreshes:result.prior_drift_refreshes,sample:result.sample}));
  if(process.env.GITHUB_STEP_SUMMARY){
    const lines=result.rankings.slice(0,5).map(r=>`| #${r.number} | ${r.advisory_stage} | ${r.prior_drift_refreshes??'unknown'} |`).join('\n');
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `\n### Existing Recovery Supervisor: evidence-ranked PRs\n\n| PR | Advisory state | Prior refreshes |\n|---|---|---:|\n${lines}\n\nBounded Required sample: ${result.observed_required_runs}; same-head repeats are not proof that Required may be skipped. No measured speedup claimed.\n`);
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await main();}catch(e){console.error(String(e?.message||e));process.exitCode=2;}
}
