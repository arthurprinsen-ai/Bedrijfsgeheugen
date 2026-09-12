import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const enc=new TextEncoder();
async function sha256(value:string){const d=await crypto.subtle.digest('SHA-256',enc.encode(value));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const tenantOf=(b:any)=>String(b?.tenantId||'canonical');
const asNum=(v:any)=>v===null||v===undefined||v===''?null:Number(v);
const normalizeStage=(s:any)=>String(s||'').toLowerCase().replace(/[\s-]+/g,'_');

function commercialByStage(rows:any[]){
  const out:any={leads:null,qualified_leads:null,meetings:null,proposals:null,orders:null,revenue:null};
  if(!rows.length)return out;
  const counters:any={leads:0,qualified_leads:0,meetings:0,proposals:0,orders:0};
  let revenue=0,hasRevenue=false;
  for(const r of rows){
    const s=normalizeStage(r.stage);
    if(['lead','new_lead','mql'].includes(s))counters.leads++;
    if(['qualified_lead','sql','qualified'].includes(s))counters.qualified_leads++;
    if(['meeting','appointment','booked_meeting'].includes(s))counters.meetings++;
    if(['proposal','offer','quote','offerte'].includes(s))counters.proposals++;
    if(['order','won_order','closed_won','won'].includes(s))counters.orders++;
    if(r.revenue_eur!==null&&r.revenue_eur!==undefined){revenue+=Number(r.revenue_eur)||0;hasRevenue=true;}
  }
  for(const k of Object.keys(counters))out[k]=counters[k]||null;
  out.revenue=hasRevenue?revenue:null;
  return out;
}

function evidenceRow(tenant:string,e:any){return {
  tenant_id:tenant,evidence_id:e.evidenceId,content_id:e.contentId,channel:e.channel,canonical:e.canonical??null,
  attribution_key:e.attributionKey,data_quality:e.dataQuality||'OBSERVED',published_at:e.publishedAt??null,publication_date:e.publicationDate??null,
  window_hours:Number(e.windowHours||0),component_fingerprint:e.componentFingerprint||e.contentId,
  exposures:e.exposures??null,clicks:e.clicks??null,substantive_interactions:e.substantive_interactions??null,leads:e.leads??null,
  qualified_leads:e.qualified_leads??null,meetings:e.meetings??null,proposals:e.proposals??null,orders:e.orders??null,revenue_eur:e.revenue_eur??null,
  attributes:e.attributes||{},source_refs:e.sourceRefs||[],updated_at:new Date().toISOString()
};}
function evidenceOut(r:any){return {
  evidenceId:r.evidence_id,contentId:r.content_id,channel:r.channel,canonical:r.canonical,attributionKey:r.attribution_key,dataQuality:r.data_quality,
  publishedAt:r.published_at,publicationDate:r.publication_date,windowHours:r.window_hours,componentFingerprint:r.component_fingerprint,
  exposures:asNum(r.exposures),clicks:asNum(r.clicks),substantive_interactions:asNum(r.substantive_interactions),leads:asNum(r.leads),qualified_leads:asNum(r.qualified_leads),
  meetings:asNum(r.meetings),proposals:asNum(r.proposals),orders:asNum(r.orders),revenue_eur:asNum(r.revenue_eur),attributes:r.attributes||{},sourceRefs:r.source_refs||{},evaluatedAt:r.evaluated_at,updatedAt:r.updated_at
};}

Deno.serve(async(req)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(!token||await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}
  const action=String(body?.action||''),tenant=tenantOf(body);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'STORE_CONFIG_MISSING'},503);
  const db=createClient(url,key,{auth:{persistSession:false}});
  const fail=(error:any,status=503)=>json({error:error?.message||String(error)},status);

  try{
    if(action==='list_projection_candidates'){
      const candidates:any[]=[];
      const since=new Date(Date.now()-90*864e5).toISOString();
      const [{data:posts,error:pErr},{data:snapshots,error:sErr},{data:daily,error:dErr},{data:events,error:eErr},{data:outcomes,error:oErr}]=await Promise.all([
        db.from('social_posts').select('*').eq('tenant_id',tenant).gte('published_at',since).order('published_at',{ascending:false}).limit(150),
        db.from('social_metric_snapshots').select('*').eq('tenant_id',tenant).order('observed_at',{ascending:false}).limit(1200),
        db.from('growth_page_daily').select('*').order('day',{ascending:false}).limit(1000),
        db.from('growth_events').select('canonical,page_role,funnel_stage,intent_owner,attribution_root_key,occurred_at').gte('occurred_at',since).order('occurred_at',{ascending:false}).limit(2000),
        db.from('growth_outcomes').select('stage,attribution_root_key,canonical,revenue_eur,occurred_at').gte('occurred_at',since).order('occurred_at',{ascending:false}).limit(2000)
      ]);
      if(pErr)throw pErr;if(sErr)throw sErr;if(dErr)throw dErr;if(eErr)throw eErr;if(oErr)throw oErr;
      const snapsByPost=new Map<string,any[]>();for(const s of snapshots||[]){const arr=snapsByPost.get(s.post_id)||[];arr.push(s);snapsByPost.set(s.post_id,arr);}
      const outcomesByRoot=new Map<string,any[]>();for(const o of outcomes||[]){if(!o.attribution_root_key)continue;const a=outcomesByRoot.get(o.attribution_root_key)||[];a.push(o);outcomesByRoot.set(o.attribution_root_key,a);}
      for(const p of posts||[]){
        const snaps=snapsByPost.get(p.post_id)||[];for(const w of [24,48,72]){
          const nearest=snaps.map(s=>({s,age:Number(s.age_hours??((new Date(s.observed_at).getTime()-new Date(p.published_at).getTime())/36e5))})).filter(x=>Number.isFinite(x.age)&&Math.abs(x.age-w)<=6).sort((a,b)=>Math.abs(a.age-w)-Math.abs(b.age-w))[0]?.s;
          if(!nearest)continue;const commercial=commercialByStage(p.source_campaign_id?outcomesByRoot.get(p.source_campaign_id)||[]:[]);
          const channel=p.channel_kind||p.platform;
          candidates.push({kind:'social',contentId:p.post_id,channel,canonical:null,attributionRootKey:p.source_campaign_id||null,publishedAt:p.published_at,windowHours:w,
            componentFingerprint:`social|${channel}|${p.content_pillar||''}|${p.funnel_stage||''}|${p.format||''}|${p.hook_type||''}|${p.cta_type||''}`,
            metrics:{...(nearest.metrics||{}),...commercial},attributes:{platform:p.platform,channelId:p.channel_id,channelName:p.channel_name,channelKind:p.channel_kind,contentPillar:p.content_pillar,funnelStage:p.funnel_stage,format:p.format,hookType:p.hook_type,narrativeType:p.narrative_type,emotion:p.emotion,ctaType:p.cta_type},sourceRefs:[nearest.snapshot_id]});
        }
      }
      const eventByCanonical=new Map<string,any>();for(const e of events||[]){if(e.canonical&&!eventByCanonical.has(e.canonical))eventByCanonical.set(e.canonical,e);}
      const outcomeByCanonical=new Map<string,any[]>();for(const o of outcomes||[]){if(!o.canonical)continue;const a=outcomeByCanonical.get(o.canonical)||[];a.push(o);outcomeByCanonical.set(o.canonical,a);}
      const seen=new Set<string>();for(const d of daily||[]){if(!d.canonical||seen.has(d.canonical))continue;seen.add(d.canonical);const ev=eventByCanonical.get(d.canonical)||{};const role=String(ev.page_role||'').toLowerCase();const channel=/(blog|article|kennis|content)/.test(role)||String(d.canonical).startsWith('/blog')?'blog':'website';
        const attributed=commercialByStage((ev.attribution_root_key?outcomesByRoot.get(ev.attribution_root_key):null)||outcomeByCanonical.get(d.canonical)||[]);
        candidates.push({kind:'growth',contentId:`page:${d.canonical}`,channel,canonical:d.canonical,attributionRootKey:ev.attribution_root_key||null,publishedAt:`${d.day}T00:00:00Z`,windowHours:24,
          componentFingerprint:`${channel}|${ev.page_role||''}|${ev.funnel_stage||''}|${d.intent_owner||ev.intent_owner||''}`,
          metrics:{pageViews:d.page_views,ctaClicks:d.cta_clicks,leads:d.leads??attributed.leads,qualifiedLeads:d.qualified_leads??attributed.qualified_leads,appointments:d.appointments??attributed.meetings,proposals:d.proposals??attributed.proposals,wonOrders:d.won_orders??attributed.orders,revenueEur:d.revenue_eur??attributed.revenue},
          attributes:{pageRole:ev.page_role||null,funnelStage:ev.funnel_stage||null,intentOwner:d.intent_owner||ev.intent_owner||null},sourceRefs:[`growth_page_daily:${d.day}:${d.canonical}`]});
      }
      return json({candidates});
    }
    if(action==='upsert_evidence'){
      const row=evidenceRow(tenant,body.evidence);const {data,error}=await db.from('revenue_learning_evidence').upsert(row,{onConflict:'tenant_id,evidence_id'}).select().single();if(error)throw error;return json({stored:true,evidence:evidenceOut(data)});
    }
    if(action==='list_due_evidence'){
      const {data,error}=await db.from('revenue_learning_evidence').select('*').eq('tenant_id',tenant).order('updated_at',{ascending:false}).limit(150);if(error)throw error;
      return json({evidence:(data||[]).filter(r=>!r.evaluated_at||new Date(r.updated_at)>new Date(r.evaluated_at)).map(evidenceOut)});
    }
    if(action==='list_cohort'){
      const t=body.query?.target||{},limit=Math.min(Number(body.query?.limit||30),100);const {data,error}=await db.from('revenue_learning_evidence').select('*').eq('tenant_id',tenant).eq('channel',t.channel).eq('window_hours',Number(t.windowHours||0)).neq('content_id',t.contentId).order('published_at',{ascending:false}).limit(limit*3);if(error)throw error;
      const attrs=t.attributes||{};const filtered=(data||[]).filter((r:any)=>{const a=r.attributes||{};for(const k of ['contentPillar','funnelStage','format','pageRole','intentOwner'])if(attrs[k]&&a[k]&&attrs[k]!==a[k])return false;return true;}).slice(0,limit);
      return json({evidence:filtered.map(evidenceOut)});
    }
    if(action==='mark_evidence_evaluated'){
      const {error}=await db.from('revenue_learning_evidence').update({evaluated_at:body.evaluatedAt}).eq('tenant_id',tenant).eq('evidence_id',body.evidenceId);if(error)throw error;return json({updated:true});
    }
    if(action==='upsert_learning'){
      const l=body.learning||{};const row={tenant_id:tenant,learning_id:l.learningId,fingerprint:l.fingerprint,component_scope:l.componentScope,claim:l.claim,effect_metric:l.effectMetric??null,effect_size:l.effectSize??null,sample_size:l.sampleSize??0,confidence:l.confidence??0,status:l.status||'CANDIDATE',baseline_definition:l.baselineDefinition??null,evidence_window:l.evidenceWindow??null,first_seen_at:l.firstSeenAt??null,last_validated_at:l.lastValidatedAt??null,expires_or_review_at:l.expiresOrReviewAt??null,evidence_refs:l.evidenceRefs||[],updated_at:new Date().toISOString()};const {data,error}=await db.from('revenue_learnings').upsert(row,{onConflict:'tenant_id,learning_id'}).select().single();if(error)throw error;return json({learning:data});
    }
    if(action==='list_current_learnings'){
      const {data,error}=await db.from('revenue_learnings').select('*').eq('tenant_id',tenant).in('status',['TESTING','PROVEN','WEAKENING']).order('confidence',{ascending:false}).limit(100);if(error)throw error;
      return json({learnings:(data||[]).map((l:any)=>({learningId:l.learning_id,fingerprint:l.fingerprint,componentScope:l.component_scope,claim:l.claim,effectMetric:l.effect_metric,effectSize:l.effect_size,sampleSize:l.sample_size,confidence:l.confidence,status:l.status,baselineDefinition:l.baseline_definition,evidenceWindow:l.evidence_window,firstSeenAt:l.first_seen_at,lastValidatedAt:l.last_validated_at,expiresOrReviewAt:l.expires_or_review_at,evidenceRefs:l.evidence_refs||[]}))});
    }
    if(action==='record_application'){
      const a=body.application||{};const row={tenant_id:tenant,application_id:a.applicationId,content_id:a.contentId,channel:a.channel??null,learning_id:a.learningId,decision_id:a.decisionId??null,applied_at:a.appliedAt??new Date().toISOString(),application_role:a.applicationRole||'PRIMARY',expected_effect:a.expectedEffect??null,actual_effect:a.actualEffect??null,verification_status:a.verificationStatus||'PENDING',updated_at:new Date().toISOString()};const {error}=await db.from('revenue_learning_applications').upsert(row,{onConflict:'tenant_id,application_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='reconcile_applications'){
      const d=body.data||{};const {error}=await db.from('revenue_learning_applications').update({actual_effect:d.effect??null,verification_status:d.verificationStatus||'VERIFIED',updated_at:new Date().toISOString()}).eq('tenant_id',tenant).eq('content_id',d.contentId).eq('verification_status','PENDING');if(error)throw error;return json({reconciled:true});
    }
    if(action==='record_decision'){
      const d=body.decision||{};const row={tenant_id:tenant,decision_id:d.decisionId,content_id:d.contentId,channel:d.channel??null,decision:d,recorded_at:d.recordedAt??new Date().toISOString()};const {error}=await db.from('revenue_learning_decisions').upsert(row,{onConflict:'tenant_id,decision_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='record_obligation'){
      const o=body.obligation||{};const row={tenant_id:tenant,obligation_id:o.id,type:o.type,content_id:o.contentId??null,window_hours:o.windowHours??null,status:o.status||'OPEN',payload:o,due_at:o.dueAt??null,updated_at:new Date().toISOString()};const {error}=await db.from('revenue_learning_obligations').upsert(row,{onConflict:'tenant_id,obligation_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='get_projection'){
      const {data,error}=await db.from('revenue_learning_projections').select('*').eq('tenant_id',tenant).maybeSingle();if(error)throw error;return json({projection:data?.projection||null});
    }
    if(action==='put_projection'){
      const p=body.projection||{};const {error}=await db.from('revenue_learning_projections').upsert({tenant_id:tenant,version:p.version,projection:p,updated_at:new Date().toISOString()},{onConflict:'tenant_id'});if(error)throw error;return json({stored:true});
    }
    return json({error:'UNKNOWN_ACTION'},400);
  }catch(error){return fail(error);}
});
