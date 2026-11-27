// INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
// Original bg_bewijs remains canonical, only approved OpenAI provider and original experiment poort.
// bg-experimentcyclus — de weekcyclus van meten, leren en experimenteren (11 sept 2026).
// 1. Beoordeel lopende experimenten (advies behouden/verwerpen/verlengen, twee-proportietoets) via intern.bg_experimenten_beoordelen.
// 2. Loopt er niets en staat er niets klaar: stel één experiment voor met OpenAI (use case supabase-bg-experimentcyclus-v1),
//    op basis van samengevoegde cijfers (pagina, knop, scroll, formulier, trechter) en eerdere lessen.
// 3. Te weinig verkeer voor een zinnige meting: niets voorstellen, en dat eerlijk vastleggen.
// Besluiten neemt Arthur in /intern/meetoverzicht. Bewijs: public.bg_bewijs.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BRON = 'bg-experimentcyclus';
const USE_CASE = 'supabase-bg-experimentcyclus-v1';
const MIN_BEZOEKERS = 150; // in 30 dagen, anders is voor-en-na meten zinloos
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST_ONLY' }, 405);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const bewijs = (groen: boolean, detail: unknown, klasse: string | null = null) => db.rpc('bg_bewijs', { p_bron: BRON, p_groen: groen, p_detail: detail, p_foutklasse: klasse }).then(() => {}, () => {});
  const poort = async (actie: string, voorstel: unknown = null) => { const { data, error } = await db.rpc('bg_experimentcyclus_poort', { p_actie: actie, p_voorstel: voorstel }); if (error) throw new Error(`${actie}: ${error.message}`); return data as any; };
  try {
    const beoordeeld = await poort('beoordelen');
    const d = await poort('data');
    // The shared register also contains content-distribution experiments owned by
    // other agents. They must not permanently block the original CRO experiment owner.
    const alleExperimenten = (d.cyclus?.experimenten || []) as any[];
    const eigen = alleExperimenten.filter(e =>
      ['site', 'seo', 'content'].includes(String(e.onderdeel || '')) &&
      (String(e.voorgesteld_door || '') === BRON ||
        /^bgx-/.test(String(e.id || e.experiment_id || '')))
    );
    const lopend = eigen.filter(e => e.status === 'ACTIVE' || e.status === 'PLANNED');
    const bezoekers = Number(d.meet?.totaal?.bezoekers || 0);
    if (lopend.length) {
      // A cron/HTTP success is not treatment, exposure, or measured improvement.
      // Keep the original single-experiment/human-authorization gate; give its owner
      // a typed, truthful recovery obligation instead of another green no-op.
      const planned = lopend.filter(e => e.status === 'PLANNED');
      const active = lopend.filter(e => e.status === 'ACTIVE');
      const r = {
        ok: false, beoordeeld, voorstel: null,
        reason_code: 'EXPERIMENT_EXECUTION_UNVERIFIED',
        cycle_status: planned.length ? 'PROPOSED_NOT_DEPLOYED' : 'ACTIVE_OUTCOME_UNVERIFIED',
        active_count: active.length, pending_count: planned.length,
        pending_experiment_ids: planned.slice(0, 3).map(e => String(e.id || e.experiment_id || '')),
        improvement_verified: false,
        next_owner: 'original-growth-cro-agent',
        next_action: planned.length
          ? 'VERIFY_CONTROL_IN_LIVE_DOM_AND_SUBMIT_PROTECTED_CHANGE; AUTHORIZE_EXPOSURE_AFTER_DEPLOY'
          : 'VERIFY_PRODUCTION_EXPOSURE_AND_MATURED_CONTROL_OUTCOME',
        reden: 'een geregistreerd experiment is nog geen uitgevoerde of bewezen verbetering'
      };
      await bewijs(false, r, 'VALIDATION');
      return json(r);
    }
    if (bezoekers < MIN_BEZOEKERS) {
      const r = { ok: false, beoordeeld, voorstel: null, reason_code: 'INSUFFICIENT_TRAFFIC', cycle_status: 'INSUFFICIENT_OBSERVED_TRAFFIC',
        observed_session_count: bezoekers, required_session_count: MIN_BEZOEKERS,
        improvement_verified: false, next_owner: 'original-growth-cro-agent',
        next_action: 'VALIDATE_CONSENTED_INSTRUMENTATION_AND_PRIORITIZE_SAFE_GITOPS_ITERATION',
        reden: 'onvoldoende waargenomen sessies voor een betekenisvolle voor-na-meting; geen winst claimen' };
      await bewijs(false, r, 'VALIDATION');
      return json(r);
    }

    const { data: gov } = await db.from('brain_ai_governance_registry').select('model_id,lifecycle_status,approved,provider').eq('tenant_id', 'canonical').eq('use_case_id', USE_CASE).maybeSingle();
    if (!gov || gov.lifecycle_status !== 'ACTIVE' || gov.approved !== true || gov.provider !== 'OpenAI') { const r = { ok: false, error: 'AI_USE_CASE_NOT_APPROVED' }; await bewijs(false, r, 'POLICY'); return json(r, 403); }
    const ak = (((await db.rpc('bg_geheim', { p_naam: 'OPENAI_API_KEY' })).data as string) || '').trim();
    if (!ak) { const r = { ok: false, error: 'CONFIG_UNAVAILABLE' }; await bewijs(false, r, 'AUTH'); return json(r, 503); }

    const paginas = (d.meet?.paginas || []).slice(0, 25);
    const knoppen = (d.meet?.knoppen || []).slice(0, 40);
    const context = { periode_dagen: 30, totaal: d.meet?.totaal, paginas, knoppen, formulieren: d.meet?.formulieren || [], trechter_totaal: d.cyclus?.trechter_totaal, trechter: (d.cyclus?.trechter || []).slice(0, 30), eerdere_lessen: d.cyclus?.lessen || [], eerdere_experimenten: eigen.slice(0, 10).map((e: any) => ({ hypothese: e.hypothese, pagina: e.pagina, besluit: e.besluit, status: e.status })) };
    const schema = { type: 'object', properties: { hypothese: { type: 'string', description: 'Eén toetsbare zin in het Nederlands: als we X veranderen op pagina Y, dan stijgt meetpunt Z, omdat …' }, onderdeel: { type: 'string', enum: ['site', 'seo', 'content'] }, pagina: { type: 'string', description: 'Pad van een pagina uit de cijfers, bv. /prijzen' }, controle: { type: 'string', description: 'Wat er nu staat' }, variant: { type: 'string', description: 'Precies wat er verandert, concreet genoeg om in te voeren' }, meetpunt: { type: 'string', description: 'klik:<knoptekst>, klik_doel:<pad of extern:domein>, scroll:<25|50|75|90|100>, formulier, lead, gesprek, offerte of order' }, min_steekproef: { type: 'integer' }, looptijd_dagen: { type: 'integer' }, onderbouwing: { type: 'string', description: 'Waarom dit het grootste lek is, met de cijfers uit de context' } }, required: ['hypothese', 'onderdeel', 'pagina', 'controle', 'variant', 'meetpunt', 'min_steekproef', 'looptijd_dagen', 'onderbouwing'] };
    const ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${ak}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: gov.model_id,
        max_completion_tokens: 4000,
        messages: [
          { role: 'system', content: 'Je bent de experimenteigenaar van Bedrijfsgeheugen. Kies precies één meetbaar experiment op uitsluitend bestaande gemeten pagina’s en knoppen. Geen verzonnen cijfers, geen micro-tweaks en geen eerder verworpen hypothesen.' },
          { role: 'user', content: JSON.stringify(context) }
        ],
        tools: [{ type: 'function', function: { name: 'voorstel', description: 'Een uitvoerbaar meetbaar experiment uit origineel meetbewijs', parameters: schema } }],
        tool_choice: { type: 'function', function: { name: 'voorstel' } },
        parallel_tool_calls: false
      }),
      signal: AbortSignal.timeout(60000)
    });
    const ab: any = await ai.json().catch(() => ({}));
    if (!ai.ok) throw new Error(`OPENAI_${ai.status}`);
    const message = ab?.choices?.[0]?.message;
    if (message?.refusal) throw new Error('OPENAI_REFUSAL');
    const args = (message?.tool_calls || []).find((c: any) => c?.type === 'function' && c?.function?.name === 'voorstel')?.function?.arguments;
    if (typeof args !== 'string') throw new Error('OPENAI_TOOL_RESULT_MISSING');
    let v: any;
    try { v = JSON.parse(args); } catch { throw new Error('OPENAI_OUTPUT_NOT_JSON'); }
    if (!v || typeof v !== 'object' || Array.isArray(v)
      || schema.required.some((field: string) => !(field in v))
      || !paginas.some((p: any) => p.pad === v.pagina))
      throw new Error('VOORSTEL_ONBEKENDE_PAGINA_OR_SCHEMA');
    // "BUTTON" is a captured instrumentation label, not verified live DOM copy.
    // Never turn it into an executable website change without original-site proof.
    if (/\bBUTTON\b/i.test(String(v.controle || '') + ' ' + String(v.variant || ''))) {
      const r = { ok: false, beoordeeld, voorstel: null, reason_code: 'CONTROL_NOT_VERIFIED', cycle_status: 'UNVERIFIED_PAGE_CONTROL',
        improvement_verified: false, next_owner: 'original-growth-cro-agent',
        next_action: 'VERIFY_CANONICAL_LIVE_DOM_CONTROL_BEFORE_PROPOSAL' };
      await bewijs(false, r, 'VALIDATION');
      return json(r);
    }

    const res = await poort('voorstellen', v);
    const r = { ok: true, beoordeeld, reason_code: 'EXPERIMENT_NOT_ACTIVATED', cycle_status: 'PROPOSED_NOT_DEPLOYED',
      improvement_verified: false, next_owner: 'original-growth-cro-agent',
      next_action: 'VERIFY_CONTROL_AND_CREATE_PROTECTED_GITOPS_CANDIDATE',
      voorstel: { id: res.experiment_id, hypothese: v.hypothese, pagina: v.pagina, meetpunt: v.meetpunt } };
    // Proposal creation is successful, but the commercial learning loop is not.
    await bewijs(false, r, 'VALIDATION');
    return json(r);
  } catch (_error: unknown) {
    // Do not disclose provider/DB exception details to callers. Keep canonical source owner recovery due.
    const result = { ok: false, error: 'EXPERIMENT_CYCLE_SOURCE_FAILURE', recovery: 'ORIGINAL_OWNER_DIAGNOSIS_DUE' };
    await bewijs(false, { ...result, provider: 'OpenAI', incident_protocol: 'agents-skills-register-and-self-fix-v1' }, 'VALIDATION');
    return json(result, 500);
  }
});
