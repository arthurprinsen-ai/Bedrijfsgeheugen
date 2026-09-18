# PR #1974 — Portal BusinessInput browser-boundary learning

Status: **LIVE & BEWEZEN / canonically learned**

## Scope

This learning closes the delivery and recovery lineage for PR #1974, **Consolidate portal BusinessInput bindings on current main**.

Source delivery:
- final candidate head: `ec6b2a47f022cb632e56b0a1e9554889e41ecf79`
- protected merge/main revision: `6b15ba6c1aa865c4a40e99ce6ae0f54ded1f0701`
- initial documentation base: `cbaf6c123c697cacc769fa76ba2303af5e58fd51`
- reconciled documentation base before final CI: `82c0242b96855513f05142bf5b93e2a16b0b8bd4`
- moving-main reconcile base: `8034e98c109cd3e8b8f5bc3b9871fa78e27d7c5c`
- final documentation reconcile base: `b1931378f66dbbaa3d365d7d34b0fe1e7db1b7fc`
- canonical Supabase learning: `learning:pr-1974-portal-business-input-boundary-v1`

## What happened

The Portal V2 BusinessInput domain/writeback implementation passed unit and contract checks, but the browser failed before hydration. The first concrete runtime cause was not BusinessInput semantics itself: Portal V2 imported `../portal-next/portal-business-input-store.js`, while Netlify intentionally retires `/portal-next/*` through a redirect to `/portal-v2/`. The browser ES-module loader therefore received redirect/HTML content instead of JavaScript and boot stopped before global Portal V2 actions mounted.

Two additional red CI signals were stale verification oracles rather than product failures:
1. Business OS Live Preview still downloaded and executed the retired `/portal-next/portal-next.js` surface even though that route was intentionally redirected.
2. Portal V2 Production DOM Readback had already proven the candidate DOM/mobile contract, but then attempted a visual baseline against the known-broken base for a non-visual state/store/workflow-only change.

## Proven fix

- The browser-safe canonical BusinessInput store now lives under `portal-v2/business-input-store.js`.
- `portal-next/portal-business-input-store.js` is compatibility-only.
- A regression test prevents Portal V2 browser code from importing through the retired `/portal-next/*` boundary.
- Business OS preview verification now validates the retired-route redirect plus canonical V2 assets and no longer installs/runs a duplicate Playwright/Chromium browser suite.
- Portal V2 production readback still requires full DOM/mobile verification. Visual-baseline work is skipped only through an explicit fail-safe allowlist for non-visual changes; unknown/UI/CSS/HTML/module changes remain visual-impact by default.
- No runtime, release, identity or quality gate was weakened.

## Exact evidence

Candidate exact-head gates:
- Required test: run `35278619562` — success
- BRAIN delivery: run `35278619633` — success
- Portal V2 Live Preview: run `35278619256` — success
- Portal V2 Production DOM Readback: run `35278619257` — success
- Business OS Live Preview: run `35278619323` — success
- Powerhouse CodeQL: run `35278619333` — success

Production/main proof:
- protected merge SHA: `6b15ba6c1aa865c4a40e99ce6ae0f54ded1f0701`
- Production Release Readback: run `35279260171` — success
- Portal V2 Production DOM Readback on main: run `35279260078` — success
- live route readback, mobile hydration, exact release marker and deploy identity all passed.

## Root causes

### 1. Browser module crossed a retired redirect route

Fingerprint: `portal-v2-cross-retired-route-module-import-v1`

A browser import path was valid in the repository but invalid in the deployed routing contract. Static/unit checks alone could not prove browser module resolution.

### 2. Verification contract drifted behind product routing

Fingerprint: `portal-ci-stale-retired-route-and-visual-oracle-v1`

The verification system still treated a retired route as an executable product asset and used a visual baseline in a context where full non-visual DOM/mobile verification was the relevant contract.

## Permanent prevention rules

1. **BROWSER_IMPORT_MUST_NOT_CROSS_A_ROUTE_THAT_IS_CANONICALLY_REDIRECTED_OR_RETIRED.**
   Before adding a browser import, compare the final deployed URL with redirect/rewrite/retirement rules.

2. **RETIRED_ROUTE_VERIFICATION_MUST_VALIDATE_REDIRECT_PLUS_CANONICAL_SURFACE.**
   Never download redirect text and execute it as if the retired asset were still the live product contract.

3. **ONE_BROWSER_SUITE_PER_PRODUCT_SURFACE_WHERE_POSSIBLE.**
   Do not add a second Playwright/Chromium suite for the same contract when an existing canonical suite already proves it.

4. **CI_FAILURES_MUST_BE_CLASSIFIED_PRODUCT_VS_ORACLE_BEFORE_PRODUCT_CHANGES.**
   If product assertions already pass and failure occurs in a later test-oracle step, inspect the oracle first. Do not mutate product code to satisfy stale verification assumptions.

5. **VISUAL_IMPACT_CLASSIFICATION_FAILS_CLOSED.**
   Only explicitly enumerated non-visual state/store/workflow-only changes may skip visual-baseline work. Any unknown, UI, CSS, HTML or browser-module change remains visual-impact by default.

6. **EXACT_HEAD_EVIDENCE_ONLY.**
   Every change creates a new candidate head and invalidates previous completion claims.

7. **PROTECTED_MERGE_WITH_EXPECTED_HEAD_ONLY.**

8. **MAIN_SHA + PRODUCTION_RELEASE_READBACK + PRODUCT_DOM_READBACK ARE REQUIRED BEFORE LIVE & BEWEZEN.**

## Reusable recovery sequence

1. Re-read current PR head, main and mergeability.
2. Read the first failing browser/import/runtime assertion, not only the aggregate workflow result.
3. Compare browser import URLs with deployment redirect rules.
4. Separate product failure from stale CI/test-oracle failure.
5. Repair only the proven root cause on the same canonical lineage.
6. Add a regression test at the failed boundary.
7. Remove duplicate verification work when the same contract is already proven elsewhere.
8. Re-run all required gates on the exact new head.
9. Protected merge with expected-head identity.
10. Read back exact main SHA, release/deploy identity and production DOM/mobile behavior.
11. Write the learning idempotently to Powerhouse and read it back before closure.

## Canonical Powerhouse writeback

Supabase contains:
- Learning: `learning:pr-1974-portal-business-input-boundary-v1`
- Failure: `portal-v2-cross-retired-route-module-import-v1`
- Failure: `portal-ci-stale-retired-route-and-visual-oracle-v1`
- Runtime event: `learning-writeback:pr-1974-portal-business-input-boundary-v1`

The learning is `LEARNED`, `verified=true`; both failure fingerprints are `PROVEN` with `LIVE_VERIFIED` evidence; the runtime event is `actioned` with `VERIFIED` data quality.

## Reuse instruction

Future agents/chats must reuse this learning rather than rediscover or rebuild it. Portal V2 owns the browser-safe BusinessInput implementation. A future red browser gate on this surface must first be checked against deployed routing and current verification-oracle validity before any product change is attempted.
