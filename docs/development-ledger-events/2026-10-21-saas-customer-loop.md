# SaaS persistence and onboarding recovery

Obligation-ID: saas-customer-loop-20261021-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

Observed: public Starter/Pro/Groei checkout versus legacy-only webhook, missing intent writes, pre-auth-only plan read, workshop fire-and-forget persistence and dropped intake phone. Recovery extends existing authorities, never replaces customer state. Provider receipt validation and same-key retries preserve evidence. Local core tests pass; full release and customer acceptance remain independently required. Stripe production readiness is false; no purchase is recorded as paid revenue. Detailed architecture, tests and resume contract: docs/changes/2026-10-21-saas-customer-loop.md.
