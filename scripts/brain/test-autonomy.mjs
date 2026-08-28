import {evaluateAutonomy} from '../../brain/runtime/autonomy.mjs';
for(const t of ['RESEARCH','DEDUPE','CACHE','VALIDATE','INTERNAL_ENRICHMENT','GENERATE_TEST']){const r=evaluateAutonomy({type:t,autonomy_class:'A1'});if(r.result!=='ALLOW')throw new Error(`${t} blocked`)}
for(const b of ['credentials','permissions','destructive_data','paid_resource_increase','legal_commitment','financial_commitment','weaken_security']){const r=evaluateAutonomy({type:'BUILD',hard_boundary:b,autonomy_class:'A3'});if(r.result!=='BLOCK_HARD_BOUNDARY')throw new Error(`${b} allowed`)}
const p=evaluateAutonomy({type:'PRODUCTION_CHANGE',autonomy_class:'A3'});if(p.result!=='ALLOW'||!p.required_gates.includes('EXACT_CANDIDATE'))throw new Error('production gates missing');
console.log('autonomy tests passed');
