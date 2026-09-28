import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-foresight-autonomy.json','utf8'));
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(Number(v))?Number(v):min));
const arr=v=>Array.isArray(v)?v:[];

export function brierScore(probability,outcome){
  const p=clamp(probability);
  const y=outcome===true||Number(outcome)===1?1:0;
  return (p-y)**2;
}

export function calibrationBand(rows=[]){
  const xs=arr(rows).filter(r=>Number.isFinite(Number(r.probability))&&(r.outcome===true||r.outcome===false||r.outcome===0||r.outcome===1));
  if(!xs.length) return {n:0,mean_probability:null,event_rate:null,brier:null,calibration_error:null};
  const meanP=xs.reduce((s,r)=>s+clamp(r.probability),0)/xs.length;
  const eventRate=xs.reduce((s,r)=>s+((r.outcome===true||Number(r.outcome)===1)?1:0),0)/xs.length;
  const brier=xs.reduce((s,r)=>s+brierScore(r.probability,r.outcome),0)/xs.length;
  return {
    n:xs.length,
    mean_probability:Number(meanP.toFixed(4)),
    event_rate:Number(eventRate.toFixed(4)),
    brier:Number(brier.toFixed(4)),
    calibration_error:Number(Math.abs(meanP-eventRate).toFixed(4))
  };
}

export function scoreForecast({baseline, benchmark, drivers=[], confidence=0.5, horizon='90d'}={}){
  const b=Number(baseline), bm=Number(benchmark);
  const valid=Number.isFinite(b)&&Number.isFinite(bm);
  const weighted=arr(drivers).filter(d=>Number.isFinite(d?.impact)&&Number.isFinite(d?.weight))
    .reduce((s,d)=>s+(Number(d.impact)*Number(d.weight)),0);
  const expected=valid?b+weighted:null;
  const gap=valid?bm-b:null;
  const c=clamp(confidence);
  const spread=expected===null?null:Math.max(Math.abs(expected)*0.05,Math.abs(weighted)*(1-c));
  return {
    horizon,baseline:valid?b:null,benchmark:valid?bm:null,benchmark_gap:gap,
    expected_path:expected,
    downside_case:expected===null?null:expected-spread,
    upside_case:expected===null?null:expected+spread,
    confidence:c,
    uncertainty:expected===null?'unknown':c>=0.8?'low':c>=0.55?'medium':'high',
    prediction_is_not_fact:true
  };
}

export function buildScenarioEnsemble({baseProbability=.5,signals=[],historicalCalibration=null}={}){
  const xs=arr(signals).filter(s=>Number.isFinite(Number(s.strength)));
  const signed=xs.reduce((sum,s)=>{
    const dir=['falling','breaking_negative','down'].includes(String(s.direction))?-1:1;
    return sum+dir*clamp(s.strength)*clamp(s.reliability??s.confidence??0.5);
  },0);
  const norm=xs.length?signed/xs.length:0;
  const cal=historicalCalibration&&Number.isFinite(Number(historicalCalibration.event_rate))
    ?Number(historicalCalibration.event_rate):null;
  const raw=clamp(clamp(baseProbability)*0.55+clamp((norm+1)/2)*0.30+(cal??clamp(baseProbability))*0.15);
  const uncertainty=clamp(1-Math.min(1,xs.length/8))*0.6+(historicalCalibration?.n>=10?0:0.4);
  return {
    probability:Number(raw.toFixed(4)),
    downside_probability:Number(clamp(raw-0.15*uncertainty).toFixed(4)),
    upside_probability:Number(clamp(raw+0.15*uncertainty).toFixed(4)),
    uncertainty:Number(clamp(uncertainty).toFixed(4)),
    signal_count:xs.length,
    method:'scenario_ensemble_v2'
  };
}

export function evaluateForecastSkill({calibrations=[],previousBrier=null,previousTimingMae=null}={}){
  const xs=arr(calibrations).filter(r=>Number.isFinite(Number(r.probability))&&(r.outcome===true||r.outcome===false||r.outcome===0||r.outcome===1));
  const band=calibrationBand(xs);
  const timing=xs.filter(r=>Number.isFinite(Number(r.timing_error_days)));
  const timingMae=timing.length?timing.reduce((s,r)=>s+Math.abs(Number(r.timing_error_days)),0)/timing.length:null;
  const brierImprovement=previousBrier==null||band.brier==null?null:Number(previousBrier)-band.brier;
  const timingImprovement=previousTimingMae==null||timingMae==null?null:Number(previousTimingMae)-timingMae;
  const enough=xs.length>=20;
  return {
    resolved_forecasts:xs.length,
    brier:band.brier,
    calibration_error:band.calibration_error,
    timing_mae_days:timingMae==null?null:Number(timingMae.toFixed(3)),
    brier_improvement:brierImprovement==null?null:Number(brierImprovement.toFixed(4)),
    timing_improvement_days:timingImprovement==null?null:Number(timingImprovement.toFixed(3)),
    evidence_sufficient:enough,
    status:!enough?'LEARN_MORE':((brierImprovement??0)>0||(timingImprovement??0)>0)?'IMPROVING':'NOT_YET_IMPROVING'
  };
}

export function recommendForecastImprovement({skill,coverage=0,signalDiversity=0}={}){
  const actions=[];
  if((skill?.resolved_forecasts??0)<20) actions.push('increase_resolution_coverage');
  if(Number(coverage)<0.8) actions.push('resolve_due_forecasts_and_capture_outcomes');
  if(Number(signalDiversity)<0.6) actions.push('broaden_independent_signal_sources');
  if(skill?.calibration_error!=null&&skill.calibration_error>0.12) actions.push('recalibrate_probability_mapping');
  if(skill?.timing_mae_days!=null&&skill.timing_mae_days>7) actions.push('retrain_horizon_and_lead_time_estimation');
  if(skill?.brier!=null&&skill.brier>0.20) actions.push('challenge_current_forecast_method');
  return {
    actions,
    auto_experiment_allowed:actions.length>0,
    direct_production_self_rewrite:false,
    promotion_requires:['historical_backtest','shadow_or_canary','brier_non_regression','timing_non_regression','security_and_data_quality']
  };
}

export function buildForesightPacket(input={}){
  const forecasts=arr(input.metrics).map(m=>({
    id:m.id,...scoreForecast(m),
    freshness:m.freshness??'unknown',provenance:m.provenance??[],
    leading_indicators:m.leading_indicators??[],recommended_actions:m.recommended_actions??[]
  }));
  return {
    fingerprint:contract.version,
    observed_at:input.observed_at||new Date().toISOString(),
    source_sha:input.source_sha??null,
    systems:contract.control_plane.systems,
    forecasts,
    forecast_learning:{
      metric_priority:['brier_score','calibration_error','timing_mae_days','resolution_coverage','signal_diversity'],
      prediction_is_not_fact:true,
      auto_improvement_policy:'generate_challenger_backtest_shadow_canary_then_promote'
    },
    experiment_policy:contract.experimentation,
    security_policy:contract.security,
    status:'READY_FOR_EVIDENCE_DRIVEN_FORESIGHT'
  };
}

if(import.meta.url===`file://${process.argv[1]}`) process.stdout.write(JSON.stringify(buildForesightPacket(),null,2)+'\n');
