const transientSql=new Set(['57014','55P03','40001','40P01']);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Retry only the same computed assessment; never repeat an AI request here.
export async function persistUncertainCalibration({db,obligation,calibration,now=new Date(),wait=pause}){
 const revision=obligation?.payload?.forecast_revision;
 if(typeof revision!=='string'||!revision)throw new Error('CALIBRATION_FORECAST_REVISION_REQUIRED');
 const attemptedAt=now.toISOString();
 const dueAt=new Date(now.getTime()+7*86400000).toISOString();
 const patch={payload:{...obligation.payload,last_attempt_at:attemptedAt,last_result:'uncertain',last_reason:calibration.reason,last_confidence:calibration.confidence},due_at:dueAt,updated_at:attemptedAt};
 for(let attempt=0;attempt<2;attempt++){
  const {data,error}=await db.from('revenue_learning_obligations').update(patch)
   .eq('tenant_id','canonical').eq('obligation_id',obligation.obligation_id)
   .eq('status','OPEN').eq('payload->>forecast_revision',revision)
   .select('obligation_id,status,payload,due_at');
  if(error){
   const code=String(error.code||'UNKNOWN');
   if(attempt===0&&transientSql.has(code)){await wait(250);continue;}
   throw new Error('CALIBRATION_UNCERTAINTY_PERSIST_FAILED:'+code);
  }
  const row=Array.isArray(data)&&data.length===1?data[0]:null;
  if(!row||row.obligation_id!==obligation.obligation_id||row.status!=='OPEN'
   ||row.payload?.forecast_revision!==revision||row.payload?.last_result!=='uncertain'
   ||row.payload?.last_attempt_at!==attemptedAt||row.payload?.last_reason!==calibration.reason
   ||row.payload?.last_confidence!==calibration.confidence||Date.parse(row.due_at)!==Date.parse(dueAt)){
   throw new Error('CALIBRATION_UNCERTAINTY_NOT_ACKNOWLEDGED');
  }
  return row;
 }
}
