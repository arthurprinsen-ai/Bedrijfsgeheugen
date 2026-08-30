import { normalizeBrainRecord } from './model.mjs';
import { transformSourceRecord } from './source-transformer.mjs';

const required=(input,key)=>{
  const value=input?.[key];
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`Integration CurrentState requires ${key}`);
  return String(value).trim();
};

const integrationPayload=(input,{platform,component,observedAt})=>{
  const verified=input.verified===true;
  return {
    platform,
    component,
    health:input.health||'unknown',
    freshness:input.freshness||observedAt,
    error:input.error??null,
    owner:input.owner||'UNASSIGNED',
    cost:Number.isFinite(Number(input.cost))?Number(input.cost):null,
    revision:input.revision??null,
    capacity:input.capacity||'unknown',
    execution_status:input.executionStatus||input.execution_status||'unknown',
    last_verified_at:verified?(input.lastVerifiedAt||input.last_verified_at||observedAt):(input.lastVerifiedAt||input.last_verified_at||null)
  };
};

export function createIntegrationCurrentState(input={}){
  const tenantId=required(input,'tenantId');
  const platform=required(input,'platform').toLowerCase();
  const component=required(input,'component');
  const observedAt=input.observedAt||new Date().toISOString();
  const sourceId=String(input.sourceId||`${platform}:${component}:${observedAt}`);
  const id=String(input.id||`current-state:${platform}:${component}:${sourceId}`);
  return normalizeBrainRecord({
    tenantId,
    type:'CurrentState',
    id,
    subjectId:`integration:${platform}:${component}`,
    owner:input.owner||'UNASSIGNED',
    status:input.status||'OBSERVED',
    observedAt,
    executed:false,
    verified:input.verified===true,
    source:platform,
    sourceId,
    payload:{integration:integrationPayload(input,{platform,component,observedAt})}
  });
}

export function createIntegrationCurrentStateFromSource(input={}){
  const tenantId=required(input,'tenantId');
  const source=required(input,'source').toLowerCase();
  const component=required(input,'component');
  const id=required(input,'id');
  const transformed=transformSourceRecord({
    tenantId,
    source,
    canonicalType:'CurrentState',
    id,
    subjectId:`integration:${source}:${component}`,
    owner:input.owner||'UNASSIGNED',
    status:input.status||'OBSERVED',
    executed:false,
    verified:input.verified===true,
    raw:input.raw,
    observedAt:input.observedAt
  });
  return normalizeBrainRecord({
    ...transformed,
    payload:{
      ...transformed.payload,
      integration:integrationPayload(input,{platform:source,component,observedAt:transformed.observedAt})
    }
  });
}
