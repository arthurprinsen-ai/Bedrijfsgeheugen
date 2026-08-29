const ROLE_PERMISSIONS=Object.freeze({Beheerder:['read','write','approve','admin','ai'],Directie:['read','write','approve','ai'],Manager:['read','write','ai'],Medewerker:['read','ai'],Viewer:['read']});
export function effectivePermissions(user={}){return new Set(ROLE_PERMISSIONS[user.role]||[])}
export function canAccess({user={},object={},action='read'}){if(!user.tenant||!object.tenant)return false;if(user.tenant!==object.tenant)return false;const scopes=user.entityScopes||[];if(object.entity&&!scopes.includes('*')&&!scopes.includes(object.entity))return false;return effectivePermissions(user).has(action)}
export function filterAiContext(user,objects=[]){return objects.filter(object=>canAccess({user,object,action:'read'}))}
