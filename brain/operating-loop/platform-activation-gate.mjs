const bool=v=>v===true;
export function evaluatePlatformActivation({platform,contract,evidence={}}={}){
  const name=String(platform||'').trim().toLowerCase();
  if(!name) throw new TypeError('platform required');
  const adapter=(contract?.platforms||[]).find(x=>String(x?.platform||'').toLowerCase()===name);
  if(!adapter){return Object.freeze({platform:name,status:'UNREGISTERED',productionReady:false,missing:['platform_adapter']});}
  const required=[...(contract?.activation?.production_ready_requires||[])];
  const missing=required.filter(key=>!bool(evidence[key]));
  if(adapter.capacity_gate!=='required'){
    const i=missing.indexOf('capacity_available'); if(i>=0&&evidence.capacity_available===undefined) missing.splice(i,1);
  }
  const productionReady=missing.length===0;
  return Object.freeze({platform:name,status:productionReady?'PRODUCTION_READY':'BLOCKED',productionReady,missing:Object.freeze([...new Set(missing)]),adapter:Object.freeze({...adapter})});
}
