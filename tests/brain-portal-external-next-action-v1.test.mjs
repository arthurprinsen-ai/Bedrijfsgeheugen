import test from 'node:test';
import assert from 'node:assert/strict';
import {signalNextStep} from '../portal-v2/modules/entrepreneur-intelligence.js';
test('unverified external signal is not a completed order',()=>{const x=signalNextStep({signal_key:'x'},[]);assert.equal(x.linked,false);});

const now=new Date('2026-10-25T08:00:00Z');
const item={signal_key:'official-change:1',signal_type:'DEMAND_CHANGE',published_at:'2026-10-23T08:00:00Z',external_url:'https://www.rvo.nl/subsidies-financiering',tenant_specific_impact:true,impact_status:'SCORED',company_impacts:[{status:'SCORED',rationale:'Dit raakt het lopende bedrijfsproject.'}]};
const action={signal_key:item.signal_key,title:'Controleer de aanvraag',tenant_specific:true,projection_scope:'TENANT',canonical_action_ref:'task:321'};
test('real tenant impact provides an attributable reason and linked next step',()=>{
 const x=signalNextStep(item,[action],now);
 assert.match(x.why,/lopende bedrijfsproject/);
 assert.match(x.nextStep,/Open de bestaande actie/);
 assert.equal(x.linked,true);
 assert.equal(x.actionStatus,'GEKOPPELDE_ACTIE');
});
test('general market suggestion never becomes an assigned task without tenant proof',()=>{
 const x=signalNextStep({...item,tenant_specific_impact:false,impact_status:'NEEDS_COMPANY_CONTEXT',company_impacts:[]},[{...action,tenant_specific:false,projection_scope:'CANONICAL_REVIEW'}],now);
 assert.equal(x.linked,false);
 assert.match(x.nextStep,/nog geen toegewezen of uitgevoerde actie/);
});
test('old publication date forces source check before customer execution',()=>{
 const x=signalNextStep({...item,published_at:'2024-10-01T08:00:00Z'},[action],now);
 assert.equal(x.stale,true);
 assert.equal(x.linked,false);
 assert.match(x.nextStep,/Controleer eerst de actualiteit/);
});
test('expired deadline is not sold as a current opportunity',()=>{
 const x=signalNextStep({...item,deadline:'2026-10-06'},[action],now);
 assert.equal(x.expired,true);
 assert.equal(x.linked,false);
 assert.match(x.nextStep,/deadline is verstreken/);
});
test('the portal links are always full secure external URLs',()=>{
 const x=signalNextStep(item,[action],now);
 assert.equal(x.sourceUrl,'https://www.rvo.nl/subsidies-financiering');
 assert.equal(signalNextStep({...item,external_url:'http://www.rvo.nl'},[action],now).sourceUrl,'');
});

test('portal home and environment radar join each relevant signal to its action evidence',async()=>{
 const {readFile}=await import('node:fs/promises');
 const ui=await readFile(new URL('../portal-v2/modules/entrepreneur-intelligence.js',import.meta.url),'utf8');
 assert.match(ui,/Relevant voor jouw bedrijf: bron, reden en actie/);
 assert.match(ui,/Waarom is dit voor mij relevant/);
 assert.match(ui,/Wat moet ik nu doen/);
 assert.match(ui,/intelligenceSignalCard\(x,domainMap,actions\)/);
 assert.match(ui,/tenant_specific_impact===true&&s.impact_status==='SCORED'/);
 assert.match(ui,/guidance\.linked\?/);
});
