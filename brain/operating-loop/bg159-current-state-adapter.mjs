const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`BG159 CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const number=value=>Number.isFinite(Number(value))?Number(value):0;

const mapState=state=>{
  switch(String(state||'').toLowerCase()){
    case 'active': return {health:'healthy',capacity:'available',executionStatus:'ready',error:null};
    case 'error': return {health:'unhealthy',capacity:'available',executionStatus:'blocked',error:'MAKE_SCENARIO_ERROR'};
    case 'paused': return {health:'degraded',capacity:'paused',executionStatus:'blocked',error:'MAKE_SCENARIO_PAUSED'};
    case 'inactive': return {health:'degraded',capacity:'inactive',executionStatus:'stopped',error:null};
    default: return {health:'unknown',capacity:'unknown',executionStatus:'unknown',error:'MAKE_SCENARIO_STATE_UNKNOWN'};
  }
};

export function createBg159CurrentStateInput({tenantId,executionId,snapshotAt,item,revision}={}){
  const tenant=required(tenantId,'tenantId');
  const execution=required(executionId,'executionId');
  const observedAt=required(snapshotAt,'snapshotAt');
  if(!item||!Number.isFinite(Number(item.id))) throw new TypeError('BG159 CurrentState adapter requires item.id');
  const scenarioId=Number(item.id);
  const component=String(item.brain?.component_id||`make:${scenarioId}`);
  const state=String(item.state||'unknown').toLowerCase();
  const mapped=mapState(state);
  const observedRevision=String(revision||item.lastEdit||'').trim()||null;

  return {
    tenantId:tenant,
    source:'make',
    id:`bg159-current-state:${scenarioId}:${execution}`,
    component,
    raw:{
      scenario_id:scenarioId,
      execution_id:execution,
      observed_at:observedAt,
      name:String(item.n||item.name||''),
      state,
      centicredits:number(item.c??item.centicredits),
      operations:number(item.o??item.operations),
      transfer:number(item.t??item.transfer),
      brain:item.brain||{}
    },
    observedAt,
    health:mapped.health,
    error:mapped.error,
    owner:'BG159',
    cost:number(item.c??item.centicredits)/100,
    revision:observedRevision,
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
