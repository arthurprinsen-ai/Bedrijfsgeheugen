import {getUser} from '@netlify/identity';
import {resolveIdentityTenant} from '../../platform/read-models/portal-server-state.mjs';
import {isPowerhouseAdmin} from '../../platform/auth/powerhouse-admin.mjs';
import {createSecurityTrustClient} from './_security-trust-client.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const client=createSecurityTrustClient();
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();

export default async request=>{
 if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
 const user=await getUser(request);
 if(!user?.id)return json({error:'UNAUTHORIZED'},401);
 const ownTenant=resolveIdentityTenant(user);
 if(!ownTenant)return json({error:'FORBIDDEN'},403);
 const url=new URL(request.url);
 const wantsCanonical=url.searchParams.get('scope')==='bedrijfsgeheugen';
 if(wantsCanonical&&!isPowerhouseAdmin(user,{allowedEmails:adminEmails()}))return json({error:'POWERHOUSE_ADMIN_REQUIRED'},403);
 const tenantId=wantsCanonical?'canonical':ownTenant;
 try{return json(await client.get(tenantId));}
 catch(error){return json({error:error?.code||'SECURITY_TRUST_READ_FAILED'},502);}
};

export const config={path:'/api/security-trust'};