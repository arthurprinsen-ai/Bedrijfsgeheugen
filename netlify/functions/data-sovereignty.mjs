import {getUser} from '@netlify/identity';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {isPowerhouseAdmin} from '../../platform/auth/powerhouse-admin.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const allowedModes=new Set(['TRANSPARENT_GLOBAL','EU_STORAGE','EU_ONLY','CUSTOM']);
const allowedAiProviders=new Set(['','anthropic','openai_eu','composio_groq']);
const client=createDataSovereigntyClient();
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();

export default async request=>{
  if(!['GET','POST'].includes(request.method))return json({error:'METHOD_NOT_ALLOWED'},405);
  const user=await getUser(request);
  if(!user?.id)return json({error:'UNAUTHORIZED'},401);
  const ownTenant=resolveIdentityTenant(user);
  if(!ownTenant)return json({error:'FORBIDDEN'},403);

  if(request.method==='GET'){
    const url=new URL(request.url);
    const wantsCanonical=url.searchParams.get('scope')==='bedrijfsgeheugen';
    if(wantsCanonical&&!isPowerhouseAdmin(user,{allowedEmails:adminEmails()}))return json({error:'POWERHOUSE_ADMIN_REQUIRED'},403);
    const tenantId=wantsCanonical?'canonical':ownTenant;
    try{return json(await client.get(tenantId));}catch(error){return json({error:error?.code||'DATA_SOVEREIGNTY_READ_FAILED'},502);}
  }

  let body;try{body=await request.json();}catch{return json({error:'INVALID_JSON'},400);}
  const mode=String(body?.mode||'').trim();
  const preferredAiProvider=String(body?.preferredAiProvider||'').trim();
  const preferredAiRegion=String(body?.preferredAiRegion||'').trim();
  if(!allowedModes.has(mode)||!allowedAiProviders.has(preferredAiProvider))return json({error:'INVALID_POLICY'},400);
  const policy={
    mode,
    preferredAiProvider:preferredAiProvider||null,
    preferredAiRegion:preferredAiRegion||null
  };
  try{return json(await client.setPolicy(ownTenant,policy,user.email||user.id));}
  catch(error){return json({error:error?.code||'DATA_SOVEREIGNTY_WRITE_FAILED'},502);}
};

export const config={path:'/api/data-sovereignty'};
