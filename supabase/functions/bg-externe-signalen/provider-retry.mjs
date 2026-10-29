// Canonical bg-externe-signalen provider resilience. No additional scheduler or API.
//
// DataForSEO documents transient HTTP 5xx and task errors. Its 40101 internal
// search-engine failure may be billed AFTER provider retries: never immediately
// repeat this paid task. Only 40102 is a real no-results observation.
// Billing, authentication and rate-limit errors must never be retried here.
const RETRYABLE_TASK_CODES=new Set([40103,50000,50001,50301,50302,50303,50304,50401,50402]);

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

/** Diagnostic fields that are safe for public Brain evidence: numbers only.
 * Never include upstream bodies, messages, credentials or payment metadata.
 */
export function safeDataforseoDiagnostic(error){
  if(String(error?.message||'')!=='DATAFORSEO_REMOTE_FAILURE')return null;
  const code=(value,max)=>{
    if(value==null)return null;
    const n=Number(value);
    return Number.isInteger(n)&&n>=0&&n<=max?n:null;
  };
  return {
    http_status:code(error?.http_status,599),
    api_status:code(error?.api_status,99999),
    task_status:code(error?.task_status,99999),
    retryable:error?.retryable===true
  };
}

/** An executed batch is healthy only if EVERY intended topic succeeded.
 * A partial provider failure may retain good source rows, but cannot issue
 * a canonical GREEN completion receipt for the whole batch.
 */
export function sourceBatchEvidenceVerdict(results){
  if(!Array.isArray(results))throw new TypeError('SOURCE_BATCH_RESULTS_REQUIRED');
  const complete=results.length>0&&results.every(item=>item?.ok===true);
  return {green:complete,errorClass:complete?null:'REMOTE'};
}

/** One in-flight Tavily probe and bounded per-isolate plan/rate cooldown.
 * No extra schedule, DB writer, customer data, provider account or quota bypass.
 */
export function createTavilyQuotaGate({now=()=>Date.now(),planCooldownMs=900000,rateCooldownMs=60000}={}){
  let blockedUntil=0,blockedStatus=null,pendingProbe=null;
  const errorCode=err=>{
    const status=Number(err?.http_status??err?.status);
    if(status===432||status===429)return status;
    const match=/HTTP_(432|429)\b/.exec(String(err?.message||''));
    return match?Number(match[1]):null;
  };
  const blocked=()=>Object.assign(new Error(blockedStatus===432?'HTTP_432:TAVILY_PLAN_LIMIT_COOLDOWN':'HTTP_429:TAVILY_RATE_LIMIT_COOLDOWN'),{http_status:blockedStatus,retryable:false});
  async function run(operation){
    if(typeof operation!=='function')throw new TypeError('TAVILY_OPERATION_REQUIRED');
    if(now()<blockedUntil)throw blocked();
    if(pendingProbe){
      await pendingProbe.catch(()=>{});
      if(now()<blockedUntil)throw blocked();
      return operation();
    }
    const first=Promise.resolve().then(operation).catch(err=>{
      const status=errorCode(err);
      if(status===432||status===429){
        blockedStatus=status;
        blockedUntil=now()+(status===432?planCooldownMs:rateCooldownMs);
      }
      throw err;
    });
    pendingProbe=first;
    try{return await first;}
    finally{if(pendingProbe===first)pendingProbe=null;}
  }
  return Object.freeze({run,snapshot:()=>Object.freeze({blocked:now()<blockedUntil,reason:now()<blockedUntil?(blockedStatus===432?'UPSTREAM_PLAN_LIMIT':'UPSTREAM_RATE_LIMIT'):null})});
}
