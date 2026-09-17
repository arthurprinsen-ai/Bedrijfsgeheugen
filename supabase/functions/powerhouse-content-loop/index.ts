import { createClient } from 'npm:@supabase/supabase-js@2';

const clean = (v: unknown) => String(v ?? '').trim();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const OPERATIONAL_CHANNELS = ['linkedin_personal','linkedin_company','instagram','blog'];
const TERMINAL_GREEN = new Set(['LIVE_PROVEN','MEASURED','LEARNED','SKIPPED']);

async function invoke(base: string, token: string, name: string, payload: unknown) {
  const response = await fetch(`${base}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-powerhouse-token': token },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  return { name, http: response.status, ok: response.ok && body?.ok !== false, body };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ ok: false, error: 'CONFIG' }, 500);
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const expected = clean((await db.rpc('bg_geheim', { p_naam: 'powerhouse_daily_scheduler_token' })).data);
  if (!expected || req.headers.get('x-powerhouse-token') !== expected) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
  let input: any = {};
  try { input = await req.json(); } catch { /* default */ }
  const runDate = clean(input.runDate) || localDate();
  const stepResults: any[] = [];

  try {
    const first = await db.rpc('powerhouse_reconcile_content_outcomes_v1', { p_date: runDate });
    if (first.error) throw new Error('RECONCILE_PRE_FAILED');
    stepResults.push({ name: 'reconcile_pre', ok: true, body: first.data });

    for (let i = 0; i < 5; i++) {
      const step = await invoke(url, expected, 'powerhouse-content-orchestrator', { runDate });
      stepResults.push(step);
      if (!step.ok || step.body?.generated !== true) break;
    }

    stepResults.push(await invoke(url, expected, 'powerhouse-social-publisher', { runDate }));
    stepResults.push(await invoke(url, expected, 'powerhouse-blog-queue', { runDate }));

    const sync = await fetch(`${url}/functions/v1/bg-buffer-sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const syncBody = await sync.json().catch(() => ({}));
    stepResults.push({ name: 'bg-buffer-sync', http: sync.status, ok: sync.ok && syncBody?.ok !== false, body: syncBody });

    stepResults.push(await invoke(url, expected, 'powerhouse-social-publisher', { runDate, mode: 'audit_only' }));

    const final = await db.rpc('powerhouse_reconcile_content_outcomes_v1', { p_date: runDate });
    if (final.error) throw new Error('RECONCILE_POST_FAILED');
    stepResults.push({ name: 'reconcile_post', ok: true, body: final.data });

    const [{ data: obligations, error: obligationsError }, { data: decisions, error: decisionsError }] = await Promise.all([
      db.from('content_publication_obligations').select('channel,status,external_id,evidence,last_error,next_action,updated_at').eq('tenant_id', 'canonical').eq('publication_date', runDate).in('channel', OPERATIONAL_CHANNELS),
      db.from('powerhouse_channel_decisions').select('channel,decision,state,delivery_ref,delivery_evidence,updated_at').eq('run_date', runDate),
    ]);
    if (obligationsError) throw new Error('OBLIGATIONS_READ_FAILED');
    if (decisionsError) throw new Error('DECISIONS_READ_FAILED');

    const outcomeVerified = (obligations || []).filter((o: any) => TERMINAL_GREEN.has(clean(o.status))).length;
    const providerTruthVerified = (obligations || []).filter((o: any) => o.evidence?.provider_truth_verified === true).length;
    const blocked = (obligations || []).filter((o: any) => ['BLOCKED','FAILED'].includes(clean(o.status))).length;
    const hardBoundaries = (decisions || []).filter((d: any) => d.delivery_evidence?.capability_state === 'BLOCKED_HARD_BOUNDARY').map((d: any) => ({ channel: d.channel, reason: d.delivery_evidence?.capability_reason || d.rationale }));
    const allOperationalGreen = (obligations || []).length === OPERATIONAL_CHANNELS.length && (obligations || []).every((o: any) => TERMINAL_GREEN.has(clean(o.status)));
    const loopState = blocked > 0 ? 'RED' : allOperationalGreen ? 'GREEN' : 'AMBER';
    const providerTruthHealthy = (obligations || []).every((o: any) => {
      if (['DISPATCHED','PUBLISHED'].includes(clean(o.status)) && ['linkedin_personal','linkedin_company','instagram'].includes(clean(o.channel))) return o.evidence?.provider_truth_verified === true;
      return true;
    });

    const result = {
      ok: loopState !== 'RED' && providerTruthHealthy,
      loop_state: loopState,
      runDate,
      truth_contract: 'GREEN MEANS OUTCOME VERIFIED',
      outcomeVerified,
      providerTruthVerified,
      providerTruthHealthy,
      blocked,
      hardBoundaries,
      obligations: obligations || [],
      decisions: decisions || [],
    };

    await db.from('brain_records').upsert({
      tenant_id: 'canonical', record_id: `content-closed-loop:${runDate}`, record_type: 'Verification', record_kind: 'verification', subject_id: runDate,
      status: loopState === 'GREEN' ? 'VERIFIED' : loopState === 'RED' ? 'BLOCKED' : 'IN_PROGRESS', observed_at: new Date().toISOString(), executed: true,
      verified: loopState === 'GREEN', result, payload: { run_date: runDate, supervisor: 'powerhouse-content-loop-v1' }, idempotency_key: `content-closed-loop:${runDate}`,
      source_revision: 'powerhouse-content-loop-v1', stored_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,record_id' });

    return json(result, result.ok ? 200 : 409);
  } catch (error) {
    const message = String((error as Error)?.message || error).slice(0, 500);
    console.error('CONTENT_LOOP_ERROR', message, stepResults);
    try {
      await db.from('brain_records').upsert({
        tenant_id: 'canonical', record_id: `content-closed-loop:${runDate}`, record_type: 'Verification', record_kind: 'verification', subject_id: runDate,
        status: 'BLOCKED', observed_at: new Date().toISOString(), executed: true, verified: false,
        result: { loop_state: 'RED', error: 'CONTENT_LOOP_INTERNAL_ERROR', truth_contract: 'GREEN MEANS OUTCOME VERIFIED' },
        payload: { run_date: runDate, supervisor: 'powerhouse-content-loop-v1' }, idempotency_key: `content-closed-loop:${runDate}`, source_revision: 'powerhouse-content-loop-v1', stored_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,record_id' });
    } catch { /* preserve original failure */ }
    return json({ ok: false, loop_state: 'RED', runDate, error: 'CONTENT_LOOP_INTERNAL_ERROR' }, 500);
  }
});