// Pure Mollie billing helpers (no I/O). Shared by bg-mollie-checkout and bg-mollie-webhook, unit-tested in Node.
// Monthly and yearly recurring billing: a first payment (sequenceType=first) creates the mandate, then a Mollie
// subscription (1 month or 12 months) bills automatically. Yearly = ten monthly fees (two months free).

export const BILLING_CYCLES = Object.freeze(['monthly', 'yearly']);

export function normalizeCycle(value) {
  return String(value || '').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
}

export function priceCents(monthlyPriceCents, cycle) {
  const monthly = Number(monthlyPriceCents);
  if (!Number.isInteger(monthly) || monthly <= 0) throw new Error('INVALID_PRICE');
  return normalizeCycle(cycle) === 'yearly' ? monthly * 10 : monthly;
}

export function eurValue(cents) {
  const n = Number(cents);
  if (!Number.isInteger(n) || n <= 0) throw new Error('INVALID_AMOUNT');
  return (n / 100).toFixed(2);
}

export function intervalFor(cycle) {
  return normalizeCycle(cycle) === 'yearly' ? '12 months' : '1 month';
}

export function addInterval(isoDate, cycle) {
  const d = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error('INVALID_DATE');
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + (normalizeCycle(cycle) === 'yearly' ? 12 : 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function buildFirstPayment({ planName, planCode, cycle, monthlyPriceCents, customerId, intentId, company, origin, webhookUrl }) {
  const c = normalizeCycle(cycle);
  return {
    amount: { currency: 'EUR', value: eurValue(priceCents(monthlyPriceCents, c)) },
    customerId,
    sequenceType: 'first',
    description: `Bedrijfsgeheugen ${planName} (${c === 'yearly' ? 'jaarlijks' : 'maandelijks'})`,
    redirectUrl: `${origin}/afsluiten?success=1&session_id=${encodeURIComponent(intentId)}&plan=${encodeURIComponent(planCode)}&billing=${c}`,
    cancelUrl: `${origin}/afsluiten?cancelled=1&plan=${encodeURIComponent(planCode)}&billing=${c}`,
    webhookUrl,
    locale: 'nl_NL',
    metadata: { plan_code: planCode, billing_cycle: c, company_name: company, checkout_intent_id: intentId },
  };
}

export function buildSubscription({ planName, planCode, cycle, monthlyPriceCents, firstPaidOn, webhookUrl, organisationId, intentId }) {
  const c = normalizeCycle(cycle);
  return {
    amount: { currency: 'EUR', value: eurValue(priceCents(monthlyPriceCents, c)) },
    interval: intervalFor(c),
    startDate: addInterval(firstPaidOn, c),
    description: `Bedrijfsgeheugen ${planName} (${c === 'yearly' ? 'jaarlijks' : 'maandelijks'})`,
    webhookUrl,
    metadata: { plan_code: planCode, billing_cycle: c, organisation_id: organisationId, checkout_intent_id: intentId },
  };
}

export function isPaidFirstPayment(payment) {
  return Boolean(payment) && payment.status === 'paid' && payment.sequenceType === 'first' && Boolean(payment.customerId);
}

export function subscriptionStatusFromMollie(status) {
  switch (String(status || '')) {
    case 'active': return 'active';
    case 'pending': return 'incomplete';
    case 'suspended': return 'past_due';
    case 'canceled':
    case 'completed': return 'canceled';
    default: return 'incomplete';
  }
}

export function statusAfterRecurringPayment(payment, subscriptionStatus) {
  if (!payment) return null;
  if (payment.status === 'paid') return subscriptionStatusFromMollie(subscriptionStatus || 'active');
  if (['failed', 'expired', 'canceled'].includes(payment.status)) return 'past_due';
  return null;
}

export function intentStateForPayment(status) {
  switch (String(status || '')) {
    case 'paid': return 'completed';
    case 'expired':
    case 'canceled': return 'expired';
    case 'failed': return 'failed';
    default: return 'checkout_open';
  }
}

export function safeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) ? String(value) : '';
}

export function isMolliePaymentId(value) {
  return /^tr_[A-Za-z0-9]{4,40}$/.test(String(value || ''));
}

export const TRIAL_DAYS = 30;

export function trialEndsAt(now = new Date()) {
  const d = new Date(now instanceof Date ? now.getTime() : Date.parse(now));
  if (Number.isNaN(d.getTime())) throw new Error('INVALID_DATE');
  return new Date(d.getTime() + TRIAL_DAYS * 86400000).toISOString();
}

export function trialDaysLeft(endIso, now = new Date()) {
  const ms = Date.parse(endIso) - (now instanceof Date ? now.getTime() : Date.parse(now));
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86400000)) : 0;
}
