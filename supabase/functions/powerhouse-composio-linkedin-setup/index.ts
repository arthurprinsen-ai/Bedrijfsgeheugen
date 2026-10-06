import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE='https://backend.composio.dev/api/v3.1';
const EXEC_BASE='https://backend.composio.dev/api/v3.1';
const SUBJECT='linkedin-composio-setup';
const USER_ID='bedrijfsgeheugen-owner';
const ALIAS='bedrijfsgeheugen-company-canonical';
const COMPANY_PROOF_RECORD='linkedin-company-oauth-fresh-proof-v1';
const COMPANY_OAUTH_SCOPES=['openid','profile','email','r_organization_admin','r_organization_social','rw_organization_admin','w_member_social','w_organization_social'];
const COMPANY_REQUIRED_SCOPES=['r_organization_admin','w_organization_social'];
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
function jsonObject(value:any){
  if(value===null||value===undefined)return {};
  if(typeof value==='string'){try{return jsonObject(JSON.parse(value));}catch{return {};}}
  if(Array.isArray(value))return value.reduce((acc:any,item:any)=>Object.assign(acc,jsonObject(item)),{});
  if(typeof value==='object'){
    const keys=Object.keys(value);
    if(keys.length>0&&keys.every((key)=>/^\d+$/.test(key)))return {};
    return value;
  }
  return {};
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function secret(db:any,name:string){const env=Deno.env.get(name);if(env)return clean(env);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data)||null;}
async function api(key:string,path:string,init:RequestInit={}){const r=await fetch(BASE+path,{...init,headers:{'x-api-key':key,'content-type':'application/json',...(init.headers||{})}});const b:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error('COMPOSIO_LINKEDIN_SETUP_'+r.status+':'+clean(b?.error||b?.message||JSON.stringify(b)).slice(0,240));return b;}
async function execute(key:string,accountId:string,userId:string,toolSlug:string,args:Record<string,unknown>={}){
  if(!clean(accountId))throw new Error('COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_ID_REQUIRED');
  if(!clean(userId))throw new Error('COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_USER_ID_REQUIRED');
  const r=await fetch(`${EXEC_BASE}/tools/execute/${toolSlug}`,{
    method:'POST',
    headers:{'x-api-key':key,'content-type':'application/json'},
    body:JSON.stringify({connected_account_id:accountId,user_id:userId,version:'latest',arguments:args})
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
    let body:any={};try{body=await req.json()}catch{}
    const action=clean(body.action)||'status';

    const key=await secret(db,'COMPOSIO_API_KEY');
    if(!key){
      const result={ready:false,state:'BLOCKED_EXTERNAL_CONFIG',reason:'COMPOSIO_API_KEY_REQUIRED',api_key_present:false,active_accounts:0,personal_ready:false,company_ready:false};
      await writeState(db,'BLOCKED_EXTERNAL_CONFIG',result);
      return json({ok:true,...result});
    }

    const [{data:priorStateRow},{data:freshProofRow}]=await Promise.all([
      db.from('brain_records').select('status,result').eq('tenant_id','canonical').eq('record_id','linkedin-composio-setup-current-state-v1').maybeSingle(),
      db.from('brain_records').select('status,result').eq('tenant_id','canonical').eq('record_id',COMPANY_PROOF_RECORD).maybeSingle()
    ]);
    const priorState=jsonObject(priorStateRow?.result);
    const freshProof=jsonObject(freshProofRow?.result);
    const proofFresh=freshProof?.verified===true&&freshProof?.fresh_oauth_verified===true;
    const proofAccountId=proofFresh?clean(freshProof?.connected_account_id):'';
    const proofUserId=proofFresh?clean(freshProof?.user_id):'';
    const proofAuthConfigId=proofFresh?clean(freshProof?.auth_config_id):'';
    const proofCreatedAt=proofFresh?clean(freshProof?.account_created_at):'';
    const proofScopes=Array.isArray(freshProof?.granted_scopes)?freshProof.granted_scopes.map(clean).filter(Boolean):[];
    const priorRequestedScopes=Array.isArray(priorState?.requested_company_scopes)?priorState.requested_company_scopes.map(clean).filter(Boolean):[];
    const expectedCompanyScopes=proofScopes.length?proofScopes:(priorRequestedScopes.length?priorRequestedScopes:COMPANY_OAUTH_SCOPES);
    const boundOauthAccountId=clean(proofAccountId||priorState?.company_oauth_connection_id||priorState?.oauth_candidate_connection_id);

    if(action==='create_link'){
      const configsBody=await api(key,'/auth_configs?toolkit_slug=linkedin&show_disabled=false&limit=50');
      const configs=(Array.isArray(configsBody?.items)?configsBody.items:[])
        .filter((x:any)=>clean(x?.status).toUpperCase()!=='DISABLED'&&x?.is_disabled!==true);
      const configScopes=(value:any)=>new Set(clean(value?.credentials?.scopes||value?.credentials?.user_scopes).split(/[\s,]+/).map((v:string)=>v.trim()).filter(Boolean));
      const scopedConfigs=configs.filter((x:any)=>{
        const scopes=configScopes(x);
        return COMPANY_REQUIRED_SCOPES.every(scope=>scopes.has(scope));
      });
      let authConfigId=proofAuthConfigId||clean(priorState?.auth_config_id)||clean(scopedConfigs[0]?.id);
      if(!authConfigId){
        const created=await api(key,'/auth_configs',{method:'POST',body:JSON.stringify({
          toolkit:{slug:'linkedin'},
          auth_config:{
            type:'use_composio_managed_auth',
            credentials:{scopes:COMPANY_OAUTH_SCOPES.join(',')},
            restrict_to_following_tools:['LINKEDIN_GET_MY_INFO','LINKEDIN_GET_COMPANY_INFO','LINKEDIN_CREATE_LINKED_IN_POST','LINKEDIN_GET_POST_CONTENT']
          }
        })});
        authConfigId=clean(created?.auth_config?.id||created?.id);
      }
      if(!authConfigId)throw new Error('COMPOSIO_LINKEDIN_COMPANY_AUTH_CONFIG_ID_MISSING');
      const linkUserId=proofUserId||clean(priorState?.user_id)||USER_ID;
      const link=await api(key,'/connected_accounts/link',{method:'POST',body:JSON.stringify({auth_config_id:authConfigId,user_id:linkUserId,alias:ALIAS})});
      const redirectUrl=clean(link?.redirect_url),connectedAccountId=clean(link?.connected_account_id);
      if(!redirectUrl||!connectedAccountId)throw new Error('COMPOSIO_LINKEDIN_SCOPED_REDIRECT_OR_ACCOUNT_MISSING');
      const result={
        ready:false,state:'AUTH_LINK_READY',reason:'LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED',
        api_key_present:true,auth_config_id:authConfigId,connected_account_id:connectedAccountId,
        oauth_candidate_connection_id:connectedAccountId,user_id:linkUserId,link_available:true,
        expires_at:clean(link?.expires_at)||null,production_workspace:true,
        requested_company_scopes:COMPANY_OAUTH_SCOPES,canonical_alias:ALIAS,
        oauth_requested_at:new Date().toISOString(),company_oauth_fresh_verified:false
      };
      await writeState(db,'AUTH_LINK_READY',result);
      return json({ok:true,...result,redirect_url:redirectUrl});
    }

    const accountsBody=await api(key,'/connected_accounts?toolkit_slugs=linkedin&statuses=ACTIVE&account_type=ALL&limit=50');
    const items=Array.isArray(accountsBody?.items)?accountsBody.items:Array.isArray(accountsBody?.data?.items)?accountsBody.data.items:[];
    const accounts=items.filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&!x?.is_disabled);

    if(accounts.length===0){
      const result={ready:false,state:'CONNECTION_REQUIRED',reason:'COMPOSIO_LINKEDIN_CONNECTION_REQUIRED',api_key_present:true,active_accounts:0,healthy_accounts:0,personal_ready:false,company_ready:false};
      await writeState(db,'CONNECTION_REQUIRED',result);return json({ok:true,...result});
    }

    const accountsToCheck=proofAccountId
      ? accounts.filter((candidate:any)=>clean(candidate?.id||candidate?.connected_account_id)===proofAccountId)
      : accounts;
    if(proofAccountId&&accountsToCheck.length!==1){
      const result={
        ready:false,state:'BLOCKED_FRESH_PROOF_ACCOUNT',reason:'COMPOSIO_LINKEDIN_FRESH_PROOF_ACCOUNT_NOT_ACTIVE',
        api_key_present:true,active_accounts:accounts.length,healthy_accounts:0,
        fresh_oauth_proof_record:COMPANY_PROOF_RECORD,proof_account_id:proofAccountId,
        personal_ready:false,company_ready:false
      };
      await writeState(db,'BLOCKED_FRESH_PROOF_ACCOUNT',result);
      return json({ok:true,...result},409);
    }

    const healthy:any[]=[];
    const rejected:any[]=[];
    for(const candidate of accountsToCheck){
      const candidateAccountId=clean(candidate?.id||candidate?.connected_account_id);
      const candidateUserId=clean(candidate?.user_id);
      if(!candidateAccountId||!candidateUserId){rejected.push({account_id:candidateAccountId||null,reason:'MISSING_ACCOUNT_OR_USER_ID'});continue;}
      try{
        const candidateWho=await execute(key,candidateAccountId,candidateUserId,'LINKEDIN_GET_MY_INFO',{});
        const candidates=deepFindStrings(candidateWho,['author','author_id','person_id','member_id','id','sub']);
        const candidatePersonAuthor=normalizePersonUrn(candidates.find(v=>!!v)||'');
        if(!candidatePersonAuthor)throw new Error('LINKEDIN_PERSONAL_AUTHOR_UNVERIFIED');
        healthy.push({account:candidate,accountId:candidateAccountId,userId:candidateUserId,who:candidateWho,personAuthor:candidatePersonAuthor});
      }catch(error){
        const message=error instanceof Error?error.message:String(error);
        rejected.push({account_id:candidateAccountId,alias:clean(candidate?.alias)||null,reason:message.includes('REVOKED_ACCESS_TOKEN')?'REVOKED_ACCESS_TOKEN':'HEALTHCHECK_FAILED'});
      }
    }
    if(healthy.length===0){
      const result={ready:false,state:'CONNECTION_REQUIRED',reason:'COMPOSIO_LINKEDIN_REAUTH_REQUIRED',api_key_present:true,active_accounts:accounts.length,healthy_accounts:0,rejected_accounts:rejected,personal_ready:false,company_ready:false};
      await writeState(db,'CONNECTION_REQUIRED',result);return json({ok:true,...result},409);
    }
    const proofHealthy=proofAccountId?healthy.filter(x=>x.accountId===proofAccountId):[];
    const boundHealthy=boundOauthAccountId?healthy.filter(x=>x.accountId===boundOauthAccountId):[];
    const canonical=healthy.filter(x=>clean(x.account?.alias)===ALIAS);
    const selectable=proofHealthy.length===1?proofHealthy:(boundHealthy.length===1?boundHealthy:(canonical.length===1?canonical:healthy));
    if(selectable.length!==1){
      const reason=(proofAccountId||boundOauthAccountId)?'COMPOSIO_LINKEDIN_BOUND_OAUTH_NOT_HEALTHY':'COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS';
      const result={
        ready:false,state:'BLOCKED_AMBIGUOUS',reason,api_key_present:true,
        active_accounts:accounts.length,healthy_accounts:healthy.length,rejected_accounts:rejected,
        personal_ready:false,company_ready:false,
        oauth_candidate_connection_id:proofAccountId||boundOauthAccountId||null,
        fresh_oauth_proof_record:proofFresh?COMPANY_PROOF_RECORD:null
      };
      await writeState(db,'BLOCKED_AMBIGUOUS',result);return json({ok:true,...result},409);
    }

    const selected=selectable[0];
    const account=selected.account;
    const accountId=selected.accountId;
    const userId=selected.userId;
    const who=selected.who;
    const personAuthor=selected.personAuthor;
    const grantedScopes=clean(account?.data?.scope).split(/[\s,]+/).map((v:string)=>v.trim()).filter(Boolean);

    let companies:any=null;
    let companyError:string|null=null;
    try{
      companies=await execute(key,accountId,userId,'LINKEDIN_GET_COMPANY_INFO',{role:'ADMINISTRATOR',count:100,start:0,state:'APPROVED'});
    }catch(error){
      companyError=error instanceof Error?error.message:String(error);
    }
    const rawOrgIds=companies?deepFindStrings(companies,['organization','organization_id','company_id','id','entity_urn','urn']):[];
    const discoveredOrgUrns=[...new Set(rawOrgIds.map(normalizeOrganizationUrn).filter(v=>v&&v.startsWith('urn:li:organization:')))].slice(0,25);
    const configuredOrg=normalizeOrganizationUrn((await secret(db,'COMPOSIO_LINKEDIN_COMPANY_AUTHOR_URN'))||'urn:li:organization:18234216');
    const orgUrns=[...new Set([configuredOrg,...discoveredOrgUrns].filter(v=>/^urn:li:organization:[A-Za-z0-9_-]+$/.test(v)))];

    const personalReady=!!personAuthor;
    const hasMemberReadScope=grantedScopes.includes('r_member_social');
    const hasOrgAdminScope=grantedScopes.includes('r_organization_admin')||grantedScopes.includes('rw_organization_admin');
    const hasOrgWriteScope=grantedScopes.includes('w_organization_social')||grantedScopes.includes('w_organization_social_feed');
    const hasOrgReadScope=grantedScopes.includes('r_organization_social')||grantedScopes.includes('r_organization_social_feed');
    const adminAclVerified=!companyError&&discoveredOrgUrns.includes(configuredOrg);
    const accountCreatedAt=clean(account?.created_at);
    const proofBound=proofFresh
      &&!!proofAccountId
      &&accountId===proofAccountId
      &&freshProof?.admin_acl_verified===true
      &&clean(freshProof?.organization_urn)===configuredOrg
      &&(!proofCreatedAt||!accountCreatedAt||proofCreatedAt===accountCreatedAt)
      &&(!proofUserId||proofUserId===userId)
      &&COMPANY_REQUIRED_SCOPES.every(scope=>proofScopes.includes(scope)||grantedScopes.includes(scope));
    const requestedLinkBound=!!clean(priorState?.oauth_candidate_connection_id)
      &&accountId===clean(priorState?.oauth_candidate_connection_id)
      &&!!clean(priorState?.oauth_requested_at);
    const proofHasOrgAdminScope=proofScopes.includes('r_organization_admin')||proofScopes.includes('rw_organization_admin');
    const proofHasOrgWriteScope=proofScopes.includes('w_organization_social')||proofScopes.includes('w_organization_social_feed');
    const organizationAdminScopeAuthorized=hasOrgAdminScope||(proofBound&&proofHasOrgAdminScope);
    const organizationWriteScopeAuthorized=hasOrgWriteScope||(proofBound&&proofHasOrgWriteScope);
    const companyOauthFreshVerified=(proofBound||requestedLinkBound)&&adminAclVerified&&organizationAdminScopeAuthorized&&organizationWriteScopeAuthorized;
    const personalReadbackReady=personalReady&&hasMemberReadScope;
    const companyAdminReadReady=adminAclVerified&&organizationAdminScopeAuthorized;
    const companyReady=personalReady&&companyOauthFreshVerified&&companyAdminReadReady;
    const companyReadbackReady=companyReady&&hasOrgReadScope;
    const companyState=companyReady?'ACTIVE':personalReady?'COMPANY_AUTH_REQUIRED':'CAPABILITY_UNVERIFIED';
    const companyReason=companyReady?null:personalReady?'LINKEDIN_COMPANY_ORG_OAUTH_REQUIRED':'LINKEDIN_PERSONAL_AUTHOR_UNVERIFIED';
    const companyOauthVerifiedAt=companyReady?new Date().toISOString():null;
    const result={
      ready:personalReady,
      state:companyState,
      reason:companyReason,
      api_key_present:true,
      active_accounts:accounts.length,
      healthy_accounts:healthy.length,
      rejected_accounts:rejected,
      health_verified:true,
      canonical_alias_selected:clean(account?.alias)===ALIAS,
      connected_account_id:accountId,
      user_id:userId,
      alias:clean(account?.alias),
      auth_config_id:proofAuthConfigId||clean(priorState?.auth_config_id)||null,
      granted_scopes:grantedScopes,
      personal_ready:personalReady,
      personal_author_urn:personAuthor||null,
      personal_readback_ready:personalReadbackReady,
      personal_readback_scope_required:personalReadbackReady?null:'r_member_social',
      company_ready:companyReady,
      company_author_urns:orgUrns,
      company_count:orgUrns.length,
      company_scope_required:companyReady?null:['r_organization_admin','w_organization_social'],
      company_admin_read_ready:companyAdminReadReady,
      company_admin_read_scope_required:companyAdminReadReady?null:'r_organization_admin',
      company_admin_scope_present:hasOrgAdminScope,
      company_write_scope_present:hasOrgWriteScope,
      organization_admin_scope_authorized:organizationAdminScopeAuthorized,
      organization_write_scope_authorized:organizationWriteScopeAuthorized,
      company_author_source:adminAclVerified?'live_org_acl':'unverified',
      company_readback_ready:companyReadbackReady,
      company_read_scope_present:hasOrgReadScope,
      company_readback_scope_required:companyReadbackReady?null:'r_organization_social',
      company_capability_error:companyError?companyError.slice(0,220):null,
      oauth_candidate_connection_id:boundOauthAccountId||null,
      requested_company_scopes:expectedCompanyScopes,
      oauth_requested_at:clean(priorState?.oauth_requested_at||proofCreatedAt)||null,
      company_oauth_fresh_verified:companyOauthFreshVerified,
      linkedin_company_admin_oauth_proven:companyReady,
      organization_write_scope_verified:false,
      company_publish_eligible:companyReady,
      company_oauth_connection_id:companyReady?accountId:null,
      company_oauth_verified_at:companyOauthVerifiedAt,
      company_oauth_fresh_proof_record:proofBound?COMPANY_PROOF_RECORD:null,
      company_oauth_account_created_at:accountCreatedAt||null,
      company_live_proven_eligible:false,
      toolkit_version_policy:'latest'
    };
    if(action==='resume'&&personalReady){
      if(!expected)return json({ok:false,error:'SCHEDULER_AUTH_REQUIRED'},503);
      const publisherResponse=await fetch(url+'/functions/v1/powerhouse-social-publisher',{
        method:'POST',
        headers:{'content-type':'application/json','x-powerhouse-token':expected},
        body:JSON.stringify({runDate:localDate(),trigger:'linkedin-production-oauth-complete'})
      });
      const publisher:any=await publisherResponse.json().catch(()=>({}));
      result.resume_attempted=true;
      result.publisher_http=publisherResponse.status;
      result.publisher_ok=publisherResponse.ok&&publisher?.ok!==false;
      result.publisher_results=Array.isArray(publisher?.results)?publisher.results:[];
      await writeState(db,result.publisher_ok?'ACTIVE_RESUMED':'ACTIVE_RESUME_FAILED',result);
      return json({ok:result.publisher_ok,...result},result.publisher_ok?200:502);
    }
    await writeState(db,personalReady?'ACTIVE':'CAPABILITY_UNVERIFIED',result);
    return json({ok:true,...result});
  }catch(error){
    const detail=error instanceof Error?error.message:'unknown';
    return json({ok:false,error:'COMPOSIO_LINKEDIN_SETUP_FAILED',detail:detail.slice(0,300)},503);
  }
});
