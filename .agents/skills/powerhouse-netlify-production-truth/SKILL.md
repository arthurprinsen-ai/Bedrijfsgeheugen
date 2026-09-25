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

## Executable build-transformer gate

Fingerprint: `delivery-terminal-release-marker-mobile-i18n-v1` revision 2.

When a recovery changes a build-time JavaScript transformer:
- source-token/regex tests are not sufficient;
- run `node --check` on the transformer;
- execute it against a minimal representative fixture;
- assert the intended DOM/string mutation and idempotence;
- if OIDC succeeds but both linked and exact-source Netlify deploys fail during `building site`, classify the incident as a build-content failure before changing deploy credentials or transport.


## Runtime asset completeness after provider-ready

Fingerprint: `i18n-runtime-asset-independent-presence-v1`.

A Netlify deploy with `state=ready` and exact `commit_ref` proves provider identity, not frontend capability completeness. For NL/EN production truth:
- inspect CSS and JavaScript runtime assets independently;
- do not accept a shared marker as completeness evidence;
- prove the active mobile navigation contains a visible language selector;
- execute NL → EN → NL in a real production browser;
- any missing runtime asset or missing visible control keeps the release non-terminal even when deploy identity is exact.


## Partial static i18n cache authority

Fingerprint: `i18n-partial-cache-production-fallback-20260925-v1`.

For provider-independent production builds:
- never treat the English translation cache as all-or-nothing;
- apply every known versioned cache entry even when unrelated source strings are uncached;
- leave only uncached strings to the runtime translation fallback;
- keep partial routes marked as not fully statically translated so runtime completion remains active;
- a missing translation on one route must never regress already-cached English on another route;
- production NL/EN proof must include a semantic assertion that `/en/prijzen` does not render the Dutch pricing H1.

Canonical learning: `brain/learning/i18n-partial-cache-production-fallback-20260925-v1.json`.
