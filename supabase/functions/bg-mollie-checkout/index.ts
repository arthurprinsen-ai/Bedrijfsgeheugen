// bg-mollie-checkout — maandelijks en jaarlijks terugkerend afrekenen met Mollie (27 okt 2026).
// POST  {plan, billing_cycle, email, company_name, attempt_id}  -> {url}  (Mollie checkout voor de eerste betaling)
// POST  {..., mode:'trial'}  -> {url}  (30 dagen gratis, geen betaalmethode; één proef per e-mailadres)
// GET   ?readiness=1                                            -> {provider:'mollie', selfServeAvailable}
// GET   ?status=<intent-id>                                      -> {ready, state}
// Aanroeper: Netlify (service role als bearer, verify_jwt aan). Sleutel: Vault MOLLIE_API_KEY.
import { buildFirstPayment, normalizeCycle, safeUuid } from '../_shared/mollie-billing.mjs';
import { json, ORIGIN, serviceClient, mollie, mollieKey, webhookUrl, handlePayment, startTrial } from '../_shared/mollie-server.ts';

Deno.serve(async (req: Request) => {
  const db = serviceClient();
  const url = new URL(req.url);
  const key = await mollieKey(db);

  if (req.method === 'GET' && url.searchParams.get('readiness')) {
    return json({ provider: 'mollie', selfServeAvailable: Boolean(key), state: key ? 'ready' : 'blocked' });
  }

  if (req.method === 'GET' && url.searchParams.get('status')) {
    const intentId = safeUuid(url.searchParams.get('status'));
    if (!intentId) return json({ error: 'invalid_session' }, 400);
    const { data: intent } = await db.from('saas_checkout_intents').select('*').eq('id', intentId).maybeSingle();
    if (!intent) return json({ ready: false, state: 'unknown' }, 404);
    if (intent.state === 'completed') {
      const sub = await db.from('saas_subscriptions').select('status').in('provider', ['mollie', 'trial']).eq('metadata->>checkout_session_id', intentId).maybeSingle();
      const ready = ['active', 'trialing'].includes(String(sub.data?.status || ''));
      return json({ ready, state: ready ? 'ready' : 'provisioning' });
    }
    if (!key || !intent.provider_session_id) return json({ ready: false, state: 'provisioning' }, 503);
    try {
      const payment = await mollie(key, `payments/${encodeURIComponent(intent.provider_session_id)}`);
      if (payment.status === 'paid') { await handlePayment(db, key, payment); const again = await db.from('saas_subscriptions').select('status').in('provider', ['mollie', 'trial']).eq('metadata->>checkout_session_id', intentId).maybeSingle(); const ready = again.data?.status === 'active'; return json({ ready, state: ready ? 'ready' : 'provisioning' }); }
      return json({ ready: false, state: ['expired', 'canceled', 'failed'].includes(payment.status) ? 'expired' : 'provisioning' });
    } catch { return json({ ready: false, state: 'unavailable' }, 503); }
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const planCode = String(body.plan || '').toLowerCase();
  const cycle = normalizeCycle(body.billing_cycle);
  const email = String(body.email || '').trim().toLowerCase();
  const company = String(body.company_name || '').trim();
  const intentId = safeUuid(body.attempt_id);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || company.length < 2 || !intentId) return json({ error: 'invalid_request' }, 400);

  const trialMode = String(body.mode || '') === 'trial';
  if (!trialMode && !key) return json({ error: 'billing_not_configured' }, 503);

  const { data: plan } = await db.from('saas_plans').select('code,name,monthly_price_cents,direct_checkout,active').eq('code', planCode).eq('active', true).maybeSingle();
  if (!plan || !plan.direct_checkout || !plan.monthly_price_cents) return json({ error: 'plan_not_self_serve' }, 400);

  await db.from('saas_checkout_intents').upsert({ id: intentId, plan_code: planCode, email, company_name: company, state: 'created', provider: 'mollie' }, { onConflict: 'id', ignoreDuplicates: true });
  const { data: intent } = await db.from('saas_checkout_intents').select('*').eq('id', intentId).single();
  if (!intent || intent.plan_code !== planCode || intent.email !== email || intent.company_name !== company) return json({ error: 'checkout_attempt_conflict' }, 409);

  if (trialMode) {
    try {
      const t = await startTrial(db, { planCode, cycle, email, company, intentId });
      if (!t.ok) return json({ error: t.error }, 409);
      return json({ url: `${ORIGIN}/afsluiten?success=1&trial=1&session_id=${encodeURIComponent(intentId)}&plan=${planCode}&billing=${cycle}` });
    } catch { return json({ error: 'storage_unavailable' }, 503); }
  }

  try {
    if (intent.provider_session_id) {
      const previous = await mollie(key, `payments/${encodeURIComponent(intent.provider_session_id)}`);
      if (previous.status === 'paid') return json({ url: `${ORIGIN}/afsluiten?success=1&session_id=${encodeURIComponent(intentId)}&plan=${planCode}&billing=${cycle}` });
      if (['expired', 'canceled', 'failed'].includes(previous.status)) return json({ error: 'checkout_expired' }, 409);
      if (previous.metadata?.billing_cycle !== cycle) return json({ error: 'checkout_attempt_conflict' }, 409);
      const href = previous._links?.checkout?.href;
      if (!/^https:\/\/www\.mollie\.com\//.test(String(href || ''))) return json({ error: 'checkout_reconciliation_required' }, 409);
      return json({ url: href });
    }
    const customer = await mollie(key, 'customers', { method: 'POST', body: { name: company, email, metadata: { checkout_intent_id: intentId } }, idempotency: `bg-customer-${intentId}` });
    const payload = buildFirstPayment({ planName: plan.name, planCode, cycle, monthlyPriceCents: plan.monthly_price_cents, customerId: customer.id, intentId, company, origin: ORIGIN, webhookUrl: webhookUrl() });
    const payment = await mollie(key, 'payments', { method: 'POST', body: payload, idempotency: `bg-payment-${intentId}` });
    const href = payment?._links?.checkout?.href;
    if (!payment?.id || !/^https:\/\/www\.mollie\.com\//.test(String(href || ''))) return json({ error: 'checkout_provider_failed' }, 502);
    const saved = await db.from('saas_checkout_intents').update({ provider_session_id: payment.id, state: 'checkout_open', updated_at: new Date().toISOString() }).eq('id', intentId).is('provider_session_id', null);
    if (saved.error) return json({ error: 'storage_unavailable' }, 503);
    return json({ url: href });
  } catch (e: any) { return json({ error: 'checkout_provider_failed', detail: String(e?.message || e).slice(0, 300) }, 502); }
});
