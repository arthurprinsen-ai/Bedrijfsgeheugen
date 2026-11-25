// Single numeric + freshness truth contract for the existing EU entrepreneur projection.
// Missing evidence is unknown, never a zero-valued observation.
export function finiteEvidence(value){
 if(value===null||value===undefined||typeof value==='boolean')return null;
 if(typeof value==='string'&&!value.trim())return null;
 const n=Number(value);
 return Number.isFinite(n)?n:null;
}
export function sumKnownEvidence(values=[]){
 const known=(Array.isArray(values)?values:[]).map(finiteEvidence).filter(n=>n!==null);
 return known.length?known.reduce((sum,n)=>sum+n,0):null;
}
export function maxKnownEvidence(values=[]){
 const known=(Array.isArray(values)?values:[]).map(finiteEvidence).filter(n=>n!==null);
 return known.length?Math.max(...known):null;
}
export function entrepreneurSnapshotFreshness({base=null,signals=[],now=Date.now(),maxAgeMs=2*60*60*1000}={}){
 const observed=Array.isArray(signals)?signals:[];
 const when=Date.parse(base?.refreshed_at||'');
 const valid=Number.isFinite(when)&&when<=now+5*60*1000&&when<=now;
 const ageMs=valid?Math.max(0,now-when):null;
 const refreshedAt=valid?base.refreshed_at:null;
 let status='STALE';
 if(valid&&ageMs<=maxAgeMs){
  if(observed.length===0)status='EMPTY';
  else if(base?.status!=='CURRENT')status='PARTIAL';
  else {
   const recent=observed.some(signal=>{
    const at=Date.parse(signal?.observed_at||'');
    return Number.isFinite(at)&&at<=now+5*60*1000&&at>=now-7*24*60*60*1000;
   });
   status=recent?'CURRENT':'PARTIAL';
  }
 }
 return Object.freeze({status,refreshed_at:refreshedAt,age_minutes:ageMs===null?null:Math.round(ageMs/60000),valid_source_snapshot:valid,customer_value_evidence_inferred:false});
}
