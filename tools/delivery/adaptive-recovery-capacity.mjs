import {assessQueuePressure,QUEUE_PRESSURE_DEFAULTS} from './predictive-controller.mjs';
// Conservative advisory capacity; never grants writer or merge authority.
export function recoveryBudget({activeRuns,limit=12,max=5,reserve=2,fanout=3}={}){
 if(![activeRuns,limit,max,reserve,fanout].every(Number.isSafeInteger)||activeRuns<0||limit<1||max<0||reserve<0||fanout<1) return 0;
 return Math.max(0,Math.min(5,max,Math.floor((limit-reserve-activeRuns)/fanout)));
}

// Pure read-only planning bound; original runtime must supply fresh complete canonical evidence.
export function remainingProvenRecoveryCapacity({initial,observed,used=0,initialBudget=5}={}){
 const hold=reason=>({remaining:0,reason,mutationAuthority:false});
 if(!Number.isSafeInteger(used)||used<0||!Number.isSafeInteger(initialBudget)||initialBudget<0||initialBudget>5||used>initialBudget)return hold("INVALID_RESERVATION");
 const read=s=>{
  if(!s||!s.queueEvidence||!["queued","inProgress","pending","waiting","requested"].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0))return null;
  const p=assessQueuePressure({...s,queueEvidence:{...s.queueEvidence,now:observed.queueEvidence?.now},projectedNewRuns:0,limits:QUEUE_PRESSURE_DEFAULTS});
  return p.queueSnapshotInconsistent||!p.allowOptionalDispatch?null:p;
 };
 if(initial?.queueEvidence?.currentMainSha!==observed?.queueEvidence?.currentMainSha)return hold('AUTHORITY_EPOCH_CHANGED');
 const i=read(initial),o=read(observed);if(!i||!o)return hold("PRESSURE_OR_PROOF_UNVERIFIED");
 const fanout=3,active=Math.max(o.active,i.active+fanout*used),queued=Math.max(o.counts.queued,i.counts.queued+fanout*used);
 const limits=QUEUE_PRESSURE_DEFAULTS;
 if(active>=limits.softActive||queued>=limits.softQueued)return hold("RESERVED_SOFT_PRESSURE");
 const remaining=Math.max(0,Math.min(initialBudget-used,recoveryBudget({activeRuns:active}),Math.ceil((limits.softActive-active)/fanout),Math.ceil((limits.softQueued-queued)/fanout),Math.floor((limits.hardActive-1-active)/fanout),Math.floor((limits.hardQueued-1-queued)/fanout)));
 return {remaining,reason:"PROVEN_CAPACITY_BOUND",active,queued,mutationAuthority:false};
}

import {evidenceIds,GHOST_INCIDENT} from '../../.github/scripts/github-actions-ghost-reconcile.mjs';
const statuses={queued:'queued',inProgress:'in_progress',pending:'pending',waiting:'waiting',requested:'requested'};
const validSha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const validId=id=>Number.isSafeInteger(id)&&id>0;
const same=(a,b)=>a.id===b.id&&a.head_sha===b.head_sha&&a.head_branch===b.head_branch&&a.created_at===b.created_at&&a.updated_at===b.updated_at&&a.status===b.status&&a.conclusion===b.conclusion;

