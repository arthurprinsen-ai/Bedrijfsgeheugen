import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {classifyOriginalBrainFlightPages} from './brain-verification-flight-index.mjs';
const titlePattern=/^Skill projection replay PR #[1-9]\d* [0-9a-f]{40}$/;
const sha=/^[0-9a-f]{40}$/, digest=/^[0-9a-f]{64}$/;
export function classifyProjectionReplay(pages,title,since){
 if(!titlePattern.test(title))return {status:'INVALID_REPLAY_TITLE',complete:false,safe_to_dispatch:false};
 const translate=v=>titlePattern.test(v)?v.replace('Skill projection replay','BRAIN delivery'):'';
 const mapped=Array.isArray(pages)?pages.map(p=>p&&Array.isArray(p.workflow_runs)?{...p,workflow_runs:p.workflow_runs.map(r=>r?{...r,display_title:translate(r.display_title)}:r)}:p):pages;
 const result=classifyOriginalBrainFlightPages(mapped,translate(title),{since});
 return result.matching_flights>1?{...result,status:'REPLAY_DUPLICATE_FLIGHTS',complete:false,safe_to_dispatch:false}:result;
}

// A failed, pre-evaluation installation may be replaced once, but only by
// a different protected workflow revision. Historical failure remains evidence.
export function classifyFailedInstallRecovery(pages,title,since,proof){
 const hold=status=>({status,complete:false,safe_to_dispatch:false});
 const inventory=classifyProjectionReplay(pages,title,since);
 if(!inventory.complete&&inventory.status!=='REPLAY_DUPLICATE_FLIGHTS')return hold('RECOVERY_HISTORY_UNPROVEN');
 if(!proof||proof.protectedDescendant!==true||proof.learningUnchanged!==true||
    !sha.test(proof.oldBlob)||!sha.test(proof.newBlob)||proof.oldBlob===proof.newBlob||
    !sha.test(proof.newSourceSha)||proof.errorCode!=='ETARGET')return hold('RECOVERY_SOURCE_UNPROVEN');
 const rows=pages.flatMap(p=>p.workflow_runs);
 if(rows.some(r=>!titlePattern.test(r.display_title)))return hold('RECOVERY_AMBIGUOUS_FLIGHT');
 const exact=rows.filter(r=>r.display_title===title);
 if(exact.length<1||exact.length>2)return hold('RECOVERY_FLIGHT_BOUND');
 const pr=title.split(' ')[4];
 if(rows.some(r=>r.display_title!==title&&r.display_title.split(' ')[4]===pr&&r.status!=='completed'))return hold('RECOVERY_OTHER_ACTIVE_HEAD');
 const prior=exact.find(r=>r.id===proof.priorRun?.id), native=proof.priorRun;
 if(!prior||prior.status!=='completed'||prior.conclusion!=='failure'||
    prior.path!=='.github/workflows/powerhouse-skill-projection.yml'||
    !sha.test(prior.head_sha)||prior.head_sha===proof.newSourceSha||
    !Number.isSafeInteger(prior.run_attempt)||prior.run_attempt<1||
    ['id','status','conclusion','path','head_sha','run_attempt','display_title','event','head_branch'].some(k=>prior[k]!==native[k]))return hold('RECOVERY_PRIOR_IDENTITY_UNPROVEN');
 const jobs=proof.priorJobs;
 if(jobs?.total_count!==1||!Array.isArray(jobs.jobs)||jobs.jobs.length!==1)return hold('RECOVERY_JOB_UNPROVEN');
 const job=jobs.jobs[0];
 if(job.name!=='skill-projection-contract'||job.conclusion!=='failure'||job.run_id!==prior.id||job.run_attempt!==prior.run_attempt||
    !Number.isSafeInteger(job.id)||job.id!==proof.logJobId)return hold('RECOVERY_JOB_UNPROVEN');
 const steps=job.steps||[];
 const one=(name,status)=>steps.filter(s=>s.name===name).length===1&&steps.find(s=>s.name===name).conclusion===status;
 if(!one('Install projection-test dependencies','failure')||!one('Evaluate changed learning before canonicalization','skipped')||
    !one('Reconcile all canonical learning into skill projection','skipped')||!one('Verify learning to skill projection contract','skipped'))return hold('RECOVERY_NOT_PRE_EVALUATION_FAILURE');
 const successor=exact.find(r=>r.id!==prior.id);
 if(successor&&(successor.head_sha!==proof.newSourceSha||successor.path!==prior.path||
    Date.parse(successor.created_at)<=Date.parse(prior.created_at)))return hold('RECOVERY_SUCCESSOR_UNPROVEN');
 const filtered=pages.map(p=>({...p,total_count:p.total_count-1,workflow_runs:p.workflow_runs.filter(r=>r.id!==prior.id)}));
 const next=classifyProjectionReplay(filtered,title,since);
 if(!next.complete)return hold('RECOVERY_REMAINING_HISTORY_UNPROVEN');
 if(successor)return {...next,safe_to_dispatch:false,prior_run_id:prior.id};
 return next.safe_to_dispatch?{status:'ONE_PROTECTED_SUCCESSOR_ALLOWED',complete:true,safe_to_dispatch:true,prior_run_id:prior.id}:hold('RECOVERY_NOT_ADMITTED');
}

