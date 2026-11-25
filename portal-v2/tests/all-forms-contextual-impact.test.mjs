import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPortalInputPath,SUPPLEMENTAL_PORTAL_INPUT_SURFACES} from '../input-impact-coverage.js';
import {inventoryPortalCustomerFields,buildContextualActionCards,contextualCardsForPage,toRoadmapProposal} from '../contextual-action-cards.js';
import {buildChange,saveChangeProposal} from '../modules/change-wizard.js';
import {allPageIds} from '../page-registry.js';

const find=(state,id,options={})=>buildContextualActionCards(state,options).find(x=>x.id===id);
const fixed={today:'2026-10-08'};

test('all schema-declared inputs are labelled with a model family, impact pages and unverified readback status',()=>{
 const fields=inventoryPortalCustomerFields();
 assert.ok(fields.length>=70);
 for(const f of fields){
  assert.ok(f.path.startsWith('portal.'),'not a tenant portal path: '+f.path);
  assert.equal(f.mappingStatus,'MAPPED','missing impact mapping '+f.path);
  assert.ok(f.modelFamilies.length>0);
  assert.ok(f.affectedPages.length>0);
  assert.equal(f.declarationOnly,true);
  assert.equal(f.readbackStatus,'TENANT_ACK_REQUIRED');
  assert.ok(f.pages.every(p=>allPageIds().includes(p)));
 }
 const mto=fields.find(f=>f.path==='portal.people.mtoScore');
 assert.equal(mto.label,'MTO totaalscore (1–10)');
 assert.ok(mto.affectedPages.includes('roadmap'));
 assert.ok(fields.some(f=>f.path==='portal.business_context.events'&&f.pages.includes('bedrijfssituatie')));
});

test('unclassified and provider-owned forms are not mislabeled as full Brain coverage',()=>{
 assert.equal(classifyPortalInputPath('portal.unknown-feature.input').mappingStatus,'REVIEW_REQUIRED');
 const standalone=SUPPLEMENTAL_PORTAL_INPUT_SURFACES.find(x=>x.page==='koppelingen');
 assert.equal(standalone.readback,'CONNECTOR_PROVIDER_READBACK_REQUIRED');
 assert.equal(standalone.paths.length,0);
});

test('profile maturity affects strategy, finance, roadmap with P1 or P2 proposals, never guaranteed savings',()=>{
 const state={portal:{profile:{maturity:{finance:1,service:2}}}};
 const one=find(state,'maturity-finance',fixed);
 assert.equal(one.priority,'P1');
 assert.equal(one.financialImpact.amount,null);
 assert.ok(contextualCardsForPage('profiel',state).some(x=>x.id==='maturity-finance'));
 assert.ok(contextualCardsForPage('businesscase',state).some(x=>x.id==='maturity-finance'));
 assert.equal(find(state,'maturity-service',fixed).priority,'P2');
});

test('people turnover and critical knowledge without backup cause cross-page continuity actions',()=>{
 const state={portal:{people:{turnover:24,roles:[{criticalKnowledge:'Process automation',backup:''}]}}};
 assert.equal(find(state,'knowledge-backup',fixed).priority,'P1');
 assert.equal(find(state,'people-turnover',fixed).priority,'P2');
 assert.ok(find(state,'knowledge-backup',fixed).pages.includes('documenten'));
});

test('finance, customer and operations inputs trigger distinct source-explained recommendations',()=>{
 const state={portal:{metrics:{revenue:1000,ebitda:-40,nps:-30,satisfaction:5,
  performance:{defects:7,onTime:78,churn:20,quoteConversion:8}}}};
 const ids=new Set(buildContextualActionCards(state,fixed).map(x=>x.id));
 for(const id of ['negative-ebitda','negative-customer-nps','customer-satisfaction','operational-defects','delivery-reliability','customer-churn','quote-conversion'])assert.ok(ids.has(id),id);
 assert.equal(find(state,'negative-ebitda',fixed).priority,'P1');
 assert.equal(find(state,'negative-ebitda',fixed).financialImpact.amount,null);
});

test('DSO + revenue yield only a hypothetical working-capital scenario, never realized cash or profit',()=>{
 const state={portal:{metrics:{revenue:1000,dso:70}}};
 const proposal=find(state,'cash-collection',fixed);
 assert.equal(proposal.financialImpact.status,'SCENARIO_ONLY');
 assert.equal(proposal.financialImpact.amount,Math.round(1000*1000*10/365));
 assert.match(proposal.financialImpact.reason,/geen gerealiseerde kasstroom/);
 assert.equal(toRoadmapProposal(proposal).expected_value,null);
});

