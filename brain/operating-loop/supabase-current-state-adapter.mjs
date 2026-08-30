const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`Supabase CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const mapOperationState=(status,errorCode)=>{
  const value=String(status||'').toLowerCase();
  if(['success','completed','ready'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'completed',error:null};
  if(['running','processing','pending','queued','in_progress'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'running',error:null};
  if(['cancelled','canceled','interrupted'].includes(value)) return {health:'degraded',capacity:'interrupted',executionStatus:'interrupted',error:'SUPABASE_OPERATION_INTERRUPTED'};
  if(['failed','error'].includes(value)){
    const suffix=errorCode===undefined||errorCode===null||String(errorCode).trim()===''?'':`:${String(errorCode).trim()}`;
    return {health:'unhealthy',capacity:'available',executionStatus:'failed',error:`SUPABASE_OPERATION_FAILED${suffix}`};
  }
  return {health:'unknown',capacity:'unknown',executionStatus:'unknown',error:'SUPABASE_OPERATION_STATE_UNKNOWN'};
};

export function createSupabaseCurrentStateInput({tenantId,table,rowId,updatedAt,operationStatus,operation,errorCode,revision}={}){
  const tenant=required(tenantId,'tenantId');
  const tableName=required(table,'table');
  const row=required(rowId,'rowId');
  const observedAt=required(updatedAt,'updatedAt');
  const status=String(operationStatus||'').toLowerCase();
  const mapped=mapOperationState(status,errorCode);

  return {
    tenantId:tenant,
    source:'supabase',
    id:`supabase-current-state:${tableName}:${row}`,
    component:`supabase:${tableName}`,
    raw:{
      table:tableName,
      row_id:row,
      updated_at:observedAt,
      operation:operation===undefined||operation===null?null:String(operation),
      operation_status:status,
      error_code:errorCode===undefined||errorCode===null?null:String(errorCode)
    },
    observedAt,
    health:mapped.health,
    error:mapped.error,
    owner:'supabase',
    cost:null,
    revision:revision===undefined||revision===null||String(revision).trim()===''?observedAt:String(revision).trim(),
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
