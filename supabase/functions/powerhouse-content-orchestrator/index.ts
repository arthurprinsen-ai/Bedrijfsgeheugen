import postgres from 'npm:postgres@3.4.7';

const CHANNELS = ['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_GATE = 'channel-identity-hard-gate-v3';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
const PERSONAL_LIFE_ONLY_POLICY = 'personal-linkedin-personal-life-only-v1';
const PERSONAL_AI_NATIVE_POLICY = 'personal-linkedin-ai-native-builder-v1';
const VERSION = 'v10-closed-loop';
const COVERED_STATES = new Set(['content_ready','scheduled','published','measured','learned','skipped']);
const executor_capabilities: Record<string, { executable: boolean; executor: string | null; reason?: string }> = {
  linkedin_personal: { executable: true, executor: 'powerhouse-social-publisher' },
  linkedin_company: { executable: true, executor: 'powerhouse-social-publisher' },
  blog: { executable: true, executor: 'powerhouse-blog-queue' },
  instagram_company: { executable: true, executor: 'powerhouse-social-publisher', reason: 'EXACT_FINAL_MEDIA_PROOF_REQUIRED' },
  email_newsletter: { executable: false, executor: null, reason: 'NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR' },
  linkedin_article_personal: { executable: false, executor: null, reason: 'NO_AUTHORIZED_LINKEDIN_ARTICLE_EXECUTOR' },
  linkedin_article_company: { executable: false, executor: null, reason: 'NO_AUTHORIZED_LINKEDIN_ARTICLE_EXECUTOR' },
};


const DB_REF='adhjwmvyoixzjtmiroln';
const DB_POOLER_HOST='aws-0-eu-central-1.pooler.supabase.com';
const DIRECT_TABLES=new Set(["bg_gezondheid","powerhouse_daily_runs","powerhouse_content_recommendations","bg_schrijfregels","brain_ai_governance_registry","powerhouse_channel_decisions","content_publication_obligations","powerhouse_media_proof_evidence_v1","powerhouse_instagram_daily_winners_v1","bg_campaign_links","powerhouse_content_artifacts"]);
const DIRECT_RPCS=new Set(["bg_geheim","powerhouse_materialize_source_backed_channel_candidates_v2"]);
const DB_JSON_COLUMNS=new Set([
 'bg_gezondheid.gegevens','brain_records.result','brain_records.provenance','brain_records.payload',
 'content_publication_obligations.evidence','content_publication_obligations.metrics',
 'powerhouse_channel_decisions.delivery_evidence','powerhouse_channel_decisions.learning_evidence',
 'powerhouse_content_artifacts.generation_evidence','powerhouse_content_recommendations.evidence',
 'powerhouse_daily_runs.evidence','powerhouse_instagram_daily_winners_v1.selector_evidence',
 'powerhouse_instagram_daily_winners_v1.outcome_evidence','powerhouse_instagram_media_jobs_v1.asset_manifest',
 'powerhouse_instagram_media_jobs_v1.proof_manifest','powerhouse_media_proof_evidence_v1.proof_lineage',
 'powerhouse_sales_actions.evidence'
]);
const DB_ARRAY_CASTS=new Map([
 ['powerhouse_channel_decisions.source_recommendation_ids','uuid[]'],
 ['powerhouse_instagram_media_jobs_v1.allowed_providers','text[]'],
 ['brain_records.predecessor_ids','text[]'],['brain_records.evidence_ids','text[]'],
 ['brain_ai_governance_registry.data_categories','text[]'],['brain_ai_governance_registry.prohibited_data_categories','text[]'],
 ['brain_ai_governance_registry.approval_evidence_ids','text[]'],['brain_ai_governance_registry.evidence_ids','text[]'],
 ['brain_ai_governance_registry.subprocessors','text[]'],['brain_ai_governance_registry.provider_evidence_urls','text[]']
]);
const DB_DEFAULT_CONFLICT=new Map([
 ['powerhouse_channel_decisions','run_date,channel'],['brain_records','tenant_id,record_id'],
 ['content_publication_obligations','tenant_id,publication_date,channel'],['powerhouse_content_artifacts','run_date,channel'],
 ['powerhouse_daily_runs','run_date'],['powerhouse_instagram_daily_winners_v1','run_date'],['bg_campaign_links','key']
]);
function dbIdent(value:string){const m=value.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]||'';if(m!==value)throw new Error('DB_IDENTIFIER_REJECTED');return '"'+value.replaceAll('"','""')+'"';}
function dbPoolerUrl(){const raw=Deno.env.get('SUPABASE_DB_URL')||'';if(!raw)throw new Error('SUPABASE_DB_URL_MISSING');const u=new URL(raw);u.hostname=DB_POOLER_HOST;u.port='6543';u.username='postgres.'+DB_REF;return u.toString();}
const directSql=postgres(dbPoolerUrl(),{max:2,prepare:false,connect_timeout:6,idle_timeout:10,max_lifetime:45});
function scalarParam(value:any,values:any[],cast=''){values.push(value);return String.fromCharCode(36)+values.length+(cast?'::'+cast:'');}
function normalizeJsonValue(value:any){
 let current=value;
 for(let i=0;i<3&&typeof current==='string';i++){
   const raw=current.trim();
   if(!raw)return current;
   try{current=JSON.parse(raw);}catch{return current;}
 }
 return current;
}
function normalizeRowJson(table:string,row:any){
 if(!row||typeof row!=='object'||Array.isArray(row))return row;
 const prefix=table+'.';
 for(const key of DB_JSON_COLUMNS){
   if(!key.startsWith(prefix))continue;
   const column=key.slice(prefix.length);
   if(Object.prototype.hasOwnProperty.call(row,column))row[column]=normalizeJsonValue(row[column]);
 }
 return row;
}

