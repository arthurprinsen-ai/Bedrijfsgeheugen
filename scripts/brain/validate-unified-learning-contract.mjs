import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const REQUIRED = [
  'docs/architecture/unified-brain-heartbeat-learning-revenue-contract-20261025.md',
  'AGENTS.md',
  '.agents/skills/powerhouse-continuity/SKILL.md',
  'config/powerhouse-daily-self-evolution.json',
  '.github/workflows/powerhouse-daily-self-evolution.yml'
];

export function validateUnifiedLearningContract({read=(p)=>fs.readFileSync(p,'utf8')}={}){
  const errors=[];
  const texts={};
  for(const p of REQUIRED){try{texts[p]=read(p)}catch{errors.push('Missing contract surface: '+p)}}
  const cfg=(()=>{try{return JSON.parse(texts['config/powerhouse-daily-self-evolution.json'])}catch{errors.push('Invalid daily learning config');return {}}})();
  const doc='docs/architecture/unified-brain-heartbeat-learning-revenue-contract-20261025.md';
  for(const p of ['AGENTS.md','.agents/skills/powerhouse-continuity/SKILL.md']){
    if(texts[p] && !texts[p].includes(doc)) errors.push(p+' must link canonical contract');
  }
  for(const key of ['evidence_before_promotion','production_readback_required','learning_writeback_required','no_learning_without_evidence','security_non_degradation']){
    if(cfg.rules?.[key]!==true) errors.push('Missing mandatory learning rule: '+key);
  }
  if(cfg.cadence?.daily_learning_required!==true) errors.push('Daily learning cadence missing');
  const w=texts['.github/workflows/powerhouse-daily-self-evolution.yml']||'';
  if(!w.includes('node scripts/brain/validate-unified-learning-contract.mjs')) errors.push('Daily workflow must validate shared contract');
  if((w.match(/schedule:/g)||[]).length!==1) errors.push('Exactly one existing daily schedule must remain');
  if(!w.includes('node scripts/brain/daily-self-evolution.mjs')) errors.push('Canonical skill snapshot missing');
  if(!w.includes('node scripts/brain/continuous-improvement/run-autonomous-improvement.mjs')) errors.push('Canonical improvement probe missing');
  for(const term of ['tenant','evidence','skill','revenue','VERIFY','LEARN']){
    if(texts[doc] && !texts[doc].toLowerCase().includes(term.toLowerCase())) errors.push('Contract lacks requirement: '+term);
  }
  return {status:errors.length?'BLOCKED':'CONTRACT_VALID',errors,checked_surfaces:REQUIRED};
}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]){
  const result=validateUnifiedLearningContract();
  console.log(JSON.stringify(result,null,2));
  if(result.errors.length)process.exitCode=1;
}
