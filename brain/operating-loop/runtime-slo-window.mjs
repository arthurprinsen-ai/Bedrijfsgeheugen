import {assessRuntimeSlo} from './runtime-telemetry.mjs';
const clean=v=>String(v??'').trim();
const METRICS=Object.freeze(['cached_ms','interactive_ms']);
const percentile95=values=>{const sorted=[...values].sort((a,b)=>a-b);if(!sorted.length)return null;return sorted[Math.max(0,Math.ceil(sorted.length*0.95)-1)];};
const validRow=row=>row&&METRICS.includes(clean(row.metricName))&&Number.isFinite(Number(row.metricValueMs))&&Number(row.metricValueMs)>=0;

export function aggregateRuntimeWindow(metrics=[],{surface,route,revision}={}){
  const wanted={surface:clean(surface),route:clean(route),revision:clean(revision)};
  const rows=(Array.isArray(metrics)?metrics:[]).filter(validRow).filter(row=>(!wanted.surface||clean(row.surface)===wanted.surface)&&(!wanted.route||clean(row.route)===wanted.route)&&(!wanted.revision||clean(row.revision)===wanted.revision));
  const values={cached_ms:[],interactive_ms:[]};
  for(const row of rows) values[clean(row.metricName)].push(Number(row.metricValueMs));
  return Object.freeze({surface:wanted.surface||null,route:wanted.route||null,revision:wanted.revision||null,samples:rows.length,values:Object.freeze({cached_ms:Object.freeze(values.cached_ms),interactive_ms:Object.freeze(values.interactive_ms)})});
}

export function projectRuntimeSlo(metrics=[],{surface,route,revision,minSamples=10,cachedTargetMs=1000,interactiveTargetMs=2000,owner='Performance Guardian'}={}){
  const window=aggregateRuntimeWindow(metrics,{surface,route,revision});
  const p95=Object.freeze({cached_ms:percentile95(window.values.cached_ms),interactive_ms:percentile95(window.values.interactive_ms)});
  const realSamples=Math.min(window.values.cached_ms.length,window.values.interactive_ms.length);
  const assessment=assessRuntimeSlo({p95CachedMs:p95.cached_ms,p95InteractiveMs:p95.interactive_ms,samples:realSamples},{cachedTargetMs,interactiveTargetMs,minSamples});
  const base={surface:window.surface,route:window.route,revision:window.revision,realSamples,p95,status:assessment.status,breaches:[...assessment.breaches],targets:assessment.targets||Object.freeze({cached_ms:cachedTargetMs,interactive_ms:interactiveTargetMs})};
  if(assessment.status==='NOT_PROVEN') return Object.freeze({...base,obligation:Object.freeze({id:`runtime-slo:${window.surface||'unknown'}:${window.route||'unknown'}:${window.revision||'unknown'}`,type:'RUNTIME_EVIDENCE',status:'WAITING_FOR_REAL_TRAFFIC',owner,requiredSamples:minSamples,currentSamples:realSamples})});
  if(assessment.status==='FAIL') return Object.freeze({...base,obligation:Object.freeze({id:`runtime-slo:${window.surface||'unknown'}:${window.route||'unknown'}:${window.revision||'unknown'}`,type:'RUNTIME_SLO_BREACH',status:'OPEN',owner,breaches:Object.freeze([...assessment.breaches]),evidence:Object.freeze({p95,realSamples,revision:window.revision})})});
  return Object.freeze({...base,obligation:null});
}