test('AI scan task retains estimated task cost as scenario, not benefit or compliant deployment',()=>{
 const state={portal:{aiScan:{hourlyRate:50,tasks:[{task:'Facturen controleren',hoursPerWeek:8,dataReadiness:2,errorRisk:5}]}}};
 const cards=buildContextualActionCards(state,fixed);
 const task=cards.find(x=>x.id==='ai-task-facturen-controleren');
 assert.equal(task.priority,'P1');
 assert.equal(task.financialImpact.amount,8*46*50);
 assert.equal(task.financialImpact.status,'SCENARIO_ONLY');
 assert.equal(task.status,'PROPOSAL_REVIEW_REQUIRED');
 assert.ok(task.pages.includes('compliance-governance'));
});

test('ESG gaps and benchmark differences do not claim law applicability or beneficial direction',()=>{
 const state={portal:{compliance:{esg:{0:'0',1:'1'}},
  market:{benchmarks:[{metric:'Verzuim',company:9,benchmark:5,source:''}]}}};
 const a=find(state,'esg-source-gaps',fixed),b=find(state,'market-gap-verzuim',fixed);
 assert.equal(a.priority,'P2');
 assert.equal(a.financialImpact.amount,null);
 assert.equal(b.status,'PROPOSAL_REVIEW_REQUIRED');
 assert.match(b.description,/Richting/);
});

test('due diligence red flags and weak research hypotheses route to actions without invented outcome',()=>{
 const state={portal:{dueDiligence:{findings:[{id:'f1',area:'Finance',finding:'Voorraad',redFlag:true,materiality:5}]},
 research:{hypotheses:[{id:'hyp',hypothesis:'Groei 40%',confidence:1}]}}};
 assert.equal(find(state,'due-diligence-f1',fixed).priority,'P1');
 assert.ok(find(state,'due-diligence-f1',fixed).pages.includes('waarde-financiering'));
 assert.equal(find(state,'hypothesis-evidence-hyp',fixed).priority,'P2');
});

test('a declared business crisis and company sale produce contextual scenario/due diligence cards',()=>{
 const state={portal:{business_context:{stage:'crisis',events:['sell']}}};
 assert.equal(find(state,'business-stage-crisis',fixed).priority,'P1');
 assert.ok(find(state,'business-stage-crisis',fixed).pages.includes('herstel-continuiteit'));
 assert.ok(find(state,'strategic-event-sell',fixed).pages.includes('exit'));
});

test('major unclosed change, blocked and overdue tasks generate separate priorities',()=>{
 const state={portal:{changes:{items:[{id:'c1',change:'ERP',impact:12,impactSemantics:'affected_capability_count',status:'Open'}]},
 tasks:{items:[{id:'t1',title:'Controleren',status:'Geblokkeerd'},{id:'t2',title:'Opleveren',due:'2026-09-30',status:'Open'}]}}};
 assert.equal(find(state,'change-c1',fixed).priority,'P1');
 assert.match(find(state,'change-c1',fixed).description,/capabilities/);
 assert.equal(find(state,'task-t1',fixed).priority,'P1');
 assert.equal(find(state,'task-t2',fixed).priority,'P2');
});

test('change wizard saves the canonical path only and waits for server-state acknowledgement',async()=>{
 let current=[],status='idle',setPaths=[],flushes=0;
 const domain={
  get(path){assert.equal(path,'portal.changes.items');return current;},
  set(path,value){setPaths.push(path);current=value;status='dirty';},
  async flush(){flushes++;status='saved';return {status:'saved'};},
  status(){return status;}
 };
 const change=buildChange({dimension:'finance',toLevel:4,owner:'Controller',reason:'Kritieke financiële sturing',effectiveDate:'2026-11-01'},2);
 assert.equal(change.impactSemantics,'affected_capability_count');
 const first=await saveChangeProposal(domain,change);
 assert.equal(first.alreadyPresent,false);
 const again=await saveChangeProposal(domain,change);
 assert.equal(again.alreadyPresent,true);
 assert.deepEqual(setPaths,['portal.changes.items']);
 assert.equal(current.length,1);
 assert.equal(flushes,2);
});

test('a pending canonical state acknowledgement is never represented as saved',async()=>{
 let current=[],status='dirty';
 const domain={
  get(){return current;},
  set(path,value){assert.equal(path,'portal.changes.items');current=value;},
  async flush(){return {status:'dirty'};},
  status(){return status;}
 };
 const change={dimension:'finance',toLevel:4,owner:'CFO',reason:'Control',effectiveDate:'2026-11-01'};
 await assert.rejects(()=>saveChangeProposal(domain,change),/CHANGE_WIZARD_BRAIN_ACK_PENDING/);
 assert.equal(current.length,1);
});

test('unchanged empty company context produces no invented contextual action',()=>{
 assert.deepEqual(buildContextualActionCards({},fixed),[]);
});
