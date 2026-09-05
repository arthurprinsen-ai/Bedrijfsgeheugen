function rootOf(v){return String(v?.attribution_root||v?.attribution_root_key||'').trim();}
function keyOf(v){return `${rootOf(v)}|${String(v?.event_type||v?.kind||'').trim()}|${String(v?.event_id||v?.fingerprint||'').trim()}`;}

export function attachOutcome(observations,outcome){
  const root=rootOf(outcome);if(!root)throw new Error('outcome attribution_root required');
  const related=(observations||[]).filter(o=>rootOf(o)===root);
  const seen=new Set();const chain=[];
  for(const item of [...related,outcome]){const key=keyOf(item);if(seen.has(key))continue;seen.add(key);chain.push(item);}
  const lead=chain.some(x=>x.event_type==='lead_outcome');
  const order=chain.some(x=>x.event_type==='order_outcome');
  const revenueValues=chain.filter(x=>x.event_type==='order_outcome'&&Number.isFinite(Number(x?.metrics?.revenue??x?.revenue))).map(x=>Number(x?.metrics?.revenue??x?.revenue));
  const knownStages=['page_view','primary_cta_click','lead_outcome','order_outcome'].filter(type=>chain.some(x=>x.event_type===type));
  return Object.freeze({attribution_root:root,observations:chain,lead_observed:lead,order_observed:order,revenue:revenueValues.length?Math.max(...revenueValues):null,completeness:knownStages.length/4,confidence:Math.min(1,0.25+knownStages.length*0.1875)});
}
