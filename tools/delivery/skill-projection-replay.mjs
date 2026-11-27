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
   mode==='verify'?verifyProjectionReplayEvidence({evidence:JSON.parse(readFileSync(args[0],'utf8')),mergeSha:args[1],parentSha:args[2],learningFiles:readFileSync(args[3],'utf8').split(/\r?\n/).filter(Boolean)}):null;
  if(!result)throw Error('REPLAY_MODE_INVALID');
  console.log(JSON.stringify(result));if(result.complete===false||result.ok===false)process.exitCode=78;
 }catch(e){console.error('SKILL_REPLAY_EVIDENCE_UNPROVEN:'+e.message);process.exitCode=78;}
}
