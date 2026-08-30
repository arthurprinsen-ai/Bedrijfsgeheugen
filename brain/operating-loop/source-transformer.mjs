import {readFileSync} from 'node:fs';

const registry=JSON.parse(readFileSync(new URL('../../config/brain-source-mappings.json',import.meta.url),'utf8'));
const clean=v=>v===undefined||v===null?'':String(v).trim();

export function transformSourceRecord(input){
  const source=clean(input?.source).toLowerCase();
  const mapping=registry.sources?.[source];
  if(!mapping){const e=new Error(`Unknown Brain source: ${source||'empty'}`);e.code='UNKNOWN_BRAIN_SOURCE';throw e;}
  const canonicalType=clean(input?.canonicalType);
  if(!mapping.canonical_types.includes(canonicalType)){const e=new Error(`${source} may not emit ${canonicalType}`);e.code='SOURCE_TYPE_NOT_ALLOWED';throw e;}
  if(!input?.tenantId||!input?.id) throw new TypeError('source transform requires tenantId and id');
  const raw=input.raw&&typeof input.raw==='object'?input.raw:{};
  const identity=(mapping.identity_fields||[]).map(field=>clean(raw[field])).filter(Boolean);
  if(identity.length!==(mapping.identity_fields||[]).length){const e=new Error(`${source} source identity incomplete`);e.code='SOURCE_IDENTITY_INCOMPLETE';throw e;}
  const sourceId=identity.join(':');
  const observedAt=clean(raw[mapping.freshness_field])||input.observedAt||new Date().toISOString();
  return {
    tenantId:String(input.tenantId),type:canonicalType,id:String(input.id),subjectId:input.subjectId,
    owner:input.owner,status:input.status,executed:input.executed===true,verified:input.verified===true,
    result:input.result??null,evidenceIds:Array.isArray(input.evidenceIds)?input.evidenceIds:[],
    decisionId:input.decisionId,actionId:input.actionId,outcomeId:input.outcomeId,
    source,sourceId,observedAt,
    payload:{...(input.payload||{}),raw,mappingVersion:mapping.mapping_version,sourceIdentity:sourceId}
  };
}

export function sourceMappingRegistry(){return structuredClone(registry);}
