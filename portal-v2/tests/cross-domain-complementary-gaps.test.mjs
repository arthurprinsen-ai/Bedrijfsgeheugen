import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContextualActionCards,contextualCardsForPage,toRoadmapProposal,inventoryPortalCustomerFields} from '../contextual-action-cards.js';
import {DOMAIN_GAP_PAGES} from '../contextual-domain-gaps.js';
import {saveChangeProposal,buildChange} from '../modules/change-wizard.js';
import {allPageIds} from '../page-registry.js';
const find=(state,id)=>buildContextualActionCards(state).find(row=>row.id===id);
test('complementary contexts use only known native pages and existing input schemas remain classified',()=>{
 const pages=new Set(allPageIds());
 assert.ok(DOMAIN_GAP_PAGES.every(page=>pages.has(page)));
 const inventory=inventoryPortalCustomerFields();
 assert.ok(inventory.some(row=>row.path==='portal.people.mtoScore'));
 assert.ok(inventory.some(row=>row.path==='portal.business_context.events'));
 assert.ok(inventory.every(row=>row.readbackStatus==='TENANT_ACK_REQUIRED'));
});
const checks=[
 ['cost basis',{portal:{profile:{employees:50}}},'profile-cost-basis-missing','businesscase','P2'],
 ['net debt',{portal:{valueFinance:{debt:200,cash:20}}},'net-debt-financing-context','waarde-financiering','P2'],
 ['staffing',{portal:{people:{vacancies:4}}},'vacancy-capacity-review','mensen','P2'],
 ['lead time',{portal:{metrics:{performance:{leadTime:45}}}},'process-lead-time-review','uitvoeringsladder','P2'],
 ['productive hours',{portal:{metrics:{performance:{billable:35}}}},'productive-time-review','businesscase','P2'],
 ['research source',{portal:{research:{hypotheses:[{hypothesis:'Groei',source:'',evidence:''}]}}},'research-source-gap','onderzoek','P2'],
 ['governance',{portal:{dataAi:{governance:1}}},'ai-governance-baseline-review','compliance-governance','P2'],
 ['strategy owner',{portal:{strategy:{findings:[{finding:'Verander CRM'}]}}},'strategic-finding-owner','taken-werkstromen','P2'],
 ['canvas owner',{portal:{canvases:{bmc:{answer:'Meer klantwaarde'}}}},'canvas-accountability-gap','canvassen','P2'],
 ['decision owner',{portal:{finalConclusion:{decision:'Nieuwe koers'}}},'management-decision-owner','eindconclusie','P2'],
 ['goal target',{portal:{business_context:{goals:['revenue_growth'],goal_targets:{}}}},'business-goal-target-gap','bedrijfssituatie','P2'],
 ['connector failure',{portal:{connections:{items:[{status:'failed'}]}}},'connector-runtime-review','koppelingen','P1']
];
for(const [name,state,id,page,priority] of checks)test('context impact '+name,()=>{
 const candidate=find(state,id);
 assert.ok(candidate,id);
 assert.equal(candidate.priority,priority);
 assert.equal(candidate.status,'PROPOSAL_REVIEW_REQUIRED');
 assert.equal(candidate.financialImpact.amount,null);
 assert.equal(candidate.sourceEvidence,'CUSTOMER_REPORTED_NOT_INDEPENDENTLY_VERIFIED');
 assert.ok(contextualCardsForPage(page,state).some(x=>x.id===id));
 assert.ok(contextualCardsForPage('roadmap',state).some(x=>x.id===id));
 assert.equal(toRoadmapProposal(candidate).status,'Voorgesteld');
});
test('empty state creates no artificial compliance or financial risk',()=>{
 assert.deepEqual(buildContextualActionCards({}),[]);
});
test('existing cross-domain MTO and DSO models remain intact after complementary rules',()=>{
 const state={portal:{people:{mtoScore:4.5},metrics:{revenue:1000,dso:70}}};
 assert.ok(find(state,'mto-score'));
 assert.equal(find(state,'cash-collection').financialImpact.status,'SCENARIO_ONLY');
});
test('canonical change wizard on main uses path/value, avoids duplicates and requires save readback',async()=>{
 const list=[];const calls=[];
 const state={
  get(path){assert.equal(path,'portal.changes.items');return list;},
  set(path,value){assert.equal(path,'portal.changes.items');calls.push(path);list.splice(0,list.length,...value);},
  async flush(){calls.push('flush');},
  status(){return 'saved';}
 };
 const change=buildChange({dimension:'commercie',toLevel:4,reason:'Klanten',owner:'Manager'},2);
 assert.equal((await saveChangeProposal(state,change)).status,'Open');
 await saveChangeProposal(state,change);
 assert.deepEqual(calls,['portal.changes.items','flush','flush']);
 assert.equal(list.length,1);
});
