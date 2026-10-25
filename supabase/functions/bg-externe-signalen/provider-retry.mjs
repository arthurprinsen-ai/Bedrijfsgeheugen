// Canonical bg-externe-signalen provider resilience. No additional scheduler or API.
//
// DataForSEO documents transient HTTP 5xx and internal/task processing errors.
// Billing, authentication and rate-limit errors must never be retried here.
const RETRYABLE_TASK_CODES=new Set([40101,40103,50000,50001,50401,50402]);

export function isTransientDataforseoStatus(httpStatus,apiStatus,taskStatus){
  const http=Number(httpStatus);
  if(http===408||http===500||http===502||http===503||http===504)return true;
  if(!Number.isFinite(http)||http===401||http===402||http===403||http===429)return false;
  return RETRYABLE_TASK_CODES.has(Number(apiStatus))||RETRYABLE_TASK_CODES.has(Number(taskStatus));
}

export function isEmptyDataforseoResult(taskStatus){
  return Number(taskStatus)===40102;
}

// One optional retry, only when the error is explicitly transient. A second
// failure propagates and the original source-ingest still returns HTTP 207/502.
export async function withOneTransientDataforseoRetry(operation,{sleep,delayMs=300}={}){
  const pause=sleep||((milliseconds)=>new Promise(resolve=>setTimeout(resolve,milliseconds)));
  try{return await operation();}
  catch(error){
    if(error?.retryable!==true)throw error;
    await pause(Math.min(800,Math.max(0,Number(delayMs)||0)));
    return await operation();
  }
}
