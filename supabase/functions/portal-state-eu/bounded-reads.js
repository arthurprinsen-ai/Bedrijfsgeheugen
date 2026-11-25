/**
 * Bounded, fail-closed concurrency for PostgREST reads on the existing EU edge gateway.
 * Every query receives an AbortSignal so a stalled pool checkout cannot wait for minutes.
 * No partial data is returned, and slow-stage logs contain no tenant/query/content.
 */
export async function boundedReads(jobs,{maxConcurrent=3,slowStageMs=2000,stageTimeoutMs=5000,onSlow=console.warn}={}){
 if(!Array.isArray(jobs)||jobs.some(job=>typeof job!=='function'))throw new TypeError('READ_JOBS_INVALID');
 if(!Number.isInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>10)throw new RangeError('READ_CONCURRENCY_INVALID');
 if(!Number.isInteger(slowStageMs)||slowStageMs<100||slowStageMs>30000)throw new RangeError('READ_SLOW_THRESHOLD_INVALID');
 if(!Number.isInteger(stageTimeoutMs)||stageTimeoutMs<100||stageTimeoutMs>30000||stageTimeoutMs<=slowStageMs)throw new RangeError('READ_STAGE_TIMEOUT_INVALID');
 const names=['SOURCES','PUBLICATIONS','EXTERNAL_SIGNALS','DOMAIN_REGISTRY','SOURCE_CATALOG','SIGNAL_PROJECTION','COMPANY_IMPACT','CANONICAL_ACTIONS','TENANT_ACTIONS','INTELLIGENCE_SNAPSHOT'];
 const traceId=crypto.randomUUID().slice(0,8);
 const results=[];
 for(let i=0;i<jobs.length;i+=maxConcurrent){
  const values=await Promise.all(jobs.slice(i,i+maxConcurrent).map(async(job,offset)=>{
   const stage=jobs.length===10?names[i+offset]:String(i+offset+1);
   const started=Date.now();
   const controller=new AbortController();
   let slow=false;
   const marker=setTimeout(()=>{
    slow=true;
    onSlow('PORTAL_READ_SLOW trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
   },slowStageMs);
   let deadline;
   const timeout=new Promise((_,reject)=>{
    deadline=setTimeout(()=>{
     controller.abort();
     reject(new Error('PORTAL_READ_DEADLINE_EXCEEDED'));
    },stageTimeoutMs);
   });
   try{
    const value=await Promise.race([job(controller.signal),timeout]);
    if(slow)onSlow('PORTAL_READ_RECOVERED trace='+traceId+' stage='+stage+' total_ms='+Math.max(0,Date.now()-started));
    return value;
   }catch(error){
    onSlow('PORTAL_READ_FAILED trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
    throw error;
   }finally{
    clearTimeout(marker);
    clearTimeout(deadline);
    controller.abort();
   }
  }));
  results.push(...values);
 }
 return results;
}
