---
name: powerhouse-netlify-production-truth
description: Use for every Bedrijfsgeheugen/Powerhouse Netlify production delivery, recovery, readback, credential incident, exact-SHA verification and terminal live claim.
---

# Powerhouse Netlify Production Truth

Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`.

## Mandatory production truth model
Powerhouse separates source/merge truth, provider deployment identity, functional production proof, and learning/skill/ledger closure.

## Netlify authentication incidents
- Classify Netlify `401 Unauthorized` as authentication/credential failure before changing product code.
- Temporary MCP proxy paths are expiring transport credentials, not durable deploy authority.
- Preserve provider errors as evidence and return recovery to the canonical protected-main lineage.

## Immutable provider evidence
When Netlify reports `state=ready`, `context=production`, and an observed `commit_ref`, persist that provider identity as immutable checkpoint evidence.

A later cancelled or superseded verifier does not erase already observed provider evidence.

## Functional proof remains separate
A cancelled, skipped or superseded browser/readback job never becomes functional proof. Resume only the missing functional gate on the newest canonical lineage.

If production advances, keep earlier exact-SHA evidence as historical containment proof and verify the new current production state separately.

## Terminal closure
Only claim `LIVE_BEWEZEN` when all applicable gates are green: protected merge, exact provider identity, required functional readback, and canonical learning/writeback.

Canonical learning: `brain/learning/netlify-auth-recovery-exact-sha-provider-proof-20260925-v1.json`.

## Deploy-preview 403 isolation

Fingerprint: `netlify-preview-403-broad-browser-local-authority-20260925-v1`.

Netlify deploy-preview is authority only for targeted routes that the preview-readiness gate has positively proven reachable.

Full-site visibility sweeps, broad header/menu checks and broad high-risk browser contracts must run against the exact locally built candidate for the same candidate SHA. A provider-side preview `403` on an unrelated route is never a UI/layout regression.

Required pattern:
- targeted affected-route proof may use the route-ready Netlify preview;
- broad/full-site browser proof always uses the exact local candidate;
- provider access failures remain provider evidence and cannot be converted into page-regression evidence;
- regression test: `tests/delivery-website-browser-runtime-single-install.test.mjs`.
