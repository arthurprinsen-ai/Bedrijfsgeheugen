import { execFileSync } from 'node:child_process';

export const MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT='powerhouse|material-run|closure-artifacts|required|v1';

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

export function evaluateMaterialWritebackClosure({changedPaths=[],regulatoryCandidateType=''}={}){
  const paths=normalize(changedPaths);
  const materialPaths=paths.filter(path=>!CLOSURE_ONLY.some(re=>re.test(path)));
  const sourceObservation=String(regulatoryCandidateType||'').trim()==='source-observation' && materialPaths.length===1 && materialPaths[0]==='data/regulatory-source-state.json';
  const material=materialPaths.length>0 && !sourceObservation;
  const evidence=Object.fromEntries(RULES.map(rule=>[rule.id,paths.filter(rule.matches)]));
  const missing=material?RULES.filter(rule=>evidence[rule.id].length===0).map(rule=>rule.id):[];
  return {
    ok:missing.length===0,
    fingerprint:MATERIAL_WRITEBACK_CLOSURE_FINGERPRINT,
    material,
    changed_paths:paths,
    material_paths:materialPaths,
    evidence,
    missing,
    source_observation:sourceObservation,
    status:missing.length===0?(sourceObservation?'SOURCE_OBSERVATION_WRITEBACK_NOT_REQUIRED':(material?'MATERIAL_WRITEBACK_CLOSURE_PROVEN':'NO_MATERIAL_DELTA')):'MATERIAL_WRITEBACK_CLOSURE_MISSING',
  };
}

function diffPaths(base,head){
  if(!base||!head) throw new Error('BASE_AND_HEAD_REQUIRED');
  return execFileSync('git',['diff','--name-only',base+'...'+head],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
}

if(import.meta.url==='file://'+process.argv[1]){
  const [base,head]=process.argv.slice(2);
  try{
    const prBody=process.env.PR_BODY||'';
    const regulatoryCandidateType=(prBody.match(/^Regulatory-Candidate-Type:\\s*(.+)$/mi)?.[1]||'').trim();
    const result=evaluateMaterialWritebackClosure({changedPaths:diffPaths(base,head),regulatoryCandidateType});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(!result.ok){
      process.stderr.write('MATERIAL_WRITEBACK_CLOSURE_BLOCKED: missing '+result.missing.join(', ')+'. Every material candidate must carry Brain learning, an activity ledger event, and human documentation in the same lineage.\n');
      process.exitCode=78;
    }
  }catch(error){
    process.stderr.write('MATERIAL_WRITEBACK_CLOSURE_FAILED: '+error.message+'\n');
    process.exitCode=78;
  }
}
