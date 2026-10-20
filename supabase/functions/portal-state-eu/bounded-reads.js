/**
 * Bounded fail-closed PostgREST execution. Abort-aware, no forged partial data.
 * Edge read jobs receive an AbortSignal and MUST pass it to the underlying fetch.
 * Logs deliberately omit tenant, query contents, tokens, and customer values.
 */
export async function boundedReads(jobs,{maxConcurrent=2,slowStageMs=1500,readTimeoutMs=6000,onSlow=console.warn}={}){
 if(!Array.isArray(jobs)||jobs.some(job=>typeof job!=='function'))throw new TypeError('READ_JOBS_INVALID');
 if(!Number.isInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>10)throw new RangeError('READ_CONCURRENCY_INVALID');
 if(!Number.isInteger(slowStageMs)||slowStageMs<100||slowStageMs>30000)throw new RangeError('READ_SLOW_THRESHOLD_INVALID');
 if(!Number.isInteger(readTimeoutMs)||readTimeoutMs<20||readTimeoutMs>20000||readTimeoutMs<=slowStageMs)
   throw new RangeError('READ_DEADLINE_INVALID');
 const names=['SOURCES','PUBLICATIONS','EXTERNAL_SIGNALS','DOMAIN_REGISTRY','SOURCE_CATALOG','SIGNAL_PROJECTION','COMPANY_IMPACT','CANONICAL_ACTIONS','TENANT_ACTIONS','INTELLIGENCE_SNAPSHOT'];
 const traceId=crypto.randomUUID().slice(0,8);
 const results=[];
 for(let i=0;i<jobs.length;i+=maxConcurrent){
   const controllers=[];
   try{
     const values=await Promise.all(jobs.slice(i,i+maxConcurrent).map(async(job,offset)=>{
       const stage=jobs.length===10?names[i+offset]:String(i+offset+1);
       const started=Date.now(),controller=new AbortController();
       controllers.push(controller);
       let slowTimer,deadlineTimer,wasSlow=false;
       const deadline=new Promise((_,reject)=>{
         deadlineTimer=setTimeout(()=>{
           // Settle the budget failure before notifying the transport so a
           // provider resolving on abort cannot masquerade as successful data.
           reject(new Error('PORTAL_READ_TIMEOUT'));
           controller.abort();
           onSlow('PORTAL_READ_TIMEOUT trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
         },readTimeoutMs);
       });
       slowTimer=setTimeout(()=>{
         wasSlow=true;
         onSlow('PORTAL_READ_SLOW trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
       },slowStageMs);
       try{
         // AbortSignal is passed through to the Supabase PostgREST fetch.
         // A deadline also ends the await even if a transport ignores abort.
         const value=await Promise.race([Promise.resolve().then(()=>job(controller.signal)),deadline]);
         if(wasSlow)onSlow('PORTAL_READ_RECOVERED trace='+traceId+' stage='+stage+' total_ms='+Math.max(0,Date.now()-started));
         return value;
       }catch(error){
         onSlow('PORTAL_READ_FAILED trace='+traceId+' stage='+stage+' elapsed_ms='+Math.max(0,Date.now()-started));
         throw error;
       }finally{clearTimeout(slowTimer);clearTimeout(deadlineTimer)}
     }));
     results.push(...values);
   }catch(error){
     // Abort remaining in-flight reads in the failing batch. The next batch
     // is never scheduled; no partial output escapes.
     for(const controller of controllers)if(!controller.signal.aborted)controller.abort();
     throw error;
   }
 }
 return results;
}
