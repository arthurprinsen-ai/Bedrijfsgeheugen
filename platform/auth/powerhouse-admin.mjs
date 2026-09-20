const list=v=>Array.isArray(v)?v.map(x=>String(x).trim().toLowerCase()).filter(Boolean):[];
const split=v=>String(v??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);

export const POWERHOUSE_ADMIN_ROLES=Object.freeze(['admin','owner','powerhouse-admin','powerhouse_admin']);

export function isPowerhouseAdmin(user,{allowedEmails=''}={}){
  if(!user?.id)return false;
  const roles=list(user.roles||user.appMetadata?.roles||user.app_metadata?.roles);
  if(roles.some(role=>POWERHOUSE_ADMIN_ROLES.includes(role)))return true;
  const email=String(user.email||'').trim().toLowerCase();
  return Boolean(email&&split(allowedEmails).includes(email));
}
