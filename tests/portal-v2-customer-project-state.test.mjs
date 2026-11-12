import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalProjectClient, projectRecordToPortalState, mergeProjectState } from '../portal-v2/project-state.js';

const record={
  customer:{id:'c-1',name:'IJsselmonde'},
  quote:{
    number:'OFF-2026-001',title:'Data scan, 360° klantbeeld & management dashboard',status:'verstuurd',bedrag:20000,geldig_tot:'2026-10-11',
    inhoud:{components:[{title:'Data scan & advies',price:3900,sprints:[{name:'Sprint 1'}],stories:[{title:'Inventariseer bronnen'}]}]}
  }
};

test('project client uses the identity-scoped API and never sends a browser tenant/customer selector',async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify(record),{status:200,headers:{'content-type':'application/json'}});};
  const client=createPortalProjectClient({fetchImpl,getToken:async()=>'signed-token'});
  const result=await client.load();
  assert.equal(calls[0][0],'/api/portal-project');
  assert.equal(calls[0][1].headers.authorization,'Bearer signed-token');
  assert.equal(result.customer.name,'IJsselmonde');
});

test('project record becomes a V2 project/offerte model without dropping nested sprints and stories',()=>{
  const state=projectRecordToPortalState(record);
  assert.equal(state.company.name,'IJsselmonde');
  assert.equal(state.portal.offer.number,'OFF-2026-001');
  assert.equal(state.portal.offer.amount,20000);
  assert.equal(state.portal.offer.components[0].sprints[0].name,'Sprint 1');
  assert.equal(state.portal.offer.components[0].stories[0].title,'Inventariseer bronnen');
});

test('missing project fields do not erase previously committed customer answers',()=>{
 const base={company:{name:'Eigen bedrijf'},portal:{
  profile:{employees:42},tasks:{items:[{id:'custom',title:'Eigen taak'}]},
  roadmap:{items:[{id:'r1',title:'Eigen doel'}]},
  delivery:{tasks:[{id:'d1'}],openTasks:1,sprints:[{id:'s1'}]},
  documents:{items:[{id:'doc'}]},integrations:{items:[{id:'crm'}]},
  notes:{items:[{id:'note'}]},activity:[{id:'event'}],
  deliveryPlan:{features:[{id:'feature'}]}
 }};
 const before=structuredClone(base);
 for(const partial of [{},{customer:{name:'Nieuwe naam'}},{quote:{title:'Project'}},{quote:{title:'Project',inhoud:{summary:'Samenvatting'}}}]){
  const next=mergeProjectState(base,partial);
  for(const key of ['tasks','roadmap','delivery','documents','integrations','notes','activity','deliveryPlan'])
   assert.deepEqual(next.portal[key],before.portal[key],key+' dropped by sparse project payload');
  assert.deepEqual(next.portal.profile,before.portal.profile);
 }
 assert.deepEqual(base,before,'merge must not mutate original customer source state');
});

test('explicit authoritative project collection is reflected without changing unrelated customer sources',()=>{
 const base={portal:{tasks:{items:[{id:'prior'}]},documents:{items:[{id:'preserve'}]},profile:{employees:18}}};
 const next=mergeProjectState(base,{quote:{id:'quote',inhoud:{tasks:[]}}});
 assert.deepEqual(next.portal.tasks.items,[],'provider explicit empty array is an intentional authoritative change');
 assert.deepEqual(next.portal.documents,base.portal.documents,'absent documents are not empty documents');
 assert.equal(next.portal.profile.employees,18);
});

test('customer-only project response updates company identity without generating placeholder project data',()=>{
 const source={company:{name:'Old'},portal:{project:{name:'Eigen dossier'},tasks:{items:[{id:'a'}]}}};
 const updated=mergeProjectState(source,{customer:{name:'Official'}});
 assert.equal(updated.company.name,'Official');
 assert.deepEqual(updated.portal,source.portal);
});
