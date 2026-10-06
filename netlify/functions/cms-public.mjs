import { cmsGateway } from './_cms-gateway.mjs';

function json(body,status=200){
  const headers=status===200
    ? {'cache-control':'public, max-age=30, stale-while-revalidate=120','netlify-cdn-cache-control':'public, durable, s-maxage=60, stale-while-revalidate=600'}
    : {'cache-control':'no-store','netlify-cdn-cache-control':'no-store'};
  return Response.json(body,{status,headers});
}

export default async function handler(request){
  if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
  const url=new URL(request.url);
  const surface=String(url.searchParams.get('surface')||'website');
  const locale=String(url.searchParams.get('locale')||'nl-NL');
  const route=String(url.searchParams.get('route')||'/');
  try{
    const data=await cmsGateway({action:'cms_public',surface,locale,route});
    return json(data,200);
  }catch(error){
    return json({error:error?.message||'CMS_PUBLIC_FAILED'},Number(error?.status)||500);
  }
}

export const config={path:'/api/cms-public'};
