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


## Static NL/EN cache completeness
- Netlify production builds stay offline for translation: `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`.
- Validate the immutable English cache against the exact **post-composition** public HTML surface, not only raw source pages.
- A `STATIC_I18N_CACHE_INCOMPLETE` failure is a source/cache parity defect; do not weaken fail-closed behavior and do not add a production translation-provider dependency.
- Repair missing entries in an authorized CI lane, persist the cache, prove `build-localized-routes.mjs --validate-cache` offline, then promote.
- Fingerprint: `static-i18n-cache-complete-20260925-v1`.
