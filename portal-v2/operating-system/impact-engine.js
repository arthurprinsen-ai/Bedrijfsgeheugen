import {valueKind} from './contracts.js';

export const IMPACT_FORMULA_VERSION='impact-v1';
const VALUE_FIELDS=['revenue_upside','gross_margin_effect','cost_capacity_reduction','fte_capacity_released','risk_exposure_reduced','compliance_impact','cash_flow_effect','required_investment','recurring_cost'];
const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number(value)||0));
function normalizeValue(value){if(value==null)return null;const kind=valueKind(value);const amount=Number(value.amount);if(!Number.isFinite(amount))throw new Error('IMPACT_AMOUNT_INVALID');return Object.freeze({kind,amount,source_refs:Object.freeze([...(value.source_refs||[])])});}

export function calculatePaybackMonths({required_investment=0,annual_benefit=0}={}){
 const investment=Math.max(0,Number(required_investment)||0),benefit=Math.max(0,Number(annual_benefit)||0);
 if(investment===0)return 0;if(benefit===0)return null;return Number((investment/(benefit/12)).toFixed(1));
}

export function normalizeImpact(input={}){
 const out={formula_version:IMPACT_FORMULA_VERSION,confidence:Math.min(1,Math.max(0,Number(input.confidence)||0)),evidence_quality:clamp(input.evidence_quality)};
 for(const field of VALUE_FIELDS)out[field]=normalizeValue(input[field]);
 out.implementation_effort=clamp(input.implementation_effort);
 out.time_to_value_days=Math.max(0,Number(input.time_to_value_days)||0);
 const investment=out.required_investment?.amount||0;
 const annualBenefit=(out.revenue_upside?.amount||0)+(out.cost_capacity_reduction?.amount||0)+(out.gross_margin_effect?.amount||0);
 out.payback_months=calculatePaybackMonths({required_investment:investment,annual_benefit:annualBenefit});
 return Object.freeze(out);
}

export function rankImpact(input={}){
 const components=Object.freeze({
  impact:clamp(input.impact),urgency:clamp(input.urgency),strategic_fit:clamp(input.strategic_fit),confidence:clamp((Number(input.confidence)||0)*100),
  effort:100-clamp(input.effort),reversibility:clamp(input.reversibility),dependency_risk:100-clamp(input.dependency_risk),time_to_value:clamp(input.time_to_value)
 });
 const weights={impact:.26,urgency:.15,strategic_fit:.17,confidence:.14,effort:.1,reversibility:.05,dependency_risk:.06,time_to_value:.07};
 const score=Object.entries(components).reduce((sum,[key,value])=>sum+value*weights[key],0);
 return Object.freeze({score:Number(score.toFixed(1)),version:IMPACT_FORMULA_VERSION,components});
}
