const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>structuredClone(value);
// Unknown values must remain unknown; Number(null) and Number('') would fabricate zero.
const finite=value=>{
 if(value==null||typeof value==='boolean'||(typeof value==='string'&&!value.trim()))return null;
 const number=Number(value);
 return Number.isFinite(number)?number:null;
};

export function createScenario({baselineRef,assumptions={},affectedCapabilities=[],dependencies=[],horizon='12m',modelVersion='scenario-v1'}={}){
 if(!baselineRef)throw new Error('SCENARIO_BASELINE_REQUIRED');
 return freeze({id:`scenario:${baselineRef}:${JSON.stringify(assumptions)}`,baseline_ref:baselineRef,assumptions:clone(assumptions),affected_capabilities:[...affectedCapabilities],dependencies:[...dependencies],horizon,model_version:modelVersion,kind:'simulation'});
}

export function simulateScenario(baseline={},scenario){
 if(!scenario||scenario.kind!=='simulation')throw new Error('SCENARIO_REQUIRED');
 const base=clone(baseline),kpis={...(base.kpis||{})},a=scenario.assumptions||{};
 const revenue=finite(kpis.revenue),revenuePct=finite(a.revenue_pct);
 const capacity=finite(kpis.capacity),capacityPct=finite(a.capacity_pct);
 const risk=finite(kpis.risk),riskDelta=finite(a.risk_delta);
 if(revenue!==null&&revenuePct!==null)kpis.revenue=Number((revenue*(1+revenuePct/100)).toFixed(2));
 if(capacity!==null&&capacityPct!==null)kpis.capacity=Number((capacity*(1+capacityPct/100)).toFixed(2));
 if(risk!==null&&riskDelta!==null)kpis.risk=Number((risk+riskDelta).toFixed(2));
 const result={kind:'simulation',baseline_ref:scenario.baseline_ref,scenario_id:scenario.id,model_version:scenario.model_version,kpis,affected_capabilities:[...scenario.affected_capabilities],confidence:finite(a.confidence??base.confidence)};
 return freeze(result);
}

export function compareScenarios(a={},b={}){
 const keys=new Set([...Object.keys(a.kpis||{}),...Object.keys(b.kpis||{})]);const delta={};
 for(const key of keys){const av=finite(a.kpis?.[key]),bv=finite(b.kpis?.[key]);if(av!==null&&bv!==null)delta[key]=Number((bv-av).toFixed(2));}
 return freeze({kind:'scenario-comparison',kpi_delta:delta});
}
