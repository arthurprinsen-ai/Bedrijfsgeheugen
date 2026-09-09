import { basicAuthMatches, normalizeConnectionPage, normalizeUnansweredPage, normalizeCommentPage, normalizeDmPage } from '../../platform/linkedin-revenue-cockpit.mjs';

const NOTION_VERSION='2025-09-03';
const SOURCES=Object.freeze({connections:'3b2da36a-ac8a-80f1-a78d-000b4766fd4c',unanswered:'3b2da36a-ac8a-80c4-a392-000b0f6d3b2f',comments:'0c7f1516-1e2f-42f9-9f15-4b0081de8e7a',dms:'b3a5793e-b314-4faa-90e2-d1357f23804e'});
const secureHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'};
const response=(statusCode,payload,extraHeaders={})=>({statusCode,headers:{...secureHeaders,...extraHeaders},body:JSON.stringify(payload)});
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const a=v=>Array.isArray(v)?v:[];
const s=v=>String(v??'').trim();

async function coreFetch(route,{method='GET',body}={}){
  const url=s(process.env.POWERHOUSE_CORE_URL).replace(/\/$/,'');
  const token=s(process.env.POWERHOUSE_CORE_TOKEN);
  if(!url||!token)throw new Error('POWERHOUSE_CORE_NOT_CONFIGURED');
  const r=await fetch(`${url}${route}`,{method,headers:{'content-type':'application/json','accept':'application/json','x-powerhouse-token':token},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(9000)});
  const payload=await r.json().catch(()=>({}));
  if(!r.ok||payload?.ok===false)throw new Error(`POWERHOUSE_CORE_${payload?.error||r.status}`);
  return payload;
}

async function queryDataSource(token,dataSourceId,body={}){
  if(!token)return[];
  const r=await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Notion-Version':NOTION_VERSION},body:JSON.stringify({page_size:100,...body}),signal:AbortSignal.timeout(7000)});
  if(!r.ok){const error=await r.json().catch(()=>({}));throw new Error(`NOTION_${error?.code||r.status}`)}
  return a((await r.json()).results);
}
async function safeNotion(name,token,id,body){try{const rows=await queryDataSource(token,id,body);return{name,ok:Boolean(token),rows,count:rows.length}}catch(error){return{name,ok:false,rows:[],count:0,error:String(error?.message||'NOTION_FAILED')}}}

function canonicalAction(x,notionByUrl=new Map()){
  const o=x.opportunity||{};
  const enrich=notionByUrl.get(s(x.person_key).toLowerCase())||notionByUrl.get(s(x.source_url).toLowerCase())||{};
  const message=s(x.message_draft);
  const concrete=/^https:\/\/(?:www\.)?linkedin\.com\/(?:in\/|posts\/|feed\/update\/|messaging\/thread\/)/i.test(s(x.source_url));
  const contextReady=Boolean(message&&concrete&&x.action_type!=='no_context');
  return{
    id:x.action_id,
    actionId:x.action_id,
    opportunityKey:x.opportunity_key||o.opportunity_key||'',
    person:x.person_name||enrich.person||x.person_key||'Onbekende relatie',
    company:x.company_name||enrich.company||x.company_key||'',
    role:x.role||enrich.role||'',
    sourceUrl:x.source_url||enrich.sourceUrl||enrich.linkedinUrl||'',
    linkedinUrl:enrich.linkedinUrl||x.source_url||'',
    channel:x.channel||'LinkedIn DM',
    actionType:x.action_type||'',
    stage:o.stage||'opportunity',
    expectedValue:n(o.expected_value_eur||x.expected_value_eur),
    probability:n(o.probability||x.probability),
    confidence:n(o.confidence||x.confidence),
    expectedRevenueValue:n(o.expected_revenue_value||x.expected_revenue_value),
    scoreComponents:o.score_components||x.score_components||x.evidence?.score_components||{},
    score:n(x.priority),
    whyNow:x.reason||enrich.whyNow||'',
    nextAction:x.reason||enrich.nextAction||'Controleer de bron en voer de volgende evidence-backed actie uit.',
    readyText:contextReady?message:'',
    contextState:contextReady?'ready':'context_required',
    evidence:x.evidence||{},
    dueAt:x.due_at||null,
    status:x.status||'suggested'
  };
}
function canonicalOpportunity(x){return{id:x.opportunity_id,opportunityKey:x.opportunity_key,person:x.person_key||'',company:x.company_key||'',stage:x.stage,status:x.status,expectedValue:n(x.expected_value_eur),probability:n(x.probability),confidence:n(x.confidence),expectedRevenueValue:n(x.expected_revenue_value),scoreComponents:x.score_components||{},evidence:x.evidence||{},topic:x.topic_key||'',lastEvidenceAt:x.last_evidence_at||null,lastActionAt:x.last_action_at||null,nextActionAt:x.next_action_at||null}}

