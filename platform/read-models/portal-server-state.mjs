import { PORTAL_LAYERS } from './portal-projection-layers.mjs';
const ALLOWED_KEYS=Object.freeze(['company','period','managementSummary','healthCards','roadmap','recommendedActions','monthlyImpact','activities','integrationStatus','quickLinks','graph','signals','decisions','actions','valueItems','memories','agents','audit','admin','legacyInputs','sourceMeta']);
const cleanText=v=>typeof v==='string'?v.trim():'';
export function resolveIdentityTenant(user){
  if(!user?.id) return null;
  const configured=cleanText(user?.appMetadata?.tenantId||user?.app_metadata?.tenantId);
  return configured||`user:${user.id}`;
}
export function sanitizePortalProjection(state,{tenantId,userId,origin=PORTAL_LAYERS.LEGACY,now=()=>new Date().toISOString()}={}){
  if(!tenantId||!userId) throw new TypeError('tenantId and userId are required');
  if(!Object.values(PORTAL_LAYERS).includes(origin)) throw new TypeError('portal projection origin is invalid');
  const source=state&&typeof state==='object'?state:{};
  const data={};
  for(const key of ALLOWED_KEYS){if(source[key]!==undefined)data[key]=source[key]}
  delete data.user;
  const writtenAt=now();
  const sourceUpdatedAt=cleanText(source?.sourceMeta?.updatedAt)||cleanText(source?.company?.lastSync)||writtenAt;
  const canonical=origin===PORTAL_LAYERS.CANONICAL;
  data.sourceMeta={...(data.sourceMeta||{}),kind:origin,live:true,label:canonical?'Canonical Brain projectie':'Bestaande portaaldata · migratielaag',updatedAt:sourceUpdatedAt};
  return Object.freeze({schemaVersion:2,tenantId,origin,updatedBy:userId,updatedAt:writtenAt,sourceUpdatedAt,data:Object.freeze(data)});
}
export function portalProjectionToState(record,user){
  if(!record?.data) return null;
  return {...record.data,user:{name:user?.name||user?.userMetadata?.full_name||user?.email||'Gebruiker',email:user?.email||'',role:Array.isArray(user?.roles)?user.roles.join(', '):''},sourceMeta:{...(record.data.sourceMeta||{}),kind:record.data.sourceMeta?.kind||'server',live:true,updatedAt:record.sourceUpdatedAt||record.data.sourceMeta?.updatedAt||record.updatedAt||''}};
}
export function shouldReplaceProjection(current,next){
  if(!current) return true;
  const a=Date.parse(current.sourceUpdatedAt||current.data?.sourceMeta?.updatedAt||current.updatedAt||0)||0;
  const b=Date.parse(next.sourceUpdatedAt||next.data?.sourceMeta?.updatedAt||next.updatedAt||0)||0;
  return b>a;
}
