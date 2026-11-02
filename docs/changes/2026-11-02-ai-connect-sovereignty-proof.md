# AI Connect & Data Sovereignty — consent and evidence repair (2026-11-02)

**Obligation:** `portal-ai-connect-sovereignty-proof-20261102-v1`  
**Fingerprint:** `portal|connectors|sample-dry-run-mistaken-for-live-verification|20261102-v1`  
**Owner:** existing Portal V2 + original connector engine + original ONE BRAIN/Powerhouse/Security/Heartbeat; no second executor or data authority.

## Observed at source
- `createEnvironmentConnectorProviders()` currently reads synthetic upload/email samples, can extract `extractedFields` and uses a local `datahub.safeTest` returning `ok:true` without an external target request. An honest safe-test can pass without a real third-party connection.
- Portal previously derived activation eligibility from a passed example test with execution ID alone.
- Connected Supabase primary region readback: `eu-central-1` (Frankfurt). This establishes a primary region, **not** that logs, Edge Functions, document extraction, AI inferences, external providers, backups or personnel never process data elsewhere.
- On 2026-11-02 connector definitions/executions/reviews returned zero rows. No real customer integration proof was found in those tables.

## Repair in this candidate
1. Existing engine continues to demonstrate a correct **sample-only** field-mapping safe-test without writing data. It marks `proofLevel:'SAMPLE_ONLY'` unless the server-side source AND target both supply `verification:'PROVIDER_VERIFIED'` and extraction is not a supplied sample.
2. Activation eligibility now requires `proofLevel:'PROVIDER_VERIFIED'` in the same persisted, version-matched test; otherwise `EXTERNAL_PROVIDER_PROOF_REQUIRED`. A green example never implies a working Outlook/AFAS/Exact provider.
3. Existing wizard gets three explicit, reversible user choices per connector: `CONNECTION_ONLY` (default), `PORTAL_INSIGHTS`, `PORTAL_AI`. The data-use contract is stored on the current connector definition, not localStorage, and unknown training or model-routing options are rejected. `trainingUse:'PROHIBITED'`, `modelRoute:'TENANT_POLICY'`.
4. A connection whose target is Datahub cannot be activated with `CONNECTION_ONLY`; the API returns `PORTAL_DATA_USE_NOT_AUTHORIZED`. Changing choice invalidates local test evidence, requiring a new test. This does not itself provision a model.
5. Existing authenticated `/api/data-sovereignty` provides the requested tenant policy display. Link to the existing compliance pane, where infrastructure and model preferences are recorded as **requested** until provider evidence proves execution and processing location.
6. No extra data transfer, credential grant, OAuth consent, storage engine, model endpoint, automation, browser secret or public trust endpoint is introduced.

## UX acceptance, not an invented award
The next design cycle must demonstrate real 5-minute nontechnical onboarding, keyboard/screen-reader and mobile tests at 320/390/768px, WCAG 2.2 AA, proof cards that distinguish DEMO/READY/LIVE, a readable source→processing→storage→model→destination journey, revocation/deletion controls, and independent user interviews. No award claim until an actual award is granted.

## Real integration acceptance beyond this candidate
A reference **test company** may use a privacy-safe synthetic invoice in an authorized Outlook→Datahub/Exact/AFAS tenant. To say `LIVE_VERIFIED`, the original connector owner must independently prove:
- real provider OAuth approval, exact delegated scopes, credential expiry/rotation and tenant identity;
- a source read of a real synthetic test record with provider request ID;
- destination provider's idempotent sandbox write/readback (or verified supported dry-run with a clear limitation);
- the same connector version, per-stage execution IDs, logs with no PII/secrets, replay/dedupe, rollback and expiry;
- asserted data-sovereignty policy evaluated against actual provider, region, subprocessor and model-route receipts;
- explicit opt-in, purpose limitation, revocation and retention/deletion semantics reflected in the portal;
- protected exact HEAD Required/CodeQL/full BRAIN, protected merge, Netlify published SHA and authenticated two-tenant readback.

"Everything with everything" is a connector framework aspiration, not a provider capability guarantee. Unsupported/undocumented APIs, missing credentials, paid scopes, legal constraints and unsatisfied EU-only requirements must remain `NOT_CONFIGURED`/`BLOCKED` and offer a safe alternative (read-only export/import where lawful).

## Incident and prevention
Root cause: a local sample read and a local safe-test target were recorded as successful steps; activation logic required success and an execution ID but not independently checked *who* was actually consulted. The dashboard must never promote workflow correctness to provider reality.

Prevention: server-generated `proofLevel` from source/target adapter evidence; missing external provenance is nonactivatable. Server data-use policy is default deny. Regression: `tests/connector-ai-sovereignty-consent-20261102.test.mjs`, `tests/connector-reference-flow.test.mjs`, `tests/connector-engine.test.mjs` and existing tenant/readiness tests.

This document records **source changes only**. No claim of live activation, protected merge, verified processing route, universal software support or award readiness until independently read back.
