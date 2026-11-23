/**
 * Attach the EXISTING Powerhouse Control Plane cockpit to the actual portal
 * lifecycle. No new endpoint, scheduler, state store or privileged shortcut.
 * The existing Netlify Identity/JWT and server admin check remain authoritative.
 */
export function isControlPlaneAdminCandidate(user){
  if(!user?.id)return false;
  const roles=[
    ...(Array.isArray(user?.app_metadata?.roles)?user.app_metadata.roles:[]),
    ...(Array.isArray(user?.roles)?user.roles:[])
  ].map(role=>String(role||'').trim().toLowerCase());
  return user.app_metadata?.powerhouse_admin===true ||
    roles.includes('admin')||roles.includes('powerhouse_admin');
}

export function attachExistingControlPlaneCockpit({
  stateClient,root,fetchImpl,mountImpl,abortController=()=>new AbortController()
}={}){
  if(!stateClient||typeof stateClient.subscribe!=='function'||
    typeof mountImpl!=='function'||typeof fetchImpl!=='function'||!root?.querySelector)
    throw new Error('CANONICAL_PORTAL_MOUNT_DEPENDENCIES_MISSING');

  let ownerSubject='',revision=0,controller=null,destroyed=false,host=null;
  const clear=()=>{
    controller?.abort();controller=null;
    host?.remove?.();host=null;
    root.querySelector('[data-bg-control-plane-host="true"]')?.remove?.();
  };
  const apply= snap=>{
    if(destroyed)return;
    const user=snap?.user;
    const eligible=(snap?.mode==='authenticated'||snap?.mode==='empty') &&
      !stateClient.isDemo?.() && isControlPlaneAdminCandidate(user);
    const next=eligible?String(user.id):'';
    if(next===ownerSubject)return;
    ownerSubject=next;revision++;clear();
    if(!next)return;

    const activeRevision=revision;
    const currentController=abortController();
    controller=currentController;
    const stillActive=()=>!destroyed&&!currentController.signal.aborted &&
      activeRevision===revision&&ownerSubject===next &&
      String(stateClient.getSnapshot?.()?.user?.id||'')===next;
    const guard=()=>{if(!stillActive())throw new Error('PORTAL_OWNER_IDENTITY_CHANGED');};
    const scopedFetch=async(url,options={})=>{
      guard();
      // Only the existing same-origin admin endpoint may be read.
      if(url!=='/api/powerhouse-control-plane')throw new Error('NON_CANONICAL_CONTROL_PLANE_ENDPOINT');
      const response=await fetchImpl(url,{...options,signal:currentController.signal});
      guard();
      return {
        ok:response.ok,status:response.status,
        json:async()=>{const data=await response.json();guard();return data;}
      };
    };
    void Promise.resolve().then(()=>mountImpl(root,{fetchImpl:scopedFetch}))
      .then(result=>{
        if(!stillActive()){result?.host?.remove?.();return;}
        host=result?.host||null;
      }).catch(()=>{}); // Auth failure is represented by the existing 401/403 gate.
  };
  const unsubscribe=stateClient.subscribe(apply);
  apply(stateClient.getSnapshot?.());
  return Object.freeze({
    destroy(){if(destroyed)return;destroyed=true;ownerSubject='';revision++;clear();unsubscribe?.();},
    currentOwner:()=>ownerSubject||null
  });
}
