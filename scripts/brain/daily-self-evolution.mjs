import fs from 'node:fs';
import path from 'node:path';

const contract = JSON.parse(fs.readFileSync('config/powerhouse-daily-self-evolution.json','utf8'));
const exists = p => fs.existsSync(p);
const walk=(root,out=[])=>{
  if(!exists(root)) return out;
  const s=fs.statSync(root);
  if(s.isFile()){out.push(root);return out;}
  for(const e of fs.readdirSync(root,{withFileTypes:true})){
    if(['node_modules','.git','artifacts'].includes(e.name)) continue;
    walk(path.join(root,e.name),out);
  }
  return out;
};

export function buildDailySelfEvolutionSnapshot({now=new Date().toISOString()}={}){
  const surfaceRows=[];
  for(const [surface,roots] of Object.entries(contract.surfaces)){
    const files=[...new Set(roots.flatMap(root=>walk(root)))].sort();
    surfaceRows.push({surface,roots,files:fileCount(files),missing_roots:roots.filter(r=>!exists(r))});
  }
  const required=[
    ['chat_preflight','scripts/brain/chat-learning-preflight.mjs'],
    ['shared_agent_memory','.github/workflows/shared-agent-memory-tests.yml'],
    ['engineering_learning','.github/workflows/engineering-os-learning.yml'],
    ['autonomous_runtime','scripts/brain/continuous-improvement/run-autonomous-improvement.mjs'],
    ['capability_inventory','scripts/brain/continuous-improvement/capability-inventory.mjs'],
    ['autonomous_engineering_optimizer','scripts/brain/autonomous-engineering-fabric-v3.mjs'],
    ['self_improvement_layer','brain/self-improvement/self-improvement-layer.mjs'],
    ['self_improvement_contract','brain/contracts/self-improvement-layer-v1.json'],
    ['self_improvement_skill','.agents/skills/powerhouse-self-improvement-layer/SKILL.md'],
    ['daily_compound_learning','supabase/migrations/20260929084144_powerhouse_daily_compound_learning_v1.sql'],
    ['whole_brain_daily_audit','.github/workflows/whole-brain-canonical-loop-v2.yml'],
    ['universal_closed_loop_daily_audit','.github/workflows/universal-closed-loop-learning.yml']
  ];
  const controls=required.map(([id,p])=>({id,path:p,present:exists(p)}));
  const missing=controls.filter(x=>!x.present).map(x=>x.id);
  return {
    fingerprint:contract.version,
    observed_at:now,
    applies_to:contract.applies_to,
    lifecycle:contract.lifecycle,
    optimization_dimensions:contract.optimization_dimensions,
    surfaces:surfaceRows,
    controls,
    missing_controls:missing,
    daily_learning_required:contract.cadence.daily_learning_required,
    promotion_policy:{
      evidence_before_promotion:contract.rules.evidence_before_promotion,
      representative_eval_required:contract.rules.representative_eval_required,
      production_readback_required:contract.rules.production_readback_required,
      rollback_required:contract.rules.rollback_required,
      no_change_is_valid_when_champion_remains_best:contract.rules.no_change_is_valid_when_champion_remains_best
    },
    status: missing.length ? 'RECORDED_PENDING_FINAL_DELIVERY_READBACK' : 'READY_FOR_DAILY_SELF_EVOLUTION'
  };
}
function fileCount(files){return files.length;}

if(import.meta.url===`file://${process.argv[1]}`){
  const snapshot=buildDailySelfEvolutionSnapshot();
  fs.mkdirSync('artifacts/quality',{recursive:true});
  fs.writeFileSync('artifacts/quality/powerhouse-daily-self-evolution.json',JSON.stringify(snapshot,null,2)+'\n');
  process.stdout.write(JSON.stringify(snapshot,null,2)+'\n');
  if(snapshot.missing_controls.length) process.exitCode=2;
}
