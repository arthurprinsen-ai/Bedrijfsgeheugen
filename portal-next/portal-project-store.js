import {normalizePortalProject} from './portal-project-model.js';

export async function loadPortalProject({fetchFn=globalThis.fetch,endpoint='/api/portal-project'}={}){
  if(typeof fetchFn!=='function')return {state:'error',project:null,error:'Fetch niet beschikbaar'};
  try{
    const response=await fetchFn(endpoint,{method:'GET',headers:{accept:'application/json'},credentials:'same-origin'});
    if(response.status===401)return {state:'unauthorized',project:null,error:null};
    if(response.status===403){
      const payload=await response.json().catch(()=>({}));
      if(payload?.error==='TENANT_NOT_CONFIGURED')return {state:'tenant-unconfigured',project:null,error:'TENANT_NOT_CONFIGURED'};
      return {state:'unauthorized',project:null,error:null};
    }
    if(response.status===404)return {state:'empty',project:null,error:null};
    if(!response.ok)return {state:'error',project:null,error:`Projectdata kon niet worden geladen (${response.status})`};
    const payload=await response.json();
    return {state:'ready',project:normalizePortalProject(payload),error:null};
  }catch(error){
    return {state:'error',project:null,error:error instanceof Error?error.message:String(error||'Onbekende fout')};
  }
}
