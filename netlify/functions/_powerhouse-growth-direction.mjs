// Existing owner-only Andere data: ONE BRAIN cross-channel growth direction.
// Pure read-only projection; no parallel scheduler, new truth store or claims of causality.
const DAY=86400000;
const dayKey=v=>/^\d{4}-\d\d-\d\d$/.test(String(v||''))?String(v):null;
const int=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const sourceNames=['website_interactions','ga4','search_console','linkedin_company_account_provider','revenue_goal'];
const socialMetrics=['views','likes','comments','shares','clicks'];
function directional(current,previous,{quality,coverage}={}){
 const enough=quality==='OBSERVED'&&coverage?.recent>=5&&coverage?.baseline>=5;
 const direction=!enough?'INSUFFICIENT_COMPARABLE_DATA':current>previous?'RISING':current<previous?'FALLING':'FLAT';
 return {direction,current:enough?current:null,previous:enough?previous:null,
   relative_change_pct:enough&&previous>0?Math.round((current/previous-1)*10000)/100:null,
   recent_days:coverage?.recent??0,baseline_days:coverage?.baseline??0,
   truth_class:'OBSERVED_HEURISTIC_NOT_CAUSAL_OR_BUYER_VERIFIED'};
}
function websiteTrend(rows,at){
 const today=new Date(at).toISOString().slice(0,10);
 const midnight=Date.parse(today+'T00:00:00Z');
 const metrics=['human_sessions','human_clicks'];
 const windows={recent:new Map(),baseline:new Map()};
 for(const r of rows||[]){
   if(r?.source_key!=='website_interactions'||r.quality!=='OBSERVED'||!dayKey(r.metric_date))continue;
   const dt=Date.parse(r.metric_date+'T00:00:00Z'),offset=Math.round((midnight-dt)/DAY);
   const w=offset>=1&&offset<=7?'recent':offset>=8&&offset<=14?'baseline':null;
   if(w&&!windows[w].has(r.metric_date))windows[w].set(r.metric_date,r);
 }
 const coverage={recent:windows.recent.size,baseline:windows.baseline.size};
 const result={};
 for(const metric of metrics){
   const a=[...windows.recent.values()].map(r=>int(r.metrics?.[metric]));
   const b=[...windows.baseline.values()].map(r=>int(r.metrics?.[metric]));
   const validA=a.filter(x=>x!==null),validB=b.filter(x=>x!==null);
   result[metric]=directional(validA.reduce((x,y)=>x+y,0),validB.reduce((x,y)=>x+y,0),
     {quality:validA.length>=5&&validB.length>=5?'OBSERVED':'INCOMPLETE',coverage:{recent:validA.length,baseline:validB.length}});
 }
 return {period:'LAST_7_COMPLETE_UTC_DAYS_VS_PREVIOUS_7',metrics:result,
  source:'powerhouse_growth_source_daily_v1:website_interactions',
  source_quality:'OBSERVED_NONROBOT_HEURISTIC_NOT_VERIFIED_UNIQUE_VISITOR_OR_CONSENT'};
}
function coverage(rows,source,today){
 const x=rows.filter(r=>r.source_key===source&&dayKey(r.metric_date)&&r.metric_date<today);
 const sorted=x.sort((a,b)=>b.metric_date.localeCompare(a.metric_date));
 const row=sorted[0];
 return row?{state:row.quality,lastDate:row.metric_date,observedAt:row.source_observed_at||null}:{state:'UNAVAILABLE',lastDate:null,observedAt:null};
}
function classifyPriorities({website,social,providers,replies,proof}){
 const rows=[];
 const needs=(code,owner,reason,action,priority)=>rows.push({code,owner,reason,action,priority,executed:false,verified:false});
 const sessions=website.metrics.human_sessions;
 if(providers.ga4.state!=='PROVIDER_OBSERVED'||providers.search_console.state!=='OBSERVED')
   needs('RESTORE_PROVIDER_ACQUISITION_COVERAGE','EXISTING_SEO_ORDER_ENGINE','GA4/Search Console bron niet recent betrouwbaar','Herstel canonieke GA4/GSC-source mapping en onafhankelijke source readback; geen sessies verzinnen',100);
 if(!social||social.status!=='COMPARABLE_DESCRIPTIVE_METRICS')
   needs('SOCIAL_48H_PROVIDER_COVERAGE','EXISTING_CONTENT_GROWTH_LEARNING','Onvoldoende leeftijdsgelijke 48-uurs postmetingen','Bestaande social collectors op provider-ID en onafhankelijke 48h snapshots controleren; daarna hook/tijdstip/formaat experimenteren',96);
 if(sessions.direction==='INSUFFICIENT_COMPARABLE_DATA')
   needs('FIRST_PARTY_GROWTH_COVERAGE','EXISTING_CRO_EVENT_AGENT','Minder dan 5 complete dagen per vergelijkingsvenster','Bestaande toestemming- en botfilters verifiëren, zonder tracking vóór consent',94);
 if(proof?.businessOutcomeVerified!==true)
   needs('QUALIFIED_BUYER_TO_PAID_ORDER','EXISTING_CRO_REVENUE_ORDER_ENGINE','Bewezen CTA→lead→betaalde order ontbreekt','Meet eerst een echte consented CTA en gekwalificeerde opt-in, voer gecontroleerd CRO-experiment uit, koppel alleen echte betaalde orders aan bron',91);
 if(replies.sourceState!=='LIVE'||replies.providerCoverage!=='VERIFIED')
   needs('EMAIL_REPLY_PROVIDER_MATCH','EXISTING_EMAIL_REPLY_LEARNING','Ontvangst en reply-correctheid niet end-to-end bewezen','Verifieer via bestaande Gmail-provider message-ID, antwoordrelatie, opt-out en order-attributie; geen tweede send',85);
 return rows.sort((a,b)=>b.priority-a.priority);
}
export function projectPowerhouseGrowthDirection({dailySources=[],replyEvents=[],socialFunnel=null,brainClosure=null,
  conversionProof=null,readStates={},at=new Date().toISOString()}={}){
 const stamp=Date.parse(at);
 if(!Number.isFinite(stamp))throw new TypeError('INVALID_GROWTH_DIRECTION_CLOCK');
 const empty={contract:'POWERHOUSE_ONE_BRAIN_GROWTH_DIRECTION_V1',status:'UNVERIFIED',
   observedAt:at,reason:'ORIGINAL_SOURCE_READBACK_UNAVAILABLE',
   website:null,providers:null,social:null,email:null,qualifiedOrders:null,priorities:[],guaranteedUpwardTrend:false};
 if(readStates.growthDaily!=='LIVE'||readStates.emailReplies!=='LIVE'||
    !Array.isArray(dailySources)||!Array.isArray(replyEvents))return empty;
 const today=new Date(stamp).toISOString().slice(0,10);
 const sources=dailySources.filter(r=>sourceNames.includes(r?.source_key)&&
   (r?.source_observed_at===null||Date.parse(r.source_observed_at)<=stamp+300000));
 const providers=Object.fromEntries(['ga4','search_console','linkedin_company_account_provider','revenue_goal'].map(x=>[x,coverage(sources,x,today)]));
 const website=websiteTrend(sources,at);
 const social=(socialFunnel?.channels||[]).map(c=>({channel:c.channel,
   sourceStatus:c.trend_evidence_state,ageMatched48h:true,
   metrics:Object.fromEntries(socialMetrics.map(k=>[k,{
     direction:c.metrics?.[k]?.direction||'INSUFFICIENT_COMPARABLE_SAMPLE',
     pct:c.metrics?.[k]?.relative_change_pct??null,
     recentSamples:c.metrics?.[k]?.recent_samples??0,
     baselineSamples:c.metrics?.[k]?.baseline_samples??0
   }]))}));
 const prior=stamp-14*DAY;
 const accepted=new Set();
 let recorded=0;
 for(const r of replyEvents){
   const when=Date.parse(r?.occurred_at||''),id=r?.reply_event_id;
   if(typeof id!=='string'||!id||accepted.has(id)||!Number.isFinite(when)||when<prior||when>=stamp)continue;
   accepted.add(id);recorded++;
 }
 const email={source:'powerhouse_email_reply_events',sourceState:readStates.emailReplies,
   recordedEvents14d:recorded,providerCoverage:'NOT_INDEPENDENTLY_VERIFIED',
   replyRate:null,ordersFromEmail:null,ordersFromConnections:null};
 const qualifiedOrders={independentlyQualifiedLeads:null,paidOrders:null,
   paidRevenueEur:null,websiteToPaidOrderRate:null,
   status:brainClosure?.businessOutcomeVerified===true&&conversionProof?.orderStatus==='VERIFIED'?'SOURCE_ATTESTATION_REQUIRED':'INDEPENDENT_BUYER_AND_PAYMENT_READBACK_REQUIRED'};
 const priorities=classifyPriorities({website,social:socialFunnel,providers,replies:email,
   proof:{businessOutcomeVerified:brainClosure?.businessOutcomeVerified===true}});
 return {contract:'POWERHOUSE_ONE_BRAIN_GROWTH_DIRECTION_V1',
   status:'SOURCE_OBSERVED_OUTCOME_INCOMPLETE',observedAt:at,
   period:'7_COMPLETE_UTC_DAYS_VS_PREVIOUS_7_DAYS',website,providers,social,email,qualifiedOrders,
   priorities,sourceCount:sources.length,
   guaranteedUpwardTrend:false,automatedActionExecution:false,
   sourceLineage:'ORIGINAL_POWERHOUSE_BRAIN_HEARTBEAT_AND_CRO_ONLY',
   learningAuthority:'EXISTING_ONE_BRAIN',note:'Priorities are unexecuted recommendations, not proven uplifts or new agents.'};
}