export function verifyProjectionReplayEvidence({evidence,mergeSha,parentSha,learningFiles}={}){
 const fail=reason=>({ok:false,reason});
 if(!sha.test(mergeSha)||!sha.test(parentSha)||!Array.isArray(learningFiles)||!learningFiles.length||new Set(learningFiles).size!==learningFiles.length||learningFiles.some(p=>typeof p!=='string'||!/^brain\/learning\/.+[.]json$/.test(p)||p.includes('..')))return fail('REPLAY_SCOPE_INVALID');
 if(evidence?.contract!=='powerhouse-learning-canonicalization-gate-v1'||evidence.base_sha!==parentSha||evidence.head_sha!==mergeSha||evidence.canonical_eligible!==true||evidence.changed_learning_count!==learningFiles.length||!Array.isArray(evidence.changed_learning_files)||!Array.isArray(evidence.evaluated))return fail('REPLAY_EVIDENCE_IDENTITY_INVALID');
 const expected=[...learningFiles].sort();
 if(JSON.stringify([...evidence.changed_learning_files].sort())!==JSON.stringify(expected)||JSON.stringify(evidence.evaluated.map(r=>r?.source).sort())!==JSON.stringify(expected))return fail('REPLAY_EVIDENCE_SCOPE_MISMATCH');
 for(const record of evidence.evaluated){
  const plan=record.plan;
  if(record.canonical_eligible!==true||!digest.test(record.evidence_digest)||plan?.historical_replay_required!==true||typeof plan.shadow_required!=='boolean'||typeof plan.canary_required!=='boolean'||!Array.isArray(record.evaluations))return fail('REPLAY_EVALUATION_INVALID');
  const modes=['HISTORICAL_REPLAY',...(plan.shadow_required?['SHADOW']:[]),...(plan.canary_required?['CANARY']:[])];
  if(JSON.stringify(record.evaluations.map(e=>e?.mode).sort())!==JSON.stringify(modes.sort()))return fail('REPLAY_MODES_MISMATCH');
  if(record.evaluations.some(e=>e.passed!==true||!digest.test(e.output_sha256)||!Array.isArray(e.tests)||!e.tests.length||e.test_count!==e.tests.length||e.tests.some(p=>typeof p!=='string'||!/^tests\/brain-[a-z0-9._/-]+[.]test[.]mjs$/i.test(p)||p.includes('..'))))return fail('REPLAY_TEST_EVIDENCE_INVALID');
 }
 return {ok:true,reason:'EXACT_LEARNING_REPLAY_PROVEN',records:expected.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [mode,...args]=process.argv.slice(2);
  const result=mode==='index'?classifyProjectionReplay(JSON.parse(readFileSync(0,'utf8')),args[0],args[1]):
   mode==='recovery-index'?classifyFailedInstallRecovery(JSON.parse(readFileSync(0,'utf8')),args[0],args[1],JSON.parse(readFileSync(args[2],'utf8'))):
   mode==='verify'?verifyProjectionReplayEvidence({evidence:JSON.parse(readFileSync(args[0],'utf8')),mergeSha:args[1],parentSha:args[2],learningFiles:readFileSync(args[3],'utf8').split(/\r?\n/).filter(Boolean)}):null;
  if(!result)throw Error('REPLAY_MODE_INVALID');
  console.log(JSON.stringify(result));if(result.complete===false||result.ok===false)process.exitCode=78;
 }catch(e){console.error('SKILL_REPLAY_EVIDENCE_UNPROVEN:'+e.message);process.exitCode=78;}
}
