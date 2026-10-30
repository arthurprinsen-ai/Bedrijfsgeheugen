// Existing Powerhouse Control Center: a private, read-only second projection route,
// NOT a new job, executor, publisher, truth store, or writer. Same original Supabase view.
import {getUser} from '@netlify/identity';
import {isPowerhouseAdmin} from '../../platform/auth/powerhouse-admin.mjs';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {loadOneLoopAssuranceWithDiagnostics} from '../../brain/observability/one-loop-guard-diagnostics.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store','pragma':'no-cache','vary':'authorization, cookie',
  'x-robots-tag':'noindex, nofollow, noarchive','x-content-type-options':'nosniff'
}});
export default async request=>{
  if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
  if(!/^Bearer\s+.+/i.test(request.headers.get('authorization')||''))
    return reply({error:'UNAUTHENTICATED'},401);
  const user=await getUser(request);
  if(!user?.id)return reply({error:'UNAUTHENTICATED'},401);
  if(!isPowerhouseAdmin(user,{allowedEmails:String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim()}))
    return reply({error:'POWERHOUSE_ADMIN_REQUIRED'},403);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return reply({error:'TENANT_UNRESOLVED'},403);
  const baseUrl=String(Netlify.env.get('SUPABASE_URL')||Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim();
  const key=String(Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')||'').trim();
  const assurance=await loadOneLoopAssuranceWithDiagnostics({baseUrl,key});
  return reply(assurance,200);
};
export const config={path:'/api/powerhouse-one-loop-assurance'};
