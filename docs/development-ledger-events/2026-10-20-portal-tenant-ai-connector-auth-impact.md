# Append-only implementation ledger — tenant AI/connector portal bridge

- Date: 2026-10-20
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Candidate PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4566
- Obligation-ID: portal-tenant-model-connector-auth-causal-bridge-20261020
- Lane: portal
- Status: proposed change on protected candidate branch; **not deployed**

## Root cause and code delivered
In the existing Portal V2, model inference/readiness GET and connector wizard could not reliably identify a tenant because requests omitted the token the state client uses. The Netlify connector endpoint called the identity helper with no Request. Customer model preferences and activation requests had no registered first-class source page in the causal impact engine.

Reused the existing signed identity and canonical connector/AI endpoints; `/api/connectors` receives the incoming Request; preference and activation request mutations now mark the linked AI/finance/compliance/decision pages for review. No new scheduler, Brain or provider activation. No proof of real provider execution is created.

## Verification
Added Node regression suites: signed tenant headers on connector create/activate, unsigned refusal before network transmission, AI signed-header reuse, Netlify request identity wiring, model selection and activation-request impacts, canonical Brain impact writeback. GitHub Required/CodeQL, Netlify preview, and authenticated two-customer HTTP and provider readback remain independent gates.

## Production truth
Prior read-only production check showed 110 supplier catalog entries (83 VERIFIED, 26 PARTIAL, 1 CONFLICT); 0 tenant connector definitions/executions, 0 verified portal financial forecasts, and degraded daily run. These are point-in-time observations, not customer acceptance. Do not mark green until provider-backed evidence and tenant isolation are confirmed.
