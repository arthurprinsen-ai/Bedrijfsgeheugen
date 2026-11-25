
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCustomerValueBriefing,buildFinancialDecisionDossier,customerValueBriefingMarkup} from '../portal-v2/operating-system/customer-value-briefing.js';
const refs=['erp:verified:1'];
const trusted={status:'healthy'};
const forecast=()=>({
 evidence_health:trusted,source_refs:refs,unit:'EUR',model_version:'ops-finance-v2',
 metric_id:'NET_SAVINGS_EUR',baseline_id:'baseline-a',period_id:'2026-Q4',
 models:[{name:'Theory of Constraints',version:'1',source_refs:refs},{name:'Unit economics',version:'2',source_refs:refs}],
 assumptions:[{name:'Uurkosten',value:'60',unit:'EUR/u',source_refs:refs}],
 frictions:[{name:'Inwerktijd',cost_eur:30,source_refs:refs}],
 scenarios:[{case:'no_action',net_value_eur:0,source_refs:refs},{case:'downside',net_value_eur:40,source_refs:refs},
 {case:'base',net_value_eur:100,source_refs:refs},{case:'upside',net_value_eur:170,source_refs:refs}]
});
const action=(changes={})=>({
 id:'action-a',tenant_id:'tenant-a',title:'Verlaag procesverlies',problem_id:'PH-P123',
 status:'EXECUTION_VERIFIED',source_refs:refs,evidence_health:trusted,
 baseline_id:'baseline-a',expected_impact:{kind:'forecast',unit:'EUR',amount:100},
 financial_forecast:forecast(),execution_proof:{status:'INDEPENDENTLY_VERIFIED',independent_readback:true,
 action_id:'action-a',tenant_id:'tenant-a',baseline_id:'baseline-a',provider_receipt_id:'erp:write:1',source_refs:refs},
 ...changes
});
const outcome=(changes={})=>({
 action_id:'action-a',tenant_id:'tenant-a',status:'OUTCOME_VERIFIED',
 evidence_health:trusted,source_refs:refs,learning_verified:true,learning_evidence_refs:['brain:lesson:1'],next_decision_id:'decision-next-1',
 realized:{amount:120,unit:'EUR',metric_id:'NET_SAVINGS_EUR',baseline_id:'baseline-a',period_id:'2026-Q4'},
 financial_measurement:{action_id:'action-a',baseline_id:'baseline-a',period_id:'2026-Q4',
 comparator:'NO_ACTION',method_version:'matched-baseline-v1',gross_savings_eur:150,
 implementation_cost_eur:20,operating_cost_eur:10,source_refs:refs},...changes
});
const model=(a=action(),o=outcome())=>({
 available:true,next_best_actions:[a],outcomes:[o],problems:[
 {problem_id:'PH-P123',title:'Frictie bij overdracht',source_refs:refs,evidence_health:trusted}]
});
test('finance projects four fully sourced cases, theory, friction and verified net value without new engine',()=>{
 const b=buildCustomerValueBriefing(model());
 assert.equal(b.finance.forecast.status,'MODELLED_NOT_REALIZED');
 assert.deepEqual(b.finance.forecast.scenarios.map(x=>x.amount),[0,40,100,170]);
 assert.equal(b.finance.savings?.net,120);
 assert.equal(b.finance.forecastVsActual,20);
 assert.equal(b.finance.closingEligible,true);
 const html=customerValueBriefingMarkup(model());
 for(const v of ['Niets doen','Tegenvaller','Verwacht','Meevaller','Theory of Constraints','Uurkosten','Inwerktijd','Werkelijk netto bespaard','Actie afsluiten'])
  assert.match(html,new RegExp(v));
 assert.match(html,/data-financial-closure="review-ready"/);
 assert.match(html,/bestaande ONE BRAIN-actieautoriteit/);
});
test('missing or contradictory independent execution is not savings and cannot close an action',()=>{
 for(const execution_proof of [
 null,{status:'INDEPENDENTLY_VERIFIED',source_refs:refs},
 {...action().execution_proof,tenant_id:'tenant-b'},
 {...action().execution_proof,baseline_id:'other'}
 ]){
  const f=buildCustomerValueBriefing(model(action({execution_proof}))).finance;
  assert.equal(f.savings,null);
  assert.equal(f.closingEligible,false);
 }
 for(const financial_measurement of [
 null,{...outcome().financial_measurement,operating_cost_eur:null},
 {...outcome().financial_measurement,comparator:'BEFORE_ONLY'},
 {...outcome().financial_measurement,implementation_cost_eur:0},
 {...outcome().financial_measurement,source_refs:[]},
 {...outcome().financial_measurement,baseline_id:'other'}
 ]){
  assert.equal(buildCustomerValueBriefing(model(action(),outcome({financial_measurement}))).finance.savings,null);
 }
});
test('missing source, models, assumptions, case or baseline never synthesize low/medium/high',()=>{
 const orig=forecast();
 const invalid=[
 null,{...orig,source_refs:[]},{...orig,models:[]},{...orig,assumptions:[]},
 {...orig,baseline_id:'other'},
 {...orig,scenarios:orig.scenarios.slice(1)},
 {...orig,scenarios:[{...orig.scenarios[0],source_refs:[]},...orig.scenarios.slice(1)]},
 {...orig,scenarios:[{...orig.scenarios[0],net_value_eur:null},...orig.scenarios.slice(1)]}
 ];
 for(const financial_forecast of invalid){
  const f=buildCustomerValueBriefing(model(action({financial_forecast}))).finance;
  assert.equal(f.forecast.status,'EVIDENCE_DUE');
  assert.equal(f.forecastVsActual,null);
 }
 assert.match(customerValueBriefingMarkup(model(action({financial_forecast:null}),outcome({financial_measurement:null}))),/geen fictieve prognoses/i);
});
test('wrong metric, period, baseline, tenant or absent learning block financial comparison or closure',()=>{
 const mismatched=[
 outcome({realized:{...outcome().realized,metric_id:'revenue_eur'}}),
 outcome({realized:{...outcome().realized,period_id:'2026-Q3'}}),
 outcome({tenant_id:'tenant-b'})
 ];
 for(const other of mismatched){
  const f=buildCustomerValueBriefing(model(action(),other)).finance;
  assert.equal(f.forecastVsActual,null);
  assert.equal(f.comparable,false);
  assert.equal(f.closingEligible,false);
 }
 assert.equal(buildCustomerValueBriefing(model(action(),outcome({learning_verified:false}))).finance.closingEligible,false);
});
test('HTML is escaped, old portal navigation kept and absent impact no longer shows invented zero',async()=>{
 const f=forecast();f.models=[{name:'<img src=x onerror=alert(1)>',version:'1',source_refs:refs}];
 const html=customerValueBriefingMarkup(model(action({financial_forecast:f})));
 assert.doesNotMatch(html,/<img\b/);
 assert.match(html,/&lt;img/);
 assert.match(html,/data-os-page="next-best-actions"/);
 const src=await readFile(new URL('../portal-v2/operating-system/customer-value-briefing.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage|supabase\.from/);
 const ui=await readFile(new URL('../portal-v2/operating-system/operating-system-ui.js',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/impact\.revenue_upside\?\.amount\|\|impact\.cost_capacity_reduction\?\.amount\|\|0/);
 assert.match(ui,/Nog niet gekwantificeerd/);
 assert.equal(buildFinancialDecisionDossier(action({execution_proof:null}),null).closingEligible,false);
});
