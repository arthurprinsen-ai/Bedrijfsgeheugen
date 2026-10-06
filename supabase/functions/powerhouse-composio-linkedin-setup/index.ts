import postgres from 'npm:postgres@3.4.7';

const DB_REF='adhjwmvyoixzjtmiroln';
const DB_POOLER_HOST='aws-0-eu-central-1.pooler.supabase.com';
const DIRECT_TABLES=new Set(["brain_records"]);
const DIRECT_RPCS=new Set(["bg_geheim"]);
const DB_JSON_COLUMNS=new Set(['bg_gezondheid.gegevens','brain_records.result','brain_records.provenance','brain_records.payload','content_publication_obligations.evidence','content_publication_obligations.metrics','powerhouse_channel_decisions.delivery_evidence','powerhouse_channel_decisions.learning_evidence','powerhouse_content_artifacts.generation_evidence','powerhouse_content_recommendations.evidence','powerhouse_daily_runs.evidence','powerhouse_instagram_daily_winners_v1.selector_evidence','powerhouse_instagram_daily_winners_v1.outcome_evidence','powerhouse_instagram_media_jobs_v1.asset_manifest','powerhouse_instagram_media_jobs_v1.proof_manifest','powerhouse_media_proof_evidence_v1.proof_lineage','powerhouse_sales_actions.evidence']);
const DB_ARRAY_CASTS=new Map([['powerhouse_channel_decisions.source_recommendation_ids','uuid[]'],['powerhouse_instagram_media_jobs_v1.allowed_providers','text[]'],['brain_records.predecessor_ids','text[]'],['brain_records.evidence_ids','text[]'],['brain_ai_governance_registry.data_categories','text[]'],['brain_ai_governance_registry.prohibited_data_categories','text[]'],['brain_ai_governance_registry.approval_evidence_ids','text[]'],['brain_ai_governance_registry.evidence_ids','text[]'],['brain_ai_governance_registry.subprocessors','text[]'],['brain_ai_governance_registry.provider_evidence_urls','text[]']]);
const DB_DEFAULT_CONFLICT=new Map([['powerhouse_channel_decisions','run_date,channel'],['brain_records','tenant_id,record_id'],['content_publication_obligations','tenant_id,publication_date,channel'],['powerhouse_content_artifacts','run_date,channel'],['powerhouse_daily_runs','run_date'],['powerhouse_instagram_daily_winners_v1','run_date'],['bg_campaign_links','key'],['powerhouse_instagram_media_jobs_v1','tenant_id,publication_date,channel'],['powerhouse_media_proof_evidence_v1','fingerprint']]);
function dbIdent(value:string){const m=value.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]||'';if(m!==value)throw new Error('DB_IDENTIFIER_REJECTED');return '"'+value.replaceAll('"','""')+'"';}
function dbPoolerUrl(){const raw=Deno.env.get('SUPABASE_DB_URL')||'';if(!raw)throw new Error('SUPABASE_DB_URL_MISSING');const u=new URL(raw);u.hostname=DB_POOLER_HOST;u.port='6543';u.username='postgres.'+DB_REF;return u.toString();}
const directSql=postgres(dbPoolerUrl(),{max:4,prepare:false,connect_timeout:6,idle_timeout:10,max_lifetime:60});
function scalarParam(value:any,values:any[],cast=''){values.push(value);return String.fromCharCode(36)+values.length+(cast?'::'+cast:'');}
function valueExpr(table:string,column:string,value:any,values:any[]){const key=table+'.'+column;if(DB_JSON_COLUMNS.has(key))return scalarParam(JSON.stringify(value??null),values,'jsonb');const arrCast=DB_ARRAY_CASTS.get(key);if(arrCast&&Array.isArray(value)){if(!value.length)return 'ARRAY[]::'+arrCast;return 'ARRAY['+value.map(v=>scalarParam(v,values)).join(',')+']::'+arrCast;}return scalarParam(value,values);}
function rpcExpr(value:any,values:any[]){return value!==null&&typeof value==='object'?scalarParam(JSON.stringify(value),values,'jsonb'):scalarParam(value,values);}
class DirectQuery{
 table:string;op='select';columns='*';payload:any=null;returning='';filters:any[]=[];orders:any[]=[];limitValue:number|null=null;singleMode='';conflict='';ignoreDuplicates=false;
 constructor(table:string){if(!DIRECT_TABLES.has(table))throw new Error('DB_TABLE_REJECTED:'+table);this.table=table;}
 select(columns='*'){if(['update','upsert','insert'].includes(this.op))this.returning=columns;else{this.op='select';this.columns=columns;}return this;}
 insert(payload:any){this.op='insert';this.payload=payload;return this;} update(payload:any){this.op='update';this.payload=payload||{};return this;}
 upsert(payload:any,options:any={}){this.op='upsert';this.payload=payload||{};this.conflict=String(options?.onConflict||DB_DEFAULT_CONFLICT.get(this.table)||'');this.ignoreDuplicates=options?.ignoreDuplicates===true;return this;}
 eq(column:string,value:any){this.filters.push({kind:'eq',column,value});return this;} in(column:string,values:any[]){this.filters.push({kind:'in',column,values:Array.isArray(values)?values:[]});return this;}
 not(column:string,operator:string,value:any){this.filters.push({kind:'not',column,operator,value});return this;} order(column:string,options:any={}){this.orders.push({column,ascending:options?.ascending!==false});return this;}
 limit(value:number){this.limitValue=Number(value);return this;} maybeSingle(){this.singleMode='maybe';return this.execute();} single(){this.singleMode='single';return this.execute();} then(resolve:any,reject:any){return this.execute().then(resolve,reject);}
 where(values:any[]){const parts:string[]=[];for(const f of this.filters){const col=dbIdent(f.column);if(f.kind==='eq')parts.push(f.value===null?col+' is null':col+' = '+scalarParam(f.value,values));else if(f.kind==='in'){if(!f.values.length){parts.push('false');continue;}parts.push(col+' in ('+f.values.map((v:any)=>scalarParam(v,values)).join(',')+')');}else if(f.kind==='not'&&f.operator==='is'&&f.value===null)parts.push(col+' is not null');else throw new Error('DB_FILTER_REJECTED');}return parts.length?' where '+parts.join(' and '):'';}
 selectList(raw:string){if(raw.trim()==='*')return '*';return raw.split(',').map(x=>dbIdent(x.trim())).join(',');}
 async execute(){try{const values:any[]=[];let q='';if(this.op==='select'){q='select '+this.selectList(this.columns)+' from public.'+dbIdent(this.table)+this.where(values);if(this.orders.length)q+=' order by '+this.orders.map(o=>dbIdent(o.column)+(o.ascending?' asc':' desc')).join(',');if(Number.isFinite(this.limitValue as number))q+=' limit '+Math.max(0,Math.trunc(this.limitValue as number));}
 else if(this.op==='insert'){const items=Array.isArray(this.payload)?this.payload:[this.payload];if(!items.length||!items[0])throw new Error('DB_EMPTY_INSERT');const cols=Object.keys(items[0]);q='insert into public.'+dbIdent(this.table)+' ('+cols.map(dbIdent).join(',')+') values '+items.map((item:any)=>'('+cols.map(c=>valueExpr(this.table,c,item[c],values)).join(',')+')').join(',');if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='update'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPDATE');q='update public.'+dbIdent(this.table)+' set '+entries.map(([k,v])=>dbIdent(k)+' = '+valueExpr(this.table,k,v,values)).join(',')+this.where(values);if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='upsert'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPSERT');const cols=entries.map(([k])=>dbIdent(k));const vals=entries.map(([k,v])=>valueExpr(this.table,k,v,values));q='insert into public.'+dbIdent(this.table)+' ('+cols.join(',')+') values ('+vals.join(',')+')';const conflict=this.conflict.split(',').map(x=>x.trim()).filter(Boolean);if(!conflict.length)throw new Error('DB_UPSERT_CONFLICT_REQUIRED');q+=' on conflict ('+conflict.map(dbIdent).join(',')+') ';if(this.ignoreDuplicates)q+='do nothing';else{const set=new Set(conflict);const ups=entries.map(([k])=>k).filter(k=>!set.has(k));q+=ups.length?'do update set '+ups.map(k=>dbIdent(k)+' = excluded.'+dbIdent(k)).join(','):'do nothing';}if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else throw new Error('DB_OPERATION_REJECTED');const rows:any[]=await directSql.unsafe(q,values);let data:any;if(['insert','update','upsert'].includes(this.op)&&!this.returning)data=null;else if(this.singleMode)data=rows[0]||null;else data=rows;return {data,error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
}
async function directRpc(name:string,args:Record<string,any>={}){try{if(!DIRECT_RPCS.has(name))throw new Error('DB_RPC_REJECTED:'+name);const values:any[]=[];const call=Object.entries(args||{}).map(([k,v])=>dbIdent(k)+' := '+rpcExpr(v,values)).join(',');const q='select to_jsonb(public.'+dbIdent(name)+'('+call+')) as result';const rows:any[]=await directSql.unsafe(q,values);return {data:rows?.[0]?.result??null,error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
function createDirectDb(){return {from:(table:string)=>new DirectQuery(table),rpc:(name:string,args:any={})=>directRpc(name,args)};}


const BASE='https://backend.composio.dev/api/v3.1';
const EXEC_BASE='https://backend.composio.dev/api/v3.1';
const SUBJECT='linkedin-composio-setup';
const USER_ID='bedrijfsgeheugen-owner';
const ALIAS='bedrijfsgeheugen-company-canonical';
const COMPANY_AUTH_CONFIG_NAME='Bedrijfsgeheugen LinkedIn Company';
const COMPANY_OAUTH_SCOPES=['openid','profile','email','r_organization_admin','r_organization_social','w_organization_social'];
const COMPANY_REQUIRED_SCOPES=['r_organization_admin','w_organization_social'];
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const SERVICE_TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const clean=(v:unknown)=>String(v??'').trim();
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
function jsonObject(value:any){if(!value)return{};if(typeof value==='string'){try{const parsed=JSON.parse(value);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};}catch{return {};}}return typeof value==='object'&&!Array.isArray(value)?value:{};}
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
    const db=createDirectDb();
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

    const {data:priorStateRow}=await db.from('brain_records').select('status,result').eq('tenant_id','canonical').eq('record_id','linkedin-composio-setup-current-state-v1').maybeSingle();
    const priorState=jsonObject(priorStateRow?.result);
    const priorRequestedScopes=Array.isArray(priorState?.requested_company_scopes)?priorState.requested_company_scopes.map(clean).filter(Boolean):[];
    const boundOauthAccountId=clean(priorState?.oauth_candidate_connection_id||priorState?.company_oauth_connection_id);

    if(action==='create_link'){
      const configsBody=await api(key,'/auth_configs?toolkit_slug=linkedin&is_composio_managed=true&show_disabled=false&limit=50');
      const configs=(Array.isArray(configsBody?.items)?configsBody.items:[])
        .filter((x:any)=>x?.is_composio_managed===true&&clean(x?.status).toUpperCase()!=='DISABLED');
      const scopeSet=(value:any)=>new Set(clean(value?.credentials?.scopes||value?.credentials?.user_scopes).split(/[\s,]+/).map((v:string)=>v.trim()).filter(Boolean));
      const companyConfigs=configs.filter((x:any)=>{
        const scopes=scopeSet(x);
        return COMPANY_REQUIRED_SCOPES.every(scope=>scopes.has(scope));
      }).sort((a:any,b:any)=>
        Number(clean(b?.name)===COMPANY_AUTH_CONFIG_NAME)-Number(clean(a?.name)===COMPANY_AUTH_CONFIG_NAME)
        ||clean(b?.last_updated_at||b?.created_at).localeCompare(clean(a?.last_updated_at||a?.created_at))
      );
      const priorConfigHasRequired=COMPANY_REQUIRED_SCOPES.every(scope=>priorRequestedScopes.includes(scope));
      let authConfigId=priorConfigHasRequired?clean(priorState?.auth_config_id):clean(companyConfigs[0]?.id);
      if(!authConfigId){
        const created=await api(key,'/auth_configs',{method:'POST',body:JSON.stringify({
          toolkit:{slug:'linkedin'},
          auth_config:{
            type:'use_composio_managed_auth',
            name:COMPANY_AUTH_CONFIG_NAME,
            credentials:{scopes:COMPANY_OAUTH_SCOPES.join(',')},
            restrict_to_following_tools:['LINKEDIN_GET_MY_INFO','LINKEDIN_GET_COMPANY_INFO','LINKEDIN_CREATE_LINKED_IN_POST','LINKEDIN_GET_POST_CONTENT']
          }
        })});
        authConfigId=clean(created?.auth_config?.id||created?.id);
      }
      if(!authConfigId)throw new Error('COMPOSIO_LINKEDIN_COMPANY_AUTH_CONFIG_ID_MISSING');
      const link=await api(key,'/connected_accounts/link',{method:'POST',body:JSON.stringify({auth_config_id:authConfigId,user_id:USER_ID,alias:ALIAS})});
      const redirectUrl=clean(link?.redirect_url),connectedAccountId=clean(link?.connected_account_id);
      if(!redirectUrl||!connectedAccountId)throw new Error('COMPOSIO_LINKEDIN_SCOPED_REDIRECT_OR_ACCOUNT_MISSING');
      const oauthRequestedAt=new Date().toISOString();
      const result={ready:false,state:'AUTH_LINK_READY',reason:'LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED',api_key_present:true,auth_config_id:authConfigId,connected_account_id:connectedAccountId,oauth_candidate_connection_id:connectedAccountId,link_available:true,expires_at:clean(link?.expires_at)||null,production_workspace:true,requested_company_scopes:COMPANY_OAUTH_SCOPES,canonical_alias:ALIAS,oauth_requested_at:oauthRequestedAt,company_oauth_fresh_verified:false};
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

    const healthy:any[]=[];
    const rejected:any[]=[];
    for(const candidate of accounts){
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
    const {data:repairRecord}=await db
      .from('brain_records')
      .select('result,updated_at')
      .eq('tenant_id','canonical')
      .eq('record_id','linkedin-runtime-repair-link-v1')
      .maybeSingle();
    const preferredRepairAccountId=clean(jsonObject(repairRecord?.result)?.connected_account_id);
    const repairedHealthy=preferredRepairAccountId
      ? healthy.filter(x=>x.accountId===preferredRepairAccountId)
      : [];
    const boundHealthy=boundOauthAccountId?healthy.filter(x=>x.accountId===boundOauthAccountId):[];
    const expectedPersonalAuthor='urn:li:person:N1twnCNCrD';
    const personalCanonical=healthy.filter(x=>
      x.personAuthor===expectedPersonalAuthor
      && clean(x.account?.alias).toLowerCase().includes('linkedin-personal-canonical')
    );
    const canonical=healthy.filter(x=>clean(x.account?.alias)===ALIAS);
    const selectable=boundOauthAccountId
      ? boundHealthy
      : (repairedHealthy.length===1
          ? repairedHealthy
          : (personalCanonical.length===1
              ? personalCanonical
              : (canonical.length===1?canonical:healthy)));
    if(selectable.length!==1){
      const reason=boundOauthAccountId?'COMPOSIO_LINKEDIN_BOUND_OAUTH_NOT_HEALTHY':'COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS';
      const result={
        ready:false,state:'AMBIGUOUS',reason,
        api_key_present:true,active_accounts:accounts.length,healthy_accounts:healthy.length,
        preferred_repair_account_id:preferredRepairAccountId||null,
        preferred_repair_account_healthy:repairedHealthy.length===1,
        auth_config_id:clean(priorState?.auth_config_id)||null,
        oauth_candidate_connection_id:boundOauthAccountId||null,
        requested_company_scopes:priorRequestedScopes,
        oauth_requested_at:clean(priorState?.oauth_requested_at)||null,
        company_oauth_fresh_verified:false,
        rejected_accounts:rejected,personal_ready:false,company_ready:false
      };
      await writeState(db,'BLOCKED_AMBIGUOUS',result);return json({ok:true,...result},409);
    }

    const selected=selectable[0];
    const selectionSource=boundOauthAccountId
      ? 'fresh_company_oauth_candidate'
      : (repairedHealthy.length===1
          ? 'latest_repair_connected_account'
          : (personalCanonical.length===1
              ? 'personal_canonical_alias'
              : (canonical.length===1?'canonical_alias':'single_healthy_account')));
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
    const adminAclVerified=!companyError&&discoveredOrgUrns.includes(configuredOrg);
    const freshOauthBound=!!boundOauthAccountId&&accountId===boundOauthAccountId&&!!clean(priorState?.oauth_requested_at);
    const requestedOrgAdmin=freshOauthBound&&(priorRequestedScopes.includes('r_organization_admin')||priorRequestedScopes.includes('rw_organization_admin'));
    const requestedOrgWrite=freshOauthBound&&priorRequestedScopes.includes('w_organization_social');
    const requestedOrgRead=freshOauthBound&&priorRequestedScopes.includes('r_organization_social');
    const hasOrgAdminScope=grantedScopes.includes('r_organization_admin')||grantedScopes.includes('rw_organization_admin')||(adminAclVerified&&requestedOrgAdmin);
    const hasOrgWriteScope=grantedScopes.includes('w_organization_social')||grantedScopes.includes('w_organization_social_feed')||requestedOrgWrite;
    const hasOrgReadScope=grantedScopes.includes('r_organization_social')||grantedScopes.includes('r_organization_social_feed')||requestedOrgRead;
    const companyAuthorConfigured=adminAclVerified;
    const personalReadbackReady=personalReady&&hasMemberReadScope;
    const companyAdminReadReady=companyAuthorConfigured&&hasOrgAdminScope;
    const companyOauthFreshVerified=freshOauthBound&&companyAdminReadReady&&hasOrgWriteScope;
    const companyReady=personalReady&&companyOauthFreshVerified;
    const companyReadbackReady=companyReady&&hasOrgReadScope;
    const companyState=companyReady?'ACTIVE':personalReady?'COMPANY_AUTH_REQUIRED':'CAPABILITY_UNVERIFIED';
    const companyReason=companyReady?null:personalReady?'LINKEDIN_COMPANY_ORG_OAUTH_REQUIRED':'LINKEDIN_PERSONAL_AUTHOR_UNVERIFIED';
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
      selection_source:selectionSource,
      preferred_repair_account_id:preferredRepairAccountId||null,
      connected_account_id:accountId,
      auth_config_id:clean(priorState?.auth_config_id)||null,
      oauth_candidate_connection_id:boundOauthAccountId||null,
      requested_company_scopes:priorRequestedScopes,
      oauth_requested_at:clean(priorState?.oauth_requested_at)||null,
      company_oauth_fresh_verified:companyOauthFreshVerified,
      user_id:userId,
      alias:clean(account?.alias),
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
      linkedin_company_admin_oauth_proven:companyOauthFreshVerified,
      organization_write_scope_verified:companyOauthFreshVerified&&hasOrgWriteScope,
      company_oauth_connection_id:companyOauthFreshVerified?accountId:null,
      company_oauth_verified_at:companyOauthFreshVerified?(clean(priorState?.company_oauth_verified_at)||new Date().toISOString()):null,
      company_live_proven_eligible:companyOauthFreshVerified&&companyReadbackReady,
      company_author_source:discoveredOrgUrns.includes(configuredOrg)?'live_org_acl':'configured_canonical_urn',
      company_readback_ready:companyReadbackReady,
      company_read_scope_present:hasOrgReadScope,
      company_readback_scope_required:companyReadbackReady?null:'r_organization_social',
      company_capability_error:companyError?companyError.slice(0,220):null,
      toolkit_version_policy:'latest'
    };
    if(action==='resume'&&companyReady){
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
