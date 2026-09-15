import test from 'node:test';
import assert from 'node:assert/strict';
import { functionalDefinition, functionalSchema, listFunctionalSuitePages, computeFunctionalAnalysis } from '../modules/functional-suite.js';
import { canvasSchema, buildCanvasAnalysis } from '../modules/canvas-workspace.js';
import { bcgModel, buildBcgAction } from '../modules/strategy-models.js';
import { LEGACY_FUNCTIONAL_INVENTORY } from '../legacy-functional-inventory.js';

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

test('the exact six legacy canvases are full structured Powerhouse views, not question plus owner placeholders',()=>{
 const schema=canvasSchema();
 assert.deepEqual(schema.map(canvas=>canvas.key),['bmc','vpc2','lean','merk','content','sales2']);
 for(const canvas of schema){
  assert.ok(canvas.title);
  assert.ok(canvas.sections.length>=4,`${canvas.key}:sections`);
  assert.ok(canvas.sections.every(section=>section.id&&section.label),`${canvas.key}:section-contract`);
 }
});

test('canvas analysis reconstructs completed content from canonical customer state and keeps client overrides',()=>{
 const state={portal:{
  profile:{companyName:'Demo BV',employees:24,goal:'groei',maturity:{sturing:3,commercie:2,operatie:4,finance:3,mensen:3,analytics:2,quality:4,governance:2,tech:3,culture:4,service:4,security:3,duurzaam:2}},
  metrics:{revenue:1800,customers:120,newCustomers:18,largestCustomer:12,grossMargin:42,nps:37,quoteConversion:31},
  market:{industry:'Zakelijke dienstverlening',growth:2.4,digitalMaturity:3.1},
  canvases:{merk:{answer:'Menselijk en praktisch',owner:'Arthur',details:{bewijs:'Klantcases'}}}
 }};
 const analysis=buildCanvasAnalysis(state);
 assert.equal(analysis.merk.answer,'Menselijk en praktisch');
 assert.equal(analysis.merk.owner,'Arthur');
 assert.equal(analysis.merk.values.bewijs,'Klantcases');
 assert.match(analysis.bmc.values.klantsegmenten,/Zakelijke dienstverlening|120/);
 assert.match(analysis.bmc.values.inkomsten,/1\.800|1800/);
 assert.match(analysis.content.values.doelgroep,/Zakelijke dienstverlening|120/);
 assert.ok(analysis.conclusion.length>20);
});

test('BCG stays an explicit atomic strategy parity obligation',()=>{
 const strategy=LEGACY_FUNCTIONAL_INVENTORY.strategie;
 assert.ok(strategy.models.includes('BCG-matrix'));
 assert.ok(strategy.calculations.includes('bcg-quadrant'));
 assert.ok(strategy.actions.includes('bcg-add-question-mark-action-to-roadmap'));
});

test('legacy BCG model preserves exact growth and relative-position quadrant rules',()=>{
 const star=bcgModel({growth:2.4,companyMaturity:3.4,industryDigitalMaturity:3.1});
 assert.equal(star.quadrant,'Ster');
 assert.equal(star.marketGrowthThreshold,1.5);
 assert.equal(star.strongPosition,true);
 assert.match(star.explanation,/2\.4%/);
 assert.match(star.explanation,/3\.4/);
 assert.match(star.explanation,/3\.1/);
 assert.equal(bcgModel({growth:1.5,companyMaturity:3.1,industryDigitalMaturity:3.1}).quadrant,'Melkkoe');
 assert.equal(bcgModel({growth:1.6,companyMaturity:3.0,industryDigitalMaturity:3.1}).quadrant,'Vraagteken');
 assert.equal(bcgModel({growth:1.5,companyMaturity:3.0,industryDigitalMaturity:3.1}).quadrant,'Hond');
});

test('legacy BCG question-mark state creates the same downstream invest-or-drop action',()=>{
 const action=buildBcgAction({growth:2.4,companyMaturity:2.8,industryDigitalMaturity:3.1});
 assert.equal(action.title,'Kiezen: investeren in dit onderdeel of het loslaten');
 assert.equal(action.dimension,'tech');
 assert.equal(action.durationWeeks,6);
 assert.equal(action.source,'Model BCG');
 assert.match(action.why,/2\.8 tegen 3\.1/);
 assert.match(action.why,/vraagteken/i);
 assert.equal(buildBcgAction({growth:1.2,companyMaturity:2.8,industryDigitalMaturity:3.1}),null);
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
