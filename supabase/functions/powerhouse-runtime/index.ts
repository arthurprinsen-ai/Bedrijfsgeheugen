import {buildContentBrief,chooseOpportunityAction,normalizeExternalSignal,scoreOpportunity,shouldExplore} from './opportunity-engine.mjs';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'GET,POST,OPTIONS'}});
const clean=(v:unknown)=>String(v??'').replace(/\s+/g,' ').trim();
const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const clamp01=(v:unknown)=>Math.max(0,Math.min(1,num(v,0)));
const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');
const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
const headers={apikey:service,authorization:`Bearer ${service}`,'content-type':'application/json',accept:'application/json'};

async function sha256(value:string){const data=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request,scope:string){const raw=clean(req.headers.get('x-powerhouse-token'));if(!raw||!base||!service)return false;const hash=await sha256(raw);const r=await fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}&active=eq.true&select=token_hash,scopes&limit=1`,{headers});if(!r.ok)return false;const row=(await r.json())?.[0];if(!row||!arr(row.scopes).includes(scope))return false;fetch(`${base}/rest/v1/powerhouse_device_tokens?token_hash=eq.${encodeURIComponent(hash)}`,{method:'PATCH',headers:{...headers,prefer:'return=minimal'},body:JSON.stringify({last_used_at:new Date().toISOString()})}).catch(()=>{});return true}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});const text=await r.text();let data:any=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw new Error(`REST_${r.status}:${String(text).slice(0,300)}`);return data}
function keyOf(prefix:string,parts:unknown[]){return `${prefix}:${parts.map(clean).filter(Boolean).join('|')}`.slice(0,500)}
function snippet(s:string,n=180){s=clean(s);return s.length<=n?s:s.slice(0,n-1)+'…'}
function chooseConnectionChannel(c:any){if(clean(c?.phone)&&c?.whatsappAllowed===true)return'WhatsApp';if(clean(c?.email))return'E-mail';return'LinkedIn DM'}

async function learnedAdjustment(subject:string){if(!subject)return 0;try{const rows=await rest(`powerhouse_sales_learnings?subject_key=eq.${encodeURIComponent(subject)}&status=in.(active,proven)&select=effect,confidence&order=updated_at.desc&limit=10`);return arr(rows).reduce((sum:number,x:any)=>sum+num(x?.effect?.priority_delta,0)*num(x?.confidence,0),0)}catch{return 0}}
async function revenueLearningContext(){try{return arr(await rest('revenue_learnings?status=eq.PROVEN&select=learning_id,claim,effect_metric,effect_size,confidence,component_scope,last_validated_at&order=confidence.desc&limit=12'))}catch{return[]}}
function revenueLearningDelta(learnings:any[]){return Math.max(-15,Math.min(15,learnings.reduce((sum,x)=>sum+Math.max(-2,Math.min(2,num(x?.effect_size,0)))*num(x?.confidence,0)*3,0)))}
function observedFreshness(observedAt:unknown){const ms=Date.parse(clean(observedAt));if(!Number.isFinite(ms))return 0.5;const ageHours=Math.max(0,(Date.now()-ms)/36e5);return Math.max(0,Math.min(1,1-(ageHours/168)))}

function basePriority(e:any){let p=num(e?.priority,55);const t=clean(e?.event_type||e?.eventType).toLowerCase();if(t.includes('dm'))p+=25;if(t.includes('reply')||t.includes('inbound'))p+=12;if(t.includes('connection'))p+=8;if(t.includes('post'))p+=5;if(e?.warm===true)p+=10;if(e?.salesStatus==='Te doen')p+=8;return p}
function groundedDecision(e:any){const type=clean(e.event_type||e.eventType).toLowerCase();const person=clean(e.person_name||e.personName||e.author||e.name)||'deze relatie';const first=person.split(' ')[0];const company=clean(e.company_name||e.companyName||e.company);
if(type.includes('dm')){const inbound=clean(e.latest_inbound||e.latestInbound||e.dmText||e.conversationText);const convo=clean(e.conversation_text||e.conversationText||inbound);if(!convo)return{actionable:false,channel:'Wachten',action_type:'no_context',reason:'Geen echte DM-gesprekcontext beschikbaar; daarom geen antwoord genereren.',message_draft:''};const asks=/\?/.test(inbound);const draft=asks?`Hoi ${first}, dank voor je bericht. Je vraagt: “${snippet(inbound,120)}” Ik wil daar precies op ingaan. Mijn korte antwoord: dat hangt vooral af van waar kennis nu vastzit en welke vervolgstap al meetbaar is. Als je wilt, kan ik het op jullie situatie bij ${company||'de organisatie'} concreet maken.`:`Hoi ${first}, dank voor je bericht over “${snippet(inbound,120)}”. Dat sluit aan op wat ik vaak zie: de grootste winst zit niet in nog een tool, maar in kennis en acties aantoonbaar door de organisatie laten lopen. Waar zit bij jullie nu de meeste frictie?`;return{actionable:true,channel:'LinkedIn DM',action_type:'reply_dm',reason:`Antwoord gebaseerd op de echte laatste DM-context: ${snippet(inbound,160)}`,message_draft:draft};}
if(type.includes('post')||type.includes('feed')){const text=clean(e.post_text||e.postText||e.text);if(!text)return{actionable:false,channel:'Wachten',action_type:'no_context',reason:'Geen echte posttekst beschikbaar; daarom geen reactie voorstellen.',message_draft:''};const relevant=/\b(ai|data|kennis|proces|digital|transformat|sales|groei|crm|automatis|organisatie|strategie|mkb|revenue|leadership|technology)\b/i.test(text);if(!relevant)return{actionable:false,channel:'Wachten',action_type:'watch_post',reason:`Post gelezen maar onvoldoende commerciële/inhoudelijke fit: ${snippet(text,150)}`,message_draft:''};return{actionable:true,channel:'LinkedIn commentaar',action_type:'reply_post',reason:`Relevante live postcontext: ${snippet(text,160)}`,message_draft:`Interessant punt in “${snippet(text,115)}”. Wat ik daarbij in de praktijk belangrijk vind: niet de technologie op zichzelf, maar of kennis, eigenaarschap en uitvoering aantoonbaar dezelfde kant op bewegen. Waar zie jij in de praktijk de grootste bottleneck?`};}
if(type.includes('connection')||type.includes('notion')){const channel=chooseConnectionChannel(e);const why=clean(e.powerhouse_reason||e.powerhouseReason||e.reason)||`${person}${company?` bij ${company}`:''} staat als commerciële activatiekans open.`;const draft=channel==='E-mail'?`Hoi ${first}, ik zag dat je bij ${company||'jullie organisatie'} betrokken bent. Ik help organisaties om bedrijfskennis, processen en AI zo te verbinden dat er daadwerkelijk uitvoering en meetbaar resultaat uit komt. Speelt dat thema bij jullie op dit moment?`:`Hoi ${first}, ik kwam ${company||'jullie organisatie'} tegen en was benieuwd hoe jullie kennis en processen borgen terwijl de organisatie verandert of groeit. Ik help directies om kennis uit hoofden om te zetten in werkende processen en AI. Speelt dat thema bij jullie, of totaal niet?`;return{actionable:true,channel,action_type:'activate_connection',reason:why,message_draft:draft};}
return{actionable:false,channel:'Wachten',action_type:'observe',reason:'Geen bewezen uitvoeractie voor dit eventtype.',message_draft:''};}

async function ingest(body:any){const e=body?.event||body||{};const type=clean(e.event_type||e.eventType);const source=clean(e.source)||'powerhouse-v96';if(!type)throw new Error('EVENT_TYPE_REQUIRED');const subject=clean(e.subject_key||e.subjectKey||e.profileUrl||e.threadUrl||e.postUrl||e.personName||e.author);const dedupe=clean(e.dedupe_key||e.dedupeKey)||await sha256(keyOf('event',[type,source,subject,e.occurred_at||e.occurredAt||'',e.latestInbound||e.postText||e.text||'']));const eventRow={dedupe_key:dedupe,event_type:type,source,subject_key:subject||null,person_key:clean(e.person_key||e.personKey||e.profileUrl)||null,company_key:clean(e.company_key||e.companyKey||e.company)||null,channel:clean(e.channel)||null,occurred_at:e.occurred_at||e.occurredAt||new Date().toISOString(),evidence:e.evidence||{},context:e};const rows=await rest('powerhouse_runtime_events?on_conflict=dedupe_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(eventRow)});const event=rows?.[0];const decision=groundedDecision(e);let action=null;if(decision.actionable){const learned=await learnedAdjustment(subject);const priority=Math.max(0,Math.min(100,basePriority(e)+learned));const actionDedupe=await sha256(keyOf('action',[dedupe,decision.action_type,decision.channel]));const actionRow={event_id:event.event_id,dedupe_key:actionDedupe,subject_key:event.subject_key,person_key:event.person_key,company_key:event.company_key,action_type:decision.action_type,channel:decision.channel,priority,reason:decision.reason,evidence:{event_dedupe:dedupe,context_excerpt:snippet(clean(e.latestInbound||e.postText||e.text||e.reason),600),learned_priority_delta:learned},message_draft:decision.message_draft,source_url:clean(e.threadUrl||e.postUrl||e.profileUrl),status:'suggested',due_at:e.dueAt||null};const actions=await rest('powerhouse_sales_actions?on_conflict=dedupe_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(actionRow)});action=actions?.[0];await rest(`powerhouse_runtime_events?event_id=eq.${event.event_id}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'actioned',updated_at:new Date().toISOString()})});}else await rest(`powerhouse_runtime_events?event_id=eq.${event.event_id}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'decided',updated_at:new Date().toISOString()})});return{event,decision,action}}

async function relatedOpportunityContext(topic:string,audience:string){
  try{
    const topicFilter=encodeURIComponent(topic);
    const audienceFilter=encodeURIComponent(audience);
    const signals=arr(await rest(`powerhouse_opportunity_signals?topic=eq.${topicFilter}&audience=eq.${audienceFilter}&select=source,observed_at&order=observed_at.desc&limit=30`));
    const opportunities=arr(await rest(`powerhouse_opportunities?topic=eq.${topicFilter}&audience=eq.${audienceFilter}&select=decision,last_seen_at&order=last_seen_at.desc&limit=12`));
    const sourceDiversity=Math.min(1,new Set(signals.map(x=>clean(x.source)).filter(Boolean)).size/4);
    const fourteenDaysAgo=Date.now()-(14*864e5);
    const recentActions=opportunities.filter(x=>Date.parse(x.last_seen_at)>=fourteenDaysAgo&&clean(x?.decision?.actionType)!=='observe').length;
    return{sourceDiversity,repetitionRisk:Math.min(1,recentActions/4),signalCount:signals.length,recentActions};
  }catch{return{sourceDiversity:0,repetitionRisk:0,signalCount:0,recentActions:0}}
}

async function opportunitySignal(body:any){
  const raw=body?.signal||body||{};
  const signal=normalizeExternalSignal(raw);
  if(!signal.topic)throw new Error('OPPORTUNITY_TOPIC_REQUIRED');
  const related=await relatedOpportunityContext(signal.topic,signal.audience);
  const revenueLearnings=await revenueLearningContext();
  const subject=keyOf('opportunity',[signal.topic,signal.audience,clean(signal.context?.market)]);
  const nativeLearned=await learnedAdjustment(subject);
  const learnedDelta=Math.max(-15,Math.min(15,nativeLearned+revenueLearningDelta(revenueLearnings)));
  const features={...signal.features,
    freshness:Math.max(clamp01(signal.features.freshness),observedFreshness(signal.observedAt)),
    sourceDiversity:Math.max(clamp01(signal.features.sourceDiversity),related.sourceDiversity),
    repetitionRisk:Math.max(clamp01(signal.features.repetitionRisk),related.repetitionRisk),
    learnedDelta
  };
  const scored=scoreOpportunity(features);
  let decision=chooseOpportunityAction({...features,score:scored.score});
  const exploration=decision.actionType==='observe'&&scored.score>=55&&shouldExplore(`${signal.signalKey}|${signal.topic}`,0.15);
  if(exploration)decision={actionType:'create_social_post',channel:'social',reason:'Bounded exploration of a near-threshold opportunity.'};
  const brief=buildContentBrief(signal,scored,decision,{revenueLearnings});
  const eventDedupe=await sha256(keyOf('opportunity-event',[signal.signalKey,brief.opportunityKey]));
  const eventRows=await rest('powerhouse_runtime_events?on_conflict=dedupe_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({dedupe_key:eventDedupe,event_type:'opportunity_signal',source:signal.source,subject_key:subject,person_key:clean(raw.person_key||raw.personKey)||null,company_key:clean(raw.company_key||raw.companyKey)||null,channel:decision.channel||null,occurred_at:signal.observedAt,evidence:{...signal.evidence,source_url:signal.sourceUrl,score:scored.score},context:{signal,features,scored,decision,brief,related,revenue_learning_ids:revenueLearnings.map(x=>x.learning_id)}})});
  const event=eventRows?.[0];
  const signalRows=await rest('powerhouse_opportunity_signals?on_conflict=signal_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({signal_key:signal.signalKey,opportunity_key:brief.opportunityKey,event_id:event?.event_id||null,source:signal.source,source_url:signal.sourceUrl||null,topic:signal.topic,audience:signal.audience,observed_at:signal.observedAt,features,evidence:signal.evidence,context:signal.context})});
  const opportunityRows=await rest('powerhouse_opportunities?on_conflict=opportunity_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({opportunity_key:brief.opportunityKey,topic:signal.topic,audience:signal.audience,market:clean(signal.context?.market)||null,score:scored.score,components:scored.components,penalties:scored.penalties,decision,content_brief:brief,source_count:Math.max(1,related.signalCount+1),exploration,status:decision.actionType==='observe'?'observing':'open',first_seen_at:signal.observedAt,last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
  const opportunity=opportunityRows?.[0];
  let action=null;
  if(decision.actionType!=='observe'){
    const actionDedupe=await sha256(keyOf('opportunity-action',[brief.opportunityKey,decision.actionType,signal.signalKey]));
    const channel=decision.channel==='blog'?'Blog':decision.channel==='social'?'Social':decision.channel==='direct'?'Direct':'Owned';
    const actions=await rest('powerhouse_sales_actions?on_conflict=dedupe_key',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({event_id:event?.event_id||null,dedupe_key:actionDedupe,subject_key:subject,person_key:clean(raw.person_key||raw.personKey)||null,company_key:clean(raw.company_key||raw.companyKey)||null,action_type:decision.actionType,channel,priority:scored.score,reason:decision.reason,evidence:{opportunity_key:brief.opportunityKey,signal_key:signal.signalKey,score:scored.score,components:scored.components,content_brief:brief,revenue_learning_ids:revenueLearnings.map(x=>x.learning_id)},message_draft:'',source_url:signal.sourceUrl||'',status:'suggested',due_at:raw.dueAt||null})});
    action=actions?.[0];
    await rest(`powerhouse_runtime_events?event_id=eq.${event.event_id}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'actioned',updated_at:new Date().toISOString()})});
  }else if(event?.event_id)await rest(`powerhouse_runtime_events?event_id=eq.${event.event_id}`,{method:'PATCH',headers:{prefer:'return=minimal'},body:JSON.stringify({state:'decided',updated_at:new Date().toISOString()})});
  return{signal:signalRows?.[0],opportunity,score:scored,decision,contentBrief:brief,exploration,action,revenueLearningsApplied:revenueLearnings.map(x=>x.learning_id)};
}

