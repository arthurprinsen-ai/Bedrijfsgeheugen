const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`DataForSEO CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const mapTaskState=(state)=>{
  const value=String(state||'').toLowerCase();
  if(['completed','ready','success'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'completed',error:null};
  if(['processing','running','queued','pending','in_progress'].includes(value)) return {health:'healthy',capacity:'available',executionStatus:'running',error:null};
  if(['cancelled','canceled'].includes(value)) return {health:'degraded',capacity:'interrupted',executionStatus:'interrupted',error:'DATAFORSEO_TASK_CANCELLED'};
  if(['failed','error'].includes(value)) return {health:'unhealthy',capacity:'available',executionStatus:'failed',error:'DATAFORSEO_TASK_FAILED'};
  return {health:'unknown',capacity:'unknown',executionStatus:'unknown',error:'DATAFORSEO_TASK_STATE_UNKNOWN'};
};

export function createDataForSeoCurrentStateInput({tenantId,taskId,keyword,locationCode,taskState,observedAt,resultCount,errorMessage}={}){
  const tenant=required(tenantId,'tenantId');
  const task=required(taskId,'taskId');
  const query=required(keyword,'keyword');
  const location=required(locationCode,'locationCode');
  const observed=required(observedAt,'observedAt');
  const state=String(taskState||'').toLowerCase();
  const mapped=mapTaskState(state);

  return {
    tenantId:tenant,
    source:'dataforseo',
    id:`dataforseo-current-state:${task}:${location}:${query}`,
    component:`dataforseo:${location}:${query}`,
    raw:{
      task_id:task,
      keyword:query,
      location_code:location,
      observed_at:observed,
      task_state:state,
      result_count:Number.isFinite(Number(resultCount))?Number(resultCount):null,
      error_message:errorMessage===undefined||errorMessage===null?null:String(errorMessage)
    },
    observedAt:observed,
    health:mapped.health,
    error:mapped.error,
    owner:'dataforseo',
    cost:null,
    revision:task,
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
