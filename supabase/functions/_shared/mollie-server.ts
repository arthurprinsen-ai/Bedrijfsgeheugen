// Mollie server helpers for Supabase Edge Functions. The API key is read from Vault via public.bg_geheim('MOLLIE_API_KEY');
// it never reaches a browser, log line, Netlify env or Notion.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { trialEndsAt, buildSubscription, isPaidFirstPayment, statusAfterRecurringPayment, subscriptionStatusFromMollie, intentStateForPayment, safeUuid } from './mollie-billing.mjs';

export const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
export const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export const webhookUrl = () => `${Deno.env.get('SUPABASE_URL')}/functions/v1/bg-mollie-webhook`;

export async function mollieKey(db: any): Promise<string> {
  const { data } = await db.rpc('bg_geheim', { p_naam: 'MOLLIE_API_KEY' });
  return String(data || '').trim();
}

export async function mollie(key: string, path: string, init: { method?: string; body?: unknown; idempotency?: string } = {}) {
  const headers: Record<string, string> = { authorization: `Bearer ${key}`, accept: 'application/json' };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.idempotency) headers['idempotency-key'] = init.idempotency;
  const res = await fetch(`https://api.mollie.com/v2/${path}`, { method: init.method || 'GET', headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) { const e: any = new Error(`MOLLIE_${res.status} ${path.split('/')[0]} ${String(data?.title || '')} ${String(data?.detail || '')}`.slice(0, 280)); e.status = res.status; throw e; }
  return data;
}

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Idempotent: a first payment that is paid creates exactly one organisation, customer, invitation, Mollie subscription
// and saas_subscriptions row, however many times the webhook or the status poll runs.
export async function provisionFirstPayment(db: any, key: string, payment: any) {
  if (!isPaidFirstPayment(payment)) return { provisioned: false, reason: 'NOT_PAID_FIRST' };
  const meta = payment.metadata || {};
  const planCode = String(meta.plan_code || '').toLowerCase();
  const cycle = String(meta.billing_cycle || 'monthly');
  const intentId = safeUuid(meta.checkout_intent_id);
  const company = String(meta.company_name || '').trim();
  if (!planCode || !intentId || company.length < 2) throw new Error('PAYMENT_METADATA_INVALID');

  const done = await db.from('saas_subscriptions').select('id,organisation_id,provider_subscription_id').eq('provider', 'mollie').eq('metadata->>first_payment_id', payment.id).maybeSingle();
  if (done.data) return { provisioned: true, already: true, organisation_id: done.data.organisation_id };

  const { data: plan } = await db.from('saas_plans').select('code,name,monthly_price_cents,active').eq('code', planCode).eq('active', true).maybeSingle();
  if (!plan) throw new Error('INVALID_PLAN');
  const { data: intent } = await db.from('saas_checkout_intents').select('*').eq('id', intentId).maybeSingle();
  if (!intent || intent.plan_code !== planCode) throw new Error('CHECKOUT_INTENT_MISMATCH');
  const email = String(intent.email || '').trim().toLowerCase();
  if (!email) throw new Error('MISSING_CUSTOMER');

  // A customer who started with the free trial keeps the same organisation: paying converts the trial.
  const trialRows = await db.from('saas_subscriptions').select('id,organisation_id').eq('provider', 'trial').eq('metadata->>trial_email', email).order('created_at', { ascending: false }).limit(1);
  const trial = trialRows.data?.[0] || null;
  let org: any = trial ? { id: trial.organisation_id } : null;
  if (!org) {
    const slug = 'checkout-' + (await sha256Hex(payment.id)).slice(0, 40);
    await db.from('organisaties').upsert({ naam: company, slug }, { onConflict: 'slug', ignoreDuplicates: true });
    const found = await db.from('organisaties').select('id').eq('slug', slug).single();
    org = found.data;
  }
  if (!org?.id) throw new Error('ORGANISATION_CREATE_FAILED');
  const klant = await db.from('klanten').select('id').eq('organisatie_id', org.id).ilike('email', email).maybeSingle();
  if (!klant.data) await db.from('klanten').insert({ organisatie_id: org.id, naam: company, email });
  await db.from('uitnodigingen').upsert({ organisatie_id: org.id, email, rol: 'eigenaar' }, { onConflict: 'email,organisatie_id' });

  const paidOn = String(payment.paidAt || new Date().toISOString()).slice(0, 10);
  const body = buildSubscription({ planName: plan.name, planCode, cycle, monthlyPriceCents: plan.monthly_price_cents, firstPaidOn: paidOn, webhookUrl: webhookUrl(), organisationId: org.id, intentId });
  const sub = await mollie(key, `customers/${encodeURIComponent(payment.customerId)}/subscriptions`, { method: 'POST', body, idempotency: `bg-sub-${payment.id}` });

  const up = await db.from('saas_subscriptions').upsert({
    organisation_id: org.id, plan_code: planCode, provider: 'mollie', provider_customer_id: payment.customerId, provider_subscription_id: sub.id,
    status: subscriptionStatusFromMollie(sub.status), current_period_end: sub.nextPaymentDate ? `${sub.nextPaymentDate}T00:00:00Z` : null, cancel_at_period_end: false,
    metadata: { first_payment_id: payment.id, checkout_session_id: intentId, billing_cycle: cycle }, updated_at: new Date().toISOString(),
  }, { onConflict: 'provider_subscription_id' });
  if (up.error) throw new Error('SUBSCRIPTION_STORE_FAILED');
  if (trial) await db.from('saas_subscriptions').update({ status: 'canceled', metadata: { trial: true, converted_payment_id: payment.id }, updated_at: new Date().toISOString() }).eq('id', trial.id);
  await db.from('saas_checkout_intents').update({ state: 'completed', organisation_id: org.id, updated_at: new Date().toISOString() }).eq('id', intentId);
  await db.from('powerhouse_runtime_events').upsert({
    dedupe_key: `mollie:checkout:${payment.id}:provisioned`, event_type: 'subscription_provisioned', source: 'mollie.webhook', channel: 'website', company_key: `org:${org.id}`, topic_key: 'saas_subscription',
    evidence: { payment_id: payment.id, subscription_id: sub.id, organisation_id: org.id }, context: { plan_code: planCode, billing_cycle: cycle, privacy_scope: 'no_pii', revenue_verified: false }, state: 'observed', data_quality: 'OBSERVED', confidence: 1,
  }, { onConflict: 'dedupe_key', ignoreDuplicates: true }).then(() => {}, () => {});
  return { provisioned: true, already: false, organisation_id: org.id };
}

