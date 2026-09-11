const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});

export function createNotionCompanySyncHandler({getUser,resolveTenant,store,sync}={}){
  if(typeof getUser!=='function'||typeof resolveTenant!=='function'||typeof store?.getProjection!=='function'||typeof sync!=='function') throw new TypeError('Notion sync handler dependencies are required');
  return async request=>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const user=await getUser(request);
    if(!user?.id) return reply({status:'UNAUTHENTICATED',error:'UNAUTHENTICATED'},401);
    const tenantId=resolveTenant(user);
    if(!tenantId) return reply({status:'BLOCKED',error:'TENANT_UNRESOLVED'},403);
    try{
      const projection=await store.getProjection(tenantId);
      const result=await sync(projection);
      if(Number(result?.failed)>0) return reply({status:'PARTIAL_FAILURE',...result},502);
      return reply({status:'SYNCED',...result},200);
    }catch(error){
      return reply({status:'BLOCKED',error:error?.message||'NOTION_SYNC_UNAVAILABLE'},503);
    }
  };
}
