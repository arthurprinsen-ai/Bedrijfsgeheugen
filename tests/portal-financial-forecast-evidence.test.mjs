import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { eligibleFinancialForecast as validateFinancialForecast } from '../supabase/functions/_shared/portal-financial-forecast-acceptance.js';

// Deterministic approval clock: regression tests must not change with the wall clock.
const reviewClock=Date.parse('2026-10-14T12:00:00Z');
const eligibleFinancialForecast=(row,tenant)=>validateFinancialForecast(row,tenant,reviewClock);

const point=(date,value)=>({date,value});
const base={
 tenant_id:'tenant42',forecast_id:'forecast-1',verification_status:'passed',
 source_name:'Authorized finance ledger',source_evidence_ref:'restricted:finance/ledger/receipt-1',
 model_version:'forecast-model-v1',source_updated_at:'2026-10-13T10:00:00Z',
 verified_at:'2026-10-14T10:00:00Z',verified_by:'independent-reviewer',
 historical_points:['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'].map((d,i)=>point(d,100+i*10)),
 forecast_points:[point('2026-10',170),point('2026-11',180)],
 lower_points:null,upper_points:null,
 backtest:{status:'passed',method:'walk-forward',holdout_count:3,mae:6,baseline_mae:10,
  holdout_points:[
   {date:'2026-07',actual:130,predicted:124,baseline_predicted:120},
   {date:'2026-08',actual:140,predicted:134,baseline_predicted:130},
   {date:'2026-09',actual:150,predicted:144,baseline_predicted:140}
  ]},
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
test('independent finance approval rejects unreplayable, altered or misdated backtests',()=>{
 assert.equal(eligibleFinancialForecast(base,'tenant42'),true);
 const valid=base.backtest;
 const invalid=[
  {...valid,holdout_points:undefined},
  {...valid,holdout_points:[]},
  {...valid,mae:0},
  {...valid,baseline_mae:0},
  {...valid,holdout_count:4},
  {...valid,holdout_points:valid.holdout_points.slice(1)},
  {...valid,holdout_points:valid.holdout_points.map((p,i)=>i===1?{...p,actual:141}:p)},
  {...valid,holdout_points:valid.holdout_points.map((p,i)=>i===2?{...p,date:'2026-08'}:p)},
  {...valid,holdout_points:valid.holdout_points.map((p,i)=>i===0?{...p,predicted:NaN}:p)},
  {...valid,holdout_points:valid.holdout_points.map((p,i)=>i===0?{...p,baseline_predicted:115}:p)},
 ];
 for(const backtest of invalid)
  assert.equal(eligibleFinancialForecast({...base,backtest},'tenant42'),false);
 const tamperedHistory={...base,historical_points:base.historical_points.map((p,i)=>
  i===4?{...p,value:p.value+1}:p)};
 assert.equal(eligibleFinancialForecast(tamperedHistory,'tenant42'),false);
});

test('future-dated historical actuals cannot be approved before source was observed',()=>{
 const futureActual={...base,
  historical_points:base.historical_points.map((p,i)=>i===5?point('2026-11',p.value):p),
  forecast_points:[point('2026-12',180)],
  backtest:{...base.backtest,holdout_points:base.backtest.holdout_points.map((p,i)=>
   i===2?{...p,date:'2026-11'}:p)}};
 assert.equal(eligibleFinancialForecast(futureActual,'tenant42'),false);
 const futureSource={...base,source_updated_at:'2026-10-16T10:00:00Z',verified_at:'2026-10-17T10:00:00Z'};
 assert.equal(eligibleFinancialForecast(futureSource,'tenant42'),false);
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

test('financial evidence must be current, not future-dated, and revalidated at readback',()=>{
 assert.equal(validateFinancialForecast(base,'tenant42',reviewClock),true);
 const expired=Date.parse('2026-11-14T12:00:00Z');
 assert.equal(validateFinancialForecast(base,'tenant42',expired),false,
  'Stored passed review never authorizes a stale financial series');
 for(const row of [
  {...base,source_updated_at:'2026-09-01T10:00:00Z'},
  {...base,verified_at:'2026-10-15T10:00:00Z'},
  {...base,source_updated_at:'2026-10-15T10:00:00Z',verified_at:'2026-10-16T10:00:00Z'}
 ])assert.equal(validateFinancialForecast(row,'tenant42',reviewClock),false);
 assert.equal(validateFinancialForecast(base,'tenant42',NaN),false);
 const atBoundary={...base,source_updated_at:'2026-09-14T12:00:00Z'};
 assert.equal(validateFinancialForecast(atBoundary,'tenant42',reviewClock),true);
 assert.equal(validateFinancialForecast(atBoundary,'tenant42',reviewClock+1),false);
});

test('financial gateway filters invalid reviews before applying the chart cap',()=>{
 const edge=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
 assert.match(edge,/\.eq\('tenant_id',tenantId\)/,'Every candidate must be scoped to authenticated tenant');
 assert.match(edge,/\.order\('verified_at',\{ascending:false\}\)\.limit\(150\)/,
  'Fetch a bounded set of candidate rows, not just the 30 most recent declarations');
 assert.match(edge,/\.filter\(row=>eligibleFinancialForecast\(row,tenantId\)\)\.slice\(0,30\)/,
  'Independent review must precede the presentation cap');
 const invalid=Array.from({length:30},(_,i)=>({...base,forecast_id:'unreviewed-'+i,verification_status:'passed',
  verified_at:'2026-09-01T10:00:00Z'}));
 const rows=[...invalid,base];
 const safe=rows.filter(row=>eligibleFinancialForecast(row,'tenant42')).slice(0,30);
 assert.deepEqual(safe,[base],'One valid older candidate should not be hidden by thirty invalid reviews');
});

