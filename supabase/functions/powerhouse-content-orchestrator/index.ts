import { createClient } from 'npm:@supabase/supabase-js@2';

const CHANNELS = ['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_GATE = 'channel-identity-hard-gate-v3';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
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

const clean = (v: unknown) => String(v ?? '').trim();
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function digest(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function callAI(key: string, model: string, system: string, user: unknown, tool: any, maxTokens = 3200) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version':'2023-06-01','content-type':'application/json' },
    body: JSON.stringify({ model, max_tokens:maxTokens, system, messages:[{role:'user',content:JSON.stringify(user)}], tools:[tool], tool_choice:{type:'tool',name:tool.name} }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { console.error('ORCHESTRATOR_AI_PROVIDER_ERROR', response.status); throw new Error('AI_PROVIDER_REQUEST_FAILED'); }
  const result = (body.content || []).find((x:any) => x.type==='tool_use' && x.name===tool.name);
  if (!result?.input) throw new Error('AI_TOOL_OUTPUT_MISSING');
  return result.input;
}

function validPersonalSource(row:any) {
  const e = row?.evidence || {};
  const lineage = Array.isArray(e.source_lineage) ? e.source_lineage.length > 0 : !!e.source_lineage;
  return row?.target_channel === 'linkedin_personal' && e.identity_contract === PERSONAL_CONTRACT && e.identity_gate_version === PERSONAL_GATE
    && e.personal_truth_verified === true && !!clean(e.content_id) && lineage && e.arthur_anchor_verified === true
    && e.first_person_claims_verified === true && e.personal_life_topic === true && e.business_topic === false
    && e.corporate_voice === false && e.company_page_interchangeable === false && e.forced_business_moral === false
    && (e.sensitive_private_detail !== true || e.sensitive_private_approval === true);
}
function recommendationScore(row:any, channel:string) {
  const topic = clean(row?.topic_key).toLowerCase();
  const target = clean(row?.target_channel).toLowerCase();
  let score = num(row?.priority) + num(row?.evidence?.commercial_value) / 10;
  if (channel === 'blog' && (topic === 'blog' || target === 'blog')) score += 120;
  if (channel === 'linkedin_company' && (topic.includes('linkedin') || target.includes('linkedin') || target.includes('company'))) score += 100;
  if (channel === 'instagram_company' && (target === 'instagram' || topic.includes('instagram'))) score += 120;
  return score;
}
function pickRecommendation(recs:any[], channel:string) {
  return [...(recs || [])].filter((r)=>['suggested',''].includes(clean(r?.status))).sort((a,b)=>recommendationScore(b,channel)-recommendationScore(a,channel))[0] || null;
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
function shouldPreserveExisting(row:any) {
  if (!row) return false;
  return COVERED_STATES.has(clean(row.state)) || (row.delivery_evidence?.provider_truth_verified === true && !!clean(row.delivery_ref));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ok:false,error:'POST_ONLY'},405);
  const url = Deno.env.get('SUPABASE_URL') || '', service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ok:false,error:'CONFIG'},500);
  const db = createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected = clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if (!expected || req.headers.get('x-powerhouse-token') !== expected) return json({ok:false,error:'UNAUTHORIZED'},401);
  let request:any = {}; try { request = await req.json(); } catch {}
  const runDate = clean(request.runDate) || localDate();
  let stage = 'load-context';
  try {
    const [runResult,recResult,rulesResult,governanceResult,existingResult,obligationsResult,mediaProofResult] = await Promise.all([
      db.from('powerhouse_daily_runs').select('*').eq('run_date',runDate).maybeSingle(),
      db.from('powerhouse_content_recommendations').select('recommendation_id,topic_key,target_channel,recommendation_type,priority,reason,evidence,status').eq('run_date',runDate).order('priority',{ascending:false}).limit(50),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status','actief').order('vertrouwen',{ascending:false}).limit(30),
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle(),
      db.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate),
      db.from('content_publication_obligations').select('*').eq('tenant_id','canonical').eq('publication_date',runDate),
      db.from('powerhouse_media_proof_evidence_v1').select('*').eq('publication_date',runDate).eq('channel','instagram').order('updated_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    const run = runResult.data, recs = recResult.data || [], rules = rulesResult.data || [], gov = governanceResult.data;
    const existing = existingResult.data || [], obligations = obligationsResult.data || [], mediaProof = mediaProofResult.data || null;
    if (!run) throw new Error('DAILY_RUN_MISSING');
    if (!gov || gov.approved !== true || gov.lifecycle_status !== 'ACTIVE' || gov.provider !== 'Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey = clean((await db.rpc('bg_geheim',{p_naam:'ANTHROPIC_API_KEY'})).data);
    if (!apiKey) throw new Error('AI_KEY_UNAVAILABLE');

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
      if (shouldPreserveExisting(previous)) continue;
      const decision:any = plannedDecision(channel,recs,personalSource,instagramProof);
      const stale = previous?.delivery_evidence?.stale_delivery_ref === true || clean(previous?.delivery_evidence?.error) === 'PROVIDER_RECORD_MISSING';
      const hour = String(decision.scheduled_hour_local).padStart(2,'0');
      const evidence = { ...(stale?{}:(previous?.delivery_evidence||{})), content_brief:decision.content_brief,decision_engine:VERSION,decision_source:decision.decision_source,
        capability_state:decision.capability_state,capability_reason:decision.capability_reason,executor_capabilities,fallback_recommendation_id:decision.fallback_recommendation_id,
        personal_source_recommendation_id:channel==='linkedin_personal'?personalSource?.recommendation_id||null:null,
        personal_truth_verified:channel==='linkedin_personal'?personalSource?.evidence?.personal_truth_verified===true:null,
        stale_delivery_ref:false,recovery_from_provider_missing:stale };
      const {error} = await db.from('powerhouse_channel_decisions').upsert({ run_date:runDate,channel,decision:decision.decision,state:decision.state,priority:decision.priority,
        confidence:decision.confidence,topic_key:decision.topic_key,rationale:decision.rationale,scheduled_for:`${runDate}T${hour}:00:00+02:00`,delivery_ref:stale?null:previous?.delivery_ref||null,
        delivery_evidence:evidence,source_recommendation_ids:recs.map((r:any)=>r.recommendation_id),updated_at:new Date().toISOString() });
      if (error) throw new Error(`DECISION_WRITE:${channel}`);
    }

    stage = 'select-pending';
    const {data:pending,error:pendingError} = await db.from('powerhouse_channel_decisions').select('*').eq('run_date',runDate).eq('decision','publish').eq('state','decided').order('priority',{ascending:false}).limit(1).maybeSingle();
    if (pendingError) throw new Error('PENDING_READ_FAILED');
    if (!pending) return json({ok:true,runDate,generated:false,reason:'NO_PENDING_ARTIFACT',executor_capabilities,personal_source_ready:!!personalSource});
    if (pending.channel === 'linkedin_personal' && !personalSource) throw new Error('PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    if (pending.channel === 'instagram_company' && !instagramVisibleIdentityProven(instagramProof)) throw new Error('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');

    const recommendation = pending.delivery_evidence?.fallback_recommendation_id ? recs.find((r:any)=>r.recommendation_id===pending.delivery_evidence.fallback_recommendation_id) : pickRecommendation(recs,pending.channel);
    const artifactTool = { name:'content_artifact',description:'Definitieve kanaaleigen content',input_schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},body:{type:'string'},cta:{type:'string'},hook_type:{type:'string'},focus_keyword:{type:'string'},meta_description:{type:'string'}},required:['title','body','cta','hook_type','focus_keyword','meta_description']}};
    const system = pending.channel==='linkedin_personal' ? 'Schrijf uitsluitend uit de geverifieerde persoonlijke bron. Geen businessbrug, verkoop, verzonnen ervaring of zakelijke moraal.'
      : pending.channel==='instagram_company' ? 'Schrijf Mira daily-life caption passend bij de reeds bewezen finale media. Geen interne kantoorproblemen of geforceerde businessmoraal.'
      : 'Schrijf feitelijke kanaaleigen content. Verzin geen cases, cijfers, quotes of ervaringen.';
    stage = 'artifact-ai';
    const artifact = await callAI(apiKey,gov.model_id,system,{channel:pending.channel,brief:pending.delivery_evidence?.content_brief||pending.rationale,recommendation,
      verified_personal_source:pending.channel==='linkedin_personal'?personalSource:null,instagram_media_proof:pending.channel==='instagram_company'?instagramProof:null,active_rules:rules},artifactTool,pending.channel==='blog'?4800:2600);
    const bodyText = clean(artifact.body), finalTextHash = await digest(bodyText);
    const personalEvidence = pending.channel==='linkedin_personal' ? {...(personalSource.evidence||{}),content_id:clean(personalSource.evidence?.content_id)||`${runDate}:linkedin_personal`,calendar_date:runDate,
      channel_id:PERSONAL_CHANNEL,channel_kind:'linkedin_personal',identity_contract:PERSONAL_CONTRACT,identity_gate_version:PERSONAL_GATE,personal_truth_verified:true,
      prediction_lineage_present:true,prior_prediction_decision_id:`decision:${runDate}:linkedin_personal`,publication_intent:'publish',final_text_hash:finalTextHash} : null;
    const instagramEvidence = pending.channel==='instagram_company' ? {...instagramProof,exact_final_media_proven:true,final_media_sha256:instagramProof.final_media_sha256,media_url:instagramProof.media_url,mira_gate_passed:true} : null;
    const artifactType = pending.channel==='blog'?'blog':pending.channel==='instagram_company'?'instagram_post':'linkedin_post';

    stage = 'write-artifact';
    const {error:artifactError} = await db.from('powerhouse_content_artifacts').upsert({run_date:runDate,channel:pending.channel,artifact_type:artifactType,title:clean(artifact.title),body:bodyText,cta:clean(artifact.cta),
      content_brief:pending.delivery_evidence?.content_brief||pending.rationale,generation_evidence:{model:gov.model_id,orchestrator:VERSION,hook_type:clean(artifact.hook_type),focus_keyword:clean(artifact.focus_keyword),meta_description:clean(artifact.meta_description),
      recommendation_id:recommendation?.recommendation_id||null,final_copy_approved:pending.channel==='linkedin_company',identity_gate_evidence:personalEvidence,instagram_media_proof:instagramEvidence},status:'content_ready',updated_at:new Date().toISOString()});
    if (artifactError) throw new Error('ARTIFACT_WRITE_FAILED');
    const {error:decisionError} = await db.from('powerhouse_channel_decisions').update({state:'content_ready',delivery_evidence:{...(pending.delivery_evidence||{}),identity_gate_evidence:personalEvidence,instagram_media_proof:instagramEvidence},updated_at:new Date().toISOString()})
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