function valueExpr(table:string,column:string,value:any,values:any[]){
 const key=table+'.'+column;
 if(DB_JSON_COLUMNS.has(key)) return scalarParam(JSON.stringify(normalizeJsonValue(value)??null),values,'jsonb');
 const arrCast=DB_ARRAY_CASTS.get(key);
 if(arrCast&&Array.isArray(value)){if(!value.length)return 'ARRAY[]::'+arrCast;return 'ARRAY['+value.map(v=>scalarParam(v,values)).join(',')+']::'+arrCast;}
 return scalarParam(value,values);
}
function rpcExpr(value:any,values:any[]){return value!==null&&typeof value==='object'?scalarParam(JSON.stringify(value),values,'jsonb'):scalarParam(value,values);}
class DirectQuery{
 table:string;op='select';columns='*';payload:any=null;returning='';filters:any[]=[];orders:any[]=[];limitValue:number|null=null;singleMode='';conflict='';ignoreDuplicates=false;
 constructor(table:string){if(!DIRECT_TABLES.has(table))throw new Error('DB_TABLE_REJECTED:'+table);this.table=table;}
 select(columns='*'){if(['update','upsert','insert'].includes(this.op))this.returning=columns;else{this.op='select';this.columns=columns;}return this;}
 insert(payload:any){this.op='insert';this.payload=payload;return this;}
 update(payload:any){this.op='update';this.payload=payload||{};return this;}
 upsert(payload:any,options:any={}){this.op='upsert';this.payload=payload||{};this.conflict=String(options?.onConflict||DB_DEFAULT_CONFLICT.get(this.table)||'');this.ignoreDuplicates=options?.ignoreDuplicates===true;return this;}
 eq(column:string,value:any){this.filters.push({kind:'eq',column,value});return this;}
 in(column:string,values:any[]){this.filters.push({kind:'in',column,values:Array.isArray(values)?values:[]});return this;}
 not(column:string,operator:string,value:any){this.filters.push({kind:'not',column,operator,value});return this;}
 order(column:string,options:any={}){this.orders.push({column,ascending:options?.ascending!==false});return this;}
 limit(value:number){this.limitValue=Number(value);return this;}
 maybeSingle(){this.singleMode='maybe';return this.execute();}
 single(){this.singleMode='single';return this.execute();}
 then(resolve:any,reject:any){return this.execute().then(resolve,reject);}
 where(values:any[]){const parts:string[]=[];for(const f of this.filters){const col=dbIdent(f.column);if(f.kind==='eq'){parts.push(f.value===null?col+' is null':col+' = '+scalarParam(f.value,values));}else if(f.kind==='in'){if(!f.values.length){parts.push('false');continue;}parts.push(col+' in ('+f.values.map((v:any)=>scalarParam(v,values)).join(',')+')');}else if(f.kind==='not'&&f.operator==='is'&&f.value===null){parts.push(col+' is not null');}else throw new Error('DB_FILTER_REJECTED');}return parts.length?' where '+parts.join(' and '):'';}
 selectList(raw:string){if(raw.trim()==='*')return '*';return raw.split(',').map(x=>dbIdent(x.trim())).join(',');}
 async execute(){try{const values:any[]=[];let q='';if(this.op==='select'){q='select '+this.selectList(this.columns)+' from public.'+dbIdent(this.table)+this.where(values);if(this.orders.length)q+=' order by '+this.orders.map(o=>dbIdent(o.column)+(o.ascending?' asc':' desc')).join(',');if(Number.isFinite(this.limitValue as number))q+=' limit '+Math.max(0,Math.trunc(this.limitValue as number));}
 else if(this.op==='insert'){const items=Array.isArray(this.payload)?this.payload:[this.payload];if(!items.length||!items[0])throw new Error('DB_EMPTY_INSERT');const cols=Object.keys(items[0]);q='insert into public.'+dbIdent(this.table)+' ('+cols.map(dbIdent).join(',')+') values '+items.map((item:any)=>'('+cols.map(c=>valueExpr(this.table,c,item[c],values)).join(',')+')').join(',');if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='update'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPDATE');q='update public.'+dbIdent(this.table)+' set '+entries.map(([k,v])=>dbIdent(k)+' = '+valueExpr(this.table,k,v,values)).join(',')+this.where(values);if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='upsert'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPSERT');const cols=entries.map(([k])=>dbIdent(k));const vals=entries.map(([k,v])=>valueExpr(this.table,k,v,values));q='insert into public.'+dbIdent(this.table)+' ('+cols.join(',')+') values ('+vals.join(',')+')';const conflict=this.conflict.split(',').map(x=>x.trim()).filter(Boolean);if(!conflict.length)throw new Error('DB_UPSERT_CONFLICT_REQUIRED');q+=' on conflict ('+conflict.map(dbIdent).join(',')+') ';if(this.ignoreDuplicates)q+='do nothing';else{const set=new Set(conflict);const ups=entries.map(([k])=>k).filter(k=>!set.has(k));q+=ups.length?'do update set '+ups.map(k=>dbIdent(k)+' = excluded.'+dbIdent(k)).join(','):'do nothing';}if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else throw new Error('DB_OPERATION_REJECTED');const rows:any[]=await directSql.unsafe(q,values);const normalized=rows.map((row:any)=>normalizeRowJson(this.table,row));let data:any;if(['insert','update','upsert'].includes(this.op)&&!this.returning)data=null;else if(this.singleMode)data=normalized[0]||null;else data=normalized;return {data,error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
}
async function directRpc(name:string,args:Record<string,any>={}){try{if(!DIRECT_RPCS.has(name))throw new Error('DB_RPC_REJECTED:'+name);const values:any[]=[];const call=Object.entries(args||{}).map(([k,v])=>dbIdent(k)+' := '+rpcExpr(v,values)).join(',');const q='select to_jsonb(public.'+dbIdent(name)+'('+call+')) as result';const rows:any[]=await directSql.unsafe(q,values);return {data:normalizeJsonValue(rows?.[0]?.result??null),error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
function createDirectDb(){return {from:(table:string)=>new DirectQuery(table),rpc:(name:string,args:any={})=>directRpc(name,args)};}

const clean = (v: unknown) => String(v ?? '').trim();
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function digest(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
class AIProviderHttpError extends Error {
  status:number;
  model:string;
  providerDetail:string;
  constructor(status:number,model:string,providerDetail:string=''){
    const safe=String(providerDetail||'').replace(/[\r\n]+/g,' ').slice(0,240);
    super('AI_PROVIDER_REQUEST_FAILED:'+status+':'+model+(safe?':'+safe:''));
    this.name='AIProviderHttpError';
    this.status=status;
    this.model=model;
    this.providerDetail=safe;
  }
}
async function callAI(key: string, model: string, system: string, user: unknown, tool: any, maxTokens = 3200) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version':'2023-06-01','content-type':'application/json' },
    body: JSON.stringify({ model, max_tokens:maxTokens, system, messages:[{role:'user',content:JSON.stringify(user)}], tools:[tool], tool_choice:{type:'tool',name:tool.name} }),
    signal: AbortSignal.timeout(45000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerType=clean(body?.error?.type||body?.type||'');
    const providerMessage=clean(body?.error?.message||body?.message||'');
    const providerDetail=[providerType,providerMessage].filter(Boolean).join(':').slice(0,240);
    console.error('ORCHESTRATOR_AI_PROVIDER_ERROR', response.status, model, providerDetail);
    throw new AIProviderHttpError(response.status,model,providerDetail);
  }
  const result = (body.content || []).find((x:any) => x.type==='tool_use' && x.name===tool.name);
  if (!result?.input) throw new Error('AI_TOOL_OUTPUT_MISSING:'+model);
  return result.input;
}


const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
const ARTIFACT_KEYS=['title','body','cta','hook_type','focus_keyword','meta_description'];
function validArtifactObject(value:any){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const keys=Object.keys(value).sort();
  if(keys.join('|')!==[...ARTIFACT_KEYS].sort().join('|'))return false;
  return ARTIFACT_KEYS.every((key)=>typeof value[key]==='string');
}
function parseArtifactJson(raw:string){
  const cleaned=clean(raw).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  const parsed=JSON.parse(cleaned);
  if(!validArtifactObject(parsed))throw new Error('COMPOSIO_ARTIFACT_SCHEMA_INVALID');
  return parsed;
}
async function callComposioArtifact(db:any,model:string,system:string,user:unknown,maxTokens=3200){
  const key=clean((await db.rpc('bg_geheim',{p_naam:'COMPOSIO_API_KEY'})).data);
  if(!key)throw new Error('COMPOSIO_GENERATION_KEY_UNAVAILABLE');
  const strictSystem=system+' Return ONLY one valid JSON object with exactly these string keys: title, body, cta, hook_type, focus_keyword, meta_description. No markdown or extra prose. Every factual statement and metadata value must be supported by the supplied user data; do not infer unspecified facts.';
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':key},
    body:JSON.stringify({version:'latest',arguments:{model,temperature:0.2,max_tokens:maxTokens,messages:[
      {role:'system',content:strictSystem},
      {role:'user',content:JSON.stringify(user)}
    ]}}),
    signal:AbortSignal.timeout(45000),
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true)throw new Error('COMPOSIO_GENERATION_FAILED:'+response.status+':'+clean(body?.error||body?.message||body?.data?.message).slice(0,200));
  const raw=clean(body?.data?.choices?.[0]?.message?.content);
  if(!raw)throw new Error('COMPOSIO_GENERATION_EMPTY');
  return parseArtifactJson(raw);
}
function composioFallbackEligible(error:any){
  if(error instanceof AIProviderHttpError){
    const detail=clean(error.providerDetail).toLowerCase();
    return detail.includes('credit balance is too low')||[401,403,429].includes(error.status)||error.status>=500;
  }
  return clean(error?.message)==='AI_KEY_UNAVAILABLE';
}

function validPersonalSource(row:any) {
  const e = row?.evidence || {};
  const lineage = Array.isArray(e.source_lineage) ? e.source_lineage.length > 0 : !!e.source_lineage;
  const eligibleStatus = ['suggested','accepted'].includes(clean(row?.status));
  const truthMode = e.personal_truth_verified === true && e.arthur_anchor_verified === true && e.first_person_claims_verified === true;
  const observationalMode = e.observational_personal_theme_verified === true && e.public_theme_source_verified === true && e.first_person_claims_present === false;
  const builderMode = e.ai_native_builder_story_verified === true
    && e.ai_native_builder_policy === PERSONAL_AI_NATIVE_POLICY
    && e.build_event_verified === true
    && e.arthur_anchor_verified === true
    && e.source_backed === true
    && e.business_topic === true
    && e.corporate_voice === false
    && e.company_page_interchangeable === false;
  const legacyPersonal = (truthMode || observationalMode)
    && e.personal_life_topic === true && e.business_topic === false
    && (e.personal_life_only_policy === PERSONAL_LIFE_ONLY_POLICY || e.personal_life_only_verified === true);
  return eligibleStatus && row?.target_channel === 'linkedin_personal'
    && e.identity_contract === PERSONAL_CONTRACT && e.identity_gate_version === PERSONAL_GATE
    && !!clean(e.content_id) && lineage && (builderMode || legacyPersonal)
    && e.corporate_voice === false && e.company_page_interchangeable === false && e.forced_business_moral === false
    && (e.sensitive_private_detail !== true || e.sensitive_private_approval === true);
}
function recommendationScore(row:any, channel:string) {
  const topic = clean(row?.topic_key).toLowerCase();
  const target = clean(row?.target_channel).toLowerCase();
  const sourceBacked = row?.evidence?.source_backed === true;
  let score = num(row?.priority) + num(row?.evidence?.commercial_value) / 10;
  if (sourceBacked && ['linkedin_company','blog'].includes(channel)) score += 500;
  if (row?.evidence?.source_backed === true) score += 250;
  if (row?.recommendation_type === 'calendar_seed' || row?.recommendation_type === 'evergreen_no_gap_fallback') score -= 80;
  if (channel === 'blog' && (topic === 'blog' || target === 'blog')) score += 120;
  if (channel === 'linkedin_company' && (topic.includes('linkedin') || target.includes('linkedin') || target.includes('company'))) score += 100;
  if (channel === 'instagram_company' && (target === 'instagram' || topic.includes('instagram'))) score += 120;
  return score;
}
function recommendationEligible(row:any, channel:string) {
  const target = clean(row?.target_channel).toLowerCase();
  const topic = clean(row?.topic_key).toLowerCase();
  const evidence = row?.evidence || {};
  if (!['suggested',''].includes(clean(row?.status))) return false;
  if (channel === 'linkedin_company') {
    if (target === 'linkedin_personal' || topic.includes('linkedin_personal')) return false;
    if (evidence?.identity_contract === PERSONAL_CONTRACT || evidence?.personal_truth_verified === true) return false;
    return !target || target === 'cross-channel' || target === 'linkedin' || target === 'linkedin_company' || target === 'company';
  }
  if (channel === 'blog') return !target || target === 'cross-channel' || target === 'blog';
  if (channel === 'instagram_company') return target === 'instagram' || target === 'instagram_company' || target === 'cross-channel';
  return true;
}
function pickRecommendation(recs:any[], channel:string) {
  const eligible=[...(recs || [])].filter((r)=>recommendationEligible(r,channel));
  if (channel==='linkedin_company' || channel==='blog') {
    const backed=eligible.filter((r)=>r?.evidence?.source_backed===true);
    if (backed.length) return backed.sort((a,b)=>recommendationScore(b,channel)-recommendationScore(a,channel))[0] || null;
  }
  return eligible.sort((a,b)=>recommendationScore(b,channel)-recommendationScore(a,channel))[0] || null;
}
function personalFinalCopyValid(body:string, evidence:any) {
  const text=clean(body).toLowerCase();
  const source=clean(evidence?.source_text).toLowerCase();
  const hasFirstPerson=/\b(ik|mijn|mij|me|voor mij|bij mij)\b/i.test(body);
  if (evidence?.ai_native_builder_story_verified === true) {
    const buildSignal=/\b(ai|bedrijfsgeheugen|bouwen|gebouwd|bouw|systeem|bedrijf|bedrijven|ondernemer|ondernemers|probleem|oplossen|helpen|leren|veranderen|geloof|droom)\b/i.test(body);
    const salesPitch=/\b(boek|koop|plan een afspraak|dm me|download|meld je aan|gratis scan|frisse blik)\b/i.test(body);
    const technicalJargon=/\b(runtime|heartbeat|workflow|pipeline|orchestration|readback|materializer|supabase|github|netlify|postgres(?:ql)?|database|sql|endpoint|deploy|commit|sha|idempotenc(?:y|ie)|lineage|source[_ -]?health|recovery[_ -]?due|evidence[_ -]?gap|architecture[_ -]?state|learning[_ -]?state|content[_ -]?loop)\b|\b[a-z][a-z0-9]*_[a-z0-9_]+\b/i.test(body);
    return hasFirstPerson && buildSignal && !technicalJargon && !salesPitch && clean(body).length >= 280;
  }
  const noBusinessBridge=!/bedrijfsgeheugen|bedrijf|bedrijven|management|ondernemer|organisatie|proces|digitalisering|consultancy|consultant|klant|opdrachtgever|mkb|sales|lead|omzet|offerte|strategie|business|propositie|dienstverlening|dashboard|governance|roadmap|stakeholder|data-platform|datawarehouse/i.test(body);
  if (evidence?.observational_personal_theme_verified === true) {
    const dailyLife=/\b(thuis|telefoon|app|wandeling|winkel|boodschappen|supermarkt|auto|fiets|trein|school|sport|weekend|vakantie|keuken|straat|buurt|regen|pakket|bezorging|scherm|offline)\b/i.test(body);
    return !hasFirstPerson && dailyLife && noBusinessBridge;
  }
  const anchors=['printer','08:07','08:10','cyaan'].filter(x=>source.includes(x));
  const preserved=anchors.length===0 || anchors.filter(x=>text.includes(x)).length>=Math.min(2,anchors.length);
  return hasFirstPerson && preserved && noBusinessBridge;
}
function hardBoundary(channel:string, reason?:string) {
  const capabilityReason = reason || executor_capabilities[channel]?.reason || 'NO_AUTHORIZED_EXECUTOR';
  return { channel, decision:'hold', state:'blocked', priority:0, confidence:1, topic_key:'', rationale:`BLOCKED_HARD_BOUNDARY: ${capabilityReason}`,
    scheduled_hour_local:9, content_brief:'', capability_state:'BLOCKED_HARD_BOUNDARY', capability_reason:capabilityReason,
    decision_source:'capability-truth', fallback_recommendation_id:null };
}
function instagramVisibleIdentityProven(proof:any) {
  const visual = proof?.instagram_visual || {};
  const refs = Array.isArray(visual?.evidence_refs) ? visual.evidence_refs.map(clean) : [];
  const mediaType = clean(proof?.media_type).toLowerCase();
  const dimensionsOk = ['reel','video'].includes(mediaType)
    ? Number(visual?.width) === 1080 && Number(visual?.height) === 1920
    : Number(visual?.width) === 1080 && Number(visual?.height) === 1350;
  return proof?.exact_final_media_proven === true
    && !!clean(proof?.final_media_sha256)
    && !!clean(proof?.media_url)
    && clean(proof?.mira_gate_result) === 'PASS'
    && visual?.verified === true
    && visual?.semantic_verified === true
    && visual?.mira_present === true
    && clean(visual?.identity_class) === 'mira_daily_life'
    && clean(visual?.evidence_method).toLowerCase() === 'vision'
    && refs.some((ref:string) => /^vision:/i.test(ref))
    && dimensionsOk;
}
function plannedDecision(channel:string, recs:any[], personalSource:any, instagramProof:any) {
  if (!executor_capabilities[channel]?.executable) return hardBoundary(channel);
  if (channel === 'linkedin_personal') {
    if (!personalSource) return hardBoundary(channel,'PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    return { channel,decision:'publish',state:'decided',priority:Math.max(70,num(personalSource.priority)),confidence:1,topic_key:clean(personalSource.topic_key),
      rationale:'Verified personal truth source available.',scheduled_hour_local:11,content_brief:clean(personalSource.reason),capability_state:'READY',capability_reason:null,
      decision_source:'verified-personal-source',fallback_recommendation_id:personalSource.recommendation_id };
  }
  if (channel === 'instagram_company' && !instagramVisibleIdentityProven(instagramProof)) {
    return hardBoundary(channel,'EXACT_FINAL_MEDIA_PROOF_REQUIRED');
  }
  const rec = pickRecommendation(recs,channel);
  if (!rec) return hardBoundary(channel,'NO_EVIDENCE_BOUND_RECOMMENDATION');
  return { channel,decision:'publish',state:'decided',priority:Math.min(100,num(rec.priority)),confidence:Math.max(.55,Math.min(.9,num(rec.priority)/100)),topic_key:clean(rec.topic_key),
    rationale:`Evidence-bound decision via recommendation ${rec.recommendation_id}.`,scheduled_hour_local:channel==='blog'?12:channel==='instagram_company'?18:13,
    content_brief:clean(rec.reason),capability_state:'READY',capability_reason:null,decision_source:'deterministic-recommendation-policy',fallback_recommendation_id:rec.recommendation_id };
}
function shouldPreserveExisting(row:any, channel:string, personalSource:any) {
  if (!row) return false;
  const evidence=row.delivery_evidence||{};
  const personalNoGapReopen = channel === 'linkedin_personal'
    && clean(row.state) === 'skipped'
    && !!personalSource
    && (clean(evidence.no_publish_reason) === 'NO_ELIGIBLE_CONTENT' || !!clean(evidence.invalid_candidate));
  if (personalNoGapReopen) return false;
  return COVERED_STATES.has(clean(row.state))
    || evidence.republish_forbidden === true
    || evidence.possible_provider_side_effect === true
    || (evidence.provider_create_success === true && !!clean(row.delivery_ref))
    || (evidence.provider_truth_verified === true && !!clean(row.delivery_ref));
}


Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ok:false,error:'POST_ONLY'},405);
  const url = Deno.env.get('SUPABASE_URL') || '', service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ok:false,error:'CONFIG'},500);
  const db=createDirectDb();
  const expected = clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if (!expected || req.headers.get('x-powerhouse-token') !== expected) return json({ok:false,error:'UNAUTHORIZED'},401);
  let request:any = {}; try { request = await req.json(); } catch {}
  const runDate = clean(request.runDate) || localDate();
  let stage = 'materialize-source-backed-candidates';
  try {
    const sourceBackedMaterialization=await db.rpc('powerhouse_materialize_source_backed_channel_candidates_v2',{p_date:runDate});
    if(sourceBackedMaterialization.error) throw new Error('SOURCE_BACKED_CHANNEL_MATERIALIZATION_FAILED:'+sourceBackedMaterialization.error.message);
    stage = 'load-context';
    const [runResult,recResult,rulesResult,governanceResult,existingResult,obligationsResult,mediaProofResult] = await Promise.all([
      db.from('powerhouse_daily_runs').select('run_date').eq('run_date',runDate).maybeSingle(),
      db.from('powerhouse_content_recommendations').select('recommendation_id,topic_key,target_channel,recommendation_type,priority,reason,evidence,status').eq('run_date',runDate).order('priority',{ascending:false}).limit(50),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status','actief').order('vertrouwen',{ascending:false}).limit(30),
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle(),
      db.from('powerhouse_channel_decisions').select('channel,decision,state,priority,delivery_ref,delivery_evidence').eq('run_date',runDate),
      db.from('content_publication_obligations').select('channel,evidence').eq('tenant_id','canonical').eq('publication_date',runDate),
      db.from('powerhouse_media_proof_evidence_v1').select('exact_media_retrievable,exact_media_sha256,identity_gate_result,media_url,proof_lineage,fingerprint').eq('publication_date',runDate).eq('channel','instagram').order('updated_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    const winnerResult = await db.from('powerhouse_instagram_daily_winners_v1').select('recommendation_id,score_version,selected_format').eq('run_date',runDate).maybeSingle();
    if (winnerResult.error) throw new Error('INSTAGRAM_DAILY_WINNER_READ_FAILED');
    const instagramWinner = winnerResult.data || null;
    const run = runResult.data, recs = recResult.data || [], rules = rulesResult.data || [], gov = governanceResult.data;
    const existing = existingResult.data || [], obligations = obligationsResult.data || [], mediaProof = mediaProofResult.data || null;
    if (!run) throw new Error('DAILY_RUN_MISSING');
    if (!gov || gov.approved !== true || gov.lifecycle_status !== 'ACTIVE' || gov.provider !== 'Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey = clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data);


    const personalSource = recs.filter(validPersonalSource)[0] || null;
    const instagramObligation = obligations.find((o:any) => o.channel === 'instagram') || null;
    const instagramProof = {
      ...(instagramObligation?.evidence || {}),
      exact_final_media_proven: mediaProof?.exact_media_retrievable === true && !!clean(mediaProof?.exact_media_sha256) && mediaProof?.identity_gate_result === 'PASS',
      final_media_sha256: clean(mediaProof?.exact_media_sha256) || clean(instagramObligation?.evidence?.final_media_sha256),
      media_url: clean(mediaProof?.media_url) || clean(instagramObligation?.evidence?.media_url),
      mira_gate_result: clean(mediaProof?.identity_gate_result) || clean(instagramObligation?.evidence?.mira_gate_result),
      media_provider: clean(mediaProof?.proof_lineage?.media_source) || clean(instagramObligation?.evidence?.media_provider),
      media_type: clean(mediaProof?.proof_lineage?.media_type) || clean(instagramObligation?.evidence?.media_type),
      instagram_visual: mediaProof?.proof_lineage?.instagram_visual || instagramObligation?.evidence?.instagram_visual || instagramObligation?.evidence?.instagram_media_proof?.instagram_visual || null,
      proof_fingerprint: mediaProof?.fingerprint || null,
    };
    const existingByChannel = new Map(existing.map((r:any) => [r.channel,r]));

    stage = 'reconcile-decisions';
    for (const channel of CHANNELS) {
      const previous:any = existingByChannel.get(channel);
      if (shouldPreserveExisting(previous,channel,personalSource)) continue;
      const decision:any = plannedDecision(channel,recs,personalSource,instagramProof);
      const personalNoGapReopen = channel === 'linkedin_personal' && clean(previous?.state) === 'skipped' && !!personalSource
        && (clean(previous?.delivery_evidence?.no_publish_reason) === 'NO_ELIGIBLE_CONTENT' || !!clean(previous?.delivery_evidence?.invalid_candidate));
      const stale = personalNoGapReopen || previous?.delivery_evidence?.stale_delivery_ref === true || clean(previous?.delivery_evidence?.error) === 'PROVIDER_RECORD_MISSING';
      const hour = String(decision.scheduled_hour_local).padStart(2,'0');
      const evidence = { ...(stale?{}:(previous?.delivery_evidence||{})), content_brief:decision.content_brief,decision_engine:VERSION,decision_source:decision.decision_source,
        capability_state:decision.capability_state,capability_reason:decision.capability_reason,executor_capabilities,
        fallback_recommendation_id:channel==='instagram_company'?(instagramWinner?.recommendation_id||decision.fallback_recommendation_id):decision.fallback_recommendation_id,
        daily_winner_recommendation_id:channel==='instagram_company'?instagramWinner?.recommendation_id||null:null,
        daily_winner_score_version:channel==='instagram_company'?instagramWinner?.score_version||null:null,
        daily_winner_format:channel==='instagram_company'?instagramWinner?.selected_format||null:null,
        personal_source_recommendation_id:channel==='linkedin_personal'?personalSource?.recommendation_id||null:null,
        personal_truth_verified:channel==='linkedin_personal'?personalSource?.evidence?.personal_truth_verified===true:null,
        stale_delivery_ref:false,recovery_from_provider_missing:stale };
      const {error} = await db.from('powerhouse_channel_decisions').upsert({ run_date:runDate,channel,decision:decision.decision,state:decision.state,priority:decision.priority,
        confidence:decision.confidence,topic_key:decision.topic_key,rationale:decision.rationale,scheduled_for:`${runDate}T${hour}:00:00+02:00`,delivery_ref:stale?null:previous?.delivery_ref||null,
        delivery_evidence:evidence,source_recommendation_ids:recs.map((r:any)=>r.recommendation_id),updated_at:new Date().toISOString() });
      if (error) throw new Error(`DECISION_WRITE:${channel}`);
    }

    stage = 'select-pending';
    const {data:pendingRows,error:pendingError} = await db.from('powerhouse_channel_decisions')
      .select('channel,priority,rationale,delivery_evidence')
      .eq('run_date',runDate)
      .eq('decision','publish')
      .eq('state','decided')
      .order('priority',{ascending:false})
      .order('channel',{ascending:true})
      .limit(1);
    if (pendingError) {
      console.error('PENDING_READ_FAILED', pendingError.code, pendingError.message, pendingError.details);
      throw new Error(`PENDING_READ_FAILED:${pendingError.code || 'UNKNOWN'}`);
    }
    const pending = Array.isArray(pendingRows) ? pendingRows[0] || null : null;
    if (!pending) return json({ok:true,runDate,generated:false,reason:'NO_PENDING_ARTIFACT',executor_capabilities,personal_source_ready:!!personalSource});
    if (pending.channel === 'linkedin_personal' && !personalSource) throw new Error('PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    if (pending.channel === 'instagram_company' && !instagramVisibleIdentityProven(instagramProof)) throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');

    const requiredRecommendationId = pending.channel==='instagram_company'
      ? clean(instagramWinner?.recommendation_id)
      : clean(pending.delivery_evidence?.fallback_recommendation_id);
    const recommendation = requiredRecommendationId
      ? recs.find((r:any)=>{
          if(clean(r.recommendation_id)!==requiredRecommendationId) return false;
          if(pending.channel==='instagram_company'){
            return !!instagramWinner
              && clean(instagramWinner.recommendation_id)===requiredRecommendationId
              && r?.evidence?.daily_winner===true
              && ['suggested','accepted'].includes(clean(r?.status));
          }
          return recommendationEligible(r,pending.channel);
        }) || null
      : pickRecommendation(recs,pending.channel);
    if (pending.channel==='instagram_company' && (!instagramWinner || !recommendation)) throw new Error('INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED');
    let companyTrackingUrl:string|null=null;
    if (pending.channel==='linkedin_company') {
      const key=`li-company-${runDate.replaceAll('-','')}`;
      companyTrackingUrl=`https://www.bedrijfsgeheugen.nl/g/${key}`;
      const {error:linkError}=await db.from('bg_campaign_links').upsert({
        key,destination:'https://www.bedrijfsgeheugen.nl/frisse-blik',campaign_key:`powerhouse-${runDate}-linkedin-company`,
        status:'active',updated_at:new Date().toISOString()
      },{onConflict:'key'});
      if(linkError) throw new Error('COMPANY_TRACKING_LINK_WRITE_FAILED');
    }
    const artifactTool = { name:'content_artifact',description:'Definitieve kanaaleigen content',input_schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},body:{type:'string'},cta:{type:'string'},hook_type:{type:'string'},focus_keyword:{type:'string'},meta_description:{type:'string'}},required:['title','body','cta','hook_type','focus_keyword','meta_description']}};
    const personalBuilder = pending.channel==='linkedin_personal' && personalSource?.evidence?.ai_native_builder_story_verified === true;
    const personalObservational = pending.channel==='linkedin_personal' && personalSource?.evidence?.observational_personal_theme_verified === true;
    const system = pending.channel==='linkedin_personal'
      ? (personalBuilder
        ? `Schrijf voor Arthur persoonlijk LinkedIn vanuit een aantoonbare AI-native bouwgebeurtenis. Policy ${PERSONAL_AI_NATIVE_POLICY}. Gebruik uitsluitend de meegeleverde Powerhouse/Brain evidence, maar vertaal die volledig naar gewone ondernemerstaal. Dit is het doorlopende verhaal dat ik mijn droom bouw: AI die echte problemen van bedrijven oplost en echt meewerkt. Vaste verhaallijn: wat wilde ik bereiken → welk concreet bedrijfsprobleem wil ik oplossen → wat gebeurde er echt of ging mis → wat heb ik veranderd/geleerd → wat kan AI daardoor nu concreet beter → waar geloof ik in over hoe bedrijven en AI straks samenwerken. Schrijf in de ik-vorm, warm, concreet en begrijpelijk voor iemand zonder technische kennis. Publieke copy mag NOOIT interne stack-, architectuur-, database-, pipeline-, job-, event-, status-, contract- of foutcodetaal bevatten; noem geen Supabase, GitHub, Netlify, runtime, heartbeat, workflow, readback, materializer, interne functienamen of ALL_CAPS/underscore-statussen. Techniek is alleen bronbewijs onder de motorkap en wordt voor publicatie vertaald naar menselijke gevolgen en bedrijfswaarde. Geen generieke AI-content, geen productpitch, geen verzonnen gevoel/ervaring, geen claims buiten de evidence en geen CTA naar een verkoopgesprek.`
        : personalObservational
        ? `Schrijf uitsluitend voor Arthur persoonlijk LinkedIn als herkenbare observatie uit het dagelijks leven. Policy ${PERSONAL_LIFE_ONLY_POLICY}. Gebruik source_text alleen als feitelijke inspiratie. Gebruik GEEN ik/mijn/mij/me-vorm, suggereer niet dat Arthur dit zelf heeft meegemaakt en verzin geen persoonlijke ervaring. Toegestaan: telefoon/schermtijd, huis, vervoer, boodschappen, sport, vrije tijd, dagelijkse routines/frustraties en menselijke observaties. Verboden: bedrijven, klanten, MKB, consultancy, opdrachten, bedrijfsprocessen, organisatie-AI/digitalisering, Bedrijfsgeheugen, sales/leads/offertes, cases, thought leadership, zakelijke lessen of een zakelijke moraal. Schrijf menselijk, concreet en met lichte humor waar passend.`
        : `Schrijf uitsluitend voor Arthur persoonlijk LinkedIn vanuit zijn persoonlijke leven. Policy ${PERSONAL_LIFE_ONLY_POLICY}. De uiteindelijke tekst MOET expliciet in de ik-vorm een concrete gebeurtenis uit source_text vertellen. Toegestaan: gezin, kinderen/school, hockey/sport, reizen/vakantie, auto/vervoer, huis/tuin, consumententechniek, boodschappen, familie/generaties, vrije tijd, dagelijkse routines/frustraties en menselijke observaties. Verboden: bedrijven, klanten, MKB, consultancy, opdrachten, bedrijfsprocessen, organisatie-AI/digitalisering, Bedrijfsgeheugen, sales/leads/offertes, cases, thought leadership, zakelijke lessen of een zakelijke moraal. Een persoonlijke anekdote mag nooit als brug naar business dienen. Verzin geen ervaring.`)
      : pending.channel==='linkedin_company'
      ? 'Schrijf uitsluitend voor de Bedrijfsgeheugen-bedrijfspagina: een zakelijk MKB-probleem, concrete diagnose of bewijsgerichte observatie. Gebruik nooit persoonlijke dagboek-/huiselijke content of Arthur-ervaring als company copy. Neem de opgegeven tracking_url letterlijk op in de body. Verzin geen cases, cijfers, quotes of ervaringen.'
      : pending.channel==='instagram_company' ? 'Schrijf Mira daily-life caption passend bij de reeds bewezen finale media. Geen interne kantoorproblemen of geforceerde businessmoraal.'
      : 'Schrijf feitelijke kanaaleigen content. Verzin geen cases, cijfers, quotes of ervaringen.';
    stage = 'artifact-ai';
    const artifactInput={channel:pending.channel,brief:pending.delivery_evidence?.content_brief||pending.rationale,recommendation,
      tracking_url:companyTrackingUrl,verified_personal_source:pending.channel==='linkedin_personal'?personalSource:null,instagram_media_proof:pending.channel==='instagram_company'?instagramProof:null,active_rules:rules};
    let artifact:any;
    let generationProvider='Anthropic';
    let generationModel=gov.model_id;
    let fallbackReason:string|null=null;
    try {
      if(!apiKey)throw new Error('AI_KEY_UNAVAILABLE');
      artifact=await callAI(apiKey,gov.model_id,system,artifactInput,artifactTool,pending.channel==='blog'?4800:2600);
    } catch(error) {
      if(!composioFallbackEligible(error))throw error;
      const {data:fallbackGov,error:fallbackGovError}=await db.from('brain_ai_governance_registry')
        .select('model_id,provider,approved,lifecycle_status')
        .eq('tenant_id','canonical').eq('use_case_id','supabase-bg-composio-content-fallback-v1').maybeSingle();
      if(fallbackGovError||!fallbackGov||fallbackGov.approved!==true||fallbackGov.lifecycle_status!=='ACTIVE'||fallbackGov.provider!=='Composio/Groq')throw error;
      generationProvider='Composio/Groq';
      generationModel=clean(fallbackGov.model_id);
      fallbackReason=clean((error as Error)?.message).slice(0,240);
      artifact=await callComposioArtifact(db,generationModel,system,artifactInput,pending.channel==='blog'?4800:2600);
    }
    let bodyText = clean(artifact.body);
    if (pending.channel==='linkedin_personal' && !personalFinalCopyValid(bodyText,personalSource?.evidence||{})) throw new Error('PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED');
    if (pending.channel==='linkedin_company') {
      if (!companyTrackingUrl || !bodyText.includes(companyTrackingUrl)) bodyText=`${bodyText}\n\n${companyTrackingUrl}`;
      if (/printer|08:07|08:10|cyaan/i.test(bodyText) && clean(recommendation?.topic_key).toLowerCase().includes('linkedin_personal')) throw new Error('COMPANY_PERSONAL_CONTENT_LEAK_BLOCKED');
    }
    const finalTextHash = await digest(bodyText);
    const personalEvidence = pending.channel==='linkedin_personal' ? {...(personalSource.evidence||{}),content_id:clean(personalSource.evidence?.content_id)||`${runDate}:linkedin_personal`,calendar_date:runDate,
      channel_id:PERSONAL_CHANNEL,channel_kind:'linkedin_personal',identity_contract:PERSONAL_CONTRACT,identity_gate_version:PERSONAL_GATE,
      personal_truth_verified:personalSource.evidence?.personal_truth_verified===true,
      observational_personal_theme_verified:personalSource.evidence?.observational_personal_theme_verified===true,
      public_theme_source_verified:personalSource.evidence?.public_theme_source_verified===true,
      first_person_claims_present:personalSource.evidence?.first_person_claims_present===false?false:true,
      ai_native_builder_policy:personalSource.evidence?.ai_native_builder_story_verified===true?PERSONAL_AI_NATIVE_POLICY:null,
      ai_native_builder_story_verified:personalSource.evidence?.ai_native_builder_story_verified===true,
      build_event_verified:personalSource.evidence?.build_event_verified===true,
      personal_life_only_policy:personalSource.evidence?.ai_native_builder_story_verified===true?null:PERSONAL_LIFE_ONLY_POLICY,
      personal_life_only_verified:personalSource.evidence?.ai_native_builder_story_verified===true?false:true,
      prediction_lineage_present:true,prior_prediction_decision_id:`decision:${runDate}:linkedin_personal`,publication_intent:'publish',final_text_hash:finalTextHash} : null;
    const instagramEvidence = pending.channel==='instagram_company' ? {...instagramProof,exact_final_media_proven:true,final_media_sha256:instagramProof.final_media_sha256,media_url:instagramProof.media_url,mira_gate_passed:true} : null;
    const artifactType = pending.channel==='blog'?'blog':pending.channel==='instagram_company'?'instagram_post':'linkedin_post';

    stage = 'write-artifact';
    const {error:artifactError} = await db.from('powerhouse_content_artifacts').upsert({run_date:runDate,channel:pending.channel,artifact_type:artifactType,title:clean(artifact.title),body:bodyText,cta:clean(artifact.cta),
      content_brief:pending.delivery_evidence?.content_brief||pending.rationale,generation_evidence:{model:generationModel,provider:generationProvider,primary_model:gov.model_id,fallback_reason:fallbackReason,orchestrator:VERSION,hook_type:clean(artifact.hook_type),focus_keyword:clean(artifact.focus_keyword),meta_description:clean(artifact.meta_description),
      recommendation_id:recommendation?.recommendation_id||null,
      daily_winner_recommendation_id:pending.channel==='instagram_company'?instagramWinner?.recommendation_id||null:null,
      daily_winner_score_version:pending.channel==='instagram_company'?instagramWinner?.score_version||null:null,
      daily_winner_format:pending.channel==='instagram_company'?instagramWinner?.selected_format||null:null,
      final_copy_approved:pending.channel==='linkedin_company',identity_gate_evidence:personalEvidence,instagram_media_proof:instagramEvidence},status:'content_ready',updated_at:new Date().toISOString()});
    if (artifactError) throw new Error('ARTIFACT_WRITE_FAILED');
    const {error:decisionError} = await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:{...(pending.delivery_evidence||{}),
      daily_winner_recommendation_id:pending.channel==='instagram_company'?instagramWinner?.recommendation_id||null:pending.delivery_evidence?.daily_winner_recommendation_id||null,
      daily_winner_score_version:pending.channel==='instagram_company'?instagramWinner?.score_version||null:pending.delivery_evidence?.daily_winner_score_version||null,
      daily_winner_format:pending.channel==='instagram_company'?instagramWinner?.selected_format||null:pending.delivery_evidence?.daily_winner_format||null,
      identity_gate_evidence:personalEvidence,instagram_media_proof:instagramEvidence},updated_at:new Date().toISOString()})
      .eq('run_date',runDate).eq('channel',pending.channel).eq('state','decided');
    if (decisionError) throw new Error('DECISION_STATE_WRITE_FAILED');
    return json({ok:true,runDate,generated:true,channel:pending.channel,title:artifact.title,executor_capabilities,personal_truth_verified:pending.channel==='linkedin_personal'?true:null});
  } catch (error) {
    const message = String((error as Error)?.message||error).slice(0,500);
    console.error('ORCHESTRATOR_ERROR',stage,message);
    try { await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-content-orchestrator',soort:'edge-function',status:'fout',detail:`${stage}:${message}`.slice(0,400),gegevens:{runDate,version:VERSION,stage}}); } catch {}
    return json({ok:false,error:'ORCHESTRATOR_INTERNAL_ERROR',stage,runDate},500);
  }
});
