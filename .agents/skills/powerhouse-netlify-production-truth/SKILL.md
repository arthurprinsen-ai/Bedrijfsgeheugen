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


## Short-lived Netlify fallback proxy refresh

Fingerprint: `netlify-fallback-proxy-refresh-20260925-v1`.

When Production Source Snapshot reaches the exact-source `@netlify/mcp` fallback:
- never assume the proxy acquired before linked-build/provider polling is still valid;
- reacquire GitHub OIDC and a fresh bridge proxy immediately before the fallback upload;
- bind the fresh proxy to the upload and subsequent provider watch;
- classify a fallback `401 Unauthorized` as transport credential expiry before treating it as a site/build defect;
- persistent authentication failure remains fail-closed;
- terminal success still requires protected-main/provider identity and canonical browser readback.

## Production build parity includes environment

Fingerprint: `netlify-production-build-parity-20260925-v1` revision 2.

"Same build" means the same production-critical command chain **and** the same fail-closed environment semantics. In particular:
- `STATIC_I18N_NETWORK=0`;
- `STATIC_I18N_REQUIRE_CACHE=1`;
- production-equivalent Node version;
- the exact pricing/i18n/localized-route/sitemap/release-evidence chain.

A parity job that disables a production guard is not parity and may not authorize merge. If Netlify fails after a supposedly green parity run, compare environment flags before changing content or credentials.


## Pre-merge build-parity ownership

Fingerprint: `netlify-premerge-build-parity-test-ownership-v1`.

Production build failures that are reproducible from repository state must be prevented before merge.

Required:
- every committed regression test introduced by a website/recovery lineage is wired into at least one canonical CI workflow;
- Required test validates the fail-closed static English cache with `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1` before a material full-suite candidate may pass;
- a missing i18n cache entry is a content/build defect and must be repaired in the same candidate lineage before merge;
- do not use a production deploy as the first place where deterministic build parity is evaluated;
- transport/auth recovery and content/build recovery remain separate classifications.


## Static i18n cache completeness is part of production truth

Fingerprint: `netlify-static-i18n-cache-terminal-20260930-v1`.

When `STATIC_I18N_REQUIRE_CACHE=1`, every translatable string selected by the canonical localized-route builder must exist in the merged static English cache before production promotion.

Required recovery pattern:
- reproduce the exact current-main production command chain locally or in CI;
- derive missing strings from the same public-route selection and translation semantics as `tools/site-shell/build-localized-routes.mjs`;
- add only the missing cache entries; never disable `STATIC_I18N_REQUIRE_CACHE` or enable network translation in production to bypass the gate;
- include new strings introduced indirectly by shared shell/build transforms and SVG/text content that the compiler actually traverses;
- run the production-equivalent cache validation before allowing another Netlify promotion;
- keep deployment transport/auth recovery separate from build-content recovery.

A production build failure caused by an incomplete static i18n cache is a build-content defect, not a Netlify credential defect. Repeated deploy retries without completing the cache are prohibited.

## Explicit public locale navigation

Fingerprint: `website|i18n|explicit-public-locale-navigation|v2`.

When the public language control is activated: persist the target locale, prevent implicit/default link navigation, resolve the canonical localized href, close menus, then explicitly navigate with `location.assign(href)`. Mobile navigation may mutate its host during the click, so default anchor behavior is not sufficient production proof.

Regression: `tests/brain-i18n-persistent-navigation-v1.test.mjs`.
Production canary: `tools/site-shell/verify-pricing-i18n-production.mjs`.
Terminal proof: exact-main Netlify production plus successful NL → EN → NL browser roundtrip.


## Independent public-browser fallback readback

Fingerprint: `production-readback|independent-browser-fallback|zenrows-v1`.

Native browser/tool access to `bedrijfsgeheugen.nl` is not itself a production health oracle. If the default public browser cannot open the domain, Powerhouse must continue the same terminal readback through an independent external browser/fetch provider instead of stopping or reporting only Netlify provider readiness.

Canonical fallback order:
1. default public browser/readback;
2. independent ZenRows browser or JS-rendered scrape against the public custom domain;
3. exact Netlify production/deploy URL readback as provider-correlated fallback;
4. provider state only is insufficient for functional closure.

For SEO/indexation checks, independent public readback must inspect the actually served response and, where JavaScript can mutate state, both:
- raw server HTML; and
- JS-rendered browser state.

Required SEO proof for bilingual money/support pages includes:
- reachable public URL;
- correct `html[lang]`;
- self-canonical;
- reciprocal `hreflang=nl`, `en`, `x-default`;
- intended title after JavaScript execution;
- intended description and keyword/intent-owner markers;
- sitemap membership for both locale canonicals and reciprocal sitemap hreflang.

A JS-rendered title that differs from raw HTML is a runtime SEO defect, not a successful readback. Legacy SPA title mutators such as `#bg-tabtitel` may not overwrite static localized canonical titles.

When a native browser is blocked but ZenRows succeeds, the ZenRows result is valid independent public-browser evidence and must be used instead of claiming that public readback is unavailable.
