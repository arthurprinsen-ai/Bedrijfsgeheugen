# Independent customer production acceptance, not false-green

Owner: existing [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Related [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547) and [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585).

## Why
A protected Netlify deploy, an authenticated synthetic API proof and green Required/CodeQL certify a software release. They do not certify two genuine customer journeys or economic results. A read-only production check on 2026-10-23 found 1 portal-state row, 0 connector definitions, 0 connector executions and 0 customer financial forecast rows in the corresponding Supabase tables. These counts are not a full census of enterprise outcomes, but prohibit claims that this specific verified chain has completed.

## One acceptance entrypoint, no second scheduler
`tools/delivery/customer-portal-production-acceptance.mjs` accepts one JSON evidence packet as a positional argument. The packet contains `payload` and an Ed25519 `signature` made by a separately controlled independent production verifier over recursively key-sorted JSON. Pass the expected protected main SHA in `EXPECTED_MAIN_SHA` and the verifier's public key in `PORTAL_ACCEPTANCE_VERIFIER_PUBLIC_KEY`. Do not put the signing private key in this repository, browser, portal environment or GitHub Actions. A provider-specific evidence collector, trusted by security review, must independently verify the underlying Netlify, Supabase, real-login, provider and business result receipts before issuing any signature.

The evaluator checks two distinct pseudonymous real tenant/principal identities, authenticated login, guest/demo/foreign-tenant denial, complete registered-page testing, relogin persistence, exact SHA Required/CodeQL/provider/API readbacks, sourceRevision→Brain/impact parity, actual action→measured independent business result→learning writeback, connector execution and validated forecast. It rejects replayed receipts, stale proof, PII/secret fields and unsigned or foreign-signed assertions.

**Crucial:** `SIGNED_EVIDENCE_CONTRACT_VALID` is an input admission result for **independent release review**, not `PRODUCTION_ACCEPTED`. The tool hardcodes `productionAccepted:false`. A third party must still verify the backing provider receipts, the separate signer trust boundary, user authorization, RLS/tenant isolation and full user-journey evidence before acceptance issue closure. No expected financial values are inferred or generated, and zero measured outcome is not a positive ROI claim.

## Runtime wiring and tests
The only workflow edit is adding regression assertions to the **existing** scheduled `Universal Closed-loop Learning` workflow. Its existing cron remains unchanged. The evaluator itself does not run a scheduler, collect credentials, bypass authentication, create tenants, issue approvals, write Brain state, or trigger deployments. Its tests use *ephemeral local test keys and simulated fixtures*, not real customer proof.

Run: `node --test tests/portal-independent-customer-production-acceptance-v1.test.mjs`.

## Required remaining proof
A separately authorized production validation must obtain two real customers' consent and independently check both journeys without leaking PII. The current missing connector/forecast evidence must be populated through their existing canonical business flows, not artificial inserts. Exact-head Required, CodeQL, protected merge, release readback and genuine measurable customer outcomes remain mandatory. Keep #4215/#4547/#4585 open pending that proof.
