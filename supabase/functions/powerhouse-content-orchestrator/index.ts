import { createClient } from 'npm:@supabase/supabase-js@2';

const CHANNELS = ['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];
const PERSONAL_CONTRACT = 'arthur-personal-linkedin-identity-v4';
const PERSONAL_GATE = 'channel-identity-hard-gate-v3';
const PERSONAL_CHANNEL = '6a70381699afb44349f0fb35';
const VERSION = 'v9-closed-loop';
const executor_capabilities: Record<string, { executable: boolean; executor: string | null; reason?: string }> = {
  linkedin_personal: { executable: true, executor: 'powerhouse-social-publisher' },
  linkedin_company: { executable: true, executor: 'powerhouse-social-publisher' },
  blog: { executable: true, executor: 'powerhouse-blog-queue' },
  instagram_company: { executable: true, executor: 'powerhouse-social-publisher', reason: 'Requires pre-proven exact final media evidence before dispatch.' },
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
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: JSON.stringify(user) }], tools: [tool], tool_choice: { type: 'tool', name: tool.name } }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AI_${response.status}:${clean(body?.error?.message).slice(0, 220)}`);
  const result = (body.content || []).find((x: any) => x.type === 'tool_use' && x.name === tool.name);
  if (!result?.input) throw new Error('AI_TOOL_OUTPUT_MISSING');
  return result.input;
}

function validPersonalSource(row: any) {
  const e = row?.evidence || {};
  const lineage = Array.isArray(e.source_lineage) ? e.source_lineage.length > 0 : !!e.source_lineage;
  return row?.target_channel === 'linkedin_personal'
    && e.identity_contract === PERSONAL_CONTRACT
    && e.identity_gate_version === PERSONAL_GATE
    && e.personal_truth_verified === true
    && !!clean(e.content_id)
    && lineage
    && e.arthur_anchor_verified === true
    && e.first_person_claims_verified === true
    && e.personal_life_topic === true
    && e.business_topic === false
    && e.corporate_voice === false
    && e.company_page_interchangeable === false
    && e.forced_business_moral === false
    && (e.sensitive_private_detail !== true || e.sensitive_private_approval === true);
}

function recommendationScore(row: any, channel: string) {
  const topic = clean(row?.topic_key).toLowerCase();
  const target = clean(row?.target_channel).toLowerCase();
  let score = num(row?.priority) + num(row?.evidence?.commercial_value) / 10;
  if (channel === 'blog' && (topic === 'blog' || target === 'blog')) score += 100;
  if (channel === 'linkedin_company' && (topic.includes('linkedin') || target.includes('linkedin'))) score += 80;
  if (channel === 'instagram_company' && (target === 'instagram' || topic.includes('instagram'))) score += 100;
  return score;
}

function pickRecommendation(recs: any[], channel: string) {
  return [...(recs || [])]
    .filter((r) => clean(r?.status) === 'suggested' || !clean(r?.status))
    .sort((a, b) => recommendationScore(b, channel) - recommendationScore(a, channel))[0] || null;
}

function hardBoundary(channel: string, reason?: string) {
  return {
    channel,
    decision: 'hold',
    priority: 0,
    confidence: 1,
    topic_key: '',
    rationale: `BLOCKED_HARD_BOUNDARY: ${reason || executor_capabilities[channel]?.reason || 'NO_AUTHORIZED_EXECUTOR'}`,
    scheduled_hour_local: 9,
    content_brief: '',
    forecast_id: '',
    prediction_mode: 'none',
    prediction_rationale: 'Geen veilige uitvoerbare capability.',
    decision_source: 'capability-truth',
    capability_state: 'BLOCKED_HARD_BOUNDARY',
    capability_reason: reason || executor_capabilities[channel]?.reason || 'NO_AUTHORIZED_EXECUTOR',
    plan_repaired: true,
    fallback_recommendation_id: null,
  };
}

function fallbackDecision(channel: string, recs: any[], personalSource: any, instagramObligation: any) {
  if (!executor_capabilities[channel]?.executable) return hardBoundary(channel);
  if (channel === 'linkedin_personal') {
    if (!personalSource) return hardBoundary(channel, 'PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    return { ...hardBoundary(channel), capability_state: 'READY', capability_reason: null, decision: 'publish', priority: 70, confidence: 1, scheduled_hour_local: 11, rationale: 'Verified personal truth source available.', decision_source: 'verified-personal-source', content_brief: clean(personalSource.reason), fallback_recommendation_id: personalSource.recommendation_id };
  }
  if (channel === 'instagram_company') {
    const media = instagramObligation?.evidence || {};
    if (!(media.exact_final_media_proven === true && clean(media.final_media_sha256))) return hardBoundary(channel, 'EXACT_FINAL_MEDIA_PROOF_REQUIRED');
  }
  const rec = pickRecommendation(recs, channel);
  if (!rec) return hardBoundary(channel, 'NO_EVIDENCE_BOUND_RECOMMENDATION');
  return {
    channel,
    decision: 'publish',
    priority: Math.min(100, num(rec.priority)),
    confidence: Math.max(.55, Math.min(.9, num(rec.priority) / 100)),
    topic_key: clean(rec.topic_key),
    rationale: `Deterministische evidence-bound recovery via recommendation ${rec.recommendation_id}.`,
    scheduled_hour_local: channel === 'blog' ? 12 : channel === 'instagram_company' ? 18 : 13,
    content_brief: clean(rec.reason),
    forecast_id: '',
    prediction_mode: 'none',
    prediction_rationale: 'Evidence-bound recovery zonder verzonnen forecast.',
    decision_source: 'deterministic-recommendation-fallback',
    capability_state: 'READY',
    capability_reason: null,
    plan_repaired: true,
    fallback_recommendation_id: rec.recommendation_id,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const expected = clean((await db.rpc('bg_geheim', { p_naam: 'powerhouse_daily_scheduler_token' })).data);
  if (!expected || req.headers.get('x-powerhouse-token') !== expected) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);

  let request: any = {};
  try { request = await req.json(); } catch { /* default */ }
  const runDate = clean(request.runDate) || localDate();
  let stage = 'load-context';
  try {
    const [runResult, recResult, rulesResult, governanceResult, existingResult, forecastResult, obligationsResult] = await Promise.all([
      db.from('powerhouse_daily_runs').select('*').eq('run_date', runDate).maybeSingle(),
      db.from('powerhouse_content_recommendations').select('recommendation_id,topic_key,target_channel,recommendation_type,priority,reason,evidence,status').eq('run_date', runDate).order('priority', { ascending: false }).limit(50),
      db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,vertrouwen,status').eq('status', 'actief').order('vertrouwen', { ascending: false }).limit(30),
      db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id', 'canonical').eq('use_case_id', 'supabase-bg-native-content-generate-v4').maybeSingle(),
      db.from('powerhouse_channel_decisions').select('*').eq('run_date', runDate),
      db.from('powerhouse_first_mover_queue').select('*').order('action_score', { ascending: false }).limit(20),
      db.from('content_publication_obligations').select('*').eq('tenant_id', 'canonical').eq('publication_date', runDate),
    ]);
    const run = runResult.data;
    const recs = recResult.data || [];
    const rules = rulesResult.data || [];
    const gov = governanceResult.data;
    const existing = existingResult.data || [];
    const forecasts = forecastResult.data || [];
    const obligations = obligationsResult.data || [];
    if (!run) throw new Error('DAILY_RUN_MISSING');
    if (!gov || gov.approved !== true || gov.lifecycle_status !== 'ACTIVE' || gov.provider !== 'Anthropic') throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const apiKey = clean((await db.rpc('bg_geheim', { p_naam: 'ANTHROPIC_API_KEY' })).data);
    if (!apiKey) throw new Error('AI_KEY_UNAVAILABLE');

    const personalSource = recs.filter(validPersonalSource)[0] || null;
    const instagramObligation = obligations.find((o: any) => o.channel === 'instagram') || null;
    const forecastIds = new Set(forecasts.map((f: any) => clean(f.forecast_id)));
    const repairable = existing.length < CHANNELS.length || existing.every((r: any) => ['decided','blocked'].includes(clean(r.state)) && !r.delivery_ref);

    if (repairable) {
      stage = 'plan-ai';
      const decisionTool = {
        name: 'daily_plan',
        description: 'Exact zeven evidence-led kanaalbesluiten',
        input_schema: {
          type: 'object', additionalProperties: false,
          properties: { decisions: { type: 'array', minItems: 7, maxItems: 7, items: { type: 'object', additionalProperties: false, properties: {
            channel: { type: 'string', enum: CHANNELS }, decision: { type: 'string', enum: ['publish','skip','hold'] }, priority: { type: 'number' }, confidence: { type: 'number' }, topic_key: { type: 'string' }, rationale: { type: 'string' }, scheduled_hour_local: { type: 'integer' }, content_brief: { type: 'string' }, forecast_id: { type: 'string' }, prediction_mode: { type: 'string' }, prediction_rationale: { type: 'string' },
          }, required: ['channel','decision','priority','confidence','topic_key','rationale','scheduled_hour_local','content_brief','forecast_id','prediction_mode','prediction_rationale'] } } },
          required: ['decisions'],
        },
      };
      let rawPlan: any = { decisions: [] };
      try {
        rawPlan = await callAI(apiKey, gov.model_id,
          'Je bent het canonieke Powerhouse. Beslis evidence-led voor exact zeven kanalen. Verzin geen feiten. Respecteer executor_capabilities. Persoonlijk LinkedIn mag alleen publish met verified_personal_source en personal_truth_verified=true. Instagram mag alleen publish met exact-final-media proof. Unsupported capabilities blijven HOLD met hard-boundary context.',
          { run_date: runDate, daily_run: run, recommendations: recs, verified_personal_source: personalSource, forecasts, executor_capabilities, instagram_media_proof: instagramObligation?.evidence || null, active_rules: rules },
          decisionTool, 3800);
      } catch (error) {
        console.error('PLAN_AI_RECOVERY', String((error as Error)?.message || error));
      }
      const byChannel = new Map((rawPlan.decisions || []).map((d: any) => [clean(d.channel), d]));
      for (const channel of CHANNELS) {
        const proposed: any = byChannel.get(channel);
        let decision: any;
        const invalidForecast = proposed && clean(proposed.forecast_id) && !forecastIds.has(clean(proposed.forecast_id));
        if (!proposed || invalidForecast || (proposed.decision === 'publish' && !executor_capabilities[channel]?.executable)) {
          decision = fallbackDecision(channel, recs, personalSource, instagramObligation);
        } else if (channel === 'linkedin_personal' && proposed.decision === 'publish' && !personalSource) {
          decision = hardBoundary(channel, 'PERSONAL_TRUTH_SOURCE_UNVERIFIED');
        } else if (channel === 'instagram_company' && proposed.decision === 'publish' && !(instagramObligation?.evidence?.exact_final_media_proven === true && clean(instagramObligation?.evidence?.final_media_sha256))) {
          decision = hardBoundary(channel, 'EXACT_FINAL_MEDIA_PROOF_REQUIRED');
        } else {
          decision = {
            ...proposed,
            channel,
            priority: num(proposed.priority),
            confidence: num(proposed.confidence),
            scheduled_hour_local: Math.min(20, Math.max(7, num(proposed.scheduled_hour_local) || 9)),
            capability_state: executor_capabilities[channel]?.executable ? 'READY' : 'BLOCKED_HARD_BOUNDARY',
            capability_reason: executor_capabilities[channel]?.reason || null,
            decision_source: 'ai-plan',
            plan_repaired: false,
            fallback_recommendation_id: null,
          };
        }
        const hour = String(decision.scheduled_hour_local).padStart(2, '0');
        const state = decision.decision === 'skip' ? 'skipped' : decision.capability_state === 'BLOCKED_HARD_BOUNDARY' ? 'blocked' : 'decided';
        const { error } = await db.from('powerhouse_channel_decisions').upsert({
          run_date: runDate,
          channel,
          decision: decision.decision,
          state,
          priority: decision.priority,
          confidence: decision.confidence,
          topic_key: clean(decision.topic_key),
          rationale: clean(decision.rationale),
          scheduled_for: `${runDate}T${hour}:00:00+02:00`,
          source_recommendation_ids: recs.map((r: any) => r.recommendation_id),
          delivery_evidence: {
            content_brief: clean(decision.content_brief),
            decision_engine: VERSION,
            decision_source: decision.decision_source,
            capability_state: decision.capability_state,
            capability_reason: decision.capability_reason,
            executor_capabilities,
            forecast_id: clean(decision.forecast_id) || null,
            prediction_mode: clean(decision.prediction_mode) || 'none',
            prediction_rationale: clean(decision.prediction_rationale),
            plan_repaired: decision.plan_repaired === true,
            fallback_recommendation_id: decision.fallback_recommendation_id,
            personal_source_recommendation_id: channel === 'linkedin_personal' ? personalSource?.recommendation_id || null : null,
            personal_truth_verified: channel === 'linkedin_personal' ? personalSource?.evidence?.personal_truth_verified === true : null,
          },
          updated_at: new Date().toISOString(),
        });
        if (error) throw new Error(`DECISION_WRITE:${error.message}`);
      }
    }

    stage = 'select-pending';
    const { data: pending, error: pendingError } = await db.from('powerhouse_channel_decisions').select('*').eq('run_date', runDate).eq('decision', 'publish').eq('state', 'decided').order('priority', { ascending: false }).limit(1).maybeSingle();
    if (pendingError) throw new Error(`PENDING_READ:${pendingError.message}`);
    if (!pending) return json({ ok: true, runDate, generated: false, reason: 'NO_PENDING_ARTIFACT', executor_capabilities, personal_source_ready: !!personalSource });

    if (pending.channel === 'linkedin_personal' && !personalSource) throw new Error('PERSONAL_TRUTH_SOURCE_UNVERIFIED');
    if (pending.channel === 'instagram_company') {
      const media = instagramObligation?.evidence || {};
      if (!(media.exact_final_media_proven === true && clean(media.final_media_sha256) && clean(media.media_url))) throw new Error('EXACT_FINAL_MEDIA_PROOF_REQUIRED');
    }

    stage = 'artifact-ai';
    const artifactTool = {
      name: 'content_artifact', description: 'Definitieve kanaaleigen content',
      input_schema: { type: 'object', additionalProperties: false, properties: {
        title: { type: 'string' }, body: { type: 'string' }, cta: { type: 'string' }, hook_type: { type: 'string' }, focus_keyword: { type: 'string' }, meta_description: { type: 'string' },
      }, required: ['title','body','cta','hook_type','focus_keyword','meta_description'] },
    };
    const recommendation = pending.delivery_evidence?.fallback_recommendation_id
      ? recs.find((r: any) => r.recommendation_id === pending.delivery_evidence.fallback_recommendation_id)
      : pickRecommendation(recs, pending.channel);
    const system = pending.channel === 'linkedin_personal'
      ? 'Schrijf uitsluitend uit de geverifieerde persoonlijke bron. Geen businessbrug, verkoop, verzonnen ervaring of zakelijke moraal.'
      : pending.channel === 'instagram_company'
      ? 'Schrijf Mira daily-life caption passend bij de reeds bewezen finale media. Geen interne kantoorproblemen of geforceerde businessmoraal.'
      : 'Schrijf feitelijke kanaaleigen content. Verzin geen cases, cijfers, quotes of ervaringen.';
    const artifact = await callAI(apiKey, gov.model_id, system, {
      channel: pending.channel,
      brief: pending.delivery_evidence?.content_brief || pending.rationale,
      recommendation,
      verified_personal_source: pending.channel === 'linkedin_personal' ? personalSource : null,
      instagram_media_proof: pending.channel === 'instagram_company' ? instagramObligation?.evidence : null,
      active_rules: rules,
    }, artifactTool, pending.channel === 'blog' ? 4800 : 2600);

    const bodyText = clean(artifact.body);
    const finalTextHash = await digest(bodyText);
    const personalEvidence = pending.channel === 'linkedin_personal' ? {
      ...(personalSource.evidence || {}),
      content_id: clean(personalSource.evidence?.content_id) || `${runDate}:linkedin_personal`,
      calendar_date: runDate,
      channel_id: PERSONAL_CHANNEL,
      channel_kind: 'linkedin_personal',
      identity_contract: PERSONAL_CONTRACT,
      identity_gate_version: PERSONAL_GATE,
      personal_truth_verified: true,
      prediction_lineage_present: true,
      prior_prediction_decision_id: `decision:${runDate}:linkedin_personal`,
      publication_intent: 'publish',
      final_text_hash: finalTextHash,
    } : null;
    const instagramProof = pending.channel === 'instagram_company' ? {
      ...(instagramObligation?.evidence || {}),
      exact_final_media_proven: true,
      final_media_sha256: clean(instagramObligation?.evidence?.final_media_sha256),
      media_url: clean(instagramObligation?.evidence?.media_url),
      mira_gate_passed: instagramObligation?.evidence?.mira_gate_result === 'PASS',
    } : null;
    const artifactType = pending.channel === 'blog' ? 'blog' : pending.channel === 'instagram_company' ? 'instagram_post' : 'linkedin_post';
    const { error: artifactError } = await db.from('powerhouse_content_artifacts').upsert({
      run_date: runDate,
      channel: pending.channel,
      artifact_type: artifactType,
      title: clean(artifact.title),
      body: bodyText,
      cta: clean(artifact.cta),
      content_brief: pending.delivery_evidence?.content_brief || pending.rationale,
      generation_evidence: {
        model: gov.model_id,
        orchestrator: VERSION,
        hook_type: clean(artifact.hook_type),
        focus_keyword: clean(artifact.focus_keyword),
        meta_description: clean(artifact.meta_description),
        recommendation_id: recommendation?.recommendation_id || null,
        identity_gate_evidence: personalEvidence,
        instagram_media_proof: instagramProof,
      },
      status: 'content_ready',
      updated_at: new Date().toISOString(),
    });
    if (artifactError) throw new Error(`ARTIFACT_WRITE:${artifactError.message}`);
    const { error: decisionError } = await db.from('powerhouse_channel_decisions').update({
      state: 'content_ready',
      delivery_evidence: {
        ...(pending.delivery_evidence || {}),
        identity_gate_evidence: personalEvidence,
        instagram_media_proof: instagramProof,
      },
      updated_at: new Date().toISOString(),
    }).eq('run_date', runDate).eq('channel', pending.channel);
    if (decisionError) throw new Error(`DECISION_STATE_WRITE:${decisionError.message}`);

    return json({ ok: true, runDate, generated: true, channel: pending.channel, title: artifact.title, executor_capabilities, personal_truth_verified: pending.channel === 'linkedin_personal' ? true : null });
  } catch (error) {
    const message = String((error as Error)?.message || error).slice(0, 500);
    console.error('ORCHESTRATOR_ERROR', stage, message);
    try {
      await db.from('bg_gezondheid').insert({ gemeten_op: new Date().toISOString(), onderdeel: 'powerhouse-content-orchestrator', soort: 'edge-function', status: 'fout', detail: `${stage}:${message}`.slice(0, 400), gegevens: { runDate, version: VERSION, stage } });
    } catch { /* fail closed */ }
    return json({ ok: false, error: message, stage, runDate }, 500);
  }
});
