import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOwnerOperatingModel,ownerCategory,OWNER_AREAS} from '../portal-v2/owner-operating-model.js';
import {renderOwnerOperatingHtml} from '../portal-v2/owner-operating-system.js';

const NOW=Date.parse('2026-10-15T12:00:00.000Z');
const tenant='tenant-a';
const evidence=(id,more={})=>({
 id,tenant_id:tenant,entity_type:'business-signal',source_refs:['crm:42'],provenance:'crm-snapshot',
 freshness_at:'2026-10-15T11:00:00.000Z',confidence:.9,model_or_formula_version:'rule:1',
 observed_at:'2026-10-15T11:00:00.000Z',updated_at:'2026-10-15T11:00:00.000Z',
 title:id,...more
});
const state=executive=>({tenant_id:tenant,powerhouse:{tenant_id:tenant,executive}});
test('fresh state without authenticated tenant evidence has no financial or action claims',()=>{
 const m=buildOwnerOperatingModel({});
 assert.equal(m.ready,false);assert.equal(m.counts.besluiten,0);
 assert.deepEqual(m.finance,{revenue:null,cash30Days:null,margin:null});
 assert.equal(m.autonomousExecutionVerified,false);
 const markup=renderOwnerOperatingHtml({});
 assert.match(markup,/Geen geauthenticeerde bedrijfsprojectie/);
 assert.doesNotMatch(markup,/€ 184\.200/);
});
test('filters stale, low-confidence and cross-tenant items before showing opportunities',()=>{
 const m=buildOwnerOperatingModel(state({
  opportunities:[
   evidence('klantgroei', {domain:'sales'}),
   evidence('ander', {tenant_id:'tenant-b'}),
   evidence('oud', {freshness_at:'2026-10-01T11:00:00.000Z'}),
   evidence('zwak', {confidence:.2}),
   evidence('geen-bron', {source_refs:[]})
  ],risks:[],next_best_actions:[],outcomes:[],changes:[],forecasts:[]
 }),{now:NOW});
 assert.equal(m.counts.kansen,1);
 assert.equal(m.opportunities[0].title,'klantgroei');
 assert.equal(m.categories.groei.length,1);
});
test('external financial or customer-facing actions always need approval and are not executed',()=>{
 const m=buildOwnerOperatingModel(state({
  next_best_actions:[
   evidence('offerte-uitsturen',{external:true,customer_facing:true,financial:true,decision_required:true}),
   evidence('interne-analyse',{internal:true,reversible:true,identity_verified:true,permission_verified:true}),
   evidence('ongeautoriseerde-analyse',{internal:true,reversible:true}),
   evidence('read-only-zonder-proof',{})
  ],opportunities:[],risks:[],outcomes:[],changes:[],forecasts:[]
 }),{now:NOW});
 assert.equal(m.counts.acties,4);
 assert.equal(m.actions[0].ownerSafety.level,'goedkeuring');
 assert.equal(m.actions[1].ownerSafety.level,'binnen-beleid');
 assert.equal(m.actions[2].ownerSafety.level,'niet-uitvoerbaar');
 assert.equal(m.actions[3].ownerSafety.level,'inzage');
 assert.equal(m.autonomousExecutionVerified,false);
});
test('only verified outcomes with traceable evidence count',()=>{
 const m=buildOwnerOperatingModel(state({
  next_best_actions:[],risks:[],opportunities:[],forecasts:[],changes:[],
  outcomes:[evidence('gerealiseerd',{verification_status:'VERIFIED'}),evidence('verwacht',{verification_status:'ESTIMATED'}),evidence('geen-bron',{verification_status:'VERIFIED',source_refs:[]})]
 }),{now:NOW});
 assert.equal(m.counts.uitkomsten,1);
});
test('all five owner areas are present; executable controls are explicit and escaped',()=>{
 assert.deepEqual(OWNER_AREAS.map(x=>x.id),['bedrijf','kansen','acties','adviseur','instellingen']);
 assert.equal(ownerCategory({domain:'cashflow'}),'finance');
 const html=renderOwnerOperatingHtml(state({
  next_best_actions:[],risks:[],opportunities:[evidence('xss',{title:'<img src=x onerror=alert(1)>'})],forecasts:[],outcomes:[],changes:[]
 }),{now:NOW});
 assert.equal((html.match(/role="tab"/g)||[]).length,5);
 assert.match(html,/Mijn adviseur/);
 assert.match(html,/data-owner-route="ai-modelkeuze"/);
 assert.doesNotMatch(html,/<img src=x onerror/);
 assert.match(html,/&lt;img src=x/);
});
