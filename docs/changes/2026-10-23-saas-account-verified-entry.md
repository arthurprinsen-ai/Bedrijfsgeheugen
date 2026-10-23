# Verified SaaS account entry — 23 October 2026

**Scope:** Narrow extension of the current Bedrijfsgeheugen self-service subscription onboarding; no replacement billing system, no new authentication provider, no new Supabase schema, no second learning scheduler.

## Customer flow
The canonical public price page leads to existing `/afsluiten`. Stripe Checkout and the verified readiness endpoint remain the payment authority. Only after a verified checkout result does the continuation link point to `https://www.bedrijfsgeheugen.nl/pages/mijn-account.html?activate=subscription`. The customer signs in or creates an account using the purchasing email; existing `/api/checkout/activate` binds a confirmed Identity principal to a uniquely reconciled paid organisation. The account page calls `/api/saas/my-account` with a real Identity bearer token, then displays paid plan status and only offers the portal link on a server-verified active or trialing subscription.

## Security and bounds
Both `/api/saas/my-account` and `/api/portal-entitlements` are now dispatched by the *existing* `netlify/functions/portal-entitlements.mjs`; no duplicate Netlify function filename is registered. They reuse the same fail-closed `createCustomerAccountHandler`. The original portal route retains its authenticated `organisation_id` field for existing clients; the post-checkout account route omits it. The server uses the existing `createPortalProjectStore` and canonical `saas_active_entitlements` view. Its read-only response excludes email, tenant UUID and Stripe secrets. Anonymous, unconfirmed, unresolved, mismatched, inactive and unknown-plan accounts fail closed. `past_due` is not treated as active. No request-provided tenant, subscription, plan or `success=1` is a permission grant. The existing page-level feature locks are **not** an API security boundary; their full server-side authorization audit remains an open parent issue.

Public workshop scans remain possible without a subscription. The authenticated `/api/portal-scans` claim/history route and canonical scan ingest remain their own authority; no automatic anonymous-to-paid scan data copying was introduced. Onboarding cannot claim a conversion, real billing or live production result from code alone.

## Root-cause and regression
The original static root page path did not match the existing delivery classifier. A later candidate passed cheap hygiene but was rejected by integration closure for absent ledger/learning/change artifacts. Reuse `pages/` and the canonical three-part writeback in this PR. Regression: `tests/brain-saas-customer-account-gateway-v1.test.mjs`; canonical customer-loop and production acceptance regressions also apply.

## Acceptance criteria
- Required, CodeQL and Netlify preview succeed on the exact latest candidate head
- Netlify preview page, Identity callbacks and authenticated account route work in browser/mobile
- Stripe verified invoice/subscription state matches server entitlements and intended tenant
- Two separate real customers' documents, scans and actions cannot be cross-read or changed
- Protected merge and production Netlify function inventory/source/readback independently prove release SHA
- Unresolved billing configuration, missing consent, preview failure or provider outages stay blocked; no fake-green

Owner: canonical Powerhouse/Portal delivery, PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4812, issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215. Status: **CANDIDATE_UNVERIFIED**, not production accepted.
