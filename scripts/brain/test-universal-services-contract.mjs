import fs from 'node:fs';
const path='config/brain-universal-services.json';
if(!fs.existsSync(path)) throw new Error('universal services registry missing');
const cfg=JSON.parse(fs.readFileSync(path,'utf8'));
if(cfg.contract!=='BRAIN-UNIVERSAL-SERVICES-v1') throw new Error('wrong universal services contract');
for(const service of ['business_graph','living_memory','external_intelligence','change_impact','decision_lifecycle','action_execution','verified_value','ai_governance']){
  if(!cfg.services?.[service]) throw new Error(`missing canonical service ${service}`);
}
for(const stage of ['detect','verify','match','impact','prioritise','recommend','act','measure','learn']){
  if(!cfg.operating_loop?.includes(stage)) throw new Error(`missing operating loop stage ${stage}`);
}
if(cfg.persistence?.endpoint!=='/api/brain-operating-loop') throw new Error('canonical persistence endpoint missing');
if(cfg.persistence?.tenant_binding!=='server_identity') throw new Error('tenant binding must be server identity');
if(cfg.memory?.error_ledger!=='BG166'||cfg.memory?.current_state!=='BG167'||cfg.memory?.outcome_router!=='BG168') throw new Error('shared memory routing incomplete');
if(cfg.production?.authority!=='BG169') throw new Error('production authority must remain BG169');
for(const horizon of [30,90,180]) if(!cfg.value_evaluation_days?.includes(horizon)) throw new Error(`missing value evaluation horizon ${horizon}`);
for(const field of ['source','source_id','observed_at','freshness','evidence_ids']) if(!cfg.provenance_required?.includes(field)) throw new Error(`missing provenance ${field}`);
if(cfg.ingestion?.unknown_source!=='fail_closed') throw new Error('unknown sources must fail closed');
if(cfg.ingestion?.preserve_raw_source!==true) throw new Error('raw source compatibility must be preserved');
console.log('universal services contract tests passed');
