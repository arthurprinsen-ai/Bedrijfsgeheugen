import {createOperatingLoopStore} from '../../brain/operating-loop/store.mjs';

function memoryAdapter(){
  const map=new Map();
  return {
    async get(key){return map.get(key)||null;},
    async put(key,value){map.set(key,value);return value;},
    async list(prefix=''){return [...map.entries()].filter(([k])=>k.startsWith(prefix)).map(([key,value])=>({key,value}));}
  };
}

const store=createOperatingLoopStore(memoryAdapter());
await store.append({tenantId:'t1',type:'Evidence',id:'e1',source:'seo',subjectId:'market:seo',idempotencyKey:'k1',payload:{signal:'rise'}});
await store.append({tenantId:'t1',type:'Decision',id:'d1',subjectId:'market:seo',evidenceIds:['e1'],owner:'BG158',status:'APPROVED',idempotencyKey:'k2',payload:{recommendation:'publish'}});
await store.append({tenantId:'t1',type:'Action',id:'a1',subjectId:'market:seo',decisionId:'d1',owner:'BG156',status:'EXECUTED',idempotencyKey:'k3'});
await store.append({tenantId:'t1',type:'Outcome',id:'o1',subjectId:'market:seo',actionId:'a1',owner:'BG156',executed:true,verified:true,result:'lead +1',evidenceIds:['e1'],idempotencyKey:'k4'});
await store.append({tenantId:'t1',type:'Learning',id:'l1',subjectId:'market:seo',outcomeId:'o1',owner:'BG168',idempotencyKey:'k5',payload:{pattern:'repeat'}});

const projection=await store.getProjection('t1');
if(projection.records.length!==5) throw new Error('store must persist all material Brain records');
if(projection.state.stages.learn!==true||projection.state.stages.measure!==true) throw new Error('projection must expose full measured learning loop');
if(projection.state.graph.edges.length<4) throw new Error('projection must expose Business Graph relationships');
if(projection.advice.length!==1) throw new Error('projection must expose actionable advice');

const duplicate=await store.append({tenantId:'t1',type:'Evidence',id:'e1',source:'seo',subjectId:'market:seo',idempotencyKey:'k1',payload:{signal:'changed'}});
if(duplicate.duplicate!==true) throw new Error('same idempotency key must dedupe');

let conflict=false;
try{await store.append({tenantId:'t1',type:'Evidence',id:'e1',source:'seo',subjectId:'market:seo',idempotencyKey:'different'});}catch(e){conflict=e.code==='BRAIN_RECORD_CONFLICT';}
if(!conflict) throw new Error('same record id with different idempotency key must fail closed');

console.log('universal operating store tests passed');
