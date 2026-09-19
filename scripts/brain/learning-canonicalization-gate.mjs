import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LEARNING_CANONICALIZATION_FINGERPRINT='powerhouse-learning-canonicalization-gate-v1';

const upper=value=>String(value??'').trim().toUpperCase();
const bool=(value,fallback=false)=>typeof value==='boolean'?value:fallback;
const int=(value,fallback=1)=>{
  const parsed=Number.parseInt(String(value??''),10);
  return Number.isInteger(parsed)?parsed:fallback;
};
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');

export function compileLearningEvaluationPlan(record={}){
  const meta=record.compiler && typeof record.compiler==='object' ? record.compiler : record;
  const failureClass=upper(meta.failure_class||meta.failureClass);
  const scope=upper(meta.scope||'GENERAL')||'GENERAL';
  const machineEnforceable=bool(meta.machine_enforceable ?? meta.machineEnforceable,true);
  const repeatCount=int(meta.repeat_count ?? meta.repeatCount,1);
  const securitySensitive=bool(meta.security_sensitive ?? meta.securitySensitive,false);
  if(!failureClass) throw new Error('LEARNING_FAILURE_CLASS_REQUIRED');
  if(repeatCount<1) throw new Error('LEARNING_REPEAT_COUNT_INVALID');

  let enforcementKind='TEST';
  let evaluationMode='HISTORICAL_REPLAY';
  let shadowRequired=false;
  let canaryRequired=false;

  if(!machineEnforceable){
    enforcementKind='SKILL';
  } else if(securitySensitive || ['SECURITY','AUTH','RLS','SECRET_EXPOSURE'].includes(failureClass)){
    enforcementKind='CI_SECURITY_GATE';
    evaluationMode='SHADOW_THEN_CANARY';
    shadowRequired=true;
    canaryRequired=true;
  } else if(['TIMEOUT','WORKER_LOST','RECOVERY','CONNECTOR_FAILURE','QUEUE_STALL'].includes(failureClass)){
    enforcementKind='WORKFLOW';
    evaluationMode='SHADOW';
    shadowRequired=true;
  } else if(scope==='DATABASE' || ['DATABASE_INTEGRITY','DATA_INTEGRITY','SCHEMA_DRIFT'].includes(failureClass)){
    enforcementKind='DATABASE_CONSTRAINT';
  } else if(scope==='RUNTIME' || ['PRODUCTION_READBACK','RUNTIME_INVARIANT','FALSE_GREEN','FALSE_SUCCESS'].includes(failureClass)){
    enforcementKind='RUNTIME_ASSERTION';
    evaluationMode='CANARY';
    canaryRequired=true;
  } else if(['MAIN_DRIFT','CI','GITHUB_DELIVERY','DELIVERY','CLASSIFIER_GAP','METADATA_DRIFT'].includes(failureClass) || ['GITHUB','CI'].includes(scope)){
    enforcementKind='CI_GATE';
  }

  return {
    contract:'powerhouse-learning-canonicalization-plan-v1',
    failure_class:failureClass,
    scope,
    machine_enforceable:machineEnforceable,
    repeat_count:repeatCount,
    security_sensitive:securitySensitive,
    enforcement_kind:enforcementKind,
    evaluation_mode:evaluationMode,
    historical_replay_required:true,
    shadow_required:shadowRequired,
    canary_required:canaryRequired,
    canonical_eligible:false,
    canonicalization_requirement:'evaluation_evidence_required'
  };
}

function stableTests(value){
  if(!Array.isArray(value)) return [];
  return [...new Set(value.map(v=>String(v??'').trim()).filter(Boolean))].sort();
}

export function validateEvaluationContract(record,plan,{rootDir=process.cwd()}={}){
  const evaluation=record.evaluation && typeof record.evaluation==='object' ? record.evaluation : {};
  const requiredModes=['historical_replay'];
  if(plan.shadow_required) requiredModes.push('shadow');
  if(plan.canary_required) requiredModes.push('canary');
  const testsByMode={};
  for(const mode of requiredModes){
    const tests=stableTests(evaluation[mode]);
    if(!tests.length) throw new Error(`LEARNING_EVALUATION_TESTS_REQUIRED:${mode}`);
    for(const relative of tests){
      if(!/^tests\/brain-[a-z0-9._/-]+\.test\.mjs$/i.test(relative) || relative.includes('..')){
        throw new Error(`LEARNING_EVALUATION_TEST_PATH_INVALID:${mode}:${relative}`);
      }
      const absolute=path.resolve(rootDir,relative);
      const testsRoot=path.resolve(rootDir,'tests')+path.sep;
      if(!absolute.startsWith(testsRoot) || !fs.existsSync(absolute)){
        throw new Error(`LEARNING_EVALUATION_TEST_MISSING:${mode}:${relative}`);
      }
    }
    testsByMode[mode]=tests;
  }
  return {required_modes:requiredModes,tests_by_mode:testsByMode};
}

