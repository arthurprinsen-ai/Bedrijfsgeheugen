import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('config/powerhouse-foresight-autonomy.json','utf8'));

export function scoreForecast({baseline, benchmark, drivers=[], confidence=0.5, horizon='90d'}={}){
  const b=Number(baseline);
  const bm=Number(benchmark);
  const valid=Number.isFinite(b)&&Number.isFinite(bm);
  const weighted=drivers.filter(d=>Number.isFinite(d?.impact)&&Number.isFinite(d?.weight))
    .reduce((s,d)=>s+(d.impact*d.weight),0);
  const expected=valid?b+weighted:null;
  const gap=valid?bm-b:null;
  const c=Math.max(0,Math.min(1,Number(confidence)||0));
  const spread=expected===null?null:Math.max(Math.abs(expected)*0.05,Math.abs(weighted)*(1-c));
  return {
    horizon,
    baseline:valid?b:null,
    benchmark:valid?bm:null,
    benchmark_gap:gap,
    expected_path:expected,
    downside_case:expected===null?null:expected-spread,
    upside_case:expected===null?null:expected+spread,
    confidence:c,
    uncertainty:expected===null?'unknown':c>=0.8?'low':c>=0.55?'medium':'high',
    prediction_is_not_fact:true
  };
}

export function buildForesightPacket(input={}){
  const forecasts=(input.metrics||[]).map(m=>({
    id:m.id,
    ...scoreForecast(m),
    freshness:m.freshness??'unknown',
    provenance:m.provenance??[],
    leading_indicators:m.leading_indicators??[],
    recommended_actions:m.recommended_actions??[]
  }));
  return {
    fingerprint:contract.version,
    observed_at:input.observed_at||new Date().toISOString(),
    source_sha:input.source_sha??null,
    systems:contract.control_plane.systems,
    forecasts,
    experiment_policy:contract.experimentation,
    security_policy:contract.security,
    status:'READY_FOR_EVIDENCE_DRIVEN_FORESIGHT'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  process.stdout.write(JSON.stringify(buildForesightPacket(),null,2)+'\n');
}
