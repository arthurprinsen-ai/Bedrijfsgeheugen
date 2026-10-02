import { getUser } from '@netlify/identity';
import { cmsGateway } from './_cms-gateway.mjs';

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
    const data=await cmsGateway({...body,action,actor:user.email||user.id});
    return json(data,200);
  }catch(error){
    return json({error:error?.message||'CMS_ADMIN_FAILED'},Number(error?.status)||500);
  }
}

export const config={path:'/api/cms-admin'};