async function notionProjection(){
  const token=s(process.env.NOTION_TOKEN);
  const [connectionsResult,unansweredResult,commentsResult,dmsResult]=await Promise.all([
    safeNotion('connections',token,SOURCES.connections,{filter:{or:[{property:'Drive Status',select:{equals:'Nu'}},{property:'Bal ligt bij',select:{equals:'Zij wachten op mij'}},{property:'Prioriteit',select:{equals:'1 — Nu'}}]}}),
    safeNotion('unanswered',token,SOURCES.unanswered,{filter:{property:'Bal ligt bij',select:{equals:'Zij wachten op mij'}}}),
    safeNotion('comments',token,SOURCES.comments,{filter:{property:'Status',select:{does_not_equal:'Geen match'}}}),
    safeNotion('dms',token,SOURCES.dms,{filter:{property:'Status',select:{does_not_equal:'Vervallen'}}})
  ]);
  const sourceResults=[connectionsResult,unansweredResult,commentsResult,dmsResult];
  const sourceHealth=Object.fromEntries(sourceResults.map(r=>[r.name,{ok:r.ok,count:r.count,...(r.error?{error:r.error}:{})}]));
  const connections=connectionsResult.rows.map(normalizeConnectionPage).filter(x=>x.person&&x.linkedinUrl);
  const byId=new Map(connections.map(x=>[x.id,x]));
  const unanswered=unansweredResult.rows.map(normalizeUnansweredPage).filter(x=>x.person&&x.linkedinUrl);
  const comments=commentsResult.rows.map(normalizeCommentPage).filter(x=>x.person&&x.sourceUrl);
  const dms=dmsResult.rows.map(page=>normalizeDmPage(page,byId)).filter(x=>x.person&&x.linkedinUrl);
  const byUrl=new Map();for(const x of [...connections,...unanswered,...comments,...dms]){for(const key of [x.linkedinUrl,x.sourceUrl,x.person])if(key)byUrl.set(s(key).toLowerCase(),x)}
  return{sourceHealth,connections,unanswered,comments,dms,byUrl};
}

