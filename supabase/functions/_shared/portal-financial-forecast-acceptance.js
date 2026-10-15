// Fail-closed validation of service-role financial forecast rows.
// Only trusted ingestion/review workflows may write the underlying table.
const text=v=>typeof v==='string'&&v.trim().length>0;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const period=date=>{
 if(typeof date!=='string'||!/^[0-9]{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?$/.test(date))return false;
 if(date.length===7)return true;
 const parsed=new Date(date+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
};
const series=(list,min=1,max=120)=>{
 if(!Array.isArray(list)||list.length<min||list.length>max)return false;
 const len=list[0]?.date?.length;
 return list.every((p,i)=>p&&period(p.date)&&p.date.length===len&&finite(p.value)
   &&(i===0||list[i-1].date<p.date));
};
const bounds=row=>{
 const low=row.lower_points,high=row.upper_points,forecast=row.forecast_points;
 if(low==null&&high==null)return true;
 if(!series(low)||!series(high)||low.length!==forecast.length||high.length!==forecast.length)return false;
 return forecast.every((f,i)=>low[i].date===f.date&&high[i].date===f.date
   &&low[i].value<=f.value&&f.value<=high[i].value);
};
// Recalculate reported walk-forward holdout error from dated observations.
// Evidence is still subject to independent provenance review: numerical consistency alone
// does not authenticate the originating historical ledger or stored predictions.
export function replayFinancialHoldout(backtest,history){
 const count=backtest?.holdout_count, points=backtest?.holdout_points;
 if(!Number.isInteger(count)||count<3||count>120||!Array.isArray(points)
    ||points.length!==count||!series(history,6)
    ||count>history.length-3)return false;
 let sumError=0,sumBaselineError=0;
 const holdout=history.slice(-count);
 for(let i=0;i<count;i++){
  const row=points[i], observed=holdout[i];
  if(!row||row.date!==observed.date||!finite(row.actual)||
     !finite(row.predicted)||!finite(row.baseline_predicted)||
     row.actual!==observed.value)return false;
  sumError+=Math.abs(row.predicted-row.actual);
  sumBaselineError+=Math.abs(row.baseline_predicted-row.actual);
 }
 if(!Number.isFinite(sumError)||!Number.isFinite(sumBaselineError))return false;
 const expectedMae=sumError/count, expectedBaselineMae=sumBaselineError/count;
 if(!finite(backtest.mae)||!finite(backtest.baseline_mae)
    ||backtest.mae<0||backtest.baseline_mae<0)return false;
 const close=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
 return close(backtest.mae,expectedMae)&&close(backtest.baseline_mae,expectedBaselineMae);
}

export function eligibleFinancialForecast(row,expectedTenant,now=Date.now()){
 if(!row||!text(expectedTenant)||row.tenant_id!==expectedTenant||row.verification_status!=='passed')return false;
 const review=row.independent_review||{},backtest=row.backtest||{};
 if(!text(row.verified_by)||!text(row.source_evidence_ref)||!text(row.source_name)||!text(row.model_version))return false;
 if(!text(review.prepared_by)||!text(review.approved_by)||review.prepared_by===review.approved_by
   ||review.approved_by!==row.verified_by||!text(review.approval_evidence_ref)
   ||!text(review.backtest_evidence_ref)||review.financial_source_evidence_ref!==row.source_evidence_ref)return false;
 const verified=Date.parse(row.verified_at),source=Date.parse(row.source_updated_at);
 // A previously approved row must not outlive its source or review.
 // `now` is injectable for deterministic tests; production always uses the current clock.
 const maxAgeMs=30*24*60*60*1000;
 if(!Number.isFinite(now)||!Number.isFinite(verified)||!Number.isFinite(source)
   ||source>verified||verified>now||source>now
   ||now-source>maxAgeMs||now-verified>maxAgeMs)return false;
 if(backtest.status!=='passed'||!text(backtest.method)||!Number.isInteger(backtest.holdout_count)
   ||backtest.holdout_count<3||backtest.holdout_count>120
   ||!finite(backtest.mae)||backtest.mae<0
   ||!finite(backtest.baseline_mae)||backtest.baseline_mae<0)return false;
 if(!series(row.historical_points,6)||!series(row.forecast_points))return false;
 if(row.historical_points.at(-1).date>=row.forecast_points[0].date
   ||row.historical_points[0].date.length!==row.forecast_points[0].date.length)return false;
 if(backtest.holdout_count>row.historical_points.length-3
    ||!replayFinancialHoldout(backtest,row.historical_points))return false;
 return bounds(row);
}
