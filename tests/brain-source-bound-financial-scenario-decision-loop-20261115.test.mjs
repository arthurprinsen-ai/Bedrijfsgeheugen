import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveSourceBoundFinancialForecast,FINANCIAL_DRIVER_MODEL_VERSION} from '../portal-v2/operating-system/financial-driver-forecast.js';
import {buildCustomerValueBriefing,customerValueBriefingMarkup} from '../portal-v2/operating-system/customer-value-briefing.js';

const ref=['erp:source:v1'];
const evidence=value=>({value,source_refs:ref});
const scenarios=()=>[
 {case:'no_action',minutes_saved_per_case:evidence(0),rework_cases_avoided_per_month:evidence(0),
  extra_units_per_month:evidence(0),adoption_fraction:evidence(0),source_refs:ref},
 {case:'downside',minutes_saved_per_case:evidence(5),rework_cases_avoided_per_month:evidence(2),
  extra_units_per_month:evidence(0),adoption_fraction:evidence(0.5),source_refs:ref},
 {case:'base',minutes_saved_per_case:evidence(10),rework_cases_avoided_per_month:evidence(5),
  extra_units_per_month:evidence(0),adoption_fraction:evidence(1),source_refs:ref},
 {case:'upside',minutes_saved_per_case:evidence(20),rework_cases_avoided_per_month:evidence(8),
  extra_units_per_month:evidence(0),adoption_fraction:evidence(1),source_refs:ref}
];
const inputs=()=>({
 evidence_health:{status:'healthy'},source_refs:ref,source_revision:'source-v1',action_id:'action-1',
 tenant_id:'tenant-a',baseline_id:'baseline-v1',period_id:'2027-01-to-12',model_version:'tdabc-lean-v1',
 metric_id:'NET_SAVINGS_EUR',unit:'EUR',horizon_months:evidence(12),
 drivers:{
  cases_per_month:evidence(100),baseline_minutes_per_case:evidence(60),
  hourly_loaded_cost_eur:evidence(60),rework_cases_per_month:evidence(20),
  rework_cost_eur_per_case:evidence(30),unit_contribution_margin_eur:evidence(0),
  one_time_implementation_cost_eur:evidence(1000),monthly_operating_cost_eur:evidence(100),
  cash_capture_fraction:evidence(0.5),rework_cash_capture_fraction:evidence(1)
 },
 accounting_policy:{rework_disjoint_from_process_labor:true,source_refs:ref},
 throughput_proof:{demand_source_refs:ref,constraint_source_refs:ref},
 models:[{name:'Time-Driven Activity-Based Costing',version:'v1',source_refs:ref},
  {name:'Lean process rework',version:'v1',source_refs:ref}],
 scenarios:scenarios()
});
const action=(change={})=>({
 id:'action-1',tenant_id:'tenant-a',baseline_id:'baseline-v1',title:'Reduceer overdrachtsfrictie',
 status:'PROPOSED',problem_id:'PH-P123',source_refs:ref,evidence_health:{status:'healthy'},
 financial_model_inputs:inputs(),...change
});
const model=(a=action())=>({available:true,next_best_actions:[a],problems:[
 {problem_id:'PH-P123',title:'Doorlooptijdverlies',source_refs:ref,evidence_health:{status:'healthy'}}
 ],outcomes:[]});

test('sourced TDABC and Lean assumptions derive four incremental scenarios, not actual money',()=>{
 const result=deriveSourceBoundFinancialForecast(action());
 assert.equal(result.status,'MODELLED_NOT_REALIZED');
 assert.equal(result.model_version,'tdabc-lean-v1');
 assert.deepEqual(result.scenarios.map(x=>x.case),['no_action','downside','base','upside']);
 assert.deepEqual(result.scenarios.map(x=>x.net_value_eur),[0,-340,5600,12680]);
 assert.equal(result.scenarios[2].capacity_hours_released,200);
 assert.equal(result.scenarios[2].captured_labor_eur,6000);
 assert.equal(result.scenarios[2].expected_avoided_rework_eur,1800);
 assert.equal(result.restrictions.capacityIsNotCash,true);
 assert.equal(result.restrictions.independentActualDue,true);
 assert.ok(result.source_refs.includes('erp:source:v1'));
});

