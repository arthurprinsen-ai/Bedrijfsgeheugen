import { createCanonicalObject, TRUTH_CLASSES, LIFECYCLE_STATES, VERIFICATION_STATES, FRESHNESS_STATES } from './canonical-object.mjs';

const requiredText=(value,name)=>{const text=String(value??'').trim();if(!text)throw new TypeError(`${name} is required`);return text};
const safePart=value=>String(value).trim().replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,120)||'unknown';
const cloneJson=value=>JSON.parse(JSON.stringify(value??{}));

export function portalBusinessInputId({inputType,modelId,instanceId='primary'}={}){
  return `PORTAL_INPUT-${safePart(requiredText(inputType,'inputType'))}-${safePart(requiredText(modelId,'modelId'))}-${safePart(requiredText(instanceId,'instanceId'))}`;
}

export function createPortalBusinessInput(input={}, {now=()=>new Date().toISOString()}={}){
  const tenantId=requiredText(input.tenantId,'tenantId');
  const userId=requiredText(input.userId,'userId');
  const inputType=requiredText(input.inputType,'inputType');
  const modelId=requiredText(input.modelId,'modelId');
  const instanceId=requiredText(input.instanceId??'primary','instanceId');
  const sourcePortal=requiredText(input.sourcePortal??'portal','sourcePortal');
  const schemaVersion=Number(input.schemaVersion??1);
  if(!Number.isInteger(schemaVersion)||schemaVersion<1)throw new TypeError('schemaVersion must be a positive integer');
  if(!input.answers||typeof input.answers!=='object'||Array.isArray(input.answers))throw new TypeError('answers must be an object');
  const submittedAt=requiredText(input.submittedAt??now(),'submittedAt');
  const answers=cloneJson(input.answers);
  const metadata=input.metadata&&typeof input.metadata==='object'&&!Array.isArray(input.metadata)?cloneJson(input.metadata):{};
  const id=portalBusinessInputId({inputType,modelId,instanceId});
  return createCanonicalObject({
    id,type:'BusinessInput',tenantId,truthClass:TRUTH_CLASSES.SOURCE_FACT,lifecycle:LIFECYCLE_STATES.ACTIVE,version:1,
    verification:VERIFICATION_STATES.UNVERIFIED,freshness:FRESHNESS_STATES.CURRENT,ownerId:userId,
    provenance:{sourceType:'PortalInput',sourceRef:`${sourcePortal}:${modelId}:${instanceId}`},
    data:{inputType,modelId,instanceId,schemaVersion,answers,metadata,sourcePortal,submittedBy:userId,submittedAt},
    createdAt:submittedAt,updatedAt:submittedAt
  });
}
