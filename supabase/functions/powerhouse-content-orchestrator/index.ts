import {PERSONAL_EDITORIAL_POLICY,personalEditorialViolations} from '../_shared/personal-linkedin-editorial-contract.mjs';
import {buildVerifiedFounderReserve} from '../_shared/personal-founder-source-reserve.mjs';
import {COMPANY_EDITORIAL_POLICY,companyEditorialViolations} from '../_shared/company-linkedin-editorial-contract.mjs';
import {amsterdamScheduledFor} from '../_shared/social-publication-schedule.mjs';
import {selectVerifiedBrandLearnings} from '../_shared/verified-brand-content-learnings.mjs';
import {selectMeasuredNextPostTest,proposeBoundedCreativeExploration} from '../_shared/measured-next-post-challenger.mjs';
import {assertMeasurementSourceReadOnly,assertObservedSnapshotFloor} from '../_shared/measured-provider-db-policy.mjs';
import {classifyCurrentSource} from '../_shared/content-source-freshness.mjs';
import {selectNextContentChannel,contentGenerationCooldown} from '../_shared/content-generation-fairness.mjs';
import {incompleteStructuredArtifactReason,largerArtifactTokenBudget,retryIncompleteEditorialDraft} from '../_shared/content-artifact-incomplete-retry.mjs';
import postgres from 'npm:postgres@3.4.7';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL,miraFaceProofValid} from '../_shared/mira-canonical-face.mjs';
import {resolveMiraFrozenWinner,miraResolvedCaption,miraResolvedEvidence,validateResolvedMiraCaptionForDelivery} from '../_shared/mira-frozen-winner-contract.mjs';

