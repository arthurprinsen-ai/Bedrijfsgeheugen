# Exact Portal DOM acceptance after independent Edge bridge update — 19 October 2026

Obligation-ID: `portal-dom-bridge-only-immutable-readback-20261019`
Fingerprint: `delivery|portal-dom|release-exact-sha|bridge-only-successor|20261019`
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Reproduced scope
Canonical site release `1ede6008da2f265941097487b21cbb1f8c334326` is live on Netlify immutable deploy `6ad5eece12a6f9cf157bdcf7`, and the exact-source production GitHub Action https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39236161688 passed its real Chromium pricing/language checks. Protected main `bcb936d9fb0c42602e2a00d158668e362446bae9` is one commit later, touching only Supabase deploy bridge, its tests, docs and learning. The production Supabase Edge bridge v180 is byte-equal to the GitHub current main source, independently verified via the connected Supabase provider. The Portal manual readback gate originally accepted only CI and evidence files, and refused the separately deployed bridge, preventing revalidation of the actual Portal DOM after feature PR #4452.

## Narrow change
In the existing `portal-v2-production-dom-readback.yml`, extend the allowlist with **exactly** `supabase/functions/netlify-deploy-bridge/index.ts`. Do not allow `supabase/functions/*` or other site/runtime changes. Keep main-only manual workflow, approved merged PR ancestry, released SHA check, immutable deploy ID check, real Chromium route tests and portal tenant controls. Add a test to forbid broad allowlists.

## Exact acceptance after protected merge
Run `node --test tests/brain-portal-dom-proven-bridge-only-v1.test.mjs`, Required CI and CodeQL on the same head, then protected merge. Dispatch `Portal V2 Production DOM Readback` on `main` with `approved_pr_number=4452` and `production_sha=1ede6008da2f265941097487b21cbb1f8c334326`; the workflow must read the live and immutable Netlify deploy and execute the actual browser test suite. A source-only green CI is not browser acceptance.