function runMode({mode,tests,rootDir}){
  const started=Date.now();
  const result=spawnSync(process.execPath,['--test',...tests],{
    cwd:rootDir,
    encoding:'utf8',
    env:{...process.env,POWERHOUSE_LEARNING_EVAL_MODE:mode.toUpperCase()}
  });
  const output=`${result.stdout||''}\n${result.stderr||''}`;
  if(result.status!==0){
    process.stderr.write(output);
    throw new Error(`LEARNING_EVALUATION_FAILED:${mode}:exit_${result.status}`);
  }
  return {
    mode:mode.toUpperCase(),
    passed:true,
    test_count:tests.length,
    tests,
    output_sha256:sha256(output),
    duration_ms:Date.now()-started
  };
}

function gitChangedLearningFiles({rootDir,baseSha,headSha}){
  if(!baseSha || !/^[0-9a-f]{40}$/i.test(baseSha)) throw new Error('LEARNING_BASE_SHA_REQUIRED');
  const head=headSha && /^[0-9a-f]{40}$/i.test(headSha) ? headSha : 'HEAD';
  const raw=execFileSync('git',['diff','--name-only','--diff-filter=AM',baseSha,head],{cwd:rootDir,encoding:'utf8'});
  return raw.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^brain\/learning\/.*\.json$/i.test(x)).sort();
}

export function evaluateLearningFile({relativePath,rootDir=process.cwd()}){
  const absolute=path.resolve(rootDir,relativePath);
  const record=JSON.parse(fs.readFileSync(absolute,'utf8'));
  const plan=compileLearningEvaluationPlan(record);
  const contract=validateEvaluationContract(record,plan,{rootDir});
  const evaluations=[];
  for(const mode of contract.required_modes){
    evaluations.push(runMode({mode,tests:contract.tests_by_mode[mode],rootDir}));
  }
  return {
    source:relativePath,
    fingerprint:String(record.fingerprint||''),
    plan,
    evaluations,
    canonical_eligible:evaluations.every(e=>e.passed),
    evidence_digest:sha256(JSON.stringify({relativePath,plan,evaluations:evaluations.map(({duration_ms,...rest})=>rest)}))
  };
}

export function runLearningCanonicalizationGate({
  rootDir=process.cwd(),
  baseSha=process.env.POWERHOUSE_BASE_SHA,
  headSha=process.env.POWERHOUSE_HEAD_SHA
}={}){
  const changed=gitChangedLearningFiles({rootDir,baseSha,headSha});
  const evaluated=changed.map(relativePath=>evaluateLearningFile({relativePath,rootDir}));
  const evidence={
    contract:LEARNING_CANONICALIZATION_FINGERPRINT,
    base_sha:baseSha,
    head_sha:headSha||'HEAD',
    changed_learning_count:changed.length,
    changed_learning_files:changed,
    evaluated,
    canonical_eligible:evaluated.every(item=>item.canonical_eligible)
  };
  if(!evidence.canonical_eligible) throw new Error('LEARNING_CANONICALIZATION_BLOCKED');
  return evidence;
}

const isCli=process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli){
  try{
    const evidence=runLearningCanonicalizationGate();
    fs.mkdirSync('.artifacts',{recursive:true});
    fs.writeFileSync('.artifacts/learning-canonicalization-evidence.json',JSON.stringify(evidence,null,2)+'\n');
    process.stdout.write(JSON.stringify({status:'LEARNING_CANONICALIZATION_GREEN',...evidence},null,2)+'\n');
  }catch(error){
    fs.mkdirSync('.artifacts',{recursive:true});
    fs.writeFileSync('.artifacts/learning-canonicalization-evidence.json',JSON.stringify({
      contract:LEARNING_CANONICALIZATION_FINGERPRINT,
      status:'RED',
      base_sha:process.env.POWERHOUSE_BASE_SHA||null,
      head_sha:process.env.POWERHOUSE_HEAD_SHA||null,
      canonical_eligible:false,
      error:String(error?.message||error)
    },null,2)+'\n');
    process.stderr.write(`LEARNING_CANONICALIZATION_FAILED: ${error.message}\n`);
    process.exitCode=1;
  }
}