test('same existing customer value dossier renders scenario forecast but never unearned outcome or close',()=>{
 const briefing=buildCustomerValueBriefing(model());
 assert.equal(briefing.available,true);
 assert.equal(briefing.finance.forecast.status,'MODELLED_NOT_REALIZED');
 assert.equal(briefing.finance.forecast.scenarios[2].amount,5600);
 assert.equal(briefing.finance.savings,null);
 assert.equal(briefing.finance.closingEligible,false);
 assert.equal(briefing.finance.forecastVsActual,null);
 const html=customerValueBriefingMarkup(model());
 assert.match(html,/Niets doen/);
 assert.match(html,/Tegenvaller/);
 assert.match(html,/Meevaller/);
 assert.match(html,/Time-Driven Activity-Based Costing/);
 assert.match(html,/Werkelijk netto bespaard/);
 assert.match(html,/nog niet bewezen/i);
});

test('no action always means incremental no intervention, never a phantom extra margin',()=>{
 const f=inputs();f.scenarios[0].minutes_saved_per_case=evidence(1);
 assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:f})).reason,'NO_ACTION_COUNTERFACTUAL_INVALID');
 const f2=inputs();f2.scenarios[2].extra_units_per_month=evidence(2);
 assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:f2})).reason,'MARGIN_VALUE_CANNOT_BE_CLASSIFIED_AS_SAVINGS');
 f2.metric_id='NET_ECONOMIC_VALUE_EUR';
 const economic=deriveSourceBoundFinancialForecast(action({financial_model_inputs:f2}));
 assert.equal(economic.status,'MODELLED_NOT_REALIZED');
 assert.equal(economic.metric_id,'NET_ECONOMIC_VALUE_EUR');
 assert.equal(economic.scenarios[2].expected_incremental_margin_eur,0);
});

test('tenant, baseline, revision, cost, uptake and source refs are mandatory',()=>{
 for(const f of [
 {...inputs(),tenant_id:'other'},
 {...inputs(),baseline_id:'other'},
 {...inputs(),source_revision:''},
 {...inputs(),horizon_months:null},
 {...inputs(),drivers:{...inputs().drivers,hourly_loaded_cost_eur:{value:60,source_refs:[]}}},
 {...inputs(),drivers:{...inputs().drivers,cash_capture_fraction:evidence(1.5)}},
 {...inputs(),drivers:{...inputs().drivers,rework_cash_capture_fraction:evidence(1.5)}},
 {...inputs(),accounting_policy:null},
 {...inputs(),throughput_proof:null,scenarios:scenarios().map((x,i)=>i===2?{...x,extra_units_per_month:evidence(1)}:x),metric_id:'NET_ECONOMIC_VALUE_EUR'},
 {...inputs(),scenarios:scenarios().slice(0,3)},
 {...inputs(),scenarios:scenarios().map((x,i)=>i===1?{...x,source_refs:[]}:x)},
 {...inputs(),models:[]}
 ]){
  assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:f})).status,'EVIDENCE_DUE');
 }
 assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:null})),null);
 assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:{...inputs(),evidence_health:{status:'stale'}}})),null);
});

test('no noncash capacity is claimed as actual savings and unsafe model HTML is escaped',()=>{
 const f=inputs();f.drivers.cash_capture_fraction=evidence(0);
 const out=deriveSourceBoundFinancialForecast(action({financial_model_inputs:f}));
 assert.equal(out.scenarios[2].captured_labor_eur,0);
 assert.equal(out.scenarios[2].capacity_hours_released,200);
 assert.equal(out.restrictions.capacityIsNotCash,true);
 const unsafe=inputs();unsafe.models[0].name='<SCRIPT>alert(1)</SCRIPT>';
 const html=customerValueBriefingMarkup(model(action({financial_model_inputs:unsafe})));
 assert.equal(html.includes('<SCRIPT>'),false);
 assert.match(html,/&lt;SCRIPT&gt;/);
 assert.equal(typeof FINANCIAL_DRIVER_MODEL_VERSION,'string');
});


test('without separately sourced cashable rework, estimated economic savings are not invented',()=>{
 const f=inputs();f.drivers.rework_cash_capture_fraction=evidence(0);
 const output=deriveSourceBoundFinancialForecast(action({financial_model_inputs:f}));
 assert.equal(output.scenarios[2].expected_avoided_rework_eur,0);
 assert.equal(output.scenarios[2].net_value_eur,3800);
 const noRef=inputs();noRef.drivers.rework_cash_capture_fraction={value:1,source_refs:[]};
 assert.equal(deriveSourceBoundFinancialForecast(action({financial_model_inputs:noRef})).status,'EVIDENCE_DUE');
});