const STEERING_BRAND_CONTRACT='Merkcategorie: dagelijkse ondernemingssturing, geen afzonderlijke AI-tool, chatbot, dashboard of automatiseringspakket. Leg in menselijke ondernemerstermen uit hoe interne én externe veranderingen worden verbonden met strategie, doelen, geld, processen, mensen en risico’s; benoem vervolgens een passende beslissing, de eigenaar van een actie en een controleerbare uitkomst of meetpunt. Het onderscheid is de gesloten verbeterlus: signaal → context → gevolg → beslissing → actie → resultaat → leren. POWERHOUSE is de motor, niet het hoofdproduct. AI-agenten, modelnamen en modulelijsten zijn hoogstens uitleg ná concrete ondernemerswaarde. Nooit verzonnen klantbewijs, gegarandeerde omzet, automatische beslissingen zonder toestemming of onbewezen productcapaciteit. Gebruik per uiting één aantoonbare bron of waarheidsgetrouw voorbeeld en een andere invalshoek dan vorige posts.';
const BLOG_READER_READY_POLICY='openai-blog-reader-ready-v1';
const BLOG_READER_READY_PROMPT="Schrijf uitsluitend definitieve, voor bezoekers geschikte Nederlandstalige blogcontent voor ondernemers. Lever een helder lezersgericht title, body, cta, hook_type, focus_keyword en meta_description. Minimaal 3 concrete ## tussenkoppen en voldoende inhoud om een toepasbaar stappenplan uit te leggen. Geen redactienotities, publicatie-instructies, URL-eigenaarschap-checks, SEO-plannen voor de uitgever, concept/draft-verwijzingen, reviewer-to-do's of stappen die nog vóór publicatie moeten gebeuren. Zet '(canonieke pagina)' of '(concept)' nooit in de titel. Een CTA is een nuttige volgende stap voor de ondernemer, geen taak voor een contentbeheerder. Bewijs externe feiten uit de meegeleverde recommendation.evidence, gebruik geen verzonnen statistieken, cases of onafhankelijk onbewezen leveranciersclaims. Een productaankondiging is een claim van de leverancier, geen gemeten klantresultaat. Schrijf het artikel als openbare tekst, niet als briefing aan een redacteur.";
function blogReaderReadyViolations(artifact:any):string[]{
  const title=String(artifact?.title||'').trim(),body=String(artifact?.body||'').trim(),cta=String(artifact?.cta||'').trim();
  const errors:string[]=[];
  if(body.length<1600)errors.push('BODY_TOO_SHORT');
  if((body.match(/^##\s+/gm)||[]).length<3)errors.push('READER_STRUCTURE_MISSING');
  if(/(?:^|\n)\s*(?:Voordat u publiceert\s*:|Publicatiestap\s*\(vereist|Publicatie-\s*en\s*SEO-aanpak\s*\(|Wat te publiceren als follow-up documenten\s*\()/im.test(body))errors.push('EDITORIAL_PUBLICATION_INSTRUCTIONS');
  if(/Deze tekst is bedoeld als canonieke, zakelijke uitleg en publicatieversie|Gebruik dit als technisch bewijs voor het algemene probleem/i.test(body))errors.push('EDITORIAL_SOURCE_DIRECTIONS');
  if(/\((?:canonieke pagina|canonieke upgrade|concept|draft)\)/i.test(title))errors.push('DRAFT_TITLE');
  if(/URL-eigenaarschap-check|plan één content.upgrade of publicatie/i.test(cta))errors.push('EDITORIAL_CTA');
  if(!title||!cta)errors.push('TITLE_OR_CTA_MISSING');
  return errors;
}

const PERSONAL_STEERING_STORY='In een geverifieerd ondernemersbouwverhaal is AI het technische middel, niet de propositie. Mijn overtuiging gaat over bedrijven die continu veranderen en daarom iedere dag beter moeten kunnen anticiperen, besluiten, uitvoeren en leren. Alleen bronbevestigde persoonlijke ervaringen; geen reclame, jargon of ongevraagde salespitch.';

function compactLinkedInCommentary(value:string,maxLength=2800):string{
  const original=clean(value);
  if(Array.from(original).length<=maxLength)return original;
  // Preserve complete paragraphs and sentences rather than sending an API-invalid 3000+ character post.
  const paragraphs=original.split(/\n\s*\n/).map((p)=>p.trim()).filter(Boolean);
  const retained:string[]=[];
  for(const paragraph of paragraphs){
    const proposed=[...retained,paragraph].join('\n\n');
    if(Array.from(proposed).length>maxLength)break;
    retained.push(paragraph);
  }
  if(retained.join('\n\n').length>=250)return retained.join('\n\n');
  const prefix=Array.from(original).slice(0,maxLength).join('');
  const end=Math.max(prefix.lastIndexOf('. '),prefix.lastIndexOf('! '),prefix.lastIndexOf('? '));
  return end>=250?prefix.slice(0,end+1):prefix.slice(0,prefix.lastIndexOf(' '));
}

const CHANNELS = ['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_GATE = 'channel-identity-hard-gate-v3';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
const PERSONAL_LIFE_ONLY_POLICY = 'personal-linkedin-personal-life-only-v1';
const PERSONAL_AI_NATIVE_POLICY = 'personal-linkedin-ai-native-builder-v1';
const VERSION = 'v11-openai-content';
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
const DIRECT_TABLES=new Set(["bg_gezondheid","powerhouse_daily_runs","powerhouse_content_recommendations","bg_schrijfregels","brain_ai_governance_registry","powerhouse_channel_decisions","content_publication_obligations","powerhouse_media_proof_evidence_v1","powerhouse_instagram_daily_winners_v1","bg_campaign_links","powerhouse_content_artifacts","powerhouse_social_publish_capabilities_v1","social_learnings","social_posts","social_metric_snapshots"]);
const DIRECT_RPCS=new Set(["bg_geheim","powerhouse_materialize_source_backed_channel_candidates_v2"]);
const DB_JSON_COLUMNS=new Set([
 'bg_gezondheid.gegevens','brain_records.result','brain_records.provenance','brain_records.payload',
 'content_publication_obligations.evidence','content_publication_obligations.metrics',
 'powerhouse_channel_decisions.delivery_evidence','powerhouse_channel_decisions.learning_evidence',
 'powerhouse_content_artifacts.generation_evidence','powerhouse_content_recommendations.evidence',
 'powerhouse_daily_runs.evidence','powerhouse_instagram_daily_winners_v1.selector_evidence',
 'powerhouse_instagram_daily_winners_v1.outcome_evidence','powerhouse_instagram_media_jobs_v1.asset_manifest',
 'powerhouse_instagram_media_jobs_v1.proof_manifest','powerhouse_media_proof_evidence_v1.proof_lineage',
 'powerhouse_sales_actions.evidence', 'social_metric_snapshots.metrics'
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
 gte(column:string,value:any){this.filters.push({kind:'gte',column,value:assertObservedSnapshotFloor(this.table,column,value)});return this;}
 not(column:string,operator:string,value:any){this.filters.push({kind:'not',column,operator,value});return this;}
 order(column:string,options:any={}){this.orders.push({column,ascending:options?.ascending!==false});return this;}
 limit(value:number){this.limitValue=Number(value);return this;}
 maybeSingle(){this.singleMode='maybe';return this.execute();}
 single(){this.singleMode='single';return this.execute();}
 then(resolve:any,reject:any){return this.execute().then(resolve,reject);}
 where(values:any[]){const parts:string[]=[];for(const f of this.filters){const col=dbIdent(f.column);if(f.kind==='eq'){parts.push(f.value===null?col+' is null':col+' = '+scalarParam(f.value,values));}else if(f.kind==='in'){if(!f.values.length){parts.push('false');continue;}parts.push(col+' in ('+f.values.map((v:any)=>scalarParam(v,values)).join(',')+')');}else if(f.kind==='gte'){parts.push(col+' >= '+scalarParam(f.value,values,'timestamptz'));}else if(f.kind==='not'&&f.operator==='is'&&f.value===null){parts.push(col+' is not null');}else throw new Error('DB_FILTER_REJECTED');}return parts.length?' where '+parts.join(' and '):'';}
 selectList(raw:string){if(raw.trim()==='*')return '*';return raw.split(',').map(x=>dbIdent(x.trim())).join(',');}
 async execute(){try{assertMeasurementSourceReadOnly(this.table,this.op);const values:any[]=[];let q='';if(this.op==='select'){q='select '+this.selectList(this.columns)+' from public.'+dbIdent(this.table)+this.where(values);if(this.orders.length)q+=' order by '+this.orders.map(o=>dbIdent(o.column)+(o.ascending?' asc':' desc')).join(',');if(Number.isFinite(this.limitValue as number))q+=' limit '+Math.max(0,Math.trunc(this.limitValue as number));}
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
class AIProviderIncompleteOutputError extends Error {
  constructor(model:string,budget:number,reason:string){
    super('AI_ARTIFACT_INCOMPLETE_OUTPUT:'+model+':'+reason+':budget='+budget);
    this.name='AIProviderIncompleteOutputError';
  }
}
async function callAI(key: string, model: string, system: string, user: unknown, tool: any, maxTokens = 3200) {
  const schema = { type:'object', properties:tool.input_schema.properties, required:tool.input_schema.required, additionalProperties:false };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{authorization:'Bearer '+key,'content-type':'application/json'},
    body:JSON.stringify({model,instructions:system,input:JSON.stringify(user),max_output_tokens:maxTokens,
      text:{format:{type:'json_schema',name:tool.name,schema,strict:true}}}),
    signal:AbortSignal.timeout(90_000),
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok){
    const detail=[clean(body?.error?.type),clean(body?.error?.message)].filter(Boolean).join(':').slice(0,240);
    console.error('ORCHESTRATOR_AI_PROVIDER_ERROR',response.status,model,detail);
    throw new AIProviderHttpError(response.status,model,detail);
  }
  const explicitTruncation=incompleteStructuredArtifactReason(body);
  if(explicitTruncation)throw new AIProviderIncompleteOutputError(model,maxTokens,explicitTruncation);
  const raw=(body.output||[]).flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text).join('');
  if(!raw)throw new Error('AI_TOOL_OUTPUT_MISSING:'+model);
  let result:any;
  try {
    result=JSON.parse(raw);
  } catch(error) {
    const truncated=incompleteStructuredArtifactReason(body,error);
    if(truncated)throw new AIProviderIncompleteOutputError(model,maxTokens,truncated);
    throw error;
  }
  if(!validArtifactObject(result))throw new Error('AI_ARTIFACT_SCHEMA_INVALID:'+model);
  return result;
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
async function callComposioArtifact(db:any,model:string,system:string,user:unknown,maxTokens=3200,allowTruncationRetry=true){
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
    signal:AbortSignal.timeout(45_000),
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true)throw new Error('COMPOSIO_GENERATION_FAILED:'+response.status+':'+clean(body?.error||body?.message||body?.data?.message).slice(0,200));
  const raw=clean(body?.data?.choices?.[0]?.message?.content);
  if(!raw)throw new Error('COMPOSIO_GENERATION_EMPTY');
  try {
    return parseArtifactJson(raw);
  } catch(error) {
    const finishReason=clean(body?.data?.choices?.[0]?.finish_reason).toLowerCase();
    const providerTruncation=finishReason==='length'
      ? {status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}
      : {};
    const reason=incompleteStructuredArtifactReason(providerTruncation,error);
    // Retry only demonstrably truncated structured output, at most once.
    // Invalid schema, rejected copy and ambiguous provider failures remain blocked.
    if(!allowTruncationRetry||!reason)throw error;
    const retryBudget=largerArtifactTokenBudget(maxTokens);
    console.warn('COMPOSIO_ARTIFACT_OUTPUT_BOUNDED_RETRY',model,maxTokens,retryBudget,reason);
    return callComposioArtifact(db,model,system,user,retryBudget,false);
  }
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
  if (['linkedin_company','blog'].includes(channel) && !classifyCurrentSource(row).ok) return false;
  if (channel === 'linkedin_company') {
    if (target === 'linkedin_personal' || topic.includes('linkedin_personal')) return false;
    if (evidence?.identity_contract === PERSONAL_CONTRACT || evidence?.personal_truth_verified === true) return false;
    return !target || target === 'cross-channel' || target === 'linkedin' || target === 'linkedin_company' || target === 'company';
  }
  if (channel === 'blog') return !target || target === 'cross-channel' || target === 'blog';
  if (channel === 'instagram_company') return target === 'instagram' || target === 'instagram_company' || target === 'cross-channel';
  return true;
}
function pickRecommendation(recs:any[], channel:string, excludedRecommendationIds:string[]=[]) {
  const excluded=new Set(excludedRecommendationIds.map(clean).filter(Boolean));
  const eligible=[...(recs || [])].filter((r)=>recommendationEligible(r,channel)
    && !excluded.has(clean(r?.recommendation_id)));
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
  if(!miraFaceProofValid(visual,clean(proof?.media_type).toLowerCase()))return false;
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
function plannedDecision(channel:string, recs:any[], personalSource:any, instagramProof:any, excludedRecommendationIds:string[]=[]) {
  if (!executor_capabilities[channel]?.executable) return hardBoundary(channel);
  if (channel === 'linkedin_personal') {
    if (!personalSource) return hardBoundary(channel,excludedRecommendationIds.length ? 'NO_UNIQUE_VERIFIED_PERSONAL_SOURCE' : 'PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    return { channel,decision:'publish',state:'decided',priority:Math.max(70,num(personalSource.priority)),confidence:1,topic_key:clean(personalSource.topic_key),
      rationale:'Verified personal truth source available.',scheduled_hour_local:11,content_brief:clean(personalSource.reason),capability_state:'READY',capability_reason:null,
      decision_source:'verified-personal-source',fallback_recommendation_id:personalSource.recommendation_id };
  }
  if (channel === 'instagram_company' && !instagramVisibleIdentityProven(instagramProof)) {
    return hardBoundary(channel,'EXACT_FINAL_MEDIA_PROOF_REQUIRED');
  }
  const rec = pickRecommendation(recs,channel,excludedRecommendationIds);
  if (!rec) return hardBoundary(channel,excludedRecommendationIds.length
    ? 'NO_UNIQUE_EVIDENCE_BOUND_RECOMMENDATION'
    : 'NO_EVIDENCE_BOUND_RECOMMENDATION');
  return { channel,decision:'publish',state:'decided',priority:Math.min(100,num(rec.priority)),confidence:Math.max(.55,Math.min(.9,num(rec.priority)/100)),topic_key:clean(rec.topic_key),
    rationale:`Evidence-bound decision via recommendation ${rec.recommendation_id}.`,scheduled_hour_local:channel==='blog'?12:channel==='instagram_company'?18:13,
    content_brief:clean(rec.reason),capability_state:'READY',capability_reason:null,decision_source:'deterministic-recommendation-policy',fallback_recommendation_id:rec.recommendation_id };
}
function recoverableUniquenessDenial(row:any){
  if(!row || clean(row.state)!=='blocked' || clean(row.delivery_ref)) return false;
  const evidence=row.delivery_evidence||{};
  const authority=evidence.publication_authority||{};
  return clean(evidence.error).startsWith('GLOBAL_POST_DUPLICATE_BLOCKED:')
    && evidence.global_uniqueness_gate==='blocked'
    && authority.issued===true && authority.consumed===false
    && evidence.provider_create_success!==true
    && evidence.provider_publication_ack_verified!==true
    && evidence.provider_truth_verified!==true
    && evidence.possible_provider_side_effect!==true;
}

// Recover a pre-provider duplicate even if the channel decision was normalized to "hold"
// while the authoritative daily publication obligation retained the actual denial.
// Fail closed on consumed capabilities, unknown authority or any possible provider send.
function recoverableObligationUniquenessDenial(row:any,obligation:any,consumedCapability:boolean){
  if(!row||clean(row.state)!=='blocked'||clean(row.delivery_ref)||consumedCapability)return false;
  if(!obligation||clean(obligation.status).toUpperCase()!=='BLOCKED'||clean(obligation.external_id))return false;
  const evidence=obligation.evidence||{},rowEvidence=row.delivery_evidence||{};
  const authority=evidence.publication_authority||{};
  if(!clean(obligation.last_error).startsWith('GLOBAL_POST_DUPLICATE_BLOCKED:')||
     evidence.global_uniqueness_gate!=='blocked'||
     authority.issued!==true||authority.consumed!==false)return false;
  for(const candidate of [evidence,rowEvidence]){
    if(candidate.provider_create_success===true||
       candidate.provider_publication_ack_verified===true||
       candidate.provider_truth_verified===true||
       candidate.possible_provider_side_effect===true||
       candidate.republish_forbidden===true)return false;
  }
  return true;
}

function shouldPreserveExisting(row:any, channel:string, personalSource:any, consumedCapabilityChannels:Set<string>,obligation:any=null) {
  if (!row) return false;
  // A consumed daily authority is not proof of a post, but it IS evidence of a
  // possibly attempted provider mutation. Never re-decide or resend until
  // provider-side reconciliation resolves that exact earlier attempt.
  if(consumedCapabilityChannels.has(channel) && !clean(row.delivery_ref)) return true;
  if(recoverableUniquenessDenial(row)) return false;
  if(recoverableObligationUniquenessDenial(row,obligation,consumedCapabilityChannels.has(channel))) return false;
  const evidence=row.delivery_evidence||{};
  const personalNoGapReopen = channel === 'linkedin_personal'
    && clean(row.state) === 'skipped'
    && !!personalSource
    && (clean(evidence.no_publish_reason) === 'NO_ELIGIBLE_CONTENT' || !!clean(evidence.invalid_candidate));
  if (personalNoGapReopen) return false;
  // A blocked personal first-person claim with no valid personal truth source must
  // NOT be re-decided on every loop. That infinite priority-100 retry starves
  // independently eligible company/blog priority-99 channels. The same personal
  // obligation remains BLOCKED, never a fake SKIP or provider-side effect.
  // A newly proven source reopens the exact same canonical claim automatically.
  // Reopen only when the very same canonical source eligibility gate accepts it.
  // This also covers verified AI-native founder/build events, not just older life/observation modes.
  const verifiedPersonalSource = !!personalSource && validPersonalSource(personalSource);
  if (channel === 'linkedin_personal'
      && clean(row.state) === 'blocked'
      && clean(evidence.error) === 'PERSONAL_SOURCE_UNVERIFIED'
      && !verifiedPersonalSource) return true;
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
  // Targeted generation runs only after the canonical bootstrap has decided for
  // every channel. It must never rewrite other lanes' decisions or send posts.
  const channelScope = clean(request.channel);
  const allowedChannelScopes = new Set(['linkedin_personal','linkedin_company','instagram_company','blog']);
  if(channelScope && !allowedChannelScopes.has(channelScope)) return json({ok:false,error:'UNKNOWN_CHANNEL_SCOPE'},400);
  let stage = 'materialize-source-backed-candidates';
  let selectedGeneration: {channel:string; evidence:any}|null = null;
  try {
    // The unscoped bootstrap alone owns materialization; scoped workers share
    // its persisted Brain decisions instead of racing on global state.
    if(!channelScope){
      const sourceBackedMaterialization=await db.rpc('powerhouse_materialize_source_backed_channel_candidates_v2',{p_date:runDate});
      if(sourceBackedMaterialization.error) throw new Error('SOURCE_BACKED_CHANNEL_MATERIALIZATION_FAILED:'+sourceBackedMaterialization.error.message);
      // Existing canonical writer, same recommendation table, no new scheduler or RPC.
      try{
        const {data:sources,error:sourceError}=await db.from('powerhouse_content_recommendations')
          .select('recommendation_id,run_date,target_channel,status,priority,evidence')
          .eq('run_date',runDate).eq('target_channel','linkedin_personal')
          .order('priority',{ascending:false}).limit(10);
        if(sourceError)throw new Error('PERSONAL_RESERVE_BASE_READ_FAILED');
        const verified=(sources||[]).find(validPersonalSource);
        for(const alternative of buildVerifiedFounderReserve(verified,runDate)){
          const {error}=await db.from('powerhouse_content_recommendations')
            .upsert(alternative,{onConflict:'dedupe_key',ignoreDuplicates:true});
          if(error)throw new Error('PERSONAL_RESERVE_WRITE_FAILED:'+error.message);
        }
      }catch(error){
        // Other independently approved channel lanes must remain operational.
        console.error('PERSONAL_RESERVE_RECOVERY_DEGRADED',
          clean((error as Error)?.message||error).slice(0,120));
      }
    }
    stage = 'load-context';
    const [runResult,recResult,rulesResult,governanceResult,existingResult,obligationsResult,mediaProofResult,capabilitiesResult] = await Promise.all([
      db.from('powerhouse_daily_runs').select('run_date').eq('run_date',runDate).maybeSingle(),
      db.from('powerhouse_content_recommendations').select('recommendation_id,topic_key,target_channel,recommendation_type,priority,reason,evidence,status').eq('run_date',runDate).order('priority',{ascending:false}).limit(50),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status','actief').order('vertrouwen',{ascending:false}).order('bijgewerkt_op',{ascending:false}).limit(30),
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle(),
      db.from('powerhouse_channel_decisions').select('channel,decision,state,priority,delivery_ref,delivery_evidence').eq('run_date',runDate),
      db.from('content_publication_obligations').select('channel,evidence,status,last_error,external_id').eq('tenant_id','canonical').eq('publication_date',runDate),
      (!channelScope || channelScope==='instagram_company')
        ? db.from('powerhouse_media_proof_evidence_v1').select('exact_media_retrievable,exact_media_sha256,identity_gate_result,media_url,proof_lineage,fingerprint').eq('publication_date',runDate).eq('channel','instagram').order('updated_at',{ascending:false}).limit(1).maybeSingle()
        : Promise.resolve({data:null,error:null}),
      (!channelScope || channelScope.startsWith('linkedin_'))
        ? db.from('powerhouse_social_publish_capabilities_v1')
            .select('channel,consumed_at,revoked_at').eq('run_date',runDate)
            .in('channel',['linkedin_personal','linkedin_company'])
        : Promise.resolve({data:[],error:null}),
    ]);
    // An unavailable Instagram selector cannot interrupt non-Instagram lanes.
    const winnerResult = (!channelScope || channelScope==='instagram_company')
      ? await db.from('powerhouse_instagram_daily_winners_v1').select('recommendation_id,score_version,selected_format').eq('run_date',runDate).maybeSingle()
      : {data:null,error:null};
    if (winnerResult.error) throw new Error('INSTAGRAM_DAILY_WINNER_READ_FAILED');
    const instagramWinner = winnerResult.data || null;
    const run = runResult.data, recs = recResult.data || [], rules = rulesResult.data || [], gov = governanceResult.data;
    if(capabilitiesResult.error) throw new Error('SOCIAL_PUBLICATION_AUTHORITY_RECONCILIATION_READ_FAILED');
    const consumedCapabilityChannels=new Set<string>((capabilitiesResult.data||[])
      .filter((c:any)=>!!c.consumed_at&&!c.revoked_at).map((c:any)=>clean(c.channel)));
    const existing = existingResult.data || [], obligations = obligationsResult.data || [], mediaProof = mediaProofResult.data || null;
    if (!run) throw new Error('DAILY_RUN_MISSING');
    if (!gov || gov.approved !== true || gov.lifecycle_status !== 'ACTIVE' || gov.provider !== 'OpenAI') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey = clean((await db.rpc('bg_geheim',{p_naam:'OPENAI_API_KEY'})).data);


    // A pre-provider semantic-duplicate rejection must rotate to a DIFFERENT,
    // independently verified personal source. Retrying the same source in a new
    // paraphrase loops forever and can never satisfy global story uniqueness.
    const priorPersonal = existing.find((row:any)=>clean(row.channel)==='linkedin_personal') || null;
    const priorPersonalObligation=obligations.find((row:any)=>clean(row.channel)==='linkedin_personal')||null;
    const personalDuplicateRecovery = recoverableUniquenessDenial(priorPersonal)
      || recoverableObligationUniquenessDenial(priorPersonal,priorPersonalObligation,consumedCapabilityChannels.has('linkedin_personal'));
    const personalRejectedSourceIds = personalDuplicateRecovery
      ? [...new Set([
          ...(Array.isArray(priorPersonal?.delivery_evidence?.rejected_recommendation_ids)
            ? priorPersonal.delivery_evidence.rejected_recommendation_ids : []),
          priorPersonal?.delivery_evidence?.personal_source_recommendation_id,
          priorPersonal?.delivery_evidence?.fallback_recommendation_id,
          priorPersonalObligation?.evidence?.personal_source_recommendation_id,
          priorPersonalObligation?.evidence?.fallback_recommendation_id,
          ...(Array.isArray(priorPersonalObligation?.evidence?.rejected_recommendation_ids)
            ? priorPersonalObligation.evidence.rejected_recommendation_ids : []),
        ].map(clean).filter(Boolean))]
      : [];
    const personalSource = recs.filter(validPersonalSource).find((source:any)=>
      !personalRejectedSourceIds.includes(clean(source.recommendation_id))
    ) || null;
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
      mira_source_hash: clean(instagramObligation?.evidence?.instagram_media_proof?.mira_source_hash || instagramObligation?.evidence?.mira_source_hash),
      mira_winner_recommendation_id: clean(instagramObligation?.evidence?.instagram_media_proof?.mira_winner_recommendation_id || instagramObligation?.evidence?.mira_winner_recommendation_id),
      mira_source_led: instagramObligation?.evidence?.instagram_media_proof?.mira_source_led===true,
      mira_entrepreneur_scene: clean(instagramObligation?.evidence?.instagram_media_proof?.mira_entrepreneur_scene),
      mira_business_problem_id: clean(instagramObligation?.evidence?.instagram_media_proof?.mira_business_problem_id),
    };
    const existingByChannel = new Map(existing.map((r:any) => [r.channel,r]));

    stage = 'reconcile-decisions';
    for (const channel of (channelScope ? [] : CHANNELS)) {
      const previous:any = existingByChannel.get(channel);
      const currentObligation=obligations.find((item:any)=>clean(item.channel)===(channel==='instagram_company'?'instagram':channel))||null;
      if (shouldPreserveExisting(previous,channel,personalSource,consumedCapabilityChannels,currentObligation)) continue;
      const recoverableDuplicate=recoverableUniquenessDenial(previous)
        || recoverableObligationUniquenessDenial(previous,currentObligation,consumedCapabilityChannels.has(channel));
      const priorRejected=Array.isArray(previous?.delivery_evidence?.rejected_recommendation_ids)
        ? previous.delivery_evidence.rejected_recommendation_ids.map(clean).filter(Boolean) : [];
      const obligationRejected=Array.isArray(currentObligation?.evidence?.rejected_recommendation_ids)
        ? currentObligation.evidence.rejected_recommendation_ids.map(clean).filter(Boolean) : [];
      const rejectedRecommendationIds=recoverableDuplicate
        ? [...new Set([...priorRejected,...obligationRejected,
            clean(previous?.delivery_evidence?.fallback_recommendation_id),
            clean(previous?.delivery_evidence?.personal_source_recommendation_id),
            clean(currentObligation?.evidence?.personal_source_recommendation_id),
            clean(currentObligation?.evidence?.fallback_recommendation_id)].filter(Boolean))]
        : [];
      const decision:any = plannedDecision(channel,recs,personalSource,instagramProof,
        channel==='linkedin_company'||channel==='linkedin_personal'?rejectedRecommendationIds:[]);
      const personalNoGapReopen = channel === 'linkedin_personal' && clean(previous?.state) === 'skipped' && !!personalSource
        && (clean(previous?.delivery_evidence?.no_publish_reason) === 'NO_ELIGIBLE_CONTENT' || !!clean(previous?.delivery_evidence?.invalid_candidate));
      const stale = personalNoGapReopen || recoverableDuplicate || previous?.delivery_evidence?.stale_delivery_ref === true || clean(previous?.delivery_evidence?.error) === 'PROVIDER_RECORD_MISSING';
      const hour = String(decision.scheduled_hour_local).padStart(2,'0');
      const evidence = { ...(stale?{}:(previous?.delivery_evidence||{})), content_brief:decision.content_brief,decision_engine:VERSION,decision_source:decision.decision_source,
        capability_state:decision.capability_state,capability_reason:decision.capability_reason,executor_capabilities,
        fallback_recommendation_id:channel==='instagram_company'?(instagramWinner?.recommendation_id||decision.fallback_recommendation_id):decision.fallback_recommendation_id,
        daily_winner_recommendation_id:channel==='instagram_company'?instagramWinner?.recommendation_id||null:null,
        daily_winner_score_version:channel==='instagram_company'?instagramWinner?.score_version||null:null,
        daily_winner_format:channel==='instagram_company'?instagramWinner?.selected_format||null:null,
        personal_source_recommendation_id:channel==='linkedin_personal'?personalSource?.recommendation_id||null:null,
        rejected_recommendation_ids:channel==='linkedin_company'||channel==='linkedin_personal' ? rejectedRecommendationIds : [],
        personal_truth_verified:channel==='linkedin_personal'?personalSource?.evidence?.personal_truth_verified===true:null,
        stale_delivery_ref:false,recovery_from_provider_missing:stale };
      const {error} = await db.from('powerhouse_channel_decisions').upsert({ run_date:runDate,channel,decision:decision.decision,state:decision.state,priority:decision.priority,
        confidence:decision.confidence,topic_key:decision.topic_key,rationale:decision.rationale,scheduled_for:amsterdamScheduledFor(runDate,Number(hour)),delivery_ref:stale?null:previous?.delivery_ref||null,
        delivery_evidence:evidence,source_recommendation_ids:recs.map((r:any)=>r.recommendation_id),updated_at:new Date().toISOString() });
      if (error) throw new Error(`DECISION_WRITE:${channel}`);
    }

    stage = 'select-pending';
    const pendingQuery=db.from('powerhouse_channel_decisions')
      .select('channel,priority,rationale,delivery_evidence')
      .eq('run_date',runDate)
      .eq('decision','publish')
      .eq('state','decided')
      .order('priority',{ascending:false})
      .order('channel',{ascending:true})
      .limit(12);
    const {data:pendingRows,error:pendingError}=await (
      channelScope ? pendingQuery.eq('channel',channelScope) : pendingQuery
    );
    if (pendingError) {
      console.error('PENDING_READ_FAILED', pendingError.code, pendingError.message, pendingError.details);
      throw new Error(`PENDING_READ_FAILED:${pendingError.code || 'UNKNOWN'}`);
    }
    const pending = selectNextContentChannel(pendingRows, Date.now());
    if (!pending) return json({ok:true,runDate,generated:false,reason:Array.isArray(pendingRows) && pendingRows.length ? 'ALL_PENDING_CHANNELS_IN_BOUNDED_COOLDOWN' : 'NO_PENDING_ARTIFACT',cooldown_channels:Array.isArray(pendingRows)?pendingRows.map((row:any)=>clean(row.channel)):[],executor_capabilities,personal_source_ready:!!personalSource});
    selectedGeneration = {channel:clean(pending.channel),evidence:pending.delivery_evidence||{}};
    if (pending.channel === 'linkedin_personal' && !personalSource) throw new Error('PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    if (pending.channel === 'instagram_company' && !instagramVisibleIdentityProven(instagramProof)) throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');

    const requiredRecommendationId = pending.channel==='instagram_company'
      ? clean(instagramWinner?.recommendation_id)
      : clean(pending.delivery_evidence?.fallback_recommendation_id);
    const pinnedRecommendation = requiredRecommendationId
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
    const recommendation = pinnedRecommendation || (['linkedin_company','blog'].includes(pending.channel)
      ? pickRecommendation(recs,pending.channel,requiredRecommendationId?[requiredRecommendationId]:[]):null);
    const sourceFreshnessFallback = !!requiredRecommendationId && !pinnedRecommendation && !!recommendation;
    if(sourceFreshnessFallback)console.warn('HISTORICAL_SOURCE_FALLBACK',pending.channel);
    if (pending.channel==='instagram_company' && (!instagramWinner || !recommendation)) throw new Error('INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED');
    let resolvedMira:any=null;
    if(pending.channel==='instagram_company'){
      const [{data:lineage,error:lineageError},{data:job,error:jobError}]=await Promise.all([
        db.from('powerhouse_mira_problem_lineage_v1').select('run_date,winner_recommendation_id,state,source_evidence').eq('run_date',runDate).maybeSingle(),
        db.from('powerhouse_instagram_media_jobs_v1').select('asset_manifest').eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','instagram').maybeSingle()
      ]);
      if(lineageError||jobError)throw new Error('MIRA_WINNER_LINEAGE_READ_FAILED');
      resolvedMira=resolveMiraFrozenWinner(runDate,{winner:instagramWinner,lineage,recommendation,job});
      if(!resolvedMira.ok)throw new Error(resolvedMira.code);
      if(clean(instagramProof?.mira_source_hash)!==clean(resolvedMira.source_hash)
        ||clean(instagramProof?.mira_winner_recommendation_id)!==clean(resolvedMira.winner_recommendation_id))
        throw new Error('MIRA_FROZEN_SOURCE_MEDIA_PROOF_REQUIRED');
    }
    let recentCompanyPosts:string[]=[];
    if(pending.channel==='linkedin_company'){
      const {data:publishedHistory,error:historyError}=await db.from('powerhouse_content_artifacts')
        .select('run_date,body').eq('channel','linkedin_company').eq('status','published')
        .order('run_date',{ascending:false}).limit(28);
      if(historyError)throw new Error('COMPANY_EDITORIAL_HISTORY_UNAVAILABLE:'+historyError.message);
      const current=Date.parse(runDate+'T00:00:00Z');
      recentCompanyPosts=(publishedHistory||[])
        .filter((p:any)=>{const days=(current-Date.parse(clean(p.run_date)+'T00:00:00Z'))/86400000;return days>=1&&days<=21;})
        .map((p:any)=>clean(p.body)).filter(Boolean);
    }
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
    let verifiedBrandLearnings:any[]=[];
    if (['linkedin_company','blog'].includes(pending.channel)) {
      // Source-of-truth is the existing social learning store. Unknown/missing metrics
      // must NOT be promoted to winning creative patterns or shared across tenants.
      const {data:pastLearnings,error:learningError}=await db.from('social_learnings')
        .select('tenant_id,learning_id,component_scope,status,fingerprint,claim,effect_metric,effect_size,sample_size,confidence,last_validated_at,expires_or_review_at,evidence_refs')
        .eq('tenant_id','bedrijfsgeheugen').eq('status','PROVEN')
        .order('last_validated_at',{ascending:false}).limit(30);
      if (learningError) {
        console.warn('BRAND_LEARNING_READ_UNAVAILABLE',clean(learningError.message).slice(0,120));
      } else {
        verifiedBrandLearnings=selectVerifiedBrandLearnings(pastLearnings||[],{now:new Date(),max:3});
      }
    }
    // Next-day creative decisions consume fresh, comparable OWNED brand provider metrics only.
    // Lack of permission/snapshots is an explicit evidence gap, never an invented winner.
    let measuredNextPostTest:any={state:'NOT_APPLICABLE',mode:'READ_ONLY_DECISION_CONTEXT'};
    if(['linkedin_company','instagram_company'].includes(pending.channel)){
      try{
        let postQuery=db.from('social_posts')
          .select('tenant_id,post_id,platform,channel_kind,published_at')
          .eq('tenant_id','bedrijfsgeheugen')
          .eq('platform',pending.channel==='instagram_company'?'instagram':'linkedin');
        postQuery=pending.channel==='instagram_company'
          ?postQuery.in('channel_kind',['instagram_business','instagram_company'])
          :postQuery.eq('channel_kind','linkedin_company');
        const {data:brandPosts,error:postError}=await postQuery
          .not('published_at','is',null)
          .order('published_at',{ascending:false}).limit(24);
        if(postError)throw new Error('MEASURED_BRAND_POST_READ:'+postError.message);
        const postIds=(brandPosts||[]).map((p:any)=>clean(p.post_id)).filter(Boolean);
        let sourceSnapshots:any[]=[];
        if(postIds.length){
          const {data, error:snapshotError}=await db.from('social_metric_snapshots')
            .select('tenant_id,post_id,data_quality,observed_at,metrics')
            .eq('tenant_id','bedrijfsgeheugen').in('post_id',postIds)
            .gte('observed_at',new Date(Date.now()-72*3600000).toISOString())
            .order('observed_at',{ascending:false}).limit(100);
          if(snapshotError)throw new Error('MEASURED_BRAND_SNAPSHOT_READ:'+snapshotError.message);
          sourceSnapshots=data||[];
        }
        measuredNextPostTest=selectMeasuredNextPostTest({posts:brandPosts||[],snapshots:sourceSnapshots,now:new Date(),channel:pending.channel});
      }catch(error){
        measuredNextPostTest={state:'SOURCE_UNAVAILABLE',mode:'READ_ONLY_DECISION_CONTEXT',
          error_class:'COMPANY_PROVIDER_EVIDENCE_READ_FAILED',
          decision:'KEEP_CANONICAL_EDITORIAL_DEFAULT'};
        console.warn('MEASURED_BRAND_TEST_READ_UNAVAILABLE',clean((error as Error)?.message).slice(0,140));
      }
    }
    const artifactTool = { name:'content_artifact',description:'Definitieve kanaaleigen content',input_schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},body:{type:'string'},cta:{type:'string'},hook_type:{type:'string'},focus_keyword:{type:'string'},meta_description:{type:'string'}},required:['title','body','cta','hook_type','focus_keyword','meta_description']}};
    const personalBuilder = pending.channel==='linkedin_personal' && personalSource?.evidence?.ai_native_builder_story_verified === true;
    const personalObservational = pending.channel==='linkedin_personal' && personalSource?.evidence?.observational_personal_theme_verified === true;
    const system = pending.channel==='linkedin_personal'
      ? (personalBuilder
        ? `Schrijf voor Arthur persoonlijk LinkedIn vanuit een aantoonbare AI-native bouwgebeurtenis. Policy ${PERSONAL_AI_NATIVE_POLICY}. Gebruik uitsluitend de meegeleverde Powerhouse/Brain evidence, maar vertaal die volledig naar gewone ondernemerstaal. Dit is het doorlopende verhaal dat ik mijn droom bouw: AI die echte problemen van bedrijven oplost en echt meewerkt. Vaste verhaallijn: wat wilde ik bereiken → welk concreet bedrijfsprobleem wil ik oplossen → wat gebeurde er echt of ging mis → wat heb ik veranderd/geleerd → wat kan AI daardoor nu concreet beter → waar geloof ik in over hoe bedrijven en AI straks samenwerken. Schrijf in de ik-vorm, warm, concreet en begrijpelijk voor iemand zonder technische kennis. Publieke copy mag NOOIT interne stack-, architectuur-, database-, pipeline-, job-, event-, status-, contract- of foutcodetaal bevatten; noem geen Supabase, GitHub, Netlify, runtime, heartbeat, workflow, readback, materializer, interne functienamen of ALL_CAPS/underscore-statussen. Techniek is alleen bronbewijs onder de motorkap en wordt voor publicatie vertaald naar menselijke gevolgen en bedrijfswaarde. Geen generieke AI-content, geen productpitch, geen verzonnen gevoel/ervaring, geen claims buiten de evidence en geen CTA naar een verkoopgesprek. Gebruik daarnaast actief de meegeleverde entrepreneur_problem_sources en search_demand_sources: kies alleen een ondernemersprobleem dat aantoonbaar relevant is voor de bouwgebeurtenis en vertaal brondata naar het onderliggende menselijke bedrijfsprobleem. Behandel externe bronfeiten nooit als Arthurs eigen ervaring. Arthurs vaste overtuiging mag als rode draad terugkomen: wereld, technologie, regels, markten en klantverwachtingen veranderen sneller, dus bedrijven moeten eerder signaleren, anticiperen, leren en bijsturen; AI helpt daarbij, maar mensen houden richting en verantwoordelijkheid. Maak er iedere dag één nieuw hoofdstuk van, geen losse post. Gebruik journey_snapshot om in gewone taal te laten zien wat er inmiddels aantoonbaar staat en gebeurt: bijvoorbeeld hoeveel AI-modellen actief en goedgekeurd zijn, hoeveel pagina’s werkelijk worden gemeten, hoeveel bronnen worden gevolgd, hoeveel acties zijn beoordeeld of vandaag uitgevoerd en welke uitkomsten/waarde daadwerkelijk zijn gemeten. Selecteer alleen cijfers die het verhaal helpen en benoem precies wat ze meten; maak nooit een cijferdump. Laat expliciet ook iets zien dat niet goed ging of nog niet werkt, wat daardoor is aangepast en wat nog niet bewezen is. Gebruik recent_personal_chapters om de voorgaande hoofdstukken te kennen, niet dezelfde anekdote/les opnieuw te vertellen en waar passend natuurlijk aan te sluiten op gisteren/eerdere dagen. De inhoudelijke cirkel is: zien wat verandert → waarde/prioriteit bepalen → adviseren → actie uitzetten → controleren of het echt gebeurt → uitkomst meten → leren → volgende prioriteit. Noem AI expliciet als wezenlijk onderdeel van wat ik bouw, maar nooit als losse hype of chatbotlaag. Laat waar relevant zien dat ik een nieuwe generatie slimme software probeer te bouwen waarin klassieke software, bedrijfsdata, BI/analytics en AI samenkomen. De AI bestaat uit meerdere gespecialiseerde vormen van intelligentie die elk een ander deel van een bedrijf begrijpen — bijvoorbeeld strategie, markt, klant, processen, risico, regelgeving, commerciële kansen, uitvoering, waarde en leren — en die samen tot één prioriteit of volgende stap komen. Als de evidence een actuele total_layers-waarde bevat, mag die als begrijpelijk schaalbewijs worden gebruikt, bijvoorbeeld '32 verschillende intelligentielagen werken inmiddels samen', maar alleen als het getal die dag letterlijk door de bron wordt bevestigd. Vermijd architectuurtaal: de pointe is dat software niet alleen registreert en dashboards niet alleen terugkijken; de combinatie van software + data + BI + AI kan begrijpen, voorspellen, prioriteren, adviseren, handelen en leren. Gebruik ook predictive_forecasts wanneer aanwezig. Vertaal een voorspelling altijd van buiten naar binnen: welk extern signaal of patroon verandert → welk concreet deel van het bedrijf kan hierdoor geraakt worden → wanneer/horizon → mogelijke impact → probability/confidence → wat gebeurt er bij niets doen → welke eerstvolgende actie verdient prioriteit → hoe meten we later of de voorspelling en actie klopten. Maak nooit van een forecast een feit. Wetgeving, AI-regels, cyber, technologie, markt, klantgedrag, concurrentie, subsidies, rente/financiering, arbeidsmarkt/skills, energie en keten mogen als externe radar terugkomen wanneer actuele evidence ze ondersteunt. De sterke belofte is niet 'meer nieuws', maar eerder zien wat waarschijnlijk relevant wordt en de strategie/actie op tijd herijken. Schrijf precies in de taal die in verified_personal_source.evidence.intended_language staat: 'nl' = Nederlands, 'en' = natuurlijk zakelijk Engels. Maak op Engelse dagen een origineel volgend hoofdstuk, geen vertaling of herhaling van een Nederlandse post. Publiceer nooit twee talen in dezelfde persoonlijke LinkedIn-post.`
        : personalObservational
        ? `Schrijf uitsluitend voor Arthur persoonlijk LinkedIn als herkenbare observatie uit het dagelijks leven. Policy ${PERSONAL_LIFE_ONLY_POLICY}. Gebruik source_text alleen als feitelijke inspiratie. Gebruik GEEN ik/mijn/mij/me-vorm, suggereer niet dat Arthur dit zelf heeft meegemaakt en verzin geen persoonlijke ervaring. Toegestaan: telefoon/schermtijd, huis, vervoer, boodschappen, sport, vrije tijd, dagelijkse routines/frustraties en menselijke observaties. Verboden: bedrijven, klanten, MKB, consultancy, opdrachten, bedrijfsprocessen, organisatie-AI/digitalisering, Bedrijfsgeheugen, sales/leads/offertes, cases, thought leadership, zakelijke lessen of een zakelijke moraal. Schrijf menselijk, concreet en met lichte humor waar passend.`
        : `Schrijf uitsluitend voor Arthur persoonlijk LinkedIn vanuit zijn persoonlijke leven. Policy ${PERSONAL_LIFE_ONLY_POLICY}. De uiteindelijke tekst MOET expliciet in de ik-vorm een concrete gebeurtenis uit source_text vertellen. Toegestaan: gezin, kinderen/school, hockey/sport, reizen/vakantie, auto/vervoer, huis/tuin, consumententechniek, boodschappen, familie/generaties, vrije tijd, dagelijkse routines/frustraties en menselijke observaties. Verboden: bedrijven, klanten, MKB, consultancy, opdrachten, bedrijfsprocessen, organisatie-AI/digitalisering, Bedrijfsgeheugen, sales/leads/offertes, cases, thought leadership, zakelijke lessen of een zakelijke moraal. Een persoonlijke anekdote mag nooit als brug naar business dienen. Verzin geen ervaring.`)
      : pending.channel==='linkedin_company'
      ? 'Schrijf een direct publiceerbare Nederlandstalige LinkedIn-bedrijfspost voor Bedrijfsgeheugen, voor de eigenaar of directeur van een MKB-bedrijf. Tussen 90 en 145 woorden; maximaal 1.450 tekens. Begin met één herkenbare, concrete ondernemersfrictie uit bijvoorbeeld een verloren offerte, foutieve planning, trage facturatie, ontbrekende kennis, achterblijvende klantopvolging of onvoorspelbare cashflow. Toon in gewone spreektaal het gevolg (geld, tijd, risico, klant), een haalbare eerste stap en waarom verbonden bedrijfskennis, bestaande systemen en dagelijkse sturing helpen. De lezer moet zich herkennen en weten wat hij morgen anders kan doen. Positioneer het portaal of Powerhouse alleen waar relevant en aantoonbaar; nooit als intern systeemrapport of als losse AI-tool. GEEN beleidsmemo met kopjes Signaal/Context/Gevolg/Beslissing/Actie/Resultaat/Leren, geen checklist voor het MT, geen marketingjargon, geen technische AI-release, geen niet-onderbouwde claim en geen verzonnen klantcase. Kies een andere invalshoek dan recent_company_posts. Hergebruik een subsidie, bronbericht, sector of nieuwsgebeurtenis uit die posts nooit als hoofdonderwerp binnen 21 dagen. Externe actualiteit is hoogstens ondersteunend bewijs bij een breed ondernemersprobleem; een subsidieregeling is geen hoofdproduct. Neem de tracking_url exact één keer op en sluit af met een nuttige uitnodiging of natuurlijke vraag. Gebruik een warme, geloofwaardige, menselijke bedrijfsstem, geen Arthur-ik-verhaal. Vertrouw alleen op aangeleverde feitelijke evidence.'
      : pending.channel==='blog' ? BLOG_READER_READY_PROMPT
      : pending.channel==='instagram_company' ? 'Mira verbeeldt één canoniek PH-P ondernemersprobleem. Verplichte caption: herkenbare scène, oorzaak, potentieel gevolg, concrete portaalcapaciteit/actie/eigenaar, meetpunt en menselijke pointe. Gebruik uitsluitend mira_entrepreneur_context, verzin geen klantresultaat, en claim geen onbewezen portalfeature. Laat in de bijschrifttekst zien wat het portaal doet; het beeld blijft één echte Mira-scène, geen corporate tekstkaart.'
      : 'Schrijf feitelijke kanaaleigen content. Verzin geen cases, cijfers, quotes of ervaringen.';
    const measuredNextPostGuide = measuredNextPostTest?.state==='ELIGIBLE_BOUNDED_NEXT_POST_TEST'
      ? ' Het meegestuurde measured_next_post_test is slechts een te toetsen hypothese uit echte postmetingen. Pas uitsluitend die ene concrete, omkeerbare opening, vraag of CTA als test toe; behoud onderwerp, waarheids- en identiteitsregels. Presenteer dit nooit als bewezen oorzaak, winnaar, garantie of geobserveerde klantomzet. Voorzie geen tweede experimentele verandering.'
      : '';
    const creativeExploration=proposeBoundedCreativeExploration({
      channel:pending.channel,runDate,recommendation,measured:measuredNextPostTest,
      freshness:classifyCurrentSource(recommendation)
    });
    const creativeExplorationGuide=creativeExploration.state==='ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS'
      ? ' De editorial_exploration is uitsluitend een klein te testen idee: pas exact de ene single_change toe binnen hetzelfde onderwerp. Nooit een tweede post, verzonnen conversie, garantie of bewezen winnaar. Behoud alle kanaal-, bron-, identiteit- en redactie-eisen.'
      : '';
    const verifiedBrandLearningGuide = verifiedBrandLearnings.length
      ? ' Leer van de meegeleverde verified_brand_content_learnings als begrensde patronen. Gebruik hoogstens één relevant bewezen patroon voor opening, begrijpelijke pointe of nuttige CTA; behoud de actuele feitelijke aanbeveling. Geen percentages, garanties of nepklantresultaten uit historische engagementdata. Noem dit niet in de publieke tekst.'
      : '';
    const editorialSystem = pending.channel==='linkedin_personal'
      ? system + (personalBuilder ? ' '+PERSONAL_STEERING_STORY : '') + ' VERPLICHTE NOTION-REDACTIECONTRACT: 130–200 woorden; een echt, concreet ik-hoofdstuk of geverifieerde overtuiging; begin bij mens/ondernemer in plaats van technische status; geen ruwe Markdown, tussenkoppen, opsomming of horizontale lijnen; geen links of emoji; nooit een ongecontroleerde statistiek of verzonnen ervaring; geen operationele rapportage over verzonden mails, CI, bewaking of publicatiestatus; geen sales-CTA; eindig met één oprechte open vraag; gebruik alleen als exact geverifieerde bron beschikbaar is een percentage of kwantitatieve publieke claim. Publiceer geen uitwisselbare bedrijfsmarketing, alleen een persoonlijk perspectief op ondernemers helpen anticiperen, besluiten en bijsturen.'
      : pending.channel==='linkedin_company' ? system + verifiedBrandLearningGuide + measuredNextPostGuide + creativeExplorationGuide : system + ' ' + STEERING_BRAND_CONTRACT + verifiedBrandLearningGuide + creativeExplorationGuide;
    stage = 'artifact-ai';
    const miraContext=resolvedMira?miraResolvedEvidence(resolvedMira):null;
    const artifactInput={channel:pending.channel,brief:recommendation?.reason||pending.delivery_evidence?.content_brief||pending.rationale,recommendation,mira_entrepreneur_context:miraContext?{...miraContext,canonical_mira_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_mira_reference_url:MIRA_MASTER_REFERENCE_URL}:null,
      verified_brand_content_learnings:verifiedBrandLearnings,measured_next_post_test:measuredNextPostTest,editorial_exploration:creativeExploration,tracking_url:companyTrackingUrl,recent_company_posts:pending.channel==='linkedin_company'?recentCompanyPosts.map(x=>x.slice(0,850)).slice(0,15):null,verified_personal_source:pending.channel==='linkedin_personal'?personalSource:null,instagram_media_proof:pending.channel==='instagram_company'?instagramProof:null,active_rules:rules};
    let artifact:any;
    let generationProvider='OpenAI';
    let generationModel=gov.model_id;
    let fallbackReason:string|null=null;
    if(pending.channel==='instagram_company'&&resolvedMira?.kind==='approved_source_led'){
      artifact={title:resolvedMira.title,body:miraResolvedCaption(resolvedMira),cta:resolvedMira.cta,hook_type:'Herkenbare situatie',focus_keyword:resolvedMira.focus_keyword,meta_description:resolvedMira.meta_description};
      generationProvider='approved-frozen-source';
      generationModel='mira-source-led-deterministic-v1';
    }else{
    try {
      if(!apiKey)throw new Error('AI_KEY_UNAVAILABLE');
      const initialBudget=pending.channel==='blog'?4800:1800;
      try {
        artifact=await callAI(apiKey,gov.model_id,editorialSystem,artifactInput,artifactTool,initialBudget);
      } catch(firstError) {
        if(!(firstError instanceof AIProviderIncompleteOutputError))throw firstError;
        const retryBudget=largerArtifactTokenBudget(initialBudget);
        console.warn('ORCHESTRATOR_ARTIFACT_OUTPUT_BOUNDED_RETRY',pending.channel,gov.model_id,initialBudget,retryBudget);
        artifact=await callAI(apiKey,gov.model_id,editorialSystem,artifactInput,artifactTool,retryBudget);
      }
    } catch(error) {
      if(!composioFallbackEligible(error))throw error;
      const {data:fallbackGov,error:fallbackGovError}=await db.from('brain_ai_governance_registry')
        .select('model_id,provider,approved,lifecycle_status')
        .eq('tenant_id','canonical').eq('use_case_id','supabase-bg-composio-content-fallback-v1').maybeSingle();
      if(fallbackGovError||!fallbackGov||fallbackGov.approved!==true||fallbackGov.lifecycle_status!=='ACTIVE'||fallbackGov.provider!=='Composio/Groq')throw error;
      generationProvider='Composio/Groq';
      generationModel=clean(fallbackGov.model_id);
      fallbackReason=clean((error as Error)?.message).slice(0,240);
      artifact=await callComposioArtifact(db,generationModel,editorialSystem,artifactInput,pending.channel==='blog'?4800:1800);
    }
    }
    let bodyText = clean(artifact.body);
    if (pending.channel === 'linkedin_personal' || pending.channel === 'linkedin_company') bodyText = compactLinkedInCommentary(bodyText);
    if (pending.channel==='instagram_company') {
      // One approved frozen source controls this story, caption and exact video.
      bodyText=miraResolvedCaption(resolvedMira);
      const check=validateResolvedMiraCaptionForDelivery(runDate,bodyText,miraContext);
      if(!check.ok)throw new Error(check.reason);
      const expectedScene=clean(resolvedMira.scene||resolvedMira.problem?.scene);
      const sceneValid=clean(instagramProof?.mira_entrepreneur_scene)===expectedScene;
      const candidateValid=resolvedMira.kind==='approved_source_led'
        ? (instagramProof?.mira_source_led===true && clean(instagramProof?.media_url)===resolvedMira.asset_url)
        : clean(instagramProof?.mira_business_problem_id)===clean(resolvedMira.problem?.id);
      if(!sceneValid||!candidateValid)throw new Error('MIRA_VISUAL_STORY_MISMATCH_REQUIRE_NEW_MATCHED_MEDIA');
    }
    if (pending.channel==='linkedin_personal') {
      let editorialViolations=personalEditorialViolations(bodyText,personalSource?.evidence||{});
      // One source-grounded editorial rewrite is allowed before final rejection.
      // This is not a publication bypass: all existing hard gates run again.
      if (editorialViolations.length && generationProvider==='OpenAI' && apiKey) {
        const correctionPrompt = editorialSystem
          + ' HERZIEN: de vorige versie werd door het vaste redactiecontract afgekeurd ('
          + editorialViolations.map((item:any)=>item.code).join(', ')
          + '). Schrijf opnieuw, als op zichzelf staande LinkedIn-tekst, tussen 150 en 175 woorden. '
          + 'Geen interne technische termen, geen statusrapport, geen verkooppraatje, geen fictieve ervaringen. '
          + 'Gebruik uitsluitend de geverifieerde persoonlijke bron. Eindig bij een oprichtersverhaal met één open vraag. '
          + 'Controleer zelf de woordlengte en brontrouw voordat je de definitieve body teruggeeft.';
        // Editorial revisions need the same bounded truncation recovery as the
        // initial structured artifact. No retry for rejected prose, identity,
        // schema, authorization or provider HTTP errors.
        const revisionInput={
          ...artifactInput,rejected_draft:bodyText,
          editorial_rejection_codes:editorialViolations.map((item:any)=>item.code)
        };
        const revision=await retryIncompleteEditorialDraft(
          (budget:number)=>callAI(apiKey,gov.model_id,correctionPrompt,revisionInput,artifactTool,budget),
          2400,(error:unknown)=>error instanceof AIProviderIncompleteOutputError,
          largerArtifactTokenBudget,
          (first:number,next:number)=>console.warn('PERSONAL_EDITORIAL_TRUNCATED_BOUNDED_RETRY',gov.model_id,first,next)
        );
        const revisedText=compactLinkedInCommentary(clean(revision?.body));
        if (revisedText
          && personalEditorialViolations(revisedText,personalSource?.evidence||{}).length===0
          && personalFinalCopyValid(revisedText,personalSource?.evidence||{})) {
          bodyText=revisedText;
          artifact={...artifact,...revision,body:revisedText};
          editorialViolations=[];
        }
      }
      if(editorialViolations.length) throw new Error('PERSONAL_EDITORIAL_CONTRACT_FAILED:'+editorialViolations.map(x=>x.code).join(','));
      if(!personalFinalCopyValid(bodyText,personalSource?.evidence||{})) throw new Error('PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED');
    }
    if(pending.channel==='blog'){
      let violations=blogReaderReadyViolations({...artifact,body:bodyText});
      if(violations.length && generationProvider==='OpenAI' && apiKey){
        const revised=await callAI(apiKey,gov.model_id,
          editorialSystem+' EINDREDACTIE HERZIEN: de vorige versie bevat geen lezersklare tekst ('+violations.join(', ')+'). Schrijf een geheel afgerond publiek artikel zonder uitgeversinstructies, met een duidelijke ondernemerstitel, ten minste drie ## koppen en een passende lezers-CTA. Gebruik uitsluitend de al gevalideerde recommendation-evidence. Maak geen onbewezen claims en geef geen technisch release- of SEO-werk aan de lezer.',
          {...artifactInput,rejected_draft:bodyText,editorial_rejection_codes:violations},artifactTool,6500);
        const revisedBody=clean(revised?.body);
        if(blogReaderReadyViolations({...revised,body:revisedBody}).length===0){
          artifact={...artifact,...revised,body:revisedBody};
          bodyText=revisedBody;
          violations=[];
        }
      }
      if(violations.length)throw new Error('BLOG_READER_READY_CONTRACT_FAILED:'+violations.join(','));
    }
    if (pending.channel==='linkedin_company') {
      if (!companyTrackingUrl || !bodyText.includes(companyTrackingUrl)) bodyText=`${bodyText}\n\n${companyTrackingUrl}`;
      if (/printer|08:07|08:10|cyaan/i.test(bodyText) && clean(recommendation?.topic_key).toLowerCase().includes('linkedin_personal')) throw new Error('COMPANY_PERSONAL_CONTENT_LEAK_BLOCKED');
      let editorialViolations=companyEditorialViolations(bodyText,{recentPosts:recentCompanyPosts});
      if(editorialViolations.length && generationProvider==='OpenAI' && apiKey) {
        const revision=await callAI(apiKey,gov.model_id,editorialSystem+
          ' HERSCHRIJF VOOR PUBLICATIE: afgekeurd op '+editorialViolations.map((v:any)=>v.code).join(', ')+
          '. Maak één geheel nieuwe zakelijke LinkedIn-post van 100–135 woorden en maximaal 1.450 tekens: herkenbaar ondernemersprobleem, zakelijk gevolg, concreet eerste advies, begrijpelijke bedrijfswaarde. Geen rapportkoppen, technisch jargon of eerder onderwerp. Voeg tracking_url exact één keer toe. Geen verzonnen bewijs.',
          {...artifactInput,rejected_draft:bodyText,editorial_rejection_codes:editorialViolations.map((v:any)=>v.code)},artifactTool,2400);
        let revised=compactLinkedInCommentary(clean(revision?.body));
        if(revised && companyTrackingUrl && !revised.includes(companyTrackingUrl)) revised+=`\n\n${companyTrackingUrl}`;
        const revisedViolations=companyEditorialViolations(revised,{recentPosts:recentCompanyPosts});
        if(revised && revisedViolations.length===0) {
          bodyText=revised;artifact={...artifact,...revision,body:revised};editorialViolations=[];
        }
      }
      if(editorialViolations.length)throw new Error('COMPANY_EDITORIAL_CONTRACT_FAILED:'+editorialViolations.map((v:any)=>v.code).join(','));
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
      content_brief:recommendation?.reason||pending.delivery_evidence?.content_brief||pending.rationale,generation_evidence:{model:generationModel,provider:generationProvider,primary_model:gov.model_id,fallback_reason:fallbackReason,orchestrator:VERSION,hook_type:clean(artifact.hook_type),focus_keyword:clean(artifact.focus_keyword),meta_description:clean(artifact.meta_description),
      measured_next_post_test:measuredNextPostTest,editorial_exploration:creativeExploration,source_freshness_fallback:sourceFreshnessFallback,
      recommendation_id:recommendation?.recommendation_id||null,
      daily_winner_recommendation_id:pending.channel==='instagram_company'?instagramWinner?.recommendation_id||null:null,
      daily_winner_score_version:pending.channel==='instagram_company'?instagramWinner?.score_version||null:null,
      daily_winner_format:pending.channel==='instagram_company'?instagramWinner?.selected_format||null:null,
      final_copy_approved:pending.channel==='linkedin_company'||pending.channel==='linkedin_personal',editorial_policy_version:pending.channel==='linkedin_personal'?PERSONAL_EDITORIAL_POLICY:pending.channel==='linkedin_company'?COMPANY_EDITORIAL_POLICY:pending.channel==='blog'?BLOG_READER_READY_POLICY:null,automated_blog_reader_ready:pending.channel==='blog'?blogReaderReadyViolations({...artifact,body:bodyText}).length===0:null,identity_gate_evidence:personalEvidence,instagram_media_proof:instagramEvidence,...(miraContext||{})},status:'content_ready',updated_at:new Date().toISOString()});
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
    // A failed text generation has no provider publication side-effect. Cool down only
    // that channel, so another due channel can progress without lowering any content,
    // identity, authorization or publication gate. The canonical executor stays active.
    if (stage === 'artifact-ai' && selectedGeneration) {
      try {
        const prior = selectedGeneration.evidence?.artifact_generation_failure;
        const failure = contentGenerationCooldown(message, Date.now(), Number(prior?.attempts||0));
        await db.from('powerhouse_channel_decisions').update({
          delivery_evidence: {
            ...selectedGeneration.evidence,
            generation_retry_after: failure.retry_after,
            artifact_generation_failure: failure
          },
          updated_at: new Date().toISOString()
        }).eq('run_date',runDate).eq('channel',selectedGeneration.channel).eq('state','decided');
      } catch (recoveryError) {
        console.error('ORCHESTRATOR_CHANNEL_COOLDOWN_WRITE_FAILED',
          clean((recoveryError as Error)?.message||recoveryError).slice(0,160));
      }
    }
    try { await db.from('bg_gezondheid').insert({gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-content-orchestrator',soort:'edge-function',status:'fout',detail:`${stage}:${message}`.slice(0,400),gegevens:{runDate,version:VERSION,stage}}); } catch {}
    return json({ok:false,error:'ORCHESTRATOR_INTERNAL_ERROR',stage,runDate},500);
  }
});
