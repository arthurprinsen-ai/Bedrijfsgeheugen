import fs from 'node:fs';
import path from 'node:path';
import { buildDailySelfEvolutionSnapshot } from '../daily-self-evolution.mjs';

export const CAPABILITIES = Object.freeze([
  {id:'agent-skills',paths:['.agents/skills','AGENTS.md'],dimension:'quality'},
  {id:'brain-heartbeat',paths:['scripts/brain','.github/workflows/powerhouse-daily-self-evolution.yml'],dimension:'reliability'},
  {id:'portal',paths:['portal-v2'],dimension:'customer_value'},
  {id:'website',paths:['index.html'],dimension:'conversion'},
  {id:'data',paths:['supabase/migrations'],dimension:'data_quality'},
  {id:'engineering',paths:['.github/workflows/powerhouse-autonomous-engineering-optimizer.yml'],dimension:'cost_per_verified_outcome'},
  {id:'commercial',paths:['scripts/opportunity'],dimension:'verified_revenue'}
]);

export function buildImprovementEvidenceInventory({root=process.cwd(),now=new Date().toISOString(),capabilities=CAPABILITIES}={}){
  const snapshot=buildDailySelfEvolutionSnapshot({now});
  const records=capabilities.map(capability=>{
    const observations=capability.paths.map(p=>({path:p,present:fs.existsSync(path.join(root,p))}));
    const missing=observations.filter(x=>!x.present).map(x=>x.path);
    return {
      capability:capability.id,optimization_dimension:capability.dimension,observations,
      missing_data:missing,baseline:null,target:null,verified_kpi_delta:null,
      provenance:'repository-presence-only',production_readback:false,
      status:missing.length?'GAP_DETECTED':'INVENTORIED_UNVERIFIED',
      next_safe_action:missing.length?'Validate owner and expected path before proposing a repair':'Collect production metrics, evaluation results and source-specific evidence before proposing changes'
    };
  });
  return {
    contract:'powerhouse-improvement-evidence-inventory-v1',observed_at:now,
    source_snapshot:snapshot.fingerprint,source_snapshot_status:snapshot.status,
    checks:{capabilities_checked:records.length,gaps_found:records.filter(x=>x.missing_data.length).length,verified_improvements:0},
    deployment_status:'NOT_PROVEN',commercial_outcome_status:'NOT_PROVEN',
    records
  };
}
if(import.meta.url===`file://${process.argv[1]}`){
  const output=buildImprovementEvidenceInventory();
  fs.mkdirSync('artifacts/quality',{recursive:true});
  fs.writeFileSync('artifacts/quality/powerhouse-improvement-evidence-inventory.json',JSON.stringify(output,null,2)+'\n');
  process.stdout.write(JSON.stringify(output.checks)+'\n');
}
