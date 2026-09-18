import { createHash } from 'node:crypto';
import { deriveOrganismEffects } from './organism-graph.mjs';
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const sha256=value=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const clone=value=>structuredClone(value);
export function buildOrganismImpactRecord({tenantId,userId,object,sourceRevision,rawInput,brainRecordId,currentStateRecordId,now=new Date().toISOString()}={}){
 if(!tenantId||!userId||!object?.id||!sourceRevision)throw new TypeError('organism impact requires tenant, user, object and source revision');
 const rawSourceRevision=sha256(rawInput??{}),effects=deriveOrganismEffects({inputType:object.data?.inputType,modelId:object.data?.modelId,statePath:object.data?.metadata?.statePath}),id='PORTAL_ORGANISM_IMPACT-'+sourceRevision;
 return Object.freeze({record:Object.freeze({schemaVersion:'brain-record.v1',tenantId,type:'ImpactAssessment',kind:'organism_impact',id,subjectId:object.id,correlationId:'PORTAL_INPUT-'+sourceRevision,predecessorIds:[currentStateRecordId].filter(Boolean),owner:userId,status:'OBSERVED',observedAt:object.data?.submittedAt||now,executed:false,verified:false,result:null,evidenceIds:[brainRecordId,currentStateRecordId].filter(Boolean),provenance:{...object.provenance,source:'powerhouse-organism',sourceId:brainRecordId},payload:{graphVersion:effects.version,sourceRevision,rawSourceRevision,inputType:object.data?.inputType,modelId:object.data?.modelId,startNodes:clone(effects.startNodes),impacts:clone(effects.impacts),recomputeDomains:clone(effects.recomputeDomains),interpretationPolicy:'SOURCE_FACTS_IMMUTABLE_DERIVATIONS_RECOMPUTABLE'}}),effects,rawSourceRevision,impactRecordId:id});
}
export function buildRawSourceObservation({tenantId,userId,object,sourceRevision,rawInput,now=new Date().toISOString()}={}){
 const rawSourceRevision=sha256(rawInput??{}),id='PORTAL_RAW_SOURCE-'+rawSourceRevision;
 return Object.freeze({schemaVersion:'brain-record.v1',tenantId,type:'SourceObservation',kind:'raw_source',id,subjectId:object.id,correlationId:'PORTAL_INPUT-'+sourceRevision,predecessorIds:[],owner:userId,status:'OBSERVED',observedAt:object.data?.submittedAt||now,executed:false,verified:false,result:null,evidenceIds:[],provenance:{...object.provenance,source:'portal-business-input-raw',sourceId:id},payload:{rawInput:clone(rawInput??{}),rawSourceRevision,normalizedSourceRevision:sourceRevision,immutable:true}});
}