async function opportunities(limit=25,status=''){const safe=Math.max(1,Math.min(100,Math.round(limit)));const filter=status?`&status=eq.${encodeURIComponent(status)}`:'';return await rest(`powerhouse_opportunities?select=*&order=score.desc,last_seen_at.desc&limit=${safe}${filter}`)}
async function queue(limit=15){return await rest('rpc/powerhouse_action_queue',{method:'POST',body:JSON.stringify({p_limit:limit})})}
async function outcome(body:any){const actionId=clean(body.action_id||body.actionId);const kind=clean(body.outcome_type||body.outcomeType);if(!actionId||!kind)throw new Error('ACTION_AND_OUTCOME_REQUIRED');const dedupe=clean(body.dedupe_key||body.dedupeKey)||await sha256(keyOf('outcome',[actionId,kind,body.occurredAt||'']));const rows=await rest('rpc/powerhouse_record_outcome',{method:'POST',body:JSON.stringify({p_action_id:actionId,p_dedupe_key:dedupe,p_outcome_type:kind,p_evidence:body.evidence||{},p_revenue_eur:num(body.revenue_eur||body.revenueEur,0)})});const o=Array.isArray(rows)?rows[0]:rows;const fingerprint=await sha256(keyOf('learning',[kind,o?.person_key||o?.subject_key||'',body.channel||'']));const positive=['reply','meeting','offer','order','revenue','qualified'].some(x=>kind.toLowerCase().includes(x));const learning={fingerprint,subject_key:o?.subject_key||null,scope:'sales-outcome',hypothesis:positive?'Deze actie/kanaalcombinatie leverde positieve downstream-respons op.':'Deze actie leverde nog geen positieve downstream-respons op.',evidence:{outcome_id:o?.outcome_id,action_id:actionId,outcome_type:kind,...(body.evidence||{})},effect:{priority_delta:positive?5:-2,reinforce:positive},confidence:positive?0.65:0.35,status:'active'};const lr=await rest('powerhouse_sales_learnings?on_conflict=fingerprint',{method:'POST',headers:{prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(learning)});return{outcome:o,learning:lr?.[0]}}

Deno.serve(async(req:Request)=>{try{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-powerhouse-token','access-control-allow-methods':'GET,POST,OPTIONS'}});
  const u=new URL(req.url);const route=u.pathname.split('/').filter(Boolean).pop()||'health';
  const scope=route==='health'?'health':route==='ingest'||route==='opportunity-signals'?'ingest':route==='actions'?'actions':route==='outcomes'?'outcomes':'learning';
  if(!await authorized(req,scope))return json({ok:false,error:'UNAUTHORIZED'},401);
  if(route==='health'&&req.method==='GET'){await Promise.all([rest('powerhouse_runtime_events?select=event_id&limit=1'),rest('powerhouse_sales_actions?select=action_id&limit=1'),rest('powerhouse_sales_outcomes?select=outcome_id&limit=1'),rest('powerhouse_opportunities?select=opportunity_id&limit=1')]);return json({ok:true,runtime:'powerhouse-v96-supabase-native',version:'96.1.0',makeCriticalPath:false,db:true,learningFeedback:true,opportunityIntelligence:true,revenueLearningContext:true,at:new Date().toISOString()});}
  if(route==='ingest'&&req.method==='POST')return json({ok:true,...await ingest(await req.json())},201);
  if(route==='opportunity-signals'&&req.method==='POST')return json({ok:true,...await opportunitySignal(await req.json())},201);
  if(route==='opportunities'&&req.method==='GET')return json({ok:true,items:await opportunities(num(u.searchParams.get('limit'),25),clean(u.searchParams.get('status')))});
  if(route==='actions'&&req.method==='GET')return json({ok:true,items:await queue(num(u.searchParams.get('limit'),15))});
  if(route==='outcomes'&&req.method==='POST')return json({ok:true,...await outcome(await req.json())},201);
  if(route==='learning'&&req.method==='GET')return json({ok:true,items:await rest('powerhouse_sales_learnings?select=*&order=updated_at.desc&limit=50'),revenue:await revenueLearningContext()});
  return json({ok:false,error:'NOT_FOUND'},404);
}catch(e){return json({ok:false,error:String((e as Error)?.message||e)},500)}});
