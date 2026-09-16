const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>structuredClone(value);

export function createScenario({baselineRef,assumptions={},affectedCapabilities=[],dependencies=[],horizon='12m',modelVersion='scenario-v1'}={}){
 if(!baselineRef)throw new Error('SCENARIO_BASELINE_REQUIRED');
 return freeze({id:`scenario:${baselineRef}:${JSON.stringify(assumptions)}`,baseline_ref:baselineRef,assumptions:clone(assumptions),affected_capabilities:[...affectedCapabilities],dependencies:[...dependencies],horizon,model_version:modelVersion,kind:'simulation'});
}

export function simulateScenario(baseline={},scenario){
 if(!scenario||scenario.kind!=='simulation')throw new Error('SCENARIO_REQUIRED');
 const base=clone(baseline),kpis={...(base.kpis||{})},a=scenario.assumptions||{};
 if(Number.isFinite(Number(kpis.revenue))&&Number.isFinite(Number(a.revenue_pct)))kpis.revenue=Number((kpis.revenue*(1+Number(a.revenue_pct)/100)).toFixed(2));
 if(Number.isFinite(Number(kpis.capacity))&&Number.isFinite(Number(a.capacity_pct)))kpis.capacity=Number((kpis.capacity*(1+Number(a.capacity_pct)/100)).toFixed(2));
 if(Number.isFinite(Number(kpis.risk))&&Number.isFinite(Number(a.risk_delta)))kpis.risk=Number((kpis.risk+Number(a.risk_delta)).toFixed(2));
 const result={kind:'simulation',baseline_ref:scenario.baseline_ref,scenario_id:scenario.id,model_version:scenario.model_version,kpis,affected_capabilities:[...scenario.affected_capabilities],confidence:Number(a.confidence??base.confidence??0)};
 return freeze(result);
}

export function compareScenarios(a={},b={}){
 const keys=new Set([...Object.keys(a.kpis||{}),...Object.keys(b.kpis||{})]);const delta={};
 for(const key of keys){const av=Number(a.kpis?.[key]),bv=Number(b.kpis?.[key]);if(Number.isFinite(av)&&Number.isFinite(bv))delta[key]=Number((bv-av).toFixed(2));}
 return freeze({kind:'scenario-comparison',kpi_delta:delta});
}
