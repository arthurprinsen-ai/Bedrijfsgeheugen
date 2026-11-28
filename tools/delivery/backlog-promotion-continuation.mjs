// One bounded autonomous continuation in the EXISTING Repository Janitor.
// This transports an eligible candidate to BG169; it cannot approve, merge,
// edit source, grant a writer lease, or assert terminal success.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {classifyOriginalBrainFlightPages,originalBrainFlightSince} from './brain-verification-flight-index.mjs';
const SHA=/^[a-f0-9]{40}$/;
const WORKFLOW='unified-brain-delivery.yml';
const ACTIVE=['queued','in_progress','waiting','pending','requested'];
const GATES=['test','hygiene / admission','CodeQL javascript-typescript'];
const OUTPUT='.artifacts/powerhouse-backlog-continuation.json';
const title=(p)=>'BRAIN delivery PR #'+p.number+' '+p.head.sha;
const field=(p,k)=>{const a=String(p.body||'').split(/\r?\n/).filter(x=>x.startsWith(k+': '));return a.length===1?a[0].slice(k.length+2).trim():null};
const hold=(status,extra={})=>({status,dispatch_requested:false,terminal_verified:false,...extra});
function pageArray(pages,max=1000){
 if(!Array.isArray(pages)||!pages.length||pages.some(p=>!Array.isArray(p)))throw Error('INCOMPLETE_ARRAY_INVENTORY');
 const rows=pages.flat();
 if(rows.length>=max||pages.slice(0,-1).some(p=>p.length!==100)||pages.at(-1).length>=100)throw Error('INCOMPLETE_ARRAY_INVENTORY');
 return rows;
}
function pageRuns(pages){
 if(!Array.isArray(pages)||!pages.length||pages.some(p=>!Array.isArray(p.workflow_runs)||!Number.isSafeInteger(p.total_count)||p.total_count!==pages[0].total_count))throw Error('INCOMPLETE_RUN_INVENTORY');
 const rows=pages.flatMap(p=>p.workflow_runs);
 if(rows.length!==pages[0].total_count||rows.length>=1000||new Set(rows.map(r=>r.id)).size!==rows.length||rows.some(r=>!Number.isSafeInteger(r.id)||r.id<1))throw Error('INCOMPLETE_RUN_INVENTORY');
 return rows;
}
function nativeApi(repo,suffix,paged=false){
 const args=['api',...(paged?['--paginate','--slurp']:[]),'repos/'+repo+'/'+suffix];
 return JSON.parse(execFileSync('gh',args,{encoding:'utf8',timeout:25000,maxBuffer:15000000,stdio:['ignore','pipe','pipe']}));
}
function nativeDispatch(repo,inputs){
 execFileSync('gh',['api','--method','POST','repos/'+repo+'/actions/workflows/'+WORKFLOW+'/dispatches','--input','-'],{input:JSON.stringify({ref:'main',inputs}),encoding:'utf8',timeout:20000,stdio:['pipe','pipe','pipe']});
}
export function promotionCandidate(p,{repo,main}){
 if(!p||!Number.isSafeInteger(p.number)||p.number<1||p.state!=='open'||p.draft!==false||
 p.head?.repo?.full_name!==repo||p.base?.repo?.full_name!==repo||p.base.ref!=='main'||
 !SHA.test(p.head?.sha)||p.base.sha!==main||!SHA.test(main)||field(p,'Base-SHA')!==main||
 !field(p,'Obligation-ID')||!field(p,'Delivery-Lane')||!field(p,'Candidate-Type')||
 !/^[1-9]\d*$/.test(field(p,'Scope-Budget')||'')||!field(p,'Change-Scope'))return false;
 if(/^\s*(?:Review-Required|Promotion-Veto|Do-Not-Merge):\s*(?!false\s*$)/im.test(p.body||'')||
 (p.labels||[]).some(l=>/do.?not.?merge|hold|blocked|review.required/i.test(l.name||'')))return false;
 const leaseLines=String(p.body||'').split(/\r?\n/).filter(x=>/^Writer-Lease-/i.test(x));
 if(leaseLines.length){
  return field(p,'Writer-Lease-State')==='TERMINAL_DELIVERY'&&field(p,'Writer-Lease-Owner')==='powerhouse-terminal-delivery'&&
   field(p,'Writer-Lease-Head')===p.head.sha&&field(p,'Writer-Lease-Main-Epoch')===main&&
   field(p,'Writer-Lease-Obligation')===field(p,'Obligation-ID')&&field(p,'Writer-Lease-Scope')===field(p,'Obligation-ID')&&field(p,'Writer-Lease-NonOwner-Action')==='DEFER';
 }
 // Initial candidates: only the repository owner's same-repository, ordinary
 // recovery/dependency/docs candidate, or the native Dependabot dependency lane.
 // The protected BG169 admission/lease/protection checks remain authoritative.
 const type=field(p,'Candidate-Type'),lane=field(p,'Delivery-Lane');
 return (p.user?.login===repo.split('/')[0]&&p.author_association==='OWNER'&&
  ['recovery','dependency','docs'].includes(type)&&['automation','backend','dependency','docs','website','portal'].includes(lane))||
  (p.user?.login==='dependabot[bot]'&&type==='dependency'&&lane==='dependency');
}
export function verifyPromotionProof({pr,files,compare,checks,branch,repo,main}){
 if(!promotionCandidate(pr,{repo,main})||pr.mergeable!==true||!Number.isSafeInteger(pr.changed_files)||pr.changed_files<1||pr.changed_files>40||
 !Array.isArray(files)||files.length!==pr.changed_files||Number(field(pr,'Scope-Budget'))!==files.length)return false;
 const names=files.map(f=>f.filename),declared=field(pr,'Change-Scope').split(',').map(x=>x.trim());
 if(names.some(x=>!x||x.includes('..'))||new Set(names).size!==names.length||declared.length!==names.length||new Set(declared).size!==declared.length||names.some(n=>!declared.includes(n)))return false;
 // No autonomous privilege or production database/security changes in this first bounded transport.
 if(files.some(f=>f.previous_filename||f.status==='removed'||f.status==='renamed')||names.some(n=>/^(?:supabase\/|platform\/security\/|auth\/|config\/|\.github\/|\.agents\/|tools\/delivery\/|scripts\/ci\/|scripts\/brain\/|brain\/skills\/)/.test(n)||/credential|secret|(?:^|\/)rls|tenant.security/i.test(n)))return false;
 if(compare?.behind_by!==0||compare?.merge_base_commit?.sha!==main)return false;
 const required=branch?.protection?.required_status_checks;
 if(branch?.name!=='main'||branch.protected!==true||branch.protection?.enabled!==true||branch.commit?.sha!==main||
 required?.enforcement_level!=='everyone'||!Array.isArray(required.checks)||!required.checks.length||
 GATES.some(name=>!required.checks.some(c=>c.context===name&&c.app_id===15368)))return false;
 if(!checks||!Array.isArray(checks.check_runs)||checks.total_count!==checks.check_runs.length||checks.total_count>=100)return false;
 return required.checks.every(g=>{
  if(!Number.isSafeInteger(g.app_id)||g.app_id<1||!g.context)return false;
  const matches=checks.check_runs.filter(c=>c.name===g.context);
  return matches.length===1&&matches[0].head_sha===pr.head.sha&&matches[0].app?.id===g.app_id&&matches[0].status==='completed'&&matches[0].conclusion==='success';
 });
}
export function planContinuation({pr,open,history,active,ghostIds=[],ghostReadbacks=[],repo,main,now=Date.now()}){
 if(!promotionCandidate(pr,{repo,main}))return hold('CANDIDATE_NOT_AUTHORIZED');
 if(open.filter(p=>field(p,'Obligation-ID')===field(pr,'Obligation-ID')).length!==1)return hold('DUPLICATE_OBLIGATION');
 const since=originalBrainFlightSince(pr.created_at);
 const index=classifyOriginalBrainFlightPages(history,title(pr),{since});
 if(!index.complete||!index.safe_to_dispatch)return hold('EXISTING_OR_UNPROVEN_FLIGHT',{flight_status:index.status});
 // An ancient provider-confirmed zero-job ghost may be excluded from global
 // capacity only, never from the candidate's time-bounded identity inventory.
 const openHeads=new Set(open.map(p=>p.head?.sha));
 const olderGhost=r=>{
  if(!ghostIds.includes(r.id))return false;
  const proof=ghostReadbacks.find(x=>x.run?.id===r.id),q=proof?.run;
  return q&&q.id===r.id&&q.status==='queued'&&r.status==='queued'&&q.conclusion==null&&proof.jobsTotal===0&&q.head_sha===r.head_sha&&q.created_at===r.created_at&&q.updated_at===r.updated_at&&SHA.test(q.head_sha)&&q.head_sha!==main&&!openHeads.has(q.head_sha)&&
   Number.isFinite(Date.parse(q.created_at))&&Date.parse(q.created_at)<Date.parse(since)&&now-Date.parse(q.created_at)>=86400000&&Math.abs(Date.parse(q.updated_at)-Date.parse(q.created_at))<=60000;
 };
 if(active.some(r=>!olderGhost(r)))return hold('ACTIVE_DELIVERY_SERIAL_FENCE');
 return {status:'ONE_PROTECTED_PROMOTION_ADMITTED',dispatch_requested:false,terminal_verified:false,number:pr.number,head:pr.head.sha,main,obligation:field(pr,'Obligation-ID')};
}
export async function continueBacklog({repo=process.env.GITHUB_REPOSITORY,ref=process.env.GITHUB_REF,sha=process.env.GITHUB_SHA,event=process.env.GITHUB_EVENT_NAME,mode=process.env.REQUESTED_MODE,read=nativeApi,send=nativeDispatch,ghostIds=[],now=Date.now()}={}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||ref!=='refs/heads/main'||!SHA.test(sha||'')||!(event==='schedule'||(event==='workflow_dispatch'&&mode==='apply-safe')))return hold('READ_ONLY_OR_UNTRUSTED_RUNTIME');
 const main=read(repo,'git/ref/heads/main').object?.sha;
 if(main!==sha)return hold('MAIN_DRIFT');
 const open=pageArray(read(repo,'pulls?state=open&base=main&per_page=100',true));
 if(new Set(open.map(p=>p.number)).size!==open.length)return hold('OPEN_INVENTORY_AMBIGUOUS');
 const candidates=open.filter(p=>promotionCandidate(p,{repo,main})).sort((a,b)=>a.number-b.number).slice(0,5);
 const observations=[];
 const branch=read(repo,'branches/main');
 for(const p of candidates){
  const detail=read(repo,'pulls/'+p.number);
  if(detail.head?.sha!==p.head.sha||detail.body!==p.body)continue;
  const files=pageArray(read(repo,'pulls/'+p.number+'/files?per_page=100',true));
  const compare=read(repo,'compare/'+main+'...'+p.head.sha);
  const checks=read(repo,'commits/'+p.head.sha+'/check-runs?filter=latest&per_page=100');
  if(!verifyPromotionProof({pr:detail,files,compare,checks,branch,repo,main})){observations.push({number:p.number,status:'GATES_OR_SCOPE_UNPROVEN'});continue;}
  const since=originalBrainFlightSince(detail.created_at);
  const snapshot=()=>{
   const history=read(repo,'actions/workflows/'+WORKFLOW+'/runs?branch=main&event=workflow_dispatch&created='+encodeURIComponent('>='+since)+'&per_page=100',true);
   const active=ACTIVE.flatMap(status=>pageRuns(read(repo,'actions/workflows/'+WORKFLOW+'/runs?status='+status+'&per_page=100',true)));
   const seen=new Set();
   if(active.some(r=>seen.has(r.id)||!ACTIVE.includes(r.status)||(seen.add(r.id),false)))throw Error('ACTIVE_INVENTORY_CHANGED');
   const ghostReadbacks=active.filter(r=>ghostIds.includes(r.id)).map(r=>({run:read(repo,'actions/runs/'+r.id),jobsTotal:read(repo,'actions/runs/'+r.id+'/jobs?per_page=1').total_count}));
   const freshOpen=pageArray(read(repo,'pulls?state=open&base=main&per_page=100',true));
   if(new Set(freshOpen.map(q=>q.number)).size!==freshOpen.length||JSON.stringify(freshOpen.map(q=>[q.number,q.head?.sha,q.body]).sort((a,b)=>a[0]-b[0]))!==JSON.stringify(open.map(q=>[q.number,q.head?.sha,q.body]).sort((a,b)=>a[0]-b[0])))return hold('OPEN_INVENTORY_CHANGED');
   return planContinuation({pr:detail,open:freshOpen,history,active,ghostIds,ghostReadbacks,repo,main,now});
  };
  const first=snapshot();observations.push({number:p.number,status:first.status});
  if(first.status!=='ONE_PROTECTED_PROMOTION_ADMITTED')continue;
  const final=snapshot();
  if(final.status!=='ONE_PROTECTED_PROMOTION_ADMITTED')return {...final,open_count:open.length,observations};
  const fresh=read(repo,'pulls/'+p.number),freshChecks=read(repo,'commits/'+p.head.sha+'/check-runs?filter=latest&per_page=100');
  if(read(repo,'git/ref/heads/main').object?.sha!==main||fresh.head?.sha!==p.head.sha||fresh.body!==detail.body||
   !verifyPromotionProof({pr:fresh,files,compare,checks:freshChecks,branch:read(repo,'branches/main'),repo,main}))return hold('FINAL_FENCE_CHANGED',{open_count:open.length,observations});
  send(repo,{pr_number:String(p.number),base_sha:main,head_sha:p.head.sha,candidate_branch:p.head.ref,verification_only:false});
  return {...final,status:'PROTECTED_DISPATCH_ACCEPTED_NOT_TERMINAL',dispatch_requested:true,open_count:open.length,observations};
 }
 return hold('NO_ELIGIBLE_CANDIDATE',{open_count:open.length,observations});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let evidence;
 try{
  let ghostIds=[];
  try{const g=JSON.parse(await readFile('.artifacts/github-actions-ghost-reconcile.json','utf8'));if(g.queueSnapshotInconsistent===false&&g.queuedProviderTotalsStable===true&&g.providerIncidentStillOpen===true&&Date.now()-Date.parse(g.observed_at)<300000&&Date.now()>=Date.parse(g.observed_at))ghostIds=(g.independentlyQueuedKnownIds||[]).filter(Number.isSafeInteger);}catch{}
  evidence=await continueBacklog({ghostIds});
 }catch(error){evidence=hold('NATIVE_CONTINUATION_UNAVAILABLE',{reason:String(error?.message||error).slice(0,120)});process.exitCode=2;}
 await mkdir('.artifacts',{recursive:true});await writeFile(OUTPUT,JSON.stringify({...evidence,observed_at:new Date().toISOString(),no_new_scheduler:true,mandatory_gates_unchanged:true},null,2)+'\n');console.log(JSON.stringify(evidence));
}
