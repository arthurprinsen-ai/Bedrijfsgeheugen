# SaaS checkout: fail fast if Stripe production is not configured

Obligation-ID: saas|checkout|config-failfast-before-provider|20261023-v1
Parent-Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Base-SHA: 7d5107725af8686202e33535dba8d1f5e8e1f453

Observed in production on 2026-10-23: no registered STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in Netlify configuration. Canonical Supabase has 0 subscription rows and 0 checkout intent rows. Technical SaaS-account gateway was released by PR #4812, but real payment and two-customer acceptance remain unproven.

Root cause: checkout-create.mjs queried the plan store before verifying payment configuration; this could mask the actual Stripe configuration failure with storage_unavailable. Safe fix: move the existing billingReadiness check before all store/provider access after cheap public input validation. Response remains the existing 503 billing_not_configured, recognized by the published checkout UX.

Verification: tests/brain-saas-checkout-unconfigured-failfast-v1.test.mjs exercises all combinations of missing secrets and zero store/provider calls, invalid input, and correctly configured store failure. Preserve other Stripe idempotency/webhook/plan parity tests. No live payment, credentials, new scheduler, database writes, or deployment claimed from this code change. Exact-head Required, CodeQL, protected merge and independent production readback must prove release.
