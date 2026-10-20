/**
 * Bounded, fail-closed concurrency for PostgREST reads on the existing EU edge gateway.
 * Jobs remain lazy; no successful partial results are emitted if a read fails.
 * Slow-stage evidence is anonymized (no tenant, query, values or credentials).
 */
export async function boundedReads(jobs,{maxConcurrent=3,slowStageMs=2000,onSlow=console.warn}={}){
 if(!Array.isArray(jobs)||jobs.some(job=>typeof job!=='function'))throw new TypeError('READ_JOBS_INVALID');
 if(!Number.isInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>10)throw new RangeError('READ_CONCURRENCY_INVALID');
 if(!Number.isInteger(slowStageMs)||slowStageMs<100||slowStageMs>30000)throw new RangeError('READ_SLOW_THRESHOLD_INVALID');
 // The entrepreneur endpoint currently supplies ten jobs in this known order.
 const names=['SOURCES','PUBLICATIONS','EXTERNAL_SIGNALS','DOMAIN_REGISTRY','SOURCE_CATALOG','SIGNAL_PROJECTION','COMPANY_IMPACT','CANONICAL_ACTIONS','TENANT_ACTIONS','INTELLIGENCE_SNAPSHOT'];
 const traceId=crypto.randomUUID().slice(0,8);
 const results=[];
 for(let i=0;i<jobs.length;i+=maxConcurrent){
  const values=await Promise.all(jobs.slice(i,i+maxConcurrent).map(async(job,offset)=>{
   const index=i+offset;
   const stage=jobs.length===10?names[index]:String(index+1);
   const started=Date.now();
   let slow=false;
   const marker=setTimeout(()=>{
    slow=true;
    onSlow('PORTAL_READ_SLOW trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
   },slowStageMs);
   try{
    const value=await job();
    if(slow)onSlow('PORTAL_READ_RECOVERED trace='+traceId+' stage='+stage+' total_ms='+Math.max(0,Date.now()-started));
    return value;
   }catch(error){
    onSlow('PORTAL_READ_FAILED trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
    throw error;
   }finally{clearTimeout(marker)}
  }));
  results.push(...values);
 }
 return results;
}
