import { createHash } from 'node:crypto';
import { resolveIdentityTenant, sanitizePortalProjection } from '../read-models/portal-server-state.mjs';
import { PORTAL_LAYERS, projectCanonicalObject } from '../read-models/portal-projection-layers.mjs';
import { createPortalBusinessInput } from '../contracts/portal-business-input.mjs';
import { buildOrganismImpactRecord, buildRawSourceObservation } from '../organism/change-propagation.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const sha256=value=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

export function createPortalBusinessInputHandler({getUser,store,authority,maxBytes=750_000,now=()=>new Date().toISOString()}={}){
  if(typeof getUser!=='function')throw new TypeError('getUser is required');
  if(!store?.getLayer||!store?.putCanonical)throw new TypeError('store getLayer/putCanonical are required');
  if(!authority?.append)throw new TypeError('authority.append is required');
  return async function handle(request){
    if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const user=await getUser();
    if(!user?.id)return json({error:'UNAUTHORIZED'},401);
    const tenantId=resolveIdentityTenant(user);
    if(!tenantId)return json({error:'FORBIDDEN'},403);
    const declared=Number(request.headers.get('content-length')||0);
    if(declared>maxBytes)return json({error:'PAYLOAD_TOO_LARGE'},413);
    let body;
    try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
    const measured=new TextEncoder().encode(JSON.stringify(body)).byteLength;
    if(measured>maxBytes)return json({error:'PAYLOAD_TOO_LARGE'},413);
    let object;
    try{object=createPortalBusinessInput({...body,tenantId,userId:user.id,submittedAt:body?.submittedAt||now()},{now});}
    catch(error){return json({error:'INVALID_PORTAL_INPUT',message:error instanceof Error?error.message:String(error)},400)}

    const revisionPayload={inputType:object.data.inputType,modelId:object.data.modelId,instanceId:object.data.instanceId,schemaVersion:object.data.schemaVersion,answers:object.data.answers,metadata:object.data.metadata,sourcePortal:object.data.sourcePortal};
    const sourceRevision=sha256(revisionPayload);
    const rawSourceObservation=buildRawSourceObservation({tenantId,userId:user.id,object,sourceRevision,rawInput:body,now:object.data.submittedAt});
    try{await authority.append({record:rawSourceObservation,idempotencyKey:'portal-raw-source:'+rawSourceObservation.payload.rawSourceRevision,sourceRevision:rawSourceObservation.payload.rawSourceRevision,request});}
    catch(error){return json({error:'RAW_SOURCE_WRITE_FAILED',message:error instanceof Error?error.message:String(error)},502)}
    const brainRecordId=`PORTAL_INPUT_RECORD-${sourceRevision}`;
    const authorityRecord={schemaVersion:'brain-record.v1',tenantId,type:'BusinessInput',kind:object.truthClass,id:brainRecordId,subjectId:object.id,correlationId:`PORTAL_INPUT-${sourceRevision}`,predecessorIds:[],owner:user.id,status:'OBSERVED',observedAt:object.data.submittedAt,executed:false,verified:false,result:null,evidenceIds:[],provenance:object.provenance,payload:{...object.data,canonicalObjectId:object.id,truthClass:object.truthClass,sourceRevision}};
    let authorityResult;
    try{authorityResult=await authority.append({record:authorityRecord,idempotencyKey:`portal-business-input:${sourceRevision}`,sourceRevision,request});}
    catch(error){return json({error:'CANONICAL_AUTHORITY_WRITE_FAILED',message:error instanceof Error?error.message:String(error)},502)}

    const currentStateRecordId=`PORTAL_CURRENT_STATE-${sourceRevision}`;
    const currentStateRecord={schemaVersion:'brain-record.v1',tenantId,type:'CurrentState',kind:'current_state',id:currentStateRecordId,subjectId:object.id,correlationId:authorityRecord.correlationId,predecessorIds:[brainRecordId],owner:user.id,status:'OBSERVED',observedAt:object.data.submittedAt,executed:false,verified:false,result:null,evidenceIds:[brainRecordId],provenance:{...object.provenance,source:'portal-business-input',sourceId:brainRecordId},payload:{sourceRecordId:brainRecordId,sourceRevision,inputType:object.data.inputType,modelId:object.data.modelId,instanceId:object.data.instanceId,schemaVersion:object.data.schemaVersion,answers:object.data.answers,metadata:object.data.metadata,sourcePortal:object.data.sourcePortal,stateType:'PortalBusinessInput'}};
    try{await authority.append({record:currentStateRecord,idempotencyKey:`portal-business-current-state:${sourceRevision}`,sourceRevision,request});}
    catch(error){return json({error:'POWERHOUSE_FEED_WRITE_FAILED',authorityStored:true,powerhouseFeedStored:false,brainRecordId,currentStateRecordId,sourceRevision,message:error instanceof Error?error.message:String(error)},502)}

    const organism=buildOrganismImpactRecord({tenantId,userId:user.id,object,sourceRevision,rawInput:body,brainRecordId,currentStateRecordId,now:object.data.submittedAt});
    try{await authority.append({record:organism.record,idempotencyKey:'portal-organism-impact:'+sourceRevision,sourceRevision,request});}
    catch(error){return json({error:'ORGANISM_IMPACT_WRITE_FAILED',authorityStored:true,powerhouseFeedStored:true,brainRecordId,currentStateRecordId,sourceRevision,message:error instanceof Error?error.message:String(error)},502)}

    const current=await store.getLayer(tenantId,PORTAL_LAYERS.CANONICAL);
    const projectionObject={...object,data:{...object.data,metadata:{...object.data.metadata,brainRecordId,currentStateRecordId,sourceRevision,rawSourceObservationId:rawSourceObservation.id,rawSourceRevision:rawSourceObservation.payload.rawSourceRevision,organismImpactRecordId:organism.impactRecordId,organismGraphVersion:organism.effects.version,organismDomains:[...organism.effects.recomputeDomains]}}};
    const projected=projectCanonicalObject(current?.data||current||{},projectionObject);
    const canonical=sanitizePortalProjection(projected,{tenantId,userId:user.id,origin:PORTAL_LAYERS.CANONICAL,now});
    let result;
    try{result=await store.putCanonical(tenantId,canonical);}
    catch(error){return json({error:'CANONICAL_PROJECTION_WRITE_FAILED',authorityStored:true,powerhouseFeedStored:true,brainRecordId,currentStateRecordId,sourceRevision,message:error instanceof Error?error.message:String(error)},502)}
    const record=result?.record||canonical;
    return json({stored:Boolean(result?.stored),stale:Boolean(result?.stale),authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,rawSourceObservationId:rawSourceObservation.id,organismImpactRecordId:organism.impactRecordId,organismDomains:[...organism.effects.recomputeDomains],authority:authorityResult?.authority||'supabase:brain_records',brainRecordId,currentStateRecordId,objectId:object.id,truthClass:object.truthClass,sourceRevision,sourceUpdatedAt:record.sourceUpdatedAt});
  };
}
