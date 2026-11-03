import { getUser } from '@netlify/identity';
import { cmsGateway } from './_cms-gateway.mjs';
import { cmsQuality,cmsPowerhouseLoop } from '../../assets/cms-quality-gate.mjs';

function json(body,status=200){
  return Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
}
function hasAdminRole(user){
  const roles=[
    ...(Array.isArray(user?.app_metadata?.roles)?user.app_metadata.roles:[]),
    ...(Array.isArray(user?.roles)?user.roles:[])
  ].map(value=>String(value||'').trim().toLowerCase());
  return user?.app_metadata?.powerhouse_admin===true||roles.includes('admin')||roles.includes('powerhouse_admin');
}
function actionFor(method,body){
  if(method==='GET')return 'cms_admin_list';
  const action=String(body?.action||'save').trim();
  if(action==='save')return 'cms_admin_save';
  if(action==='publish')return 'cms_admin_publish';
  if(action==='archive')return 'cms_admin_archive';
  return '';
}

export default async function handler(request){
  const user=await getUser();
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  if(!hasAdminRole(user))return json({error:'FORBIDDEN'},403);
  if(!['GET','POST'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
  let body={};
  if(request.method==='POST'){
    try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}
  }else{
    const url=new URL(request.url);
    body={
      surface:url.searchParams.get('surface')||'',
      locale:url.searchParams.get('locale')||'',
      route:url.searchParams.get('route')||''
    };
  }
  const action=actionFor(request.method,body);
  if(!action)return json({error:'INVALID_ACTION'},400);
  try{
    const actor=user.email||user.id;
    // One authenticated CMS readback is the source for the original Powerhouse
    // quality/Heartbeat projection. No second database or polling executor.
    if(action==='cms_admin_list'){
      const data=await cmsGateway({...body,action,actor});
      if(!Array.isArray(data?.items)||!data?.generatedAt)return json({error:'CMS_EVIDENCE_UNAVAILABLE'},503);
      return json({...data,items:data.items.map(item=>({...item,cms_quality:cmsQuality(item)})),
        cms_powerhouse_loop:cmsPowerhouseLoop(data.items,data.generatedAt)},200);
    }
    if(action==='cms_admin_publish'){
      if(typeof body.id!=='string'||!body.id.trim())return json({error:'INVALID_CMS_ID'},400);
      const snapshot=await cmsGateway({action:'cms_admin_list',actor});
      if(!Array.isArray(snapshot?.items)||!snapshot?.generatedAt)return json({error:'CMS_EVIDENCE_UNAVAILABLE'},503);
      const item=snapshot.items.find(x=>x.id===body.id);
      if(!item)return json({error:'CMS_ITEM_NOT_FOUND'},404);
      if(item.status!=='draft')return json({error:'CMS_PUBLISH_REQUIRES_DRAFT'},409);
      if(!Number.isInteger(Number(body.expected_version))||Number(body.expected_version)!==Number(item.version))
        return json({error:'CMS_VERSION_CONFLICT',actual_version:item.version},409);
      const quality=cmsQuality(item);
      if(!quality.publishEligible)return json({error:'CMS_QUALITY_GATE_BLOCKED',quality},422);
      // Existing authorized actor and original writer remain authoritative.
      const saved=await cmsGateway({...body,action,actor});
      let readback={status:'PUBLIC_PROJECTION_EVIDENCE_DUE',item_id:body.id,verified:false};
      try{
        const publicSurface=item.surface==='shared'?'portal':item.surface;
        const visible=await cmsGateway({action:'cms_public',surface:publicSurface,locale:item.locale,route:item.route});
        const ok=Array.isArray(visible.items)&&visible.items.some(x=>
          x.id===saved?.item?.id&&Number(x.version)===Number(saved?.item?.version));
        if(ok)readback={status:'PUBLIC_PROJECTION_OBSERVED',item_id:body.id,version:saved.item.version,verified:true};
      }catch{/* Committed publication is not rolled back or duplicated on readback failure. */}
      return json({...saved,cms_quality:quality,cms_public_readback:readback},200);
    }
    const data=await cmsGateway({...body,action,actor});
    return json(data,200);
  }catch(error){
    return json({error:error?.message||'CMS_ADMIN_FAILED'},Number(error?.status)||500);
  }
}

export const config={path:'/api/cms-admin'};
