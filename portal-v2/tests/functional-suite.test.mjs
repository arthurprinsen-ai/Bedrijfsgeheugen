import test from 'node:test';
import assert from 'node:assert/strict';
import { functionalDefinition, functionalSchema, listFunctionalSuitePages, computeFunctionalAnalysis } from '../modules/functional-suite.js';

const PAGES=['data-ai','ai-scan','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategie-naar-maandagochtend','canvassen','eindconclusie','due-diligence','actueel-houden','wijzigingen','advies','offerte','roadmap'];

test('all remaining protected legacy pages are native editable workspaces',()=>{
 assert.deepEqual(listFunctionalSuitePages(),PAGES);
 for(const pageId of PAGES){
  const definition=functionalDefinition(pageId);
  assert.ok(definition,`missing ${pageId}`);
  assert.ok(definition.slice.startsWith('portal.'));
  assert.ok(definition.fields.length>0);
  assert.ok(definition.models.length>0);
  for(const field of functionalSchema(pageId))assert.ok(field.path.startsWith('portal.'),`${pageId}:${field.id}`);
 }
});

test('repeatable legacy collections remain repeatable and structured',()=>{
 for(const pageId of ['ai-scan','mensen','branche-markt','onderzoek','due-diligence','wijzigingen','advies','roadmap']){
  const fields=functionalSchema(pageId);
  assert.ok(fields.some(field=>field.type==='repeatable'&&field.columns?.length>=2),pageId);
 }
});

test('the exact six legacy canvases are editable in V2',()=>{
 const ids=functionalSchema('canvassen').map(field=>field.id);
 for(const key of ['bmc','vpc2','lean','merk','content','sales2']){
  assert.ok(ids.includes(`${key}question`),key);
  assert.ok(ids.includes(`${key}owner`),`${key}:owner`);
 }
});

test('business, finance, offer and roadmap analyses react deterministically to state',()=>{
 const state={portal:{
  profile:{employees:24,hourlyCost:52,maturity:{sturing:1,commercie:1,operatie:1,finance:1,mensen:1,analytics:1,quality:1,governance:1,tech:1,culture:1,service:1,security:1,duurzaam:1}},
  businessCase:{target:4,delay:6,investment:50000},
  metrics:{revenue:1000,ebitda:100,wages:350,marketing:30,it:25},
  valueFinance:{debt:200,cash:50,equity:300,balance:600,interest:20,multiple:5},
  offer:{package:'Scale',sprints:3,weeklyPrice:2500,startDate:'2026-10-01'},
  roadmap:{items:[{title:'A',progress:100,done:true},{title:'B',progress:50,done:false}]}
 }};
 const business=Object.fromEntries(computeFunctionalAnalysis('businesscase',state));
 assert.match(business['Jaarpotentieel'],/€/);
 assert.match(business['Kosten van uitstel'],/€/);
 const finance=Object.fromEntries(computeFunctionalAnalysis('cijfers-maatstaven',state));
 assert.match(finance['EBITDA-marge'],/10/);
 const value=Object.fromEntries(computeFunctionalAnalysis('waarde-financiering',state));
 assert.match(value['Enterprise value'],/500/);
 const offer=Object.fromEntries(computeFunctionalAnalysis('offerte',state));
 assert.equal(offer['Doorlooptijd'],'6 weken');
 const roadmap=Object.fromEntries(computeFunctionalAnalysis('roadmap',state));
 assert.equal(roadmap['Afgerond'],'1');
 assert.match(roadmap['Gem. voortgang'],/75/);
});