// A later (recurring) payment: re-read provider truth, then patch status and period end. Out-of-order webhooks are harmless.
export async function syncRecurringPayment(db: any, key: string, payment: any) {
  const subId = String(payment.subscriptionId || '');
  if (!subId) return { synced: false, reason: 'NO_SUBSCRIPTION' };
  const existing = await db.from('saas_subscriptions').select('provider_customer_id,metadata').eq('provider', 'mollie').eq('provider_subscription_id', subId).maybeSingle();
  if (!existing.data) return { synced: false, reason: 'UNKNOWN_SUBSCRIPTION' };
  const sub = await mollie(key, `customers/${encodeURIComponent(existing.data.provider_customer_id || payment.customerId)}/subscriptions/${encodeURIComponent(subId)}`);
  const status = statusAfterRecurringPayment(payment, sub.status) || subscriptionStatusFromMollie(sub.status);
  await db.from('saas_subscriptions').update({ status, current_period_end: sub.nextPaymentDate ? `${sub.nextPaymentDate}T00:00:00Z` : null, updated_at: new Date().toISOString() }).eq('provider', 'mollie').eq('provider_subscription_id', subId);
  return { synced: true, status };
}

export async function handlePayment(db: any, key: string, payment: any) {
  const meta = payment.metadata || {};
  const intentId = safeUuid(meta.checkout_intent_id);
  if (payment.sequenceType === 'first') {
    if (intentId) await db.from('saas_checkout_intents').update({ state: intentStateForPayment(payment.status), updated_at: new Date().toISOString() }).eq('id', intentId).neq('state', 'completed');
    return provisionFirstPayment(db, key, payment);
  }
  return syncRecurringPayment(db, key, payment);
}

// Free trial: full access for TRIAL_DAYS without a payment method. One trial per e-mail address.
export async function startTrial(db: any, a: { planCode: string; cycle: string; email: string; company: string; intentId: string }) {
  const subId = `trial-${a.intentId}`;
  const again = await db.from('saas_subscriptions').select('organisation_id,current_period_end').eq('provider', 'trial').eq('provider_subscription_id', subId).maybeSingle();
  if (again.data) return { ok: true, already: true, organisation_id: again.data.organisation_id };
  const used = await db.from('saas_subscriptions').select('id').eq('provider', 'trial').eq('metadata->>trial_email', a.email).limit(1);
  if (used.data?.length) return { ok: false, error: 'trial_already_used' };
  const slug = 'trial-' + (await sha256Hex(a.intentId)).slice(0, 40);
  await db.from('organisaties').upsert({ naam: a.company, slug }, { onConflict: 'slug', ignoreDuplicates: true });
  const { data: org } = await db.from('organisaties').select('id').eq('slug', slug).single();
  if (!org?.id) throw new Error('ORGANISATION_CREATE_FAILED');
  const klant = await db.from('klanten').select('id').eq('organisatie_id', org.id).ilike('email', a.email).maybeSingle();
  if (!klant.data) await db.from('klanten').insert({ organisatie_id: org.id, naam: a.company, email: a.email });
  await db.from('uitnodigingen').upsert({ organisatie_id: org.id, email: a.email, rol: 'eigenaar' }, { onConflict: 'email,organisatie_id' });
  const end = trialEndsAt();
  const up = await db.from('saas_subscriptions').upsert({
    organisation_id: org.id, plan_code: a.planCode, provider: 'trial', provider_subscription_id: subId, status: 'trialing', current_period_end: end, cancel_at_period_end: true,
    metadata: { trial: true, trial_email: a.email, checkout_session_id: a.intentId, billing_cycle: a.cycle, trial_ends_at: end }, updated_at: new Date().toISOString(),
  }, { onConflict: 'provider_subscription_id' });
  if (up.error) throw new Error('SUBSCRIPTION_STORE_FAILED');
  await db.from('saas_checkout_intents').update({ state: 'completed', organisation_id: org.id, updated_at: new Date().toISOString() }).eq('id', a.intentId);
  await db.from('powerhouse_runtime_events').upsert({
    dedupe_key: `trial:started:${a.intentId}`, event_type: 'trial_started', source: 'bg-mollie-checkout', channel: 'website', company_key: `org:${org.id}`, topic_key: 'saas_subscription',
    evidence: { organisation_id: org.id, plan_code: a.planCode }, context: { billing_cycle: a.cycle, privacy_scope: 'no_pii', revenue_verified: false }, state: 'observed', data_quality: 'OBSERVED', confidence: 1,
  }, { onConflict: 'dedupe_key', ignoreDuplicates: true }).then(() => {}, () => {});
  return { ok: true, already: false, organisation_id: org.id };
}
