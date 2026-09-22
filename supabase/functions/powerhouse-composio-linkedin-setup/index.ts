import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE='https://backend.composio.dev/api/v3.1';
const EXEC_BASE='https://backend.composio.dev/api/v3.1';
const SUBJECT='linkedin-composio-setup';
const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function api(key:string,path:string,init:RequestInit={}){const r=await fetch(BASE+path,{...init,headers:{'x-api-key':key,'content-type':'application/json',...(init.headers||{})}});const b:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error('COMPOSIO_LINKEDIN_SETUP_'+r.status+':'+clean(b?.error||b?.message||JSON.stringify(b)).slice(0,240));return b;}
async function execute(key:string,accountId:string,toolSlug:string,args:Record<string,unknown>={}){
  const r=await fetch(`${EXEC_BASE}/tools/execute/${toolSlug}`,{
    method:'POST',
    headers:{'x-api-key':key,'content-type':'application/json'},
    body:JSON.stringify({connected_account_id:accountId,version:'latest',arguments:args})
  });
  const b:any=await r.json().catch(()=>({}));
  if(!r.ok||b?.successful!==true)throw new Error(`COMPOSIO_${toolSlug}_${r.status}:${clean(b?.error||b?.message||JSON.stringify(b)).slice(0,240)}`);
  return b?.data??b;
}
function deepFindStrings(value:any,keys:string[],out:string[]=[]){
  if(value==null)return out;
  if(Array.isArray(value)){for(const item of value)deepFindStrings(item,keys,out);return out;}
  if(typeof value!=='object')return out;
  for(const [k,v] of Object.entries(value)){
    if(keys.some(key=>key.toLowerCase()===k.toLowerCase())&&(typeof v==='string'||typeof v==='number'))out.push(clean(v));
    if(v&&typeof v==='object')deepFindStrings(v,keys,out);
  }
  return out;
}
function normalizePersonUrn(raw:string){const v=clean(raw);if(!v)return'';if(v.startsWith('urn:li:person:'))return v;if(v.startsWith('urn:li:'))return v;return `urn:li:person:${v}`;}
function normalizeOrganizationUrn(raw:string){const v=clean(raw);if(!v)return'';if(v.startsWith('urn:li:organization:'))return v;if(v.startsWith('urn:li:'))return v;return `urn:li:organization:${v}`;}
async function writeState(db:any,state:string,result:any){
  const now=new Date().toISOString();
  await db.from('brain_records').upsert({
    tenant_id:'canonical',record_id:'linkedin-composio-setup-current-state-v1',record_type:'CurrentState',record_kind:'current_state',subject_id:SUBJECT,
    status:state,observed_at:now,executed:true,verified:true,result,payload:{fingerprint:'linkedin-composio-capability-proof-v1',secret_values_exposed:false},
    idempotency_key:'linkedin-composio-setup-current-state-v1',source_revision:'powerhouse-composio-linkedin-setup',stored_at:now,updated_at:now
  },{onConflict:'tenant_id,record_id'});
}

Deno.serve(async(req:Request)=>{
  try{
    if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
    const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!serviceKey)return json({ok:false,error:'CONFIG'},500);
    const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
    const schedulerOk=Boolean(expected&&req.headers.get('x-powerhouse-token')===expected);
    const serviceToken=req.headers.get('x-bg-service-token')||'';
    const serviceOk=Boolean(serviceToken&&await sha256(serviceToken)===SERVICE_TOKEN_HASH);
    if(!schedulerOk&&!serviceOk)return json({ok:false,error:'UNAUTHORIZED'},401);

    const key=await secret(db,'COMPOSIO_API_KEY');
    if(!key){
      const result={ready:false,state:'BLOCKED_EXTERNAL_CONFIG',reason:'COMPOSIO_API_KEY_REQUIRED',api_key_present:false,active_accounts:0,personal_ready:false,company_ready:false};
      await writeState(db,'BLOCKED_EXTERNAL_CONFIG',result);
      return json({ok:true,...result});
    }

    const accountsBody=await api(key,'/connected_accounts?toolkit_slugs=linkedin&statuses=ACTIVE&account_type=ALL&limit=50');
    const items=Array.isArray(accountsBody?.items)?accountsBody.items:Array.isArray(accountsBody?.data?.items)?accountsBody.data.items:[];
    const accounts=items.filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&!x?.is_disabled);

    if(accounts.length===0){
      const result={ready:false,state:'CONNECTION_REQUIRED',reason:'COMPOSIO_LINKEDIN_CONNECTION_REQUIRED',api_key_present:true,active_accounts:0,personal_ready:false,company_ready:false};
      await writeState(db,'CONNECTION_REQUIRED',result);return json({ok:true,...result});
    }
    if(accounts.length>1){
      const result={ready:false,state:'AMBIGUOUS',reason:'COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS',api_key_present:true,active_accounts:accounts.length,personal_ready:false,company_ready:false};
      await writeState(db,'BLOCKED_AMBIGUOUS',result);return json({ok:true,...result},409);
    }

    const account=accounts[0];
    const accountId=clean(account?.id||account?.connected_account_id);
    const who=await execute(key,accountId,'LINKEDIN_GET_MY_INFO',{});
    const personCandidates=deepFindStrings(who,['author','author_id','person_id','member_id','id','sub']);
    const personAuthor=normalizePersonUrn(personCandidates.find(v=>!!v)||'');

    let companies:any=null;
    let companyError:string|null=null;
    try{
      companies=await execute(key,accountId,'LINKEDIN_GET_COMPANY_INFO',{role:'ADMINISTRATOR',count:100,start:0,state:'APPROVED'});
    }catch(error){
      companyError=error instanceof Error?error.message:String(error);
    }
    const rawOrgIds=companies?deepFindStrings(companies,['organization','organization_id','company_id','id','entity_urn','urn']):[];
    const orgUrns=[...new Set(rawOrgIds.map(normalizeOrganizationUrn).filter(v=>v&&v.startsWith('urn:li:organization:')))].slice(0,25);

    const personalReady=!!personAuthor;
    const companyReady=orgUrns.length>0;
    const result={
      ready:personalReady,
      state:personalReady?'ACTIVE':'CAPABILITY_UNVERIFIED',
      reason:personalReady?null:'LINKEDIN_PERSONAL_AUTHOR_UNVERIFIED',
      api_key_present:true,
      active_accounts:1,
      connected_account_id:accountId,
      user_id:clean(account?.user_id),
      alias:clean(account?.alias),
      personal_ready:personalReady,
      personal_author_urn:personAuthor||null,
      company_ready:companyReady,
      company_author_urns:orgUrns,
      company_count:orgUrns.length,
      company_capability_error:companyError?companyError.slice(0,220):null,
      toolkit_version_policy:'latest'
    };
    await writeState(db,personalReady?'ACTIVE':'CAPABILITY_UNVERIFIED',result);
    return json({ok:true,...result});
  }catch(error){
    const detail=error instanceof Error?error.message:'unknown';
    return json({ok:false,error:'COMPOSIO_LINKEDIN_SETUP_FAILED',detail:detail.slice(0,300)},503);
  }
});
