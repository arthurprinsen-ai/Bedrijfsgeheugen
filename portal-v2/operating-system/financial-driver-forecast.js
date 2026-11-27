// Same authenticated Portal V2 decision model. This is a pure MODEL, never
// an autonomous action writer, provider receipt or realized financial outcome.
// Every observed driver and every scenario hypothesis has its own source refs.
export const FINANCIAL_DRIVER_MODEL_VERSION='financial-drivers-tdabc-lean-throughput-v1';
const clean=v=>typeof v==='string'?v.trim():'';
const refs=o=>Array.isArray(o?.source_refs)?[...new Set(o.source_refs.map(clean).filter(Boolean))]:[];
const finite=v=>v===null||v===undefined||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v);
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
const percentKeys=['cash_capture_fraction','adoption_fraction'];
const numeric=(item,{min=0,max=1e9,integer=false}={})=>{
 const n=finite(item?.value);
 return refs(item).length&&n!==null&&n>=min&&n<=max&&(!integer||Number.isInteger(n))?n:null;
};
const unique=items=>[...new Set(items.flatMap(refs))];
const rows=['no_action','downside','base','upside'];
const missing=(reason)=>Object.freeze({status:'EVIDENCE_DUE',reason,modelVersion:FINANCIAL_DRIVER_MODEL_VERSION,scenarios:Object.freeze([])});

/**
 * Source-backed, 4-way incremental cash-economics forecast for ONE existing
 * tenant action. All costs and quantities are scoped to the same period.
 * Time released is not an earned saving: only the separately sourced fraction
 * actually recoverable as cash contributes to the modeled financial value.
 * No customer action is closed or measured here.
 *
 * Input: action.financial_model_inputs, with healthy source envelope, exact
 * action/tenant/baseline/period, 12-month or bounded horizon, sourced
 * unit-economics driver objects {value,source_refs}, four sourced hypotheses,
 * versioned model citations. No defaults for financial amounts or scenarios.
 */