async function buildSnapshot(){
  const notionPromise=notionProjection();
  const coreResults=await Promise.allSettled([coreFetch('/health'),coreFetch('/actions?limit=15'),coreFetch('/opportunities?limit=50'),coreFetch('/learning'),coreFetch('/recommendations?limit=50')]);
  const labels=['health','actions','opportunities','learning','recommendations'];
  const coreHealth={};coreResults.forEach((r,i)=>{coreHealth[labels[i]]={ok:r.status==='fulfilled',...(r.status==='rejected'?{error:String(r.reason?.message||r.reason)}:{})}});
  if(coreResults[0].status==='rejected'||coreResults[1].status==='rejected')throw new Error('CANONICAL_CORE_UNAVAILABLE');
  const notion=await notionPromise;
  const health=coreResults[0].value;
  const actions=a(coreResults[1].value.items).map(x=>canonicalAction(x,notion.byUrl)).slice(0,15);
  const opportunities=coreResults[2].status==='fulfilled'?a(coreResults[2].value.items).map(canonicalOpportunity):[];
  const learningPayload=coreResults[3].status==='fulfilled'?coreResults[3].value:{};
  const recommendationsPayload=coreResults[4].status==='fulfilled'?coreResults[4].value:{};
  const learnings=[...a(learningPayload.sales).map(x=>({...x,source:'sales'})),...a(learningPayload.revenue).map(x=>({...x,source:'revenue'})),...a(learningPayload.social).map(x=>({...x,source:'social'}))];
  const content=[...a(recommendationsPayload.native),...a(recommendationsPayload.revenueLearnings).map(x=>({...x,kind:'revenue-learning'})),...a(recommendationsPayload.socialLearnings).map(x=>({...x,kind:'social-learning'}))];
  const expectedRevenue=actions.reduce((sum,x)=>sum+n(x.expectedRevenueValue),0);
  const pipeline=opportunities.reduce((sum,x)=>sum+n(x.expectedValue),0);
  const relations=actions.filter(x=>x.actionType==='activate_connection'||x.channel==='LinkedIn DM');
  const conversations=actions.filter(x=>x.actionType==='reply_dm');
  const radar=opportunities.filter(x=>x.status==='open');
  const deals=opportunities.filter(x=>['lead','meeting','offer','order','revenue'].includes(x.stage));
  const allReady=Object.values(coreHealth).every(x=>x.ok);
  return{
    schemaVersion:'powerhouse-revenue-command-center-v1',generatedAt:new Date().toISOString(),status:allReady?'READY':'PARTIAL',maxActions:15,
    core:{...health,sourceHealth:coreHealth},sourceHealth:{core:coreHealth,notion:notion.sourceHealth},
    summary:{orderQueue:actions.length,expectedRevenueValue:expectedRevenue,pipelineValue:pipeline,sendReady:actions.filter(x=>x.contextState==='ready').length,contextRequired:actions.filter(x=>x.contextState!=='ready').length,openOpportunities:radar.length,deals:deals.length,learningCount:learnings.length},
    views:{orderQueue:actions,radar,conversations,relations,content,deals,learning:learnings,system:{core:health,coreHealth,notion:notion.sourceHealth}}
  };
}

export async function handler(event){
  if(event.httpMethod==='OPTIONS')return response(204,{});
  const user=s(process.env.INTERN_GEBRUIKER);const password=s(process.env.INTERN_WACHTWOORD);const authorization=event.headers?.authorization||event.headers?.Authorization||'';
  if(!basicAuthMatches(authorization,user,password))return response(401,{status:'UNAUTHORIZED'},{'WWW-Authenticate':'Basic realm="Intern - Bedrijfsgeheugen", charset="UTF-8"'});
  if(!s(process.env.POWERHOUSE_CORE_URL)||!s(process.env.POWERHOUSE_CORE_TOKEN))return response(503,{status:'CAPABILITY_UNAVAILABLE',reason:'POWERHOUSE_CORE_NOT_CONFIGURED',sourceHealth:{core:{ok:false}}});
  try{
    if(event.httpMethod==='GET')return response(200,await buildSnapshot());
    if(event.httpMethod!=='POST')return response(405,{status:'METHOD_NOT_ALLOWED'},{Allow:'GET, POST'});
    const body=JSON.parse(event.body||'{}');
    if(body.command==='refresh'){
      const result=await coreFetch('/daily',{method:'POST',body:{runDate:body.runDate}});
      return response(200,{status:'REFRESHED',result,snapshot:await buildSnapshot()});
    }
    const actionId=s(body.actionId||body.action_id);const outcomeType=s(body.outcomeType||body.outcome_type);
    const allowed=new Set(['executed','reply_received','no_response','meeting_booked','offer_created','offer_accepted','offer_rejected','order_won','order_lost','revenue_observed','not_relevant','defer']);
    if(!actionId||!allowed.has(outcomeType))return response(400,{status:'VALIDATION_ERROR',reason:'ACTION_AND_VALID_OUTCOME_REQUIRED'});
    const result=await coreFetch('/outcomes',{method:'POST',body:{actionId,outcomeType,revenueEur:Math.max(0,n(body.revenueEur||body.revenue_eur)),evidence:body.evidence||{source:'revenue-command-center'}}});
    return response(200,{status:'RECORDED',result,snapshot:await buildSnapshot()});
  }catch(error){return response(503,{status:'DEGRADED',reason:String(error?.message||'COMMAND_CENTER_FAILED')})}
}
