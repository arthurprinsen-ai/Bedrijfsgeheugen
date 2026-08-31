const list=v=>Array.isArray(v)?v.map(String):[];
const clean=v=>String(v??'').trim();
export function principalFromUser(user,tenantId){
  const roles=list(user?.roles||user?.appMetadata?.roles||user?.app_metadata?.roles);
  const attributes={...(user?.appMetadata?.attributes||user?.app_metadata?.attributes||{})};
  return Object.freeze({userId:clean(user?.id),tenantId:clean(tenantId),roles:Object.freeze(roles),attributes:Object.freeze(attributes)});
}
export function canAccessRecord(record,principal){
  if(!record||!principal?.tenantId||String(record.tenantId)!==String(principal.tenantId)) return false;
  const access=record?.payload?.access;
  if(!access||access.visibility===undefined||access.visibility==='tenant') return true;
  if(access.visibility==='private') return list(access.users).includes(String(principal.userId));
  if(access.visibility!=='restricted') return false;
  const users=list(access.users),roles=list(access.roles);
  if(users.includes(String(principal.userId))) return true;
  if(roles.some(role=>list(principal.roles).includes(role))) return true;
  const required=access.attributes&&typeof access.attributes==='object'?access.attributes:{};
  const keys=Object.keys(required);
  return keys.length>0&&keys.every(key=>String(principal.attributes?.[key]??'')===String(required[key]));
}
export function filterAuthorizedRecords(records,principal){return (Array.isArray(records)?records:[]).filter(record=>canAccessRecord(record,principal));}
export function assertCanWriteRecord(record,principal){
  if(!canAccessRecord(record,principal)){const error=new Error('OBJECT_ACCESS_DENIED');error.code='OBJECT_ACCESS_DENIED';throw error;}
  return true;
}
