import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT='powerhouse|material-run|closure-artifacts|required|v1';
export const SEMANTIC_LEARNING_CLOSURE_FINGERPRINT='powerhouse|error-live|semantic-learning-closure|required|v2';

const RULES=[
  {id:'brain_learning',description:'canonical Brain learning',matches:path=>/^brain\/learning\/.+\.json$/.test(path)},
  {id:'activity_ledger',description:'append-only activity/development ledger',matches:path=>/^docs\/development-ledger-events\/.+\.md$/.test(path)||/^docs\/development-ledger\/.+\.md$/.test(path)},
  {id:'human_documentation',description:'human-readable change/learning documentation',matches:path=>/^docs\/(changes|learning)\/.+\.md$/.test(path)},
];

const CLOSURE_ONLY=[
  /^brain\/learning\/.+\.json$/,
  /^docs\/development-ledger-events\/.+\.md$/,
  /^docs\/development-ledger\/.+\.md$/,
  /^docs\/(changes|learning)\/.+\.md$/,
  /^brain\/skills\/powerhouse-learning-skill-index-v1\.json$/,
];

function normalize(paths){
  return [...new Set((paths||[]).map(v=>String(v||'').trim()).filter(Boolean))].sort();
}

function deepEntries(value,prefix='',out=[]){
  if(Array.isArray(value)){
    value.forEach((item,index)=>deepEntries(item, prefix ? `${prefix}.${index}` : String(index), out));
    return out;
  }
  if(value && typeof value==='object'){
    for(const [key,item] of Object.entries(value)){
      const next=prefix ? `${prefix}.${key}` : key;
      out.push([next,item]);
      deepEntries(item,next,out);
    }
  }
  return out;
}

function hasSemanticKey(record,patterns){
  return deepEntries(record).some(([key,value])=>
    patterns.some(pattern=>pattern.test(key)) &&
    value!==null && value!==undefined &&
    (typeof value!=='string' || value.trim()!=='') &&
    (!Array.isArray(value) || value.length>0)
  );
}

export function evaluateLearningSemantics({learningFiles=[],rootDir=process.cwd()}={}){
  const files=normalize(learningFiles);
  const evaluated=[];
  for(const relative of files){
    const absolute=path.resolve(rootDir,relative);
    if(!absolute.startsWith(path.resolve(rootDir)+path.sep)) throw new Error(`LEARNING_PATH_OUTSIDE_ROOT:${relative}`);
    if(!fs.existsSync(absolute)) throw new Error(`LEARNING_FILE_MISSING:${relative}`);
    let record;
    try{ record=JSON.parse(fs.readFileSync(absolute,'utf8')); }
    catch{ throw new Error(`LEARNING_JSON_INVALID:${relative}`); }

    const checks={
      fingerprint:typeof record.fingerprint==='string' && record.fingerprint.trim().length>0,
      failure_class:typeof record?.compiler?.failure_class==='string' && record.compiler.failure_class.trim().length>0,
      evaluation:Array.isArray(record?.evaluation?.historical_replay) && record.evaluation.historical_replay.length>0,
      root_cause:hasSemanticKey(record,[/(^|\.)(root_cause|root_causes|cause|failure_reason)$/i]),
      prevention:hasSemanticKey(record,[/(^|\.)(prevention|prevention_rule|prevention_rules|regression|regression_contract)$/i]),
      evidence:hasSemanticKey(record,[/(^|\.)(tests|test_evidence|evidence|production_readback|outcome|outcome_evidence)$/i]),
    };
    const missing=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
    evaluated.push({file:relative,checks,missing,ok:missing.length===0});
  }
  return {
    fingerprint:SEMANTIC_LEARNING_CLOSURE_FINGERPRINT,
    files,
    evaluated,
    ok:evaluated.length>0 && evaluated.every(item=>item.ok),
    missing:evaluated.flatMap(item=>item.missing.map(key=>`${item.file}:${key}`))
  };
}

export function evaluateMaterialWritebackClosure({changedPaths=[],rootDir=null}={}){
  const paths=normalize(changedPaths);
  const materialPaths=paths.filter(path=>!CLOSURE_ONLY.some(re=>re.test(path)));
  const material=materialPaths.length>0;
  const evidence=Object.fromEntries(RULES.map(rule=>[rule.id,paths.filter(rule.matches)]));
  const missing=material?RULES.filter(rule=>evidence[rule.id].length===0).map(rule=>rule.id):[];
  let semantic_learning={fingerprint:SEMANTIC_LEARNING_CLOSURE_FINGERPRINT,files:[],evaluated:[],ok:!material,missing:[]};

  if(material && missing.length===0 && rootDir){
    semantic_learning=evaluateLearningSemantics({learningFiles:evidence.brain_learning,rootDir});
    if(!semantic_learning.ok) missing.push('semantic_learning');
  }

  return {
    ok:missing.length===0,
    fingerprint:MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT,
    semantic_fingerprint:SEMANTIC_LEARNING_CLOSURE_FINGERPRINT,
    material,
    changed_paths:paths,
    material_paths:materialPaths,
    evidence,
    semantic_learning,
    missing,
    status:missing.length===0?(material?'MATERIAL_WRITEBACK_CLOSURE_PROVEN':'NO_MATERIAL_DELTA'):'MATERIAL_WRITEBACK_CLOSURE_MISSING',
  };
}

function diffPaths(base,head){
  if(!base||!head) throw new Error('BASE_AND_HEAD_REQUIRED');
  return execFileSync('git',['diff','--name-only',base+'...'+head],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
}

if(import.meta.url==='file://'+process.argv[1]){
  const [base,head]=process.argv.slice(2);
  try{
    const result=evaluateMaterialWritebackClosure({changedPaths:diffPaths(base,head),rootDir:process.cwd()});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(!result.ok){
      process.stderr.write('MATERIAL_WRITEBACK_CLOSURE_BLOCKED: missing '+result.missing.join(', ')+'. Every material candidate must carry Brain learning, an activity ledger event, human documentation, and semantic root-cause/prevention/evidence content in the same lineage.\n');
      process.exitCode=78;
    }
  }catch(error){
    process.stderr.write('MATERIAL_WRITEBACK_CLOSURE_FAILED: '+error.message+'\n');
    process.exitCode=78;
  }
}
