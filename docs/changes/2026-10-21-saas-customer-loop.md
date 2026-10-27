# SaaS customer loop — 21 October 2026

Obligation-ID: saas-customer-loop-20261021-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Owner: existing Powerhouse website / portal / billing authorities
Idempotency-Key: saas-customer-loop-20261021-v1
Base-SHA: 21f30f4dfd0c594758cfcd7af93d0f842a9052da

## Intended customer outcome
A customer chooses a published plan and billing period, pays through Stripe, signs into a confirmed account and continues with their persisted scans and the correct organisation and entitlements. Completed scans show saved only after canonical scan/event acknowledgement. Existing customer data and tenant isolation take priority over automatic onboarding.

## Existing authorities and selected implementation
Extend the existing checkout, webhook, scan ingest and Portal V2. Rebuilding authentication/billing or introducing a second scan store would create conflicting truth. Config commercial-offers-v1.json owns published plans; the server database must match its prices before self-service checkout is allowed. Stripe owns payment/subscription truth. Supabase owns checkout intents, subscriptions, invitations, canonical scans and Brain projections. Netlify Identity owns the signed portal principal.

1. Save an idempotent checkout intent before opening Stripe. Propagate plan, billing cycle and intent identity to the subscription. Retry the same Stripe idempotency key after a failed response or database write.
2. Complete all active catalogue plans, not only legacy Control/Scale. Reuse the organisation on webhook replay, resume partial provisioning, write back the checkout receipt and a no-PII subscription_provisioned runtime event. This is NOT paid revenue evidence.
3. Verify completion server-side; success=1 alone never proves payment. Bind a confirmed account to its one paid invitation through a same-origin POST. Never trust user_metadata. Server-managed claims apply on next login/token refresh. Refuse ambiguous tenants or an established personal workspace requiring explicit reconciliation.
4. Read the portal plan after authentication with the same bearer headers; discard old-principal responses.
5. Use one acknowledged scan client with bounded same-key retries and a seven-day, ten-item session outbox. Pending payloads are temporary retry cache; server scans remain authoritative. Receipt history contains opaque scan IDs, not contact details. Apply to Bedrijfslek, workshop and V18 completed scans. Claim receipts only from the authenticated portal; preserve tenant boundaries and existing customer projection data.
6. Keep workshop phone in private intake. Do not leak contacts into aggregate learning. Generic scan claims append self-reported assessment context to the existing canonical Brain.

## Verification and limits
84 focused billing, scan, pricing, security, explanation, baseline and System Map checks pass locally. The complete 27-phase Netlify build passed with the immutable candidate source identity; 130 English routes have no partial translations. Four changed Netlify handlers also bundle successfully for Node 22. Local executable coverage includes all three self-service plans, duplicate and partial webhook replay, intent-before-provider ordering, same provider key on retry, failed storage, confirmed versus unconfirmed identity, conflicting tenancy, strict scan/event receipts and retry recovery. Existing scan, project, security and website build contracts must also pass.

Observed production before changes: release 21f30f4d, 31 stored scans / 31 events / 2 organisation IDs; zero checkout intents and subscriptions. Anonymous scans without an organisation are not proven lost. /api/checkout/readiness returns selfServeAvailable=false. No real purchase, new customer invitation, provider email or two-customer isolation acceptance is fabricated.

Open acceptance: exact HEAD Required + CodeQL, protected merge, native Supabase Integration for the changed Edge function, Netlify deployed function inventory and exact source readback; two independently authorised confirmed customer sessions through payment, activation, claim, edit, reload and cross-tenant denial. Existing personal-workspace reconciliation and already-established paid-customer purchases must be verified before claiming universal coverage. Consultative/service temporary entitlements remain subject to their existing order authority; this patch does not invent service purchases.

No destructive historical relinking. No live charge was initiated. Online billing requires the existing Stripe account's production key and verified webhook secret to be configured through secure provider settings.

## Official sources
- https://docs.stripe.com/payments/checkout/build-subscriptions
- https://docs.stripe.com/billing/subscriptions/webhooks
- https://docs.stripe.com/customer-management
- https://docs.netlify.com/manage/security/secure-access-to-sites/identity/use-identity-in-functions/
- https://docs.netlify.com/build/functions/trigger-on-events/
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Resume checkpoint
POWERHOUSE-ASYNC-CHECKPOINT-v1. Continue the same obligation and candidate. Never duplicate a real provider session, organisation or scan to obtain a green check. Production authority remains protected-main Netlify and the native Supabase Integration. Resume from exact candidate evidence, not this document's historical base SHA. Hard boundary: Stripe live billing configuration; unresolved release gates remain execution work.

Admission recovery: the initial learning record lacked executable historical/shadow/canary test references. The canonical learning gate now executes the same real regressions through tests/brain-saas-customer-loop-v1.test.mjs. The additional pricing parity regression now checks the current commercial catalogue and rejects actual database price drift instead of asserting retired Control/Scale marketing copy.

Dependency-free admission: the paid-account ownership policy is shared in platform/saas/account-activation.mjs; the Netlify function only injects verified Identity/admin adapters. The same security tests now run before npm installation. Local browser verification could not run because this executor lacks Chromium and its browser download was unavailable; no browser result is claimed.

Independent review: fixed subscription-update metadata erasure that could hide the checkout receipt, and made provider-verified expired checkouts start a fresh attempt while ambiguous failures retain their idempotency key. Review follow-up found no remaining blocker in those fixes. Full module-graph cache versions are generated by the existing build; version-only source diffs were removed to stay within the unchanged 40-file delivery guard. The build versions the entry and the complete module graph together. The wider portal regression suite exposed two source-contract failures caused only by checked-in generated shell stamps; restoring the unchanged shell source preserves both asset portability and CSS load-order checks.
