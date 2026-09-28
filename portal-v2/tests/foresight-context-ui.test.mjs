import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContextualForesightModel,FORESIGHT_CONTEXT_PAGES} from '../foresight-context-ui.js';

const state={
  portal:{
    business_context:{
      stage:'grow',
      goals:['revenue_growth'],
      goal_targets:{
        revenue_growth:{
          current_value:8,
          target_value:20,
          target_date:'2026-12-31T00:00:00Z',
          history:[
            {date:'2026-01-01',value:4},
            {date:'2026-04-01',value:6},
            {date:'2026-07-01',value:8},
            {date:'2026-09-01',value:10}
          ]
        }
      },
      goal_scenarios:{
        revenue_growth:{levers:{pricing:{effect:2,source_refs:['observed:pricing-test']}}}
      }
    },
    finance:{revenue_growth_pct:8}
  }
};

test('decision-relevant pages receive contextual foresight',()=>{
  for(const page of ['bedrijfssituatie','businesscase','roadmap','due-diligence','outcomes-evidence']) assert.ok(FORESIGHT_CONTEXT_PAGES.includes(page),page);
});

test('businesscase uses forecasts and what-if scenarios from the same company context',()=>{
  const model=buildContextualForesightModel('businesscase',state,null);
  assert.equal(model.forecasts.length,1);
  assert.equal(model.forecasts[0].goalId,'revenue_growth');
  assert.equal(model.forecasts[0].forecastStatus,'available');
  assert.equal(model.showScenario,true);
  assert.equal(model.scenarios.length,1);
});

test('trust pages expose prediction quality without fabricating customer forecasts',()=>{
  const quality={prediction_state:'CALIBRATION_DEGRADED',brier_score:.1092};
  const model=buildContextualForesightModel('trust-center',{},quality);
  assert.equal(model.showQuality,true);
  assert.equal(model.quality,quality);
  assert.equal(model.forecasts.length,0);
});


test('compound intelligence self-improvement is a visible contextual portal obligation',()=>{
  const ui=fs.readFileSync(new URL('../foresight-context-ui.js',import.meta.url),'utf8');
  const api=fs.readFileSync(new URL('../../netlify/functions/portal-prediction-intelligence.mjs',import.meta.url),'utf8');
  assert.match(ui,/Compound Intelligence/);
  assert.match(ui,/Wordt Powerhouse aantoonbaar slimmer\?/);
  assert.match(ui,/self_improvement/);
  assert.match(api,/powerhouse_self_improvement_control_v1/);
  assert.match(api,/self_improvement:selfImprovement/);
});
