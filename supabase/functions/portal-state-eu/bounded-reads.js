/**
 * Bounded, fail-closed concurrency for PostgREST reads on the existing EU edge gateway.
 * Callers supply lazy jobs: queries MUST NOT start before their batch is scheduled.
 * A failed batch rejects: never return a success-shaped empty tenant projection.
 */
export async function boundedReads(jobs,{maxConcurrent=3}={}){
 if(!Array.isArray(jobs)||jobs.some(job=>typeof job!=='function'))throw new TypeError('READ_JOBS_INVALID');
 if(!Number.isInteger(maxConcurrent)||maxConcurrent<1||maxConcurrent>10)throw new RangeError('READ_CONCURRENCY_INVALID');
 const results=[];
 for(let i=0;i<jobs.length;i+=maxConcurrent){
  const values=await Promise.all(jobs.slice(i,i+maxConcurrent).map(job=>job()));
  results.push(...values);
 }
 return results;
}
