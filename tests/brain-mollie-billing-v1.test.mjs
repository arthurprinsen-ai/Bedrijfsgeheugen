import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  priceCents, eurValue, intervalFor, addInterval, buildFirstPayment, buildSubscription, isPaidFirstPayment,
  subscriptionStatusFromMollie, statusAfterRecurringPayment, intentStateForPayment, isMolliePaymentId, normalizeCycle, safeUuid,
} from "../supabase/functions/_shared/mollie-billing.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const INTENT = "3f1c2a4e-9b7d-4c1a-8e2f-0a1b2c3d4e5f";

test("yearly is ten monthly fees, monthly is the catalogue price", () => {
  assert.equal(priceCents(9900, "monthly"), 9900);
  assert.equal(priceCents(9900, "yearly"), 99000);
  assert.equal(priceCents(29900, "yearly"), 299000);
  assert.equal(priceCents(74900, "yearly"), 749000);
  assert.equal(normalizeCycle("YEARLY"), "yearly");
  assert.equal(normalizeCycle("weird"), "monthly");
  assert.throws(() => priceCents(0, "monthly"));
});

test("Mollie amounts are strings with two decimals", () => {
  assert.equal(eurValue(9900), "99.00");
  assert.equal(eurValue(299000), "2990.00");
  assert.throws(() => eurValue(99.5));
});

test("intervals and start dates cover monthly and yearly incl. month ends and leap years", () => {
  assert.equal(intervalFor("monthly"), "1 month");
  assert.equal(intervalFor("yearly"), "12 months");
  assert.equal(addInterval("2026-10-27", "monthly"), "2026-11-27");
  assert.equal(addInterval("2026-10-27", "yearly"), "2027-10-27");
  assert.equal(addInterval("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(addInterval("2028-02-29", "yearly"), "2029-02-28");
  assert.equal(addInterval("2026-12-31", "monthly"), "2027-01-31");
});

test("first payment creates the mandate: sequenceType first, Dutch locale, intent in redirect and metadata", () => {
  const p = buildFirstPayment({ planName: "Pro", planCode: "pro", cycle: "yearly", monthlyPriceCents: 29900, customerId: "cst_abc", intentId: INTENT, company: "Acme BV", origin: "https://www.bedrijfsgeheugen.nl", webhookUrl: "https://x.supabase.co/functions/v1/bg-mollie-webhook" });
  assert.equal(p.sequenceType, "first");
  assert.equal(p.amount.value, "2990.00");
  assert.equal(p.amount.currency, "EUR");
  assert.equal(p.locale, "nl_NL");
  assert.match(p.redirectUrl, new RegExp(`session_id=${INTENT}&plan=pro&billing=yearly$`));
  assert.equal(p.metadata.checkout_intent_id, INTENT);
  assert.equal(p.metadata.billing_cycle, "yearly");
});

test("subscription bills the same amount at the chosen interval, starting one interval after the first payment", () => {
  const s = buildSubscription({ planName: "Starter", planCode: "starter", cycle: "monthly", monthlyPriceCents: 9900, firstPaidOn: "2026-10-27", webhookUrl: "https://x/w", organisationId: "org", intentId: INTENT });
  assert.equal(s.interval, "1 month");
  assert.equal(s.startDate, "2026-11-27");
  assert.equal(s.amount.value, "99.00");
  const y = buildSubscription({ planName: "Groei", planCode: "groei", cycle: "yearly", monthlyPriceCents: 74900, firstPaidOn: "2026-10-27", webhookUrl: "https://x/w", organisationId: "org", intentId: INTENT });
  assert.equal(y.interval, "12 months");
  assert.equal(y.startDate, "2027-10-27");
  assert.equal(y.amount.value, "7490.00");
});

test("only a paid first payment with a customer provisions access", () => {
  assert.equal(isPaidFirstPayment({ status: "paid", sequenceType: "first", customerId: "cst_1" }), true);
  assert.equal(isPaidFirstPayment({ status: "open", sequenceType: "first", customerId: "cst_1" }), false);
  assert.equal(isPaidFirstPayment({ status: "paid", sequenceType: "recurring", customerId: "cst_1" }), false);
  assert.equal(isPaidFirstPayment({ status: "paid", sequenceType: "first" }), false);
  assert.equal(isPaidFirstPayment(null), false);
});

test("status mapping fails closed", () => {
  assert.equal(subscriptionStatusFromMollie("active"), "active");
  assert.equal(subscriptionStatusFromMollie("suspended"), "past_due");
  assert.equal(subscriptionStatusFromMollie("canceled"), "canceled");
  assert.equal(subscriptionStatusFromMollie("completed"), "canceled");
  assert.equal(subscriptionStatusFromMollie("unknown"), "incomplete");
  assert.equal(statusAfterRecurringPayment({ status: "paid" }, "active"), "active");
  assert.equal(statusAfterRecurringPayment({ status: "failed" }, "active"), "past_due");
  assert.equal(statusAfterRecurringPayment({ status: "open" }, "active"), null);
  assert.equal(intentStateForPayment("paid"), "completed");
  assert.equal(intentStateForPayment("expired"), "expired");
  assert.equal(intentStateForPayment("failed"), "failed");
  assert.equal(intentStateForPayment("open"), "checkout_open");
});

test("identifiers are validated before use", () => {
  assert.equal(isMolliePaymentId("tr_WDqYK6vllg"), true);
  assert.equal(isMolliePaymentId("sub_x"), false);
  assert.equal(isMolliePaymentId("tr_../etc"), false);
  assert.equal(safeUuid(INTENT), INTENT);
  assert.equal(safeUuid("nope"), "");
});

test("Mollie key only comes from Vault and is never logged or returned", () => {
  for (const f of ["supabase/functions/_shared/mollie-server.ts", "supabase/functions/bg-mollie-checkout/index.ts", "supabase/functions/bg-mollie-webhook/index.ts"]) {
    const src = read(f);
    assert.doesNotMatch(src, /console\./, `${f} must not log`);
    assert.doesNotMatch(src, /Deno\.env\.get\('MOLLIE/, `${f} must not read the key from env`);
    assert.doesNotMatch(src, /test_[A-Za-z0-9]{10,}|live_[A-Za-z0-9]{10,}/, `${f} must not contain a key`);
  }
  assert.match(read("supabase/functions/_shared/mollie-server.ts"), /bg_geheim', \{ p_naam: 'MOLLIE_API_KEY' \}/);
});

test("webhook trusts only Mollie's own record of the payment", () => {
  const src = read("supabase/functions/bg-mollie-webhook/index.ts");
  assert.match(src, /isMolliePaymentId\(id\)/);
  assert.match(src, /mollie\(key, `payments\//);
  assert.doesNotMatch(src, /payment\s*=\s*await req\.json/);
});

test("provisioning is idempotent and uses idempotency keys at Mollie", () => {
  const src = read("supabase/functions/_shared/mollie-server.ts");
  assert.match(src, /first_payment_id/);
  assert.match(src, /idempotency: `bg-sub-\$\{payment\.id\}`/);
  const co = read("supabase/functions/bg-mollie-checkout/index.ts");
  assert.match(co, /idempotency: `bg-customer-\$\{intentId\}`/);
  assert.match(co, /idempotency: `bg-payment-\$\{intentId\}`/);
});

test("function config: checkout needs a JWT, webhook is public by design", () => {
  const cfg = read("supabase/config.toml");
  assert.match(cfg, /\[functions\.bg-mollie-checkout\][^\[]*verify_jwt = true/);
  assert.match(cfg, /\[functions\.bg-mollie-webhook\][^\[]*verify_jwt = false/);
});
