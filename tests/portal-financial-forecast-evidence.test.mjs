import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleFinancialForecast } from '../supabase/functions/_shared/portal-financial-forecast-acceptance.js';

const point=(date,value)=>({date,value});
const base={
 tenant_id:'tenant42',forecast_id:'forecast-1',verification_status:'passed',
 source_name:'Authorized finance ledger',source_evidence_ref:'restricted:finance/ledger/receipt-1',
 model_version:'forecast-model-v1',source_updated_at:'2026-10-13T10:00:00Z',
 verified_at:'2026-10-14T10:00:00Z',verified_by:'independent-reviewer',
 historical_points:['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'].map((d,i)=>point(d,100+i*10)),
 forecast_points:[point('2026-10',170),point('2026-11',180)],
 lower_points:null,upper_points:null,
 backtest:{status:'passed',method:'walk-forward',holdout_count:3,mae:12,baseline_mae:14},
 independent_review:{prepared_by:'source-analyst',approved_by:'independent-reviewer',
  approval_evidence_ref:'restricted:approval/42',backtest_evidence_ref:'restricted:backtest/42',
  financial_source_evidence_ref:'restricted:finance/ledger/receipt-1'}
};
test('independently reviewed, tenant-bound finance series qualifies structurally',()=>{
 assert.equal(eligibleFinancialForecast(base,'tenant42'),true);
});
test('unverified status, mismatched tenants or same-person approval fail closed',()=>{
 for(const row of [
   {...base,tenant_id:'tenant43'},
   {...base,verification_status:'pending'},
   {...base,verified_by:'source-analyst'},
   {...base,independent_review:{...base.independent_review,prepared_by:'independent-reviewer'}},
   {...base,independent_review:{...base.independent_review,approval_evidence_ref:''}},
   {...base,independent_review:{...base.independent_review,backtest_evidence_ref:''}},
   {...base,independent_review:{...base.independent_review,financial_source_evidence_ref:'fake-ref'}}
 ])assert.equal(eligibleFinancialForecast(row,'tenant42'),false);
});
test('requires actual series and bounded backtest holdout, rejecting invalid numbers',()=>{
 const cases=[
  {...base,historical_points:base.historical_points.slice(1)},
  {...base,backtest:{...base.backtest,holdout_count:4}},
  {...base,backtest:{...base.backtest,mae:NaN}},
  {...base,backtest:{...base.backtest,baseline_mae:-1}},
  {...base,historical_points:base.historical_points.map((p,i)=>i===3?point('2026-06',150):p)},
  {...base,forecast_points:[point('2026-04',170)]},
  {...base,forecast_points:[point('2026-02-30',180)]},
  {...base,forecast_points:[point('2026-10',null)]},
  {...base,verified_at:'2026-10-12T00:00:00Z'}
 ];
 for(const row of cases)assert.equal(eligibleFinancialForecast(row,'tenant42'),false);
});
test('bands must match the same periods, include every forecast and enclose expected values',()=>{
 const low=[point('2026-10',150),point('2026-11',160)];
 const high=[point('2026-10',190),point('2026-11',210)];
 assert.equal(eligibleFinancialForecast({...base,lower_points:low,upper_points:high},'tenant42'),true);
 for(const row of [
  {...base,lower_points:low},
  {...base,lower_points:low,upper_points:high.slice(1)},
  {...base,lower_points:low.map(p=>({...p,date:'2026-01'})),upper_points:high},
  {...base,lower_points:low.map(p=>({...p,value:200})),upper_points:high}
 ])assert.equal(eligibleFinancialForecast(row,'tenant42'),false);
});
