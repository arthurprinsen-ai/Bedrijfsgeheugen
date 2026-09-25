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


## NL/EN runtime asset completeness

Fingerprint: `netlify|public-i18n|asset-completeness|v1`.

Netlify production readback for public NL/EN must distinguish build-source intent from final deployed HTML.

Required:
- verify `assets/i18n.css` and `assets/js/i18n.js` independently in the final deployed page;
- a single shared marker such as `data-bg-i18n-asset` cannot prove both assets exist;
- if CSS is present but the runtime script is missing, classify this as build-transform incompleteness, not a navigation-host defect and not a Netlify authentication defect;
- after runtime presence is proven, verify the active mobile host and visible language selector;
- terminal proof is exact Netlify `commit_ref === main` plus successful pricing/browser NL → EN → NL roundtrip.

Canonical learning: `brain/learning/i18n-v18-mobile-host-production-20260925-v1.json`.

## Current-pointer truth versus hidden DOM diagnostics

Fingerprint: netlify|terminal-truth|current-pointer-browser-visibility|v1.

Netlify terminal production truth is sampled from the current production pointer, never from the deploy that happened to be current at the start of a recovery.

Required closure tuple:
1. protected GitHub main SHA;
2. Netlify current deploy is ready in production;
3. Netlify current commit_ref equals that exact current-main SHA;
4. canonical current-SHA Production Release Readback + Production Source Snapshot are green;
5. user-visible interaction proof is green for interaction-class changes.

For NL/EN incidents, the literal string Switching language failed. Try again. may exist as hidden fallback copy in the deployed DOM. Do not classify a mere source/DOM string hit as an active production failure. The failure oracle is that the canonical browser verifier exposes the message in visible body text during real locale switching. Keep the verifier fail-closed: if the message becomes visible, English content remains Dutch, the route fails, or roundtrip navigation fails, production is not proven.

Canonical learning: brain/learning/2026-09-25-live-bewezen-exact-main-atomic-proof-v1.json.
