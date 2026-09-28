import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  brierScore,calibrationBand,scoreForecast,buildScenarioEnsemble,
  evaluateForecastSkill,recommendForecastImprovement,buildForesightPacket
} from '../scripts/brain/foresight-autonomy.mjs';
import {buildCustomerForesightView} from '../portal-v2/foresight-intelligence.js';

test('foresight v2 requires calibrated prediction learning',()=>{
  const c=JSON.parse(fs.readFileSync('config/powerhouse-foresight-autonomy.json','utf8'));
  assert.equal(c.version,'powerhouse-foresight-autonomy-v2');
  assert.equal(c.prediction.backtest_required,true);
  assert.equal(c.prediction.calibration_required,true);
  assert.equal(c.prediction.forecast_resolution_required,true);
  assert.equal(c.prediction.direct_self_rewrite_forbidden,true);
  assert.ok(c.prediction.quality_metrics.includes('brier_score'));
});

test('brier and calibration are measurable',()=>{
  assert.equal(brierScore(.8,true),.04);
  const c=calibrationBand([{probability:.8,outcome:true},{probability:.2,outcome:false}]);
  assert.equal(c.n,2);
  assert.ok(c.brier<.1);
  assert.equal(c.event_rate,.5);
});

test('scenario ensemble preserves uncertainty',()=>{
  const x=buildScenarioEnsemble({
    baseProbability:.5,
    signals:[
      {strength:.9,reliability:.9,direction:'rising'},
      {strength:.7,reliability:.8,direction:'rising'}
    ],
    historicalCalibration:{n:25,event_rate:.65}
  });
  assert.ok(x.probability>.5);
  assert.ok(x.upside_probability>=x.probability);
  assert.ok(x.downside_probability<=x.probability);
  assert.equal(x.method,'scenario_ensemble_v2');
});

test('forecast skill remains fail closed with little evidence',()=>{
  const skill=evaluateForecastSkill({
    calibrations:[{probability:.8,outcome:true,timing_error_days:3}]
  });
  assert.equal(skill.evidence_sufficient,false);
  assert.equal(skill.status,'LEARN_MORE');
});

test('degraded prediction quality creates bounded improvement actions',()=>{
  const rec=recommendForecastImprovement({
    skill:{resolved_forecasts:3,brier:.3,calibration_error:.2,timing_mae_days:10},
    coverage:.1,signalDiversity:.3
  });
  assert.ok(rec.actions.includes('increase_resolution_coverage'));
  assert.ok(rec.actions.includes('recalibrate_probability_mapping'));
  assert.ok(rec.actions.includes('retrain_horizon_and_lead_time_estimation'));
  assert.equal(rec.direct_production_self_rewrite,false);
});

test('portal packet keeps scenarios, provenance and prediction caveat',()=>{
  const packet=buildForesightPacket({
    observed_at:'2026-09-28T18:00:00Z',
    metrics:[{id:'margin',baseline:10,benchmark:14,drivers:[{impact:4,weight:.5}],confidence:.8,provenance:['benchmark:x']}]
  });
  const view=buildCustomerForesightView(packet);
  assert.equal(view.forecasts.length,1);
  assert.match(view.forecasts[0].caveat,/geen zekerheid/);
  assert.deepEqual(view.forecasts[0].provenance,['benchmark:x']);
});
