const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const nowIso=()=>new Date().toISOString();

function downloadJson(payload,fileName){
 if(!globalThis.document||!globalThis.URL)return payload;
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);return payload;
}

export function exportPortalState(state={}){
 const payload={version:4,exportedAt:nowIso(),state:clone(state)};
 return downloadJson(payload,`bedrijfsgeheugen-portaal-${new Date().toISOString().slice(0,10)}.json`);
}

function migrateV2Storage(payload,currentState={}){
 const storage=isObject(payload?.storage)?payload.storage:{};
 const next=clone(currentState)||{};
 const brand=String(storage['bg-v2-brand']||'').trim();
 if(brand)next.company={...(next.company||{}),portalBrand:{...((next.company||{}).portalBrand||{}),name:brand}};
 let feedback=[];try{feedback=JSON.parse(storage['bg-v2-feedback']||'[]')}catch{}
 if(Array.isArray(feedback)&&feedback.length){
  next.memories=[...(Array.isArray(next.memories)?next.memories:[]),...feedback.filter(x=>x?.text).map((x,index)=>({id:`legacy-feedback-${index}-${Date.parse(x.at||0)||index}`,type:'feedback',title:'Geïmporteerde feedback',text:String(x.text),createdAt:x.at||''}))];
 }
 return next;
}

export async function stagePortalImport(file,{currentState={}}={}){
 if(!file?.text)throw new Error('IMPORT_FILE_REQUIRED');
 let payload;try{payload=JSON.parse(await file.text())}catch{throw new Error('INVALID_JSON')}
 let candidate,kind;
 if(Number(payload?.version)===4&&isObject(payload?.state)){candidate=clone(payload.state);kind='canonical-v4'}
 else if(Number(payload?.version)===2&&isObject(payload?.storage)){candidate=migrateV2Storage(payload,currentState);kind='portal-v2-storage-v2'}
 else throw new Error('UNSUPPORTED_PORTAL_BACKUP');
 const importId=globalThis.crypto?.randomUUID?.()||`import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 candidate.sourceMeta={...(candidate.sourceMeta||{}),updatedAt:nowIso(),importId,label:'Geïmporteerde Portal V2-back-up'};
 return Object.freeze({kind,importId,fileName:file.name||'portaal-backup.json',candidate,preview:{company:candidate?.company?.name||candidate?.company?.portalBrand?.name||'',actions:Array.isArray(candidate?.actions)?candidate.actions.length:0,roadmap:Array.isArray(candidate?.roadmap)?candidate.roadmap.length:0,memories:Array.isArray(candidate?.memories)?candidate.memories.length:0}});
}

export async function applyStagedPortalImport(staged,{stateClient}={}){
 if(!staged?.candidate||!staged?.importId)throw new Error('IMPORT_NOT_STAGED');
 if(!stateClient?.write)throw new Error('PORTAL_STATE_CLIENT_REQUIRED');
 const result=await stateClient.write(staged.candidate);
 const verified=result?.state;
 if(result?.mode!=='authenticated'||verified?.sourceMeta?.importId!==staged.importId)throw new Error('IMPORT_READBACK_FAILED');
 return result;
}

function userRoles(user){
 const roleValues=[user?.app_metadata?.roles,user?.appMetadata?.roles,user?.roles,user?.app_metadata?.role,user?.appMetadata?.role].flat().filter(Boolean);
 return roleValues.flatMap(value=>String(value).split(/[ ,;]+/)).map(x=>x.toLowerCase());
}
export function canPrintPortalReport(user){
 const permissions=[...(user?.app_metadata?.permissions||[]),...(user?.appMetadata?.permissions||[])].map(String);
 if(permissions.includes('portal:print'))return true;
 return userRoles(user).some(role=>['administrator','admin','owner','auditor','manager','beheerder'].includes(role));
}
export function printPortalReport({user,printImpl=globalThis.window?.print?.bind(globalThis.window)}={}){
 if(!canPrintPortalReport(user))throw new Error('PRINT_PERMISSION_REQUIRED');
 if(typeof printImpl!=='function')throw new Error('PRINT_UNAVAILABLE');
 printImpl();return true;
}

async function identityHeaders(user){
 if(!user)throw new Error('AUTH_REQUIRED');
 let token='';try{token=await user.jwt?.()||''}catch{}
 if(!token)throw new Error('AUTH_TOKEN_UNAVAILABLE');
 return{authorization:`Bearer ${token}`,'content-type':'application/json',accept:'application/json'};
}
export async function submitPortalFeedback({text,context={},user,fetchImpl=globalThis.fetch}={}){
 const clean=String(text||'').trim();if(!clean)throw new Error('FEEDBACK_REQUIRED');if(clean.length>2000)throw new Error('FEEDBACK_TOO_LONG');
 const headers=await identityHeaders(user);
 const response=await fetchImpl('/api/portal-feedback',{method:'POST',headers,credentials:'same-origin',body:JSON.stringify({text:clean,context})});
 const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body?.error||`FEEDBACK_${response.status}`);return body;
}

export async function updateCustomerBrand({name,stateClient}={}){
 const clean=String(name||'').trim();if(!clean)throw new Error('CUSTOMER_BRAND_REQUIRED');if(clean.length>120)throw new Error('CUSTOMER_BRAND_TOO_LONG');
 const snap=stateClient?.getSnapshot?.();if(snap?.mode!=='authenticated')throw new Error('AUTH_REQUIRED');
 const candidate=clone(snap.state)||{};candidate.company={...(candidate.company||{}),portalBrand:{...((candidate.company||{}).portalBrand||{}),name:clean}};candidate.sourceMeta={...(candidate.sourceMeta||{}),updatedAt:nowIso(),brandEditId:globalThis.crypto?.randomUUID?.()||`brand-${Date.now()}`};
 return stateClient.write(candidate);
}

export async function logoutPortalUser({identity=globalThis.window?.netlifyIdentity}={}){
 if(!identity?.currentUser?.())throw new Error('NO_ACTIVE_SESSION');
 await identity.logout();return true;
}
