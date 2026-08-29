import {createCanonicalObject,TRUTH_CLASSES,LIFECYCLE_STATES,VERIFICATION_STATES,FRESHNESS_STATES} from '../contracts/canonical-object.mjs';

function assertRuntime(runtime){for(const m of ['ingest','analyze','recordDecision','executeChange','verifyAndLearn','selfHeal','snapshot'])if(typeof runtime?.[m]!=='function')throw new TypeError(`runtime.${m} is required`);return runtime}
function assertProjector(projector){if(typeof projector?.project!=='function')throw new TypeError('projector.project is required');return projector}
function learningObject(record,{sourceRef='brain-runtime'}={}){if(!record?.id||!record?.tenantId)return null;const at=record.recordedAt||new Date().toISOString();return createCanonicalObject({id:record.id,type:'Learning',tenantId:record.tenantId,truthClass:TRUTH_CLASSES.DERIVED_TRUTH,lifecycle:LIFECYCLE_STATES.ACTIVE,version:1,verification:VERIFICATION_STATES.VERIFIED,freshness:FRESHNESS_STATES.CURRENT,provenance:{sourceType:'BrainLearning',sourceRef},data:{...record},createdAt:at,updatedAt:at})}
function projectionError(error,object,result){const wrapped=new Error(`Portal projection failed for ${object?.type||'object'} ${object?.id||'unknown'}: ${error?.message||'unknown error'}`);wrapped.code='PORTAL_PROJECTION_FAILED';wrapped.objectId=object?.id||null;wrapped.tenantId=object?.tenantId||null;wrapped.cause=error;wrapped.mutationResult=result;return wrapped}
export function createProjectedBrainRuntime({runtime,projector}={}){
 assertRuntime(runtime);assertProjector(projector);
 async function projectOne(object,result){if(!object)return null;try{const outcome=await projector.project(object);if(outcome?.stored===false&&outcome?.stale!==true)throw new Error('projection was not stored');return outcome}catch(error){throw projectionError(error,object,result)}}
 async function projectMany(objects,result){const outcomes=[];for(const object of objects.filter(Boolean))outcomes.push(await projectOne(object,result));return outcomes}
 return Object.freeze({
  async ingest(...args){const result=runtime.ingest(...args);await projectOne(result?.object,result);return result},
  async analyze(...args){const result=await runtime.analyze(...args);await projectOne(result?.recommendation,result);return result},
  async recordDecision(...args){const result=runtime.recordDecision(...args);await projectMany([result?.decision,result?.change],result);return result},
  async executeChange(...args){const result=await runtime.executeChange(...args);await projectOne(result?.change,result);return result},
  async verifyAndLearn(...args){const result=runtime.verifyAndLearn(...args);await projectMany([result?.change,learningObject(result?.learning,{sourceRef:result?.change?.id||'verification'})],result);return result},
  async selfHeal(...args){const result=await runtime.selfHeal(...args);if(result?.state==='Resolved')await projectOne(learningObject(result?.learning,{sourceRef:result?.learning?.failureId||'self-heal'}),result);return result},
  snapshot(){return runtime.snapshot()},
  async reconcile(objects=[]){const result={reconciled:true,count:objects.length};return projectMany(objects,result)},
  raw:runtime,
 });
}