export function deriveSourceBoundFinancialForecast(action={}){
 const f=action?.financial_model_inputs;
 if(!f||f.evidence_health?.status!=='healthy'||!refs(f).length)return null;
 const actionId=clean(action.id),tenant=clean(action.tenant_id||action.tenantId);
 if(!actionId||!tenant||clean(f.action_id)!==actionId||clean(f.tenant_id)!==tenant)return missing('ACTION_TENANT_SOURCE_MISMATCH');
 const baseline=clean(f.baseline_id),period=clean(f.period_id);
 if(!baseline||!period||!clean(f.source_revision)||!clean(f.model_version)
    ||(clean(action.baseline_id||action.baseline_ref)&&baseline!==clean(action.baseline_id||action.baseline_ref)))
  return missing('BASELINE_OR_SOURCE_REVISION_DUE');
 if(clean(f.unit).toUpperCase()!=='EUR'
    ||!['NET_SAVINGS_EUR','NET_ECONOMIC_VALUE_EUR'].includes(clean(f.metric_id)))
  return missing('FINANCIAL_METRIC_DUE');
 const months=numeric(f.horizon_months,{min:1,max:60,integer:true});
 if(months===null)return missing('HORIZON_EVIDENCE_DUE');
 const d=f.drivers||{};
 const names=['cases_per_month','baseline_minutes_per_case','hourly_loaded_cost_eur',
  'rework_cases_per_month','rework_cost_eur_per_case','unit_contribution_margin_eur',
  'one_time_implementation_cost_eur','monthly_operating_cost_eur','cash_capture_fraction',
  'rework_cash_capture_fraction'];
 const values=Object.fromEntries(names.map(name=>[name,numeric(d[name],{max:1e8})]));
 if(names.some(name=>values[name]===null))return missing('DRIVER_SOURCE_OR_COST_EVIDENCE_DUE');
 if(values.cash_capture_fraction>1||values.rework_cash_capture_fraction>1)
  return missing('CASH_CAPTURE_SHARE_INVALID');
 const accounting=f.accounting_policy||{};
 if(accounting.rework_disjoint_from_process_labor!==true||!refs(accounting).length)
  return missing('REWORK_DOUBLE_COUNT_CONTROL_DUE');
 const modelCatalog=Array.isArray(f.models)?f.models:[];
 const models=modelCatalog.filter(m=>clean(m?.name)&&clean(m?.version)&&refs(m).length)
  .slice(0,8).map(m=>Object.freeze({name:clean(m.name),version:clean(m.version),source_refs:refs(m)}));
 if(!models.length||models.length!==modelCatalog.length)return missing('MODEL_SOURCE_VERSION_DUE');
 const candidates=Array.isArray(f.scenarios)?f.scenarios:[];
 if(candidates.length!==4)return missing('FOUR_SCENARIOS_REQUIRED');
 const scenarios=[];
 const usedCaseRefs=[];
 for(const id of rows){
  const matches=candidates.filter(s=>clean(s?.case).toLowerCase()===id);
  if(matches.length!==1||!refs(matches[0]).length)return missing('SCENARIO_SOURCE_MISSING');
  const s=matches[0];
  const saved=numeric(s.minutes_saved_per_case,{max:values.baseline_minutes_per_case});
  const avoid=numeric(s.rework_cases_avoided_per_month,{max:values.rework_cases_per_month});
  const units=numeric(s.extra_units_per_month,{max:1e8});
  const adoption=numeric(s.adoption_fraction,{max:1});
  if([saved,avoid,units,adoption].some(v=>v===null))return missing('SCENARIO_QUANTITY_EVIDENCE_DUE');
  if(clean(f.metric_id)==='NET_SAVINGS_EUR'&&units>0)return missing('MARGIN_VALUE_CANNOT_BE_CLASSIFIED_AS_SAVINGS');
  if(id==='no_action'&&(saved!==0||avoid!==0||units!==0||adoption!==0))
    return missing('NO_ACTION_COUNTERFACTUAL_INVALID');
  const capacityHours=values.cases_per_month*saved/60*months*adoption;
  const capturedLabour=capacityHours*values.hourly_loaded_cost_eur*values.cash_capture_fraction;
  if(units>0&&(!Array.isArray(f.throughput_proof?.demand_source_refs)
    ||!f.throughput_proof.demand_source_refs.some(clean)
    ||!Array.isArray(f.throughput_proof?.constraint_source_refs)
    ||!f.throughput_proof.constraint_source_refs.some(clean)))
    return missing('CONSTRAINT_AND_DEMAND_PROOF_DUE');
  const avoidedRework=avoid*values.rework_cost_eur_per_case*months*adoption*values.rework_cash_capture_fraction;
  const incrementalContribution=units*values.unit_contribution_margin_eur*months*adoption;
  const gross=capturedLabour+avoidedRework+incrementalContribution;
  const cost=id==='no_action'?0:values.one_time_implementation_cost_eur+values.monthly_operating_cost_eur*months;
  const net=round(gross-cost);
  if(!Number.isSafeInteger(Math.round(net*100))||Math.abs(net)>1e12)return missing('FORECAST_OVERFLOW');
  scenarios.push(Object.freeze({
   case:id,net_value_eur:net,gross_value_eur:round(gross),implementation_and_operating_cost_eur:round(cost),
   capacity_hours_released:round(capacityHours),captured_labor_eur:round(capturedLabour),
   expected_avoided_rework_eur:round(avoidedRework),expected_incremental_margin_eur:round(incrementalContribution),
   kind:'HYPOTHESIS_NOT_REALIZATION',source_refs:refs(s)
  }));
  usedCaseRefs.push(s);
 }
 const driverAssumptions=names.map(name=>Object.freeze({
  name,value:String(values[name]),unit:name.endsWith('_eur')||name.includes('_eur_')?'EUR':
    percentKeys.includes(name)?'ratio':name.includes('minutes')?'min':'count',
  source_refs:refs(d[name])
 }));
 const frictions=[
  {name:'Implementatiekosten',cost_eur:values.one_time_implementation_cost_eur,
   source_refs:refs(d.one_time_implementation_cost_eur)},
  {name:'Terugkerende exploitatiekosten',cost_eur:round(values.monthly_operating_cost_eur*months),
   source_refs:refs(d.monthly_operating_cost_eur)},
  {name:'Niet cashbaar inzetbare tijd',cost_eur:null,
   source_refs:refs(d.cash_capture_fraction)}
 ];
 const sourceRefs=unique([f,...names.map(n=>d[n]),accounting,...modelCatalog,...usedCaseRefs]);
 if(Array.isArray(f.throughput_proof?.demand_source_refs))
  sourceRefs.push(...f.throughput_proof.demand_source_refs.map(clean).filter(Boolean));
 if(Array.isArray(f.throughput_proof?.constraint_source_refs))
  sourceRefs.push(...f.throughput_proof.constraint_source_refs.map(clean).filter(Boolean));
 return Object.freeze({
  status:'MODELLED_NOT_REALIZED',evidence_health:Object.freeze({status:'healthy'}),
  source_refs:Object.freeze(sourceRefs),model_version:clean(f.model_version),
  metric_id:clean(f.metric_id),baseline_id:baseline,period_id:period,unit:'EUR',
  models:Object.freeze(models),assumptions:Object.freeze(driverAssumptions),
  frictions:Object.freeze(frictions.map(x=>Object.freeze(x))),
  scenarios:Object.freeze(scenarios),source_revision:clean(f.source_revision),
  restrictions:Object.freeze({
   capacityIsNotCash:true,cashRecoveryRequiresExplicitEvidence:true,
   revenueIsNotSaving:true,noActionCounterfactual:true,independentActualDue:true,
   notAnActionReceipt:true,notAnActionClosure:true
  })
 });
}
