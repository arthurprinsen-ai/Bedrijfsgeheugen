import { createHash } from 'node:crypto';
import { resolveIdentityTenant, sanitizePortalProjection } from '../read-models/portal-server-state.mjs';
import { PORTAL_LAYERS, projectCanonicalObject } from '../read-models/portal-projection-layers.mjs';
import { createPortalBusinessInput } from '../contracts/portal-business-input.mjs';

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
    const brainRecordId=`PORTAL_INPUT_RECORD-${sourceRevision}`;
    const authorityRecord={schemaVersion:'brain-record.v1',tenantId,type:'BusinessInput',kind:object.truthClass,id:brainRecordId,subjectId:object.id,correlationId:`PORTAL_INPUT-${sourceRevision}`,predecessorIds:[],owner:user.id,status:'OBSERVED',observedAt:object.data.submittedAt,executed:false,verified:false,result:null,evidenceIds:[],provenance:object.provenance,payload:{...object.data,canonicalObjectId:object.id,truthClass:object.truthClass,sourceRevision}};
    let authorityResult;
    try{authorityResult=await authority.append({record:authorityRecord,idempotencyKey:`portal-business-input:${sourceRevision}`,sourceRevision,request});}
    catch(error){return json({error:'CANONICAL_AUTHORITY_WRITE_FAILED',message:error instanceof Error?error.message:String(error)},502)}

    const current=await store.getLayer(tenantId,PORTAL_LAYERS.CANONICAL);
    const projectionObject={...object,data:{...object.data,metadata:{...object.data.metadata,brainRecordId,sourceRevision}}};
    const projected=projectCanonicalObject(current?.data||current||{},projectionObject);
    const canonical=sanitizePortalProjection(projected,{tenantId,userId:user.id,origin:PORTAL_LAYERS.CANONICAL,now});
    let result;
    try{result=await store.putCanonical(tenantId,canonical);}
    catch(error){return json({error:'CANONICAL_PROJECTION_WRITE_FAILED',authorityStored:true,brainRecordId,sourceRevision,message:error instanceof Error?error.message:String(error)},502)}
    const record=result?.record||canonical;
    return json({stored:Boolean(result?.stored),stale:Boolean(result?.stale),authorityStored:true,authority:authorityResult?.authority||'supabase:brain_records',brainRecordId,objectId:object.id,truthClass:object.truthClass,sourceRevision,sourceUpdatedAt:record.sourceUpdatedAt});
  };
}
