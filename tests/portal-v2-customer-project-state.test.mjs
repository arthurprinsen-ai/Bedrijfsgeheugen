import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalProjectClient, projectRecordToPortalState } from '../portal-v2/project-state.js';

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