// Read-only adapter: callers supply a native GET function. All proof is fresh,
// bounded and independently correlated. No mutation method or authority.
export async function collectRecoveryQueueEvidence({read,repo,now=()=>Date.now()}={}){
 if(typeof read!=='function'||typeof repo!=='string'||!/^[\w.-]+\/[\w.-]+$/.test(repo))throw new Error('INVALID_RECOVERY_QUEUE_READER');
 let calls=0;
 const started=now();
 const get=async path=>{
  if(++calls>100||now()-started>45_000)throw new Error('RECOVERY_QUEUE_READ_BUDGET');
  return await read(path);
 };
 const list=async(path,extract,withTotal=false)=>{
  const rows=[];let total=null;
  for(let page=1;page<=10;page++){
   const data=await get(path+(path.includes('?')?'&':'?')+'per_page=100&page='+page);
   const part=extract(data);
   if(!Array.isArray(part)||part.length>100)throw new Error('RECOVERY_QUEUE_PAGE_INVALID');
   if(withTotal){
    const n=data?.total_count;
    if(!Number.isSafeInteger(n)||n<0||n>=1000||(total!==null&&n!==total))throw new Error('RECOVERY_QUEUE_TOTAL_UNPROVEN');
    total=n;
   }
   rows.push(...part);
   if(part.length<100){
    if(rows.some(x=>!validId(x?.id))||new Set(rows.map(x=>x.id)).size!==rows.length||(withTotal&&rows.length!==total))throw new Error('RECOVERY_QUEUE_INCOMPLETE');
    return rows;
   }
  }
  throw new Error('RECOVERY_QUEUE_PAGE_LIMIT');
 };
 const readMain=async()=>{const sha=(await get('/git/ref/heads/main'))?.object?.sha;if(!validSha(sha))throw new Error('RECOVERY_MAIN_UNPROVEN');return sha;};
 const readHeads=async()=>{const rows=await list('/pulls?state=open',x=>x);if(rows.some(x=>!validSha(x?.head?.sha)))throw new Error('RECOVERY_OPEN_HEAD_UNPROVEN');return rows.map(x=>x.head.sha).sort();};
 const readStatus=async status=>{const rows=await list('/actions/runs?status='+status,x=>x?.workflow_runs,true);if(rows.some(x=>x.status!==status||!validSha(x.head_sha)||!x.head_branch))throw new Error('RECOVERY_QUEUE_STATUS_UNPROVEN');return rows;};
 const currentMainSha=await readMain(),openPrHeadShas=await readHeads();
 const issue=await get('/issues/'+GHOST_INCIDENT);
 if(issue?.number!==GHOST_INCIDENT||typeof issue.body!=='string'||!['open','closed'].includes(issue.state))throw new Error('RECOVERY_INCIDENT_UNPROVEN');
 const comments=await list('/issues/'+GHOST_INCIDENT+'/comments',x=>x);
 const known=evidenceIds(issue.body,comments,{trustedActors:[repo.split('/')[0],'github-actions[bot]']});
 const inventory={};for(const [key,status] of Object.entries(statuses))inventory[key]=await readStatus(status);
 const all=Object.values(inventory).flat();
 if(new Set(all.map(x=>x.id)).size!==all.length)throw new Error('RECOVERY_QUEUE_CROSS_STATUS_DUPLICATE');
 const queuedRuns=inventory.queued,byId=new Map(queuedRuns.map(x=>[x.id,x]));
 const runProofs=[],knownUnresolvedQueuedIds=[];
 for(const id of known.blocked){
  if(known.completed.has(id))continue;
  const run=await get('/actions/runs/'+id);
  if(run?.id!==id||!validSha(run.head_sha)||!Object.values(statuses).includes(run.status)&&run.status!=='completed')throw new Error('RECOVERY_EXACT_RUN_UNPROVEN');
  if(run.status!=='queued'){
   if(byId.has(id))throw new Error('RECOVERY_QUEUE_CONTRADICTORY');
   continue;
  }
  knownUnresolvedQueuedIds.push(id);
  const row=byId.get(id);
  if(!row||!same(row,run))throw new Error('RECOVERY_QUEUE_CONTRADICTORY');
  if(run.conclusion!==null||run.created_at!==run.updated_at||run.head_sha===currentMainSha||openPrHeadShas.includes(run.head_sha))continue;
  const age=now()-Date.parse(run.created_at);
  if(!Number.isFinite(age)||age<86_400_000)continue;
  const jobs=await get('/actions/runs/'+id+'/jobs?filter=all&per_page=1');
  if(!Number.isSafeInteger(jobs?.total_count)||jobs.total_count<0||!Array.isArray(jobs.jobs))throw new Error('RECOVERY_JOBS_UNPROVEN');
  if(jobs.total_count!==0||jobs.jobs.length!==0)continue;
  runProofs.push({incident:GHOST_INCIDENT,runId:id,providerBoundary:'GITHUB_CANONICAL_PROVIDER_BLOCKED',jobsTotalCount:0,runStatus:run.status,runHeadSha:run.head_sha,runCreatedAt:run.created_at,runUpdatedAt:run.updated_at,readbackAt:new Date(now()).toISOString()});
 }
 // Re-read queue and protected heads so races cannot manufacture ghost credit.
 for(const [key,status] of Object.entries(statuses)){
  const again=await readStatus(status),prior=inventory[key],second=new Map(again.map(x=>[x.id,x]));
  if(again.length!==prior.length||prior.some(x=>!second.has(x.id)||!same(x,second.get(x.id))))throw new Error('RECOVERY_QUEUE_CHANGED');
 }
 if(await readMain()!==currentMainSha||JSON.stringify(await readHeads())!==JSON.stringify(openPrHeadShas))throw new Error('RECOVERY_AUTHORITY_EPOCH_CHANGED');
 if(now()-started>45_000)throw new Error('RECOVERY_QUEUE_READ_BUDGET');
 return {...Object.fromEntries(Object.keys(statuses).map(k=>[k,inventory[k].length])),
  queueEvidence:{queuedRuns,runProofs,currentMainSha,openPrHeadShas,snapshotComplete:true,rawTotalCount:queuedRuns.length,knownUnresolvedQueuedIds,providerIncidentOpen:issue.state==='open',now:now()}};
}



