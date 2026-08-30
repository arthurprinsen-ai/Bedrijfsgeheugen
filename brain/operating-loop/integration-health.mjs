const clean=v=>v===undefined||v===null?'':String(v).trim();
const numberOrNull=v=>Number.isFinite(Number(v))?Number(v):null;
const blockedCapacity=new Set(['paused','quota_exceeded']);

function telemetryOf(record){
  const integration=record?.payload?.integration;
  if(!integration||typeof integration!=='object') return null;
  const platform=clean(integration.platform).toLowerCase();
  const component=clean(integration.component);
  if(!platform||!component) return null;
  const observedAt=clean(record.observedAt||integration.freshness||integration.last_verified_at);
  return Object.freeze({
    platform,
    component,
    health:clean(integration.health)||'unknown',
    freshness:clean(integration.freshness)||observedAt||null,
    error:integration.error??null,
    owner:clean(integration.owner||record.owner)||'UNASSIGNED',
    cost:numberOrNull(integration.cost),
    revision:clean(integration.revision)||null,
    capacity:clean(integration.capacity)||'unknown',
    execution_status:clean(integration.execution_status)||'unknown',
    last_verified_at:clean(integration.last_verified_at)||null,
    observedAt:observedAt||null,
    source:clean(record?.provenance?.source)||platform,
    sourceId:clean(record?.provenance?.sourceId)||clean(record?.id)||null
  });
}

export function projectIntegrationHealth(records=[]){
  const latest=new Map();
  for(const record of records){
    if(record?.kind!=='current_state'&&record?.type!=='CurrentState') continue;
    const item=telemetryOf(record);if(!item) continue;
    const key=`${item.platform}:${item.component}`;
    const previous=latest.get(key);
    if(!previous||String(item.observedAt||'').localeCompare(String(previous.observedAt||''))>=0) latest.set(key,item);
  }
  const components=[...latest.values()].sort((a,b)=>a.platform.localeCompare(b.platform)||a.component.localeCompare(b.component));
  const isBlocked=x=>x.execution_status==='blocked'||blockedCapacity.has(x.capacity)||x.health==='blocked';
  const summary=components.reduce((acc,item)=>{
    acc.total+=1;
    if(item.health==='healthy') acc.healthy+=1;
    else if(item.health==='degraded') acc.degraded+=1;
    else if(item.health==='unknown') acc.unknown+=1;
    if(isBlocked(item)) acc.blocked+=1;
    if(item.cost!==null) acc.totalCost+=item.cost;
    return acc;
  },{total:0,healthy:0,degraded:0,blocked:0,unknown:0,totalCost:0});
  return Object.freeze({schemaVersion:'brain-integration-health.v1',components:Object.freeze(components),summary:Object.freeze(summary)});
}
