import {transformSourceRecord} from '../../brain/operating-loop/source-transformer.mjs';

const make = transformSourceRecord({
  source:'make', tenantId:'t1', canonicalType:'Outcome', id:'run:1',
  raw:{scenario_id:7132648,execution_id:'abc',status:'success',credits:10,observed_at:'2026-08-30T17:00:00Z'},
  evidenceIds:['meter:1'], owner:'BG159', executed:true, verified:true, result:'cost snapshot captured'
});
if(make.type!=='Outcome'||make.source!=='make'||make.sourceId!=='7132648:abc') throw new Error('Make source identity mapping failed');
if(make.payload.raw.status!=='success'||make.payload.mappingVersion!=='v1') throw new Error('raw source/version must be preserved');

const seo = transformSourceRecord({
  source:'dataforseo',tenantId:'t1',canonicalType:'Opportunity',id:'seo:1',
  raw:{task_id:'task-1',keyword:'kennis borgen',location_code:2528,observed_at:'2026-08-30T17:00:00Z'},
  evidenceIds:['e1'],owner:'BG158',payload:{recommendation:'Build landing page',impact:.8,confidence:.9,urgency:.7}
});
if(seo.sourceId!=='task-1:kennis borgen:2528'||seo.type!=='Opportunity') throw new Error('DataForSEO mapping failed');

let rejected=false;try{transformSourceRecord({source:'unknown',tenantId:'t1',canonicalType:'Evidence',id:'x',raw:{}});}catch(e){rejected=e.code==='UNKNOWN_BRAIN_SOURCE';}
if(!rejected) throw new Error('unknown source must fail closed');

rejected=false;try{transformSourceRecord({source:'make',tenantId:'t1',canonicalType:'Decision',id:'x',raw:{scenario_id:1,execution_id:'x'}});}catch(e){rejected=e.code==='SOURCE_TYPE_NOT_ALLOWED';}
if(!rejected) throw new Error('source must not emit undeclared canonical type');
console.log('source transformer tests passed');