import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
// One supervisor-local reservation journal, not a new writer. Charge every
// attempted dispatch/CAS before calling the provider; ambiguous results retain
// their reservation. A new supervisor cycle gets a fresh bounded census.
export function reserveRecoveryAction(state,observed){
 if(!state||!Number.isSafeInteger(state.used)||!Number.isSafeInteger(state.limit))
  return {allowed:false,reason:'RESERVATION_STATE_UNPROVEN'};
 const plan=remainingProvenRecoveryCapacity({initial:state.initial,observed,used:state.used,initialBudget:state.limit});
 const limit=Math.min(state.limit,state.used+plan.remaining);
 return {allowed:plan.remaining>0,reason:plan.reason,plan,
  state:{...state,limit,used:state.used+(plan.remaining>0?1:0)}};
}
async function nativeSnapshot(){
 const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
 if(!token)throw new Error('RECOVERY_READ_TOKEN_MISSING');
 const deadline=AbortSignal.timeout(40_000);
 return collectRecoveryQueueEvidence({repo,read:async path=>{
  const response=await fetch('https://api.github.com/repos/'+repo+path,{
   method:'GET',redirect:'error',cache:'no-store',
   headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
   signal:AbortSignal.any([deadline,AbortSignal.timeout(5000)])
  });
  if(!response.ok)throw new Error('RECOVERY_PROVIDER_READ_'+response.status);
  return response.json();
 }});
}
async function saveState(path,state){
 await writeFile(path+'.tmp',JSON.stringify(state),{mode:0o600});
 await rename(path+'.tmp',path);
}
async function runCli(){
 const [mode,path]=process.argv.slice(2);
 if(!path||!['init','reserve'].includes(mode))throw Error('RECOVERY_CLI_ARGUMENTS');
 const observed=await nativeSnapshot();
 if(mode==='init'){
  const plan=remainingProvenRecoveryCapacity({initial:observed,observed});
  await saveState(path,{initial:observed,limit:plan.remaining,used:0});
  console.log(JSON.stringify({remaining:plan.remaining,reason:plan.reason,raw:observed.queued+observed.inProgress+observed.pending+observed.waiting+observed.requested,effective:plan.active??null,verified:observed.queueEvidence.runProofs.length}));
  return;
 }
 const state=JSON.parse(await readFile(path,'utf8'));
 const next=reserveRecoveryAction(state,observed);
 if(next.state)await saveState(path,next.state);
 console.log(JSON.stringify({allowed:next.allowed,reason:next.reason,remaining:next.plan?.remaining??0,used:next.state?.used??0}));
 if(!next.allowed)process.exitCode=78;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 runCli().catch(error=>{console.error('RECOVERY_CAPACITY_UNPROVEN:'+String(error?.message||'unknown').replace(/[^A-Za-z0-9_:-]/g,'_').slice(0,120));process.exitCode=78;});
