import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutiveProjection} from '../portal-v2/operating-system/executive-projection.js';
import {executiveCockpitMarkup} from '../portal-v2/operating-system/executive-cockpit.js';

const evidence={tenant_id:'tenant-1',source:'erp',observed_at:new Date().toISOString(),confidence:0.91};

test('executive cockpit projects at most five canonical PH problems',()=>{
 const state={powerhouse:{tenant_id:'tenant-1',executive:{problems:Array.from({length:7},(_,i)=>({
   problem_id:`PH-P${String(i+1).padStart(3,'0')}`,
   name:`Probleem ${i+1}`,
   priority:100-i,
   impact_label:i===0?'OBSERVED':'ESTIMATED',
   evidence
 }))}}};
 const model=buildExecutiveProjection(state,{tenantId:'tenant-1'});
 assert.equal(model.problems.length,5);
 assert.equal(model.problems[0].problem_id,'PH-P001');
 assert.equal(model.problems[0].impact_label,'OBSERVED');
});

test('invalid problem ids are excluded and unknown impact labels fail safe to POTENTIAL',()=>{
 const state={powerhouse:{tenant_id:'tenant-1',executive:{problems:[
   {problem_id:'LOCAL-1',name:'Parallel truth',impact_label:'OBSERVED',evidence},
   {problem_id:'PH-P007',name:'Dubbele invoer',impact_label:'GUESSED',evidence}
 ]}}};
 const model=buildExecutiveProjection(state,{tenantId:'tenant-1'});
 assert.equal(model.problems.length,1);
 assert.equal(model.problems[0].problem_id,'PH-P007');
 assert.equal(model.problems[0].impact_label,'POTENTIAL');
});

test('cockpit renders problem-first framing and evidence drawer',()=>{
 const state={powerhouse:{tenant_id:'tenant-1',executive:{problems:[{
   problem_id:'PH-P001',
   name:'Eigenaar is operationele bottleneck',
   impact_label:'ESTIMATED',
   impact_value:12,
   actions:['delegatiematrix opstellen'],
   capabilities:['Owner Dependency Reduction'],
   outcomes:['doorlooptijd approvals'],
   source_refs:['crm:approval-log'],
   evidence
 }]}}};
 const html=executiveCockpitMarkup(buildExecutiveProjection(state,{tenantId:'tenant-1'}));
 assert.match(html,/Wat vraagt vandaag aandacht\?/);
 assert.match(html,/PH-P001/);
 assert.match(html,/Waarom zegt Powerhouse dit\?/);
 assert.match(html,/ESTIMATED/);
 assert.match(html,/Owner Dependency Reduction/);
 assert.match(html,/doorlooptijd approvals/);
});


test('problem radar context is visually projected without creating a second truth',()=>{
 const state={powerhouse:{tenant_id:'tenant-1',executive:{problems:[{
   problem_id:'PH-P031',name:'Ziekteverzuim structureel hoog',impact_label:'POTENTIAL',
   symptoms:['capaciteit valt uit','planning schuift'],buying_trigger:'verzuim stijgt',sector_or_segment:'mkb diensten',source_class:'official_statistics',freshness_status:'current',
   priority_dimensions:{recency:92,scale:71,urgency:84,buying_intent:66,powerhouse_relevance:95},
   context_relevance:'Relevant doordat interne capaciteitsdata dezelfde richting op wijst.',
   source_refs:['cbs:verzuim'],evidence
 }]}}};
 const model=buildExecutiveProjection(state,{tenantId:'tenant-1'});
 assert.equal(model.problems[0].buying_trigger,'verzuim stijgt');
 assert.equal(model.problems[0].priority_dimensions.urgency,84);
 const html=executiveCockpitMarkup(model);
 assert.match(html,/Contextuele probleemvisualisatie/);
 assert.match(html,/Koopintentie/);
 assert.match(html,/mkb diensten/);
 assert.match(html,/capaciteit valt uit/);
 assert.match(html,/Relevant doordat interne capaciteitsdata/);
});
