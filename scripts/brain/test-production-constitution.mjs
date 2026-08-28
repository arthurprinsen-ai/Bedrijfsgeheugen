import {productionDecision} from '../../brain/production/constitution.mjs';
const base={candidate_sha:'abc',tested_sha:'abc',rollback_sha:'lkg',qa_green:true,security_green:true,cost_performance_green:true,preview_green:true,protected_metrics_green:true,production_green:true,exact_production_sha:'abc'};
if(productionDecision({...base,tested_sha:'zzz'}).decision!=='RECOVERING') throw new Error('mismatch candidate accepted');
if(productionDecision({...base,rollback_sha:''}).decision!=='BLOCK_HARD_BOUNDARY') throw new Error('missing rollback accepted');
if(productionDecision({...base,security_green:false}).decision!=='RECOVERING') throw new Error('security red accepted');
if(productionDecision(base).decision!=='PROMOTE') throw new Error('green candidate not promoted');
const red=productionDecision({...base,production_green:false,protected_metrics_green:false}); if(red.decision!=='ROLLBACK'||red.rollback_sha!=='lkg') throw new Error('prod red did not rollback');
console.log('production constitution tests passed');
