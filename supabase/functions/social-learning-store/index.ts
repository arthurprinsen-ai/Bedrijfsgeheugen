import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
const tenantOf=(body:any)=>String(body?.tenantId||body?.post?.tenantId||body?.snapshot?.tenantId||body?.evaluation?.tenantId||body?.learning?.tenantId||body?.application?.tenantId||body?.decision?.tenantId||body?.projection?.tenantId||body?.obligation?.tenantId||body?.data?.tenantId||'default');

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  const action=String(body?.action||'');const tenantId=tenantOf(body);
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    if(action==='put_post'){
      const p=body.post||{};if(!p.postId||!p.platform||!p.externalPostId)return json({error:'INVALID_POST'},400);
      const row={tenant_id:tenantId,post_id:p.postId,platform:p.platform,external_post_id:p.externalPostId,published_at:p.publishedAt||null,content_hash:p.contentHash||null,topic:p.topic||null,content_pillar:p.contentPillar||null,audience:p.audience||null,funnel_stage:p.funnelStage||null,format:p.format||null,hook_type:p.hookType||null,narrative_type:p.narrativeType||null,emotion:p.emotion||null,cta_type:p.ctaType||null,source_campaign_id:p.sourceCampaignId||null,updated_at:new Date().toISOString()};
      const {error}=await db.from('social_posts').upsert(row,{onConflict:'tenant_id,post_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='append_snapshot'){
      const s=body.snapshot||{};if(!s.snapshotId||!s.postId||!s.observedAt)return json({error:'INVALID_SNAPSHOT'},400);
      const row={tenant_id:tenantId,snapshot_id:s.snapshotId,post_id:s.postId,observed_at:s.observedAt,source:s.source||'unknown',source_event_id:s.sourceEventId||s.snapshotId,data_quality:s.dataQuality||'OBSERVED',metrics:s.metrics||{}};
      const {data:existing}=await db.from('social_metric_snapshots').select('snapshot_id,metrics,source_event_id').eq('tenant_id',tenantId).eq('snapshot_id',s.snapshotId).maybeSingle();
      if(existing){if(JSON.stringify(existing.metrics)!==JSON.stringify(row.metrics)||existing.source_event_id!==row.source_event_id)return json({error:'SNAPSHOT_CONFLICT'},409);return json({stored:false,duplicate:true});}
      const {error}=await db.from('social_metric_snapshots').insert(row);if(error){if(error.code==='23505')return json({error:'SNAPSHOT_CONFLICT'},409);throw error;}return json({stored:true});
    }
    if(action==='get_post'){const {data,error}=await db.from('social_posts').select('*').eq('tenant_id',tenantId).eq('post_id',body.postId).maybeSingle();if(error)throw error;return json({post:data});}
    if(action==='get_snapshots'){const {data,error}=await db.from('social_metric_snapshots').select('*').eq('tenant_id',tenantId).eq('post_id',body.postId).order('observed_at',{ascending:true});if(error)throw error;return json({snapshots:(data||[]).map((r:any)=>({snapshotId:r.snapshot_id,postId:r.post_id,tenantId:r.tenant_id,observedAt:r.observed_at,source:r.source,sourceEventId:r.source_event_id,dataQuality:r.data_quality,metrics:r.metrics}))});}
    if(action==='list_due_posts'){
      const now=new Date(body.now||Date.now());const {data:posts,error}=await db.from('social_posts').select('*').eq('tenant_id',tenantId).not('published_at','is',null).lte('published_at',new Date(now.getTime()-24*3600000).toISOString());if(error)throw error;
      const {data:evals,error:e2}=await db.from('social_learning_evaluations').select('post_id,window_hours').eq('tenant_id',tenantId);if(e2)throw e2;const done=new Set((evals||[]).map((e:any)=>`${e.post_id}:${e.window_hours}`));const out:any[]=[];
      for(const p of posts||[]){for(const w of [24,48,72]){if(now.getTime()>=new Date(p.published_at).getTime()+w*3600000&&!done.has(`${p.post_id}:${w}`))out.push({postId:p.post_id,tenantId:p.tenant_id,platform:p.platform,publishedAt:p.published_at,format:p.format,funnelStage:p.funnel_stage,contentPillar:p.content_pillar,hookType:p.hook_type,narrativeType:p.narrative_type,emotion:p.emotion,ctaType:p.cta_type,learningStatus:p.learning_status,learningId:p.learning_id,dueWindow:w});}}
      return json({posts:out});
    }
    if(action==='get_cohort'){
      const q=body.query||{};const target=q.post||{};const {data,error}=await db.from('social_metric_snapshots').select('post_id,observed_at,metrics').eq('tenant_id',tenantId).neq('post_id',target.postId).order('observed_at',{ascending:false}).limit(50);if(error)throw error;return json({posts:(data||[]).map((r:any)=>({postId:r.post_id,observedAt:r.observed_at,metrics:r.metrics}))});
    }
    if(action==='put_evaluation'){
      const e=body.evaluation||{};const row={tenant_id:tenantId,evaluation_id:e.evaluationId,post_id:e.postId,window_hours:e.windowHours,observed_at:e.observedAt,metric_vector:e.metricVector||{},cohort_size:e.cohortSize||0,evidence:e.evidence||null};const {error}=await db.from('social_learning_evaluations').upsert(row,{onConflict:'tenant_id,evaluation_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='upsert_learning'){
      const l=body.learning||{};const row={tenant_id:tenantId,learning_id:l.learningId,fingerprint:l.fingerprint,component_scope:l.componentScope||'social_components',claim:l.claim||'',effect_metric:l.effectMetric||null,effect_size:l.effectSize??null,sample_size:l.sampleSize||0,confidence:l.confidence||0,status:l.status||'CANDIDATE',last_validated_at:l.lastValidatedAt||null,evidence_refs:l.evidenceRefs||[],updated_at:new Date().toISOString()};const {error}=await db.from('social_learnings').upsert(row,{onConflict:'tenant_id,learning_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='list_current_learnings'){const {data,error}=await db.from('social_learnings').select('*').eq('tenant_id',tenantId).in('status',['PROVEN','TESTING','WEAKENING']).order('confidence',{ascending:false}).limit(50);if(error)throw error;return json({learnings:(data||[]).map((r:any)=>({learningId:r.learning_id,fingerprint:r.fingerprint,componentScope:r.component_scope,claim:r.claim,effectMetric:r.effect_metric,effectSize:r.effect_size,sampleSize:r.sample_size,confidence:r.confidence,status:r.status,lastValidatedAt:r.last_validated_at,evidenceRefs:r.evidence_refs}))});}
    if(action==='record_application'){
      const a=body.application||{};const row={tenant_id:tenantId,application_id:a.applicationId,post_id:a.postId,learning_id:a.learningId,decision_id:a.decisionId||null,applied_at:a.appliedAt||new Date().toISOString(),application_role:a.applicationRole||'PRIMARY',expected_effect:a.expectedEffect??null,actual_effect:a.actualEffect??null,verification_status:a.verificationStatus||'PENDING',updated_at:new Date().toISOString()};const {error}=await db.from('social_learning_applications').upsert(row,{onConflict:'tenant_id,application_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='record_decision'){
      const d=body.decision||{};const row={tenant_id:tenantId,decision_id:d.decisionId,post_id:d.postId,decision:d,recorded_at:d.recordedAt||new Date().toISOString()};const {error}=await db.from('social_learning_decisions').upsert(row,{onConflict:'tenant_id,decision_id'});if(error)throw error;return json({tenantId,decisionId:d.decisionId,postId:d.postId});
    }
    if(action==='reconcile_application'){
      const a=body.application||{};const {error}=await db.from('social_learning_applications').update({actual_effect:a.actualEffect??null,verification_status:a.verificationStatus||'VERIFIED',updated_at:new Date().toISOString()}).eq('tenant_id',tenantId).eq('application_id',a.applicationId);if(error)throw error;return json({stored:true});
    }
    if(action==='reconcile_applications'){
      const d=body.data||{};const {error}=await db.from('social_learning_applications').update({actual_effect:d.effect??null,verification_status:d.verificationStatus||'VERIFIED',updated_at:new Date().toISOString()}).eq('tenant_id',tenantId).eq('post_id',d.postId);if(error)throw error;return json({stored:true});
    }
    if(action==='record_obligation'){
      const o=body.obligation||{};const row={tenant_id:tenantId,obligation_id:o.id,type:o.type||'MISSED_OBLIGATION',owner:o.owner||'POWERHOUSE_SOCIAL_LEARNING',post_id:o.postId||null,window_hours:o.windowHours||null,due_at:o.dueAt||null,status:o.status||'OPEN',payload:o,updated_at:new Date().toISOString()};const {error}=await db.from('social_learning_obligations').upsert(row,{onConflict:'tenant_id,obligation_id'});if(error)throw error;return json({stored:true});
    }
    if(action==='get_projection'){const {data,error}=await db.from('social_learning_projections').select('projection').eq('tenant_id',tenantId).maybeSingle();if(error)throw error;return json({projection:data?.projection||null});}
    if(action==='put_projection'){const p=body.projection||{};const {error}=await db.from('social_learning_projections').upsert({tenant_id:tenantId,version:p.version,projection:p,updated_at:new Date().toISOString()},{onConflict:'tenant_id'});if(error)throw error;return json({stored:true});}
    return json({error:'INVALID_ACTION'},400);
  }catch(error:any){console.error(error);return json({error:'STORE_OPERATION_FAILED'},500);}
});
