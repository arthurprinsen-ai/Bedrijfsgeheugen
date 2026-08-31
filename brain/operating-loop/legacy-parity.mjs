const n=v=>Number(v);
const finite=v=>Number.isFinite(n(v));
export function evaluateLegacyParity(registry,{expectedCalculationIds=[]}={}){
  const rows=Array.isArray(registry)?registry:[];
  const byId=new Map(rows.filter(x=>x?.id).map(x=>[String(x.id),x]));
  const missing=[...new Set(expectedCalculationIds.map(String))].filter(id=>!byId.has(id));
  const results=[];
  for(const [id,row] of byId){
    const issues=[];
    if(!row.legacySource) issues.push('legacy_source');
    if(!row.canonicalService) issues.push('canonical_service');
    if(!Array.isArray(row.fixtures)||row.fixtures.length===0) issues.push('fixtures');
    const tolerance=Math.max(0,Number(row.tolerance)||0);
    const fixtureResults=(row.fixtures||[]).map(f=>{
      let pass=false;let delta=null;
      if(finite(f.legacy)&&finite(f.canonical)){delta=Math.abs(n(f.legacy)-n(f.canonical));pass=delta<=tolerance;}
      else pass=JSON.stringify(f.legacy)===JSON.stringify(f.canonical);
      return Object.freeze({id:String(f.id||'fixture'),pass,delta});
    });
    if(fixtureResults.some(x=>!x.pass)) issues.push('fixture_mismatch');
    results.push(Object.freeze({id,proven:issues.length===0,issues:Object.freeze(issues),fixtures:Object.freeze(fixtureResults)}));
  }
  results.sort((a,b)=>a.id.localeCompare(b.id));
  const failed=results.filter(x=>!x.proven).length;
  const proven=results.length-failed;
  const status=missing.length===0&&failed===0&&results.length>0?'PROVEN':'NOT_PROVEN';
  return Object.freeze({schemaVersion:'brain-legacy-parity.v1',status,proven,failed,missing:Object.freeze(missing),calculations:Object.freeze(results)});
}
